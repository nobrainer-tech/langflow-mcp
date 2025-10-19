import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ZodError } from 'zod';
import { langflowMCPTools } from './tools';
import { logger } from '../utils/logger';
import { LangflowClient } from '../services/langflow-client';
import { LangflowConfig } from '../types';
import {
  CreateFlowSchema,
  ListFlowsSchema,
  GetFlowSchema,
  UpdateFlowSchema,
  DeleteFlowSchema,
  DeleteFlowsSchema,
  ListComponentsSchema,
  RunFlowSchema,
  TriggerWebhookSchema,
  UploadFlowSchema,
  DownloadFlowsSchema,
  GetBasicExamplesSchema,
  ListFoldersSchema,
  CreateFolderSchema,
  GetFolderSchema,
  UpdateFolderSchema,
  DeleteFolderSchema,
  ListProjectsSchema,
  CreateProjectSchema,
  GetProjectSchema,
  UpdateProjectSchema,
  DeleteProjectSchema,
  UploadProjectSchema,
  DownloadProjectSchema,
  ListVariablesSchema,
  CreateVariableSchema,
  UpdateVariableSchema,
  DeleteVariableSchema,
  BuildFlowSchema,
  GetBuildStatusSchema,
  CancelBuildSchema,
  ListKnowledgeBasesSchema,
  GetKnowledgeBaseSchema,
  DeleteKnowledgeBaseSchema,
  BulkDeleteKnowledgeBasesSchema,
  UploadFileSchema,
  DownloadFileSchema,
  ListFilesSchema,
  DeleteFileSchema,
  GetFileImageSchema,
  ListProfilePicturesSchema,
  GetProfilePictureSchema,
  ValidateCodeSchema,
  ValidatePromptSchema,
  CheckStoreSchema,
  CheckStoreApiKeySchema,
  ListStoreComponentsSchema,
  GetStoreComponentSchema,
  ListStoreTagsSchema,
  GetUserLikesSchema,
  RunFlowAdvancedSchema,
  ProcessFlowSchema,
  PredictFlowSchema,
  GetMonitorBuildsSchema,
  GetMonitorMessagesSchema,
  GetMonitorMessageSchema,
  GetMonitorSessionsSchema,
  GetMonitorSessionMessagesSchema,
  MigrateMonitorSessionSchema,
  GetMonitorTransactionsSchema,
  DeleteMonitorBuildsSchema,
  DeleteMonitorMessagesSchema,
  BuildVerticesSchema,
  GetVertexSchema,
  StreamVertexBuildSchema,
  GetVersionSchema,
  ListUsersSchema,
  GetCurrentUserSchema,
  GetUserSchema,
  UpdateUserSchema,
  ResetUserPasswordSchema,
  ListApiKeysSchema,
  CreateApiKeySchema,
  DeleteApiKeySchema,
  ListCustomComponentsSchema,
  CreateCustomComponentSchema,
  LoginSchema,
  AutoLoginSchema,
  RefreshTokenSchema,
  LogoutSchema,
  GetPublicFlowSchema,
  BatchCreateFlowsSchema,
  GetTaskStatusSchema,
  DownloadFolderSchema,
  UploadFolderSchema,
  ListStarterProjectsSchema,
  UploadKnowledgeBaseSchema,
  ListElevenLabsVoicesSchema,
  GetLogsSchema
} from './validation';

export class LangflowMCPServer {
  private server: Server;
  private client: LangflowClient | null = null;

  constructor() {
    const baseUrl = process.env.LANGFLOW_BASE_URL;
    const apiKey = process.env.LANGFLOW_API_KEY;

    if (!baseUrl || !apiKey) {
      throw new Error('LANGFLOW_BASE_URL and LANGFLOW_API_KEY must be set in environment');
    }

    const DEFAULT_TIMEOUT = 30000;
    const MIN_TIMEOUT = 1000;
    const MAX_TIMEOUT = 300000;

    const timeoutStr = process.env.LANGFLOW_TIMEOUT || String(DEFAULT_TIMEOUT);
    let timeout = parseInt(timeoutStr, 10);

    if (isNaN(timeout) || timeout < MIN_TIMEOUT || timeout > MAX_TIMEOUT) {
      logger.warn(`Invalid LANGFLOW_TIMEOUT: ${timeoutStr}, using default: ${DEFAULT_TIMEOUT}`);
      timeout = DEFAULT_TIMEOUT;
    }

    const config: LangflowConfig = {
      baseUrl,
      apiKey,
      timeout
    };

    this.client = new LangflowClient(config);

    logger.info('Initializing Langflow MCP server');

    // Use require for reliable package.json access across environments
    let serverVersion = '1.2.0';
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pkg = require('../../package.json');
      serverVersion = pkg.version ?? serverVersion;
    } catch (e) {
      logger.warn('package.json not readable; using hardcoded version 1.2.0', e);
    }

    this.server = new Server(
      {
        name: 'langflow-mcp',
        version: serverVersion,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private formatSuccessResponse(data: any): any {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }

  private sanitizeSensitiveData(args: Record<string, unknown>): Record<string, unknown> {
    const sensitiveFields = ['password', 'new_password', 'api_key', 'token'];
    const sanitized = { ...args };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  private validateFileSize(fileContent: string, maxSizeBytes: number = 10 * 1024 * 1024): Buffer {
    const fileBuffer = Buffer.from(fileContent, 'base64');

    if (fileBuffer.length > maxSizeBytes) {
      throw new Error(
        `File size ${fileBuffer.length} bytes exceeds maximum allowed size of ${maxSizeBytes} bytes (10MB)`
      );
    }

    return fileBuffer;
  }

  private validateTextSize(content: string, maxSizeBytes: number = 10 * 1024 * 1024): void {
    const size = Buffer.byteLength(content, 'utf8');
    if (size > maxSizeBytes) {
      const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} bytes`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
      };
      throw new Error(
        `Content size ${formatSize(size)} exceeds maximum allowed size of ${formatSize(maxSizeBytes)}`
      );
    }
  }

  private formatErrorResponse(error: unknown, toolName: string, args?: Record<string, unknown>): any {
    const sanitized = args ? this.sanitizeSensitiveData(args) : undefined;
    logger.error(`Error executing tool ${toolName}:`, { args: sanitized, error });

    let errorMessage: string;
    let errorDetails: Record<string, any> = {};

    if (error instanceof ZodError) {
      errorMessage = 'Validation error';
      errorDetails = {
        issues: error.issues.map((issue) => ({
          path: Array.isArray(issue.path) ? issue.path.join('.') : '',
          message: issue.message
        }))
      };
    } else if (error instanceof Error) {
      errorMessage = error.message;
      if (error.stack) {
        const maxStackLines = process.env.NODE_ENV === 'production' ? 3 : undefined;
        const stackLines = error.stack.split('\n');
        errorDetails.stack = maxStackLines ? stackLines.slice(0, maxStackLines) : stackLines;
      }
    } else {
      errorMessage = 'Unknown error';
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: true,
            message: errorMessage,
            tool: toolName,
            timestamp: new Date().toISOString(),
            ...errorDetails
          }, null, 2)
        }
      ],
      isError: true
    };
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: langflowMCPTools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (!this.client) {
        throw new Error('Langflow client not initialized');
      }

      const { name, arguments: rawArgs } = request.params;
      const args = (rawArgs ?? {}) as Record<string, unknown>;

      try {
        switch (name) {
          case 'create_flow': {
            const validated = CreateFlowSchema.parse(args);
            const created = await this.client.createFlow(validated);
            return this.formatSuccessResponse(created);
          }

          case 'list_flows': {
            const validated = ListFlowsSchema.parse(args);
            const flows = await this.client.listFlows(validated);
            return this.formatSuccessResponse(flows);
          }

          case 'get_flow': {
            const validated = GetFlowSchema.parse(args);
            const flow = await this.client.getFlow(validated.flow_id);
            return this.formatSuccessResponse(flow);
          }

          case 'update_flow': {
            const validated = UpdateFlowSchema.parse(args);
            const { flow_id, ...updates } = validated;
            const updated = await this.client.updateFlow(flow_id, updates);
            return this.formatSuccessResponse(updated);
          }

          case 'delete_flow': {
            const validated = DeleteFlowSchema.parse(args);
            await this.client.deleteFlow(validated.flow_id);
            return this.formatSuccessResponse({
              success: true,
              message: 'Flow deleted successfully'
            });
          }

          case 'delete_flows': {
            const validated = DeleteFlowsSchema.parse(args);
            const result = await this.client.deleteFlows(validated.flow_ids);
            return this.formatSuccessResponse(result);
          }

          case 'list_components': {
            ListComponentsSchema.parse(args);
            const components = await this.client.listComponents();
            return this.formatSuccessResponse(components);
          }

          case 'run_flow': {
            const validated = RunFlowSchema.parse(args);
            const result = await this.client.runFlow(
              validated.flow_id_or_name,
              validated.input_request,
              validated.stream
            );
            return this.formatSuccessResponse(result);
          }

          case 'trigger_webhook': {
            const validated = TriggerWebhookSchema.parse(args);
            const result = await this.client.triggerWebhook(
              validated.flow_id_or_name,
              validated.input_request
            );
            return this.formatSuccessResponse(result);
          }

          case 'upload_flow': {
            const validated = UploadFlowSchema.parse(args);
            const flow = await this.client.uploadFlow(validated.file);
            return this.formatSuccessResponse(flow);
          }

          case 'download_flows': {
            const validated = DownloadFlowsSchema.parse(args);
            const result = await this.client.downloadFlows(validated.flow_ids);
            return this.formatSuccessResponse(result);
          }

          case 'get_basic_examples': {
            GetBasicExamplesSchema.parse(args);
            const examples = await this.client.getBasicExamples();
            return this.formatSuccessResponse(examples);
          }

          case 'list_folders': {
            const validated = ListFoldersSchema.parse(args);
            const folders = await this.client.listFolders(validated);
            return this.formatSuccessResponse(folders);
          }

          case 'create_folder': {
            const validated = CreateFolderSchema.parse(args);
            const folder = await this.client.createFolder(validated);
            return this.formatSuccessResponse(folder);
          }

          case 'get_folder': {
            const validated = GetFolderSchema.parse(args);
            const folder = await this.client.getFolder(validated.folder_id);
            return this.formatSuccessResponse(folder);
          }

          case 'update_folder': {
            const validated = UpdateFolderSchema.parse(args);
            const { folder_id, ...updates } = validated;
            const updated = await this.client.updateFolder(folder_id, updates);
            return this.formatSuccessResponse(updated);
          }

          case 'delete_folder': {
            const validated = DeleteFolderSchema.parse(args);
            await this.client.deleteFolder(validated.folder_id);
            return this.formatSuccessResponse({
              success: true,
              message: 'Folder deleted successfully'
            });
          }

          case 'list_projects': {
            const validated = ListProjectsSchema.parse(args);
            const projects = await this.client.listProjects(validated);
            return this.formatSuccessResponse(projects);
          }

          case 'create_project': {
            const validated = CreateProjectSchema.parse(args);
            const project = await this.client.createProject(validated);
            return this.formatSuccessResponse(project);
          }

          case 'get_project': {
            const validated = GetProjectSchema.parse(args);
            const project = await this.client.getProject(validated.project_id);
            return this.formatSuccessResponse(project);
          }

          case 'update_project': {
            const validated = UpdateProjectSchema.parse(args);
            const { project_id, ...updates } = validated;
            const updated = await this.client.updateProject(project_id, updates);
            return this.formatSuccessResponse(updated);
          }

          case 'delete_project': {
            const validated = DeleteProjectSchema.parse(args);
            await this.client.deleteProject(validated.project_id);
            return this.formatSuccessResponse({
              success: true,
              message: 'Project deleted successfully'
            });
          }

          case 'upload_project': {
            const validated = UploadProjectSchema.parse(args);
            const project = await this.client.uploadProject(validated.file);
            return this.formatSuccessResponse(project);
          }

          case 'download_project': {
            const validated = DownloadProjectSchema.parse(args);
            const result = await this.client.downloadProject(validated.project_id);
            return this.formatSuccessResponse(result);
          }

          case 'list_variables': {
            ListVariablesSchema.parse(args);
            const variables = await this.client.listVariables();
            return this.formatSuccessResponse(variables);
          }

          case 'create_variable': {
            const validated = CreateVariableSchema.parse(args);
            const variable = await this.client.createVariable(validated);
            return this.formatSuccessResponse(variable);
          }

          case 'update_variable': {
            const validated = UpdateVariableSchema.parse(args);
            const { variable_id, ...updates } = validated;
            const updated = await this.client.updateVariable(variable_id, updates);
            return this.formatSuccessResponse(updated);
          }

          case 'delete_variable': {
            const validated = DeleteVariableSchema.parse(args);
            await this.client.deleteVariable(validated.variable_id);
            return this.formatSuccessResponse({
              success: true,
              message: 'Variable deleted successfully'
            });
          }

          case 'build_flow': {
            const validated = BuildFlowSchema.parse(args);
            const { flow_id, inputs, data, files, ...params } = validated;
            const result = await this.client.buildFlow(
              flow_id,
              { inputs, data, files },
              params
            );
            return this.formatSuccessResponse(result);
          }

          case 'get_build_status': {
            const validated = GetBuildStatusSchema.parse(args);
            const result = await this.client.getBuildStatus(
              validated.job_id,
              validated.event_delivery
            );
            return this.formatSuccessResponse(result);
          }

          case 'cancel_build': {
            const validated = CancelBuildSchema.parse(args);
            const result = await this.client.cancelBuild(validated.job_id);
            return this.formatSuccessResponse(result);
          }

          case 'list_knowledge_bases': {
            ListKnowledgeBasesSchema.parse(args);
            const knowledgeBases = await this.client.listKnowledgeBases();
            return this.formatSuccessResponse(knowledgeBases);
          }

          case 'get_knowledge_base': {
            const validated = GetKnowledgeBaseSchema.parse(args);
            const knowledgeBase = await this.client.getKnowledgeBase(validated.kb_name);
            return this.formatSuccessResponse(knowledgeBase);
          }

          case 'delete_knowledge_base': {
            const validated = DeleteKnowledgeBaseSchema.parse(args);
            await this.client.deleteKnowledgeBase(validated.kb_name);
            return this.formatSuccessResponse({
              success: true,
              message: 'Knowledge base deleted successfully'
            });
          }

          case 'bulk_delete_knowledge_bases': {
            const validated = BulkDeleteKnowledgeBasesSchema.parse(args);
            const result = await this.client.bulkDeleteKnowledgeBases(validated.kb_names);
            return this.formatSuccessResponse(result);
          }

          case 'upload_file': {
            const validated = UploadFileSchema.parse(args);
            const fileBuffer = this.validateFileSize(validated.file_content);
            const result = await this.client.uploadFile(
              validated.flow_id,
              fileBuffer,
              validated.file_name
            );
            return this.formatSuccessResponse(result);
          }

          case 'download_file': {
            const validated = DownloadFileSchema.parse(args);
            const fileData = await this.client.downloadFile(
              validated.flow_id,
              validated.file_name
            );
            const base64Data = Buffer.from(fileData).toString('base64');
            return this.formatSuccessResponse({
              file_name: validated.file_name,
              content: base64Data
            });
          }

          case 'list_files': {
            const validated = ListFilesSchema.parse(args);
            const files = await this.client.listFiles(validated.flow_id);
            return this.formatSuccessResponse(files);
          }

          case 'delete_file': {
            const validated = DeleteFileSchema.parse(args);
            await this.client.deleteFile(validated.flow_id, validated.file_name);
            return this.formatSuccessResponse({
              success: true,
              message: 'File deleted successfully'
            });
          }

          case 'get_file_image': {
            const validated = GetFileImageSchema.parse(args);
            const imageData = await this.client.getFileImage(
              validated.flow_id,
              validated.file_name
            );
            const base64Data = Buffer.from(imageData).toString('base64');
            return this.formatSuccessResponse({
              file_name: validated.file_name,
              content: base64Data
            });
          }

          case 'list_profile_pictures': {
            ListProfilePicturesSchema.parse(args);
            const pictures = await this.client.listProfilePictures();
            return this.formatSuccessResponse(pictures);
          }

          case 'get_profile_picture': {
            const validated = GetProfilePictureSchema.parse(args);
            const pictureData = await this.client.getProfilePicture(
              validated.folder_name,
              validated.file_name
            );
            const base64Data = Buffer.from(pictureData).toString('base64');
            return this.formatSuccessResponse({
              file_name: validated.file_name,
              content: base64Data
            });
          }

          case 'validate_code': {
            const validated = ValidateCodeSchema.parse(args);
            const result = await this.client.validateCode(validated.code);
            return this.formatSuccessResponse(result);
          }

          case 'validate_prompt': {
            const validated = ValidatePromptSchema.parse(args);
            const result = await this.client.validatePrompt(validated.prompt);
            return this.formatSuccessResponse(result);
          }

          case 'check_store': {
            CheckStoreSchema.parse(args);
            const result = await this.client.checkStore();
            return this.formatSuccessResponse(result);
          }

          case 'check_store_api_key': {
            const validated = CheckStoreApiKeySchema.parse(args);
            const result = await this.client.checkStoreApiKey(validated.api_key);
            return this.formatSuccessResponse(result);
          }

          case 'list_store_components': {
            const validated = ListStoreComponentsSchema.parse(args);
            const components = await this.client.listStoreComponents(validated);
            return this.formatSuccessResponse(components);
          }

          case 'get_store_component': {
            const validated = GetStoreComponentSchema.parse(args);
            const component = await this.client.getStoreComponent(validated.component_id);
            return this.formatSuccessResponse(component);
          }

          case 'list_store_tags': {
            ListStoreTagsSchema.parse(args);
            const tags = await this.client.listStoreTags();
            return this.formatSuccessResponse(tags);
          }

          case 'get_user_likes': {
            GetUserLikesSchema.parse(args);
            const likes = await this.client.getUserLikes();
            return this.formatSuccessResponse(likes);
          }

          case 'run_flow_advanced': {
            const validated = RunFlowAdvancedSchema.parse(args);
            const { flow_id, stream, ...request } = validated;
            const result = await this.client.runFlowAdvanced(flow_id, request, stream);
            return this.formatSuccessResponse(result);
          }

          case 'process_flow': {
            const validated = ProcessFlowSchema.parse(args);
            const { flow_id, ...request } = validated;
            const result = await this.client.processFlow(flow_id, request);
            return this.formatSuccessResponse(result);
          }

          case 'predict_flow': {
            const validated = PredictFlowSchema.parse(args);
            const { flow_id, ...request } = validated;
            const result = await this.client.predictFlow(flow_id, request);
            return this.formatSuccessResponse(result);
          }

          case 'get_monitor_builds': {
            const validated = GetMonitorBuildsSchema.parse(args);
            const result = await this.client.getMonitorBuilds(validated);
            return this.formatSuccessResponse(result);
          }

          case 'get_monitor_messages': {
            const validated = GetMonitorMessagesSchema.parse(args);
            const result = await this.client.getMonitorMessages(validated);
            return this.formatSuccessResponse(result);
          }

          case 'get_monitor_message': {
            const validated = GetMonitorMessageSchema.parse(args);
            const result = await this.client.getMonitorMessage(validated.message_id);
            return this.formatSuccessResponse(result);
          }

          case 'get_monitor_sessions': {
            const validated = GetMonitorSessionsSchema.parse(args);
            const result = await this.client.getMonitorSessions(validated);
            return this.formatSuccessResponse(result);
          }

          case 'get_monitor_session_messages': {
            const validated = GetMonitorSessionMessagesSchema.parse(args);
            const result = await this.client.getMonitorSessionMessages(validated.session_id);
            return this.formatSuccessResponse(result);
          }

          case 'migrate_monitor_session': {
            const validated = MigrateMonitorSessionSchema.parse(args);
            const result = await this.client.migrateMonitorSession(validated);
            return this.formatSuccessResponse(result);
          }

          case 'get_monitor_transactions': {
            const validated = GetMonitorTransactionsSchema.parse(args);
            const result = await this.client.getMonitorTransactions(validated);
            return this.formatSuccessResponse(result);
          }

          case 'delete_monitor_builds': {
            const validated = DeleteMonitorBuildsSchema.parse(args);
            await this.client.deleteMonitorBuilds(validated.flow_id);
            return this.formatSuccessResponse({
              success: true,
              message: 'Monitor builds deleted successfully'
            });
          }

          case 'delete_monitor_messages': {
            const validated = DeleteMonitorMessagesSchema.parse(args);
            await this.client.deleteMonitorMessages(validated.message_ids);
            return this.formatSuccessResponse({
              success: true,
              message: 'Monitor messages deleted successfully'
            });
          }

          case 'build_vertices': {
            const validated = BuildVerticesSchema.parse(args);
            const { flow_id, ...request } = validated;
            const result = await this.client.buildVertices(flow_id, request);
            return this.formatSuccessResponse(result);
          }

          case 'get_vertex': {
            const validated = GetVertexSchema.parse(args);
            const result = await this.client.getVertex(validated);
            return this.formatSuccessResponse(result);
          }

          case 'stream_vertex_build': {
            const validated = StreamVertexBuildSchema.parse(args);
            const result = await this.client.streamVertexBuild(validated);
            return this.formatSuccessResponse(result);
          }

          case 'get_version': {
            GetVersionSchema.parse(args);
            const result = await this.client.getVersion();
            return this.formatSuccessResponse(result);
          }

          case 'list_users': {
            const validated = ListUsersSchema.parse(args);
            const result = await this.client.listUsers(validated);
            return this.formatSuccessResponse(result);
          }

          case 'get_current_user': {
            GetCurrentUserSchema.parse(args);
            const result = await this.client.getCurrentUser();
            return this.formatSuccessResponse(result);
          }

          case 'get_user': {
            const validated = GetUserSchema.parse(args);
            const result = await this.client.getUser(validated.user_id);
            return this.formatSuccessResponse(result);
          }

          case 'update_user': {
            const validated = UpdateUserSchema.parse(args);
            const { user_id, ...updates } = validated;
            const result = await this.client.updateUser(user_id, updates);
            return this.formatSuccessResponse(result);
          }

          case 'reset_user_password': {
            const validated = ResetUserPasswordSchema.parse(args);
            const result = await this.client.resetUserPassword(validated.user_id, validated.new_password);
            return this.formatSuccessResponse(result);
          }

          case 'list_api_keys': {
            ListApiKeysSchema.parse(args);
            const result = await this.client.listApiKeys();
            return this.formatSuccessResponse(result);
          }

          case 'create_api_key': {
            const validated = CreateApiKeySchema.parse(args);
            const result = await this.client.createApiKey(validated.name);
            return this.formatSuccessResponse({
              ...result,
              security_warning: 'IMPORTANT: Store this API key securely. It cannot be retrieved later and will only be shown once.'
            });
          }

          case 'delete_api_key': {
            const validated = DeleteApiKeySchema.parse(args);
            await this.client.deleteApiKey(validated.api_key_id);
            return this.formatSuccessResponse({ success: true, message: 'API key deleted successfully' });
          }

          case 'list_custom_components': {
            ListCustomComponentsSchema.parse(args);
            const result = await this.client.listCustomComponents();
            return this.formatSuccessResponse(result);
          }

          case 'create_custom_component': {
            const validated = CreateCustomComponentSchema.parse(args);
            const result = await this.client.createCustomComponent(validated);
            return this.formatSuccessResponse(result);
          }

          case 'login': {
            const validated = LoginSchema.parse(args);
            const result = await this.client.login(validated.username, validated.password);
            return this.formatSuccessResponse(result);
          }

          case 'auto_login': {
            AutoLoginSchema.parse(args);
            const result = await this.client.autoLogin();
            return this.formatSuccessResponse(result);
          }

          case 'refresh_token': {
            RefreshTokenSchema.parse(args);
            const result = await this.client.refreshToken();
            return this.formatSuccessResponse(result);
          }

          case 'logout': {
            LogoutSchema.parse(args);
            const result = await this.client.logout();
            return this.formatSuccessResponse(result);
          }

          case 'get_public_flow': {
            const validated = GetPublicFlowSchema.parse(args);
            const result = await this.client.getPublicFlow(validated.flow_id);
            return this.formatSuccessResponse(result);
          }

          case 'batch_create_flows': {
            const validated = BatchCreateFlowsSchema.parse(args);
            const result = await this.client.batchCreateFlows(validated.flows);
            return this.formatSuccessResponse(result);
          }

          case 'get_task_status': {
            const validated = GetTaskStatusSchema.parse(args);
            const result = await this.client.getTaskStatus(validated.task_id);
            return this.formatSuccessResponse(result);
          }

          case 'download_folder': {
            const validated = DownloadFolderSchema.parse(args);
            const result = await this.client.downloadFolder(validated.folder_id);
            const base64Data = Buffer.from(result).toString('base64');
            return this.formatSuccessResponse({ data: base64Data, encoding: 'base64' });
          }

          case 'upload_folder': {
            const validated = UploadFolderSchema.parse(args);
            const fileBuffer = this.validateFileSize(validated.file_content);
            const result = await this.client.uploadFolder(fileBuffer, validated.file_name);
            return this.formatSuccessResponse(result);
          }

          case 'list_starter_projects': {
            ListStarterProjectsSchema.parse(args);
            const result = await this.client.listStarterProjects();
            return this.formatSuccessResponse(result);
          }

          case 'upload_knowledge_base': {
            const validated = UploadKnowledgeBaseSchema.parse(args);
            const fileBuffer = this.validateFileSize(validated.file_content);
            const result = await this.client.uploadKnowledgeBase(validated.kb_name, fileBuffer, validated.file_name);
            return this.formatSuccessResponse(result);
          }

          case 'list_elevenlabs_voices': {
            ListElevenLabsVoicesSchema.parse(args);
            const result = await this.client.listElevenLabsVoices();
            return this.formatSuccessResponse(result);
          }

          case 'health_check': {
            const result = await this.client.healthCheck();
            return this.formatSuccessResponse({ status: result ? 'healthy' : 'unhealthy', healthy: result });
          }

          case 'get_logs': {
            const validated = GetLogsSchema.parse(args);
            const result = await this.client.getLogs(validated.stream);
            return this.formatSuccessResponse(result);
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return this.formatErrorResponse(error, name, args);
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('Langflow MCP server running on stdio');
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Langflow MCP server');
    await this.server.close();
  }
}
