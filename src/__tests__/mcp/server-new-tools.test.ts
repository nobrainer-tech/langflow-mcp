import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the Langflow client so we can assert dispatch wiring without a live server.
// The constructor copies the current `clientMock` methods onto the instance,
// so tests can re-stub methods in beforeEach before constructing the server.
const clientMock: Record<string, ReturnType<typeof vi.fn>> = {};
vi.mock('../../services/langflow-client', () => ({
  LangflowClient: vi.fn(function (this: Record<string, unknown>) {
    Object.assign(this, clientMock);
  })
}));

import { LangflowMCPServer } from '../../mcp/server';

/**
 * Reach the registered MCP "tools/call" handler on the underlying SDK server
 * and invoke it directly with the given tool name + args.
 */
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

describe('Langflow 1.9.x full-mode tools dispatch', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.LANGFLOW_BASE_URL = 'http://localhost:7860';
    process.env.LANGFLOW_API_KEY = 'test-api-key-123';

    // Reset client mock methods used by the subset under test.
    for (const key of Object.keys(clientMock)) delete clientMock[key];
    clientMock.listModels = vi.fn().mockResolvedValue([{ id: 'gpt-4' }]);
    clientMock.runWorkflow = vi.fn().mockResolvedValue({ job_id: 'job-1' });
    clientMock.createMcpServer = vi.fn().mockResolvedValue({ ok: true });
    clientMock.getTrace = vi.fn().mockResolvedValue({ id: 'trace-1' });
    clientMock.activateFlowVersion = vi.fn().mockResolvedValue({ activated: true });
    clientMock.detectVariables = vi.fn().mockResolvedValue({ variables: [] });
    clientMock.runFlow = vi.fn().mockResolvedValue({ outputs: [] });
    clientMock.buildFlow = vi.fn().mockResolvedValue({ job_id: 'build-1' });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it('dispatches list_models to client.listModels with parsed params', async () => {
    const server = new LangflowMCPServer();
    const res = await callTool(server, 'list_models', { provider: 'openai', search: 'gpt' });

    expect(clientMock.listModels).toHaveBeenCalledTimes(1);
    expect(clientMock.listModels).toHaveBeenCalledWith({ provider: 'openai', search: 'gpt' });
    expect(res.isError).toBeUndefined();
  });

  it('dispatches run_flow to client.runFlow with flow id, input request and stream', async () => {
    const server = new LangflowMCPServer();
    await callTool(server, 'run_flow', {
      flow_id_or_name: 'my-flow',
      input_request: {
        input_value: 'hi',
        output_component: 'ChatOutput-1',
        output_type: 'chat',
        session_id: 'session-1'
      },
      context: { tenant: 'acme' }
    });

    expect(clientMock.runFlow).toHaveBeenCalledTimes(1);
    expect(clientMock.runFlow).toHaveBeenCalledWith(
      'my-flow',
      {
        input_value: 'hi',
        output_component: 'ChatOutput-1',
        output_type: 'chat',
        session_id: 'session-1'
      },
      false,
      { tenant: 'acme' }
    );
  });

  it('maps legacy nested run_flow context to the top-level client context', async () => {
    const server = new LangflowMCPServer();
    await callTool(server, 'run_flow', {
      flow_id_or_name: 'my-flow',
      input_request: {
        input_value: 'hi',
        context: { tenant: 'nested' }
      }
    });

    expect(clientMock.runFlow).toHaveBeenCalledWith(
      'my-flow',
      { input_value: 'hi' },
      false,
      { tenant: 'nested' }
    );
  });

  it('dispatches build_flow to client.buildFlow with payload and params', async () => {
    const server = new LangflowMCPServer();
    await callTool(server, 'build_flow', {
      flow_id: '12345678-1234-4234-a234-123456789012',
      inputs: { x: 1 }
    });

    expect(clientMock.buildFlow).toHaveBeenCalledTimes(1);
    expect(clientMock.buildFlow).toHaveBeenCalledWith(
      '12345678-1234-4234-a234-123456789012',
      { inputs: { x: 1 }, data: undefined, files: undefined },
      { log_builds: true, event_delivery: 'polling' }
    );
  });

  it('dispatches run_workflow to client.runWorkflow', async () => {
    const server = new LangflowMCPServer();
    const args = { flow_id: 'flow-abc', inputs: { question: 'hi' }, background: true };
    await callTool(server, 'run_workflow', args);

    expect(clientMock.runWorkflow).toHaveBeenCalledTimes(1);
    expect(clientMock.runWorkflow).toHaveBeenCalledWith(args);
  });

  it('dispatches create_mcp_server to client.createMcpServer with name + config', async () => {
    const server = new LangflowMCPServer();
    await callTool(server, 'create_mcp_server', {
      server_name: 'my-server',
      config: { command: 'node', args: ['server.js'] }
    });

    expect(clientMock.createMcpServer).toHaveBeenCalledTimes(1);
    expect(clientMock.createMcpServer).toHaveBeenCalledWith('my-server', {
      command: 'node',
      args: ['server.js']
    });
  });

  it('dispatches get_trace to client.getTrace by trace_id', async () => {
    const server = new LangflowMCPServer();
    await callTool(server, 'get_trace', { trace_id: 'trace-1' });

    expect(clientMock.getTrace).toHaveBeenCalledTimes(1);
    expect(clientMock.getTrace).toHaveBeenCalledWith('trace-1');
  });

  it('dispatches activate_flow_version to client.activateFlowVersion with save_draft param', async () => {
    const server = new LangflowMCPServer();
    const flowId = '123e4567-e89b-12d3-a456-426614174000';
    await callTool(server, 'activate_flow_version', {
      flow_id: flowId,
      version_id: 'v2',
      save_draft: true
    });

    expect(clientMock.activateFlowVersion).toHaveBeenCalledTimes(1);
    expect(clientMock.activateFlowVersion).toHaveBeenCalledWith(flowId, 'v2', { save_draft: true });
  });

  it('dispatches detect_variables to client.detectVariables', async () => {
    const server = new LangflowMCPServer();
    await callTool(server, 'detect_variables', { flow_version_ids: ['v1', 'v2'] });

    expect(clientMock.detectVariables).toHaveBeenCalledTimes(1);
    expect(clientMock.detectVariables).toHaveBeenCalledWith({ flow_version_ids: ['v1', 'v2'] });
  });

  it('returns a validation error (isError) for invalid args without calling the client', async () => {
    const server = new LangflowMCPServer();
    const res = await callTool(server, 'get_trace', {}); // missing trace_id

    expect(clientMock.getTrace).not.toHaveBeenCalled();
    expect(res.isError).toBe(true);
  });
});
