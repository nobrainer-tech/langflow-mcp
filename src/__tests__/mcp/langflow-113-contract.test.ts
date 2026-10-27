import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { LangflowClient } from '../../services/langflow-client';
import { LangflowMCPServer } from '../../mcp/server';
import { LangflowMCPServerConsolidated } from '../../mcp/server-consolidated';
import { AddAuthzTeamMemberSchema, ReplacePolicyBundleSchema } from '../../mcp/validation';
import { AuthzToolSchema, GovernanceToolSchema } from '../../mcp/validation-consolidated';
import { langflowMCPTools as tools } from '../../mcp/tools';
import { consolidatedTools } from '../../mcp/tools-consolidated';

const policy = {
  expected_revision: 4,
  approved_provider_ids: ['openai'],
  blocked_component_keys: ['UnsafeComponent'],
  blocked_template_keys: ['UnsafeTemplate'],
  blocked_model_keys: ['unsafe-model'],
  approved_integration_provider_ids: ['google'],
  blocked_integration_action_keys: ['integrations.google.drive.delete'],
};
const sets = Object.keys(policy).filter(key => key !== 'expected_revision');
const uuid = '12345678-1234-4234-a234-123456789012';

describe('Langflow 1.13 policy replacement safety', () => {
  let client: LangflowClient;
  let mock: MockAdapter;

  beforeEach(() => {
    vi.stubEnv('LANGFLOW_BASE_URL', 'http://localhost:7860');
    vi.stubEnv('LANGFLOW_API_KEY', 'contract-fixture-only');
    client = new LangflowClient({ baseUrl: 'http://localhost:7860', apiKey: 'contract-fixture-only' });
    mock = new MockAdapter((client as any).client);
  });

  afterEach(() => {
    mock.restore();
    vi.unstubAllEnvs();
  });

  for (const mode of ['standard', 'consolidated'] as const) {
    function server() {
      const instance = mode === 'standard' ? new LangflowMCPServer() : new LangflowMCPServerConsolidated();
      (instance as any).client = client;
      const handler = (instance as any).server._requestHandlers.get('tools/call');
      return (args: Record<string, unknown>) => handler({
        method: 'tools/call', params: mode === 'standard'
          ? { name: 'replace_policy_bundle', arguments: args }
          : { name: 'governance', arguments: { action: 'replace_policy_bundle', ...args } },
      }, {});
    }

    it(`${mode} preserves the nonempty integration policy read from the server`, async () => {
      const { expected_revision, ...lists } = policy;
      const snapshot = { revision: expected_revision, ...lists };
      mock.onGet('/policy-bundle').reply(200, snapshot);
      mock.onPut('/policy-bundle').reply(200, snapshot);
      const read = await client.getPolicyBundle();
      const { revision, ...body } = read;
      const result = await server()({ expected_revision: revision, ...body });
      expect(result.isError).not.toBe(true);
      expect(JSON.parse(mock.history.put[0].data)).toEqual(policy);
    });

    it.each(sets)(`${mode} refuses omitted %s without an HTTP write`, async field => {
      mock.onPut('/policy-bundle').reply(200, {});
      const body: Record<string, unknown> = { ...policy };
      delete body[field];
      expect((await server()(body)).isError).toBe(true);
      expect(mock.history.put).toHaveLength(0);
    });

    it(`${mode} permits explicit clearing of every policy list`, async () => {
      const body = { expected_revision: 4, ...Object.fromEntries(sets.map(field => [field, []])) };
      mock.onPut('/policy-bundle').reply(200, { revision: 5 });
      expect((await server()(body)).isError).not.toBe(true);
      expect(JSON.parse(mock.history.put[0].data)).toEqual(body);
    });

    it(`${mode} preserves upstream revision conflicts`, async () => {
      mock.onPut('/policy-bundle').reply(409, { detail: { code: 'policy_bundle_revision_conflict' } });
      const result = await server()(policy);
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain('policy_bundle_revision_conflict');
      expect(mock.history.put).toHaveLength(1);
    });

    it.each(['gmail.send_email', 'integrations.google', 'integrations..delete',
      'integrations.google..delete', 'integrations.google.send/email'])(
      `${mode} rejects malformed action key %s before writing`, async key => {
        mock.onPut('/policy-bundle').reply(200, {});
        expect((await server()({ ...policy, blocked_integration_action_keys: [key] })).isError).toBe(true);
        expect(mock.history.put).toHaveLength(0);
      });

    it(`${mode} refuses password reset locally without leaking or sending the password`, async () => {
      const instance = mode === 'standard' ? new LangflowMCPServer() : new LangflowMCPServerConsolidated();
      (instance as any).client = client;
      const handler = (instance as any).server._requestHandlers.get('tools/call');
      const password = 'fixture-password-not-a-credential';
      const result = await handler({ method: 'tools/call', params: mode === 'standard'
        ? { name: 'reset_user_password', arguments: { user_id: uuid, new_password: password } }
        : { name: 'user', arguments: { action: 'reset_password', user_id: uuid, new_password: password } },
      }, {});
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain('interactive_login_required');
      expect(JSON.stringify(result.content)).not.toContain(password);
      expect(mock.history.patch).toHaveLength(0);
    });
  }

  it('advertises integration lists and the password-reset limitation in both modes', () => {
    const standard = tools.find(tool => tool.name === 'replace_policy_bundle')!;
    const consolidated = consolidatedTools.find(tool => tool.name === 'governance')!;
    for (const field of sets) {
      expect(standard.inputSchema.required).toContain(field);
      expect(standard.inputSchema.properties).toHaveProperty(field);
      expect(consolidated.inputSchema.properties).toHaveProperty(field);
    }
    expect(tools.find(tool => tool.name === 'reset_user_password')!.description).toContain('API-key authentication');
    expect(consolidatedTools.find(tool => tool.name === 'user')!.description).toContain('API-key authentication');
  });

  it('the exported client refuses password reset without an HTTP request', async () => {
    await expect(client.resetUserPassword(uuid, 'fixture-password')).rejects.toThrow('interactive_login_required');
    expect(mock.history.patch).toHaveLength(0);
  });

  it('preserves the refusal to remove externally managed team membership', async () => {
    mock.onDelete(`/authz/teams/${uuid}/members/${uuid}`).reply(409, { detail: 'externally_managed' });
    await expect(client.removeAuthzTeamMember(uuid, uuid)).rejects.toThrow('externally_managed');
  });

  it('preserves knowledge-base storage unavailability', async () => {
    mock.onGet(`/knowledge_bases/${uuid}/chunks`).reply(409, { detail: 'This base is being deleted and is unavailable.' });
    await expect(client.listKnowledgeBaseChunks(uuid)).rejects.toThrow('HTTP 409');
  });

  it.each(['connection-not-authorized', 'policy-blocked'])('preserves upstream %s execution refusals', async error_code => {
    mock.onPost(`/run/${uuid}`).reply(403, { detail: { error_code,
      message: 'This flow could not use one of its connections.', retryable: false } });
    await expect(client.runFlow(uuid, { input_value: 'fixture' })).rejects.toThrow(error_code);
  });

  it('preserves a migration write-pause response', async () => {
    mock.onPost(`/run/${uuid}`).reply(503, { detail: 'This instance is being migrated.' });
    await expect(client.runFlow(uuid, { input_value: 'fixture' })).rejects.toThrow('HTTP 503');
  });

  it.each(sets)('the exported client also refuses omitted %s before writing', async field => {
    const body: Record<string, unknown> = { ...policy };
    delete body[field];
    mock.onPut('/policy-bundle').reply(200, {});
    await expect(client.replacePolicyBundle(body as any)).rejects.toThrow('explicit');
    expect(mock.history.put).toHaveLength(0);
  });

  it.each(['', 'bad/provider', 'x'.repeat(121)])('rejects invalid integration provider %s in both modes', provider => {
    const body = { ...policy, approved_integration_provider_ids: [provider] };
    expect(ReplacePolicyBundleSchema.safeParse(body).success).toBe(false);
    expect(GovernanceToolSchema.safeParse({ action: 'replace_policy_bundle', ...body }).success).toBe(false);
  });

  it.each(['integrations.google.drive.delete', ' integrations.Google.Drive.Delete ',
    'integrations.future-provider.action_1'])('accepts action grammar %s in both schemas', key => {
    const body = { ...policy, approved_integration_provider_ids: ['Google.Workspace'],
      blocked_integration_action_keys: [key] };
    expect(ReplacePolicyBundleSchema.parse(body).blocked_integration_action_keys).toEqual([key.trim()]);
    expect(GovernanceToolSchema.parse({ action: 'replace_policy_bundle', ...body })).toMatchObject({
      blocked_integration_action_keys: [key.trim()],
    });
  });

  it('allows only manual membership sources in both modes', () => {
    for (const source of [undefined, 'manual', 'sso']) {
      const body = { team_id: uuid, user_id: uuid, ...(source === undefined ? {} : { source }) };
      expect(AddAuthzTeamMemberSchema.safeParse(body).success).toBe(source !== 'sso');
      expect(AuthzToolSchema.safeParse({ action: 'add_team_member', ...body }).success).toBe(source !== 'sso');
    }
  });
});
