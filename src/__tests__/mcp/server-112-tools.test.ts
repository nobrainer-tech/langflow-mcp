import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const clientMock: Record<string, ReturnType<typeof vi.fn>> = {};
const clientProxy = new Proxy(clientMock, {
  get(target, prop: string) {
    if (!(prop in target)) target[prop] = vi.fn().mockResolvedValue({ ok: prop });
    return target[prop];
  },
  has() {
    return false;
  }
});

vi.mock('../../services/langflow-client', () => ({
  LangflowClient: vi.fn(function (this: Record<string, unknown>) {
    return new Proxy(this, {
      get(_target, prop: string) {
        return clientProxy[prop as keyof typeof clientProxy];
      }
    });
  })
}));

import { LangflowMCPServer } from '../../mcp/server';

function getCallToolHandler(server: LangflowMCPServer): (request: any) => Promise<any> {
  const handler = (server as any).server._requestHandlers.get('tools/call');
  if (!handler) throw new Error('tools/call handler not registered');
  return (request: any) => handler(request, {});
}

async function callTool(server: LangflowMCPServer, name: string, args: Record<string, unknown>) {
  return getCallToolHandler(server)({ method: 'tools/call', params: { name, arguments: args } });
}

describe('Langflow 1.12.x full-mode tools dispatch', () => {
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

  it('dispatches readiness health, provider descriptors, and project upsert', async () => {
    const server = new LangflowMCPServer();
    await callTool(server, 'get_healthz', {});
    await callTool(server, 'list_model_provider_descriptors', { purpose: 'configure' });
    await callTool(server, 'upsert_project', {
      project_id: '12345678-1234-4234-a234-123456789012',
      name: 'Project',
      flows_list: ['12345678-1234-4234-a234-123456789013']
    });

    expect(clientMock.getHealthz).toHaveBeenCalledWith();
    expect(clientMock.listModelProviderDescriptors).toHaveBeenCalledWith({ purpose: 'configure' });
    expect(clientMock.upsertProject).toHaveBeenCalledWith(
      '12345678-1234-4234-a234-123456789012',
      { name: 'Project', flows_list: ['12345678-1234-4234-a234-123456789013'] }
    );
  });

  it('passes the Langflow 1.12.x model purpose and assistant history fields', async () => {
    const server = new LangflowMCPServer();
    await callTool(server, 'list_model_providers', { purpose: 'use' });
    await callTool(server, 'get_provider_variable_mapping', { purpose: 'configure' });
    await callTool(server, 'agentic_assist', { flow_id: 'flow-1', history_limit: 20 });
    await callTool(server, 'agentic_assist_run', { instruction: 'Build a flow', flow_id: null });

    expect(clientMock.listModelProviders).toHaveBeenCalledWith({ purpose: 'use' });
    expect(clientMock.getProviderVariableMapping).toHaveBeenCalledWith({ purpose: 'configure' });
    expect(clientMock.agenticAssist).toHaveBeenCalledWith({ flow_id: 'flow-1', history_limit: 20 });
    expect(clientMock.agenticAssistRun).toHaveBeenCalledWith({ instruction: 'Build a flow', flow_id: null });
  });

  it('dispatches all governance operations to their client methods', async () => {
    const server = new LangflowMCPServer();

    await callTool(server, 'get_model_provider_policy', {});
    await callTool(server, 'replace_model_provider_policy', { approved_provider_ids: ['openai'] });
    await callTool(server, 'get_catalog_component_policy', {});
    await callTool(server, 'replace_catalog_component_policy', { blocked: ['component'] });
    await callTool(server, 'get_catalog_template_policy', {});
    await callTool(server, 'replace_catalog_template_policy', { blocked: ['template'] });
    await callTool(server, 'get_catalog_policy_usage', {});
    await callTool(server, 'get_catalog_policy_usage_flows', { component: 'component', limit: 5 });
    await callTool(server, 'get_policy_bundle', {});
    await callTool(server, 'replace_policy_bundle', {
      expected_revision: 1,
      approved_provider_ids: ['openai'],
      blocked_component_keys: [],
      blocked_template_keys: [],
      blocked_model_keys: [],
      reason: 'test'
    });
    await callTool(server, 'list_policy_bundle_history', { limit: 10, before_revision: 3 });
    await callTool(server, 'rollback_policy_bundle', { revision: 1, expected_revision: 2, reason: 'test' });

    expect(clientMock.getModelProviderPolicy).toHaveBeenCalledWith();
    expect(clientMock.replaceModelProviderPolicy).toHaveBeenCalledWith({ approved_provider_ids: ['openai'] });
    expect(clientMock.getCatalogComponentPolicy).toHaveBeenCalledWith();
    expect(clientMock.replaceCatalogComponentPolicy).toHaveBeenCalledWith({ blocked: ['component'] });
    expect(clientMock.getCatalogTemplatePolicy).toHaveBeenCalledWith();
    expect(clientMock.replaceCatalogTemplatePolicy).toHaveBeenCalledWith({ blocked: ['template'] });
    expect(clientMock.getCatalogPolicyUsage).toHaveBeenCalledWith();
    expect(clientMock.getCatalogPolicyUsageFlows).toHaveBeenCalledWith({ component: 'component', limit: 5 });
    expect(clientMock.getPolicyBundle).toHaveBeenCalledWith();
    expect(clientMock.replacePolicyBundle).toHaveBeenCalledWith({
      expected_revision: 1,
      approved_provider_ids: ['openai'],
      blocked_component_keys: [],
      blocked_template_keys: [],
      blocked_model_keys: [],
      reason: 'test'
    });
    expect(clientMock.listPolicyBundleHistory).toHaveBeenCalledWith({ limit: 10, before_revision: 3 });
    expect(clientMock.rollbackPolicyBundle).toHaveBeenCalledWith(1, { expected_revision: 2, reason: 'test' });
  });

  it('returns validation errors without calling the client', async () => {
    const server = new LangflowMCPServer();
    const spy = clientProxy.replacePolicyBundle;
    const result = await callTool(server, 'replace_policy_bundle', {
      expected_revision: 0,
      approved_provider_ids: [],
      blocked_component_keys: [],
      blocked_template_keys: []
    });

    expect(spy).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
  });
});
