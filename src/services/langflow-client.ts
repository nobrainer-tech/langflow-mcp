import axios, { AxiosInstance, AxiosError } from 'axios';
import FormData from 'form-data';
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
  BulkDeleteKnowledgeBasesRequest,
  FileListItem,
  ValidateCodeRequest,
  ValidateCodeResponse,
  ValidatePromptRequest,
  ValidatePromptResponse,
  StoreComponent,
  ListStoreComponentsParams,
  StoreTag,
  UserLike,
  RunFlowAdvancedRequest,
  ProcessFlowRequest,
  PredictFlowRequest,
  MonitorBuildsParams,
  VertexBuildMapModel,
  MonitorMessagesParams,
  MessageResponse,
  MonitorSessionsParams,
  DeleteMonitorMessagesRequest,
  MigrateSessionParams,
  MonitorTransactionsParams,
  TransactionResponse,
  BuildVerticesRequest,
  VerticesOrderResponse,
  GetVertexParams,
  StreamVertexBuildParams,
  VersionResponse,
  UserRead,
  UserCreate,
  UserUpdate,
  ListUsersParams,
  ApiKeyRead,
  ApiKeyCreate,
  CustomComponentRead,
  CustomComponentCreate,
  LoginRequest,
  LoginResponse,
  BatchFlowCreate,
  TaskStatusResponse,
  StarterProject,
  ElevenLabsVoice,
  HealthResponse
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

  async getBuildStatus(jobId: string, eventDelivery: 'polling' | 'streaming' | 'direct' = 'polling'): Promise<BuildStatusResponse> {
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
      const response = await this.client.get<KnowledgeBaseInfo>(`/knowledge_bases/${encodeURIComponent(kbName)}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get knowledge base ${kbName}`);
    }
  }

  async deleteKnowledgeBase(kbName: string): Promise<void> {
    try {
      await this.client.delete(`/knowledge_bases/${encodeURIComponent(kbName)}`);
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

  async uploadFile(flowId: string, fileContent: Buffer, fileName: string): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', fileContent, fileName);

      const response = await this.client.post(`/files/upload/${flowId}`, formData, {
        headers: {
          ...formData.getHeaders()
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to upload file to flow ${flowId}`);
    }
  }

  async downloadFile(flowId: string, fileName: string): Promise<any> {
    try {
      const response = await this.client.get(`/files/download/${flowId}/${fileName}`, {
        responseType: 'arraybuffer'
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to download file ${fileName} from flow ${flowId}`);
    }
  }

  async listFiles(flowId: string): Promise<FileListItem[]> {
    try {
      const response = await this.client.get<FileListItem[]>(`/files/list/${flowId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to list files for flow ${flowId}`);
    }
  }

  async deleteFile(flowId: string, fileName: string): Promise<void> {
    try {
      await this.client.delete(`/files/delete/${flowId}/${fileName}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete file ${fileName} from flow ${flowId}`);
    }
  }

  async getFileImage(flowId: string, fileName: string): Promise<any> {
    try {
      const response = await this.client.get(`/files/images/${flowId}/${fileName}`, {
        responseType: 'arraybuffer'
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get image ${fileName} from flow ${flowId}`);
    }
  }

  async listProfilePictures(): Promise<string[]> {
    try {
      const response = await this.client.get<string[]>('/files/profile_pictures/list');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list profile pictures');
    }
  }

  async getProfilePicture(folderName: string, fileName: string): Promise<any> {
    try {
      const response = await this.client.get(`/files/profile_pictures/${folderName}/${fileName}`, {
        responseType: 'arraybuffer'
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get profile picture ${folderName}/${fileName}`);
    }
  }

  async validateCode(code: string): Promise<ValidateCodeResponse> {
    try {
      const response = await this.client.post<ValidateCodeResponse>('/validate/code', { code });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to validate code');
    }
  }

  async validatePrompt(prompt: string): Promise<ValidatePromptResponse> {
    try {
      const response = await this.client.post<ValidatePromptResponse>('/validate/prompt', { prompt });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to validate prompt');
    }
  }

  async checkStore(): Promise<any> {
    try {
      const response = await this.client.get('/store/check/');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to check store availability');
    }
  }

  async checkStoreApiKey(apiKey: string): Promise<any> {
    try {
      const response = await this.client.get('/store/check/api_key', {
        headers: {
          'x-store-api-key': apiKey
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to check store API key');
    }
  }

  async listStoreComponents(params?: ListStoreComponentsParams): Promise<StoreComponent[]> {
    try {
      const response = await this.client.get<StoreComponent[]>('/store/components/', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list store components');
    }
  }

  async getStoreComponent(componentId: string): Promise<StoreComponent> {
    try {
      const response = await this.client.get<StoreComponent>(`/store/components/${componentId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get store component ${componentId}`);
    }
  }

  async listStoreTags(): Promise<StoreTag[]> {
    try {
      const response = await this.client.get<StoreTag[]>('/store/tags');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list store tags');
    }
  }

  async getUserLikes(): Promise<UserLike[]> {
    try {
      const response = await this.client.get<UserLike[]>('/store/users/likes');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get user likes');
    }
  }

  async runFlowAdvanced(flowId: string, request: RunFlowAdvancedRequest, stream: boolean = false): Promise<RunResponse> {
    try {
      const response = await this.client.post<RunResponse>(`/run/advanced/${flowId}`, {
        ...request,
        stream
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to run flow ${flowId} (advanced)`);
    }
  }

  async processFlow(flowId: string, request: ProcessFlowRequest): Promise<any> {
    try {
      const response = await this.client.post(`/process/${flowId}`, request);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to process flow ${flowId}`);
    }
  }

  async predictFlow(flowId: string, request: PredictFlowRequest): Promise<any> {
    try {
      const response = await this.client.post(`/predict/${flowId}`, request);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to predict flow ${flowId}`);
    }
  }

  async getMonitorBuilds(params: MonitorBuildsParams): Promise<VertexBuildMapModel> {
    try {
      const response = await this.client.get<VertexBuildMapModel>('/monitor/builds', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get monitor builds');
    }
  }

  async getMonitorMessages(params?: MonitorMessagesParams): Promise<MessageResponse[]> {
    try {
      const response = await this.client.get<MessageResponse[]>('/monitor/messages', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get monitor messages');
    }
  }

  async getMonitorMessage(messageId: string): Promise<MessageResponse> {
    try {
      const response = await this.client.get<MessageResponse>(`/monitor/messages/${messageId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get monitor message ${messageId}`);
    }
  }

  async getMonitorSessions(params?: MonitorSessionsParams): Promise<string[]> {
    try {
      const response = await this.client.get<string[]>('/monitor/messages/sessions', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get monitor sessions');
    }
  }

  async getMonitorSessionMessages(sessionId: string): Promise<MessageResponse[]> {
    try {
      const response = await this.client.get<MessageResponse[]>(`/monitor/messages/session/${sessionId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get session messages for ${sessionId}`);
    }
  }

  async migrateMonitorSession(params: MigrateSessionParams): Promise<MessageResponse[]> {
    try {
      const response = await this.client.patch<MessageResponse[]>(
        `/monitor/messages/session/${params.old_session_id}`,
        null,
        { params: { new_session_id: params.new_session_id } }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to migrate session ${params.old_session_id}`);
    }
  }

  async getMonitorTransactions(params: MonitorTransactionsParams): Promise<any> {
    try {
      const response = await this.client.get('/monitor/transactions', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get monitor transactions');
    }
  }

  async deleteMonitorBuilds(flowId: string): Promise<void> {
    try {
      await this.client.delete('/monitor/builds', { params: { flow_id: flowId } });
    } catch (error) {
      throw this.handleError(error, 'Failed to delete monitor builds');
    }
  }

  async deleteMonitorMessages(messageIds: string[]): Promise<void> {
    try {
      await this.client.delete('/monitor/messages', { data: messageIds });
    } catch (error) {
      throw this.handleError(error, 'Failed to delete monitor messages');
    }
  }

  async buildVertices(flowId: string, request?: BuildVerticesRequest): Promise<VerticesOrderResponse> {
    try {
      const response = await this.client.post<VerticesOrderResponse>(
        `/build/${flowId}/vertices`,
        request || {}
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to build vertices for flow ${flowId}`);
    }
  }

  async getVertex(params: GetVertexParams): Promise<any> {
    try {
      const response = await this.client.get(`/build/${params.flow_id}/vertices/${params.vertex_id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get vertex ${params.vertex_id}`);
    }
  }

  async streamVertexBuild(params: StreamVertexBuildParams): Promise<any> {
    try {
      const response = await this.client.get(`/build/${params.flow_id}/${params.vertex_id}/stream`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to stream vertex build ${params.vertex_id}`);
    }
  }

  async getVersion(): Promise<VersionResponse> {
    try {
      const response = await this.client.get<VersionResponse>('/version');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get version');
    }
  }

  async listUsers(params?: ListUsersParams): Promise<UserRead[]> {
    try {
      const response = await this.client.get<UserRead[]>('/users/', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list users');
    }
  }

  async getCurrentUser(): Promise<UserRead> {
    try {
      const response = await this.client.get<UserRead>('/users/whoami');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get current user');
    }
  }

  async getUser(userId: string): Promise<UserRead> {
    try {
      const response = await this.client.get<UserRead>(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get user ${userId}`);
    }
  }

  async updateUser(userId: string, updates: UserUpdate): Promise<UserRead> {
    try {
      const response = await this.client.patch<UserRead>(`/users/${userId}`, updates);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to update user ${userId}`);
    }
  }

  async resetUserPassword(userId: string, newPassword: string): Promise<UserRead> {
    try {
      const response = await this.client.patch<UserRead>(`/users/${userId}/reset-password`, {
        password: newPassword
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to reset password for user ${userId}`);
    }
  }

  async listApiKeys(): Promise<ApiKeyRead[]> {
    try {
      const response = await this.client.get<ApiKeyRead[]>('/api_key/');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list API keys');
    }
  }

  async createApiKey(name: string): Promise<ApiKeyRead> {
    try {
      const response = await this.client.post<ApiKeyRead>('/api_key/', { name });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create API key');
    }
  }

  async deleteApiKey(apiKeyId: string): Promise<void> {
    try {
      await this.client.delete(`/api_key/${apiKeyId}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete API key ${apiKeyId}`);
    }
  }

  async listCustomComponents(): Promise<CustomComponentRead[]> {
    try {
      const response = await this.client.get<CustomComponentRead[]>('/custom_component');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list custom components');
    }
  }

  async createCustomComponent(component: CustomComponentCreate): Promise<CustomComponentRead> {
    try {
      const response = await this.client.post<CustomComponentRead>('/custom_component', component);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create custom component');
    }
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await this.client.post<LoginResponse>('/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to login');
    }
  }

  async autoLogin(): Promise<LoginResponse> {
    try {
      const response = await this.client.get<LoginResponse>('/auto_login');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to auto login');
    }
  }

  async refreshToken(): Promise<LoginResponse> {
    try {
      const response = await this.client.post<LoginResponse>('/refresh');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to refresh token');
    }
  }

  async logout(): Promise<{ message: string }> {
    try {
      const response = await this.client.post<{ message: string }>('/logout');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to logout');
    }
  }

  async getPublicFlow(flowId: string): Promise<FlowRead> {
    try {
      const response = await this.client.get<FlowRead>(`/flows/public_flow/${flowId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get public flow ${flowId}`);
    }
  }

  async batchCreateFlows(flows: FlowCreate[]): Promise<FlowRead[]> {
    try {
      const response = await this.client.post<FlowRead[]>('/flows/batch/', flows);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to batch create flows');
    }
  }

  async getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
    try {
      const response = await this.client.get<TaskStatusResponse>(`/task/${taskId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get task status ${taskId}`);
    }
  }

  async downloadFolder(folderId: string): Promise<any> {
    try {
      const response = await this.client.get(`/folders/download/${folderId}`, {
        responseType: 'arraybuffer'
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to download folder ${folderId}`);
    }
  }

  async uploadFolder(fileContent: Buffer, fileName: string): Promise<FolderRead> {
    try {
      const formData = new FormData();
      formData.append('file', fileContent, fileName);

      const response = await this.client.post<FolderRead>('/folders/upload/', formData, {
        headers: {
          ...formData.getHeaders()
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to upload folder');
    }
  }

  async listStarterProjects(): Promise<StarterProject[]> {
    try {
      const response = await this.client.get<StarterProject[]>('/starter-projects/');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list starter projects');
    }
  }

  async uploadKnowledgeBase(kbName: string, fileContent: Buffer, fileName: string): Promise<KnowledgeBaseInfo> {
    try {
      const formData = new FormData();
      formData.append('file', fileContent, fileName);

      const response = await this.client.post<KnowledgeBaseInfo>('/knowledge_bases/', formData, {
        params: { kb_name: kbName },
        headers: {
          ...formData.getHeaders()
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to upload knowledge base ${kbName}`);
    }
  }

  async listElevenLabsVoices(): Promise<ElevenLabsVoice[]> {
    try {
      const response = await this.client.get<ElevenLabsVoice[]>('/voice/elevenlabs/voice_ids');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list ElevenLabs voices');
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

  async getLogs(stream: boolean = false): Promise<any> {
    try {
      const endpoint = stream ? '/logs-stream' : '/logs';
      const response = await this.client.get(endpoint, {
        responseType: stream ? 'stream' : 'json'
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get logs');
    }
  }

  private handleError(error: unknown, message: string): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const data = axiosError.response?.data;

      // Sanitize sensitive data with circular reference and depth protection
      const sanitize = (val: any, depth = 0, seen = new WeakSet()): any => {
        const MAX_DEPTH = 10;
        const SENSITIVE_KEYS = new Set([
          'authorization', 'api_key', 'x-api-key', 'password', 'token',
          'access_token', 'refresh_token', 'secret', 'api-key',
          'bearer', 'private_key', 'session_id', 'cookie'
        ]);

        if (!val || typeof val !== 'object') return val;
        if (depth > MAX_DEPTH) return '[max depth exceeded]';
        if (Buffer.isBuffer(val) || val instanceof ArrayBuffer) return '[binary data]';

        // Circular reference detection
        if (seen.has(val)) return '[circular reference]';
        seen.add(val);

        if (Array.isArray(val)) return val.map(v => sanitize(v, depth + 1, seen));

        return Object.fromEntries(
          Object.entries(val).map(([k, v]) =>
            [k, SENSITIVE_KEYS.has(k.toLowerCase()) ? '***REDACTED***' : sanitize(v, depth + 1, seen)]
          )
        );
      };

      const safeData = data ? sanitize(data) : undefined;

      return new Error(
        `${message}: ${status ? `HTTP ${status}` : 'Network error'} - ${
          safeData ? JSON.stringify(safeData) : axiosError.message
        }`
      );
    }

    if (error instanceof Error) {
      return new Error(`${message}: ${error.message}`);
    }

    return new Error(`${message}: Unknown error`);
  }
}
