import { describe, it, expect, beforeEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import type { AxiosInstance } from 'axios';
import { LangflowClient } from '../../services/langflow-client';
import type { LangflowConfig } from '../../types';

const config: LangflowConfig = {
  baseUrl: 'http://localhost:7860',
  apiKey: 'test-api-key-123',
  timeout: 5000
};

describe('LangflowClient - Langflow 1.12.x endpoints', () => {
  let client: LangflowClient;
  let mock: MockAdapter;

  beforeEach(() => {
    client = new LangflowClient(config);
    mock = new MockAdapter((client as any).client as AxiosInstance);
  });

  it('gets the root readiness health report', async () => {
    mock.onGet('/healthz').reply(200, { status: 'ok', db: 'ok', chat: 'ok' });

    await expect(client.getHealthz()).resolves.toEqual({ status: 'ok', db: 'ok', chat: 'ok' });
    expect(mock.history.get[0].baseURL).toBe('http://localhost:7860');
  });

  it('passes the new assistant history_limit field', async () => {
    const body = { flow_id: 'flow-1', input_value: 'help', history_limit: 25 };
    mock.onPost('/agentic/assist').reply(200, { status: 'ok' });

    await client.agenticAssist(body);

    expect(JSON.parse(mock.history.post[0].data)).toEqual(body);
  });

  it('runs the headless assistant and preserves its SSE body', async () => {
    const body = { instruction: 'Create a support flow', flow_id: null, session_id: 's1' };
    mock.onPost('/agentic/assist/run').reply(200, 'data: progress\n\n');

    await expect(client.agenticAssistRun(body)).resolves.toBe('data: progress\n\n');
    expect(mock.history.post[0].responseType).toBe('text');
    expect(JSON.parse(mock.history.post[0].data)).toEqual(body);
  });

  it('upserts a project with a stable ID', async () => {
    const body = { name: 'Project', flows_list: ['123'] };
    mock.onPut('/projects/project-1').reply(201, { id: 'project-1', name: 'Project' });

    await expect(client.upsertProject('project-1', body)).resolves.toEqual({
      id: 'project-1',
      name: 'Project'
    });
    expect(JSON.parse(mock.history.put[0].data)).toEqual(body);
  });

  it('lists provider descriptors with the visibility purpose', async () => {
    mock.onGet('/models/provider-descriptors').reply(200, [
      { provider_id: 'openai', display_name: 'OpenAI', provider: 'OpenAI' }
    ]);

    await expect(client.listModelProviderDescriptors({ purpose: 'configure' })).resolves.toEqual([
      { provider_id: 'openai', display_name: 'OpenAI', provider: 'OpenAI' }
    ]);
    expect(mock.history.get[0].params).toEqual({ purpose: 'configure' });
  });

  it('passes provider visibility purpose to the existing provider endpoints', async () => {
    mock.onGet('/models/providers').reply(200, ['openai']);
    mock.onGet('/models/provider-variable-mapping').reply(200, { openai: [] });
    mock.onGet('/model_options/language').reply(200, []);

    await client.listModelProviders({ purpose: 'use' });
    await client.getProviderVariableMapping({ purpose: 'configure' });
    await client.getLanguageModelOptions({ purpose: 'use' });

    expect(mock.history.get[0].params).toEqual({ purpose: 'use' });
    expect(mock.history.get[1].params).toEqual({ purpose: 'configure' });
    expect(mock.history.get[2].params).toEqual({ purpose: 'use' });
  });

  it('reads and replaces the model provider policy', async () => {
    const policy = { approved_provider_ids: ['openai'], registered_providers: [], managed_externally: false };
    mock.onGet('/model-provider-policy').reply(200, policy);
    mock.onPut('/model-provider-policy').reply(200, policy);

    await expect(client.getModelProviderPolicy()).resolves.toEqual(policy);
    await expect(client.replaceModelProviderPolicy({ approved_provider_ids: ['openai'] })).resolves.toEqual(policy);
    expect(JSON.parse(mock.history.put[0].data)).toEqual({ approved_provider_ids: ['openai'] });
  });

  it('reads and replaces catalog component and template policies', async () => {
    const response = { blocked: ['component'], managed_externally: false };
    mock.onGet('/catalog-policy/components').reply(200, response);
    mock.onPut('/catalog-policy/components').reply(200, response);
    mock.onGet('/catalog-policy/templates').reply(200, response);
    mock.onPut('/catalog-policy/templates').reply(200, response);

    await expect(client.getCatalogComponentPolicy()).resolves.toEqual(response);
    await expect(client.replaceCatalogComponentPolicy({ blocked: ['component'] })).resolves.toEqual(response);
    await expect(client.getCatalogTemplatePolicy()).resolves.toEqual(response);
    await expect(client.replaceCatalogTemplatePolicy({ blocked: ['template'] })).resolves.toEqual(response);

    expect(JSON.parse(mock.history.put[0].data)).toEqual({ blocked: ['component'] });
    expect(JSON.parse(mock.history.put[1].data)).toEqual({ blocked: ['template'] });
  });

  it('reads catalog usage and filters affected flows', async () => {
    const usage = { components: { ChatInput: 2 }, flows_scanned: 3 };
    const flows = { component: 'ChatInput', total: 2, flows: [{ id: 'flow-1', name: 'One' }] };
    mock.onGet('/catalog-policy/usage').reply(200, usage);
    mock.onGet('/catalog-policy/usage/flows').reply(200, flows);

    await expect(client.getCatalogPolicyUsage()).resolves.toEqual(usage);
    await expect(client.getCatalogPolicyUsageFlows({ component: 'ChatInput', limit: 10 })).resolves.toEqual(flows);
    expect(mock.history.get[1].params).toEqual({ component: 'ChatInput', limit: 10 });
  });

  it('reads, replaces, paginates, and rolls back the policy bundle', async () => {
    const bundle = {
      revision: 2,
      initialized: true,
      source: 'database',
      approved_provider_ids: [],
      blocked_component_keys: [],
      blocked_template_keys: [],
      blocked_model_keys: [],
      content_hash: 'hash',
      created_at: null,
      created_by: null,
      reason: null,
      rollback_of_revision: null,
      managed_externally: false
    };
    const write = {
      expected_revision: 2,
      approved_provider_ids: [],
      blocked_component_keys: [],
      blocked_template_keys: [],
      blocked_model_keys: [],
      reason: 'test'
    };
    mock.onGet('/policy-bundle').reply(200, bundle);
    mock.onPut('/policy-bundle').reply(200, bundle);
    mock.onGet('/policy-bundle/history').reply(200, { items: [bundle], next_before_revision: null });
    mock.onPost('/policy-bundle/rollback/1').reply(200, bundle);

    await expect(client.getPolicyBundle()).resolves.toEqual(bundle);
    await expect(client.replacePolicyBundle(write)).resolves.toEqual(bundle);
    await expect(client.listPolicyBundleHistory({ limit: 10, before_revision: 3 })).resolves.toEqual({
      items: [bundle],
      next_before_revision: null
    });
    await expect(client.rollbackPolicyBundle(1, { expected_revision: 2, reason: 'test' })).resolves.toEqual(bundle);

    expect(JSON.parse(mock.history.put[0].data)).toEqual(write);
    expect(mock.history.get[1].params).toEqual({ limit: 10, before_revision: 3 });
    expect(JSON.parse(mock.history.post[0].data)).toEqual({ expected_revision: 2, reason: 'test' });
  });
});
