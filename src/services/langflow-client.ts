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
  RunFlowSessionRequest,
  RegistrationResponse,
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
  BuildVerticesRequest,
  VerticesOrderResponse,
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
  HealthResponse,
  FlowEventCreate,
  ListFlowVersionsParams,
  FlowEventsParams,
  DetectVarsRequest,
  DetectVarsResponse,
  UpdateCustomComponentRequest,
  StoreComponentCreate,
  OpenAIResponsesRequest,
  CreateUserRequest,
  UploadFileV2Params,
  GetFileV2Params,
  CreateKnowledgeBaseRequest,
  ListKnowledgeBaseChunksParams,
  MessageUpdate,
  SharedMessagesParams,
  MigrateSharedSessionParams,
  ListTracesParams,
  ListModelsParams,
  EnabledProvidersParams,
  EnabledModelsParams,
  ModelStatusUpdate,
  DefaultModelTypeParams,
  DefaultModelRequest,
  ValidateProviderRequest,
  ValidateProviderResponse,
  AssistantRequest,
  GetWorkflowResultParams,
  RunWorkflowRequest,
  StopWorkflowResponse,
  ListMcpServersParams,
  MCPProjectConfigParams,
  MCPProjectUpdateRequest,
  MCPInstallRequest,
  WebhookEventsParams,
  MCPServerConfigBody
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
      const response = await this.client.get<FlowRead>(`/flows/${encodeURIComponent(flowId)}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get flow ${flowId}`);
    }
  }

  async updateFlow(flowId: string, updates: FlowUpdate): Promise<FlowRead> {
    try {
      const response = await this.client.patch<FlowRead>(`/flows/${encodeURIComponent(flowId)}`, updates);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to update flow ${flowId}`);
    }
  }

  async deleteFlow(flowId: string): Promise<void> {
    try {
      await this.client.delete(`/flows/${encodeURIComponent(flowId)}`);
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
              // Guard clause: skip if info is null/undefined or not an object
              if (!info || typeof info !== 'object') {
                return;
              }

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
      const response = await this.client.post<RunResponse>(`/run/${encodeURIComponent(flowIdOrName)}`, {
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
      const response = await this.client.post(`/webhook/${encodeURIComponent(flowIdOrName)}`, inputRequest);
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
      const response = await this.client.get<FolderRead>(`/folders/${encodeURIComponent(folderId)}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get folder ${folderId}`);
    }
  }

  async updateFolder(folderId: string, updates: FolderUpdate): Promise<FolderRead> {
    try {
      const response = await this.client.patch<FolderRead>(`/folders/${encodeURIComponent(folderId)}`, updates);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to update folder ${folderId}`);
    }
  }

  async deleteFolder(folderId: string): Promise<void> {
    try {
      await this.client.delete(`/folders/${encodeURIComponent(folderId)}`);
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
      const response = await this.client.get<ProjectRead>(`/projects/${encodeURIComponent(projectId)}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get project ${projectId}`);
    }
  }

  async updateProject(projectId: string, updates: ProjectUpdate): Promise<ProjectRead> {
    try {
      const response = await this.client.patch<ProjectRead>(`/projects/${encodeURIComponent(projectId)}`, updates);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to update project ${projectId}`);
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    try {
      await this.client.delete(`/projects/${encodeURIComponent(projectId)}`);
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
      const response = await this.client.get(`/projects/download/${encodeURIComponent(projectId)}`);
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
      const response = await this.client.patch<VariableRead>(`/variables/${encodeURIComponent(variableId)}`, updates);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to update variable ${variableId}`);
    }
  }

  async deleteVariable(variableId: string): Promise<void> {
    try {
      await this.client.delete(`/variables/${encodeURIComponent(variableId)}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete variable ${variableId}`);
    }
  }

  async buildFlow(flowId: string, request: BuildFlowRequest, params: BuildFlowParams): Promise<BuildFlowResponse> {
    try {
      const response = await this.client.post<BuildFlowResponse>(
        `/build/${encodeURIComponent(flowId)}/flow`,
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
        `/build/${encodeURIComponent(jobId)}/events`,
        { params: { event_delivery: eventDelivery } }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get build status for job ${jobId}`);
    }
  }

  async cancelBuild(jobId: string): Promise<CancelBuildResponse> {
    try {
      const response = await this.client.post<CancelBuildResponse>(`/build/${encodeURIComponent(jobId)}/cancel`);
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

  async uploadFile(params: { flow_id: string; file: any; file_name: string }): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', params.file, params.file_name);

      const response = await this.client.post(`/files/upload/${encodeURIComponent(params.flow_id)}`, formData, {
        headers: {
          ...formData.getHeaders()
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to upload file to flow ${params.flow_id}`);
    }
  }

  async downloadFile(params: { flow_id: string; file_name: string }): Promise<any> {
    try {
      const response = await this.client.get(`/files/download/${encodeURIComponent(params.flow_id)}/${encodeURIComponent(params.file_name)}`, {
        responseType: 'arraybuffer'
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to download file ${params.file_name} from flow ${params.flow_id}`);
    }
  }

  async listFiles(params: { flow_id: string }): Promise<FileListItem[]> {
    try {
      const response = await this.client.get<FileListItem[]>(`/files/list/${encodeURIComponent(params.flow_id)}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to list files for flow ${params.flow_id}`);
    }
  }

  async deleteFile(params: { flow_id: string; file_name: string }): Promise<{ message: string }> {
    try {
      const response = await this.client.delete<{ message: string }>(`/files/delete/${encodeURIComponent(params.flow_id)}/${encodeURIComponent(params.file_name)}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to delete file ${params.file_name} from flow ${params.flow_id}`);
    }
  }

  async getFileImage(params: { flow_id: string; file_name: string }): Promise<any> {
    try {
      const response = await this.client.get(`/files/images/${encodeURIComponent(params.flow_id)}/${encodeURIComponent(params.file_name)}`, {
        responseType: 'arraybuffer'
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get image ${params.file_name} from flow ${params.flow_id}`);
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
      const response = await this.client.get<StoreComponent>(`/store/components/${encodeURIComponent(componentId)}`);
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

  async runFlowAdvanced(
    flowIdOrName: string,
    request: RunFlowAdvancedRequest,
    stream: boolean = false,
    userId?: string
  ): Promise<RunResponse> {
    try {
      const response = await this.client.post<RunResponse>(
        `/run/advanced/${encodeURIComponent(flowIdOrName)}`,
        { ...request, stream },
        userId ? { params: { user_id: userId } } : undefined
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to run flow ${flowIdOrName} (advanced)`);
    }
  }

  async processFlow(flowId: string, request: ProcessFlowRequest): Promise<any> {
    try {
      const response = await this.client.post(`/process/${encodeURIComponent(flowId)}`, request);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to process flow ${flowId}`);
    }
  }

  async predictFlow(flowId: string, request: PredictFlowRequest): Promise<any> {
    try {
      const response = await this.client.post(`/predict/${encodeURIComponent(flowId)}`, request);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to predict flow ${flowId}`);
    }
  }

  async getMonitorBuilds(params: { flow_id: string }): Promise<VertexBuildMapModel> {
    try {
      const response = await this.client.get<VertexBuildMapModel>('/monitor/builds', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get monitor builds for flow ${params.flow_id}`);
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
      const response = await this.client.get<MessageResponse[]>('/monitor/messages');
      const message = response.data.find(m => m.id === messageId);
      if (!message) {
        throw new Error(`Monitor message ${messageId} not found`);
      }
      return message;
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
      const response = await this.client.get<MessageResponse[]>('/monitor/messages', {
        params: { session_id: sessionId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get session messages for ${sessionId}`);
    }
  }

  async migrateMonitorSession(params: MigrateSessionParams): Promise<MessageResponse[]> {
    try {
      const response = await this.client.patch<MessageResponse[]>(
        `/monitor/messages/session/${encodeURIComponent(params.old_session_id)}`,
        null,
        { params: { new_session_id: params.new_session_id } }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to migrate session ${params.old_session_id}`);
    }
  }

  async getMonitorTransactions(params?: MonitorTransactionsParams): Promise<any> {
    try {
      const response = await this.client.get('/monitor/transactions', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get monitor transactions');
    }
  }

  async deleteMonitorBuilds(flowId: string): Promise<void> {
    try {
      await this.client.delete('/monitor/builds', {
        params: { flow_id: flowId }
      });
    } catch (error) {
      throw this.handleError(error, `Failed to delete monitor builds for flow ${flowId}`);
    }
  }

  async deleteMonitorMessages(messageIds: string[]): Promise<any> {
    try {
      const response = await this.client.delete('/monitor/messages', { data: messageIds });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to delete monitor messages');
    }
  }

  async buildVertices(flowId: string, request?: BuildVerticesRequest): Promise<VerticesOrderResponse> {
    try {
      // API 1.7.2: 'data' moved to request body, other params remain in query
      const { data, ...queryParams } = request || {};
      const response = await this.client.post<VerticesOrderResponse>(
        `/build/${encodeURIComponent(flowId)}/vertices`,
        data ? { data } : {},
        { params: queryParams }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to build vertices for flow ${flowId}`);
    }
  }

  async streamVertexBuild(params: StreamVertexBuildParams): Promise<any> {
    try {
      const response = await this.client.get(`/build/${encodeURIComponent(params.flow_id)}/${encodeURIComponent(params.vertex_id)}/stream`);
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

  async updateUser(userId: string, updates: UserUpdate): Promise<UserRead> {
    try {
      const response = await this.client.patch<UserRead>(`/users/${encodeURIComponent(userId)}`, updates);
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
      await this.client.delete(`/api_key/${encodeURIComponent(apiKeyId)}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete API key ${apiKeyId}`);
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
      const response = await this.client.get<FlowRead>(`/flows/public_flow/${encodeURIComponent(flowId)}`);
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
      const response = await this.client.get<TaskStatusResponse>(`/task/${encodeURIComponent(taskId)}`);
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
      await this.client.get('/health', { baseURL: this.config.baseUrl });
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

  async deleteUser(userId: string): Promise<void> {
    try {
      await this.client.delete(`/users/${encodeURIComponent(userId)}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete user ${userId}`);
    }
  }

  async getConfig(): Promise<any> {
    try {
      const response = await this.client.get('/config');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get configuration');
    }
  }

  async buildVertex(params: { flow_id: string; vertex_id: string; inputs?: any }): Promise<any> {
    try {
      const response = await this.client.post(`/build/${encodeURIComponent(params.flow_id)}/vertices/${encodeURIComponent(params.vertex_id)}`, params.inputs || {});
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to build vertex ${params.vertex_id}`);
    }
  }

  async getHealth(): Promise<any> {
    try {
      const response = await this.client.get('/health', { baseURL: this.config.baseUrl });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get health status');
    }
  }

  async updateStoreComponent(componentId: string, updates: any): Promise<any> {
    try {
      const response = await this.client.patch(`/store/components/${encodeURIComponent(componentId)}`, updates);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to update store component ${componentId}`);
    }
  }

  async runFlowSession(
    flowIdOrName: string,
    request: RunFlowSessionRequest,
    stream: boolean = false
  ): Promise<RunResponse> {
    try {
      const response = await this.client.post<RunResponse>(
        `/run/session/${encodeURIComponent(flowIdOrName)}`,
        { ...request, stream }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to run flow session ${flowIdOrName}`);
    }
  }

  async getRegistration(): Promise<RegistrationResponse> {
    try {
      // Registration API is v2
      const response = await this.client.get<RegistrationResponse>('/api/v2/registration/', {
        baseURL: this.config.baseUrl
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get registration status');
    }
  }

  async registerUser(email: string): Promise<RegistrationResponse> {
    try {
      // Registration API is v2
      const response = await this.client.post<RegistrationResponse>(
        '/api/v2/registration/',
        { email },
        { baseURL: this.config.baseUrl }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to register user');
    }
  }

  // --- Flows / Versions / Events ---

  async replaceFlow(flowId: string, body: FlowCreate): Promise<FlowRead> {
    try {
      const response = await this.client.put<FlowRead>(`/flows/${encodeURIComponent(flowId)}`, body);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to replace flow ${flowId}`);
    }
  }

  async expandFlows(body: object): Promise<any> {
    try {
      const response = await this.client.post('/flows/expand/', body);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to expand flows');
    }
  }

  async getFlowEvents(flowId: string, params?: FlowEventsParams): Promise<any> {
    try {
      const response = await this.client.get(`/flows/${encodeURIComponent(flowId)}/events`, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get events for flow ${flowId}`);
    }
  }

  async createFlowEvent(flowId: string, body: FlowEventCreate): Promise<any> {
    try {
      const response = await this.client.post(`/flows/${encodeURIComponent(flowId)}/events`, body);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to create event for flow ${flowId}`);
    }
  }

  async listFlowVersions(flowId: string, params?: ListFlowVersionsParams): Promise<any> {
    try {
      const response = await this.client.get(`/flows/${encodeURIComponent(flowId)}/versions/`, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to list versions for flow ${flowId}`);
    }
  }

  async createFlowVersion(flowId: string, body?: object): Promise<any> {
    try {
      const response = await this.client.post(`/flows/${encodeURIComponent(flowId)}/versions/`, body ?? {});
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to create version for flow ${flowId}`);
    }
  }

  async getFlowVersion(flowId: string, versionId: string): Promise<any> {
    try {
      const response = await this.client.get(
        `/flows/${encodeURIComponent(flowId)}/versions/${encodeURIComponent(versionId)}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get version ${versionId} for flow ${flowId}`);
    }
  }

  async deleteFlowVersion(flowId: string, versionId: string): Promise<void> {
    try {
      await this.client.delete(
        `/flows/${encodeURIComponent(flowId)}/versions/${encodeURIComponent(versionId)}`
      );
    } catch (error) {
      throw this.handleError(error, `Failed to delete version ${versionId} for flow ${flowId}`);
    }
  }

  async activateFlowVersion(
    flowId: string,
    versionId: string,
    params?: { save_draft?: boolean }
  ): Promise<any> {
    try {
      const response = await this.client.post(
        `/flows/${encodeURIComponent(flowId)}/versions/${encodeURIComponent(versionId)}/activate`,
        undefined,
        { params }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to activate version ${versionId} for flow ${flowId}`);
    }
  }

  // --- Variables ---

  async detectVariables(body: DetectVarsRequest): Promise<DetectVarsResponse> {
    try {
      const response = await this.client.post<DetectVarsResponse>('/variables/detections', body);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to detect variables');
    }
  }

  // --- API Key ---

  async saveStoreApiKey(apiKey: string): Promise<any> {
    try {
      const response = await this.client.post('/api_key/store', { api_key: apiKey });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to save store API key');
    }
  }

  // --- Custom Component ---

  async updateCustomComponentCode(body: UpdateCustomComponentRequest): Promise<any> {
    try {
      const response = await this.client.post('/custom_component/update', body);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to update custom component code');
    }
  }

  // --- Store ---

  async createStoreComponent(body: StoreComponentCreate): Promise<{ id: string }> {
    try {
      const response = await this.client.post<{ id: string }>('/store/components/', body);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create store component');
    }
  }

  async likeStoreComponent(componentId: string): Promise<any> {
    try {
      const response = await this.client.post(`/store/users/likes/${encodeURIComponent(componentId)}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to like store component ${componentId}`);
    }
  }

  // --- Responses ---

  async createResponse(body: OpenAIResponsesRequest): Promise<any> {
    try {
      const response = await this.client.post('/responses', body);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create response');
    }
  }

  // --- Session ---

  async getSession(): Promise<any> {
    try {
      const response = await this.client.get('/session');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get session');
    }
  }

  // --- Users ---

  async createUser(body: CreateUserRequest): Promise<UserRead> {
    try {
      const response = await this.client.post<UserRead>('/users/', body);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create user');
    }
  }

  // --- Webhook Events ---

  async getWebhookEvents(flowIdOrName: string, params?: WebhookEventsParams): Promise<any> {
    try {
      const response = await this.client.get(
        `/webhook-events/${encodeURIComponent(flowIdOrName)}`,
        { params }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get webhook events for ${flowIdOrName}`);
    }
  }

  // --- Health (root) ---

  async getHealthCheck(): Promise<any> {
    try {
      const response = await this.client.get('/health_check', { baseURL: this.config.baseUrl });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get health check');
    }
  }

  // --- Files V1 (legacy) ---

  async uploadFlowFileLegacy(flowId: string, file: Buffer, fileName: string): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file, fileName);

      const response = await this.client.post(`/upload/${encodeURIComponent(flowId)}`, formData, {
        headers: {
          ...formData.getHeaders()
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to upload legacy file to flow ${flowId}`);
    }
  }

  // --- Files V2 (root /api/v2) ---

  async listFilesV2(): Promise<any[]> {
    try {
      const response = await this.client.get<any[]>('/api/v2/files', { baseURL: this.config.baseUrl });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list files (v2)');
    }
  }

  async uploadFileV2(file: Buffer, fileName: string, params?: UploadFileV2Params): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file, fileName);

      const response = await this.client.post('/api/v2/files', formData, {
        baseURL: this.config.baseUrl,
        params,
        headers: {
          ...formData.getHeaders()
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to upload file (v2)');
    }
  }

  async getFileV2(fileId: string, params?: GetFileV2Params): Promise<any> {
    try {
      const response = await this.client.get(`/api/v2/files/${encodeURIComponent(fileId)}`, {
        baseURL: this.config.baseUrl,
        params
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get file ${fileId} (v2)`);
    }
  }

  async renameFileV2(fileId: string, name: string): Promise<any> {
    try {
      const response = await this.client.put(`/api/v2/files/${encodeURIComponent(fileId)}`, undefined, {
        baseURL: this.config.baseUrl,
        params: { name }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to rename file ${fileId} (v2)`);
    }
  }

  async deleteFileV2(fileId: string): Promise<any> {
    try {
      const response = await this.client.delete(`/api/v2/files/${encodeURIComponent(fileId)}`, {
        baseURL: this.config.baseUrl
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to delete file ${fileId} (v2)`);
    }
  }

  async deleteAllFilesV2(): Promise<any> {
    try {
      const response = await this.client.delete('/api/v2/files', { baseURL: this.config.baseUrl });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to delete all files (v2)');
    }
  }

  async batchDownloadFilesV2(fileIds: string[]): Promise<any> {
    try {
      const response = await this.client.post('/api/v2/files/batch/', fileIds, {
        baseURL: this.config.baseUrl
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to batch download files (v2)');
    }
  }

  async batchDeleteFilesV2(fileIds: string[]): Promise<any> {
    try {
      const response = await this.client.delete('/api/v2/files/batch/', {
        baseURL: this.config.baseUrl,
        data: fileIds
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to batch delete files (v2)');
    }
  }

  // --- Knowledge Bases (extras) ---

  async listKnowledgeBasesDetailed(): Promise<any[]> {
    try {
      const response = await this.client.get<any[]>('/knowledge_bases/');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list knowledge bases (detailed)');
    }
  }

  async createKnowledgeBase(body: CreateKnowledgeBaseRequest): Promise<any> {
    try {
      const response = await this.client.post('/knowledge_bases', body);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create knowledge base');
    }
  }

  async previewKnowledgeBaseChunks(files: Buffer[], body?: Record<string, any>): Promise<any> {
    try {
      const formData = new FormData();
      files.forEach((file, idx) => {
        formData.append('files', file, `file-${idx}`);
      });
      if (body) {
        Object.entries(body).forEach(([key, value]) => {
          formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
        });
      }

      const response = await this.client.post('/knowledge_bases/preview-chunks', formData, {
        headers: {
          ...formData.getHeaders()
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to preview knowledge base chunks');
    }
  }

  async listKnowledgeBaseChunks(kbName: string, params?: ListKnowledgeBaseChunksParams): Promise<any> {
    try {
      const response = await this.client.get(
        `/knowledge_bases/${encodeURIComponent(kbName)}/chunks`,
        { params }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to list chunks for knowledge base ${kbName}`);
    }
  }

  async ingestKnowledgeBase(kbName: string, body: Record<string, any>): Promise<any> {
    try {
      const formData = new FormData();
      let fileIdx = 0;
      Object.entries(body).forEach(([key, value]) => {
        if (Buffer.isBuffer(value)) {
          formData.append('files', value, `file-${fileIdx++}`);
        } else {
          formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
        }
      });

      const response = await this.client.post(
        `/knowledge_bases/${encodeURIComponent(kbName)}/ingest`,
        formData,
        {
          headers: {
            ...formData.getHeaders()
          }
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to ingest knowledge base ${kbName}`);
    }
  }

  async cancelKnowledgeBaseIngest(kbName: string): Promise<any> {
    try {
      const response = await this.client.post(`/knowledge_bases/${encodeURIComponent(kbName)}/cancel`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to cancel ingest for knowledge base ${kbName}`);
    }
  }

  // --- Monitor (extras) ---

  async updateMonitorMessage(messageId: string, body: MessageUpdate): Promise<any> {
    try {
      const response = await this.client.put(
        `/monitor/messages/${encodeURIComponent(messageId)}`,
        body
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to update monitor message ${messageId}`);
    }
  }

  async deleteMonitorSessionMessages(sessionId: string): Promise<any> {
    try {
      const response = await this.client.delete(
        `/monitor/messages/session/${encodeURIComponent(sessionId)}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to delete messages for session ${sessionId}`);
    }
  }

  async deleteMonitorSessions(sessionIds: string[]): Promise<any> {
    try {
      const response = await this.client.delete('/monitor/messages/sessions', { data: sessionIds });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to delete monitor sessions');
    }
  }

  // --- Monitor Shared ---

  async getSharedMessages(params: SharedMessagesParams): Promise<any[]> {
    try {
      const response = await this.client.get<any[]>('/monitor/messages/shared', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get shared messages');
    }
  }

  async getSharedSessions(sourceFlowId: string): Promise<string[]> {
    try {
      const response = await this.client.get<string[]>('/monitor/messages/shared/sessions', {
        params: { source_flow_id: sourceFlowId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get shared sessions');
    }
  }

  async updateSharedMessage(
    messageId: string,
    sourceFlowId: string,
    body: MessageUpdate
  ): Promise<any> {
    try {
      const response = await this.client.put(
        `/monitor/messages/shared/${encodeURIComponent(messageId)}`,
        body,
        { params: { source_flow_id: sourceFlowId } }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to update shared message ${messageId}`);
    }
  }

  async migrateSharedSession(oldSessionId: string, params: MigrateSharedSessionParams): Promise<any[]> {
    try {
      const response = await this.client.patch<any[]>(
        `/monitor/messages/shared/session/${encodeURIComponent(oldSessionId)}`,
        null,
        { params }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to migrate shared session ${oldSessionId}`);
    }
  }

  async deleteSharedSession(sessionId: string, sourceFlowId: string): Promise<any> {
    try {
      const response = await this.client.delete(
        `/monitor/messages/shared/session/${encodeURIComponent(sessionId)}`,
        { params: { source_flow_id: sourceFlowId } }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to delete shared session ${sessionId}`);
    }
  }

  // --- Monitor Traces ---

  async listTraces(params?: ListTracesParams): Promise<any> {
    try {
      const response = await this.client.get('/monitor/traces', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list traces');
    }
  }

  async deleteTraces(flowId: string): Promise<any> {
    try {
      const response = await this.client.delete('/monitor/traces', { params: { flow_id: flowId } });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to delete traces for flow ${flowId}`);
    }
  }

  async getTrace(traceId: string): Promise<any> {
    try {
      const response = await this.client.get(`/monitor/traces/${encodeURIComponent(traceId)}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get trace ${traceId}`);
    }
  }

  async deleteTrace(traceId: string): Promise<void> {
    try {
      await this.client.delete(`/monitor/traces/${encodeURIComponent(traceId)}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete trace ${traceId}`);
    }
  }

  // --- Models ---

  async listModels(params?: ListModelsParams): Promise<any> {
    try {
      const response = await this.client.get('/models', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list models');
    }
  }

  async listModelProviders(): Promise<string[]> {
    try {
      const response = await this.client.get<string[]>('/models/providers');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list model providers');
    }
  }

  async listEnabledProviders(params?: EnabledProvidersParams): Promise<any> {
    try {
      const response = await this.client.get('/models/enabled_providers', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list enabled providers');
    }
  }

  async listEnabledModels(params?: EnabledModelsParams): Promise<any> {
    try {
      const response = await this.client.get('/models/enabled_models', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list enabled models');
    }
  }

  async setEnabledModels(body: ModelStatusUpdate[]): Promise<any> {
    try {
      const response = await this.client.post('/models/enabled_models', body);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to set enabled models');
    }
  }

  async getDefaultModel(params: DefaultModelTypeParams): Promise<any> {
    try {
      const response = await this.client.get('/models/default_model', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get default model');
    }
  }

  async setDefaultModel(body: DefaultModelRequest): Promise<any> {
    try {
      const response = await this.client.post('/models/default_model', body);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to set default model');
    }
  }

  async deleteDefaultModel(params: DefaultModelTypeParams): Promise<any> {
    try {
      const response = await this.client.delete('/models/default_model', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to delete default model');
    }
  }

  async getProviderVariableMapping(): Promise<any> {
    try {
      const response = await this.client.get('/models/provider-variable-mapping');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get provider variable mapping');
    }
  }

  async validateModelProvider(body: ValidateProviderRequest): Promise<ValidateProviderResponse> {
    try {
      const response = await this.client.post<ValidateProviderResponse>('/models/validate-provider', body);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to validate model provider');
    }
  }

  // --- Model Options ---

  async getLanguageModelOptions(): Promise<any> {
    try {
      const response = await this.client.get('/model_options/language');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get language model options');
    }
  }

  async getEmbeddingModelOptions(): Promise<any> {
    try {
      const response = await this.client.get('/model_options/embedding');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get embedding model options');
    }
  }

  // --- Agentic ---

  async agenticAssist(body: AssistantRequest): Promise<any> {
    try {
      const response = await this.client.post('/agentic/assist', body);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to run agentic assist');
    }
  }

  async agenticCheckConfig(): Promise<any> {
    try {
      const response = await this.client.get('/agentic/check-config');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to check agentic config');
    }
  }

  async agenticExecute(flowName: string, body: AssistantRequest): Promise<any> {
    try {
      const response = await this.client.post(
        `/agentic/execute/${encodeURIComponent(flowName)}`,
        body
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to run agentic execute for flow ${flowName}`);
    }
  }

  // --- Workflows V2 (root) ---

  async getWorkflowResult(params?: GetWorkflowResultParams): Promise<any> {
    try {
      const response = await this.client.get('/api/v2/workflows', {
        baseURL: this.config.baseUrl,
        params
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get workflow result');
    }
  }

  async runWorkflow(body: RunWorkflowRequest): Promise<any> {
    try {
      const response = await this.client.post('/api/v2/workflows', body, {
        baseURL: this.config.baseUrl
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to run workflow');
    }
  }

  async stopWorkflow(jobId: string): Promise<StopWorkflowResponse> {
    try {
      const response = await this.client.post<StopWorkflowResponse>(
        '/api/v2/workflows/stop',
        { job_id: jobId },
        { baseURL: this.config.baseUrl }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to stop workflow ${jobId}`);
    }
  }

  // --- MCP V2 Servers (root /api/v2/mcp) ---

  async listMcpServers(params?: ListMcpServersParams): Promise<any> {
    try {
      const response = await this.client.get('/api/v2/mcp/servers', {
        baseURL: this.config.baseUrl,
        params
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list MCP servers');
    }
  }

  async getMcpServer(serverName: string): Promise<any> {
    try {
      const response = await this.client.get(`/api/v2/mcp/servers/${encodeURIComponent(serverName)}`, {
        baseURL: this.config.baseUrl
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get MCP server ${serverName}`);
    }
  }

  async createMcpServer(serverName: string, body: MCPServerConfigBody): Promise<any> {
    try {
      const response = await this.client.post(
        `/api/v2/mcp/servers/${encodeURIComponent(serverName)}`,
        body,
        { baseURL: this.config.baseUrl }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to create MCP server ${serverName}`);
    }
  }

  async updateMcpServer(serverName: string, body: MCPServerConfigBody): Promise<any> {
    try {
      const response = await this.client.patch(
        `/api/v2/mcp/servers/${encodeURIComponent(serverName)}`,
        body,
        { baseURL: this.config.baseUrl }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to update MCP server ${serverName}`);
    }
  }

  async deleteMcpServer(serverName: string): Promise<any> {
    try {
      const response = await this.client.delete(
        `/api/v2/mcp/servers/${encodeURIComponent(serverName)}`,
        { baseURL: this.config.baseUrl }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to delete MCP server ${serverName}`);
    }
  }

  // --- MCP V1 Project (management only) ---

  async getMcpProjectConfig(projectId: string, params?: MCPProjectConfigParams): Promise<any> {
    try {
      const response = await this.client.get(`/mcp/project/${encodeURIComponent(projectId)}`, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get MCP project config ${projectId}`);
    }
  }

  async updateMcpProjectConfig(projectId: string, body: MCPProjectUpdateRequest): Promise<any> {
    try {
      const response = await this.client.patch(`/mcp/project/${encodeURIComponent(projectId)}`, body);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to update MCP project config ${projectId}`);
    }
  }

  async getMcpProjectInstalled(projectId: string): Promise<any> {
    try {
      const response = await this.client.get(`/mcp/project/${encodeURIComponent(projectId)}/installed`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get MCP project installed ${projectId}`);
    }
  }

  async installMcpProject(projectId: string, body: MCPInstallRequest): Promise<any> {
    try {
      const response = await this.client.post(
        `/mcp/project/${encodeURIComponent(projectId)}/install`,
        body
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to install MCP project ${projectId}`);
    }
  }

  async getMcpProjectComposerUrl(projectId: string): Promise<any> {
    try {
      const response = await this.client.get(`/mcp/project/${encodeURIComponent(projectId)}/composer-url`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get MCP project composer URL ${projectId}`);
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
          'authorization', 'api_key', 'x-api-key', 'password', 'new_password', 'token',
          'access_token', 'refresh_token', 'secret', 'api-key',
          'bearer', 'private_key', 'session_id', 'cookie', 'set-cookie',
          'x-store-api-key'
        ]);

        if (!val || typeof val !== 'object') return val;
        if (depth > MAX_DEPTH) return '[max depth exceeded]';

        // Check for binary data (Buffer, ArrayBuffer, TypedArray)
        if (Buffer.isBuffer(val) || val instanceof ArrayBuffer || ArrayBuffer.isView(val)) {
          return '[binary data]';
        }

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
