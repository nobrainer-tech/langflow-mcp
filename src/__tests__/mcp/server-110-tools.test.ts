import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the Langflow client. The constructor copies the current `clientMock`
// methods onto the instance. We use a Proxy so any method accessed on the
// instance is auto-stubbed with a vi.fn() resolving to a recognizable value.
const clientMock: Record<string, ReturnType<typeof vi.fn>> = {};
const clientProxy = new Proxy(clientMock, {
  get(target, prop: string) {
    if (!(prop in target)) {
      target[prop] = vi.fn().mockResolvedValue({ ok: prop });
    }
    return target[prop];
  },
  has() {
    // Make `Object.assign(this, clientMock)` enumerate nothing; methods are
    // resolved lazily on access through the instance Proxy below instead.
    return false;
  }
});

vi.mock('../../services/langflow-client', () => ({
  LangflowClient: vi.fn(function (this: Record<string, unknown>) {
    // Route every property access on the instance to the auto-stubbing proxy.
    return new Proxy(this, {
      get(_t, prop: string) {
        return clientProxy[prop as keyof typeof clientProxy];
      }
    });
  })
}));

import { LangflowMCPServer } from '../../mcp/server';

function getCallToolHandler(server: LangflowMCPServer): (req: any) => Promise<any> {
  const sdkServer = (server as any).server;
  const handler = sdkServer._requestHandlers.get('tools/call');
  if (!handler) throw new Error('tools/call handler not registered');
  return (req: any) => handler(req, {});
}

async function callTool(server: LangflowMCPServer, name: string, args: Record<string, unknown>) {
  const handler = getCallToolHandler(server);
  return handler({ method: 'tools/call', params: { name, arguments: args } });
}

describe('Langflow 1.10.0 full-mode tools dispatch', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.LANGFLOW_BASE_URL = 'http://localhost:7860';
    process.env.LANGFLOW_API_KEY = 'test-api-key-123';

    for (const key of Object.keys(clientMock)) delete clientMock[key];
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it('dispatches create_authz_role to client.createAuthzRole with body', async () => {
    const server = new LangflowMCPServer();
    const res = await callTool(server, 'create_authz_role', {
      name: 'editor',
      permissions: ['flow:read', 'flow:write']
    });

    expect(clientMock.createAuthzRole).toHaveBeenCalledTimes(1);
    expect(clientMock.createAuthzRole).toHaveBeenCalledWith({
      name: 'editor',
      permissions: ['flow:read', 'flow:write']
    });
    expect(res.isError).toBeUndefined();
  });

  it('dispatches update_authz_role extracting role_id from the body', async () => {
    const server = new LangflowMCPServer();
    await callTool(server, 'update_authz_role', {
      role_id: 'role-1',
      name: 'admin',
      description: 'all access'
    });

    expect(clientMock.updateAuthzRole).toHaveBeenCalledTimes(1);
    expect(clientMock.updateAuthzRole).toHaveBeenCalledWith('role-1', {
      name: 'admin',
      description: 'all access'
    });
  });

  it('dispatches remove_authz_team_member to client.removeAuthzTeamMember', async () => {
    const server = new LangflowMCPServer();
    const res = await callTool(server, 'remove_authz_team_member', {
      team_id: 'team-1',
      user_id: 'user-9'
    });

    expect(clientMock.removeAuthzTeamMember).toHaveBeenCalledTimes(1);
    expect(clientMock.removeAuthzTeamMember).toHaveBeenCalledWith('team-1', 'user-9');
    const payload = JSON.parse(res.content[0].text);
    expect(payload.success).toBe(true);
  });

  it('dispatches get_authz_audit passing through filters', async () => {
    const server = new LangflowMCPServer();
    await callTool(server, 'get_authz_audit', {
      user_id: 'u-1',
      action: 'delete',
      page: 2,
      size: 50
    });

    expect(clientMock.getAuthzAudit).toHaveBeenCalledTimes(1);
    expect(clientMock.getAuthzAudit).toHaveBeenCalledWith({
      user_id: 'u-1',
      action: 'delete',
      page: 2,
      size: 50
    });
  });

  it('dispatches get_my_permissions with resource list', async () => {
    const server = new LangflowMCPServer();
    await callTool(server, 'get_my_permissions', {
      resource_type: 'flow',
      resource_ids: ['f-1', 'f-2'],
      actions: ['read']
    });

    expect(clientMock.getMyPermissions).toHaveBeenCalledTimes(1);
    expect(clientMock.getMyPermissions).toHaveBeenCalledWith({
      resource_type: 'flow',
      resource_ids: ['f-1', 'f-2'],
      actions: ['read']
    });
  });

  it('dispatches create_memory_base to client.createMemoryBase', async () => {
    const server = new LangflowMCPServer();
    await callTool(server, 'create_memory_base', {
      name: 'mem-1',
      flow_id: 'flow-1',
      auto_capture: true
    });

    expect(clientMock.createMemoryBase).toHaveBeenCalledTimes(1);
    expect(clientMock.createMemoryBase).toHaveBeenCalledWith({
      name: 'mem-1',
      flow_id: 'flow-1',
      auto_capture: true
    });
  });

  it('dispatches flush_memory_base wrapping session_id in body', async () => {
    const server = new LangflowMCPServer();
    await callTool(server, 'flush_memory_base', {
      memory_base_id: 'mb-1',
      session_id: 'sess-1'
    });

    expect(clientMock.flushMemoryBase).toHaveBeenCalledTimes(1);
    expect(clientMock.flushMemoryBase).toHaveBeenCalledWith('mb-1', { session_id: 'sess-1' });
  });

  it('dispatches ingest_knowledge_base_folder extracting kb_name', async () => {
    const server = new LangflowMCPServer();
    await callTool(server, 'ingest_knowledge_base_folder', {
      kb_name: 'kb-docs',
      path: '/data/docs',
      recursive: true,
      chunk_size: 512
    });

    expect(clientMock.ingestKnowledgeBaseFolder).toHaveBeenCalledTimes(1);
    expect(clientMock.ingestKnowledgeBaseFolder).toHaveBeenCalledWith('kb-docs', {
      path: '/data/docs',
      recursive: true,
      chunk_size: 512
    });
  });

  it('dispatches get_knowledge_base_run with kb_name and run_id', async () => {
    const server = new LangflowMCPServer();
    await callTool(server, 'get_knowledge_base_run', {
      kb_name: 'kb-docs',
      run_id: 'run-7'
    });

    expect(clientMock.getKnowledgeBaseRun).toHaveBeenCalledTimes(1);
    expect(clientMock.getKnowledgeBaseRun).toHaveBeenCalledWith('kb-docs', 'run-7');
  });

  it('dispatches list_knowledge_base_connectors with no args', async () => {
    const server = new LangflowMCPServer();
    const res = await callTool(server, 'list_knowledge_base_connectors', {});

    expect(clientMock.listKnowledgeBaseConnectors).toHaveBeenCalledTimes(1);
    expect(clientMock.listKnowledgeBaseConnectors).toHaveBeenCalledWith();
    expect(res.isError).toBeUndefined();
  });

  it('dispatches reload_extension_bundle with positional args', async () => {
    const server = new LangflowMCPServer();
    await callTool(server, 'reload_extension_bundle', {
      extension_id: 'ext-1',
      bundle_name: 'bundle-a'
    });

    expect(clientMock.reloadExtensionBundle).toHaveBeenCalledTimes(1);
    expect(clientMock.reloadExtensionBundle).toHaveBeenCalledWith('ext-1', 'bundle-a');
  });

  it('dispatches get_extension_events passing the since param', async () => {
    const server = new LangflowMCPServer();
    await callTool(server, 'get_extension_events', { since: 42 });

    expect(clientMock.getExtensionEvents).toHaveBeenCalledTimes(1);
    expect(clientMock.getExtensionEvents).toHaveBeenCalledWith({ since: 42 });
  });

  it('dispatches get_agentic_file passing path and download', async () => {
    const server = new LangflowMCPServer();
    await callTool(server, 'get_agentic_file', { path: 'notes.md', download: true });

    expect(clientMock.getAgenticFile).toHaveBeenCalledTimes(1);
    expect(clientMock.getAgenticFile).toHaveBeenCalledWith({ path: 'notes.md', download: true });
  });

  it('dispatches get_flow_note_translations by flow_id', async () => {
    const server = new LangflowMCPServer();
    await callTool(server, 'get_flow_note_translations', { flow_id: 'flow-1' });

    expect(clientMock.getFlowNoteTranslations).toHaveBeenCalledTimes(1);
    expect(clientMock.getFlowNoteTranslations).toHaveBeenCalledWith('flow-1');
  });

  it('dispatches get_job_queue_metrics with no args', async () => {
    const server = new LangflowMCPServer();
    const res = await callTool(server, 'get_job_queue_metrics', {});

    expect(clientMock.getJobQueueMetrics).toHaveBeenCalledTimes(1);
    expect(clientMock.getJobQueueMetrics).toHaveBeenCalledWith();
    expect(res.isError).toBeUndefined();
  });

  it('passes run_workflow globals through to client.runWorkflow', async () => {
    const server = new LangflowMCPServer();
    const args = {
      flow_id: 'flow-abc',
      inputs: { question: 'hi' },
      globals: { TENANT: 'acme' }
    };
    await callTool(server, 'run_workflow', args);

    expect(clientMock.runWorkflow).toHaveBeenCalledTimes(1);
    expect(clientMock.runWorkflow).toHaveBeenCalledWith(args);
  });

  it('returns a validation error (isError) for a missing required field', async () => {
    const server = new LangflowMCPServer();
    // Pre-register the spy so we can assert the client was never reached.
    const spy = clientProxy.getAuthzRole;
    const res = await callTool(server, 'get_authz_role', {}); // missing role_id

    expect(spy).not.toHaveBeenCalled();
    expect(res.isError).toBe(true);
  });
});
