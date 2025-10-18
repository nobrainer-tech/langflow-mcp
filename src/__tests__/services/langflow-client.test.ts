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
});
