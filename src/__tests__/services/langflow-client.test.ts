import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios, { AxiosInstance } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { LangflowClient } from '../../services/langflow-client';
import { LangflowConfig } from '../../types';
import {
  mockFlowCreate,
  mockFlowRead,
  mockFlowUpdate,
  mockFlowsList
} from '../fixtures/flows';
import { mockComponentsApiResponse, mockComponentsList } from '../fixtures/components';
import {
  mockRunFlowRequest,
  mockRunResponse,
  mockWebhookRequest,
  mockWebhookResponse,
  mockUploadFile,
  mockDownloadResponse
} from '../fixtures/run';
import {
  mockFolderCreate,
  mockFolderRead,
  mockFolderUpdate,
  mockFoldersList
} from '../fixtures/folders';
import {
  mockProjectCreate,
  mockProjectRead,
  mockProjectUpdate,
  mockProjectsList
} from '../fixtures/projects';
import {
  mockVariableCreate,
  mockVariableRead,
  mockVariableUpdate,
  mockVariablesList
} from '../fixtures/variables';
import {
  mockBuildFlowRequest,
  mockBuildFlowParams,
  mockBuildFlowResponse,
  mockBuildStatusResponse,
  mockCompletedBuildStatus,
  mockFailedBuildStatus,
  mockCancelBuildResponse,
  mockCancelBuildAlreadyCompleted,
  mockMinimalBuildRequest,
  mockMinimalBuildParams
} from '../fixtures/build';
import {
  mockKnowledgeBaseInfo,
  mockKnowledgeBasesList,
  mockEmptyKnowledgeBasesList,
  mockBulkDeleteResponse,
  mockPartialBulkDeleteResponse,
  mockDeleteResponse
} from '../fixtures/knowledge-bases';
import {
  mockVertexBuildMap,
  mockMessageResponse,
  mockMessagesList,
  mockSessionsList,
  mockMonitorMessagesParams,
  mockMonitorSessionsParams,
  mockMigrateSessionParams,
  mockTransactionResponse,
  mockTransactionsList,
  mockMonitorTransactionsParams,
  mockMonitorBuildsParams
} from '../fixtures/monitoring';
import {
  mockFileListItem,
  mockFilesList,
  mockFileUploadResponse,
  mockFileBuffer,
  mockImageBuffer,
  mockProfilePicturesList
} from '../fixtures/files';
import {
  mockValidCodeResponse,
  mockInvalidCodeResponse,
  mockValidPromptResponse,
  mockInvalidPromptResponse
} from '../fixtures/validation';
import {
  mockStoreComponent,
  mockStoreComponentsList,
  mockStoreTagsList,
  mockUserLikesList,
  mockCheckStoreResponse,
  mockCheckStoreApiKeyResponse
} from '../fixtures/store';
import {
  mockRunFlowAdvancedRequest,
  mockRunFlowAdvancedResponse,
  mockProcessFlowRequest,
  mockProcessFlowResponse,
  mockPredictFlowRequest,
  mockPredictFlowResponse
} from '../fixtures/advanced-execution';
import {
  mockBuildVerticesRequest,
  mockVerticesOrderResponse,
  mockVertexResponse,
  mockStreamVertexBuildParams,
  mockStreamVertexResponse
} from '../fixtures/vertices';
import {
  mockUserRead,
  mockUserCreate,
  mockUserUpdate,
  mockUsersList,
  mockListUsersParams,
  mockPasswordResetResponse
} from '../fixtures/users';
import {
  mockApiKeyRead,
  mockApiKeyCreate,
  mockApiKeyWithToken,
  mockApiKeysList
} from '../fixtures/api-keys';
import {
  mockCustomComponentCreate,
  mockCustomComponentRead,
  mockCustomComponentsList
} from '../fixtures/custom-components';
import {
  mockLoginRequest,
  mockLoginResponse,
  mockAutoLoginResponse,
  mockRefreshTokenResponse,
  mockLogoutResponse
} from '../fixtures/auth';
import {
  mockVersionResponse,
  mockTaskStatusResponse,
  mockTaskStatusPending,
  mockTaskStatusFailed,
  mockStarterProjectsList,
  mockElevenLabsVoicesList,
  mockHealthResponse,
  mockLogsResponse
} from '../fixtures/misc';

// Mock aliases for new endpoints
const mockMonitorBuild = { id: 'build-123', flow_id: 'flow-123', status: 'completed', created_at: '2024-01-01T00:00:00Z' };
const mockMonitorMessage = mockMessageResponse;
const mockMonitorTransaction = mockTransactionResponse;
const mockVertexBuild = mockVertexResponse;
const mockFileMetadata = mockFileUploadResponse;
const mockFileContent = Buffer.from('test file content').toString('base64');
const mockDownloadedFile = { file_name: mockFileUploadResponse.file_name, content: mockFileContent };
const mockFileList = mockFilesList;
const mockValidationSuccess = mockValidCodeResponse;
const mockValidationError = mockInvalidCodeResponse;
const mockStoreInstallResponse = { success: true, component_id: mockStoreComponent.id };
const mockAdvancedExecutionResult = mockRunFlowAdvancedResponse;
const mockUser = mockUserRead;
const mockApiKey = mockApiKeyRead;
const mockCustomComponent = mockCustomComponentRead;
const mockAuthResponse = mockLoginResponse;
const mockVersionInfo = mockVersionResponse;
const mockHealthStatus = mockHealthResponse;
const mockLogs = mockLogsResponse;
const mockConfig = { max_workers: 4, timeout: 300 };
const mockStats = { total_flows: 100, total_users: 50, total_executions: 1000 };
const mockExportedFlow = { flow: mockFlowRead, metadata: { version: '1.0.0' } };
const mockFlow = mockFlowRead;
const mockFlowDependencies = { dependencies: ['axios', 'zod'], versions: { axios: '1.0.0', zod: '3.0.0' } };
const mockAiNode = { id: 'ai-node-1', name: 'GPT-4', type: 'llm', provider: 'openai' };

describe('LangflowClient', () => {
  let client: LangflowClient;
  let mock: MockAdapter;
  const config: LangflowConfig = {
    baseUrl: 'http://localhost:7860',
    apiKey: 'test-api-key',
    timeout: 30000
  };

  beforeEach(() => {
    client = new LangflowClient(config);
    mock = new MockAdapter((client as any).client as AxiosInstance);
  });

  describe('constructor', () => {
    it('should create axios instance with correct config', () => {
      const axiosClient = (client as any).client as AxiosInstance;

      expect(axiosClient.defaults.baseURL).toBe('http://localhost:7860/api/v1');
      expect(axiosClient.defaults.timeout).toBe(30000);
      expect(axiosClient.defaults.headers['Content-Type']).toBe('application/json');
      expect(axiosClient.defaults.headers['x-api-key']).toBe('test-api-key');
    });
  });

  describe('createFlow', () => {
    it('should create a flow successfully', async () => {
      mock.onPost('/flows/').reply(200, mockFlowRead);

      const result = await client.createFlow(mockFlowCreate);

      expect(result).toEqual(mockFlowRead);
      expect(mock.history.post[0].data).toBe(JSON.stringify(mockFlowCreate));
    });

    it('should handle 400 Bad Request', async () => {
      mock.onPost('/flows/').reply(400, { detail: 'Invalid flow data' });

      await expect(client.createFlow(mockFlowCreate)).rejects.toThrow(
        'Failed to create flow'
      );
    });

    it('should handle 401 Unauthorized', async () => {
      mock.onPost('/flows/').reply(401, { detail: 'Invalid API key' });

      await expect(client.createFlow(mockFlowCreate)).rejects.toThrow(
        'Failed to create flow'
      );
    });

    it('should handle network timeout', async () => {
      mock.onPost('/flows/').timeout();

      await expect(client.createFlow(mockFlowCreate)).rejects.toThrow();
    });
  });

  describe('listFlows', () => {
    it('should list flows without params', async () => {
      mock.onGet('/flows/').reply(200, mockFlowsList);

      const result = await client.listFlows();

      expect(result).toEqual(mockFlowsList);
    });

    it('should list flows with pagination params', async () => {
      mock.onGet('/flows/').reply(200, mockFlowsList);

      const result = await client.listFlows({ page: 1, size: 10 });

      expect(result).toEqual(mockFlowsList);
      expect(mock.history.get[0].params).toEqual({ page: 1, size: 10 });
    });

    it('should list flows with folder filter', async () => {
      const folderId = '123e4567-e89b-12d3-a456-426614174000';
      mock.onGet('/flows/').reply(200, mockFlowsList);

      await client.listFlows({ folder_id: folderId });

      expect(mock.history.get[0].params).toEqual({ folder_id: folderId });
    });

    it('should return empty array when no flows', async () => {
      mock.onGet('/flows/').reply(200, []);

      const result = await client.listFlows();

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      mock.onGet('/flows/').reply(500, { detail: 'Internal server error' });

      await expect(client.listFlows()).rejects.toThrow('Failed to list flows');
    });
  });

  describe('getFlow', () => {
    it('should get a single flow', async () => {
      const flowId = mockFlowRead.id;
      mock.onGet(`/flows/${flowId}`).reply(200, mockFlowRead);

      const result = await client.getFlow(flowId);

      expect(result).toEqual(mockFlowRead);
    });

    it('should handle 404 Not Found', async () => {
      const flowId = 'non-existent-id';
      mock.onGet(`/flows/${flowId}`).reply(404, { detail: 'Flow not found' });

      await expect(client.getFlow(flowId)).rejects.toThrow('Failed to get flow');
    });
  });

  describe('updateFlow', () => {
    it('should update flow name only', async () => {
      const flowId = mockFlowRead.id;
      const updates = { name: 'Updated Name' };
      const updatedFlow = { ...mockFlowRead, ...updates };

      mock.onPatch(`/flows/${flowId}`).reply(200, updatedFlow);

      const result = await client.updateFlow(flowId, updates);

      expect(result).toEqual(updatedFlow);
      expect(mock.history.patch[0].data).toBe(JSON.stringify(updates));
    });

    it('should update multiple fields', async () => {
      const flowId = mockFlowRead.id;
      const updatedFlow = { ...mockFlowRead, ...mockFlowUpdate };

      mock.onPatch(`/flows/${flowId}`).reply(200, updatedFlow);

      const result = await client.updateFlow(flowId, mockFlowUpdate);

      expect(result).toEqual(updatedFlow);
    });

    it('should handle 404 Not Found', async () => {
      const flowId = 'non-existent-id';
      mock.onPatch(`/flows/${flowId}`).reply(404);

      await expect(client.updateFlow(flowId, mockFlowUpdate)).rejects.toThrow(
        'Failed to update flow'
      );
    });
  });

  describe('deleteFlow', () => {
    it('should delete a flow', async () => {
      const flowId = mockFlowRead.id;
      mock.onDelete(`/flows/${flowId}`).reply(204);

      await expect(client.deleteFlow(flowId)).resolves.toBeUndefined();
    });

    it('should handle 404 Not Found', async () => {
      const flowId = 'non-existent-id';
      mock.onDelete(`/flows/${flowId}`).reply(404);

      await expect(client.deleteFlow(flowId)).rejects.toThrow('Failed to delete flow');
    });

    it('should handle 403 Forbidden', async () => {
      const flowId = mockFlowRead.id;
      mock.onDelete(`/flows/${flowId}`).reply(403, { detail: 'Permission denied' });

      await expect(client.deleteFlow(flowId)).rejects.toThrow('Failed to delete flow');
    });
  });

  describe('deleteFlows', () => {
    it('should delete multiple flows', async () => {
      const flowIds = [mockFlowRead.id, '123e4567-e89b-12d3-a456-426614174002'];
      const response = { deleted: 2 };

      mock.onDelete('/flows/').reply(200, response);

      const result = await client.deleteFlows(flowIds);

      expect(result).toEqual(response);
      expect(mock.history.delete[0].data).toBe(JSON.stringify(flowIds));
    });

    it('should handle empty array', async () => {
      mock.onDelete('/flows/').reply(200, { deleted: 0 });

      const result = await client.deleteFlows([]);

      expect(result).toEqual({ deleted: 0 });
    });
  });

  describe('listComponents', () => {
    it('should list and transform components correctly', async () => {
      mock.onGet('/all').reply(200, mockComponentsApiResponse);

      const result = await client.listComponents();

      expect(result).toHaveLength(3);
      expect(result).toEqual(expect.arrayContaining(mockComponentsList));
    });

    it('should handle empty response', async () => {
      mock.onGet('/all').reply(200, {});

      const result = await client.listComponents();

      expect(result).toEqual([]);
    });

    it('should handle missing display_name', async () => {
      const apiResponse = {
        test: {
          'TestComponent': {
            description: 'Test component'
          }
        }
      };

      mock.onGet('/all').reply(200, apiResponse);

      const result = await client.listComponents();

      expect(result[0]).toEqual({
        name: 'TestComponent',
        display_name: 'TestComponent',
        description: 'Test component',
        type: 'test'
      });
    });

    it('should handle API errors', async () => {
      mock.onGet('/all').reply(500);

      await expect(client.listComponents()).rejects.toThrow('Failed to list components');
    });
  });

  describe('healthCheck', () => {
    it('should return true on successful health check', async () => {
      mock.onGet('/health').reply(200);

      const result = await client.healthCheck();

      expect(result).toBe(true);
      expect(mock.history.get[0].baseURL).toBe('http://localhost:7860');
    });

    it('should return false on failed health check', async () => {
      mock.onGet('/health').reply(500);

      const result = await client.healthCheck();

      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      mock.onGet('/health').networkError();

      const result = await client.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('handleError', () => {
    it('should format axios errors with response', async () => {
      mock.onGet('/flows/').reply(400, { detail: 'Bad request' });

      await expect(client.listFlows()).rejects.toThrow('Failed to list flows');
    });

    it('should handle network errors', async () => {
      mock.onGet('/flows/').networkError();

      await expect(client.listFlows()).rejects.toThrow('Failed to list flows');
    });
  });

  describe('runFlow', () => {
    it('should run a flow successfully', async () => {
      const flowId = 'test-flow';
      mock.onPost(`/run/${flowId}`).reply(200, mockRunResponse);

      const result = await client.runFlow(flowId, mockRunFlowRequest, false);

      expect(result).toEqual(mockRunResponse);
      expect(JSON.parse(mock.history.post[0].data)).toEqual({
        input_request: mockRunFlowRequest
      });
      expect(mock.history.post[0].params).toEqual({ stream: false });
    });

    it('should run a flow with stream enabled', async () => {
      const flowId = 'test-flow';

      await expect(client.runFlow(flowId, mockRunFlowRequest, true)).rejects.toThrow(
        'Streaming run responses are not supported'
      );
      expect(mock.history.post).toHaveLength(0);
    });

    it('should send request context outside the input request', async () => {
      const flowId = 'test-flow';
      const context = { tenant: 'acme' };
      mock.onPost(`/run/${flowId}`).reply(200, mockRunResponse);

      const result = await client.runFlow(flowId, mockRunFlowRequest, false, context);

      expect(result).toEqual(mockRunResponse);
      expect(JSON.parse(mock.history.post[0].data)).toEqual({
        input_request: mockRunFlowRequest,
        context
      });
    });

    it('should handle 404 Not Found', async () => {
      const flowId = 'non-existent-flow';
      mock.onPost(`/run/${flowId}`).reply(404, { detail: 'Flow not found' });

      await expect(client.runFlow(flowId, mockRunFlowRequest)).rejects.toThrow(
        `Failed to run flow ${flowId}`
      );
    });

    it('should handle 400 Bad Request', async () => {
      const flowId = 'test-flow';
      mock.onPost(`/run/${flowId}`).reply(400, { detail: 'Invalid input' });

      await expect(client.runFlow(flowId, mockRunFlowRequest)).rejects.toThrow(
        `Failed to run flow ${flowId}`
      );
    });
  });

  describe('triggerWebhook', () => {
    it('should trigger webhook successfully', async () => {
      const flowId = 'test-flow';
      mock.onPost(`/webhook/${flowId}`).reply(200, mockWebhookResponse);

      const result = await client.triggerWebhook(flowId, mockWebhookRequest);

      expect(result).toEqual(mockWebhookResponse);
      expect(mock.history.post[0].data).toBe(JSON.stringify(mockWebhookRequest));
    });

    it('should handle 404 Not Found', async () => {
      const flowId = 'non-existent-flow';
      mock.onPost(`/webhook/${flowId}`).reply(404, { detail: 'Flow not found' });

      await expect(client.triggerWebhook(flowId, mockWebhookRequest)).rejects.toThrow(
        `Failed to trigger webhook for flow ${flowId}`
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      const flowId = 'test-flow';
      mock.onPost(`/webhook/${flowId}`).reply(500, { detail: 'Internal error' });

      await expect(client.triggerWebhook(flowId, mockWebhookRequest)).rejects.toThrow(
        `Failed to trigger webhook for flow ${flowId}`
      );
    });
  });

  describe('uploadFlow', () => {
    it('should upload a flow successfully', async () => {
      mock.onPost('/flows/upload/').reply(200, mockFlowRead);

      const result = await client.uploadFlow(mockUploadFile);

      expect(result).toEqual(mockFlowRead);
      expect(mock.history.post[0].data).toBe(JSON.stringify(mockUploadFile));
    });

    it('should handle 400 Bad Request', async () => {
      mock.onPost('/flows/upload/').reply(400, { detail: 'Invalid file format' });

      await expect(client.uploadFlow(mockUploadFile)).rejects.toThrow(
        'Failed to upload flow'
      );
    });

    it('should handle network timeout', async () => {
      mock.onPost('/flows/upload/').timeout();

      await expect(client.uploadFlow(mockUploadFile)).rejects.toThrow();
    });
  });

  describe('downloadFlows', () => {
    it('should download flows successfully', async () => {
      const flowIds = ['123e4567-e89b-12d3-a456-426614174001'];
      mock.onPost('/flows/download/').reply(200, mockDownloadResponse);

      const result = await client.downloadFlows(flowIds);

      expect(result).toEqual(mockDownloadResponse);
      expect(mock.history.post[0].data).toBe(JSON.stringify(flowIds));
    });

    it('should download multiple flows', async () => {
      const flowIds = [
        '123e4567-e89b-12d3-a456-426614174001',
        '123e4567-e89b-12d3-a456-426614174002'
      ];
      mock.onPost('/flows/download/').reply(200, mockDownloadResponse);

      const result = await client.downloadFlows(flowIds);

      expect(result).toEqual(mockDownloadResponse);
    });

    it('should handle 404 Not Found', async () => {
      const flowIds = ['non-existent-id'];
      mock.onPost('/flows/download/').reply(404, { detail: 'Flows not found' });

      await expect(client.downloadFlows(flowIds)).rejects.toThrow(
        'Failed to download flows'
      );
    });
  });

  describe('getBasicExamples', () => {
    it('should get basic examples successfully', async () => {
      mock.onGet('/flows/basic_examples/').reply(200, mockFlowsList);

      const result = await client.getBasicExamples();

      expect(result).toEqual(mockFlowsList);
    });

    it('should handle empty examples', async () => {
      mock.onGet('/flows/basic_examples/').reply(200, []);

      const result = await client.getBasicExamples();

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      mock.onGet('/flows/basic_examples/').reply(500, { detail: 'Internal error' });

      await expect(client.getBasicExamples()).rejects.toThrow(
        'Failed to get basic examples'
      );
    });
  });

  describe('listFolders', () => {
    it('should list folders without params', async () => {
      mock.onGet('/folders/').reply(200, mockFoldersList);

      const result = await client.listFolders();

      expect(result).toEqual(mockFoldersList);
    });

    it('should list folders with pagination params', async () => {
      mock.onGet('/folders/').reply(200, mockFoldersList);

      const result = await client.listFolders({ page: 1, size: 10 });

      expect(result).toEqual(mockFoldersList);
      expect(mock.history.get[0].params).toEqual({ page: 1, size: 10 });
    });

    it('should return empty array when no folders', async () => {
      mock.onGet('/folders/').reply(200, []);

      const result = await client.listFolders();

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      mock.onGet('/folders/').reply(500, { detail: 'Internal server error' });

      await expect(client.listFolders()).rejects.toThrow('Failed to list folders');
    });
  });

  describe('createFolder', () => {
    it('should create a folder successfully', async () => {
      mock.onPost('/folders/').reply(200, mockFolderRead);

      const result = await client.createFolder(mockFolderCreate);

      expect(result).toEqual(mockFolderRead);
      expect(mock.history.post[0].data).toBe(JSON.stringify(mockFolderCreate));
    });

    it('should handle 400 Bad Request', async () => {
      mock.onPost('/folders/').reply(400, { detail: 'Invalid folder data' });

      await expect(client.createFolder(mockFolderCreate)).rejects.toThrow(
        'Failed to create folder'
      );
    });

    it('should handle 401 Unauthorized', async () => {
      mock.onPost('/folders/').reply(401, { detail: 'Invalid API key' });

      await expect(client.createFolder(mockFolderCreate)).rejects.toThrow(
        'Failed to create folder'
      );
    });
  });

  describe('getFolder', () => {
    it('should get a single folder', async () => {
      const folderId = mockFolderRead.id;
      mock.onGet(`/folders/${folderId}`).reply(200, mockFolderRead);

      const result = await client.getFolder(folderId);

      expect(result).toEqual(mockFolderRead);
    });

    it('should handle 404 Not Found', async () => {
      const folderId = 'non-existent-id';
      mock.onGet(`/folders/${folderId}`).reply(404, { detail: 'Folder not found' });

      await expect(client.getFolder(folderId)).rejects.toThrow(
        `Failed to get folder ${folderId}`
      );
    });
  });

  describe('updateFolder', () => {
    it('should update folder name only', async () => {
      const folderId = mockFolderRead.id;
      const updates = { name: 'Updated Name' };
      const updatedFolder = { ...mockFolderRead, ...updates };

      mock.onPatch(`/folders/${folderId}`).reply(200, updatedFolder);

      const result = await client.updateFolder(folderId, updates);

      expect(result).toEqual(updatedFolder);
      expect(mock.history.patch[0].data).toBe(JSON.stringify(updates));
    });

    it('should update multiple fields', async () => {
      const folderId = mockFolderRead.id;
      const updatedFolder = { ...mockFolderRead, ...mockFolderUpdate };

      mock.onPatch(`/folders/${folderId}`).reply(200, updatedFolder);

      const result = await client.updateFolder(folderId, mockFolderUpdate);

      expect(result).toEqual(updatedFolder);
    });

    it('should handle 404 Not Found', async () => {
      const folderId = 'non-existent-id';
      mock.onPatch(`/folders/${folderId}`).reply(404);

      await expect(client.updateFolder(folderId, mockFolderUpdate)).rejects.toThrow(
        `Failed to update folder ${folderId}`
      );
    });
  });

  describe('deleteFolder', () => {
    it('should delete a folder', async () => {
      const folderId = mockFolderRead.id;
      mock.onDelete(`/folders/${folderId}`).reply(204);

      await expect(client.deleteFolder(folderId)).resolves.toBeUndefined();
    });

    it('should handle 404 Not Found', async () => {
      const folderId = 'non-existent-id';
      mock.onDelete(`/folders/${folderId}`).reply(404);

      await expect(client.deleteFolder(folderId)).rejects.toThrow(
        `Failed to delete folder ${folderId}`
      );
    });

    it('should handle 403 Forbidden', async () => {
      const folderId = mockFolderRead.id;
      mock.onDelete(`/folders/${folderId}`).reply(403, { detail: 'Permission denied' });

      await expect(client.deleteFolder(folderId)).rejects.toThrow(
        `Failed to delete folder ${folderId}`
      );
    });
  });

  describe('listProjects', () => {
    it('should list projects without params', async () => {
      mock.onGet('/projects/').reply(200, mockProjectsList);

      const result = await client.listProjects();

      expect(result).toEqual(mockProjectsList);
    });

    it('should list projects with pagination params', async () => {
      mock.onGet('/projects/').reply(200, mockProjectsList);

      const result = await client.listProjects({ page: 1, size: 10 });

      expect(result).toEqual(mockProjectsList);
      expect(mock.history.get[0].params).toEqual({ page: 1, size: 10 });
    });

    it('should return empty array when no projects', async () => {
      mock.onGet('/projects/').reply(200, []);

      const result = await client.listProjects();

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      mock.onGet('/projects/').reply(500, { detail: 'Internal server error' });

      await expect(client.listProjects()).rejects.toThrow('Failed to list projects');
    });
  });

  describe('createProject', () => {
    it('should create a project successfully', async () => {
      mock.onPost('/projects/').reply(200, mockProjectRead);

      const result = await client.createProject(mockProjectCreate);

      expect(result).toEqual(mockProjectRead);
      expect(mock.history.post[0].data).toBe(JSON.stringify(mockProjectCreate));
    });

    it('should handle 400 Bad Request', async () => {
      mock.onPost('/projects/').reply(400, { detail: 'Invalid project data' });

      await expect(client.createProject(mockProjectCreate)).rejects.toThrow(
        'Failed to create project'
      );
    });

    it('should handle 401 Unauthorized', async () => {
      mock.onPost('/projects/').reply(401, { detail: 'Invalid API key' });

      await expect(client.createProject(mockProjectCreate)).rejects.toThrow(
        'Failed to create project'
      );
    });
  });

  describe('getProject', () => {
    it('should get a single project', async () => {
      const projectId = mockProjectRead.id;
      mock.onGet(`/projects/${projectId}`).reply(200, mockProjectRead);

      const result = await client.getProject(projectId);

      expect(result).toEqual(mockProjectRead);
    });

    it('should handle 404 Not Found', async () => {
      const projectId = 'non-existent-id';
      mock.onGet(`/projects/${projectId}`).reply(404, { detail: 'Project not found' });

      await expect(client.getProject(projectId)).rejects.toThrow(
        `Failed to get project ${projectId}`
      );
    });
  });

  describe('updateProject', () => {
    it('should update project name only', async () => {
      const projectId = mockProjectRead.id;
      const updates = { name: 'Updated Name' };
      const updatedProject = { ...mockProjectRead, ...updates };

      mock.onPatch(`/projects/${projectId}`).reply(200, updatedProject);

      const result = await client.updateProject(projectId, updates);

      expect(result).toEqual(updatedProject);
      expect(mock.history.patch[0].data).toBe(JSON.stringify(updates));
    });

    it('should update multiple fields', async () => {
      const projectId = mockProjectRead.id;
      const updatedProject = { ...mockProjectRead, ...mockProjectUpdate };

      mock.onPatch(`/projects/${projectId}`).reply(200, updatedProject);

      const result = await client.updateProject(projectId, mockProjectUpdate);

      expect(result).toEqual(updatedProject);
    });

    it('should handle 404 Not Found', async () => {
      const projectId = 'non-existent-id';
      mock.onPatch(`/projects/${projectId}`).reply(404);

      await expect(client.updateProject(projectId, mockProjectUpdate)).rejects.toThrow(
        `Failed to update project ${projectId}`
      );
    });
  });

  describe('deleteProject', () => {
    it('should delete a project', async () => {
      const projectId = mockProjectRead.id;
      mock.onDelete(`/projects/${projectId}`).reply(204);

      await expect(client.deleteProject(projectId)).resolves.toBeUndefined();
    });

    it('should handle 404 Not Found', async () => {
      const projectId = 'non-existent-id';
      mock.onDelete(`/projects/${projectId}`).reply(404);

      await expect(client.deleteProject(projectId)).rejects.toThrow(
        `Failed to delete project ${projectId}`
      );
    });

    it('should handle 403 Forbidden', async () => {
      const projectId = mockProjectRead.id;
      mock.onDelete(`/projects/${projectId}`).reply(403, { detail: 'Permission denied' });

      await expect(client.deleteProject(projectId)).rejects.toThrow(
        `Failed to delete project ${projectId}`
      );
    });
  });

  describe('uploadProject', () => {
    it('should upload a project successfully', async () => {
      mock.onPost('/projects/upload/').reply(200, mockProjectRead);

      const result = await client.uploadProject(mockUploadFile);

      expect(result).toEqual(mockProjectRead);
      expect(mock.history.post[0].data).toBe(JSON.stringify(mockUploadFile));
    });

    it('should handle 400 Bad Request', async () => {
      mock.onPost('/projects/upload/').reply(400, { detail: 'Invalid file format' });

      await expect(client.uploadProject(mockUploadFile)).rejects.toThrow(
        'Failed to upload project'
      );
    });

    it('should handle network timeout', async () => {
      mock.onPost('/projects/upload/').timeout();

      await expect(client.uploadProject(mockUploadFile)).rejects.toThrow();
    });
  });

  describe('downloadProject', () => {
    it('should download a project successfully', async () => {
      const projectId = mockProjectRead.id;
      mock.onGet(`/projects/download/${projectId}`).reply(200, mockDownloadResponse);

      const result = await client.downloadProject(projectId);

      expect(result).toEqual(mockDownloadResponse);
    });

    it('should handle 404 Not Found', async () => {
      const projectId = 'non-existent-id';
      mock.onGet(`/projects/download/${projectId}`).reply(404, { detail: 'Project not found' });

      await expect(client.downloadProject(projectId)).rejects.toThrow(
        `Failed to download project ${projectId}`
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      const projectId = mockProjectRead.id;
      mock.onGet(`/projects/download/${projectId}`).reply(500);

      await expect(client.downloadProject(projectId)).rejects.toThrow(
        `Failed to download project ${projectId}`
      );
    });
  });

  describe('listVariables', () => {
    it('should list variables successfully', async () => {
      mock.onGet('/variables/').reply(200, mockVariablesList);

      const result = await client.listVariables();

      expect(result).toEqual(mockVariablesList);
    });

    it('should return empty array when no variables', async () => {
      mock.onGet('/variables/').reply(200, []);

      const result = await client.listVariables();

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      mock.onGet('/variables/').reply(500, { detail: 'Internal server error' });

      await expect(client.listVariables()).rejects.toThrow('Failed to list variables');
    });
  });

  describe('createVariable', () => {
    it('should create a variable successfully', async () => {
      mock.onPost('/variables/').reply(200, mockVariableRead);

      const result = await client.createVariable(mockVariableCreate);

      expect(result).toEqual(mockVariableRead);
      expect(mock.history.post[0].data).toBe(JSON.stringify(mockVariableCreate));
    });

    it('should handle 400 Bad Request', async () => {
      mock.onPost('/variables/').reply(400, { detail: 'Invalid variable data' });

      await expect(client.createVariable(mockVariableCreate)).rejects.toThrow(
        'Failed to create variable'
      );
    });

    it('should handle 401 Unauthorized', async () => {
      mock.onPost('/variables/').reply(401, { detail: 'Invalid API key' });

      await expect(client.createVariable(mockVariableCreate)).rejects.toThrow(
        'Failed to create variable'
      );
    });

    it('should handle 409 Conflict', async () => {
      mock.onPost('/variables/').reply(409, { detail: 'Variable already exists' });

      await expect(client.createVariable(mockVariableCreate)).rejects.toThrow(
        'Failed to create variable'
      );
    });
  });

  describe('updateVariable', () => {
    it('should update variable name only', async () => {
      const variableId = mockVariableRead.id;
      const updates = { name: 'UPDATED_NAME' };
      const updatedVariable = { ...mockVariableRead, ...updates };

      mock.onPatch(`/variables/${variableId}`).reply(200, updatedVariable);

      const result = await client.updateVariable(variableId, updates);

      expect(result).toEqual(updatedVariable);
      expect(mock.history.patch[0].data).toBe(JSON.stringify(updates));
    });

    it('should update multiple fields', async () => {
      const variableId = mockVariableRead.id;
      const updatedVariable = { ...mockVariableRead, ...mockVariableUpdate };

      mock.onPatch(`/variables/${variableId}`).reply(200, updatedVariable);

      const result = await client.updateVariable(variableId, mockVariableUpdate);

      expect(result).toEqual(updatedVariable);
    });

    it('should handle 404 Not Found', async () => {
      const variableId = 'non-existent-id';
      mock.onPatch(`/variables/${variableId}`).reply(404);

      await expect(client.updateVariable(variableId, mockVariableUpdate)).rejects.toThrow(
        `Failed to update variable ${variableId}`
      );
    });
  });

  describe('deleteVariable', () => {
    it('should delete a variable', async () => {
      const variableId = mockVariableRead.id;
      mock.onDelete(`/variables/${variableId}`).reply(204);

      await expect(client.deleteVariable(variableId)).resolves.toBeUndefined();
    });

    it('should handle 404 Not Found', async () => {
      const variableId = 'non-existent-id';
      mock.onDelete(`/variables/${variableId}`).reply(404);

      await expect(client.deleteVariable(variableId)).rejects.toThrow(
        `Failed to delete variable ${variableId}`
      );
    });

    it('should handle 403 Forbidden', async () => {
      const variableId = mockVariableRead.id;
      mock.onDelete(`/variables/${variableId}`).reply(403, { detail: 'Permission denied' });

      await expect(client.deleteVariable(variableId)).rejects.toThrow(
        `Failed to delete variable ${variableId}`
      );
    });
  });

  describe('buildFlow', () => {
    const flowId = '123e4567-e89b-12d3-a456-426614174000';

    it('should build a flow with minimal params', async () => {
      mock.onPost(`/build/${flowId}/flow`).reply(200, mockBuildFlowResponse);

      const result = await client.buildFlow(flowId, mockMinimalBuildRequest, mockMinimalBuildParams);

      expect(result).toEqual(mockBuildFlowResponse);
      expect(result.job_id).toBeDefined();
    });

    it('should build a flow with full params', async () => {
      mock.onPost(`/build/${flowId}/flow`).reply(200, mockBuildFlowResponse);

      const result = await client.buildFlow(flowId, mockBuildFlowRequest, mockBuildFlowParams);

      expect(result).toEqual(mockBuildFlowResponse);
      expect(mock.history.post[0].data).toBe(JSON.stringify(mockBuildFlowRequest));
      expect(mock.history.post[0].params).toEqual(mockBuildFlowParams);
    });

    it('should build a flow with inputs and data', async () => {
      mock.onPost(`/build/${flowId}/flow`).reply(200, mockBuildFlowResponse);

      const request = {
        inputs: { param1: 'value1' },
        data: { nodes: [], edges: [] }
      };

      const result = await client.buildFlow(flowId, request, {});

      expect(result).toEqual(mockBuildFlowResponse);
    });

    it('should build a flow with files array', async () => {
      mock.onPost(`/build/${flowId}/flow`).reply(200, mockBuildFlowResponse);

      const request = {
        files: ['file1.txt', 'file2.json']
      };

      const result = await client.buildFlow(flowId, request, {});

      expect(result).toEqual(mockBuildFlowResponse);
    });

    it('should handle 404 Not Found', async () => {
      mock.onPost(`/build/${flowId}/flow`).reply(404, { detail: 'Flow not found' });

      await expect(client.buildFlow(flowId, mockBuildFlowRequest, mockBuildFlowParams)).rejects.toThrow(
        `Failed to build flow ${flowId}`
      );
    });

    it('should handle 400 Bad Request for validation error', async () => {
      mock.onPost(`/build/${flowId}/flow`).reply(400, { detail: 'Invalid build request' });

      await expect(client.buildFlow(flowId, mockBuildFlowRequest, mockBuildFlowParams)).rejects.toThrow(
        `Failed to build flow ${flowId}`
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      mock.onPost(`/build/${flowId}/flow`).reply(500, { detail: 'Build service unavailable' });

      await expect(client.buildFlow(flowId, mockBuildFlowRequest, mockBuildFlowParams)).rejects.toThrow(
        `Failed to build flow ${flowId}`
      );
    });

    it('should handle network timeout', async () => {
      mock.onPost(`/build/${flowId}/flow`).timeout();

      await expect(client.buildFlow(flowId, mockBuildFlowRequest, mockBuildFlowParams)).rejects.toThrow();
    });
  });

  describe('getBuildStatus', () => {
    const jobId = 'job-123e4567-e89b-12d3-a456-426614174020';

    it('should get build status with job_id', async () => {
      mock.onGet(`/build/${jobId}/events`).reply(200, mockBuildStatusResponse);

      const result = await client.getBuildStatus(jobId);

      expect(result).toEqual(mockBuildStatusResponse);
      expect(result.job_id).toBe(jobId);
    });

    it('should get build status with event_delivery param', async () => {
      mock.onGet(`/build/${jobId}/events`).reply(200, mockBuildStatusResponse);

      const result = await client.getBuildStatus(jobId, 'streaming');

      expect(result).toEqual(mockBuildStatusResponse);
      expect(mock.history.get[0].params).toEqual({ event_delivery: 'streaming' });
    });

    it('should default event_delivery to polling', async () => {
      mock.onGet(`/build/${jobId}/events`).reply(200, mockBuildStatusResponse);

      await client.getBuildStatus(jobId);

      expect(mock.history.get[0].params).toEqual({ event_delivery: 'polling' });
    });

    it('should get completed build status', async () => {
      mock.onGet(`/build/${jobId}/events`).reply(200, mockCompletedBuildStatus);

      const result = await client.getBuildStatus(jobId);

      expect(result.status).toBe('completed');
      expect(result.progress).toBe(100);
    });

    it('should get failed build status', async () => {
      mock.onGet(`/build/${jobId}/events`).reply(200, mockFailedBuildStatus);

      const result = await client.getBuildStatus(jobId);

      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
    });

    it('should handle 404 Not Found for invalid job', async () => {
      mock.onGet(`/build/${jobId}/events`).reply(404, { detail: 'Job not found' });

      await expect(client.getBuildStatus(jobId)).rejects.toThrow(
        `Failed to get build status for job ${jobId}`
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      mock.onGet(`/build/${jobId}/events`).reply(500, { detail: 'Service error' });

      await expect(client.getBuildStatus(jobId)).rejects.toThrow(
        `Failed to get build status for job ${jobId}`
      );
    });
  });

  describe('cancelBuild', () => {
    const jobId = 'job-123e4567-e89b-12d3-a456-426614174020';

    it('should cancel a build successfully', async () => {
      mock.onPost(`/build/${jobId}/cancel`).reply(200, mockCancelBuildResponse);

      const result = await client.cancelBuild(jobId);

      expect(result).toEqual(mockCancelBuildResponse);
      expect(result.success).toBe(true);
      expect(result.cancelled).toBe(true);
    });

    it('should handle cancellation request', async () => {
      mock.onPost(`/build/${jobId}/cancel`).reply(200, mockCancelBuildResponse);

      const result = await client.cancelBuild(jobId);

      expect(result.message).toBe('Build job cancelled successfully');
    });

    it('should handle 404 Not Found for invalid job', async () => {
      mock.onPost(`/build/${jobId}/cancel`).reply(404, { detail: 'Job not found' });

      await expect(client.cancelBuild(jobId)).rejects.toThrow(
        `Failed to cancel build job ${jobId}`
      );
    });

    it('should handle already completed build', async () => {
      mock.onPost(`/build/${jobId}/cancel`).reply(200, mockCancelBuildAlreadyCompleted);

      const result = await client.cancelBuild(jobId);

      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(false);
    });

    it('should handle 400 Bad Request for completed job', async () => {
      mock.onPost(`/build/${jobId}/cancel`).reply(400, { detail: 'Cannot cancel completed job' });

      await expect(client.cancelBuild(jobId)).rejects.toThrow(
        `Failed to cancel build job ${jobId}`
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      mock.onPost(`/build/${jobId}/cancel`).reply(500, { detail: 'Cancellation service error' });

      await expect(client.cancelBuild(jobId)).rejects.toThrow(
        `Failed to cancel build job ${jobId}`
      );
    });
  });

  describe('listKnowledgeBases', () => {
    it('should list knowledge bases successfully', async () => {
      mock.onGet('/knowledge_bases').reply(200, mockKnowledgeBasesList);

      const result = await client.listKnowledgeBases();

      expect(result).toEqual(mockKnowledgeBasesList);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no knowledge bases exist', async () => {
      mock.onGet('/knowledge_bases').reply(200, mockEmptyKnowledgeBasesList);

      const result = await client.listKnowledgeBases();

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      mock.onGet('/knowledge_bases').reply(500, { detail: 'Internal server error' });

      await expect(client.listKnowledgeBases()).rejects.toThrow(
        'Failed to list knowledge bases'
      );
    });

    it('should handle 401 Unauthorized', async () => {
      mock.onGet('/knowledge_bases').reply(401, { detail: 'Invalid API key' });

      await expect(client.listKnowledgeBases()).rejects.toThrow(
        'Failed to list knowledge bases'
      );
    });

    it('should handle network timeout', async () => {
      mock.onGet('/knowledge_bases').timeout();

      await expect(client.listKnowledgeBases()).rejects.toThrow();
    });
  });

  describe('getKnowledgeBase', () => {
    const kbName = 'test-kb';

    it('should get a knowledge base successfully', async () => {
      mock.onGet(`/knowledge_bases/${kbName}`).reply(200, mockKnowledgeBaseInfo);

      const result = await client.getKnowledgeBase(kbName);

      expect(result).toEqual(mockKnowledgeBaseInfo);
      expect(result.name).toBe(kbName);
    });

    it('should get knowledge base with all metadata', async () => {
      mock.onGet(`/knowledge_bases/${kbName}`).reply(200, mockKnowledgeBaseInfo);

      const result = await client.getKnowledgeBase(kbName);

      expect(result.description).toBeDefined();
      expect(result.documents_count).toBeDefined();
      expect(result.size_bytes).toBeDefined();
    });

    it('should handle 404 Not Found', async () => {
      mock.onGet(`/knowledge_bases/${kbName}`).reply(404, { detail: 'Knowledge base not found' });

      await expect(client.getKnowledgeBase(kbName)).rejects.toThrow(
        `Failed to get knowledge base ${kbName}`
      );
    });

    it('should handle special characters in kb_name', async () => {
      const specialKbName = 'test_kb-v1';
      mock.onGet(`/knowledge_bases/${specialKbName}`).reply(200, {
        ...mockKnowledgeBaseInfo,
        name: specialKbName
      });

      const result = await client.getKnowledgeBase(specialKbName);

      expect(result.name).toBe(specialKbName);
    });

    it('should handle 500 Internal Server Error', async () => {
      mock.onGet(`/knowledge_bases/${kbName}`).reply(500, { detail: 'Service error' });

      await expect(client.getKnowledgeBase(kbName)).rejects.toThrow(
        `Failed to get knowledge base ${kbName}`
      );
    });
  });

  describe('deleteKnowledgeBase', () => {
    const kbName = 'test-kb';

    it('should delete a knowledge base successfully', async () => {
      mock.onDelete(`/knowledge_bases/${kbName}`).reply(204);

      await expect(client.deleteKnowledgeBase(kbName)).resolves.toBeUndefined();
    });

    it('should delete knowledge base with no response body', async () => {
      mock.onDelete(`/knowledge_bases/${kbName}`).reply(204);

      const result = await client.deleteKnowledgeBase(kbName);

      expect(result).toBeUndefined();
    });

    it('should handle 404 Not Found', async () => {
      mock.onDelete(`/knowledge_bases/${kbName}`).reply(404, { detail: 'Knowledge base not found' });

      await expect(client.deleteKnowledgeBase(kbName)).rejects.toThrow(
        `Failed to delete knowledge base ${kbName}`
      );
    });

    it('should handle 403 Forbidden for permission denied', async () => {
      mock.onDelete(`/knowledge_bases/${kbName}`).reply(403, { detail: 'Permission denied' });

      await expect(client.deleteKnowledgeBase(kbName)).rejects.toThrow(
        `Failed to delete knowledge base ${kbName}`
      );
    });

    it('should handle 409 Conflict for KB in use', async () => {
      mock.onDelete(`/knowledge_bases/${kbName}`).reply(409, { detail: 'Knowledge base is in use' });

      await expect(client.deleteKnowledgeBase(kbName)).rejects.toThrow(
        `Failed to delete knowledge base ${kbName}`
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      mock.onDelete(`/knowledge_bases/${kbName}`).reply(500, { detail: 'Deletion service error' });

      await expect(client.deleteKnowledgeBase(kbName)).rejects.toThrow(
        `Failed to delete knowledge base ${kbName}`
      );
    });
  });

  describe('bulkDeleteKnowledgeBases', () => {
    it('should delete multiple knowledge bases successfully', async () => {
      const kbNames = ['test-kb-1', 'test-kb-2'];
      mock.onDelete('/knowledge_bases').reply(200, mockBulkDeleteResponse);

      const result = await client.bulkDeleteKnowledgeBases(kbNames);

      expect(result).toEqual(mockBulkDeleteResponse);
      expect(result.deleted).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should delete single knowledge base via bulk endpoint', async () => {
      const kbNames = ['test-kb'];
      mock.onDelete('/knowledge_bases').reply(200, { deleted: 1, failed: 0, errors: [] });

      const result = await client.bulkDeleteKnowledgeBases(kbNames);

      expect(result.deleted).toBe(1);
      expect(mock.history.delete[0].data).toBe(JSON.stringify({ kb_names: kbNames }));
    });

    it('should handle partial success scenario', async () => {
      const kbNames = ['test-kb', 'non-existent-kb'];
      mock.onDelete('/knowledge_bases').reply(200, mockPartialBulkDeleteResponse);

      const result = await client.bulkDeleteKnowledgeBases(kbNames);

      expect(result.deleted).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });

    it('should send correct request body', async () => {
      const kbNames = ['kb1', 'kb2', 'kb3'];
      mock.onDelete('/knowledge_bases').reply(200, { deleted: 3, failed: 0, errors: [] });

      await client.bulkDeleteKnowledgeBases(kbNames);

      expect(mock.history.delete[0].data).toBe(JSON.stringify({ kb_names: kbNames }));
    });

    it('should handle 400 Bad Request for invalid request', async () => {
      const kbNames = ['invalid-kb'];
      mock.onDelete('/knowledge_bases').reply(400, { detail: 'Invalid request' });

      await expect(client.bulkDeleteKnowledgeBases(kbNames)).rejects.toThrow(
        'Failed to bulk delete knowledge bases'
      );
    });

    it('should handle 403 Forbidden for permission denied', async () => {
      const kbNames = ['test-kb'];
      mock.onDelete('/knowledge_bases').reply(403, { detail: 'Permission denied' });

      await expect(client.bulkDeleteKnowledgeBases(kbNames)).rejects.toThrow(
        'Failed to bulk delete knowledge bases'
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      const kbNames = ['test-kb'];
      mock.onDelete('/knowledge_bases').reply(500, { detail: 'Service error' });

      await expect(client.bulkDeleteKnowledgeBases(kbNames)).rejects.toThrow(
        'Failed to bulk delete knowledge bases'
      );
    });

    it('should handle network timeout', async () => {
      const kbNames = ['test-kb'];
      mock.onDelete('/knowledge_bases').timeout();

      await expect(client.bulkDeleteKnowledgeBases(kbNames)).rejects.toThrow();
    });
  });

  describe('getMonitorBuilds', () => {
    it('should retrieve build history for a flow successfully', async () => {
      const flowId = mockMonitorBuild.flow_id;
      const mockResponse = { vertex_builds: { 'vertex-1': [mockMonitorBuild] } };
      mock.onGet('/monitor/builds').reply(200, mockResponse);

      const result = await client.getMonitorBuilds({ flow_id: flowId });

      expect(result).toEqual(mockResponse);
      expect(result.vertex_builds['vertex-1']).toHaveLength(1);
      expect(result.vertex_builds['vertex-1'][0].flow_id).toBe(flowId);
    });

    it('should handle 404 Not Found', async () => {
      const flowId = 'test-flow-id';
      mock.onGet('/monitor/builds').reply(404, { detail: 'Not found' });

      await expect(client.getMonitorBuilds({ flow_id: flowId })).rejects.toThrow('Failed to get monitor builds');
    });

    it('should handle 401 Unauthorized', async () => {
      const flowId = 'test-flow-id';
      mock.onGet('/monitor/builds').reply(401, { detail: 'Unauthorized' });

      await expect(client.getMonitorBuilds({ flow_id: flowId })).rejects.toThrow('Failed to get monitor builds');
    });

    it('should handle 500 Internal Server Error', async () => {
      const flowId = 'test-flow-id';
      mock.onGet('/monitor/builds').reply(500, { detail: 'Service error' });

      await expect(client.getMonitorBuilds({ flow_id: flowId })).rejects.toThrow('Failed to get monitor builds');
    });

    it('should handle network timeout', async () => {
      const flowId = 'test-flow-id';
      mock.onGet('/monitor/builds').timeout();

      await expect(client.getMonitorBuilds({ flow_id: flowId })).rejects.toThrow();
    });
  });

  describe('deleteMonitorBuilds', () => {
    it('should delete builds for a flow successfully', async () => {
      const flowId = mockMonitorBuild.flow_id;
      mock.onDelete('/monitor/builds').reply(204);

      await client.deleteMonitorBuilds(flowId);

      expect(mock.history.delete[0].params).toEqual({ flow_id: flowId });
    });

    it('should handle 403 Forbidden', async () => {
      const flowId = mockMonitorBuild.flow_id;
      mock.onDelete('/monitor/builds').reply(403, { detail: 'Permission denied' });

      await expect(client.deleteMonitorBuilds(flowId)).rejects.toThrow(
        'Failed to delete monitor builds'
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      const flowId = mockMonitorBuild.flow_id;
      mock.onDelete('/monitor/builds').reply(500, { detail: 'Service error' });

      await expect(client.deleteMonitorBuilds(flowId)).rejects.toThrow(
        'Failed to delete monitor builds'
      );
    });

    it('should handle network timeout', async () => {
      const flowId = mockMonitorBuild.flow_id;
      mock.onDelete('/monitor/builds').timeout();

      await expect(client.deleteMonitorBuilds(flowId)).rejects.toThrow();
    });
  });

  describe('getMonitorMessages', () => {
    it('should retrieve messages with flow_id filter', async () => {
      const params = { flow_id: mockMonitorMessage.flow_id };
      mock.onGet('/monitor/messages').reply(200, [mockMonitorMessage]);

      const result = await client.getMonitorMessages(params);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockMonitorMessage);
      expect(result[0].flow_id).toBe(params.flow_id);
    });

    it('should retrieve messages with session_id filter', async () => {
      const params = { session_id: mockMonitorMessage.session_id };
      mock.onGet('/monitor/messages').reply(200, [mockMonitorMessage]);

      const result = await client.getMonitorMessages(params);

      expect(result).toHaveLength(1);
      expect(result[0].session_id).toBe(params.session_id);
    });

    it('should retrieve messages with multiple filters', async () => {
      const params = {
        flow_id: mockMonitorMessage.flow_id,
        sender: mockMonitorMessage.sender,
        order_by: 'timestamp',
      };
      mock.onGet('/monitor/messages').reply(200, [mockMonitorMessage]);

      const result = await client.getMonitorMessages(params);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockMonitorMessage);
    });

    it('should retrieve all messages without filters', async () => {
      mock.onGet('/monitor/messages').reply(200, [mockMonitorMessage]);

      const result = await client.getMonitorMessages();

      expect(result).toHaveLength(1);
    });

    it('should handle 404 Not Found', async () => {
      mock.onGet('/monitor/messages').reply(404, { detail: 'Not found' });

      await expect(client.getMonitorMessages()).rejects.toThrow('Failed to get monitor messages');
    });

    it('should handle 401 Unauthorized', async () => {
      mock.onGet('/monitor/messages').reply(401, { detail: 'Unauthorized' });

      await expect(client.getMonitorMessages()).rejects.toThrow('Failed to get monitor messages');
    });

    it('should handle 500 Internal Server Error', async () => {
      mock.onGet('/monitor/messages').reply(500, { detail: 'Service error' });

      await expect(client.getMonitorMessages()).rejects.toThrow('Failed to get monitor messages');
    });

    it('should handle network timeout', async () => {
      mock.onGet('/monitor/messages').timeout();

      await expect(client.getMonitorMessages()).rejects.toThrow();
    });
  });

  describe('deleteMonitorMessages', () => {
    it('should delete multiple messages successfully', async () => {
      const messageIds = [mockMonitorMessage.id, 'message-uuid-2'];
      mock.onDelete('/monitor/messages').reply(200, mockBulkDeleteResponse);

      const result = await client.deleteMonitorMessages(messageIds);

      expect(result.deleted).toBe(2);
      expect(result.failed).toBe(0);
      expect(mock.history.delete[0].data).toBe(JSON.stringify(messageIds));
    });

    it('should handle partial deletion success', async () => {
      const messageIds = ['valid-uuid', 'invalid-uuid'];
      mock.onDelete('/monitor/messages').reply(200, mockPartialBulkDeleteResponse);

      const result = await client.deleteMonitorMessages(messageIds);

      expect(result.deleted).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });

    it('should handle 403 Forbidden', async () => {
      const messageIds = [mockMonitorMessage.id];
      mock.onDelete('/monitor/messages').reply(403, { detail: 'Permission denied' });

      await expect(client.deleteMonitorMessages(messageIds)).rejects.toThrow(
        'Failed to delete monitor messages'
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      const messageIds = [mockMonitorMessage.id];
      mock.onDelete('/monitor/messages').reply(500, { detail: 'Service error' });

      await expect(client.deleteMonitorMessages(messageIds)).rejects.toThrow(
        'Failed to delete monitor messages'
      );
    });

    it('should handle network timeout', async () => {
      const messageIds = [mockMonitorMessage.id];
      mock.onDelete('/monitor/messages').timeout();

      await expect(client.deleteMonitorMessages(messageIds)).rejects.toThrow();
    });
  });

  describe('getMonitorTransactions', () => {
    it('should retrieve all transactions successfully', async () => {
      mock.onGet('/monitor/transactions').reply(200, [mockMonitorTransaction]);

      const result = await client.getMonitorTransactions();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockMonitorTransaction);
    });

    it('should handle 404 Not Found', async () => {
      mock.onGet('/monitor/transactions').reply(404, { detail: 'Not found' });

      await expect(client.getMonitorTransactions()).rejects.toThrow(
        'Failed to get monitor transactions'
      );
    });

    it('should handle 401 Unauthorized', async () => {
      mock.onGet('/monitor/transactions').reply(401, { detail: 'Unauthorized' });

      await expect(client.getMonitorTransactions()).rejects.toThrow(
        'Failed to get monitor transactions'
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      mock.onGet('/monitor/transactions').reply(500, { detail: 'Service error' });

      await expect(client.getMonitorTransactions()).rejects.toThrow(
        'Failed to get monitor transactions'
      );
    });

    it('should handle network timeout', async () => {
      mock.onGet('/monitor/transactions').timeout();

      await expect(client.getMonitorTransactions()).rejects.toThrow();
    });
  });

  describe('uploadFile', () => {
    it('should upload a file successfully', async () => {
      const fileName = 'test.txt';
      const fileContent = mockFileContent;
      const flowId = mockFileMetadata.flow_id;
      const uploadResponse = { ...mockFileMetadata, file_name: fileName };
      mock.onPost(`/files/upload/${flowId}`).reply(200, uploadResponse);

      const result = await client.uploadFile({ flow_id: flowId, file: fileContent, file_name: fileName });

      expect(result).toEqual(uploadResponse);
      expect(result.file_name).toBe(fileName);
    });

    it('should handle 400 Bad Request for invalid file', async () => {
      const fileName = 'invalid.txt';
      const fileContent = mockFileContent;
      const flowId = 'test-flow-uuid';
      mock.onPost(`/files/upload/${flowId}`).reply(400, { detail: 'Invalid file format' });

      await expect(client.uploadFile({ flow_id: flowId, file: fileContent, file_name: fileName })).rejects.toThrow(
        'Failed to upload file'
      );
    });

    it('should handle 413 Payload Too Large', async () => {
      const fileName = 'large.txt';
      const fileContent = mockFileContent;
      const flowId = 'test-flow-uuid';
      mock.onPost(`/files/upload/${flowId}`).reply(413, { detail: 'File too large' });

      await expect(client.uploadFile({ flow_id: flowId, file: fileContent, file_name: fileName })).rejects.toThrow(
        'Failed to upload file'
      );
    });

    it('should handle 403 Forbidden', async () => {
      const fileName = 'test.txt';
      const fileContent = mockFileContent;
      const flowId = 'test-flow-uuid';
      mock.onPost(`/files/upload/${flowId}`).reply(403, { detail: 'Permission denied' });

      await expect(client.uploadFile({ flow_id: flowId, file: fileContent, file_name: fileName })).rejects.toThrow(
        'Failed to upload file'
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      const fileName = 'test.txt';
      const fileContent = mockFileContent;
      const flowId = 'test-flow-uuid';
      mock.onPost(`/files/upload/${flowId}`).reply(500, { detail: 'Service error' });

      await expect(client.uploadFile({ flow_id: flowId, file: fileContent, file_name: fileName })).rejects.toThrow(
        'Failed to upload file'
      );
    });

    it('should handle network timeout', async () => {
      const fileName = 'test.txt';
      const fileContent = mockFileContent;
      const flowId = 'test-flow-uuid';
      mock.onPost(`/files/upload/${flowId}`).timeout();

      await expect(client.uploadFile({ flow_id: flowId, file: fileContent, file_name: fileName })).rejects.toThrow();
    });
  });

  describe('downloadFile', () => {
    it('should download a file successfully', async () => {
      const flowId = mockFileMetadata.flow_id;
      const fileName = mockFileMetadata.file_name;
      mock.onGet(`/files/download/${flowId}/${fileName}`).reply(200, mockDownloadedFile);

      const result = await client.downloadFile({ flow_id: flowId, file_name: fileName });

      expect(result).toEqual(mockDownloadedFile);
      expect(result.file_name).toBe(fileName);
      expect(result.content).toBeDefined();
    });

    it('should handle 404 Not Found for non-existent file', async () => {
      const flowId = 'test-flow-uuid';
      const fileName = 'non-existent.txt';
      mock.onGet(`/files/download/${flowId}/${fileName}`).reply(404, { detail: 'File not found' });

      await expect(client.downloadFile({ flow_id: flowId, file_name: fileName })).rejects.toThrow(
        'Failed to download file'
      );
    });

    it('should handle 403 Forbidden', async () => {
      const flowId = 'test-flow-uuid';
      const fileName = 'test.txt';
      mock.onGet(`/files/download/${flowId}/${fileName}`).reply(403, { detail: 'Permission denied' });

      await expect(client.downloadFile({ flow_id: flowId, file_name: fileName })).rejects.toThrow(
        'Failed to download file'
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      const flowId = 'test-flow-uuid';
      const fileName = 'test.txt';
      mock.onGet(`/files/download/${flowId}/${fileName}`).reply(500, { detail: 'Service error' });

      await expect(client.downloadFile({ flow_id: flowId, file_name: fileName })).rejects.toThrow(
        'Failed to download file'
      );
    });

    it('should handle network timeout', async () => {
      const flowId = 'test-flow-uuid';
      const fileName = 'test.txt';
      mock.onGet(`/files/download/${flowId}/${fileName}`).timeout();

      await expect(client.downloadFile({ flow_id: flowId, file_name: fileName })).rejects.toThrow();
    });
  });

  describe('listFiles', () => {
    it('should list files for a flow successfully', async () => {
      const flowId = mockFileMetadata.flow_id;
      mock.onGet(`/files/list/${flowId}`).reply(200, mockFileList);

      const result = await client.listFiles({ flow_id: flowId });

      expect(result).toEqual(mockFileList);
      expect(result).toHaveLength(3);
    });

    it('should handle empty file list', async () => {
      const flowId = 'empty-flow-uuid';
      mock.onGet(`/files/list/${flowId}`).reply(200, []);

      const result = await client.listFiles({ flow_id: flowId });

      expect(result).toHaveLength(0);
    });

    it('should handle 404 Not Found for non-existent flow', async () => {
      const flowId = 'non-existent-uuid';
      mock.onGet(`/files/list/${flowId}`).reply(404, { detail: 'Flow not found' });

      await expect(client.listFiles({ flow_id: flowId })).rejects.toThrow('Failed to list files');
    });

    it('should handle 403 Forbidden', async () => {
      const flowId = 'test-flow-uuid';
      mock.onGet(`/files/list/${flowId}`).reply(403, { detail: 'Permission denied' });

      await expect(client.listFiles({ flow_id: flowId })).rejects.toThrow('Failed to list files');
    });

    it('should handle 500 Internal Server Error', async () => {
      const flowId = 'test-flow-uuid';
      mock.onGet(`/files/list/${flowId}`).reply(500, { detail: 'Service error' });

      await expect(client.listFiles({ flow_id: flowId })).rejects.toThrow('Failed to list files');
    });

    it('should handle network timeout', async () => {
      const flowId = 'test-flow-uuid';
      mock.onGet(`/files/list/${flowId}`).timeout();

      await expect(client.listFiles({ flow_id: flowId })).rejects.toThrow();
    });
  });

  describe('deleteFile', () => {
    it('should delete a file successfully', async () => {
      const flowId = mockFileMetadata.flow_id;
      const fileName = mockFileMetadata.file_name;
      mock.onDelete(`/files/delete/${flowId}/${fileName}`).reply(200, { message: 'File deleted successfully' });

      const result = await client.deleteFile({ flow_id: flowId, file_name: fileName });

      expect(result).toEqual({ message: 'File deleted successfully' });
    });

    it('should handle 404 Not Found for non-existent file', async () => {
      const flowId = 'test-flow-uuid';
      const fileName = 'non-existent.txt';
      mock.onDelete(`/files/delete/${flowId}/${fileName}`).reply(404, { detail: 'File not found' });

      await expect(client.deleteFile({ flow_id: flowId, file_name: fileName })).rejects.toThrow(
        'Failed to delete file'
      );
    });

    it('should handle 403 Forbidden', async () => {
      const flowId = 'test-flow-uuid';
      const fileName = 'test.txt';
      mock.onDelete(`/files/delete/${flowId}/${fileName}`).reply(403, { detail: 'Permission denied' });

      await expect(client.deleteFile({ flow_id: flowId, file_name: fileName })).rejects.toThrow(
        'Failed to delete file'
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      const flowId = 'test-flow-uuid';
      const fileName = 'test.txt';
      mock.onDelete(`/files/delete/${flowId}/${fileName}`).reply(500, { detail: 'Service error' });

      await expect(client.deleteFile({ flow_id: flowId, file_name: fileName })).rejects.toThrow(
        'Failed to delete file'
      );
    });

    it('should handle network timeout', async () => {
      const flowId = 'test-flow-uuid';
      const fileName = 'test.txt';
      mock.onDelete(`/files/delete/${flowId}/${fileName}`).timeout();

      await expect(client.deleteFile({ flow_id: flowId, file_name: fileName })).rejects.toThrow();
    });
  });

  describe('listStoreComponents', () => {
    it('should list all store components successfully', async () => {
      mock.onGet('/store/components/').reply(200, [mockStoreComponent]);

      const result = await client.listStoreComponents();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockStoreComponent);
    });

    it('should filter by category', async () => {
      const params = { category: 'data-sources' };
      const componentWithCategory = { ...mockStoreComponent, category: 'data-sources' };
      mock.onGet('/store/components/').reply(200, [componentWithCategory]);

      const result = await client.listStoreComponents(params);

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('data-sources');
    });

    it('should handle empty store', async () => {
      mock.onGet('/store/components/').reply(200, []);

      const result = await client.listStoreComponents();

      expect(result).toHaveLength(0);
    });

    it('should handle 401 Unauthorized', async () => {
      mock.onGet('/store/components/').reply(401, { detail: 'Unauthorized' });

      await expect(client.listStoreComponents()).rejects.toThrow('Failed to list store components');
    });

    it('should handle 500 Internal Server Error', async () => {
      mock.onGet('/store/components/').reply(500, { detail: 'Service error' });

      await expect(client.listStoreComponents()).rejects.toThrow('Failed to list store components');
    });

    it('should handle network timeout', async () => {
      mock.onGet('/store/components/').timeout();

      await expect(client.listStoreComponents()).rejects.toThrow();
    });
  });

  describe('getStoreComponent', () => {
    it('should retrieve a specific store component', async () => {
      const componentId = mockStoreComponent.id;
      mock.onGet(`/store/components/${componentId}`).reply(200, mockStoreComponent);

      const result = await client.getStoreComponent(componentId);

      expect(result).toEqual(mockStoreComponent);
      expect(result.id).toBe(componentId);
    });

    it('should handle 404 Not Found', async () => {
      const componentId = 'non-existent-uuid';
      mock.onGet(`/store/components/${componentId}`).reply(404, { detail: 'Component not found' });

      await expect(client.getStoreComponent(componentId)).rejects.toThrow('Failed to get store component');
    });

    it('should handle 401 Unauthorized', async () => {
      const componentId = mockStoreComponent.id;
      mock.onGet(`/store/components/${componentId}`).reply(401, { detail: 'Unauthorized' });

      await expect(client.getStoreComponent(componentId)).rejects.toThrow('Failed to get store component');
    });

    it('should handle 500 Internal Server Error', async () => {
      const componentId = mockStoreComponent.id;
      mock.onGet(`/store/components/${componentId}`).reply(500, { detail: 'Service error' });

      await expect(client.getStoreComponent(componentId)).rejects.toThrow('Failed to get store component');
    });

    it('should handle network timeout', async () => {
      const componentId = mockStoreComponent.id;
      mock.onGet(`/store/components/${componentId}`).timeout();

      await expect(client.getStoreComponent(componentId)).rejects.toThrow();
    });
  });

  describe('updateStoreComponent', () => {
    it('should update a store component successfully', async () => {
      const componentId = mockStoreComponent.id;
      const updates = { name: 'Updated Component' };
      mock.onPatch(`/store/components/${componentId}`).reply(200, mockStoreComponent);

      const result = await client.updateStoreComponent(componentId, updates);

      expect(result).toEqual(mockStoreComponent);
    });

    it('should handle 404 Not Found', async () => {
      const componentId = 'non-existent-uuid';
      const updates = { name: 'Updated Component' };
      mock.onPatch(`/store/components/${componentId}`).reply(404, { detail: 'Component not found' });

      await expect(client.updateStoreComponent(componentId, updates)).rejects.toThrow('Failed to update store component');
    });

    it('should handle 409 Conflict for already up-to-date', async () => {
      const componentId = mockStoreComponent.id;
      const updates = { name: 'Updated Component' };
      mock.onPatch(`/store/components/${componentId}`).reply(409, { detail: 'Already up to date' });

      await expect(client.updateStoreComponent(componentId, updates)).rejects.toThrow('Failed to update store component');
    });

    it('should handle 403 Forbidden', async () => {
      const componentId = mockStoreComponent.id;
      const updates = { name: 'Updated Component' };
      mock.onPatch(`/store/components/${componentId}`).reply(403, { detail: 'Permission denied' });

      await expect(client.updateStoreComponent(componentId, updates)).rejects.toThrow('Failed to update store component');
    });

    it('should handle 500 Internal Server Error', async () => {
      const componentId = mockStoreComponent.id;
      const updates = { name: 'Updated Component' };
      mock.onPatch(`/store/components/${componentId}`).reply(500, { detail: 'Update failed' });

      await expect(client.updateStoreComponent(componentId, updates)).rejects.toThrow('Failed to update store component');
    });

    it('should handle network timeout', async () => {
      const componentId = mockStoreComponent.id;
      const updates = { name: 'Updated Component' };
      mock.onPatch(`/store/components/${componentId}`).timeout();

      await expect(client.updateStoreComponent(componentId, updates)).rejects.toThrow();
    });
  });

  describe('buildVertex', () => {
    it('should build a single vertex successfully', async () => {
      const flowId = 'test-flow-uuid';
      const vertexId = 'vertex-1';
      mock.onPost(`/build/${flowId}/vertices/${vertexId}`).reply(200, mockVertexBuild);

      const result = await client.buildVertex({ flow_id: flowId, vertex_id: vertexId });

      expect(result).toEqual(mockVertexBuild);
      expect(result.vertex_id).toBe(vertexId);
    });

    it('should handle 404 Not Found for non-existent vertex', async () => {
      const flowId = 'test-flow-uuid';
      const vertexId = 'non-existent-vertex';
      mock.onPost(`/build/${flowId}/vertices/${vertexId}`).reply(404, { detail: 'Vertex not found' });

      await expect(client.buildVertex({ flow_id: flowId, vertex_id: vertexId })).rejects.toThrow(
        'Failed to build vertex'
      );
    });

    it('should handle 400 Bad Request for invalid vertex', async () => {
      const flowId = 'test-flow-uuid';
      const vertexId = 'invalid-vertex';
      mock.onPost(`/build/${flowId}/vertices/${vertexId}`).reply(400, { detail: 'Invalid vertex configuration' });

      await expect(client.buildVertex({ flow_id: flowId, vertex_id: vertexId })).rejects.toThrow(
        'Failed to build vertex'
      );
    });

    it('should handle 403 Forbidden', async () => {
      const flowId = 'test-flow-uuid';
      const vertexId = 'vertex-1';
      mock.onPost(`/build/${flowId}/vertices/${vertexId}`).reply(403, { detail: 'Permission denied' });

      await expect(client.buildVertex({ flow_id: flowId, vertex_id: vertexId })).rejects.toThrow(
        'Failed to build vertex'
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      const flowId = 'test-flow-uuid';
      const vertexId = 'vertex-1';
      mock.onPost(`/build/${flowId}/vertices/${vertexId}`).reply(500, { detail: 'Build failed' });

      await expect(client.buildVertex({ flow_id: flowId, vertex_id: vertexId })).rejects.toThrow(
        'Failed to build vertex'
      );
    });

    it('should handle network timeout', async () => {
      const flowId = 'test-flow-uuid';
      const vertexId = 'vertex-1';
      mock.onPost(`/build/${flowId}/vertices/${vertexId}`).timeout();

      await expect(client.buildVertex({ flow_id: flowId, vertex_id: vertexId })).rejects.toThrow();
    });
  });

  describe('buildVertices', () => {
    it('should build multiple vertices successfully', async () => {
      const flowId = 'test-flow-uuid';
      const vertices = { vertex_ids: ['vertex-1', 'vertex-2'] };
      mock.onPost(`/build/${flowId}/vertices`).reply(200, mockVerticesOrderResponse);

      const result = await client.buildVertices(flowId, vertices);

      expect(result).toEqual(mockVerticesOrderResponse);
      expect(result.ids).toHaveLength(3);
    });

    it('should handle empty vertex list', async () => {
      const flowId = 'test-flow-uuid';
      const vertices = { vertex_ids: [] };
      const emptyResponse = { ids: [], run_id: 'run-123', execution_order: [] };
      mock.onPost(`/build/${flowId}/vertices`).reply(200, emptyResponse);

      const result = await client.buildVertices(flowId, vertices);

      expect(result.ids).toHaveLength(0);
    });

    it('should handle 404 Not Found for non-existent flow', async () => {
      const flowId = 'non-existent-uuid';
      const vertices = { vertex_ids: ['vertex-1'] };
      mock.onPost(`/build/${flowId}/vertices`).reply(404, { detail: 'Flow not found' });

      await expect(client.buildVertices(flowId, vertices)).rejects.toThrow(
        'Failed to build vertices'
      );
    });

    it('should handle 400 Bad Request', async () => {
      const flowId = 'test-flow-uuid';
      const vertices = { vertex_ids: ['invalid-vertex'] };
      mock.onPost(`/build/${flowId}/vertices`).reply(400, { detail: 'Invalid vertex IDs' });

      await expect(client.buildVertices(flowId, vertices)).rejects.toThrow(
        'Failed to build vertices'
      );
    });

    it('should handle 403 Forbidden', async () => {
      const flowId = 'test-flow-uuid';
      const vertices = { vertex_ids: ['vertex-1'] };
      mock.onPost(`/build/${flowId}/vertices`).reply(403, { detail: 'Permission denied' });

      await expect(client.buildVertices(flowId, vertices)).rejects.toThrow(
        'Failed to build vertices'
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      const flowId = 'test-flow-uuid';
      const vertices = { vertex_ids: ['vertex-1'] };
      mock.onPost(`/build/${flowId}/vertices`).reply(500, { detail: 'Build failed' });

      await expect(client.buildVertices(flowId, vertices)).rejects.toThrow(
        'Failed to build vertices'
      );
    });

    it('should handle network timeout', async () => {
      const flowId = 'test-flow-uuid';
      const vertices = { vertex_ids: ['vertex-1'] };
      mock.onPost(`/build/${flowId}/vertices`).timeout();

      await expect(client.buildVertices(flowId, vertices)).rejects.toThrow();
    });

    it('should send data in request body and other params in query (API 1.7.2 breaking change)', async () => {
      const flowId = 'test-flow-uuid';
      const request = {
        data: { key: 'value', nested: { foo: 'bar' } },
        stop_component_id: 'stop-123',
        start_component_id: 'start-456'
      };

      mock.onPost(`/build/${flowId}/vertices`).reply((config) => {
        // Verify data is in request body
        const body = JSON.parse(config.data);
        expect(body).toEqual({ data: request.data });

        // Verify other params are in query string
        expect(config.params).toEqual({
          stop_component_id: 'stop-123',
          start_component_id: 'start-456'
        });

        return [200, mockVerticesOrderResponse];
      });

      const result = await client.buildVertices(flowId, request);
      expect(result).toEqual(mockVerticesOrderResponse);
    });

    it('should send empty body when no data provided', async () => {
      const flowId = 'test-flow-uuid';
      const request = { stop_component_id: 'stop-123' };

      mock.onPost(`/build/${flowId}/vertices`).reply((config) => {
        const body = JSON.parse(config.data);
        expect(body).toEqual({});
        expect(config.params).toEqual({ stop_component_id: 'stop-123' });
        return [200, mockVerticesOrderResponse];
      });

      const result = await client.buildVertices(flowId, request);
      expect(result).toEqual(mockVerticesOrderResponse);
    });
  });

  describe('streamVertexBuild', () => {
    it('should stream vertex build successfully', async () => {
      const flowId = 'test-flow-uuid';
      const vertexId = 'vertex-1';
      mock.onGet(`/build/${flowId}/${vertexId}/stream`).reply(200, mockVertexBuild);

      const result = await client.streamVertexBuild({ flow_id: flowId, vertex_id: vertexId });

      expect(result).toEqual(mockVertexBuild);
      expect(result.vertex_id).toBe(vertexId);
    });

    it('should handle 404 Not Found for non-existent vertex', async () => {
      const flowId = 'test-flow-uuid';
      const vertexId = 'non-existent-vertex';
      mock.onGet(`/build/${flowId}/${vertexId}/stream`).reply(404, { detail: 'Vertex not found' });

      await expect(client.streamVertexBuild({ flow_id: flowId, vertex_id: vertexId })).rejects.toThrow(
        'Failed to stream vertex build'
      );
    });

    it('should handle 400 Bad Request', async () => {
      const flowId = 'test-flow-uuid';
      const vertexId = 'invalid-vertex';
      mock.onGet(`/build/${flowId}/${vertexId}/stream`).reply(400, { detail: 'Invalid vertex' });

      await expect(client.streamVertexBuild({ flow_id: flowId, vertex_id: vertexId })).rejects.toThrow(
        'Failed to stream vertex build'
      );
    });

    it('should handle 403 Forbidden', async () => {
      const flowId = 'test-flow-uuid';
      const vertexId = 'vertex-1';
      mock.onGet(`/build/${flowId}/${vertexId}/stream`).reply(403, { detail: 'Permission denied' });

      await expect(client.streamVertexBuild({ flow_id: flowId, vertex_id: vertexId })).rejects.toThrow(
        'Failed to stream vertex build'
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      const flowId = 'test-flow-uuid';
      const vertexId = 'vertex-1';
      mock.onGet(`/build/${flowId}/${vertexId}/stream`).reply(500, { detail: 'Stream failed' });

      await expect(client.streamVertexBuild({ flow_id: flowId, vertex_id: vertexId })).rejects.toThrow(
        'Failed to stream vertex build'
      );
    });

    it('should handle network timeout', async () => {
      const flowId = 'test-flow-uuid';
      const vertexId = 'vertex-1';
      mock.onGet(`/build/${flowId}/${vertexId}/stream`).timeout();

      await expect(client.streamVertexBuild({ flow_id: flowId, vertex_id: vertexId })).rejects.toThrow();
    });
  });

  describe('getCurrentUser', () => {
    it('should retrieve current user successfully', async () => {
      mock.onGet('/users/whoami').reply(200, mockUser);

      const result = await client.getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(result.username).toBe(mockUser.username);
    });

    it('should handle 401 Unauthorized for unauthenticated user', async () => {
      mock.onGet('/users/whoami').reply(401, { detail: 'Not authenticated' });

      await expect(client.getCurrentUser()).rejects.toThrow('Failed to get current user');
    });

    it('should handle 500 Internal Server Error', async () => {
      mock.onGet('/users/whoami').reply(500, { detail: 'Service error' });

      await expect(client.getCurrentUser()).rejects.toThrow('Failed to get current user');
    });

    it('should handle network timeout', async () => {
      mock.onGet('/users/whoami').timeout();

      await expect(client.getCurrentUser()).rejects.toThrow();
    });
  });

  describe('listUsers', () => {
    it('should list all users successfully', async () => {
      mock.onGet('/users/').reply(200, [mockUser]);

      const result = await client.listUsers();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockUser);
    });

    it('should handle empty user list', async () => {
      mock.onGet('/users/').reply(200, []);

      const result = await client.listUsers();

      expect(result).toHaveLength(0);
    });

    it('should handle 401 Unauthorized', async () => {
      mock.onGet('/users/').reply(401, { detail: 'Unauthorized' });

      await expect(client.listUsers()).rejects.toThrow('Failed to list users');
    });

    it('should handle 403 Forbidden for non-admin users', async () => {
      mock.onGet('/users/').reply(403, { detail: 'Insufficient permissions' });

      await expect(client.listUsers()).rejects.toThrow('Failed to list users');
    });

    it('should handle 500 Internal Server Error', async () => {
      mock.onGet('/users/').reply(500, { detail: 'Service error' });

      await expect(client.listUsers()).rejects.toThrow('Failed to list users');
    });

    it('should handle network timeout', async () => {
      mock.onGet('/users/').timeout();

      await expect(client.listUsers()).rejects.toThrow();
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const userId = mockUser.id;
      const updateData = { username: 'newusername' };
      mock.onPatch(`/users/${userId}`).reply(200, { ...mockUser, ...updateData });

      const result = await client.updateUser(userId, updateData);

      expect(result.username).toBe(updateData.username);
    });

    it('should handle 404 Not Found for non-existent user', async () => {
      const userId = 'non-existent-uuid';
      const updateData = { username: 'newusername' };
      mock.onPatch(`/users/${userId}`).reply(404, { detail: 'User not found' });

      await expect(client.updateUser(userId, updateData)).rejects.toThrow('Failed to update user');
    });

    it('should handle 400 Bad Request for invalid data', async () => {
      const userId = mockUser.id;
      const updateData = { username: '' };
      mock.onPatch(`/users/${userId}`).reply(400, { detail: 'Invalid username' });

      await expect(client.updateUser(userId, updateData)).rejects.toThrow('Failed to update user');
    });

    it('should handle 401 Unauthorized', async () => {
      const userId = mockUser.id;
      const updateData = { username: 'newusername' };
      mock.onPatch(`/users/${userId}`).reply(401, { detail: 'Unauthorized' });

      await expect(client.updateUser(userId, updateData)).rejects.toThrow('Failed to update user');
    });

    it('should handle 403 Forbidden', async () => {
      const userId = mockUser.id;
      const updateData = { username: 'newusername' };
      mock.onPatch(`/users/${userId}`).reply(403, { detail: 'Insufficient permissions' });

      await expect(client.updateUser(userId, updateData)).rejects.toThrow('Failed to update user');
    });

    it('should handle 500 Internal Server Error', async () => {
      const userId = mockUser.id;
      const updateData = { username: 'newusername' };
      mock.onPatch(`/users/${userId}`).reply(500, { detail: 'Service error' });

      await expect(client.updateUser(userId, updateData)).rejects.toThrow('Failed to update user');
    });

    it('should handle network timeout', async () => {
      const userId = mockUser.id;
      const updateData = { username: 'newusername' };
      mock.onPatch(`/users/${userId}`).timeout();

      await expect(client.updateUser(userId, updateData)).rejects.toThrow();
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const userId = mockUser.id;
      mock.onDelete(`/users/${userId}`).reply(200);

      await client.deleteUser(userId);

      // deleteUser returns void, so we just check it doesn't throw
      expect(true).toBe(true);
    });

    it('should handle 404 Not Found for non-existent user', async () => {
      const userId = 'non-existent-uuid';
      mock.onDelete(`/users/${userId}`).reply(404, { detail: 'User not found' });

      await expect(client.deleteUser(userId)).rejects.toThrow('Failed to delete user');
    });

    it('should handle 401 Unauthorized', async () => {
      const userId = mockUser.id;
      mock.onDelete(`/users/${userId}`).reply(401, { detail: 'Unauthorized' });

      await expect(client.deleteUser(userId)).rejects.toThrow('Failed to delete user');
    });

    it('should handle 403 Forbidden for self-deletion or insufficient permissions', async () => {
      const userId = mockUser.id;
      mock.onDelete(`/users/${userId}`).reply(403, { detail: 'Cannot delete own account' });

      await expect(client.deleteUser(userId)).rejects.toThrow('Failed to delete user');
    });

    it('should handle 500 Internal Server Error', async () => {
      const userId = mockUser.id;
      mock.onDelete(`/users/${userId}`).reply(500, { detail: 'Service error' });

      await expect(client.deleteUser(userId)).rejects.toThrow('Failed to delete user');
    });

    it('should handle network timeout', async () => {
      const userId = mockUser.id;
      mock.onDelete(`/users/${userId}`).timeout();

      await expect(client.deleteUser(userId)).rejects.toThrow();
    });
  });

  describe('createApiKey', () => {
    it('should create API key successfully', async () => {
      const name = 'Test API Key';
      const createdApiKey = { ...mockApiKeyWithToken, name };
      mock.onPost('/api_key/').reply(200, createdApiKey);

      const result = await client.createApiKey(name);

      expect(result).toEqual(createdApiKey);
      expect(result.name).toBe(name);
    });

    it('should handle 400 Bad Request for invalid name', async () => {
      const name = '';
      mock.onPost('/api_key/').reply(400, { detail: 'Invalid API key name' });

      await expect(client.createApiKey(name)).rejects.toThrow('Failed to create API key');
    });

    it('should handle 401 Unauthorized', async () => {
      const name = 'Test API Key';
      mock.onPost('/api_key/').reply(401, { detail: 'Unauthorized' });

      await expect(client.createApiKey(name)).rejects.toThrow('Failed to create API key');
    });

    it('should handle 409 Conflict for duplicate API key name', async () => {
      const name = 'Existing Key';
      mock.onPost('/api_key/').reply(409, { detail: 'API key name already exists' });

      await expect(client.createApiKey(name)).rejects.toThrow('Failed to create API key');
    });

    it('should handle 500 Internal Server Error', async () => {
      const name = 'Test API Key';
      mock.onPost('/api_key/').reply(500, { detail: 'Service error' });

      await expect(client.createApiKey(name)).rejects.toThrow('Failed to create API key');
    });

    it('should handle network timeout', async () => {
      const name = 'Test API Key';
      mock.onPost('/api_key/').timeout();

      await expect(client.createApiKey(name)).rejects.toThrow();
    });
  });

  describe('listApiKeys', () => {
    it('should list all API keys successfully', async () => {
      mock.onGet('/api_key/').reply(200, mockApiKeysList);

      const result = await client.listApiKeys();

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(mockApiKey);
    });

    it('should handle empty API key list', async () => {
      mock.onGet('/api_key/').reply(200, []);

      const result = await client.listApiKeys();

      expect(result).toHaveLength(0);
    });

    it('should handle 401 Unauthorized', async () => {
      mock.onGet('/api_key/').reply(401, { detail: 'Unauthorized' });

      await expect(client.listApiKeys()).rejects.toThrow('Failed to list API keys');
    });

    it('should handle 500 Internal Server Error', async () => {
      mock.onGet('/api_key/').reply(500, { detail: 'Service error' });

      await expect(client.listApiKeys()).rejects.toThrow('Failed to list API keys');
    });

    it('should handle network timeout', async () => {
      mock.onGet('/api_key/').timeout();

      await expect(client.listApiKeys()).rejects.toThrow();
    });
  });

  describe('deleteApiKey', () => {
    it('should delete API key successfully', async () => {
      const keyId = mockApiKey.id;
      mock.onDelete(`/api_key/${keyId}`).reply(200);

      await client.deleteApiKey(keyId);

      // deleteApiKey returns void, so we just check it doesn't throw
      expect(true).toBe(true);
    });

    it('should handle 404 Not Found for non-existent API key', async () => {
      const keyId = 'non-existent-uuid';
      mock.onDelete(`/api_key/${keyId}`).reply(404, { detail: 'API key not found' });

      await expect(client.deleteApiKey(keyId)).rejects.toThrow('Failed to delete API key');
    });

    it('should handle 401 Unauthorized', async () => {
      const keyId = mockApiKey.id;
      mock.onDelete(`/api_key/${keyId}`).reply(401, { detail: 'Unauthorized' });

      await expect(client.deleteApiKey(keyId)).rejects.toThrow('Failed to delete API key');
    });

    it('should handle 403 Forbidden for insufficient permissions', async () => {
      const keyId = mockApiKey.id;
      mock.onDelete(`/api_key/${keyId}`).reply(403, { detail: 'Insufficient permissions' });

      await expect(client.deleteApiKey(keyId)).rejects.toThrow('Failed to delete API key');
    });

    it('should handle 500 Internal Server Error', async () => {
      const keyId = mockApiKey.id;
      mock.onDelete(`/api_key/${keyId}`).reply(500, { detail: 'Service error' });

      await expect(client.deleteApiKey(keyId)).rejects.toThrow('Failed to delete API key');
    });

    it('should handle network timeout', async () => {
      const keyId = mockApiKey.id;
      mock.onDelete(`/api_key/${keyId}`).timeout();

      await expect(client.deleteApiKey(keyId)).rejects.toThrow();
    });
  });

  describe('createCustomComponent', () => {
    it('should create custom component successfully', async () => {
      const componentData = {
        name: 'MyCustomComponent',
        code: 'class CustomProcessor: pass',
      };
      mock.onPost('/custom_component').reply(200, mockCustomComponent);

      const result = await client.createCustomComponent(componentData);

      expect(result).toEqual(mockCustomComponent);
      expect(result.name).toBe(mockCustomComponent.name);
    });

    it('should handle 400 Bad Request for invalid code', async () => {
      const componentData = {
        name: 'InvalidComponent',
        code: 'invalid python code',
      };
      mock.onPost('/custom_component').reply(400, { detail: 'Invalid Python code' });

      await expect(client.createCustomComponent(componentData)).rejects.toThrow(
        'Failed to create custom component'
      );
    });

    it('should handle 401 Unauthorized', async () => {
      const componentData = {
        name: 'CustomProcessor',
        code: 'class CustomProcessor: pass',
      };
      mock.onPost('/custom_component').reply(401, { detail: 'Unauthorized' });

      await expect(client.createCustomComponent(componentData)).rejects.toThrow(
        'Failed to create custom component'
      );
    });

    it('should handle 409 Conflict for duplicate component name', async () => {
      const componentData = {
        name: 'ExistingComponent',
        code: 'class ExistingComponent: pass',
      };
      mock.onPost('/custom_component').reply(409, { detail: 'Component already exists' });

      await expect(client.createCustomComponent(componentData)).rejects.toThrow(
        'Failed to create custom component'
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      const componentData = {
        name: 'CustomProcessor',
        code: 'class CustomProcessor: pass',
      };
      mock.onPost('/custom_component').reply(500, { detail: 'Service error' });

      await expect(client.createCustomComponent(componentData)).rejects.toThrow(
        'Failed to create custom component'
      );
    });

    it('should handle network timeout', async () => {
      const componentData = {
        name: 'CustomProcessor',
        code: 'class CustomProcessor: pass',
      };
      mock.onPost('/custom_component').timeout();

      await expect(client.createCustomComponent(componentData)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const username = 'testuser';
      const password = 'password123';
      mock.onPost('/login').reply(200, mockLoginResponse);

      const result = await client.login(username, password);

      expect(result).toEqual(mockLoginResponse);
      expect(result.access_token).toBeDefined();
    });

    it('should handle 401 Unauthorized for invalid credentials', async () => {
      const username = 'wronguser';
      const password = 'wrongpass';
      mock.onPost('/login').reply(401, { detail: 'Invalid credentials' });

      await expect(client.login(username, password)).rejects.toThrow('Failed to login');
    });

    it('should handle 400 Bad Request for missing credentials', async () => {
      const username = '';
      const password = '';
      mock.onPost('/login').reply(400, { detail: 'Missing credentials' });

      await expect(client.login(username, password)).rejects.toThrow('Failed to login');
    });

    it('should handle 500 Internal Server Error', async () => {
      const username = 'testuser';
      const password = 'password123';
      mock.onPost('/login').reply(500, { detail: 'Service error' });

      await expect(client.login(username, password)).rejects.toThrow('Failed to login');
    });

    it('should handle network timeout', async () => {
      const username = 'testuser';
      const password = 'password123';
      mock.onPost('/login').timeout();

      await expect(client.login(username, password)).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      mock.onPost('/logout').reply(200, mockLogoutResponse);

      const result = await client.logout();

      expect(result).toEqual(mockLogoutResponse);
      expect(result.message).toBeDefined();
    });

    it('should handle 401 Unauthorized for unauthenticated user', async () => {
      mock.onPost('/logout').reply(401, { detail: 'Not authenticated' });

      await expect(client.logout()).rejects.toThrow('Failed to logout');
    });

    it('should handle 500 Internal Server Error', async () => {
      mock.onPost('/logout').reply(500, { detail: 'Service error' });

      await expect(client.logout()).rejects.toThrow('Failed to logout');
    });

    it('should handle network timeout', async () => {
      mock.onPost('/logout').timeout();

      await expect(client.logout()).rejects.toThrow();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      mock.onPost('/refresh').reply(200, mockRefreshTokenResponse);

      const result = await client.refreshToken();

      expect(result).toEqual(mockRefreshTokenResponse);
      expect(result.access_token).toBeDefined();
    });

    it('should handle 401 Unauthorized for invalid refresh token', async () => {
      mock.onPost('/refresh').reply(401, { detail: 'Invalid refresh token' });

      await expect(client.refreshToken()).rejects.toThrow('Failed to refresh token');
    });

    it('should handle 400 Bad Request for missing token', async () => {
      mock.onPost('/refresh').reply(400, { detail: 'Missing refresh token' });

      await expect(client.refreshToken()).rejects.toThrow('Failed to refresh token');
    });

    it('should handle 500 Internal Server Error', async () => {
      mock.onPost('/refresh').reply(500, { detail: 'Service error' });

      await expect(client.refreshToken()).rejects.toThrow('Failed to refresh token');
    });

    it('should handle network timeout', async () => {
      mock.onPost('/refresh').timeout();

      await expect(client.refreshToken()).rejects.toThrow();
    });
  });

  describe('getVersion', () => {
    it('should retrieve version information successfully', async () => {
      mock.onGet('/version').reply(200, mockVersionInfo);

      const result = await client.getVersion();

      expect(result).toEqual(mockVersionInfo);
      expect(result.version).toBeDefined();
    });

    it('should handle 500 Internal Server Error', async () => {
      mock.onGet('/version').reply(500, { detail: 'Service error' });

      await expect(client.getVersion()).rejects.toThrow('Failed to get version');
    });

    it('should handle network timeout', async () => {
      mock.onGet('/version').timeout();

      await expect(client.getVersion()).rejects.toThrow();
    });
  });

  describe('getHealth', () => {
    it('should retrieve health status successfully', async () => {
      mock.onGet('/health').reply(200, mockHealthStatus);

      const result = await client.getHealth();

      expect(result).toEqual(mockHealthStatus);
      expect(result.status).toBe('healthy');
      expect(mock.history.get[0].baseURL).toBe('http://localhost:7860');
    });

    it('should handle unhealthy status', async () => {
      const unhealthyStatus = { status: 'unhealthy', details: 'Database connection failed' };
      mock.onGet('/health').reply(200, unhealthyStatus);

      const result = await client.getHealth();

      expect(result.status).toBe('unhealthy');
    });

    it('should handle 503 Service Unavailable', async () => {
      mock.onGet('/health').reply(503, { detail: 'Service unavailable' });

      await expect(client.getHealth()).rejects.toThrow('Failed to get health status');
    });

    it('should handle network timeout', async () => {
      mock.onGet('/health').timeout();

      await expect(client.getHealth()).rejects.toThrow();
    });
  });

  describe('getLogs', () => {
    it('should retrieve logs successfully', async () => {
      mock.onGet('/logs').reply(200, mockLogsResponse);

      const result = await client.getLogs(false);

      expect(result).toEqual(mockLogsResponse);
    });

    it('should retrieve logs without stream parameter', async () => {
      mock.onGet('/logs').reply(200, mockLogsResponse);

      const result = await client.getLogs();

      expect(result).toEqual(mockLogsResponse);
    });

    it('should handle 401 Unauthorized', async () => {
      mock.onGet('/logs').reply(401, { detail: 'Unauthorized' });

      await expect(client.getLogs()).rejects.toThrow('Failed to get logs');
    });

    it('should handle 403 Forbidden for non-admin users', async () => {
      mock.onGet('/logs').reply(403, { detail: 'Insufficient permissions' });

      await expect(client.getLogs()).rejects.toThrow('Failed to get logs');
    });

    it('should handle 500 Internal Server Error', async () => {
      mock.onGet('/logs').reply(500, { detail: 'Service error' });

      await expect(client.getLogs()).rejects.toThrow('Failed to get logs');
    });

    it('should handle network timeout', async () => {
      mock.onGet('/logs').timeout();

      await expect(client.getLogs()).rejects.toThrow();
    });
  });

  describe('getConfig', () => {
    it('should retrieve configuration successfully', async () => {
      mock.onGet('/config').reply(200, mockConfig);

      const result = await client.getConfig();

      expect(result).toEqual(mockConfig);
    });

    it('should handle 401 Unauthorized', async () => {
      mock.onGet('/config').reply(401, { detail: 'Unauthorized' });

      await expect(client.getConfig()).rejects.toThrow('Failed to get configuration');
    });

    it('should handle 403 Forbidden for non-admin users', async () => {
      mock.onGet('/config').reply(403, { detail: 'Insufficient permissions' });

      await expect(client.getConfig()).rejects.toThrow('Failed to get configuration');
    });

    it('should handle 500 Internal Server Error', async () => {
      mock.onGet('/config').reply(500, { detail: 'Service error' });

      await expect(client.getConfig()).rejects.toThrow('Failed to get configuration');
    });

    it('should handle network timeout', async () => {
      mock.onGet('/config').timeout();

      await expect(client.getConfig()).rejects.toThrow();
    });
  });

  describe('runFlowAdvanced', () => {
    it('should run flow with name instead of UUID', async () => {
      const flowName = 'my-flow-name';
      const request = { input_value: 'test' };
      mock.onPost(`/run/advanced/${flowName}`).reply(200, mockRunFlowAdvancedResponse);

      const result = await client.runFlowAdvanced(flowName, request);

      expect(result).toEqual(mockRunFlowAdvancedResponse);
    });

    it('should run flow with user_id parameter', async () => {
      const flowId = 'test-flow-uuid';
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const request = { input_value: 'test' };
      mock.onPost(`/run/advanced/${flowId}`).reply(200, mockRunFlowAdvancedResponse);

      const result = await client.runFlowAdvanced(flowId, request, false, userId);

      expect(result).toEqual(mockRunFlowAdvancedResponse);
    });

    it('should handle 404 Not Found', async () => {
      const flowName = 'non-existent';
      const request = { input_value: 'test' };
      mock.onPost(`/run/advanced/${flowName}`).reply(404, { detail: 'Flow not found' });

      await expect(client.runFlowAdvanced(flowName, request)).rejects.toThrow('Failed to run flow');
    });

    it('should handle network timeout', async () => {
      const flowName = 'test-flow';
      const request = { input_value: 'test' };
      mock.onPost(`/run/advanced/${flowName}`).timeout();

      await expect(client.runFlowAdvanced(flowName, request)).rejects.toThrow();
    });
  });

  describe('runFlowSession', () => {
    it('should run flow session successfully', async () => {
      const flowName = 'my-flow';
      const request = { session_id: 'session-123', input_value: 'hello' };
      mock.onPost(`/run/session/${flowName}`).reply(200, mockRunFlowAdvancedResponse);

      const result = await client.runFlowSession(flowName, request);

      expect(result).toEqual(mockRunFlowAdvancedResponse);
      expect(JSON.parse(mock.history.post[0].data)).toEqual({
        input_request: request
      });
      expect(mock.history.post[0].params).toEqual({ stream: false });
    });

    it('should reject streaming flow sessions before sending the request', async () => {
      const flowName = 'my-flow';
      const request = { session_id: 'session-123', input_value: 'hello' };

      await expect(client.runFlowSession(flowName, request, true)).rejects.toThrow(
        'Streaming run session responses are not supported'
      );
      expect(mock.history.post).toHaveLength(0);
    });

    it('should handle 404 Not Found for non-existent flow', async () => {
      const flowName = 'non-existent';
      const request = { session_id: 'session-123', input_value: 'test' };
      mock.onPost(`/run/session/${flowName}`).reply(404, { detail: 'Flow not found' });

      await expect(client.runFlowSession(flowName, request)).rejects.toThrow('Failed to run flow session');
    });

    it('should handle 400 Bad Request for missing session_id', async () => {
      const flowName = 'my-flow';
      const request = { session_id: '', input_value: 'test' };
      mock.onPost(`/run/session/${flowName}`).reply(400, { detail: 'Session ID required' });

      await expect(client.runFlowSession(flowName, request)).rejects.toThrow('Failed to run flow session');
    });

    it('should handle network timeout', async () => {
      const flowName = 'my-flow';
      const request = { session_id: 'session-123', input_value: 'test' };
      mock.onPost(`/run/session/${flowName}`).timeout();

      await expect(client.runFlowSession(flowName, request)).rejects.toThrow();
    });
  });

  describe('getRegistration', () => {
    it('should get registration status for registered user', async () => {
      const response = { email: 'test@example.com', registered: true };
      mock.onGet('/api/v2/registration/').reply(200, response);

      const result = await client.getRegistration();

      expect(result.registered).toBe(true);
      expect(result.email).toBe('test@example.com');
      expect(mock.history.get[0].baseURL).toBe('http://localhost:7860');
    });

    it('should get registration status for non-registered user', async () => {
      const response = { registered: false };
      mock.onGet('/api/v2/registration/').reply(200, response);

      const result = await client.getRegistration();

      expect(result.registered).toBe(false);
    });

    it('should handle 401 Unauthorized', async () => {
      mock.onGet('/api/v2/registration/').reply(401, { detail: 'Unauthorized' });

      await expect(client.getRegistration()).rejects.toThrow('Failed to get registration status');
    });

    it('should handle network timeout', async () => {
      mock.onGet('/api/v2/registration/').timeout();

      await expect(client.getRegistration()).rejects.toThrow();
    });
  });

  describe('registerUser', () => {
    it('should register user successfully', async () => {
      const email = 'newuser@example.com';
      const response = { email, registered: true };
      mock.onPost('/api/v2/registration/').reply(200, response);

      const result = await client.registerUser(email);

      expect(result.registered).toBe(true);
      expect(result.email).toBe(email);
      expect(mock.history.post[0].baseURL).toBe('http://localhost:7860');
    });

    it('should handle 400 Bad Request for invalid email', async () => {
      const email = 'invalid-email';
      mock.onPost('/api/v2/registration/').reply(400, { detail: 'Invalid email' });

      await expect(client.registerUser(email)).rejects.toThrow('Failed to register user');
    });

    it('should handle 409 Conflict for already registered email', async () => {
      const email = 'existing@example.com';
      mock.onPost('/api/v2/registration/').reply(409, { detail: 'Email already registered' });

      await expect(client.registerUser(email)).rejects.toThrow('Failed to register user');
    });

    it('should handle network timeout', async () => {
      const email = 'test@example.com';
      mock.onPost('/api/v2/registration/').timeout();

      await expect(client.registerUser(email)).rejects.toThrow();
    });
  });

  // --- Langflow 1.9.x additional endpoints ---

  describe('replaceFlow', () => {
    it('should replace a flow via PUT', async () => {
      const flowId = mockFlowRead.id;
      mock.onPut(`/flows/${flowId}`).reply(200, mockFlowRead);

      const result = await client.replaceFlow(flowId, mockFlowCreate);

      expect(result).toEqual(mockFlowRead);
      expect(mock.history.put[0].data).toBe(JSON.stringify(mockFlowCreate));
    });

    it('should handle 404 Not Found', async () => {
      mock.onPut('/flows/missing').reply(404, { detail: 'Flow not found' });

      await expect(client.replaceFlow('missing', mockFlowCreate)).rejects.toThrow(
        'Failed to replace flow'
      );
    });
  });

  describe('expandFlows', () => {
    it('should expand flows', async () => {
      const body = { nodes: ['a', 'b'] };
      const response = { expanded: true };
      mock.onPost('/flows/expand/').reply(200, response);

      const result = await client.expandFlows(body);

      expect(result).toEqual(response);
      expect(mock.history.post[0].data).toBe(JSON.stringify(body));
    });
  });

  describe('getFlowEvents', () => {
    it('should get flow events with since param', async () => {
      const flowId = 'flow-1';
      const events = [{ type: 'created' }];
      mock.onGet(`/flows/${flowId}/events`).reply(200, events);

      const result = await client.getFlowEvents(flowId, { since: 100 });

      expect(result).toEqual(events);
      expect(mock.history.get[0].params).toEqual({ since: 100 });
    });

    it('should handle errors', async () => {
      mock.onGet('/flows/flow-1/events').reply(500);
      await expect(client.getFlowEvents('flow-1')).rejects.toThrow('Failed to get events for flow');
    });
  });

  describe('createFlowEvent', () => {
    it('should create a flow event', async () => {
      const flowId = 'flow-1';
      const body = { type: 'flow_settled' as const, summary: 'shipped' };
      mock.onPost(`/flows/${flowId}/events`).reply(200, { id: 'ev-1' });

      const result = await client.createFlowEvent(flowId, body);

      expect(result).toEqual({ id: 'ev-1' });
      expect(mock.history.post[0].data).toBe(JSON.stringify(body));
    });
  });

  describe('listFlowVersions', () => {
    it('should list versions with pagination params', async () => {
      const flowId = 'flow-1';
      const versions = [{ id: 'v1' }];
      mock.onGet(`/flows/${flowId}/versions/`).reply(200, versions);

      const result = await client.listFlowVersions(flowId, { limit: 5, offset: 0 });

      expect(result).toEqual(versions);
      expect(mock.history.get[0].params).toEqual({ limit: 5, offset: 0 });
    });
  });

  describe('createFlowVersion', () => {
    it('should create a version with empty body by default', async () => {
      const flowId = 'flow-1';
      mock.onPost(`/flows/${flowId}/versions/`).reply(200, { id: 'v2' });

      const result = await client.createFlowVersion(flowId);

      expect(result).toEqual({ id: 'v2' });
      expect(mock.history.post[0].data).toBe(JSON.stringify({}));
    });
  });

  describe('getFlowVersion', () => {
    it('should get a specific version', async () => {
      mock.onGet('/flows/flow-1/versions/v1').reply(200, { id: 'v1' });

      const result = await client.getFlowVersion('flow-1', 'v1');

      expect(result).toEqual({ id: 'v1' });
    });
  });

  describe('deleteFlowVersion', () => {
    it('should delete a version', async () => {
      mock.onDelete('/flows/flow-1/versions/v1').reply(204);

      await expect(client.deleteFlowVersion('flow-1', 'v1')).resolves.toBeUndefined();
    });

    it('should handle 404', async () => {
      mock.onDelete('/flows/flow-1/versions/v1').reply(404);
      await expect(client.deleteFlowVersion('flow-1', 'v1')).rejects.toThrow(
        'Failed to delete version'
      );
    });
  });

  describe('activateFlowVersion', () => {
    it('should activate a version with save_draft param', async () => {
      mock.onPost('/flows/flow-1/versions/v1/activate').reply(200, { active: true });

      const result = await client.activateFlowVersion('flow-1', 'v1', { save_draft: true });

      expect(result).toEqual({ active: true });
      expect(mock.history.post[0].params).toEqual({ save_draft: true });
    });
  });

  describe('detectVariables', () => {
    it('should detect variables', async () => {
      const body = { flow_version_ids: ['v1', 'v2'] };
      mock.onPost('/variables/detections').reply(200, { variables: ['OPENAI_API_KEY'] });

      const result = await client.detectVariables(body);

      expect(result).toEqual({ variables: ['OPENAI_API_KEY'] });
      expect(mock.history.post[0].data).toBe(JSON.stringify(body));
    });

    it('should handle errors', async () => {
      mock.onPost('/variables/detections').reply(422, { detail: 'bad' });
      await expect(client.detectVariables({ flow_version_ids: [] })).rejects.toThrow(
        'Failed to detect variables'
      );
    });
  });

  describe('saveStoreApiKey', () => {
    it('should save the store api key with api_key body', async () => {
      mock.onPost('/api_key/store').reply(200, { ok: true });

      const result = await client.saveStoreApiKey('secret-key');

      expect(result).toEqual({ ok: true });
      expect(mock.history.post[0].data).toBe(JSON.stringify({ api_key: 'secret-key' }));
    });
  });

  describe('updateCustomComponentCode', () => {
    it('should post the update payload', async () => {
      const body = { code: 'print(1)', field: 'code', template: {} };
      mock.onPost('/custom_component/update').reply(200, { updated: true });

      const result = await client.updateCustomComponentCode(body);

      expect(result).toEqual({ updated: true });
      expect(mock.history.post[0].data).toBe(JSON.stringify(body));
    });
  });

  describe('createStoreComponent', () => {
    it('should create a store component and return id', async () => {
      const body = {
        name: 'My Comp',
        description: 'desc',
        data: {},
        tags: [],
        is_component: true
      };
      mock.onPost('/store/components/').reply(201, { id: 'comp-1' });

      const result = await client.createStoreComponent(body);

      expect(result).toEqual({ id: 'comp-1' });
      expect(mock.history.post[0].data).toBe(JSON.stringify(body));
    });
  });

  describe('likeStoreComponent', () => {
    it('should like a store component', async () => {
      mock.onPost('/store/users/likes/comp-1').reply(200, { likes: 1 });

      const result = await client.likeStoreComponent('comp-1');

      expect(result).toEqual({ likes: 1 });
    });
  });

  describe('createResponse', () => {
    it('should create an OpenAI-style response', async () => {
      const body = { model: 'flow-1', input: 'hi' };
      mock.onPost('/responses').reply(200, { id: 'resp-1' });

      const result = await client.createResponse(body);

      expect(result).toEqual({ id: 'resp-1' });
      expect(mock.history.post[0].data).toBe(JSON.stringify(body));
    });
  });

  describe('getSession', () => {
    it('should get the session', async () => {
      mock.onGet('/session').reply(200, { authenticated: true });

      const result = await client.getSession();

      expect(result).toEqual({ authenticated: true });
    });
  });

  describe('createUser', () => {
    it('should create a user', async () => {
      const body = { username: 'bob', password: 'pw' };
      mock.onPost('/users/').reply(201, mockUserRead);

      const result = await client.createUser(body);

      expect(result).toEqual(mockUserRead);
      expect(mock.history.post[0].data).toBe(JSON.stringify(body));
    });
  });

  describe('getWebhookEvents', () => {
    it('should get webhook events with user_id param', async () => {
      mock.onGet('/webhook-events/flow-1').reply(200, [{ id: 'e1' }]);

      const result = await client.getWebhookEvents('flow-1', { user_id: 'u1' });

      expect(result).toEqual([{ id: 'e1' }]);
      expect(mock.history.get[0].params).toEqual({ user_id: 'u1' });
    });
  });

  describe('getHealthCheck', () => {
    it('should hit root /health_check with baseURL override', async () => {
      mock.onGet('/health_check').reply(200, { status: 'ok', chat: 'ok', db: 'ok' });

      const result = await client.getHealthCheck();

      expect(result).toEqual({ status: 'ok', chat: 'ok', db: 'ok' });
      expect(mock.history.get[0].baseURL).toBe('http://localhost:7860');
    });
  });

  describe('uploadFlowFileLegacy', () => {
    it('should upload a file to a flow via v1 legacy endpoint', async () => {
      mock.onPost('/upload/flow-1').reply(200, { file_path: 'flow-1/x.txt' });

      const result = await client.uploadFlowFileLegacy('flow-1', Buffer.from('x'), 'x.txt');

      expect(result).toEqual({ file_path: 'flow-1/x.txt' });
    });

    it('should handle errors', async () => {
      mock.onPost('/upload/flow-1').reply(500);
      await expect(
        client.uploadFlowFileLegacy('flow-1', Buffer.from('x'), 'x.txt')
      ).rejects.toThrow('Failed to upload legacy file');
    });
  });

  describe('files v2', () => {
    it('listFilesV2 should list files at root path', async () => {
      mock.onGet('/api/v2/files').reply(200, [{ id: 'f1' }]);

      const result = await client.listFilesV2();

      expect(result).toEqual([{ id: 'f1' }]);
      expect(mock.history.get[0].baseURL).toBe('http://localhost:7860');
    });

    it('uploadFileV2 should upload with append/ephemeral params', async () => {
      mock.onPost('/api/v2/files').reply(201, { id: 'f2' });

      const result = await client.uploadFileV2(Buffer.from('x'), 'x.txt', { append: true });

      expect(result).toEqual({ id: 'f2' });
      expect(mock.history.post[0].params).toEqual({ append: true });
      expect(mock.history.post[0].baseURL).toBe('http://localhost:7860');
    });

    it('getFileV2 should get a file with return_content param', async () => {
      mock.onGet('/api/v2/files/f1').reply(200, { id: 'f1', content: 'data' });

      const result = await client.getFileV2('f1', { return_content: true });

      expect(result).toEqual({ id: 'f1', content: 'data' });
      expect(mock.history.get[0].params).toEqual({ return_content: true });
      expect(mock.history.get[0].baseURL).toBe('http://localhost:7860');
    });

    it('renameFileV2 should PUT with name query param', async () => {
      mock.onPut('/api/v2/files/f1').reply(200, { id: 'f1', name: 'new' });

      const result = await client.renameFileV2('f1', 'new');

      expect(result).toEqual({ id: 'f1', name: 'new' });
      expect(mock.history.put[0].params).toEqual({ name: 'new' });
      expect(mock.history.put[0].baseURL).toBe('http://localhost:7860');
    });

    it('deleteFileV2 should delete a single file', async () => {
      mock.onDelete('/api/v2/files/f1').reply(200, { deleted: true });

      const result = await client.deleteFileV2('f1');

      expect(result).toEqual({ deleted: true });
      expect(mock.history.delete[0].baseURL).toBe('http://localhost:7860');
    });

    it('deleteAllFilesV2 should delete all files', async () => {
      mock.onDelete('/api/v2/files').reply(200, { deleted: 5 });

      const result = await client.deleteAllFilesV2();

      expect(result).toEqual({ deleted: 5 });
      expect(mock.history.delete[0].baseURL).toBe('http://localhost:7860');
    });

    it('batchDownloadFilesV2 should post file ids', async () => {
      const ids = ['f1', 'f2'];
      mock.onPost('/api/v2/files/batch/').reply(200, { url: 'zip' });

      const result = await client.batchDownloadFilesV2(ids);

      expect(result).toEqual({ url: 'zip' });
      expect(mock.history.post[0].data).toBe(JSON.stringify(ids));
      expect(mock.history.post[0].baseURL).toBe('http://localhost:7860');
    });

    it('batchDeleteFilesV2 should send ids in delete body', async () => {
      const ids = ['f1', 'f2'];
      mock.onDelete('/api/v2/files/batch/').reply(200, { deleted: 2 });

      const result = await client.batchDeleteFilesV2(ids);

      expect(result).toEqual({ deleted: 2 });
      expect(mock.history.delete[0].data).toBe(JSON.stringify(ids));
      expect(mock.history.delete[0].baseURL).toBe('http://localhost:7860');
    });
  });

  describe('knowledge bases extras', () => {
    it('listKnowledgeBasesDetailed should hit trailing-slash path', async () => {
      mock.onGet('/knowledge_bases/').reply(200, [{ name: 'kb1' }]);

      const result = await client.listKnowledgeBasesDetailed();

      expect(result).toEqual([{ name: 'kb1' }]);
    });

    it('createKnowledgeBase should post the create body', async () => {
      const body = {
        name: 'kb1',
        embedding_provider: 'openai',
        embedding_model: 'text-embedding-3-small'
      };
      mock.onPost('/knowledge_bases').reply(201, { name: 'kb1' });

      const result = await client.createKnowledgeBase(body);

      expect(result).toEqual({ name: 'kb1' });
      expect(mock.history.post[0].data).toBe(JSON.stringify(body));
    });

    it('previewKnowledgeBaseChunks should post multipart and preserve filename', async () => {
      mock.onPost('/knowledge_bases/preview-chunks').reply(200, { chunks: 3 });

      const result = await client.previewKnowledgeBaseChunks(
        [{ buffer: Buffer.from('a'), filename: 'notes.txt' }],
        { size: 100 }
      );

      expect(result).toEqual({ chunks: 3 });

      const serialized = mock.history.post[0].data.getBuffer().toString();
      expect(serialized).toContain('filename="notes.txt"');
    });

    it('listKnowledgeBaseChunks should pass pagination params', async () => {
      mock.onGet('/knowledge_bases/kb1/chunks').reply(200, { items: [] });

      const result = await client.listKnowledgeBaseChunks('kb1', { page: 2, limit: 10 });

      expect(result).toEqual({ items: [] });
      expect(mock.history.get[0].params).toEqual({ page: 2, limit: 10 });
    });

    it('ingestKnowledgeBase should post multipart body with files field', async () => {
      mock.onPost('/knowledge_bases/kb1/ingest').reply(200, { status: 'started' });

      const result = await client.ingestKnowledgeBase(
        'kb1',
        [{ buffer: Buffer.from('x'), filename: 'doc.pdf' }],
        { mode: 'append' }
      );

      expect(result).toEqual({ status: 'started' });

      // Inspect the multipart payload: the file buffer must be under field name "files"
      const formData = mock.history.post[0].data;
      const serialized = formData.getBuffer().toString();
      expect(serialized).toContain('name="files"');
      expect(serialized).not.toContain('name="file"');
      expect(serialized).toContain('filename="doc.pdf"');
      expect(serialized).toContain('name="mode"');
    });

    it('uploadKnowledgeBase should ingest the file into the named knowledge base', async () => {
      mock.onPost('/knowledge_bases/kb1/ingest').reply(200, { status: 'started' });

      const result = await client.uploadKnowledgeBase('kb1', Buffer.from('x'), 'doc.pdf');

      expect(result).toEqual({ status: 'started' });

      const formData = mock.history.post[0].data;
      const serialized = formData.getBuffer().toString();
      expect(mock.history.post[0].url).toBe('/knowledge_bases/kb1/ingest');
      expect(serialized).toContain('name="files"');
      expect(serialized).not.toContain('name="file"');
      expect(serialized).toContain('filename="doc.pdf"');
    });

    it('cancelKnowledgeBaseIngest should post cancel', async () => {
      mock.onPost('/knowledge_bases/kb1/cancel').reply(200, { cancelled: true });

      const result = await client.cancelKnowledgeBaseIngest('kb1');

      expect(result).toEqual({ cancelled: true });
    });
  });

  describe('monitor extras', () => {
    it('updateMonitorMessage should PUT the update', async () => {
      const body = { text: 'edited', edit: true };
      mock.onPut('/monitor/messages/m1').reply(200, { id: 'm1' });

      const result = await client.updateMonitorMessage('m1', body);

      expect(result).toEqual({ id: 'm1' });
      expect(mock.history.put[0].data).toBe(JSON.stringify(body));
    });

    it('deleteMonitorSessionMessages should delete by session', async () => {
      mock.onDelete('/monitor/messages/session/s1').reply(200, { deleted: 3 });

      const result = await client.deleteMonitorSessionMessages('s1');

      expect(result).toEqual({ deleted: 3 });
    });

    it('deleteMonitorSessions should send ids in body', async () => {
      const ids = ['s1', 's2'];
      mock.onDelete('/monitor/messages/sessions').reply(200, { deleted: 2 });

      const result = await client.deleteMonitorSessions(ids);

      expect(result).toEqual({ deleted: 2 });
      expect(mock.history.delete[0].data).toBe(JSON.stringify(ids));
    });
  });

  describe('monitor shared', () => {
    it('getSharedMessages should pass required source_flow_id', async () => {
      mock.onGet('/monitor/messages/shared').reply(200, [{ id: 'm1' }]);

      const result = await client.getSharedMessages({ source_flow_id: 'flow-1' });

      expect(result).toEqual([{ id: 'm1' }]);
      expect(mock.history.get[0].params).toEqual({ source_flow_id: 'flow-1' });
    });

    it('getSharedSessions should pass source_flow_id param', async () => {
      mock.onGet('/monitor/messages/shared/sessions').reply(200, ['s1']);

      const result = await client.getSharedSessions('flow-1');

      expect(result).toEqual(['s1']);
      expect(mock.history.get[0].params).toEqual({ source_flow_id: 'flow-1' });
    });

    it('updateSharedMessage should PUT with source_flow_id param', async () => {
      const body = { edit: true };
      mock.onPut('/monitor/messages/shared/m1').reply(200, { id: 'm1' });

      const result = await client.updateSharedMessage('m1', 'flow-1', body);

      expect(result).toEqual({ id: 'm1' });
      expect(mock.history.put[0].params).toEqual({ source_flow_id: 'flow-1' });
    });

    it('migrateSharedSession should PATCH with new_session_id + source_flow_id', async () => {
      mock.onPatch('/monitor/messages/shared/session/old').reply(200, [{ id: 'm1' }]);

      const result = await client.migrateSharedSession('old', {
        new_session_id: 'new',
        source_flow_id: 'flow-1'
      });

      expect(result).toEqual([{ id: 'm1' }]);
      expect(mock.history.patch[0].params).toEqual({
        new_session_id: 'new',
        source_flow_id: 'flow-1'
      });
    });

    it('deleteSharedSession should delete with source_flow_id param', async () => {
      mock.onDelete('/monitor/messages/shared/session/s1').reply(200, { deleted: true });

      const result = await client.deleteSharedSession('s1', 'flow-1');

      expect(result).toEqual({ deleted: true });
      expect(mock.history.delete[0].params).toEqual({ source_flow_id: 'flow-1' });
    });
  });

  describe('monitor traces', () => {
    it('listTraces should pass filter params', async () => {
      mock.onGet('/monitor/traces').reply(200, { items: [] });

      const result = await client.listTraces({ flow_id: 'flow-1', page: 1 });

      expect(result).toEqual({ items: [] });
      expect(mock.history.get[0].params).toEqual({ flow_id: 'flow-1', page: 1 });
    });

    it('deleteTraces should delete with flow_id query', async () => {
      mock.onDelete('/monitor/traces').reply(200, { deleted: 4 });

      const result = await client.deleteTraces('flow-1');

      expect(result).toEqual({ deleted: 4 });
      expect(mock.history.delete[0].params).toEqual({ flow_id: 'flow-1' });
    });

    it('getTrace should get a single trace', async () => {
      mock.onGet('/monitor/traces/t1').reply(200, { id: 't1' });

      const result = await client.getTrace('t1');

      expect(result).toEqual({ id: 't1' });
    });

    it('deleteTrace should delete a single trace', async () => {
      mock.onDelete('/monitor/traces/t1').reply(204);

      await expect(client.deleteTrace('t1')).resolves.toBeUndefined();
    });
  });

  describe('models', () => {
    it('listModels should pass filter params', async () => {
      mock.onGet('/models').reply(200, { models: [] });

      const result = await client.listModels({ provider: 'openai' });

      expect(result).toEqual({ models: [] });
      expect(mock.history.get[0].params).toEqual({ provider: 'openai' });
    });

    it('listModelProviders should return string array', async () => {
      mock.onGet('/models/providers').reply(200, ['openai', 'anthropic']);

      const result = await client.listModelProviders();

      expect(result).toEqual(['openai', 'anthropic']);
    });

    it('listEnabledProviders should pass providers param', async () => {
      mock.onGet('/models/enabled_providers').reply(200, { providers: [] });

      const result = await client.listEnabledProviders({ providers: ['openai'] });

      expect(result).toEqual({ providers: [] });
      expect(mock.history.get[0].params).toEqual({ providers: ['openai'] });
    });

    it('listEnabledModels should pass model_names param', async () => {
      mock.onGet('/models/enabled_models').reply(200, { models: [] });

      const result = await client.listEnabledModels({ model_names: ['gpt-4'] });

      expect(result).toEqual({ models: [] });
      expect(mock.history.get[0].params).toEqual({ model_names: ['gpt-4'] });
    });

    it('setEnabledModels should post status updates', async () => {
      const body = [{ provider: 'openai', model_id: 'gpt-4', enabled: true }];
      mock.onPost('/models/enabled_models').reply(200, { updated: 1 });

      const result = await client.setEnabledModels(body);

      expect(result).toEqual({ updated: 1 });
      expect(mock.history.post[0].data).toBe(JSON.stringify(body));
    });

    it('getDefaultModel should pass model_type param', async () => {
      mock.onGet('/models/default_model').reply(200, { model_name: 'gpt-4' });

      const result = await client.getDefaultModel({ model_type: 'language' });

      expect(result).toEqual({ model_name: 'gpt-4' });
      expect(mock.history.get[0].params).toEqual({ model_type: 'language' });
    });

    it('setDefaultModel should post the body', async () => {
      const body = { provider: 'openai', model_name: 'gpt-4', model_type: 'language' };
      mock.onPost('/models/default_model').reply(200, { ok: true });

      const result = await client.setDefaultModel(body);

      expect(result).toEqual({ ok: true });
      expect(mock.history.post[0].data).toBe(JSON.stringify(body));
    });

    it('deleteDefaultModel should delete with model_type param', async () => {
      mock.onDelete('/models/default_model').reply(200, { deleted: true });

      const result = await client.deleteDefaultModel({ model_type: 'language' });

      expect(result).toEqual({ deleted: true });
      expect(mock.history.delete[0].params).toEqual({ model_type: 'language' });
    });

    it('getProviderVariableMapping should return mapping', async () => {
      mock.onGet('/models/provider-variable-mapping').reply(200, { openai: ['OPENAI_API_KEY'] });

      const result = await client.getProviderVariableMapping();

      expect(result).toEqual({ openai: ['OPENAI_API_KEY'] });
    });

    it('validateModelProvider should post and return validity', async () => {
      const body = { provider: 'openai', variables: { OPENAI_API_KEY: 'sk' } };
      mock.onPost('/models/validate-provider').reply(200, { valid: true });

      const result = await client.validateModelProvider(body);

      expect(result).toEqual({ valid: true });
      expect(mock.history.post[0].data).toBe(JSON.stringify(body));
    });

    it('validateModelProvider should handle errors', async () => {
      mock.onPost('/models/validate-provider').reply(400, { detail: 'bad' });
      await expect(
        client.validateModelProvider({ provider: 'x', variables: {} })
      ).rejects.toThrow('Failed to validate model provider');
    });
  });

  describe('model options', () => {
    it('getLanguageModelOptions should return options', async () => {
      mock.onGet('/model_options/language').reply(200, { options: [] });

      const result = await client.getLanguageModelOptions();

      expect(result).toEqual({ options: [] });
    });

    it('getEmbeddingModelOptions should return options', async () => {
      mock.onGet('/model_options/embedding').reply(200, { options: [] });

      const result = await client.getEmbeddingModelOptions();

      expect(result).toEqual({ options: [] });
    });
  });

  describe('agentic', () => {
    it('agenticAssist should post the request', async () => {
      const body = { flow_id: 'flow-1', input_value: 'help' };
      mock.onPost('/agentic/assist').reply(200, { result: 'ok' });

      const result = await client.agenticAssist(body);

      expect(result).toEqual({ result: 'ok' });
      expect(mock.history.post[0].data).toBe(JSON.stringify(body));
    });

    it('agenticCheckConfig should return config status', async () => {
      mock.onGet('/agentic/check-config').reply(200, { configured: true });

      const result = await client.agenticCheckConfig();

      expect(result).toEqual({ configured: true });
    });

    it('agenticExecute should post to the named flow', async () => {
      const body = { flow_id: 'flow-1' };
      mock.onPost('/agentic/execute/my-flow').reply(200, { result: 'done' });

      const result = await client.agenticExecute('my-flow', body);

      expect(result).toEqual({ result: 'done' });
      expect(mock.history.post[0].data).toBe(JSON.stringify(body));
    });
  });

  describe('workflows v2', () => {
    it('getWorkflowResult should GET with job_id param and root baseURL', async () => {
      mock.onGet('/api/v2/workflows').reply(200, { status: 'completed' });

      const result = await client.getWorkflowResult({ job_id: 'job-1' });

      expect(result).toEqual({ status: 'completed' });
      expect(mock.history.get[0].params).toEqual({ job_id: 'job-1' });
      expect(mock.history.get[0].baseURL).toBe('http://localhost:7860');
    });

    it('runWorkflow should POST the body', async () => {
      const body = { flow_id: 'flow-1', inputs: { x: 1 } };
      mock.onPost('/api/v2/workflows').reply(200, { job_id: 'job-1' });

      const result = await client.runWorkflow(body);

      expect(result).toEqual({ job_id: 'job-1' });
      expect(mock.history.post[0].data).toBe(JSON.stringify(body));
      expect(mock.history.post[0].baseURL).toBe('http://localhost:7860');
    });

    it('stopWorkflow should POST job_id body', async () => {
      mock.onPost('/api/v2/workflows/stop').reply(200, { job_id: 'job-1', message: 'stopped' });

      const result = await client.stopWorkflow('job-1');

      expect(result).toEqual({ job_id: 'job-1', message: 'stopped' });
      expect(mock.history.post[0].data).toBe(JSON.stringify({ job_id: 'job-1' }));
    });
  });

  describe('mcp v2 servers', () => {
    it('listMcpServers should GET with action_count param', async () => {
      mock.onGet('/api/v2/mcp/servers').reply(200, { servers: [] });

      const result = await client.listMcpServers({ action_count: true });

      expect(result).toEqual({ servers: [] });
      expect(mock.history.get[0].params).toEqual({ action_count: true });
      expect(mock.history.get[0].baseURL).toBe('http://localhost:7860');
    });

    it('getMcpServer should GET a single server', async () => {
      mock.onGet('/api/v2/mcp/servers/srv1').reply(200, { name: 'srv1' });

      const result = await client.getMcpServer('srv1');

      expect(result).toEqual({ name: 'srv1' });
      expect(mock.history.get[0].baseURL).toBe('http://localhost:7860');
    });

    it('createMcpServer should POST config', async () => {
      const body = { command: 'node', args: ['x.js'] };
      mock.onPost('/api/v2/mcp/servers/srv1').reply(201, { name: 'srv1' });

      const result = await client.createMcpServer('srv1', body);

      expect(result).toEqual({ name: 'srv1' });
      expect(mock.history.post[0].data).toBe(JSON.stringify(body));
      expect(mock.history.post[0].baseURL).toBe('http://localhost:7860');
    });

    it('updateMcpServer should PATCH config', async () => {
      const body = { url: 'http://x' };
      mock.onPatch('/api/v2/mcp/servers/srv1').reply(200, { name: 'srv1' });

      const result = await client.updateMcpServer('srv1', body);

      expect(result).toEqual({ name: 'srv1' });
      expect(mock.history.patch[0].data).toBe(JSON.stringify(body));
      expect(mock.history.patch[0].baseURL).toBe('http://localhost:7860');
    });

    it('deleteMcpServer should DELETE a server', async () => {
      mock.onDelete('/api/v2/mcp/servers/srv1').reply(200, { deleted: true });

      const result = await client.deleteMcpServer('srv1');

      expect(result).toEqual({ deleted: true });
      expect(mock.history.delete[0].baseURL).toBe('http://localhost:7860');
    });
  });

  describe('mcp v1 project', () => {
    it('getMcpProjectConfig should GET with mcp_enabled param', async () => {
      mock.onGet('/mcp/project/p1').reply(200, { settings: [] });

      const result = await client.getMcpProjectConfig('p1', { mcp_enabled: true });

      expect(result).toEqual({ settings: [] });
      expect(mock.history.get[0].params).toEqual({ mcp_enabled: true });
    });

    it('updateMcpProjectConfig should PATCH the body', async () => {
      const body = { settings: [{ id: 's1' }] };
      mock.onPatch('/mcp/project/p1').reply(200, { ok: true });

      const result = await client.updateMcpProjectConfig('p1', body);

      expect(result).toEqual({ ok: true });
      expect(mock.history.patch[0].data).toBe(JSON.stringify(body));
    });

    it('getMcpProjectInstalled should GET installed clients', async () => {
      mock.onGet('/mcp/project/p1/installed').reply(200, { installed: [] });

      const result = await client.getMcpProjectInstalled('p1');

      expect(result).toEqual({ installed: [] });
    });

    it('installMcpProject should POST install body', async () => {
      const body = { client: 'cursor', transport: 'sse' as const };
      mock.onPost('/mcp/project/p1/install').reply(200, { installed: true });

      const result = await client.installMcpProject('p1', body);

      expect(result).toEqual({ installed: true });
      expect(mock.history.post[0].data).toBe(JSON.stringify(body));
    });

    it('getMcpProjectComposerUrl should GET composer url', async () => {
      mock.onGet('/mcp/project/p1/composer-url').reply(200, { url: 'http://composer' });

      const result = await client.getMcpProjectComposerUrl('p1');

      expect(result).toEqual({ url: 'http://composer' });
    });

    it('installMcpProject should handle errors', async () => {
      mock.onPost('/mcp/project/p1/install').reply(500);
      await expect(
        client.installMcpProject('p1', { client: 'cursor' })
      ).rejects.toThrow('Failed to install MCP project');
    });
  });
});
