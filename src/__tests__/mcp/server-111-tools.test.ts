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
    return false;
  }
});

vi.mock('../../services/langflow-client', () => ({
  LangflowClient: vi.fn(function (this: Record<string, unknown>) {
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

describe('Langflow 1.11.0 full-mode tools dispatch', () => {
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

  it('dispatches list_a2a_agents to client.listA2aAgents', async () => {
    const server = new LangflowMCPServer();
    const res = await callTool(server, 'list_a2a_agents', {});

    expect(clientMock.listA2aAgents).toHaveBeenCalledTimes(1);
    expect(clientMock.listA2aAgents).toHaveBeenCalledWith();
    expect(res.isError).toBeUndefined();
  });

  it('dispatches get_a2a_agent_card by flow_id', async () => {
    const server = new LangflowMCPServer();
    await callTool(server, 'get_a2a_agent_card', { flow_id: 'flow-1' });

    expect(clientMock.getA2aAgentCard).toHaveBeenCalledTimes(1);
    expect(clientMock.getA2aAgentCard).toHaveBeenCalledWith('flow-1');
  });

  it('dispatches invoke_a2a_jsonrpc extracting flow_id from the body', async () => {
    const server = new LangflowMCPServer();
    await callTool(server, 'invoke_a2a_jsonrpc', {
      flow_id: 'flow-1',
      jsonrpc: '2.0',
      method: 'message/send',
      params: { text: 'hi' },
      id: 'req-1'
    });

    expect(clientMock.invokeA2aJsonrpc).toHaveBeenCalledTimes(1);
    expect(clientMock.invokeA2aJsonrpc).toHaveBeenCalledWith('flow-1', {
      jsonrpc: '2.0',
      method: 'message/send',
      params: { text: 'hi' },
      id: 'req-1'
    });
  });

  it('dispatches list_pending_workflows with flow_id filter', async () => {
    const server = new LangflowMCPServer();
    await callTool(server, 'list_pending_workflows', { flow_id: 'flow-1' });

    expect(clientMock.listPendingWorkflows).toHaveBeenCalledTimes(1);
    expect(clientMock.listPendingWorkflows).toHaveBeenCalledWith({ flow_id: 'flow-1' });
  });

  it('dispatches get_workflow_events by job_id', async () => {
    const server = new LangflowMCPServer();
    await callTool(server, 'get_workflow_events', { job_id: 'job-1' });

    expect(clientMock.getWorkflowEvents).toHaveBeenCalledTimes(1);
    expect(clientMock.getWorkflowEvents).toHaveBeenCalledWith('job-1');
  });

  it('dispatches resume_workflow extracting job_id from the body', async () => {
    const server = new LangflowMCPServer();
    await callTool(server, 'resume_workflow', {
      job_id: 'job-1',
      decision: { approved: true }
    });

    expect(clientMock.resumeWorkflow).toHaveBeenCalledTimes(1);
    expect(clientMock.resumeWorkflow).toHaveBeenCalledWith('job-1', { decision: { approved: true } });
  });

  it('passes run_public_workflow body through to client.runPublicWorkflow', async () => {
    const server = new LangflowMCPServer();
    const args = {
      flow_id: 'flow-abc',
      inputs: { question: 'hi' },
      globals: { TENANT: 'acme' }
    };
    await callTool(server, 'run_public_workflow', args);

    expect(clientMock.runPublicWorkflow).toHaveBeenCalledTimes(1);
    expect(clientMock.runPublicWorkflow).toHaveBeenCalledWith(args);
  });

  it('returns a validation error (isError) for a missing required field', async () => {
    const server = new LangflowMCPServer();
    const spy = clientProxy.getA2aAgentCard;
    const res = await callTool(server, 'get_a2a_agent_card', {}); // missing flow_id

    expect(spy).not.toHaveBeenCalled();
    expect(res.isError).toBe(true);
  });
});
