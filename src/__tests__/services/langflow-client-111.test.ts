import { describe, it, expect, beforeEach } from 'vitest';
import axios, { AxiosInstance } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { LangflowClient } from '../../services/langflow-client';
import { LangflowConfig } from '../../types';

// Coverage for the Langflow 1.11.x client methods: A2A (Agent-to-Agent)
// protocol and the v2 workflow human-in-the-loop / public execution endpoints.
// The internal axios instance is configured with baseURL `${baseUrl}/api/v1`,
// so A2A mock paths are relative to that prefix while the v2 workflow methods
// pass a `baseURL` override and are mocked at their full `/api/v2/...` path.

const config: LangflowConfig = {
  baseUrl: 'http://localhost:7860',
  apiKey: 'test-api-key-123',
  timeout: 5000
};

describe('LangflowClient — Langflow 1.11.x endpoints', () => {
  let client: LangflowClient;
  let mock: MockAdapter;

  beforeEach(() => {
    client = new LangflowClient(config);
    mock = new MockAdapter((client as any).client as AxiosInstance);
  });

  describe('A2A protocol', () => {
    it('listA2aAgents GETs /a2a/agents on the /api/v1 client', async () => {
      mock.onGet('/a2a/agents').reply(200, [{ id: 'agent-1' }]);
      const result = await client.listA2aAgents();
      expect(result).toEqual([{ id: 'agent-1' }]);
      // Default client -> no root baseURL override (stays on the /api/v1 prefix)
      expect(mock.history.get[0].baseURL).toBe('http://localhost:7860/api/v1');
    });

    it('getA2aAgentCard GETs the well-known agent card path', async () => {
      mock.onGet('/a2a/flow-1/.well-known/agent-card.json').reply(200, { name: 'card' });
      expect(await client.getA2aAgentCard('flow-1')).toEqual({ name: 'card' });
    });

    it('invokeA2aJsonrpc POSTs the JSON-RPC envelope to /a2a/{id}/jsonrpc', async () => {
      const body = { jsonrpc: '2.0', method: 'message/send', params: { text: 'hi' }, id: 1 };
      mock.onPost('/a2a/flow-1/jsonrpc').reply(200, { result: 'ok' });
      const result = await client.invokeA2aJsonrpc('flow-1', body);
      expect(result).toEqual({ result: 'ok' });
      expect(JSON.parse(mock.history.post[0].data)).toEqual(body);
    });

    it('propagates A2A server errors', async () => {
      mock.onGet('/a2a/agents').reply(404, { detail: 'a2a disabled' });
      await expect(client.listA2aAgents()).rejects.toThrow(/Failed to list A2A agents/);
    });
  });

  describe('public build and agentic streaming', () => {
    it('buildPublicFlow posts the current public-build body and query parameters', async () => {
      const request = {
        inputs: { input_value: 'hello', type: 'chat' as const },
        files: ['uploads/input.txt']
      };
      const params = {
        log_builds: true,
        event_delivery: 'polling' as const
      };
      mock.onPost('/build_public_tmp/flow-1/flow').reply(200, { job_id: 'job-1' });

      const result = await client.buildPublicFlow('flow-1', request, params);

      expect(result).toEqual({ job_id: 'job-1' });
      expect(JSON.parse(mock.history.post[0].data)).toEqual(request);
      expect(mock.history.post[0].params).toEqual(params);
    });

    it('getPublicBuildEvents preserves streaming events as text', async () => {
      mock.onGet('/build_public_tmp/job-1/events').reply(200, 'event: progress\n\n');

      const result = await client.getPublicBuildEvents('job-1');

      expect(result).toBe('event: progress\n\n');
      expect(mock.history.get[0].responseType).toBe('text');
    });

    it('cancelPublicBuild posts to the public cancellation endpoint', async () => {
      mock.onPost('/build_public_tmp/job-1/cancel').reply(200, { success: true, message: 'cancelled' });

      await expect(client.cancelPublicBuild('job-1')).resolves.toEqual({
        success: true,
        message: 'cancelled'
      });
    });

    it('agenticAssistStream posts the current assistant request and preserves text', async () => {
      const body = { flow_id: 'flow-1', input_value: 'help', iterations_limit: 5, max_retries: 2 };
      mock.onPost('/agentic/assist/stream').reply(200, 'data: progress\n\n');

      await expect(client.agenticAssistStream(body)).resolves.toBe('data: progress\n\n');
      expect(mock.history.post[0].responseType).toBe('text');
    });
  });

  describe('workflows v2 — HITL & public', () => {
    it('listPendingWorkflows GETs /api/v2/workflows/pending with root baseURL', async () => {
      mock.onGet('/api/v2/workflows/pending').reply(200, { items: [] });
      const result = await client.listPendingWorkflows({ flow_id: 'flow-1' });
      expect(result).toEqual({ items: [] });
      expect(mock.history.get[0].params).toEqual({ flow_id: 'flow-1' });
      expect(mock.history.get[0].baseURL).toBe('http://localhost:7860');
    });

    it('getWorkflowEvents GETs /api/v2/workflows/{id}/events with root baseURL', async () => {
      mock.onGet('/api/v2/workflows/job-1/events').reply(200, { events: [] });
      const result = await client.getWorkflowEvents('job-1');
      expect(result).toEqual({ events: [] });
      expect(mock.history.get[0].baseURL).toBe('http://localhost:7860');
    });

    it('resumeWorkflow POSTs the decision body to /api/v2/workflows/{id}/resume', async () => {
      const body = { request_id: 'request-1', decision: { approved: true } };
      mock.onPost('/api/v2/workflows/job-1/resume').reply(200, { status: 'resumed' });
      const result = await client.resumeWorkflow('job-1', body);
      expect(result).toEqual({ status: 'resumed' });
      expect(JSON.parse(mock.history.post[0].data)).toEqual(body);
      expect(mock.history.post[0].baseURL).toBe('http://localhost:7860');
    });

    it('runPublicWorkflow POSTs the body to /api/v2/workflows/public', async () => {
      const body = { flow_id: 'flow-1', input_value: 'hello', mode: 'stream' as const };
      mock.onPost('/api/v2/workflows/public').reply(200, { job_id: 'job-1' });
      const result = await client.runPublicWorkflow(body);
      expect(result).toEqual({ job_id: 'job-1' });
      expect(JSON.parse(mock.history.post[0].data)).toEqual(body);
      expect(mock.history.post[0].baseURL).toBe('http://localhost:7860');
    });

    it('propagates workflow server errors', async () => {
      mock.onPost('/api/v2/workflows/job-1/resume').reply(422, { detail: 'invalid decision' });
      await expect(client.resumeWorkflow('job-1', { request_id: 'request-1', decision: {} })).rejects.toThrow(
        /Failed to resume workflow job-1/
      );
    });
  });
});
