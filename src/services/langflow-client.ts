import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  LangflowConfig,
  FlowCreate,
  FlowRead,
  FlowUpdate,
  ListFlowsParams,
  DeleteFlowsRequest,
  ComponentInfo,
  RunFlowRequest,
  RunResponse,
  SimplifiedAPIRequest,
  FolderRead,
  FolderCreate,
  FolderUpdate,
  ListFoldersParams,
  ProjectRead,
  ProjectCreate,
  ProjectUpdate,
  ListProjectsParams,
  VariableRead,
  VariableCreate,
  VariableUpdate,
  BuildFlowRequest,
  BuildFlowParams,
  BuildFlowResponse,
  BuildStatusResponse,
  CancelBuildResponse,
  KnowledgeBaseInfo,
  BulkDeleteKnowledgeBasesRequest
} from '../types';

export class LangflowClient {
  private client: AxiosInstance;
  private config: LangflowConfig;

  constructor(config: LangflowConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: `${config.baseUrl}/api/v1`,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey
      }
    });
  }

  async createFlow(flow: FlowCreate): Promise<FlowRead> {
    try {
      const response = await this.client.post<FlowRead>('/flows/', flow);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create flow');
    }
  }

  async listFlows(params?: ListFlowsParams): Promise<FlowRead[]> {
    try {
      const response = await this.client.get<FlowRead[]>('/flows/', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list flows');
    }
  }

  async getFlow(flowId: string): Promise<FlowRead> {
    try {
      const response = await this.client.get<FlowRead>(`/flows/${flowId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get flow ${flowId}`);
    }
  }

  async updateFlow(flowId: string, updates: FlowUpdate): Promise<FlowRead> {
    try {
      const response = await this.client.patch<FlowRead>(`/flows/${flowId}`, updates);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to update flow ${flowId}`);
    }
  }

  async deleteFlow(flowId: string): Promise<void> {
    try {
      await this.client.delete(`/flows/${flowId}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete flow ${flowId}`);
    }
  }

  async deleteFlows(flowIds: string[]): Promise<{ deleted: number }> {
    try {
      const response = await this.client.delete<{ deleted: number }>('/flows/', {
        data: flowIds
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to delete flows');
    }
  }

  async listComponents(): Promise<ComponentInfo[]> {
    try {
      const response = await this.client.get<any>('/all');
      const components: ComponentInfo[] = [];

      if (response.data && typeof response.data === 'object') {
        Object.entries(response.data).forEach(([category, items]: [string, any]) => {
          if (items && typeof items === 'object') {
            Object.entries(items).forEach(([name, info]: [string, any]) => {
              components.push({
                name,
                display_name: info.display_name || name,
                description: info.description || '',
                type: category
              });
            });
          }
        });
      }

      return components;
    } catch (error) {
      throw this.handleError(error, 'Failed to list components');
    }
  }

  async runFlow(flowIdOrName: string, inputRequest: RunFlowRequest, stream: boolean = false): Promise<RunResponse> {
    try {
      const response = await this.client.post<RunResponse>(`/run/${flowIdOrName}`, {
        ...inputRequest,
        stream
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to run flow ${flowIdOrName}`);
    }
  }

  async triggerWebhook(flowIdOrName: string, inputRequest: SimplifiedAPIRequest): Promise<any> {
    try {
      const response = await this.client.post(`/webhook/${flowIdOrName}`, inputRequest);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to trigger webhook for flow ${flowIdOrName}`);
    }
  }

  async uploadFlow(file: Record<string, unknown>): Promise<FlowRead> {
    try {
      const response = await this.client.post<FlowRead>('/flows/upload/', file);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to upload flow');
    }
  }

  async downloadFlows(flowIds: string[]): Promise<any> {
    try {
      const response = await this.client.post('/flows/download/', flowIds);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to download flows');
    }
  }

  async getBasicExamples(): Promise<FlowRead[]> {
    try {
      const response = await this.client.get<FlowRead[]>('/flows/basic_examples/');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get basic examples');
    }
  }

  async listFolders(params?: ListFoldersParams): Promise<FolderRead[]> {
    try {
      const response = await this.client.get<FolderRead[]>('/folders/', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list folders');
    }
  }

  async createFolder(folder: FolderCreate): Promise<FolderRead> {
    try {
      const response = await this.client.post<FolderRead>('/folders/', folder);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create folder');
    }
  }

  async getFolder(folderId: string): Promise<FolderRead> {
    try {
      const response = await this.client.get<FolderRead>(`/folders/${folderId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get folder ${folderId}`);
    }
  }

  async updateFolder(folderId: string, updates: FolderUpdate): Promise<FolderRead> {
    try {
      const response = await this.client.patch<FolderRead>(`/folders/${folderId}`, updates);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to update folder ${folderId}`);
    }
  }

  async deleteFolder(folderId: string): Promise<void> {
    try {
      await this.client.delete(`/folders/${folderId}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete folder ${folderId}`);
    }
  }

  async listProjects(params?: ListProjectsParams): Promise<ProjectRead[]> {
    try {
      const response = await this.client.get<ProjectRead[]>('/projects/', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list projects');
    }
  }

  async createProject(project: ProjectCreate): Promise<ProjectRead> {
    try {
      const response = await this.client.post<ProjectRead>('/projects/', project);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create project');
    }
  }

  async getProject(projectId: string): Promise<ProjectRead> {
    try {
      const response = await this.client.get<ProjectRead>(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get project ${projectId}`);
    }
  }

  async updateProject(projectId: string, updates: ProjectUpdate): Promise<ProjectRead> {
    try {
      const response = await this.client.patch<ProjectRead>(`/projects/${projectId}`, updates);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to update project ${projectId}`);
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    try {
      await this.client.delete(`/projects/${projectId}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete project ${projectId}`);
    }
  }

  async uploadProject(file: Record<string, unknown>): Promise<ProjectRead> {
    try {
      const response = await this.client.post<ProjectRead>('/projects/upload/', file);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to upload project');
    }
  }

  async downloadProject(projectId: string): Promise<any> {
    try {
      const response = await this.client.get(`/projects/download/${projectId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to download project ${projectId}`);
    }
  }

  async listVariables(): Promise<VariableRead[]> {
    try {
      const response = await this.client.get<VariableRead[]>('/variables/');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list variables');
    }
  }

  async createVariable(variable: VariableCreate): Promise<VariableRead> {
    try {
      const response = await this.client.post<VariableRead>('/variables/', variable);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create variable');
    }
  }

  async updateVariable(variableId: string, updates: VariableUpdate): Promise<VariableRead> {
    try {
      const response = await this.client.patch<VariableRead>(`/variables/${variableId}`, updates);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to update variable ${variableId}`);
    }
  }

  async deleteVariable(variableId: string): Promise<void> {
    try {
      await this.client.delete(`/variables/${variableId}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete variable ${variableId}`);
    }
  }

  async buildFlow(flowId: string, request: BuildFlowRequest, params: BuildFlowParams): Promise<BuildFlowResponse> {
    try {
      const response = await this.client.post<BuildFlowResponse>(
        `/build/${flowId}/flow`,
        request,
        { params }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to build flow ${flowId}`);
    }
  }

  async getBuildStatus(jobId: string, eventDelivery: string = 'polling'): Promise<BuildStatusResponse> {
    try {
      const response = await this.client.get<BuildStatusResponse>(
        `/build/${jobId}/events`,
        { params: { event_delivery: eventDelivery } }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get build status for job ${jobId}`);
    }
  }

  async cancelBuild(jobId: string): Promise<CancelBuildResponse> {
    try {
      const response = await this.client.post<CancelBuildResponse>(`/build/${jobId}/cancel`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to cancel build job ${jobId}`);
    }
  }

  async listKnowledgeBases(): Promise<KnowledgeBaseInfo[]> {
    try {
      const response = await this.client.get<KnowledgeBaseInfo[]>('/knowledge_bases');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list knowledge bases');
    }
  }

  async getKnowledgeBase(kbName: string): Promise<KnowledgeBaseInfo> {
    try {
      const response = await this.client.get<KnowledgeBaseInfo>(`/knowledge_bases/${kbName}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get knowledge base ${kbName}`);
    }
  }

  async deleteKnowledgeBase(kbName: string): Promise<void> {
    try {
      await this.client.delete(`/knowledge_bases/${kbName}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete knowledge base ${kbName}`);
    }
  }

  async bulkDeleteKnowledgeBases(kbNames: string[]): Promise<any> {
    try {
      const response = await this.client.delete('/knowledge_bases', {
        data: { kb_names: kbNames }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to bulk delete knowledge bases');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch (error) {
      return false;
    }
  }

  private handleError(error: unknown, message: string): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const data = axiosError.response?.data;

      return new Error(
        `${message}: ${status ? `HTTP ${status}` : 'Network error'} - ${
          data ? JSON.stringify(data) : axiosError.message
        }`
      );
    }

    if (error instanceof Error) {
      return new Error(`${message}: ${error.message}`);
    }

    return new Error(`${message}: Unknown error`);
  }
}
