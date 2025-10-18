import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ZodError } from 'zod';
import { readFileSync } from 'fs';
import { join } from 'path';
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
  BulkDeleteKnowledgeBasesSchema
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

    const packageJson = JSON.parse(
      readFileSync(join(__dirname, '../../package.json'), 'utf-8')
    );

    this.server = new Server(
      {
        name: 'langflow-mcp',
        version: packageJson.version,
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

  private formatErrorResponse(error: unknown, toolName: string): any {
    logger.error(`Error executing tool ${toolName}:`, error);

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

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return this.formatErrorResponse(error, name);
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
