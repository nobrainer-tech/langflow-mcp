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
});
