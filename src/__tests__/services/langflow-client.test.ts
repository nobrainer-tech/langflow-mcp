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
  mockGetVertexParams,
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
      expect(mock.history.post[0].data).toContain('"stream":false');
    });

    it('should run a flow with stream enabled', async () => {
      const flowId = 'test-flow';
      mock.onPost(`/run/${flowId}`).reply(200, mockRunResponse);

      const result = await client.runFlow(flowId, mockRunFlowRequest, true);

      expect(result).toEqual(mockRunResponse);
      expect(mock.history.post[0].data).toContain('"stream":true');
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

  describe('getMonitorMessageById', () => {
    it('should retrieve a specific message by ID', async () => {
      const messageId = mockMonitorMessage.id;
      mock.onGet(`/monitor/messages/${messageId}`).reply(200, mockMonitorMessage);

      const result = await client.getMonitorMessageById(messageId);

      expect(result).toEqual(mockMonitorMessage);
      expect(result.id).toBe(messageId);
    });

    it('should handle 404 Not Found for non-existent message', async () => {
      const messageId = 'non-existent-uuid';
      mock.onGet(`/monitor/messages/${messageId}`).reply(404, { detail: 'Message not found' });

      await expect(client.getMonitorMessageById(messageId)).rejects.toThrow(
        'Failed to get monitor message'
      );
    });

    it('should handle 401 Unauthorized', async () => {
      const messageId = mockMonitorMessage.id;
      mock.onGet(`/monitor/messages/${messageId}`).reply(401, { detail: 'Unauthorized' });

      await expect(client.getMonitorMessageById(messageId)).rejects.toThrow(
        'Failed to get monitor message'
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      const messageId = mockMonitorMessage.id;
      mock.onGet(`/monitor/messages/${messageId}`).reply(500, { detail: 'Service error' });

      await expect(client.getMonitorMessageById(messageId)).rejects.toThrow(
        'Failed to get monitor message'
      );
    });

    it('should handle network timeout', async () => {
      const messageId = mockMonitorMessage.id;
      mock.onGet(`/monitor/messages/${messageId}`).timeout();

      await expect(client.getMonitorMessageById(messageId)).rejects.toThrow();
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

  describe('getMonitorTransactionById', () => {
    it('should retrieve a specific transaction by ID', async () => {
      const transactionId = mockMonitorTransaction.id;
      mock.onGet(`/monitor/transactions/${transactionId}`).reply(200, mockMonitorTransaction);

      const result = await client.getMonitorTransactionById(transactionId);

      expect(result).toEqual(mockMonitorTransaction);
      expect(result.id).toBe(transactionId);
    });

    it('should handle 404 Not Found for non-existent transaction', async () => {
      const transactionId = 'non-existent-uuid';
      mock.onGet(`/monitor/transactions/${transactionId}`).reply(404, { detail: 'Not found' });

      await expect(client.getMonitorTransactionById(transactionId)).rejects.toThrow(
        'Failed to get monitor transaction'
      );
    });

    it('should handle 401 Unauthorized', async () => {
      const transactionId = mockMonitorTransaction.id;
      mock.onGet(`/monitor/transactions/${transactionId}`).reply(401, { detail: 'Unauthorized' });

      await expect(client.getMonitorTransactionById(transactionId)).rejects.toThrow(
        'Failed to get monitor transaction'
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      const transactionId = mockMonitorTransaction.id;
      mock.onGet(`/monitor/transactions/${transactionId}`).reply(500, { detail: 'Service error' });

      await expect(client.getMonitorTransactionById(transactionId)).rejects.toThrow(
        'Failed to get monitor transaction'
      );
    });

    it('should handle network timeout', async () => {
      const transactionId = mockMonitorTransaction.id;
      mock.onGet(`/monitor/transactions/${transactionId}`).timeout();

      await expect(client.getMonitorTransactionById(transactionId)).rejects.toThrow();
    });
  });

  describe('getMonitorVertexBuilds', () => {
    it('should retrieve vertex builds with flow_id', async () => {
      const flowId = mockVertexBuild.flow_id;
      mock.onGet('/monitor/vertices/builds').reply(200, [mockVertexBuild]);

      const result = await client.getMonitorVertexBuilds({ flow_id: flowId });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockVertexBuild);
      expect(result[0].flow_id).toBe(flowId);
    });

    it('should retrieve all vertex builds without filters', async () => {
      mock.onGet('/monitor/vertices/builds').reply(200, [mockVertexBuild]);

      const result = await client.getMonitorVertexBuilds();

      expect(result).toHaveLength(1);
    });

    it('should handle 404 Not Found', async () => {
      mock.onGet('/monitor/vertices/builds').reply(404, { detail: 'Not found' });

      await expect(client.getMonitorVertexBuilds()).rejects.toThrow(
        'Failed to get monitor vertex builds'
      );
    });

    it('should handle 401 Unauthorized', async () => {
      mock.onGet('/monitor/vertices/builds').reply(401, { detail: 'Unauthorized' });

      await expect(client.getMonitorVertexBuilds()).rejects.toThrow(
        'Failed to get monitor vertex builds'
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      mock.onGet('/monitor/vertices/builds').reply(500, { detail: 'Service error' });

      await expect(client.getMonitorVertexBuilds()).rejects.toThrow(
        'Failed to get monitor vertex builds'
      );
    });

    it('should handle network timeout', async () => {
      mock.onGet('/monitor/vertices/builds').timeout();

      await expect(client.getMonitorVertexBuilds()).rejects.toThrow();
    });
  });

  describe('getMonitorVertexBuildById', () => {
    it('should retrieve a specific vertex build by ID', async () => {
      const vertexBuildId = mockVertexBuild.id;
      mock.onGet(`/monitor/vertices/builds/${vertexBuildId}`).reply(200, mockVertexBuild);

      const result = await client.getMonitorVertexBuildById(vertexBuildId);

      expect(result).toEqual(mockVertexBuild);
      expect(result.id).toBe(vertexBuildId);
    });

    it('should handle 404 Not Found for non-existent vertex build', async () => {
      const vertexBuildId = 'non-existent-uuid';
      mock.onGet(`/monitor/vertices/builds/${vertexBuildId}`).reply(404, { detail: 'Not found' });

      await expect(client.getMonitorVertexBuildById(vertexBuildId)).rejects.toThrow(
        'Failed to get monitor vertex build'
      );
    });

    it('should handle 401 Unauthorized', async () => {
      const vertexBuildId = mockVertexBuild.id;
      mock.onGet(`/monitor/vertices/builds/${vertexBuildId}`).reply(401, { detail: 'Unauthorized' });

      await expect(client.getMonitorVertexBuildById(vertexBuildId)).rejects.toThrow(
        'Failed to get monitor vertex build'
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      const vertexBuildId = mockVertexBuild.id;
      mock.onGet(`/monitor/vertices/builds/${vertexBuildId}`).reply(500, { detail: 'Service error' });

      await expect(client.getMonitorVertexBuildById(vertexBuildId)).rejects.toThrow(
        'Failed to get monitor vertex build'
      );
    });

    it('should handle network timeout', async () => {
      const vertexBuildId = mockVertexBuild.id;
      mock.onGet(`/monitor/vertices/builds/${vertexBuildId}`).timeout();

      await expect(client.getMonitorVertexBuildById(vertexBuildId)).rejects.toThrow();
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

  describe('uploadTextData', () => {
    it('should upload text data successfully', async () => {
      const flowId = mockFileMetadata.flow_id;
      const fileName = 'data.txt';
      const textContent = 'Sample text content';
      const uploadResponse = { ...mockFileMetadata, file_name: fileName };
      mock.onPost(`/files/upload/${flowId}/text`).reply(200, uploadResponse);

      const result = await client.uploadTextData({ flow_id: flowId, file_name: fileName, text_data: textContent });

      expect(result).toEqual(uploadResponse);
      expect(result.file_name).toBe(fileName);
    });

    it('should handle 400 Bad Request for invalid input', async () => {
      const flowId = 'test-flow-uuid';
      const fileName = 'data.txt';
      const textContent = 'Sample text';
      mock.onPost(`/files/upload/${flowId}/text`).reply(400, { detail: 'Invalid request' });

      await expect(client.uploadTextData({ flow_id: flowId, file_name: fileName, text_data: textContent })).rejects.toThrow(
        'Failed to upload text data'
      );
    });

    it('should handle 413 Payload Too Large', async () => {
      const flowId = 'test-flow-uuid';
      const fileName = 'large.txt';
      const textContent = 'x'.repeat(20 * 1024 * 1024);
      mock.onPost(`/files/upload/${flowId}/text`).reply(413, { detail: 'Text too large' });

      await expect(client.uploadTextData({ flow_id: flowId, file_name: fileName, text_data: textContent })).rejects.toThrow(
        'Failed to upload text data'
      );
    });

    it('should handle 403 Forbidden', async () => {
      const flowId = 'test-flow-uuid';
      const fileName = 'data.txt';
      const textContent = 'Sample text';
      mock.onPost(`/files/upload/${flowId}/text`).reply(403, { detail: 'Permission denied' });

      await expect(client.uploadTextData({ flow_id: flowId, file_name: fileName, text_data: textContent })).rejects.toThrow(
        'Failed to upload text data'
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      const flowId = 'test-flow-uuid';
      const fileName = 'data.txt';
      const textContent = 'Sample text';
      mock.onPost(`/files/upload/${flowId}/text`).reply(500, { detail: 'Service error' });

      await expect(client.uploadTextData({ flow_id: flowId, file_name: fileName, text_data: textContent })).rejects.toThrow(
        'Failed to upload text data'
      );
    });

    it('should handle network timeout', async () => {
      const flowId = 'test-flow-uuid';
      const fileName = 'data.txt';
      const textContent = 'Sample text';
      mock.onPost(`/files/upload/${flowId}/text`).timeout();

      await expect(client.uploadTextData({ flow_id: flowId, file_name: fileName, text_data: textContent })).rejects.toThrow();
    });
  });

  describe('listFilesDetailed', () => {
    it('should list files with detailed metadata successfully', async () => {
      const flowId = mockFileMetadata.flow_id;
      mock.onGet(`/files/${flowId}/detailed`).reply(200, [mockFileMetadata]);

      const result = await client.listFilesDetailed({ flow_id: flowId });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockFileMetadata);
      expect(result[0].file_name).toBe(mockFileMetadata.file_name);
    });

    it('should handle empty detailed file list', async () => {
      const flowId = 'empty-flow-uuid';
      mock.onGet(`/files/${flowId}/detailed`).reply(200, []);

      const result = await client.listFilesDetailed({ flow_id: flowId });

      expect(result).toHaveLength(0);
    });

    it('should handle 404 Not Found for non-existent flow', async () => {
      const flowId = 'non-existent-uuid';
      mock.onGet(`/files/${flowId}/detailed`).reply(404, { detail: 'Flow not found' });

      await expect(client.listFilesDetailed({ flow_id: flowId })).rejects.toThrow('Failed to get detailed file list');
    });

    it('should handle 403 Forbidden', async () => {
      const flowId = 'test-flow-uuid';
      mock.onGet(`/files/${flowId}/detailed`).reply(403, { detail: 'Permission denied' });

      await expect(client.listFilesDetailed({ flow_id: flowId })).rejects.toThrow('Failed to get detailed file list');
    });

    it('should handle 500 Internal Server Error', async () => {
      const flowId = 'test-flow-uuid';
      mock.onGet(`/files/${flowId}/detailed`).reply(500, { detail: 'Service error' });

      await expect(client.listFilesDetailed({ flow_id: flowId })).rejects.toThrow('Failed to get detailed file list');
    });

    it('should handle network timeout', async () => {
      const flowId = 'test-flow-uuid';
      mock.onGet(`/files/${flowId}/detailed`).timeout();

      await expect(client.listFilesDetailed({ flow_id: flowId })).rejects.toThrow();
    });
  });

  describe('getFileMetadata', () => {
    it('should retrieve file metadata successfully', async () => {
      const flowId = mockFileMetadata.flow_id;
      const fileName = mockFileMetadata.file_name;
      mock.onGet(`/files/${flowId}/${fileName}/metadata`).reply(200, mockFileMetadata);

      const result = await client.getFileMetadata({ flow_id: flowId, file_name: fileName });

      expect(result).toEqual(mockFileMetadata);
      expect(result.file_name).toBe(fileName);
    });

    it('should handle 404 Not Found for non-existent file', async () => {
      const flowId = 'test-flow-uuid';
      const fileName = 'non-existent.txt';
      mock.onGet(`/files/${flowId}/${fileName}/metadata`).reply(404, { detail: 'File not found' });

      await expect(client.getFileMetadata({ flow_id: flowId, file_name: fileName })).rejects.toThrow(
        'Failed to get file metadata'
      );
    });

    it('should handle 403 Forbidden', async () => {
      const flowId = 'test-flow-uuid';
      const fileName = 'test.txt';
      mock.onGet(`/files/${flowId}/${fileName}/metadata`).reply(403, { detail: 'Permission denied' });

      await expect(client.getFileMetadata({ flow_id: flowId, file_name: fileName })).rejects.toThrow(
        'Failed to get file metadata'
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      const flowId = 'test-flow-uuid';
      const fileName = 'test.txt';
      mock.onGet(`/files/${flowId}/${fileName}/metadata`).reply(500, { detail: 'Service error' });

      await expect(client.getFileMetadata({ flow_id: flowId, file_name: fileName })).rejects.toThrow(
        'Failed to get file metadata'
      );
    });

    it('should handle network timeout', async () => {
      const flowId = 'test-flow-uuid';
      const fileName = 'test.txt';
      mock.onGet(`/files/${flowId}/${fileName}/metadata`).timeout();

      await expect(client.getFileMetadata({ flow_id: flowId, file_name: fileName })).rejects.toThrow();
    });
  });

  describe('validateFlow', () => {
    it('should validate a flow successfully', async () => {
      const flowId = 'test-flow-uuid';
      mock.onPost(`/flows/${flowId}/validate`).reply(200, mockValidationSuccess);

      const result = await client.validateFlow({ flow_id: flowId });

      expect(result).toEqual(mockValidationSuccess);
      expect(result.is_valid).toBe(true);
    });

    it('should handle validation errors', async () => {
      const flowId = 'invalid-flow-uuid';
      mock.onPost(`/flows/${flowId}/validate`).reply(200, mockValidationError);

      const result = await client.validateFlow({ flow_id: flowId });

      expect(result.is_valid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });

    it('should handle 404 Not Found for non-existent flow', async () => {
      const flowId = 'non-existent-uuid';
      mock.onPost(`/flows/${flowId}/validate`).reply(404, { detail: 'Flow not found' });

      await expect(client.validateFlow({ flow_id: flowId })).rejects.toThrow('Failed to validate flow');
    });

    it('should handle 400 Bad Request', async () => {
      const flowId = 'test-flow-uuid';
      mock.onPost(`/flows/${flowId}/validate`).reply(400, { detail: 'Invalid request' });

      await expect(client.validateFlow({ flow_id: flowId })).rejects.toThrow('Failed to validate flow');
    });

    it('should handle 500 Internal Server Error', async () => {
      const flowId = 'test-flow-uuid';
      mock.onPost(`/flows/${flowId}/validate`).reply(500, { detail: 'Service error' });

      await expect(client.validateFlow({ flow_id: flowId })).rejects.toThrow('Failed to validate flow');
    });

    it('should handle network timeout', async () => {
      const flowId = 'test-flow-uuid';
      mock.onPost(`/flows/${flowId}/validate`).timeout();

      await expect(client.validateFlow({ flow_id: flowId })).rejects.toThrow();
    });
  });

  describe('validateConnection', () => {
    it('should validate a connection successfully', async () => {
      const params = {
        source_id: 'node-1',
        target_id: 'node-2',
        source_handle: 'output',
        target_handle: 'input',
      };
      mock.onPost('/validate/connection').reply(200, mockValidationSuccess);

      const result = await client.validateConnection(params);

      expect(result).toEqual(mockValidationSuccess);
      expect(result.is_valid).toBe(true);
    });

    it('should handle invalid connection', async () => {
      const params = {
        source_id: 'node-1',
        target_id: 'node-2',
        source_handle: 'output',
        target_handle: 'incompatible-input',
      };
      mock.onPost('/validate/connection').reply(200, mockValidationError);

      const result = await client.validateConnection(params);

      expect(result.is_valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle 400 Bad Request', async () => {
      const params = { source_id: 'node-1', target_id: 'node-2' };
      mock.onPost('/validate/connection').reply(400, { detail: 'Invalid request' });

      await expect(client.validateConnection(params)).rejects.toThrow('Failed to validate connection');
    });

    it('should handle 500 Internal Server Error', async () => {
      const params = { source_id: 'node-1', target_id: 'node-2' };
      mock.onPost('/validate/connection').reply(500, { detail: 'Service error' });

      await expect(client.validateConnection(params)).rejects.toThrow('Failed to validate connection');
    });

    it('should handle network timeout', async () => {
      const params = { source_id: 'node-1', target_id: 'node-2' };
      mock.onPost('/validate/connection').timeout();

      await expect(client.validateConnection(params)).rejects.toThrow();
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

  describe('installStoreComponent', () => {
    it('should install a store component successfully', async () => {
      const componentId = mockStoreComponent.id;
      mock.onPost(`/store/components/${componentId}/install`).reply(200, mockStoreInstallResponse);

      const result = await client.installStoreComponent(componentId);

      expect(result).toEqual(mockStoreInstallResponse);
      expect(result.success).toBe(true);
    });

    it('should handle already installed component', async () => {
      const componentId = mockStoreComponent.id;
      mock.onPost(`/store/components/${componentId}/install`).reply(409, { detail: 'Already installed' });

      await expect(client.installStoreComponent(componentId)).rejects.toThrow('Failed to install store component');
    });

    it('should handle 404 Not Found', async () => {
      const componentId = 'non-existent-uuid';
      mock.onPost(`/store/components/${componentId}/install`).reply(404, { detail: 'Component not found' });

      await expect(client.installStoreComponent(componentId)).rejects.toThrow('Failed to install store component');
    });

    it('should handle 403 Forbidden', async () => {
      const componentId = mockStoreComponent.id;
      mock.onPost(`/store/components/${componentId}/install`).reply(403, { detail: 'Permission denied' });

      await expect(client.installStoreComponent(componentId)).rejects.toThrow('Failed to install store component');
    });

    it('should handle 500 Internal Server Error', async () => {
      const componentId = mockStoreComponent.id;
      mock.onPost(`/store/components/${componentId}/install`).reply(500, { detail: 'Installation failed' });

      await expect(client.installStoreComponent(componentId)).rejects.toThrow('Failed to install store component');
    });

    it('should handle network timeout', async () => {
      const componentId = mockStoreComponent.id;
      mock.onPost(`/store/components/${componentId}/install`).timeout();

      await expect(client.installStoreComponent(componentId)).rejects.toThrow();
    });
  });

  describe('uninstallStoreComponent', () => {
    it('should uninstall a store component successfully', async () => {
      const componentId = mockStoreComponent.id;
      mock.onDelete(`/store/components/${componentId}/uninstall`).reply(200, { success: true });

      const result = await client.uninstallStoreComponent(componentId);

      expect(result.success).toBe(true);
    });

    it('should handle 404 Not Found for non-installed component', async () => {
      const componentId = 'non-existent-uuid';
      mock.onDelete(`/store/components/${componentId}/uninstall`).reply(404, { detail: 'Component not installed' });

      await expect(client.uninstallStoreComponent(componentId)).rejects.toThrow(
        'Failed to uninstall store component'
      );
    });

    it('should handle 403 Forbidden', async () => {
      const componentId = mockStoreComponent.id;
      mock.onDelete(`/store/components/${componentId}/uninstall`).reply(403, { detail: 'Permission denied' });

      await expect(client.uninstallStoreComponent(componentId)).rejects.toThrow(
        'Failed to uninstall store component'
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      const componentId = mockStoreComponent.id;
      mock.onDelete(`/store/components/${componentId}/uninstall`).reply(500, { detail: 'Uninstallation failed' });

      await expect(client.uninstallStoreComponent(componentId)).rejects.toThrow(
        'Failed to uninstall store component'
      );
    });

    it('should handle network timeout', async () => {
      const componentId = mockStoreComponent.id;
      mock.onDelete(`/store/components/${componentId}/uninstall`).timeout();

      await expect(client.uninstallStoreComponent(componentId)).rejects.toThrow();
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

  describe('searchStoreComponents', () => {
    it('should search store components by query', async () => {
      const query = 'openai';
      mock.onGet('/store/components/search').reply(200, [mockStoreComponent]);

      const result = await client.searchStoreComponents(query);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockStoreComponent);
    });

    it('should handle no search results', async () => {
      const query = 'nonexistent-component';
      mock.onGet('/store/components/search').reply(200, []);

      const result = await client.searchStoreComponents(query);

      expect(result).toHaveLength(0);
    });

    it('should handle 400 Bad Request for invalid query', async () => {
      const query = '';
      mock.onGet('/store/components/search').reply(400, { detail: 'Invalid query' });

      await expect(client.searchStoreComponents(query)).rejects.toThrow('Failed to search store components');
    });

    it('should handle 401 Unauthorized', async () => {
      const query = 'openai';
      mock.onGet('/store/components/search').reply(401, { detail: 'Unauthorized' });

      await expect(client.searchStoreComponents(query)).rejects.toThrow('Failed to search store components');
    });

    it('should handle 500 Internal Server Error', async () => {
      const query = 'openai';
      mock.onGet('/store/components/search').reply(500, { detail: 'Service error' });

      await expect(client.searchStoreComponents(query)).rejects.toThrow('Failed to search store components');
    });

    it('should handle network timeout', async () => {
      const query = 'openai';
      mock.onGet('/store/components/search').timeout();

      await expect(client.searchStoreComponents(query)).rejects.toThrow();
    });
  });

  describe('runAdvancedExecution', () => {
    it('should run advanced execution successfully', async () => {
      const flowId = 'test-flow-uuid';
      const params = { input_data: { query: 'test' } };
      mock.onPost(`/executions/${flowId}/advanced`).reply(200, mockAdvancedExecutionResult);

      const result = await client.runAdvancedExecution({ flow_id: flowId, ...params });

      expect(result).toEqual(mockAdvancedExecutionResult);
      expect(result.execution_id).toBeDefined();
    });

    it('should handle 404 Not Found for non-existent flow', async () => {
      const flowId = 'non-existent-uuid';
      const params = { input_data: { query: 'test' } };
      mock.onPost(`/executions/${flowId}/advanced`).reply(404, { detail: 'Flow not found' });

      await expect(client.runAdvancedExecution({ flow_id: flowId, ...params })).rejects.toThrow(
        'Failed to execute advanced flow'
      );
    });

    it('should handle 400 Bad Request for invalid input', async () => {
      const flowId = 'test-flow-uuid';
      const params = { input_data: {} };
      mock.onPost(`/executions/${flowId}/advanced`).reply(400, { detail: 'Invalid input data' });

      await expect(client.runAdvancedExecution({ flow_id: flowId, ...params })).rejects.toThrow(
        'Failed to execute advanced flow'
      );
    });

    it('should handle 403 Forbidden', async () => {
      const flowId = 'test-flow-uuid';
      const params = { input_data: { query: 'test' } };
      mock.onPost(`/executions/${flowId}/advanced`).reply(403, { detail: 'Permission denied' });

      await expect(client.runAdvancedExecution({ flow_id: flowId, ...params })).rejects.toThrow(
        'Failed to execute advanced flow'
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      const flowId = 'test-flow-uuid';
      const params = { input_data: { query: 'test' } };
      mock.onPost(`/executions/${flowId}/advanced`).reply(500, { detail: 'Execution failed' });

      await expect(client.runAdvancedExecution({ flow_id: flowId, ...params })).rejects.toThrow(
        'Failed to execute advanced flow'
      );
    });

    it('should handle network timeout', async () => {
      const flowId = 'test-flow-uuid';
      const params = { input_data: { query: 'test' } };
      mock.onPost(`/executions/${flowId}/advanced`).timeout();

      await expect(client.runAdvancedExecution({ flow_id: flowId, ...params })).rejects.toThrow();
    });
  });

  describe('getExecutionResult', () => {
    it('should retrieve execution result successfully', async () => {
      const executionId = mockAdvancedExecutionResult.execution_id;
      mock.onGet(`/executions/${executionId}/result`).reply(200, mockAdvancedExecutionResult);

      const result = await client.getExecutionResult({ execution_id: executionId });

      expect(result).toEqual(mockAdvancedExecutionResult);
      expect(result.execution_id).toBe(executionId);
    });

    it('should handle 404 Not Found for non-existent execution', async () => {
      const executionId = 'non-existent-uuid';
      mock.onGet(`/executions/${executionId}/result`).reply(404, { detail: 'Execution not found' });

      await expect(client.getExecutionResult({ execution_id: executionId })).rejects.toThrow('Failed to get execution result');
    });

    it('should handle 401 Unauthorized', async () => {
      const executionId = mockAdvancedExecutionResult.execution_id;
      mock.onGet(`/executions/${executionId}/result`).reply(401, { detail: 'Unauthorized' });

      await expect(client.getExecutionResult({ execution_id: executionId })).rejects.toThrow('Failed to get execution result');
    });

    it('should handle 500 Internal Server Error', async () => {
      const executionId = mockAdvancedExecutionResult.execution_id;
      mock.onGet(`/executions/${executionId}/result`).reply(500, { detail: 'Service error' });

      await expect(client.getExecutionResult({ execution_id: executionId })).rejects.toThrow('Failed to get execution result');
    });

    it('should handle network timeout', async () => {
      const executionId = mockAdvancedExecutionResult.execution_id;
      mock.onGet(`/executions/${executionId}/result`).timeout();

      await expect(client.getExecutionResult({ execution_id: executionId })).rejects.toThrow();
    });
  });

  describe('cancelExecution', () => {
    it('should cancel execution successfully', async () => {
      const executionId = mockAdvancedExecutionResult.execution_id;
      mock.onPost(`/executions/${executionId}/cancel`).reply(200, { success: true, message: 'Execution cancelled' });

      const result = await client.cancelExecution({ execution_id: executionId });

      expect(result.success).toBe(true);
    });

    it('should handle 404 Not Found for non-existent execution', async () => {
      const executionId = 'non-existent-uuid';
      mock.onPost(`/executions/${executionId}/cancel`).reply(404, { detail: 'Execution not found' });

      await expect(client.cancelExecution({ execution_id: executionId })).rejects.toThrow('Failed to cancel execution');
    });

    it('should handle 409 Conflict for already completed execution', async () => {
      const executionId = mockAdvancedExecutionResult.execution_id;
      mock.onPost(`/executions/${executionId}/cancel`).reply(409, { detail: 'Execution already completed' });

      await expect(client.cancelExecution({ execution_id: executionId })).rejects.toThrow('Failed to cancel execution');
    });

    it('should handle 403 Forbidden', async () => {
      const executionId = mockAdvancedExecutionResult.execution_id;
      mock.onPost(`/executions/${executionId}/cancel`).reply(403, { detail: 'Permission denied' });

      await expect(client.cancelExecution({ execution_id: executionId })).rejects.toThrow('Failed to cancel execution');
    });

    it('should handle 500 Internal Server Error', async () => {
      const executionId = mockAdvancedExecutionResult.execution_id;
      mock.onPost(`/executions/${executionId}/cancel`).reply(500, { detail: 'Service error' });

      await expect(client.cancelExecution({ execution_id: executionId })).rejects.toThrow('Failed to cancel execution');
    });

    it('should handle network timeout', async () => {
      const executionId = mockAdvancedExecutionResult.execution_id;
      mock.onPost(`/executions/${executionId}/cancel`).timeout();

      await expect(client.cancelExecution({ execution_id: executionId })).rejects.toThrow();
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

  describe('getUserById', () => {
    it('should retrieve a specific user by ID', async () => {
      const userId = mockUser.id;
      mock.onGet(`/users/${userId}`).reply(200, mockUser);

      const result = await client.getUserById(userId);

      expect(result).toEqual(mockUser);
      expect(result.id).toBe(userId);
    });

    it('should handle 404 Not Found for non-existent user', async () => {
      const userId = 'non-existent-uuid';
      mock.onGet(`/users/${userId}`).reply(404, { detail: 'User not found' });

      await expect(client.getUserById(userId)).rejects.toThrow('Failed to get user');
    });

    it('should handle 401 Unauthorized', async () => {
      const userId = mockUser.id;
      mock.onGet(`/users/${userId}`).reply(401, { detail: 'Unauthorized' });

      await expect(client.getUserById(userId)).rejects.toThrow('Failed to get user');
    });

    it('should handle 403 Forbidden', async () => {
      const userId = mockUser.id;
      mock.onGet(`/users/${userId}`).reply(403, { detail: 'Insufficient permissions' });

      await expect(client.getUserById(userId)).rejects.toThrow('Failed to get user');
    });

    it('should handle 500 Internal Server Error', async () => {
      const userId = mockUser.id;
      mock.onGet(`/users/${userId}`).reply(500, { detail: 'Service error' });

      await expect(client.getUserById(userId)).rejects.toThrow('Failed to get user');
    });

    it('should handle network timeout', async () => {
      const userId = mockUser.id;
      mock.onGet(`/users/${userId}`).timeout();

      await expect(client.getUserById(userId)).rejects.toThrow();
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

  describe('deleteCustomComponent', () => {
    it('should delete custom component successfully', async () => {
      const componentId = mockCustomComponent.id;
      mock.onDelete(`/custom_component/${componentId}`).reply(200);

      await client.deleteCustomComponent(componentId);

      // deleteCustomComponent returns void, so we just check it doesn't throw
      expect(true).toBe(true);
    });

    it('should handle 404 Not Found for non-existent component', async () => {
      const componentId = 'non-existent-uuid';
      mock.onDelete(`/custom_components/${componentId}`).reply(404, { detail: 'Component not found' });

      await expect(client.deleteCustomComponent(componentId)).rejects.toThrow(
        'Failed to delete custom component'
      );
    });

    it('should handle 401 Unauthorized', async () => {
      const componentId = mockCustomComponent.id;
      mock.onDelete(`/custom_components/${componentId}`).reply(401, { detail: 'Unauthorized' });

      await expect(client.deleteCustomComponent(componentId)).rejects.toThrow(
        'Failed to delete custom component'
      );
    });

    it('should handle 403 Forbidden', async () => {
      const componentId = mockCustomComponent.id;
      mock.onDelete(`/custom_components/${componentId}`).reply(403, { detail: 'Insufficient permissions' });

      await expect(client.deleteCustomComponent(componentId)).rejects.toThrow(
        'Failed to delete custom component'
      );
    });

    it('should handle 409 Conflict for component in use', async () => {
      const componentId = mockCustomComponent.id;
      mock.onDelete(`/custom_components/${componentId}`).reply(409, { detail: 'Component is in use' });

      await expect(client.deleteCustomComponent(componentId)).rejects.toThrow(
        'Failed to delete custom component'
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      const componentId = mockCustomComponent.id;
      mock.onDelete(`/custom_components/${componentId}`).reply(500, { detail: 'Service error' });

      await expect(client.deleteCustomComponent(componentId)).rejects.toThrow(
        'Failed to delete custom component'
      );
    });

    it('should handle network timeout', async () => {
      const componentId = mockCustomComponent.id;
      mock.onDelete(`/custom_components/${componentId}`).timeout();

      await expect(client.deleteCustomComponent(componentId)).rejects.toThrow();
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

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const username = 'newuser';
      const password = 'securepass123';
      const email = 'newuser@example.com';
      const registeredUser = { ...mockUser, username, email };
      mock.onPost('/register').reply(200, registeredUser);

      const result = await client.register(username, password, email);

      expect(result).toEqual(registeredUser);
      expect(result.username).toBe(username);
    });

    it('should handle 400 Bad Request for invalid data', async () => {
      const username = '';
      const password = '123';
      const email = 'invalid-email';
      mock.onPost('/register').reply(400, { detail: 'Invalid registration data' });

      await expect(client.register(username, password, email)).rejects.toThrow('Failed to register user');
    });

    it('should handle 409 Conflict for duplicate username', async () => {
      const username = 'existinguser';
      const password = 'pass123';
      const email = 'user@example.com';
      mock.onPost('/register').reply(409, { detail: 'Username already exists' });

      await expect(client.register(username, password, email)).rejects.toThrow('Failed to register user');
    });

    it('should handle 500 Internal Server Error', async () => {
      const username = 'newuser';
      const password = 'securepass123';
      const email = 'newuser@example.com';
      mock.onPost('/register').reply(500, { detail: 'Service error' });

      await expect(client.register(username, password, email)).rejects.toThrow('Failed to register user');
    });

    it('should handle network timeout', async () => {
      const username = 'newuser';
      const password = 'securepass123';
      const email = 'newuser@example.com';
      mock.onPost('/register').timeout();

      await expect(client.register(username, password, email)).rejects.toThrow();
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

  describe('updateConfig', () => {
    it('should update configuration successfully', async () => {
      const configData = { max_workers: 10, timeout: 300 };
      mock.onPatch('/config').reply(200, { ...mockConfig, ...configData });

      const result = await client.updateConfig(configData);

      expect(result.max_workers).toBe(configData.max_workers);
    });

    it('should handle 400 Bad Request for invalid configuration', async () => {
      const configData = { max_workers: -5 };
      mock.onPatch('/config').reply(400, { detail: 'Invalid configuration value' });

      await expect(client.updateConfig(configData)).rejects.toThrow('Failed to update configuration');
    });

    it('should handle 401 Unauthorized', async () => {
      const configData = { max_workers: 10 };
      mock.onPatch('/config').reply(401, { detail: 'Unauthorized' });

      await expect(client.updateConfig(configData)).rejects.toThrow('Failed to update configuration');
    });

    it('should handle 403 Forbidden for non-admin users', async () => {
      const configData = { max_workers: 10 };
      mock.onPatch('/config').reply(403, { detail: 'Insufficient permissions' });

      await expect(client.updateConfig(configData)).rejects.toThrow('Failed to update configuration');
    });

    it('should handle 500 Internal Server Error', async () => {
      const configData = { max_workers: 10 };
      mock.onPatch('/config').reply(500, { detail: 'Service error' });

      await expect(client.updateConfig(configData)).rejects.toThrow('Failed to update configuration');
    });

    it('should handle network timeout', async () => {
      const configData = { max_workers: 10 };
      mock.onPatch('/config').timeout();

      await expect(client.updateConfig(configData)).rejects.toThrow();
    });
  });

  describe('getStats', () => {
    it('should retrieve statistics successfully', async () => {
      mock.onGet('/stats').reply(200, mockStats);

      const result = await client.getStats();

      expect(result).toEqual(mockStats);
      expect(result.total_flows).toBeDefined();
    });

    it('should handle 401 Unauthorized', async () => {
      mock.onGet('/stats').reply(401, { detail: 'Unauthorized' });

      await expect(client.getStats()).rejects.toThrow('Failed to get statistics');
    });

    it('should handle 403 Forbidden for non-admin users', async () => {
      mock.onGet('/stats').reply(403, { detail: 'Insufficient permissions' });

      await expect(client.getStats()).rejects.toThrow('Failed to get statistics');
    });

    it('should handle 500 Internal Server Error', async () => {
      mock.onGet('/stats').reply(500, { detail: 'Service error' });

      await expect(client.getStats()).rejects.toThrow('Failed to get statistics');
    });

    it('should handle network timeout', async () => {
      mock.onGet('/stats').timeout();

      await expect(client.getStats()).rejects.toThrow();
    });
  });

  describe('exportFlow', () => {
    it('should export flow successfully', async () => {
      const flowId = mockFlow.id;
      mock.onGet(`/flows/${flowId}/export`).reply(200, mockExportedFlow);

      const result = await client.exportFlow(flowId);

      expect(result).toEqual(mockExportedFlow);
      expect(result.flow).toBeDefined();
    });

    it('should handle 404 Not Found for non-existent flow', async () => {
      const flowId = 'non-existent-uuid';
      mock.onGet(`/flows/${flowId}/export`).reply(404, { detail: 'Flow not found' });

      await expect(client.exportFlow(flowId)).rejects.toThrow('Failed to export flow');
    });

    it('should handle 401 Unauthorized', async () => {
      const flowId = mockFlow.id;
      mock.onGet(`/flows/${flowId}/export`).reply(401, { detail: 'Unauthorized' });

      await expect(client.exportFlow(flowId)).rejects.toThrow('Failed to export flow');
    });

    it('should handle 403 Forbidden', async () => {
      const flowId = mockFlow.id;
      mock.onGet(`/flows/${flowId}/export`).reply(403, { detail: 'Insufficient permissions' });

      await expect(client.exportFlow(flowId)).rejects.toThrow('Failed to export flow');
    });

    it('should handle 500 Internal Server Error', async () => {
      const flowId = mockFlow.id;
      mock.onGet(`/flows/${flowId}/export`).reply(500, { detail: 'Service error' });

      await expect(client.exportFlow(flowId)).rejects.toThrow('Failed to export flow');
    });

    it('should handle network timeout', async () => {
      const flowId = mockFlow.id;
      mock.onGet(`/flows/${flowId}/export`).timeout();

      await expect(client.exportFlow(flowId)).rejects.toThrow();
    });
  });

  describe('importFlow', () => {
    it('should import flow successfully', async () => {
      const flowData = mockExportedFlow;
      mock.onPost('/flows/import').reply(200, mockFlow);

      const result = await client.importFlow(flowData);

      expect(result).toEqual(mockFlow);
      expect(result.id).toBeDefined();
    });

    it('should handle 400 Bad Request for invalid flow data', async () => {
      const flowData = { invalid: 'data' };
      mock.onPost('/flows/import').reply(400, { detail: 'Invalid flow data' });

      await expect(client.importFlow(flowData)).rejects.toThrow('Failed to import flow');
    });

    it('should handle 401 Unauthorized', async () => {
      const flowData = mockExportedFlow;
      mock.onPost('/flows/import').reply(401, { detail: 'Unauthorized' });

      await expect(client.importFlow(flowData)).rejects.toThrow('Failed to import flow');
    });

    it('should handle 409 Conflict for duplicate flow', async () => {
      const flowData = mockExportedFlow;
      mock.onPost('/flows/import').reply(409, { detail: 'Flow already exists' });

      await expect(client.importFlow(flowData)).rejects.toThrow('Failed to import flow');
    });

    it('should handle 500 Internal Server Error', async () => {
      const flowData = mockExportedFlow;
      mock.onPost('/flows/import').reply(500, { detail: 'Import failed' });

      await expect(client.importFlow(flowData)).rejects.toThrow('Failed to import flow');
    });

    it('should handle network timeout', async () => {
      const flowData = mockExportedFlow;
      mock.onPost('/flows/import').timeout();

      await expect(client.importFlow(flowData)).rejects.toThrow();
    });
  });

  describe('cloneFlow', () => {
    it('should clone flow successfully', async () => {
      const flowId = mockFlow.id;
      const cloneName = 'Cloned Flow';
      const clonedFlow = { ...mockFlow, id: 'cloned-flow-uuid', name: cloneName };
      mock.onPost(`/flows/${flowId}/clone`).reply(200, clonedFlow);

      const result = await client.cloneFlow(flowId, cloneName);

      expect(result.name).toBe(cloneName);
      expect(result.id).not.toBe(flowId);
    });

    it('should handle 404 Not Found for non-existent flow', async () => {
      const flowId = 'non-existent-uuid';
      mock.onPost(`/flows/${flowId}/clone`).reply(404, { detail: 'Flow not found' });

      await expect(client.cloneFlow(flowId)).rejects.toThrow('Failed to clone flow');
    });

    it('should handle 401 Unauthorized', async () => {
      const flowId = mockFlow.id;
      mock.onPost(`/flows/${flowId}/clone`).reply(401, { detail: 'Unauthorized' });

      await expect(client.cloneFlow(flowId)).rejects.toThrow('Failed to clone flow');
    });

    it('should handle 403 Forbidden', async () => {
      const flowId = mockFlow.id;
      mock.onPost(`/flows/${flowId}/clone`).reply(403, { detail: 'Insufficient permissions' });

      await expect(client.cloneFlow(flowId)).rejects.toThrow('Failed to clone flow');
    });

    it('should handle 500 Internal Server Error', async () => {
      const flowId = mockFlow.id;
      mock.onPost(`/flows/${flowId}/clone`).reply(500, { detail: 'Clone failed' });

      await expect(client.cloneFlow(flowId)).rejects.toThrow('Failed to clone flow');
    });

    it('should handle network timeout', async () => {
      const flowId = mockFlow.id;
      mock.onPost(`/flows/${flowId}/clone`).timeout();

      await expect(client.cloneFlow(flowId)).rejects.toThrow();
    });
  });

  describe('getFlowDependencies', () => {
    it('should retrieve flow dependencies successfully', async () => {
      const flowId = mockFlow.id;
      mock.onGet(`/flows/${flowId}/dependencies`).reply(200, mockFlowDependencies);

      const result = await client.getFlowDependencies(flowId);

      expect(result).toEqual(mockFlowDependencies);
      expect(result.dependencies).toBeDefined();
    });

    it('should handle 404 Not Found for non-existent flow', async () => {
      const flowId = 'non-existent-uuid';
      mock.onGet(`/flows/${flowId}/dependencies`).reply(404, { detail: 'Flow not found' });

      await expect(client.getFlowDependencies(flowId)).rejects.toThrow('Failed to get flow dependencies');
    });

    it('should handle 401 Unauthorized', async () => {
      const flowId = mockFlow.id;
      mock.onGet(`/flows/${flowId}/dependencies`).reply(401, { detail: 'Unauthorized' });

      await expect(client.getFlowDependencies(flowId)).rejects.toThrow('Failed to get flow dependencies');
    });

    it('should handle 403 Forbidden', async () => {
      const flowId = mockFlow.id;
      mock.onGet(`/flows/${flowId}/dependencies`).reply(403, { detail: 'Insufficient permissions' });

      await expect(client.getFlowDependencies(flowId)).rejects.toThrow('Failed to get flow dependencies');
    });

    it('should handle 500 Internal Server Error', async () => {
      const flowId = mockFlow.id;
      mock.onGet(`/flows/${flowId}/dependencies`).reply(500, { detail: 'Service error' });

      await expect(client.getFlowDependencies(flowId)).rejects.toThrow('Failed to get flow dependencies');
    });

    it('should handle network timeout', async () => {
      const flowId = mockFlow.id;
      mock.onGet(`/flows/${flowId}/dependencies`).timeout();

      await expect(client.getFlowDependencies(flowId)).rejects.toThrow();
    });
  });

  describe('getAiNodes', () => {
    it('should retrieve AI nodes successfully', async () => {
      mock.onGet('/ai_nodes').reply(200, [mockAiNode]);

      const result = await client.getAiNodes();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockAiNode);
    });

    it('should handle empty AI nodes list', async () => {
      mock.onGet('/ai_nodes').reply(200, []);

      const result = await client.getAiNodes();

      expect(result).toHaveLength(0);
    });

    it('should handle 401 Unauthorized', async () => {
      mock.onGet('/ai_nodes').reply(401, { detail: 'Unauthorized' });

      await expect(client.getAiNodes()).rejects.toThrow('Failed to get AI nodes');
    });

    it('should handle 500 Internal Server Error', async () => {
      mock.onGet('/ai_nodes').reply(500, { detail: 'Service error' });

      await expect(client.getAiNodes()).rejects.toThrow('Failed to get AI nodes');
    });

    it('should handle network timeout', async () => {
      mock.onGet('/ai_nodes').timeout();

      await expect(client.getAiNodes()).rejects.toThrow();
    });
  });
});
