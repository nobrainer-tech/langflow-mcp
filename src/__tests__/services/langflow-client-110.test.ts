import { describe, it, expect, beforeEach } from 'vitest';
import axios, { AxiosInstance } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { LangflowClient } from '../../services/langflow-client';
import { LangflowConfig } from '../../types';

// Coverage for the Langflow 1.10.0 client methods (authz, memory bases,
// knowledge-base overhaul, extensions, agentic sandbox, misc). The internal
// axios instance is configured with baseURL `${baseUrl}/api/v1`, so the mock
// paths below are relative to that prefix.

const config: LangflowConfig = {
  baseUrl: 'http://localhost:7860',
  apiKey: 'test-api-key-123',
  timeout: 5000
};

describe('LangflowClient — Langflow 1.10.0 endpoints', () => {
  let client: LangflowClient;
  let mock: MockAdapter;

  beforeEach(() => {
    client = new LangflowClient(config);
    mock = new MockAdapter((client as any).client as AxiosInstance);
  });

  describe('authz: roles', () => {
    it('listAuthzRoles GETs /authz/roles with filters', async () => {
      mock.onGet('/authz/roles').reply(200, [{ id: 'r1', name: 'editor' }]);
      const result = await client.listAuthzRoles({ is_system: false, limit: 10 });
      expect(result).toEqual([{ id: 'r1', name: 'editor' }]);
      expect(mock.history.get[0].params).toEqual({ is_system: false, limit: 10 });
    });

    it('getAuthzRole GETs /authz/roles/{id}', async () => {
      mock.onGet('/authz/roles/r1').reply(200, { id: 'r1' });
      expect(await client.getAuthzRole('r1')).toEqual({ id: 'r1' });
    });

    it('createAuthzRole POSTs the body', async () => {
      mock.onPost('/authz/roles').reply(201, { id: 'r2' });
      const result = await client.createAuthzRole({ name: 'viewer', permissions: ['flow:read'] });
      expect(result).toEqual({ id: 'r2' });
      expect(JSON.parse(mock.history.post[0].data)).toEqual({ name: 'viewer', permissions: ['flow:read'] });
    });

    it('updateAuthzRole PATCHes /authz/roles/{id}', async () => {
      mock.onPatch('/authz/roles/r1').reply(200, { id: 'r1', name: 'x' });
      const result = await client.updateAuthzRole('r1', { name: 'x' });
      expect(result).toEqual({ id: 'r1', name: 'x' });
    });

    it('deleteAuthzRole DELETEs /authz/roles/{id}', async () => {
      mock.onDelete('/authz/roles/r1').reply(204);
      await expect(client.deleteAuthzRole('r1')).resolves.toBeUndefined();
    });

    it('propagates server errors', async () => {
      mock.onGet('/authz/roles/r1').reply(403, { detail: 'forbidden' });
      await expect(client.getAuthzRole('r1')).rejects.toThrow(/Failed to get authz role r1/);
    });
  });

  describe('authz: assignments, teams, shares', () => {
    it('createAuthzRoleAssignment POSTs /authz/role-assignments', async () => {
      mock.onPost('/authz/role-assignments').reply(201, { id: 'a1' });
      const result = await client.createAuthzRoleAssignment({ user_id: 'u1', role_id: 'r1' });
      expect(result).toEqual({ id: 'a1' });
    });

    it('deleteAuthzRoleAssignment DELETEs /authz/role-assignments/{id}', async () => {
      mock.onDelete('/authz/role-assignments/a1').reply(204);
      await expect(client.deleteAuthzRoleAssignment('a1')).resolves.toBeUndefined();
    });

    it('addAuthzTeamMember POSTs /authz/teams/{id}/members', async () => {
      mock.onPost('/authz/teams/t1/members').reply(201, { id: 'm1' });
      const result = await client.addAuthzTeamMember('t1', { user_id: 'u1' });
      expect(result).toEqual({ id: 'm1' });
    });

    it('removeAuthzTeamMember DELETEs /authz/teams/{id}/members/{userId}', async () => {
      mock.onDelete('/authz/teams/t1/members/u1').reply(204);
      await expect(client.removeAuthzTeamMember('t1', 'u1')).resolves.toBeUndefined();
    });

    it('updateAuthzShare PATCHes /authz/shares/{id}', async () => {
      mock.onPatch('/authz/shares/s1').reply(200, { id: 's1', permission_level: 'write' });
      const result = await client.updateAuthzShare('s1', { permission_level: 'write' });
      expect(result).toEqual({ id: 's1', permission_level: 'write' });
    });
  });

  describe('authz: audit + permissions', () => {
    it('getAuthzAudit GETs /authz/audit with params', async () => {
      mock.onGet('/authz/audit').reply(200, { items: [], total: 0 });
      await client.getAuthzAudit({ result: 'allow', action: 'role.create' });
      expect(mock.history.get[0].params).toEqual({ result: 'allow', action: 'role.create' });
    });

    it('getMyPermissions POSTs /authz/me/permissions', async () => {
      mock.onPost('/authz/me/permissions').reply(200, { resource_type: 'flow', permissions: {} });
      const result = await client.getMyPermissions({ resource_type: 'flow', resource_ids: ['f1'] });
      expect(result.resource_type).toBe('flow');
      expect(JSON.parse(mock.history.post[0].data)).toEqual({ resource_type: 'flow', resource_ids: ['f1'] });
    });
  });

  describe('memory bases', () => {
    it('createMemoryBase POSTs /memories', async () => {
      mock.onPost('/memories').reply(201, { id: 'mb1' });
      const result = await client.createMemoryBase({ name: 'mb', flow_id: 'f1' });
      expect(result).toEqual({ id: 'mb1' });
    });

    it('listMemoryBases GETs /memories with filters', async () => {
      mock.onGet('/memories').reply(200, { items: [] });
      await client.listMemoryBases({ flow_id: 'f1', page: 1, size: 50 });
      expect(mock.history.get[0].params).toEqual({ flow_id: 'f1', page: 1, size: 50 });
    });

    it('listMemoryBaseMessages GETs /memories/{id}/messages', async () => {
      mock.onGet('/memories/mb1/messages').reply(200, { items: [] });
      await client.listMemoryBaseMessages('mb1', { session_id: 's1' });
      expect(mock.history.get[0].params).toEqual({ session_id: 's1' });
    });

    it('flushMemoryBase POSTs /memories/{id}/flush', async () => {
      mock.onPost('/memories/mb1/flush').reply(202, { job_id: 'j1' });
      const result = await client.flushMemoryBase('mb1', { session_id: 's1' });
      expect(result).toEqual({ job_id: 'j1' });
    });

    it('deleteMemoryBase DELETEs /memories/{id}', async () => {
      mock.onDelete('/memories/mb1').reply(204);
      await expect(client.deleteMemoryBase('mb1')).resolves.toBeUndefined();
    });

    it('regenerateMemoryBase POSTs /memories/{id}/regenerate', async () => {
      mock.onPost('/memories/mb1/regenerate').reply(202, { job_ids: ['j1'] });
      expect(await client.regenerateMemoryBase('mb1')).toEqual({ job_ids: ['j1'] });
    });
  });

  describe('knowledge base overhaul', () => {
    it('testKnowledgeBaseConnection POSTs /knowledge_bases/test-connection', async () => {
      mock.onPost('/knowledge_bases/test-connection').reply(200, { ok: true });
      const result = await client.testKnowledgeBaseConnection({ backend_type: 'chroma' });
      expect(result).toEqual({ ok: true });
    });

    it('listKnowledgeBaseConnectors GETs /knowledge_bases/connectors', async () => {
      mock.onGet('/knowledge_bases/connectors').reply(200, [{ source_type: 'gdrive' }]);
      expect(await client.listKnowledgeBaseConnectors()).toEqual([{ source_type: 'gdrive' }]);
    });

    it('ingestKnowledgeBaseFolder POSTs /knowledge_bases/{kb}/ingest/folder', async () => {
      mock.onPost('/knowledge_bases/kb1/ingest/folder').reply(200, { id: 'run1' });
      const result = await client.ingestKnowledgeBaseFolder('kb1', { path: '/data', recursive: true });
      expect(result).toEqual({ id: 'run1' });
      expect(JSON.parse(mock.history.post[0].data)).toEqual({ path: '/data', recursive: true });
    });

    it('listKnowledgeBaseRuns GETs /knowledge_bases/{kb}/runs', async () => {
      mock.onGet('/knowledge_bases/kb1/runs').reply(200, { runs: [] });
      await client.listKnowledgeBaseRuns('kb1', { page: 1, limit: 50 });
      expect(mock.history.get[0].params).toEqual({ page: 1, limit: 50 });
    });

    it('getKnowledgeBaseRun GETs /knowledge_bases/{kb}/runs/{runId}', async () => {
      mock.onGet('/knowledge_bases/kb1/runs/run1').reply(200, { id: 'run1' });
      expect(await client.getKnowledgeBaseRun('kb1', 'run1')).toEqual({ id: 'run1' });
    });

    it('getKnowledgeBaseMetadataKeys GETs /knowledge_bases/{kb}/metadata/keys', async () => {
      mock.onGet('/knowledge_bases/kb1/metadata/keys').reply(200, { keys: {}, truncated: false });
      expect(await client.getKnowledgeBaseMetadataKeys('kb1')).toEqual({ keys: {}, truncated: false });
    });
  });

  describe('extensions', () => {
    it('reloadExtensionBundle POSTs the reload path', async () => {
      mock.onPost('/extensions/ext1/bundles/bundleA/reload').reply(200, { ok: true });
      expect(await client.reloadExtensionBundle('ext1', 'bundleA')).toEqual({ ok: true });
    });

    it('getExtensionEvents GETs /extensions/events with since', async () => {
      mock.onGet('/extensions/events').reply(200, { events: [], settled: true });
      await client.getExtensionEvents({ since: 5 });
      expect(mock.history.get[0].params).toEqual({ since: 5 });
    });
  });

  describe('agentic sandbox + misc', () => {
    it('getAgenticFile returns text content (no download)', async () => {
      mock.onGet('/agentic/files').reply(200, 'hello world');
      const result = await client.getAgenticFile({ path: 'out.txt' });
      expect(result).toEqual({ path: 'out.txt', content: 'hello world' });
      expect(mock.history.get[0].params).toEqual({ path: 'out.txt', download: undefined });
    });

    it('resetAgenticSession POSTs /agentic/sessions/reset', async () => {
      mock.onPost('/agentic/sessions/reset').reply(200, { status: 'ok', components_cleared: 0, session_id: 's1' });
      const result = await client.resetAgenticSession({ session_id: 's1' });
      expect(result.status).toBe('ok');
      expect(mock.history.post[0].params).toEqual({ session_id: 's1' });
    });

    it('getFlowNoteTranslations GETs /flows/{id}/note_translations', async () => {
      mock.onGet('/flows/f1/note_translations').reply(200, { node1: 'tłumaczenie' });
      expect(await client.getFlowNoteTranslations('f1')).toEqual({ node1: 'tłumaczenie' });
    });

    it('getJobQueueMetrics GETs /monitor/job_queue', async () => {
      mock.onGet('/monitor/job_queue').reply(200, { backend: 'memory', active_jobs: 0 });
      expect(await client.getJobQueueMetrics()).toEqual({ backend: 'memory', active_jobs: 0 });
    });
  });
});
