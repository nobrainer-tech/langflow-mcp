import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ZodError } from 'zod';
import { langflowMCPTools } from './tools';
import { logger } from '../utils/logger';
import { LangflowClient } from '../services/langflow-client';
import { LangflowConfig } from '../types';
import { langflowPrompts, getPromptMessages } from './prompts';
import { langflowResources, getResourceContent } from './resources';
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
  RunFlowSessionSchema,
  GetRegistrationSchema,
  RegisterUserSchema,
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
  StreamVertexBuildSchema,
  GetVersionSchema,
  ListUsersSchema,
  GetCurrentUserSchema,
  UpdateUserSchema,
  ResetUserPasswordSchema,
  ListApiKeysSchema,
  CreateApiKeySchema,
  DeleteApiKeySchema,
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
  GetLogsSchema,
  ReplaceFlowSchema,
  ExpandFlowsSchema,
  GetFlowEventsSchema,
  CreateFlowEventSchema,
  ListFlowVersionsSchema,
  CreateFlowVersionSchema,
  GetFlowVersionSchema,
  DeleteFlowVersionSchema,
  ActivateFlowVersionSchema,
  DetectVariablesSchema,
  SaveStoreApiKeySchema,
  UpdateCustomComponentSchema,
  CreateStoreComponentSchema,
  LikeStoreComponentSchema,
  CreateResponseSchema,
  GetSessionSchema,
  CreateUserSchema,
  GetWebhookEventsSchema,
  GetHealthCheckSchema,
  ListFilesV2Schema,
  UploadFileV2Schema,
  GetFileV2Schema,
  RenameFileV2Schema,
  DeleteFileV2Schema,
  DeleteAllFilesV2Schema,
  BatchDownloadFilesV2Schema,
  BatchDeleteFilesV2Schema,
  ListKnowledgeBasesDetailedSchema,
  CreateKnowledgeBaseSchema,
  PreviewKnowledgeBaseChunksSchema,
  ListKnowledgeBaseChunksSchema,
  IngestKnowledgeBaseSchema,
  CancelKnowledgeBaseIngestSchema,
  UpdateMonitorMessageSchema,
  DeleteMonitorSessionMessagesSchema,
  DeleteMonitorSessionsSchema,
  GetSharedMessagesSchema,
  GetSharedSessionsSchema,
  UpdateSharedMessageSchema,
  MigrateSharedSessionSchema,
  DeleteSharedSessionSchema,
  ListTracesSchema,
  DeleteTracesSchema,
  GetTraceSchema,
  DeleteTraceSchema,
  ListModelsSchema,
  ListModelProvidersSchema,
  ListEnabledProvidersSchema,
  ListEnabledModelsSchema,
  SetEnabledModelsSchema,
  GetDefaultModelSchema,
  SetDefaultModelSchema,
  DeleteDefaultModelSchema,
  GetProviderVariableMappingSchema,
  ValidateModelProviderSchema,
  GetLanguageModelOptionsSchema,
  GetEmbeddingModelOptionsSchema,
  AgenticAssistSchema,
  AgenticCheckConfigSchema,
  AgenticExecuteSchema,
  GetWorkflowResultSchema,
  RunWorkflowSchema,
  StopWorkflowSchema,
  ListMcpServersSchema,
  GetMcpServerSchema,
  CreateMcpServerSchema,
  UpdateMcpServerSchema,
  DeleteMcpServerSchema,
  GetMcpProjectConfigSchema,
  UpdateMcpProjectConfigSchema,
  GetMcpProjectInstalledSchema,
  InstallMcpProjectSchema,
  GetMcpProjectComposerUrlSchema
} from './validation';

export class LangflowMCPServer {
  private server: Server;
  private client: LangflowClient | null = null;

  constructor() {
    const baseUrl = process.env.LANGFLOW_BASE_URL;
    const apiKey = process.env.LANGFLOW_API_KEY;

    if (baseUrl && apiKey) {
      // Validate URL format
      try {
        const url = new URL(baseUrl);
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error(`Invalid protocol: ${url.protocol}. Only http: and https: are allowed.`);
        }
      } catch (error) {
        if (error instanceof TypeError) {
          throw new Error(`Invalid LANGFLOW_BASE_URL format: ${baseUrl}`);
        }
        throw error;
      }

      // Basic API key validation
      if (apiKey.length < 10) {
        throw new Error('LANGFLOW_API_KEY appears to be invalid (too short)');
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
    } else {
      logger.warn('LANGFLOW_BASE_URL or LANGFLOW_API_KEY not set. Server will start but tools will return errors until configured.');
    }

    logger.info('Initializing Langflow MCP server');

    // Use require for reliable package.json access across environments
    let serverVersion = 'dev';
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pkg = require('../../package.json');
      serverVersion = pkg.version ?? serverVersion;
    } catch (e) {
      logger.warn('package.json not readable; using fallback version "dev"', e);
    }

    this.server = new Server(
      {
        name: 'langflow-mcp',
        version: serverVersion,
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
          resources: {},
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

  private sanitizeSensitiveData(
    args: Record<string, unknown>,
    depth = 0,
    seen = new WeakSet<object>()
  ): Record<string, unknown> {
    const MAX_DEPTH = 10;
    const SENSITIVE_KEYS = new Set([
      'password', 'new_password', 'api_key', 'token',
      'access_token', 'refresh_token', 'authorization',
      'x-api-key', 'x-store-api-key', 'set-cookie',
      'bearer', 'session', 'session_id', 'cookie',
      'private_key', 'secret', 'credentials', 'api-key',
      'file_content', 'file', 'content', 'payload', 'data'
    ]);

    // Prevent infinite recursion
    if (depth > MAX_DEPTH) {
      return { __error: 'max depth exceeded' } as Record<string, unknown>;
    }

    if (!args || typeof args !== 'object') {
      return args as Record<string, unknown>;
    }

    // Prevent circular references
    if (seen.has(args)) {
      return { __error: 'circular reference' } as Record<string, unknown>;
    }

    seen.add(args);
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(args)) {
      // Case-insensitive check for sensitive keys
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        sanitized[key] = '***REDACTED***';
      } else if (Array.isArray(value)) {
        // Handle arrays recursively
        sanitized[key] = value.map(item =>
          typeof item === 'object' && item !== null
            ? this.sanitizeSensitiveData(item as Record<string, unknown>, depth + 1, seen)
            : item
        );
      } else if (typeof value === 'object' && value !== null) {
        // Handle nested objects recursively
        sanitized[key] = this.sanitizeSensitiveData(
          value as Record<string, unknown>,
          depth + 1,
          seen
        );
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Formats error responses according to MCP specification.
   * Per MCP spec: Tool errors SHOULD be reported with isError: true,
   * not as MCP protocol-level errors, so the LLM can see and self-correct.
   */
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
      // Only include stack trace in non-production environments
      if (error.stack && process.env.NODE_ENV !== 'production') {
        const stackLines = error.stack.split('\n');
        errorDetails.stack = stackLines.slice(0, 5); // Limit to 5 lines
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

  private validateFileSize(fileContent: string, maxSizeBytes: number = 10 * 1024 * 1024): Buffer {
    // Validate base64 format first
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(fileContent)) {
      throw new Error('Invalid base64 format');
    }

    // Reject lossy base64: length must be a multiple of 4 and round-trip exactly
    if (
      fileContent.length % 4 !== 0 ||
      Buffer.from(fileContent, 'base64').toString('base64') !== fileContent
    ) {
      throw new Error('Invalid base64 format');
    }

    // Estimate decoded size BEFORE decoding (base64 is ~4/3 of original)
    const estimatedSize = (fileContent.length * 3) / 4;
    if (estimatedSize > maxSizeBytes) {
      throw new Error(
        `File size ${Math.round(estimatedSize)} bytes (estimated) exceeds maximum allowed size of ${maxSizeBytes} bytes (10MB)`
      );
    }

    // Now decode (safe because we checked size first)
    const fileBuffer = Buffer.from(fileContent, 'base64');

    // Verify actual size after decoding
    if (fileBuffer.length > maxSizeBytes) {
      throw new Error(
        `File size ${fileBuffer.length} bytes exceeds maximum allowed size of ${maxSizeBytes} bytes (10MB)`
      );
    }

    return fileBuffer;
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const deprecatedTools = ['build_vertices', 'get_vertex', 'stream_vertex_build', 'get_task_status'];
      const enableDeprecated = process.env.ENABLE_DEPRECATED_TOOLS !== 'false';

      const toolsToShow = enableDeprecated
        ? langflowMCPTools
        : langflowMCPTools.filter(tool => !deprecatedTools.includes(tool.name));

      return {
        tools: toolsToShow.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: langflowPrompts.map(p => ({
        name: p.name,
        description: p.description,
        arguments: p.arguments,
      })),
    }));

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: promptArgs } = request.params;
      const prompt = langflowPrompts.find(p => p.name === name);
      if (!prompt) {
        throw new Error(`Unknown prompt: ${name}`);
      }
      return {
        description: prompt.description,
        messages: getPromptMessages(name, (promptArgs ?? {}) as Record<string, string>),
      };
    });

    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: langflowResources.map(r => ({
        uri: r.uri,
        name: r.name,
        description: r.description,
        mimeType: r.mimeType,
      })),
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      const resource = langflowResources.find(r => r.uri === uri);
      if (!resource) {
        throw new Error(`Unknown resource: ${uri}`);
      }
      return {
        contents: [getResourceContent(uri)],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (!this.client) {
        throw new Error('Langflow client not initialized. Set LANGFLOW_BASE_URL and LANGFLOW_API_KEY environment variables.');
      }

      const { name, arguments: rawArgs } = request.params;

      // Validate args type before casting (security check)
      if (rawArgs !== undefined && rawArgs !== null) {
        if (typeof rawArgs !== 'object' || Array.isArray(rawArgs)) {
          throw new Error('Arguments must be an object');
        }
      }

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
            const { context: nestedContext, ...inputRequest } = validated.input_request;
            const result = await this.client.runFlow(
              validated.flow_id_or_name,
              inputRequest,
              validated.stream,
              validated.context ?? nestedContext
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
            const result = await this.client.uploadFile({
              flow_id: validated.flow_id,
              file: fileBuffer,
              file_name: validated.file_name
            });
            return this.formatSuccessResponse(result);
          }

          case 'download_file': {
            const validated = DownloadFileSchema.parse(args);
            const fileData = await this.client.downloadFile({
              flow_id: validated.flow_id,
              file_name: validated.file_name
            });

            // Validate fileData before base64 conversion
            if (!fileData || (fileData.byteLength ?? fileData.length) === 0) {
              throw new Error('No file data received from server');
            }

            const base64Data = Buffer.from(fileData).toString('base64');
            return this.formatSuccessResponse({
              file_name: validated.file_name,
              content: base64Data
            });
          }

          case 'list_files': {
            const validated = ListFilesSchema.parse(args);
            const files = await this.client.listFiles({ flow_id: validated.flow_id });
            return this.formatSuccessResponse(files);
          }

          case 'delete_file': {
            const validated = DeleteFileSchema.parse(args);
            const result = await this.client.deleteFile({
              flow_id: validated.flow_id,
              file_name: validated.file_name
            });
            return this.formatSuccessResponse(result);
          }

          case 'get_file_image': {
            const validated = GetFileImageSchema.parse(args);
            const imageData = await this.client.getFileImage({
              flow_id: validated.flow_id,
              file_name: validated.file_name
            });

            // Validate imageData before base64 conversion
            if (!imageData || (imageData.byteLength ?? imageData.length) === 0) {
              throw new Error('No image data received from server');
            }

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

            // Validate pictureData before base64 conversion
            if (!pictureData || (pictureData.byteLength ?? pictureData.length) === 0) {
              throw new Error('No picture data received from server');
            }

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
            const { flow_id_or_name, stream, user_id, ...request } = validated;
            const result = await this.client.runFlowAdvanced(flow_id_or_name, request, stream, user_id);
            return this.formatSuccessResponse(result);
          }

          case 'run_flow_session': {
            const validated = RunFlowSessionSchema.parse(args);
            const { flow_id_or_name, stream, ...request } = validated;
            const result = await this.client.runFlowSession(flow_id_or_name, request, stream);
            return this.formatSuccessResponse(result);
          }

          case 'get_registration': {
            GetRegistrationSchema.parse(args);
            const result = await this.client.getRegistration();
            return this.formatSuccessResponse(result);
          }

          case 'register_user': {
            const validated = RegisterUserSchema.parse(args);
            const result = await this.client.registerUser(validated.email);
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

            // Validate result before base64 conversion
            if (!result) {
              throw new Error('No folder data received from server');
            }

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

          // === Langflow 1.9.x tools ===

          case 'replace_flow': {
            const validated = ReplaceFlowSchema.parse(args);
            const { flow_id, ...body } = validated;
            const result = await this.client.replaceFlow(flow_id, body);
            return this.formatSuccessResponse(result);
          }

          case 'expand_flows': {
            const validated = ExpandFlowsSchema.parse(args);
            const result = await this.client.expandFlows(validated.body);
            return this.formatSuccessResponse(result);
          }

          case 'get_flow_events': {
            const validated = GetFlowEventsSchema.parse(args);
            const result = await this.client.getFlowEvents(
              validated.flow_id,
              validated.since !== undefined ? { since: validated.since } : undefined
            );
            return this.formatSuccessResponse(result);
          }

          case 'create_flow_event': {
            const validated = CreateFlowEventSchema.parse(args);
            const { flow_id, ...body } = validated;
            const result = await this.client.createFlowEvent(flow_id, body);
            return this.formatSuccessResponse(result);
          }

          case 'list_flow_versions': {
            const validated = ListFlowVersionsSchema.parse(args);
            const { flow_id, ...params } = validated;
            const result = await this.client.listFlowVersions(flow_id, params);
            return this.formatSuccessResponse(result);
          }

          case 'create_flow_version': {
            const validated = CreateFlowVersionSchema.parse(args);
            const result = await this.client.createFlowVersion(validated.flow_id, validated.body);
            return this.formatSuccessResponse(result);
          }

          case 'get_flow_version': {
            const validated = GetFlowVersionSchema.parse(args);
            const result = await this.client.getFlowVersion(validated.flow_id, validated.version_id);
            return this.formatSuccessResponse(result);
          }

          case 'delete_flow_version': {
            const validated = DeleteFlowVersionSchema.parse(args);
            await this.client.deleteFlowVersion(validated.flow_id, validated.version_id);
            return this.formatSuccessResponse({
              success: true,
              message: 'Flow version deleted successfully'
            });
          }

          case 'activate_flow_version': {
            const validated = ActivateFlowVersionSchema.parse(args);
            const result = await this.client.activateFlowVersion(
              validated.flow_id,
              validated.version_id,
              validated.save_draft !== undefined ? { save_draft: validated.save_draft } : undefined
            );
            return this.formatSuccessResponse(result);
          }

          case 'detect_variables': {
            const validated = DetectVariablesSchema.parse(args);
            const result = await this.client.detectVariables({ flow_version_ids: validated.flow_version_ids });
            return this.formatSuccessResponse(result);
          }

          case 'save_store_api_key': {
            const validated = SaveStoreApiKeySchema.parse(args);
            const result = await this.client.saveStoreApiKey(validated.api_key);
            return this.formatSuccessResponse(result);
          }

          case 'update_custom_component': {
            const validated = UpdateCustomComponentSchema.parse(args);
            const result = await this.client.updateCustomComponentCode(validated);
            return this.formatSuccessResponse(result);
          }

          case 'create_store_component': {
            const validated = CreateStoreComponentSchema.parse(args);
            const result = await this.client.createStoreComponent({
              description: null,
              tags: null,
              is_component: null,
              ...validated
            });
            return this.formatSuccessResponse(result);
          }

          case 'like_store_component': {
            const validated = LikeStoreComponentSchema.parse(args);
            const result = await this.client.likeStoreComponent(validated.component_id);
            return this.formatSuccessResponse(result);
          }

          case 'create_response': {
            const validated = CreateResponseSchema.parse(args);
            const result = await this.client.createResponse(validated);
            return this.formatSuccessResponse(result);
          }

          case 'get_session': {
            GetSessionSchema.parse(args);
            const result = await this.client.getSession();
            return this.formatSuccessResponse(result);
          }

          case 'create_user': {
            const validated = CreateUserSchema.parse(args);
            const result = await this.client.createUser(validated);
            return this.formatSuccessResponse(result);
          }

          case 'get_webhook_events': {
            const validated = GetWebhookEventsSchema.parse(args);
            const result = await this.client.getWebhookEvents(
              validated.flow_id_or_name,
              validated.user_id ? { user_id: validated.user_id } : undefined
            );
            return this.formatSuccessResponse(result);
          }

          case 'get_health_check': {
            GetHealthCheckSchema.parse(args);
            const result = await this.client.getHealthCheck();
            return this.formatSuccessResponse(result);
          }

          case 'list_files_v2': {
            ListFilesV2Schema.parse(args);
            const result = await this.client.listFilesV2();
            return this.formatSuccessResponse(result);
          }

          case 'upload_file_v2': {
            const validated = UploadFileV2Schema.parse(args);
            const fileBuffer = this.validateFileSize(validated.file_content);
            const params: { append?: boolean; ephemeral?: boolean } = {};
            if (validated.append !== undefined) params.append = validated.append;
            if (validated.ephemeral !== undefined) params.ephemeral = validated.ephemeral;
            const result = await this.client.uploadFileV2(fileBuffer, validated.file_name, params);
            return this.formatSuccessResponse(result);
          }

          case 'get_file_v2': {
            const validated = GetFileV2Schema.parse(args);
            const result = await this.client.getFileV2(
              validated.file_id,
              validated.return_content !== undefined ? { return_content: validated.return_content } : undefined
            );
            return this.formatSuccessResponse(result);
          }

          case 'rename_file_v2': {
            const validated = RenameFileV2Schema.parse(args);
            const result = await this.client.renameFileV2(validated.file_id, validated.name);
            return this.formatSuccessResponse(result);
          }

          case 'delete_file_v2': {
            const validated = DeleteFileV2Schema.parse(args);
            const result = await this.client.deleteFileV2(validated.file_id);
            return this.formatSuccessResponse(result);
          }

          case 'delete_all_files_v2': {
            DeleteAllFilesV2Schema.parse(args);
            const result = await this.client.deleteAllFilesV2();
            return this.formatSuccessResponse(result);
          }

          case 'batch_download_files_v2': {
            const validated = BatchDownloadFilesV2Schema.parse(args);
            const result = await this.client.batchDownloadFilesV2(validated.file_ids);
            return this.formatSuccessResponse(result);
          }

          case 'batch_delete_files_v2': {
            const validated = BatchDeleteFilesV2Schema.parse(args);
            const result = await this.client.batchDeleteFilesV2(validated.file_ids);
            return this.formatSuccessResponse(result);
          }

          case 'list_knowledge_bases_detailed': {
            ListKnowledgeBasesDetailedSchema.parse(args);
            const result = await this.client.listKnowledgeBasesDetailed();
            return this.formatSuccessResponse(result);
          }

          case 'create_knowledge_base': {
            const validated = CreateKnowledgeBaseSchema.parse(args);
            const result = await this.client.createKnowledgeBase(validated);
            return this.formatSuccessResponse(result);
          }

          case 'preview_knowledge_base_chunks': {
            const validated = PreviewKnowledgeBaseChunksSchema.parse(args);
            const fileBuffer = this.validateFileSize(validated.file_content);
            const result = await this.client.previewKnowledgeBaseChunks(
              [{ buffer: fileBuffer, filename: validated.file_name }],
              validated.params
            );
            return this.formatSuccessResponse(result);
          }

          case 'list_knowledge_base_chunks': {
            const validated = ListKnowledgeBaseChunksSchema.parse(args);
            const { kb_name, ...params } = validated;
            const result = await this.client.listKnowledgeBaseChunks(kb_name, params);
            return this.formatSuccessResponse(result);
          }

          case 'ingest_knowledge_base': {
            const validated = IngestKnowledgeBaseSchema.parse(args);
            const fileBuffer = this.validateFileSize(validated.file_content);
            const result = await this.client.ingestKnowledgeBase(
              validated.kb_name,
              [{ buffer: fileBuffer, filename: validated.file_name }],
              validated.params
            );
            return this.formatSuccessResponse(result);
          }

          case 'cancel_knowledge_base_ingest': {
            const validated = CancelKnowledgeBaseIngestSchema.parse(args);
            const result = await this.client.cancelKnowledgeBaseIngest(validated.kb_name);
            return this.formatSuccessResponse(result);
          }

          case 'update_monitor_message': {
            const validated = UpdateMonitorMessageSchema.parse(args);
            const { message_id, ...body } = validated;
            const result = await this.client.updateMonitorMessage(message_id, body);
            return this.formatSuccessResponse(result);
          }

          case 'delete_monitor_session_messages': {
            const validated = DeleteMonitorSessionMessagesSchema.parse(args);
            const result = await this.client.deleteMonitorSessionMessages(validated.session_id);
            return this.formatSuccessResponse(result);
          }

          case 'delete_monitor_sessions': {
            const validated = DeleteMonitorSessionsSchema.parse(args);
            const result = await this.client.deleteMonitorSessions(validated.session_ids);
            return this.formatSuccessResponse(result);
          }

          case 'get_shared_messages': {
            const validated = GetSharedMessagesSchema.parse(args);
            const result = await this.client.getSharedMessages(validated);
            return this.formatSuccessResponse(result);
          }

          case 'get_shared_sessions': {
            const validated = GetSharedSessionsSchema.parse(args);
            const result = await this.client.getSharedSessions(validated.source_flow_id);
            return this.formatSuccessResponse(result);
          }

          case 'update_shared_message': {
            const validated = UpdateSharedMessageSchema.parse(args);
            const { message_id, source_flow_id, ...body } = validated;
            const result = await this.client.updateSharedMessage(message_id, source_flow_id, body);
            return this.formatSuccessResponse(result);
          }

          case 'migrate_shared_session': {
            const validated = MigrateSharedSessionSchema.parse(args);
            const result = await this.client.migrateSharedSession(validated.session_id, {
              new_session_id: validated.new_session_id,
              source_flow_id: validated.source_flow_id
            });
            return this.formatSuccessResponse(result);
          }

          case 'delete_shared_session': {
            const validated = DeleteSharedSessionSchema.parse(args);
            const result = await this.client.deleteSharedSession(validated.session_id, validated.source_flow_id);
            return this.formatSuccessResponse(result);
          }

          case 'list_traces': {
            const validated = ListTracesSchema.parse(args);
            const result = await this.client.listTraces(validated);
            return this.formatSuccessResponse(result);
          }

          case 'delete_traces': {
            const validated = DeleteTracesSchema.parse(args);
            const result = await this.client.deleteTraces(validated.flow_id);
            return this.formatSuccessResponse(result);
          }

          case 'get_trace': {
            const validated = GetTraceSchema.parse(args);
            const result = await this.client.getTrace(validated.trace_id);
            return this.formatSuccessResponse(result);
          }

          case 'delete_trace': {
            const validated = DeleteTraceSchema.parse(args);
            await this.client.deleteTrace(validated.trace_id);
            return this.formatSuccessResponse({
              success: true,
              message: 'Trace deleted successfully'
            });
          }

          case 'list_models': {
            const validated = ListModelsSchema.parse(args);
            const result = await this.client.listModels(validated);
            return this.formatSuccessResponse(result);
          }

          case 'list_model_providers': {
            ListModelProvidersSchema.parse(args);
            const result = await this.client.listModelProviders();
            return this.formatSuccessResponse(result);
          }

          case 'list_enabled_providers': {
            const validated = ListEnabledProvidersSchema.parse(args);
            const result = await this.client.listEnabledProviders(
              validated.providers ? { providers: validated.providers } : undefined
            );
            return this.formatSuccessResponse(result);
          }

          case 'list_enabled_models': {
            const validated = ListEnabledModelsSchema.parse(args);
            const result = await this.client.listEnabledModels(
              validated.model_names ? { model_names: validated.model_names } : undefined
            );
            return this.formatSuccessResponse(result);
          }

          case 'set_enabled_models': {
            const validated = SetEnabledModelsSchema.parse(args);
            const result = await this.client.setEnabledModels(validated.models);
            return this.formatSuccessResponse(result);
          }

          case 'get_default_model': {
            const validated = GetDefaultModelSchema.parse(args);
            const result = await this.client.getDefaultModel({ model_type: validated.model_type });
            return this.formatSuccessResponse(result);
          }

          case 'set_default_model': {
            const validated = SetDefaultModelSchema.parse(args);
            const result = await this.client.setDefaultModel({
              provider: validated.provider,
              model_name: validated.model_name,
              model_type: validated.model_type
            });
            return this.formatSuccessResponse(result);
          }

          case 'delete_default_model': {
            const validated = DeleteDefaultModelSchema.parse(args);
            const result = await this.client.deleteDefaultModel({ model_type: validated.model_type });
            return this.formatSuccessResponse(result);
          }

          case 'get_provider_variable_mapping': {
            GetProviderVariableMappingSchema.parse(args);
            const result = await this.client.getProviderVariableMapping();
            return this.formatSuccessResponse(result);
          }

          case 'validate_model_provider': {
            const validated = ValidateModelProviderSchema.parse(args);
            const result = await this.client.validateModelProvider({
              provider: validated.provider,
              variables: validated.variables
            });
            return this.formatSuccessResponse(result);
          }

          case 'get_language_model_options': {
            GetLanguageModelOptionsSchema.parse(args);
            const result = await this.client.getLanguageModelOptions();
            return this.formatSuccessResponse(result);
          }

          case 'get_embedding_model_options': {
            GetEmbeddingModelOptionsSchema.parse(args);
            const result = await this.client.getEmbeddingModelOptions();
            return this.formatSuccessResponse(result);
          }

          case 'agentic_assist': {
            const validated = AgenticAssistSchema.parse(args);
            const result = await this.client.agenticAssist(validated);
            return this.formatSuccessResponse(result);
          }

          case 'agentic_check_config': {
            AgenticCheckConfigSchema.parse(args);
            const result = await this.client.agenticCheckConfig();
            return this.formatSuccessResponse(result);
          }

          case 'agentic_execute': {
            const validated = AgenticExecuteSchema.parse(args);
            const { flow_name, ...body } = validated;
            const result = await this.client.agenticExecute(flow_name, body);
            return this.formatSuccessResponse(result);
          }

          case 'get_workflow_result': {
            const validated = GetWorkflowResultSchema.parse(args);
            const result = await this.client.getWorkflowResult(
              validated.job_id ? { job_id: validated.job_id } : undefined
            );
            return this.formatSuccessResponse(result);
          }

          case 'run_workflow': {
            const validated = RunWorkflowSchema.parse(args);
            const result = await this.client.runWorkflow(validated);
            return this.formatSuccessResponse(result);
          }

          case 'stop_workflow': {
            const validated = StopWorkflowSchema.parse(args);
            const result = await this.client.stopWorkflow(validated.job_id);
            return this.formatSuccessResponse(result);
          }

          case 'list_mcp_servers': {
            const validated = ListMcpServersSchema.parse(args);
            const result = await this.client.listMcpServers(
              validated.action_count !== undefined ? { action_count: validated.action_count } : undefined
            );
            return this.formatSuccessResponse(result);
          }

          case 'get_mcp_server': {
            const validated = GetMcpServerSchema.parse(args);
            const result = await this.client.getMcpServer(validated.server_name);
            return this.formatSuccessResponse(result);
          }

          case 'create_mcp_server': {
            const validated = CreateMcpServerSchema.parse(args);
            const result = await this.client.createMcpServer(validated.server_name, validated.config);
            return this.formatSuccessResponse(result);
          }

          case 'update_mcp_server': {
            const validated = UpdateMcpServerSchema.parse(args);
            const result = await this.client.updateMcpServer(validated.server_name, validated.config);
            return this.formatSuccessResponse(result);
          }

          case 'delete_mcp_server': {
            const validated = DeleteMcpServerSchema.parse(args);
            const result = await this.client.deleteMcpServer(validated.server_name);
            return this.formatSuccessResponse(result);
          }

          case 'get_mcp_project_config': {
            const validated = GetMcpProjectConfigSchema.parse(args);
            const result = await this.client.getMcpProjectConfig(
              validated.project_id,
              validated.mcp_enabled !== undefined ? { mcp_enabled: validated.mcp_enabled } : undefined
            );
            return this.formatSuccessResponse(result);
          }

          case 'update_mcp_project_config': {
            const validated = UpdateMcpProjectConfigSchema.parse(args);
            const result = await this.client.updateMcpProjectConfig(validated.project_id, {
              settings: validated.settings,
              auth_settings: validated.auth_settings
            });
            return this.formatSuccessResponse(result);
          }

          case 'get_mcp_project_installed': {
            const validated = GetMcpProjectInstalledSchema.parse(args);
            const result = await this.client.getMcpProjectInstalled(validated.project_id);
            return this.formatSuccessResponse(result);
          }

          case 'install_mcp_project': {
            const validated = InstallMcpProjectSchema.parse(args);
            const result = await this.client.installMcpProject(validated.project_id, {
              client: validated.client,
              transport: validated.transport
            });
            return this.formatSuccessResponse(result);
          }

          case 'get_mcp_project_composer_url': {
            const validated = GetMcpProjectComposerUrlSchema.parse(args);
            const result = await this.client.getMcpProjectComposerUrl(validated.project_id);
            return this.formatSuccessResponse(result);
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        // Per MCP spec: Tool execution errors should be returned with isError: true
        // so the LLM can see the error and self-correct. Only server-level errors
        // (like "Unknown tool") should be thrown.
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
