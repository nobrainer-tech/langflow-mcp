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
import { consolidatedTools } from './tools-consolidated';
import { logger } from '../utils/logger';
import { LangflowClient } from '../services/langflow-client';
import { LangflowConfig } from '../types';
import { langflowPrompts, getPromptMessages } from './prompts';
import { langflowResources, getResourceContent } from './resources';
import {
  FlowToolSchema,
  FlowExecutionToolSchema,
  BuildToolSchema,
  FolderToolSchema,
  ProjectToolSchema,
  VariableToolSchema,
  KnowledgeBaseToolSchema,
  FileToolSchema,
  MonitorToolSchema,
  UserToolSchema,
  AuthToolSchema,
  StoreToolSchema,
  RegistrationToolSchema,
  ValidationToolSchema,
  SystemToolSchema,
  FlowVersionToolSchema,
  FileV2ToolSchema,
  ModelToolSchema,
  AgenticToolSchema,
  WorkflowToolSchema,
  McpServerToolSchema,
  McpProjectToolSchema,
  TraceToolSchema,
  ResponseToolSchema
} from './validation-consolidated';

export class LangflowMCPServerConsolidated {
  private server: Server;
  private client: LangflowClient | null = null;

  constructor() {
    const baseUrl = process.env.LANGFLOW_BASE_URL;
    const apiKey = process.env.LANGFLOW_API_KEY;

    if (baseUrl && apiKey) {
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

      const config: LangflowConfig = { baseUrl, apiKey, timeout };
      this.client = new LangflowClient(config);
    } else {
      logger.warn('LANGFLOW_BASE_URL or LANGFLOW_API_KEY not set. Server will start but tools will return errors until configured.');
    }

    logger.info('Initializing Langflow MCP server (consolidated tools)');

    let serverVersion = 'dev';
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pkg = require('../../package.json');
      serverVersion = pkg.version ?? serverVersion;
    } catch (e) {
      logger.warn('package.json not readable; using fallback version "dev"', e);
    }

    this.server = new Server(
      { name: 'langflow-mcp', version: serverVersion },
      { capabilities: { tools: {}, prompts: {}, resources: {} } }
    );

    this.setupHandlers();
  }

  private formatSuccessResponse(data: unknown): { content: Array<{ type: string; text: string }> } {
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
    };
  }

  private sanitizeSensitiveData(
    args: Record<string, unknown>,
    depth = 0,
    seen = new WeakSet<object>()
  ): Record<string, unknown> {
    const MAX_DEPTH = 10;
    const MAX_STRING_LENGTH = 200;
    const SENSITIVE_KEYS = new Set([
      'password', 'new_password', 'api_key', 'token',
      'access_token', 'refresh_token', 'authorization',
      'x-api-key', 'x-store-api-key', 'set-cookie',
      'bearer', 'session', 'session_id', 'cookie',
      'private_key', 'secret', 'credentials', 'api-key',
      'file_content', 'file', 'content', 'payload', 'data'
    ]);

    if (depth > MAX_DEPTH) return { __error: 'max depth exceeded' };
    if (!args || typeof args !== 'object') return args;
    if (seen.has(args)) return { __error: 'circular reference' };

    seen.add(args);
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(args)) {
      const keyLower = key.toLowerCase();
      if (SENSITIVE_KEYS.has(keyLower)) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof value === 'string' && value.length > MAX_STRING_LENGTH) {
        sanitized[key] = `${value.slice(0, MAX_STRING_LENGTH)}...[truncated ${value.length} chars]`;
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item =>
          typeof item === 'object' && item !== null
            ? this.sanitizeSensitiveData(item as Record<string, unknown>, depth + 1, seen)
            : typeof item === 'string' && item.length > MAX_STRING_LENGTH
              ? `${item.slice(0, MAX_STRING_LENGTH)}...[truncated]`
              : item
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeSensitiveData(value as Record<string, unknown>, depth + 1, seen);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private formatErrorResponse(
    error: unknown,
    toolName: string,
    args?: Record<string, unknown>
  ): { content: Array<{ type: string; text: string }>; isError: boolean } {
    const sanitized = args ? this.sanitizeSensitiveData(args) : undefined;
    // Sanitize error to avoid logging sensitive data from axios config/headers
    const safeError = error instanceof Error
      ? { name: error.name, message: error.message }
      : { message: String(error) };
    logger.error(`Error executing tool ${toolName}:`, { args: sanitized, error: safeError });

    let errorMessage: string;
    let errorDetails: Record<string, unknown> = {};

    if (error instanceof ZodError) {
      errorMessage = 'Validation error';
      errorDetails = {
        issues: error.issues.map(issue => ({
          path: Array.isArray(issue.path) ? issue.path.join('.') : '',
          message: issue.message
        }))
      };
    } else if (error instanceof Error) {
      errorMessage = error.message;
      if (error.stack && process.env.NODE_ENV !== 'production') {
        errorDetails.stack = error.stack.split('\n').slice(0, 5);
      }
    } else {
      errorMessage = 'Unknown error';
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: true,
          message: errorMessage,
          tool: toolName,
          timestamp: new Date().toISOString(),
          ...errorDetails
        }, null, 2)
      }],
      isError: true
    };
  }

  private validateFileSize(fileContent: string, maxSizeBytes: number = 10 * 1024 * 1024): Buffer {
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

    const estimatedSize = (fileContent.length * 3) / 4;
    if (estimatedSize > maxSizeBytes) {
      throw new Error(`File size exceeds maximum allowed size of ${maxSizeBytes} bytes (10MB)`);
    }

    const fileBuffer = Buffer.from(fileContent, 'base64');
    if (fileBuffer.length > maxSizeBytes) {
      throw new Error(`File size ${fileBuffer.length} bytes exceeds maximum allowed size`);
    }

    return fileBuffer;
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: consolidatedTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    }));

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

      if (rawArgs !== undefined && rawArgs !== null) {
        if (typeof rawArgs !== 'object' || Array.isArray(rawArgs)) {
          throw new Error('Arguments must be an object');
        }
      }

      const args = (rawArgs ?? {}) as Record<string, unknown>;

      try {
        switch (name) {
          case 'flow':
            return await this.handleFlowTool(args);
          case 'flow_execution':
            return await this.handleFlowExecutionTool(args);
          case 'build':
            return await this.handleBuildTool(args);
          case 'folder':
            return await this.handleFolderTool(args);
          case 'project':
            return await this.handleProjectTool(args);
          case 'variable':
            return await this.handleVariableTool(args);
          case 'knowledge_base':
            return await this.handleKnowledgeBaseTool(args);
          case 'file':
            return await this.handleFileTool(args);
          case 'monitor':
            return await this.handleMonitorTool(args);
          case 'user':
            return await this.handleUserTool(args);
          case 'auth':
            return await this.handleAuthTool(args);
          case 'store':
            return await this.handleStoreTool(args);
          case 'registration':
            return await this.handleRegistrationTool(args);
          case 'validation':
            return await this.handleValidationTool(args);
          case 'system':
            return await this.handleSystemTool(args);
          case 'flow_version':
            return await this.handleFlowVersionTool(args);
          case 'file_v2':
            return await this.handleFileV2Tool(args);
          case 'model':
            return await this.handleModelTool(args);
          case 'agentic':
            return await this.handleAgenticTool(args);
          case 'workflow':
            return await this.handleWorkflowTool(args);
          case 'mcp_server':
            return await this.handleMcpServerTool(args);
          case 'mcp_project':
            return await this.handleMcpProjectTool(args);
          case 'trace':
            return await this.handleTraceTool(args);
          case 'response':
            return await this.handleResponseTool(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return this.formatErrorResponse(error, name, args);
      }
    });
  }

  private async handleFlowTool(args: Record<string, unknown>) {
    const validated = FlowToolSchema.parse(args);

    switch (validated.action) {
      case 'list': {
        const { action: _, ...params } = validated;
        const flows = await this.client!.listFlows(params);
        return this.formatSuccessResponse(flows);
      }
      case 'get': {
        const flow = await this.client!.getFlow(validated.flow_id);
        return this.formatSuccessResponse(flow);
      }
      case 'create': {
        const { action: _, ...data } = validated;
        const created = await this.client!.createFlow(data);
        return this.formatSuccessResponse(created);
      }
      case 'update': {
        const { action: _, flow_id, ...updates } = validated;
        const updated = await this.client!.updateFlow(flow_id, updates);
        return this.formatSuccessResponse(updated);
      }
      case 'delete': {
        await this.client!.deleteFlow(validated.flow_id);
        return this.formatSuccessResponse({ success: true, message: 'Flow deleted successfully' });
      }
      case 'delete_many': {
        const result = await this.client!.deleteFlows(validated.flow_ids);
        return this.formatSuccessResponse(result);
      }
      case 'batch_create': {
        const result = await this.client!.batchCreateFlows(validated.flows);
        return this.formatSuccessResponse(result);
      }
      case 'download': {
        const result = await this.client!.downloadFlows(validated.flow_ids);
        return this.formatSuccessResponse(result);
      }
      case 'upload': {
        const flow = await this.client!.uploadFlow(validated.file);
        return this.formatSuccessResponse(flow);
      }
      case 'get_public': {
        const result = await this.client!.getPublicFlow(validated.flow_id);
        return this.formatSuccessResponse(result);
      }
      case 'get_examples': {
        const examples = await this.client!.getBasicExamples();
        return this.formatSuccessResponse(examples);
      }
      case 'get_starters': {
        const starters = await this.client!.listStarterProjects();
        return this.formatSuccessResponse(starters);
      }
      case 'replace': {
        const { action: _, flow_id, ...body } = validated;
        const result = await this.client!.replaceFlow(flow_id, body);
        return this.formatSuccessResponse(result);
      }
      case 'expand': {
        const result = await this.client!.expandFlows(validated.body);
        return this.formatSuccessResponse(result);
      }
    }
  }

  private async handleFlowExecutionTool(args: Record<string, unknown>) {
    const validated = FlowExecutionToolSchema.parse(args);

    switch (validated.action) {
      case 'run': {
        const { action: _, flow_id_or_name, stream, context, ...inputRequest } = validated;
        const result = await this.client!.runFlow(flow_id_or_name, inputRequest, stream, context);
        return this.formatSuccessResponse(result);
      }
      case 'run_advanced': {
        const { action: _, flow_id_or_name, stream, user_id, ...request } = validated;
        const result = await this.client!.runFlowAdvanced(flow_id_or_name, request, stream, user_id);
        return this.formatSuccessResponse(result);
      }
      case 'run_session': {
        const { action: _, flow_id_or_name, stream, ...request } = validated;
        const result = await this.client!.runFlowSession(flow_id_or_name, request, stream);
        return this.formatSuccessResponse(result);
      }
      case 'webhook': {
        const { action: _, flow_id_or_name, ...inputRequest } = validated;
        const result = await this.client!.triggerWebhook(flow_id_or_name, inputRequest);
        return this.formatSuccessResponse(result);
      }
      case 'process': {
        const { action: _, flow_id, ...request } = validated;
        const result = await this.client!.processFlow(flow_id, request);
        return this.formatSuccessResponse(result);
      }
      case 'predict': {
        const { action: _, flow_id, ...request } = validated;
        const result = await this.client!.predictFlow(flow_id, request);
        return this.formatSuccessResponse(result);
      }
    }
  }

  private async handleBuildTool(args: Record<string, unknown>) {
    const validated = BuildToolSchema.parse(args);

    switch (validated.action) {
      case 'start': {
        const { action: _, flow_id, inputs, data, files, ...params } = validated;
        const result = await this.client!.buildFlow(flow_id, { inputs, data, files }, params);
        return this.formatSuccessResponse(result);
      }
      case 'status': {
        const result = await this.client!.getBuildStatus(validated.job_id, validated.event_delivery);
        return this.formatSuccessResponse(result);
      }
      case 'cancel': {
        const result = await this.client!.cancelBuild(validated.job_id);
        return this.formatSuccessResponse(result);
      }
      case 'vertices': {
        const { action: _, flow_id, ...request } = validated;
        const result = await this.client!.buildVertices(flow_id, request);
        return this.formatSuccessResponse(result);
      }
      case 'stream_vertex': {
        const result = await this.client!.streamVertexBuild({ flow_id: validated.flow_id, vertex_id: validated.vertex_id });
        return this.formatSuccessResponse(result);
      }
      case 'task_status': {
        const result = await this.client!.getTaskStatus(validated.task_id);
        return this.formatSuccessResponse(result);
      }
    }
  }

  private async handleFolderTool(args: Record<string, unknown>) {
    const validated = FolderToolSchema.parse(args);

    switch (validated.action) {
      case 'list': {
        const { action: _, ...params } = validated;
        const folders = await this.client!.listFolders(params);
        return this.formatSuccessResponse(folders);
      }
      case 'get': {
        const folder = await this.client!.getFolder(validated.folder_id);
        return this.formatSuccessResponse(folder);
      }
      case 'create': {
        const { action: _, ...data } = validated;
        const created = await this.client!.createFolder(data);
        return this.formatSuccessResponse(created);
      }
      case 'update': {
        const { action: _, folder_id, ...updates } = validated;
        const updated = await this.client!.updateFolder(folder_id, updates);
        return this.formatSuccessResponse(updated);
      }
      case 'delete': {
        await this.client!.deleteFolder(validated.folder_id);
        return this.formatSuccessResponse({ success: true, message: 'Folder deleted successfully' });
      }
      case 'download': {
        const result = await this.client!.downloadFolder(validated.folder_id);
        if (!result) throw new Error('No folder data received from server');
        const base64Data = Buffer.from(result).toString('base64');
        return this.formatSuccessResponse({ data: base64Data, encoding: 'base64' });
      }
      case 'upload': {
        const fileBuffer = this.validateFileSize(validated.file_content);
        const result = await this.client!.uploadFolder(fileBuffer, validated.file_name);
        return this.formatSuccessResponse(result);
      }
    }
  }

  private async handleProjectTool(args: Record<string, unknown>) {
    const validated = ProjectToolSchema.parse(args);

    switch (validated.action) {
      case 'list': {
        const { action: _, ...params } = validated;
        const projects = await this.client!.listProjects(params);
        return this.formatSuccessResponse(projects);
      }
      case 'get': {
        const project = await this.client!.getProject(validated.project_id);
        return this.formatSuccessResponse(project);
      }
      case 'create': {
        const { action: _, ...data } = validated;
        const created = await this.client!.createProject(data);
        return this.formatSuccessResponse(created);
      }
      case 'update': {
        const { action: _, project_id, ...updates } = validated;
        const updated = await this.client!.updateProject(project_id, updates);
        return this.formatSuccessResponse(updated);
      }
      case 'delete': {
        await this.client!.deleteProject(validated.project_id);
        return this.formatSuccessResponse({ success: true, message: 'Project deleted successfully' });
      }
      case 'download': {
        const result = await this.client!.downloadProject(validated.project_id);
        return this.formatSuccessResponse(result);
      }
      case 'upload': {
        const project = await this.client!.uploadProject(validated.file);
        return this.formatSuccessResponse(project);
      }
    }
  }

  private async handleVariableTool(args: Record<string, unknown>) {
    const validated = VariableToolSchema.parse(args);

    switch (validated.action) {
      case 'list': {
        const variables = await this.client!.listVariables();
        return this.formatSuccessResponse(variables);
      }
      case 'create': {
        const { action: _, ...data } = validated;
        const created = await this.client!.createVariable(data);
        return this.formatSuccessResponse(created);
      }
      case 'update': {
        const { action: _, variable_id, ...updates } = validated;
        const updated = await this.client!.updateVariable(variable_id, updates);
        return this.formatSuccessResponse(updated);
      }
      case 'delete': {
        await this.client!.deleteVariable(validated.variable_id);
        return this.formatSuccessResponse({ success: true, message: 'Variable deleted successfully' });
      }
      case 'detect': {
        const result = await this.client!.detectVariables({ flow_version_ids: validated.flow_version_ids });
        return this.formatSuccessResponse(result);
      }
    }
  }

  private async handleKnowledgeBaseTool(args: Record<string, unknown>) {
    const validated = KnowledgeBaseToolSchema.parse(args);

    switch (validated.action) {
      case 'list': {
        const knowledgeBases = await this.client!.listKnowledgeBases();
        return this.formatSuccessResponse(knowledgeBases);
      }
      case 'get': {
        const kb = await this.client!.getKnowledgeBase(validated.kb_name);
        return this.formatSuccessResponse(kb);
      }
      case 'delete': {
        await this.client!.deleteKnowledgeBase(validated.kb_name);
        return this.formatSuccessResponse({ success: true, message: 'Knowledge base deleted successfully' });
      }
      case 'bulk_delete': {
        const result = await this.client!.bulkDeleteKnowledgeBases(validated.kb_names);
        return this.formatSuccessResponse(result);
      }
      case 'upload': {
        const fileBuffer = this.validateFileSize(validated.file_content);
        const result = await this.client!.uploadKnowledgeBase(validated.kb_name, fileBuffer, validated.file_name);
        return this.formatSuccessResponse(result);
      }
      case 'create': {
        const { action: _, ...body } = validated;
        const result = await this.client!.createKnowledgeBase(body);
        return this.formatSuccessResponse(result);
      }
      case 'list_detailed': {
        const result = await this.client!.listKnowledgeBasesDetailed();
        return this.formatSuccessResponse(result);
      }
      case 'list_chunks': {
        const { action: _, kb_name, ...params } = validated;
        const result = await this.client!.listKnowledgeBaseChunks(kb_name, params);
        return this.formatSuccessResponse(result);
      }
      case 'ingest': {
        const fileBuffer = this.validateFileSize(validated.file_content);
        const result = await this.client!.ingestKnowledgeBase(
          validated.kb_name,
          [{ buffer: fileBuffer, filename: validated.file_name }],
          validated.params
        );
        return this.formatSuccessResponse(result);
      }
      case 'preview_chunks': {
        const fileBuffer = this.validateFileSize(validated.file_content);
        const result = await this.client!.previewKnowledgeBaseChunks(
          [{ buffer: fileBuffer, filename: validated.file_name }],
          validated.params
        );
        return this.formatSuccessResponse(result);
      }
      case 'cancel_ingest': {
        const result = await this.client!.cancelKnowledgeBaseIngest(validated.kb_name);
        return this.formatSuccessResponse(result);
      }
    }
  }

  private async handleFileTool(args: Record<string, unknown>) {
    const validated = FileToolSchema.parse(args);

    switch (validated.action) {
      case 'list': {
        const files = await this.client!.listFiles({ flow_id: validated.flow_id });
        return this.formatSuccessResponse(files);
      }
      case 'upload': {
        const fileBuffer = this.validateFileSize(validated.file_content);
        const result = await this.client!.uploadFile({
          flow_id: validated.flow_id,
          file: fileBuffer,
          file_name: validated.file_name
        });
        return this.formatSuccessResponse(result);
      }
      case 'download': {
        const fileData = await this.client!.downloadFile({
          flow_id: validated.flow_id,
          file_name: validated.file_name
        });
        if (!fileData || (fileData.byteLength ?? fileData.length) === 0) throw new Error('No file data received from server');
        const base64Data = Buffer.from(fileData).toString('base64');
        return this.formatSuccessResponse({ file_name: validated.file_name, content: base64Data });
      }
      case 'delete': {
        const result = await this.client!.deleteFile({
          flow_id: validated.flow_id,
          file_name: validated.file_name
        });
        return this.formatSuccessResponse(result);
      }
      case 'get_image': {
        const imageData = await this.client!.getFileImage({
          flow_id: validated.flow_id,
          file_name: validated.file_name
        });
        if (!imageData || (imageData.byteLength ?? imageData.length) === 0) throw new Error('No image data received from server');
        const base64Data = Buffer.from(imageData).toString('base64');
        return this.formatSuccessResponse({ file_name: validated.file_name, content: base64Data });
      }
    }
  }

  private async handleMonitorTool(args: Record<string, unknown>) {
    const validated = MonitorToolSchema.parse(args);

    switch (validated.action) {
      case 'get_builds': {
        const result = await this.client!.getMonitorBuilds({ flow_id: validated.flow_id });
        return this.formatSuccessResponse(result);
      }
      case 'delete_builds': {
        await this.client!.deleteMonitorBuilds(validated.flow_id);
        return this.formatSuccessResponse({ success: true, message: 'Monitor builds deleted successfully' });
      }
      case 'get_messages': {
        const { action: _, ...params } = validated;
        const result = await this.client!.getMonitorMessages(params);
        return this.formatSuccessResponse(result);
      }
      case 'get_message': {
        const result = await this.client!.getMonitorMessage(validated.message_id);
        return this.formatSuccessResponse(result);
      }
      case 'delete_messages': {
        await this.client!.deleteMonitorMessages(validated.message_ids);
        return this.formatSuccessResponse({ success: true, message: 'Monitor messages deleted successfully' });
      }
      case 'get_sessions': {
        const { action: _, ...params } = validated;
        const result = await this.client!.getMonitorSessions(params);
        return this.formatSuccessResponse(result);
      }
      case 'get_session_messages': {
        const result = await this.client!.getMonitorSessionMessages(validated.session_id);
        return this.formatSuccessResponse(result);
      }
      case 'migrate_session': {
        const result = await this.client!.migrateMonitorSession({
          old_session_id: validated.session_id,
          new_session_id: validated.new_session_id
        });
        return this.formatSuccessResponse(result);
      }
      case 'get_transactions': {
        const { action: _, flow_id, ...params } = validated;
        const result = await this.client!.getMonitorTransactions({ flow_id: flow_id!, ...params });
        return this.formatSuccessResponse(result);
      }
      case 'update_message': {
        const { action: _, message_id, ...body } = validated;
        const result = await this.client!.updateMonitorMessage(message_id, body);
        return this.formatSuccessResponse(result);
      }
      case 'delete_session_messages': {
        const result = await this.client!.deleteMonitorSessionMessages(validated.session_id);
        return this.formatSuccessResponse(result);
      }
      case 'delete_sessions': {
        const result = await this.client!.deleteMonitorSessions(validated.session_ids);
        return this.formatSuccessResponse(result);
      }
      case 'get_shared': {
        const { action: _, ...params } = validated;
        const result = await this.client!.getSharedMessages(params);
        return this.formatSuccessResponse(result);
      }
      case 'get_shared_sessions': {
        const result = await this.client!.getSharedSessions(validated.source_flow_id);
        return this.formatSuccessResponse(result);
      }
      case 'update_shared': {
        const { action: _, message_id, source_flow_id, ...body } = validated;
        const result = await this.client!.updateSharedMessage(message_id, source_flow_id, body);
        return this.formatSuccessResponse(result);
      }
      case 'migrate_shared_session': {
        const result = await this.client!.migrateSharedSession(validated.session_id, {
          new_session_id: validated.new_session_id,
          source_flow_id: validated.source_flow_id
        });
        return this.formatSuccessResponse(result);
      }
      case 'delete_shared_session': {
        const result = await this.client!.deleteSharedSession(validated.session_id, validated.source_flow_id);
        return this.formatSuccessResponse(result);
      }
    }
  }

  private async handleUserTool(args: Record<string, unknown>) {
    const validated = UserToolSchema.parse(args);

    switch (validated.action) {
      case 'list': {
        const { action: _, page, size, ...rest } = validated;
        // Convert 1-based page to 0-based skip offset
        const skip = page && size ? (page - 1) * size : page ? page - 1 : undefined;
        const params = { skip, limit: size, ...rest };
        const result = await this.client!.listUsers(params);
        return this.formatSuccessResponse(result);
      }
      case 'get_current': {
        const result = await this.client!.getCurrentUser();
        return this.formatSuccessResponse(result);
      }
      case 'update': {
        const { action: _, user_id, ...updates } = validated;
        const result = await this.client!.updateUser(user_id, updates);
        return this.formatSuccessResponse(result);
      }
      case 'reset_password': {
        const result = await this.client!.resetUserPassword(validated.user_id, validated.new_password);
        return this.formatSuccessResponse(result);
      }
      case 'create': {
        const { action: _, ...body } = validated;
        const result = await this.client!.createUser(body);
        return this.formatSuccessResponse(result);
      }
    }
  }

  private async handleAuthTool(args: Record<string, unknown>) {
    const validated = AuthToolSchema.parse(args);

    switch (validated.action) {
      case 'login': {
        const result = await this.client!.login(validated.username, validated.password);
        return this.formatSuccessResponse(result);
      }
      case 'auto_login': {
        const result = await this.client!.autoLogin();
        return this.formatSuccessResponse(result);
      }
      case 'logout': {
        const result = await this.client!.logout();
        return this.formatSuccessResponse(result);
      }
      case 'refresh': {
        const result = await this.client!.refreshToken();
        return this.formatSuccessResponse(result);
      }
      case 'list_keys': {
        const result = await this.client!.listApiKeys();
        return this.formatSuccessResponse(result);
      }
      case 'create_key': {
        const result = await this.client!.createApiKey(validated.name);
        return this.formatSuccessResponse({
          ...result,
          security_warning: 'IMPORTANT: Store this API key securely. It cannot be retrieved later.'
        });
      }
      case 'delete_key': {
        await this.client!.deleteApiKey(validated.api_key_id);
        return this.formatSuccessResponse({ success: true, message: 'API key deleted successfully' });
      }
      case 'save_store_key': {
        const result = await this.client!.saveStoreApiKey(validated.api_key);
        return this.formatSuccessResponse(result);
      }
    }
  }

  private async handleStoreTool(args: Record<string, unknown>) {
    const validated = StoreToolSchema.parse(args);

    switch (validated.action) {
      case 'list_components': {
        const components = await this.client!.listComponents();
        return this.formatSuccessResponse(components);
      }
      case 'create_custom': {
        const result = await this.client!.createCustomComponent({ name: validated.name, code: validated.code });
        return this.formatSuccessResponse(result);
      }
      case 'check': {
        const result = await this.client!.checkStore();
        return this.formatSuccessResponse(result);
      }
      case 'check_key': {
        const result = await this.client!.checkStoreApiKey(validated.api_key);
        return this.formatSuccessResponse(result);
      }
      case 'list_store': {
        const { action: _, ...params } = validated;
        const components = await this.client!.listStoreComponents(params);
        return this.formatSuccessResponse(components);
      }
      case 'get_store': {
        const component = await this.client!.getStoreComponent(validated.component_id);
        return this.formatSuccessResponse(component);
      }
      case 'list_tags': {
        const tags = await this.client!.listStoreTags();
        return this.formatSuccessResponse(tags);
      }
      case 'get_likes': {
        const likes = await this.client!.getUserLikes();
        return this.formatSuccessResponse(likes);
      }
      case 'create_store': {
        const { action: _, ...body } = validated;
        const result = await this.client!.createStoreComponent({
          description: null,
          tags: null,
          is_component: null,
          ...body
        });
        return this.formatSuccessResponse(result);
      }
      case 'like': {
        const result = await this.client!.likeStoreComponent(validated.component_id);
        return this.formatSuccessResponse(result);
      }
      case 'update_custom': {
        const { action: _, ...body } = validated;
        const result = await this.client!.updateCustomComponentCode(body);
        return this.formatSuccessResponse(result);
      }
    }
  }

  private async handleRegistrationTool(args: Record<string, unknown>) {
    const validated = RegistrationToolSchema.parse(args);

    switch (validated.action) {
      case 'get': {
        const result = await this.client!.getRegistration();
        return this.formatSuccessResponse(result);
      }
      case 'register': {
        const result = await this.client!.registerUser(validated.email);
        return this.formatSuccessResponse(result);
      }
    }
  }

  private async handleValidationTool(args: Record<string, unknown>) {
    const validated = ValidationToolSchema.parse(args);

    switch (validated.action) {
      case 'code': {
        const result = await this.client!.validateCode(validated.code);
        return this.formatSuccessResponse(result);
      }
      case 'prompt': {
        const result = await this.client!.validatePrompt(validated.prompt);
        return this.formatSuccessResponse(result);
      }
    }
  }

  private async handleSystemTool(args: Record<string, unknown>) {
    const validated = SystemToolSchema.parse(args);

    switch (validated.action) {
      case 'health': {
        const result = await this.client!.healthCheck();
        return this.formatSuccessResponse({ status: result ? 'healthy' : 'unhealthy', healthy: result });
      }
      case 'version': {
        const result = await this.client!.getVersion();
        return this.formatSuccessResponse(result);
      }
      case 'logs': {
        const result = await this.client!.getLogs(validated.stream);
        return this.formatSuccessResponse(result);
      }
      case 'list_pictures': {
        const pictures = await this.client!.listProfilePictures();
        return this.formatSuccessResponse(pictures);
      }
      case 'get_picture': {
        const pictureData = await this.client!.getProfilePicture(validated.folder_name, validated.file_name);
        if (!pictureData || (pictureData.byteLength ?? pictureData.length) === 0) throw new Error('No picture data received from server');
        const base64Data = Buffer.from(pictureData).toString('base64');
        return this.formatSuccessResponse({ file_name: validated.file_name, content: base64Data });
      }
      case 'list_voices': {
        const voices = await this.client!.listElevenLabsVoices();
        return this.formatSuccessResponse(voices);
      }
      case 'session': {
        const result = await this.client!.getSession();
        return this.formatSuccessResponse(result);
      }
      case 'webhook_events': {
        const result = await this.client!.getWebhookEvents(
          validated.flow_id_or_name,
          validated.user_id ? { user_id: validated.user_id } : undefined
        );
        return this.formatSuccessResponse(result);
      }
      case 'health_check': {
        const result = await this.client!.getHealthCheck();
        return this.formatSuccessResponse(result);
      }
    }
  }

  private async handleFlowVersionTool(args: Record<string, unknown>) {
    const validated = FlowVersionToolSchema.parse(args);

    switch (validated.action) {
      case 'list': {
        const { action: _, flow_id, ...params } = validated;
        const result = await this.client!.listFlowVersions(flow_id, params);
        return this.formatSuccessResponse(result);
      }
      case 'create': {
        const result = await this.client!.createFlowVersion(validated.flow_id, validated.body);
        return this.formatSuccessResponse(result);
      }
      case 'get': {
        const result = await this.client!.getFlowVersion(validated.flow_id, validated.version_id);
        return this.formatSuccessResponse(result);
      }
      case 'delete': {
        await this.client!.deleteFlowVersion(validated.flow_id, validated.version_id);
        return this.formatSuccessResponse({ success: true, message: 'Flow version deleted successfully' });
      }
      case 'activate': {
        const result = await this.client!.activateFlowVersion(
          validated.flow_id,
          validated.version_id,
          validated.save_draft !== undefined ? { save_draft: validated.save_draft } : undefined
        );
        return this.formatSuccessResponse(result);
      }
      case 'get_events': {
        const result = await this.client!.getFlowEvents(
          validated.flow_id,
          validated.since !== undefined ? { since: validated.since } : undefined
        );
        return this.formatSuccessResponse(result);
      }
      case 'create_event': {
        const { action: _, flow_id, ...body } = validated;
        const result = await this.client!.createFlowEvent(flow_id, body);
        return this.formatSuccessResponse(result);
      }
    }
  }

  private async handleFileV2Tool(args: Record<string, unknown>) {
    const validated = FileV2ToolSchema.parse(args);

    switch (validated.action) {
      case 'list': {
        const result = await this.client!.listFilesV2();
        return this.formatSuccessResponse(result);
      }
      case 'upload': {
        const fileBuffer = this.validateFileSize(validated.file_content);
        const params: { append?: boolean; ephemeral?: boolean } = {};
        if (validated.append !== undefined) params.append = validated.append;
        if (validated.ephemeral !== undefined) params.ephemeral = validated.ephemeral;
        const result = await this.client!.uploadFileV2(fileBuffer, validated.file_name, params);
        return this.formatSuccessResponse(result);
      }
      case 'get': {
        const result = await this.client!.getFileV2(
          validated.file_id,
          validated.return_content !== undefined ? { return_content: validated.return_content } : undefined
        );
        return this.formatSuccessResponse(result);
      }
      case 'rename': {
        const result = await this.client!.renameFileV2(validated.file_id, validated.name);
        return this.formatSuccessResponse(result);
      }
      case 'delete': {
        const result = await this.client!.deleteFileV2(validated.file_id);
        return this.formatSuccessResponse(result);
      }
      case 'delete_all': {
        const result = await this.client!.deleteAllFilesV2();
        return this.formatSuccessResponse(result);
      }
      case 'batch_download': {
        const result = await this.client!.batchDownloadFilesV2(validated.file_ids);
        return this.formatSuccessResponse(result);
      }
      case 'batch_delete': {
        const result = await this.client!.batchDeleteFilesV2(validated.file_ids);
        return this.formatSuccessResponse(result);
      }
    }
  }

  private async handleModelTool(args: Record<string, unknown>) {
    const validated = ModelToolSchema.parse(args);

    switch (validated.action) {
      case 'list': {
        const { action: _, ...params } = validated;
        const result = await this.client!.listModels(params);
        return this.formatSuccessResponse(result);
      }
      case 'providers': {
        const result = await this.client!.listModelProviders();
        return this.formatSuccessResponse(result);
      }
      case 'enabled_providers': {
        const result = await this.client!.listEnabledProviders(
          validated.providers ? { providers: validated.providers } : undefined
        );
        return this.formatSuccessResponse(result);
      }
      case 'enabled_models': {
        const result = await this.client!.listEnabledModels(
          validated.model_names ? { model_names: validated.model_names } : undefined
        );
        return this.formatSuccessResponse(result);
      }
      case 'set_enabled': {
        const result = await this.client!.setEnabledModels(validated.models);
        return this.formatSuccessResponse(result);
      }
      case 'get_default': {
        const result = await this.client!.getDefaultModel({ model_type: validated.model_type });
        return this.formatSuccessResponse(result);
      }
      case 'set_default': {
        const result = await this.client!.setDefaultModel({
          provider: validated.provider,
          model_name: validated.model_name,
          model_type: validated.model_type
        });
        return this.formatSuccessResponse(result);
      }
      case 'delete_default': {
        const result = await this.client!.deleteDefaultModel({ model_type: validated.model_type });
        return this.formatSuccessResponse(result);
      }
      case 'provider_mapping': {
        const result = await this.client!.getProviderVariableMapping();
        return this.formatSuccessResponse(result);
      }
      case 'validate_provider': {
        const result = await this.client!.validateModelProvider({
          provider: validated.provider,
          variables: validated.variables
        });
        return this.formatSuccessResponse(result);
      }
      case 'options_language': {
        const result = await this.client!.getLanguageModelOptions();
        return this.formatSuccessResponse(result);
      }
      case 'options_embedding': {
        const result = await this.client!.getEmbeddingModelOptions();
        return this.formatSuccessResponse(result);
      }
    }
  }

  private async handleAgenticTool(args: Record<string, unknown>) {
    const validated = AgenticToolSchema.parse(args);

    switch (validated.action) {
      case 'assist': {
        const { action: _, ...body } = validated;
        const result = await this.client!.agenticAssist(body);
        return this.formatSuccessResponse(result);
      }
      case 'check_config': {
        const result = await this.client!.agenticCheckConfig();
        return this.formatSuccessResponse(result);
      }
      case 'execute': {
        const { action: _, flow_name, ...body } = validated;
        const result = await this.client!.agenticExecute(flow_name, body);
        return this.formatSuccessResponse(result);
      }
    }
  }

  private async handleWorkflowTool(args: Record<string, unknown>) {
    const validated = WorkflowToolSchema.parse(args);

    switch (validated.action) {
      case 'run': {
        const { action: _, ...body } = validated;
        const result = await this.client!.runWorkflow(body);
        return this.formatSuccessResponse(result);
      }
      case 'get_result': {
        const result = await this.client!.getWorkflowResult(
          validated.job_id ? { job_id: validated.job_id } : undefined
        );
        return this.formatSuccessResponse(result);
      }
      case 'stop': {
        const result = await this.client!.stopWorkflow(validated.job_id);
        return this.formatSuccessResponse(result);
      }
    }
  }

  private async handleMcpServerTool(args: Record<string, unknown>) {
    const validated = McpServerToolSchema.parse(args);

    switch (validated.action) {
      case 'list': {
        const result = await this.client!.listMcpServers(
          validated.action_count !== undefined ? { action_count: validated.action_count } : undefined
        );
        return this.formatSuccessResponse(result);
      }
      case 'get': {
        const result = await this.client!.getMcpServer(validated.server_name);
        return this.formatSuccessResponse(result);
      }
      case 'create': {
        const result = await this.client!.createMcpServer(validated.server_name, validated.config);
        return this.formatSuccessResponse(result);
      }
      case 'update': {
        const result = await this.client!.updateMcpServer(validated.server_name, validated.config);
        return this.formatSuccessResponse(result);
      }
      case 'delete': {
        const result = await this.client!.deleteMcpServer(validated.server_name);
        return this.formatSuccessResponse(result);
      }
    }
  }

  private async handleMcpProjectTool(args: Record<string, unknown>) {
    const validated = McpProjectToolSchema.parse(args);

    switch (validated.action) {
      case 'get_config': {
        const result = await this.client!.getMcpProjectConfig(
          validated.project_id,
          validated.mcp_enabled !== undefined ? { mcp_enabled: validated.mcp_enabled } : undefined
        );
        return this.formatSuccessResponse(result);
      }
      case 'update_config': {
        const result = await this.client!.updateMcpProjectConfig(validated.project_id, {
          settings: validated.settings,
          auth_settings: validated.auth_settings
        });
        return this.formatSuccessResponse(result);
      }
      case 'get_installed': {
        const result = await this.client!.getMcpProjectInstalled(validated.project_id);
        return this.formatSuccessResponse(result);
      }
      case 'install': {
        const result = await this.client!.installMcpProject(validated.project_id, {
          client: validated.client,
          transport: validated.transport
        });
        return this.formatSuccessResponse(result);
      }
      case 'get_composer_url': {
        const result = await this.client!.getMcpProjectComposerUrl(validated.project_id);
        return this.formatSuccessResponse(result);
      }
    }
  }

  private async handleTraceTool(args: Record<string, unknown>) {
    const validated = TraceToolSchema.parse(args);

    switch (validated.action) {
      case 'list': {
        const { action: _, ...params } = validated;
        const result = await this.client!.listTraces(params);
        return this.formatSuccessResponse(result);
      }
      case 'get': {
        const result = await this.client!.getTrace(validated.trace_id);
        return this.formatSuccessResponse(result);
      }
      case 'delete': {
        await this.client!.deleteTrace(validated.trace_id);
        return this.formatSuccessResponse({ success: true, message: 'Trace deleted successfully' });
      }
      case 'delete_by_flow': {
        const result = await this.client!.deleteTraces(validated.flow_id);
        return this.formatSuccessResponse(result);
      }
    }
  }

  private async handleResponseTool(args: Record<string, unknown>) {
    const validated = ResponseToolSchema.parse(args);

    switch (validated.action) {
      case 'create': {
        const { action: _, ...body } = validated;
        const result = await this.client!.createResponse(body);
        return this.formatSuccessResponse(result);
      }
    }
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('Langflow MCP server (consolidated) running on stdio');
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Langflow MCP server');
    await this.server.close();
  }
}
