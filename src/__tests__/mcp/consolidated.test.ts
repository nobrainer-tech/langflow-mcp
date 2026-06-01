import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { consolidatedTools } from '../../mcp/tools-consolidated';
import { LangflowMCPServerConsolidated } from '../../mcp/server-consolidated';
import {
  FlowToolSchema,
  FlowExecutionToolSchema,
  BuildToolSchema,
  FolderToolSchema,
  ProjectToolSchema,
  VariableToolSchema,
  KnowledgeBaseToolSchema,
  FileToolSchema,
  MonitorToolSchema,
  UserToolSchema,
  AuthToolSchema,
  StoreToolSchema,
  RegistrationToolSchema,
  ValidationToolSchema,
  SystemToolSchema,
  FlowVersionToolSchema,
  FileV2ToolSchema,
  ModelToolSchema,
  AgenticToolSchema,
  WorkflowToolSchema,
  McpServerToolSchema,
  McpProjectToolSchema,
  TraceToolSchema,
  ResponseToolSchema
} from '../../mcp/validation-consolidated';

// Valid UUIDs for testing (v4 format: xxxxxxxx-xxxx-4xxx-[89ab]xxx-xxxxxxxxxxxx)
const VALID_UUID = '12345678-1234-4234-a234-123456789012';

describe('Consolidated Tools', () => {
  it('should have exactly 24 tools', () => {
    expect(consolidatedTools).toHaveLength(24);
  });

  it('should have all expected tool names', () => {
    const toolNames = consolidatedTools.map(t => t.name);
    expect(toolNames).toContain('flow');
    expect(toolNames).toContain('flow_execution');
    expect(toolNames).toContain('build');
    expect(toolNames).toContain('folder');
    expect(toolNames).toContain('project');
    expect(toolNames).toContain('variable');
    expect(toolNames).toContain('knowledge_base');
    expect(toolNames).toContain('file');
    expect(toolNames).toContain('monitor');
    expect(toolNames).toContain('user');
    expect(toolNames).toContain('auth');
    expect(toolNames).toContain('store');
    expect(toolNames).toContain('registration');
    expect(toolNames).toContain('validation');
    expect(toolNames).toContain('system');
    expect(toolNames).toContain('flow_version');
    expect(toolNames).toContain('file_v2');
    expect(toolNames).toContain('model');
    expect(toolNames).toContain('agentic');
    expect(toolNames).toContain('workflow');
    expect(toolNames).toContain('mcp_server');
    expect(toolNames).toContain('mcp_project');
    expect(toolNames).toContain('trace');
    expect(toolNames).toContain('response');
  });

  it('each tool should have required properties', () => {
    for (const tool of consolidatedTools) {
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('inputSchema');
      expect(tool.inputSchema).toHaveProperty('type', 'object');
      expect(tool.inputSchema).toHaveProperty('properties');
      expect(tool.inputSchema.properties).toHaveProperty('action');
    }
  });
});

describe('Flow Tool Schema', () => {
  it('should validate list action', () => {
    const result = FlowToolSchema.safeParse({ action: 'list' });
    expect(result.success).toBe(true);
  });

  it('should validate list action with pagination', () => {
    const result = FlowToolSchema.safeParse({ action: 'list', page: 1, size: 10 });
    expect(result.success).toBe(true);
  });

  it('should validate get action with valid UUID', () => {
    const result = FlowToolSchema.safeParse({ action: 'get', flow_id: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it('should reject get action with invalid UUID', () => {
    const result = FlowToolSchema.safeParse({ action: 'get', flow_id: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('should validate create action', () => {
    const result = FlowToolSchema.safeParse({
      action: 'create',
      name: 'Test Flow',
      description: 'A test flow'
    });
    expect(result.success).toBe(true);
  });

  it('should reject unknown action', () => {
    const result = FlowToolSchema.safeParse({ action: 'unknown' });
    expect(result.success).toBe(false);
  });
});

describe('Flow Execution Tool Schema', () => {
  it('should validate run action', () => {
    const result = FlowExecutionToolSchema.safeParse({
      action: 'run',
      flow_id_or_name: 'my-flow',
      input_value: 'Hello'
    });
    expect(result.success).toBe(true);
  });

  it('should validate run_advanced action', () => {
    const result = FlowExecutionToolSchema.safeParse({
      action: 'run_advanced',
      flow_id_or_name: 'my-flow',
      stream: true
    });
    expect(result.success).toBe(true);
  });

  it('should validate run_session action', () => {
    const result = FlowExecutionToolSchema.safeParse({
      action: 'run_session',
      flow_id_or_name: 'my-flow',
      session_id: 'session-123'
    });
    expect(result.success).toBe(true);
  });

  it('should validate webhook action', () => {
    const result = FlowExecutionToolSchema.safeParse({
      action: 'webhook',
      flow_id_or_name: 'my-flow'
    });
    expect(result.success).toBe(true);
  });
});

describe('Build Tool Schema', () => {
  it('should validate start action', () => {
    const result = BuildToolSchema.safeParse({ action: 'start', flow_id: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it('should validate status action', () => {
    const result = BuildToolSchema.safeParse({ action: 'status', job_id: 'job-123' });
    expect(result.success).toBe(true);
  });

  it('should validate cancel action', () => {
    const result = BuildToolSchema.safeParse({ action: 'cancel', job_id: 'job-123' });
    expect(result.success).toBe(true);
  });
});

describe('Folder Tool Schema', () => {
  it('should validate list action', () => {
    const result = FolderToolSchema.safeParse({ action: 'list' });
    expect(result.success).toBe(true);
  });

  it('should validate create action', () => {
    const result = FolderToolSchema.safeParse({ action: 'create', name: 'My Folder' });
    expect(result.success).toBe(true);
  });
});

describe('Project Tool Schema', () => {
  it('should validate list action', () => {
    const result = ProjectToolSchema.safeParse({ action: 'list' });
    expect(result.success).toBe(true);
  });

  it('should validate create action', () => {
    const result = ProjectToolSchema.safeParse({ action: 'create', name: 'My Project' });
    expect(result.success).toBe(true);
  });
});

describe('Variable Tool Schema', () => {
  it('should validate list action', () => {
    const result = VariableToolSchema.safeParse({ action: 'list' });
    expect(result.success).toBe(true);
  });

  it('should validate create action', () => {
    const result = VariableToolSchema.safeParse({
      action: 'create',
      name: 'MY_VAR',
      value: 'my-value'
    });
    expect(result.success).toBe(true);
  });
});

describe('Knowledge Base Tool Schema', () => {
  it('should validate list action', () => {
    const result = KnowledgeBaseToolSchema.safeParse({ action: 'list' });
    expect(result.success).toBe(true);
  });

  it('should validate get action', () => {
    const result = KnowledgeBaseToolSchema.safeParse({ action: 'get', kb_name: 'my-kb' });
    expect(result.success).toBe(true);
  });
});

describe('File Tool Schema', () => {
  it('should validate list action', () => {
    const result = FileToolSchema.safeParse({ action: 'list', flow_id: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it('should validate upload action', () => {
    const result = FileToolSchema.safeParse({
      action: 'upload',
      flow_id: VALID_UUID,
      file_content: 'dGVzdA==',
      file_name: 'test.txt'
    });
    expect(result.success).toBe(true);
  });
});

describe('Monitor Tool Schema', () => {
  it('should validate get_builds action', () => {
    const result = MonitorToolSchema.safeParse({ action: 'get_builds', flow_id: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it('should validate get_messages action', () => {
    const result = MonitorToolSchema.safeParse({ action: 'get_messages' });
    expect(result.success).toBe(true);
  });

  it('should validate get_transactions action with flow_id', () => {
    const result = MonitorToolSchema.safeParse({
      action: 'get_transactions',
      flow_id: VALID_UUID
    });
    expect(result.success).toBe(true);
  });
});

describe('User Tool Schema', () => {
  it('should validate list action', () => {
    const result = UserToolSchema.safeParse({ action: 'list' });
    expect(result.success).toBe(true);
  });

  it('should validate get_current action', () => {
    const result = UserToolSchema.safeParse({ action: 'get_current' });
    expect(result.success).toBe(true);
  });
});

describe('Auth Tool Schema', () => {
  it('should validate login action', () => {
    const result = AuthToolSchema.safeParse({
      action: 'login',
      username: 'admin',
      password: 'secret'
    });
    expect(result.success).toBe(true);
  });

  it('should validate auto_login action', () => {
    const result = AuthToolSchema.safeParse({ action: 'auto_login' });
    expect(result.success).toBe(true);
  });

  it('should validate logout action', () => {
    const result = AuthToolSchema.safeParse({ action: 'logout' });
    expect(result.success).toBe(true);
  });
});

describe('Store Tool Schema', () => {
  it('should validate list_components action', () => {
    const result = StoreToolSchema.safeParse({ action: 'list_components' });
    expect(result.success).toBe(true);
  });

  it('should validate list_store action', () => {
    const result = StoreToolSchema.safeParse({ action: 'list_store' });
    expect(result.success).toBe(true);
  });
});

describe('Registration Tool Schema', () => {
  it('should validate get action', () => {
    const result = RegistrationToolSchema.safeParse({ action: 'get' });
    expect(result.success).toBe(true);
  });

  it('should validate register action', () => {
    const result = RegistrationToolSchema.safeParse({
      action: 'register',
      email: 'test@example.com'
    });
    expect(result.success).toBe(true);
  });

  it('should reject register action with invalid email', () => {
    const result = RegistrationToolSchema.safeParse({
      action: 'register',
      email: 'invalid-email'
    });
    expect(result.success).toBe(false);
  });
});

describe('Validation Tool Schema', () => {
  it('should validate code action', () => {
    const result = ValidationToolSchema.safeParse({
      action: 'code',
      code: 'print("Hello")'
    });
    expect(result.success).toBe(true);
  });

  it('should validate prompt action', () => {
    const result = ValidationToolSchema.safeParse({
      action: 'prompt',
      prompt: 'Hello {name}'
    });
    expect(result.success).toBe(true);
  });
});

describe('System Tool Schema', () => {
  it('should validate health action', () => {
    const result = SystemToolSchema.safeParse({ action: 'health' });
    expect(result.success).toBe(true);
  });

  it('should validate version action', () => {
    const result = SystemToolSchema.safeParse({ action: 'version' });
    expect(result.success).toBe(true);
  });

  it('should validate logs action', () => {
    const result = SystemToolSchema.safeParse({ action: 'logs' });
    expect(result.success).toBe(true);
  });

  it('should validate list_pictures action', () => {
    const result = SystemToolSchema.safeParse({ action: 'list_pictures' });
    expect(result.success).toBe(true);
  });

  it('should validate list_voices action', () => {
    const result = SystemToolSchema.safeParse({ action: 'list_voices' });
    expect(result.success).toBe(true);
  });

  it('should validate session action', () => {
    expect(SystemToolSchema.safeParse({ action: 'session' }).success).toBe(true);
  });

  it('should validate webhook_events action', () => {
    expect(SystemToolSchema.safeParse({ action: 'webhook_events', flow_id_or_name: 'my-flow' }).success).toBe(true);
  });

  it('should reject webhook_events without flow_id_or_name', () => {
    expect(SystemToolSchema.safeParse({ action: 'webhook_events' }).success).toBe(false);
  });

  it('should validate health_check action', () => {
    expect(SystemToolSchema.safeParse({ action: 'health_check' }).success).toBe(true);
  });
});

describe('Extended Schemas - new actions', () => {
  it('Flow: validates replace and expand', () => {
    expect(FlowToolSchema.safeParse({ action: 'replace', flow_id: VALID_UUID, name: 'X' }).success).toBe(true);
    expect(FlowToolSchema.safeParse({ action: 'expand', body: {} }).success).toBe(true);
  });

  it('Flow: rejects replace without name', () => {
    expect(FlowToolSchema.safeParse({ action: 'replace', flow_id: VALID_UUID }).success).toBe(false);
  });

  it('Variable: validates detect', () => {
    expect(VariableToolSchema.safeParse({ action: 'detect', flow_version_ids: ['v1'] }).success).toBe(true);
    expect(VariableToolSchema.safeParse({ action: 'detect', flow_version_ids: [] }).success).toBe(false);
  });

  it('KnowledgeBase: validates create / ingest / preview_chunks / cancel_ingest', () => {
    expect(KnowledgeBaseToolSchema.safeParse({
      action: 'create', name: 'kb', embedding_provider: 'openai', embedding_model: 'm'
    }).success).toBe(true);
    expect(KnowledgeBaseToolSchema.safeParse({ action: 'list_detailed' }).success).toBe(true);
    expect(KnowledgeBaseToolSchema.safeParse({
      action: 'ingest', kb_name: 'kb', file_content: 'dGVzdA==', file_name: 'a.txt'
    }).success).toBe(true);
    expect(KnowledgeBaseToolSchema.safeParse({
      action: 'preview_chunks', file_content: 'dGVzdA==', file_name: 'a.txt'
    }).success).toBe(true);
    expect(KnowledgeBaseToolSchema.safeParse({ action: 'cancel_ingest', kb_name: 'kb' }).success).toBe(true);
  });

  it('KnowledgeBase: rejects create without embedding_provider', () => {
    expect(KnowledgeBaseToolSchema.safeParse({ action: 'create', name: 'kb', embedding_model: 'm' }).success).toBe(false);
  });

  it('Monitor: validates new shared/message actions', () => {
    expect(MonitorToolSchema.safeParse({ action: 'update_message', message_id: VALID_UUID, text: 'hi' }).success).toBe(true);
    expect(MonitorToolSchema.safeParse({ action: 'delete_session_messages', session_id: 's1' }).success).toBe(true);
    expect(MonitorToolSchema.safeParse({ action: 'delete_sessions', session_ids: ['s1'] }).success).toBe(true);
    expect(MonitorToolSchema.safeParse({ action: 'get_shared', source_flow_id: 'f1' }).success).toBe(true);
    expect(MonitorToolSchema.safeParse({ action: 'get_shared_sessions', source_flow_id: 'f1' }).success).toBe(true);
    expect(MonitorToolSchema.safeParse({ action: 'update_shared', message_id: VALID_UUID, source_flow_id: 'f1' }).success).toBe(true);
    expect(MonitorToolSchema.safeParse({ action: 'migrate_shared_session', session_id: 's1', new_session_id: 's2', source_flow_id: 'f1' }).success).toBe(true);
    expect(MonitorToolSchema.safeParse({ action: 'delete_shared_session', session_id: 's1', source_flow_id: 'f1' }).success).toBe(true);
  });

  it('Monitor: rejects get_shared without source_flow_id', () => {
    expect(MonitorToolSchema.safeParse({ action: 'get_shared' }).success).toBe(false);
  });

  it('User: validates create', () => {
    expect(UserToolSchema.safeParse({ action: 'create', username: 'bob', password: 'pw' }).success).toBe(true);
    expect(UserToolSchema.safeParse({ action: 'create', username: 'bob' }).success).toBe(false);
  });

  it('Auth: validates save_store_key', () => {
    expect(AuthToolSchema.safeParse({ action: 'save_store_key', api_key: 'k' }).success).toBe(true);
    expect(AuthToolSchema.safeParse({ action: 'save_store_key' }).success).toBe(false);
  });

  it('Store: validates create_store / like / update_custom', () => {
    expect(StoreToolSchema.safeParse({ action: 'create_store', name: 'c', data: {} }).success).toBe(true);
    expect(StoreToolSchema.safeParse({ action: 'like', component_id: 'id' }).success).toBe(true);
    expect(StoreToolSchema.safeParse({ action: 'update_custom', code: 'x', field: 'f', template: {} }).success).toBe(true);
    expect(StoreToolSchema.safeParse({ action: 'create_store', data: {} }).success).toBe(false);
  });
});

describe('New Tool Schemas', () => {
  it('FlowVersion: validates actions and rejects missing version_id', () => {
    expect(FlowVersionToolSchema.safeParse({ action: 'list', flow_id: VALID_UUID }).success).toBe(true);
    expect(FlowVersionToolSchema.safeParse({ action: 'create', flow_id: VALID_UUID }).success).toBe(true);
    expect(FlowVersionToolSchema.safeParse({ action: 'activate', flow_id: VALID_UUID, version_id: 'v1' }).success).toBe(true);
    expect(FlowVersionToolSchema.safeParse({ action: 'create_event', flow_id: VALID_UUID, type: 'flow_settled' }).success).toBe(true);
    expect(FlowVersionToolSchema.safeParse({ action: 'create_event', flow_id: VALID_UUID, type: 'deploy' }).success).toBe(false);
    expect(FlowVersionToolSchema.safeParse({ action: 'get', flow_id: VALID_UUID }).success).toBe(false);
  });

  it('FileV2: validates actions and rejects upload without file', () => {
    expect(FileV2ToolSchema.safeParse({ action: 'list' }).success).toBe(true);
    expect(FileV2ToolSchema.safeParse({ action: 'upload', file_content: 'dGVzdA==', file_name: 'a.txt' }).success).toBe(true);
    expect(FileV2ToolSchema.safeParse({ action: 'batch_delete', file_ids: ['1'] }).success).toBe(true);
    expect(FileV2ToolSchema.safeParse({ action: 'upload', file_name: 'a.txt' }).success).toBe(false);
  });

  it('Model: validates actions and rejects set_default without fields', () => {
    expect(ModelToolSchema.safeParse({ action: 'list' }).success).toBe(true);
    expect(ModelToolSchema.safeParse({ action: 'providers' }).success).toBe(true);
    expect(ModelToolSchema.safeParse({ action: 'set_default', provider: 'openai', model_name: 'gpt', model_type: 'language' }).success).toBe(true);
    expect(ModelToolSchema.safeParse({ action: 'validate_provider', provider: 'openai', variables: {} }).success).toBe(true);
    expect(ModelToolSchema.safeParse({ action: 'set_default', provider: 'openai' }).success).toBe(false);
  });

  it('Agentic: validates actions and rejects assist without flow_id', () => {
    expect(AgenticToolSchema.safeParse({ action: 'assist', flow_id: 'f1' }).success).toBe(true);
    expect(AgenticToolSchema.safeParse({ action: 'check_config' }).success).toBe(true);
    expect(AgenticToolSchema.safeParse({ action: 'execute', flow_name: 'n', flow_id: 'f1' }).success).toBe(true);
    expect(AgenticToolSchema.safeParse({ action: 'assist' }).success).toBe(false);
  });

  it('Workflow: validates actions and rejects stop without job_id', () => {
    expect(WorkflowToolSchema.safeParse({ action: 'run', flow_id: 'f1' }).success).toBe(true);
    expect(WorkflowToolSchema.safeParse({ action: 'get_result' }).success).toBe(true);
    expect(WorkflowToolSchema.safeParse({ action: 'stop', job_id: 'j1' }).success).toBe(true);
    expect(WorkflowToolSchema.safeParse({ action: 'stop' }).success).toBe(false);
  });

  it('McpServer: validates actions and rejects create without config', () => {
    expect(McpServerToolSchema.safeParse({ action: 'list' }).success).toBe(true);
    expect(McpServerToolSchema.safeParse({ action: 'create', server_name: 's', config: { command: 'npx' } }).success).toBe(true);
    expect(McpServerToolSchema.safeParse({ action: 'create', server_name: 's' }).success).toBe(false);
  });

  it('McpProject: validates actions and rejects install without client', () => {
    expect(McpProjectToolSchema.safeParse({ action: 'get_config', project_id: VALID_UUID }).success).toBe(true);
    expect(McpProjectToolSchema.safeParse({ action: 'install', project_id: VALID_UUID, client: 'cursor' }).success).toBe(true);
    expect(McpProjectToolSchema.safeParse({ action: 'install', project_id: VALID_UUID }).success).toBe(false);
  });

  it('Trace: validates actions and rejects get without trace_id', () => {
    expect(TraceToolSchema.safeParse({ action: 'list' }).success).toBe(true);
    expect(TraceToolSchema.safeParse({ action: 'get', trace_id: 't1' }).success).toBe(true);
    expect(TraceToolSchema.safeParse({ action: 'delete_by_flow', flow_id: 'f1' }).success).toBe(true);
    expect(TraceToolSchema.safeParse({ action: 'get' }).success).toBe(false);
  });

  it('Response: validates create and rejects missing model', () => {
    expect(ResponseToolSchema.safeParse({ action: 'create', model: 'gpt-4o', input: 'hi' }).success).toBe(true);
    expect(ResponseToolSchema.safeParse({ action: 'create', input: 'hi' }).success).toBe(false);
  });
});

describe('Consolidated handler dispatch', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let server: any;
  let client: Record<string, any>;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.LANGFLOW_BASE_URL = 'http://localhost:7860';
    process.env.LANGFLOW_API_KEY = 'test-api-key-123';
    server = new LangflowMCPServerConsolidated();
    client = {};
    // Inject a mock client; every method returns a tagged object.
    server.client = new Proxy(client, {
      get(target, prop: string) {
        if (!(prop in target)) {
          target[prop] = vi.fn().mockResolvedValue({ ok: prop });
        }
        return target[prop];
      }
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('flow.replace dispatches to replaceFlow', async () => {
    await server.handleFlowTool({ action: 'replace', flow_id: VALID_UUID, name: 'New' });
    expect(client.replaceFlow).toHaveBeenCalledWith(VALID_UUID, { name: 'New' });
  });

  it('flow.expand dispatches to expandFlows', async () => {
    await server.handleFlowTool({ action: 'expand', body: { a: 1 } });
    expect(client.expandFlows).toHaveBeenCalledWith({ a: 1 });
  });

  it('variable.detect dispatches to detectVariables', async () => {
    await server.handleVariableTool({ action: 'detect', flow_version_ids: ['v1', 'v2'] });
    expect(client.detectVariables).toHaveBeenCalledWith({ flow_version_ids: ['v1', 'v2'] });
  });

  it('knowledge_base.create dispatches to createKnowledgeBase', async () => {
    await server.handleKnowledgeBaseTool({
      action: 'create', name: 'kb', embedding_provider: 'openai', embedding_model: 'm'
    });
    expect(client.createKnowledgeBase).toHaveBeenCalledWith({
      name: 'kb', embedding_provider: 'openai', embedding_model: 'm'
    });
  });

  it('knowledge_base.ingest passes file buffer + params', async () => {
    await server.handleKnowledgeBaseTool({
      action: 'ingest', kb_name: 'kb', file_content: 'dGVzdA==', file_name: 'a.txt', params: { chunk_size: 100 }
    });
    expect(client.ingestKnowledgeBase).toHaveBeenCalledTimes(1);
    const [kbName, files, body] = client.ingestKnowledgeBase.mock.calls[0];
    expect(kbName).toBe('kb');
    expect(body.chunk_size).toBe(100);
    expect(Array.isArray(files)).toBe(true);
    expect(Buffer.isBuffer(files[0].buffer)).toBe(true);
    expect(files[0].filename).toBe('a.txt');
  });

  it('knowledge_base.preview_chunks passes buffer array', async () => {
    await server.handleKnowledgeBaseTool({
      action: 'preview_chunks', file_content: 'dGVzdA==', file_name: 'a.txt'
    });
    const [files] = client.previewKnowledgeBaseChunks.mock.calls[0];
    expect(Array.isArray(files)).toBe(true);
    expect(Buffer.isBuffer(files[0].buffer)).toBe(true);
    expect(files[0].filename).toBe('a.txt');
  });

  it('monitor.update_message dispatches to updateMonitorMessage', async () => {
    await server.handleMonitorTool({ action: 'update_message', message_id: VALID_UUID, text: 'hi' });
    expect(client.updateMonitorMessage).toHaveBeenCalledWith(VALID_UUID, { text: 'hi' });
  });

  it('monitor.delete_shared_session dispatches with source flow id', async () => {
    await server.handleMonitorTool({ action: 'delete_shared_session', session_id: 's1', source_flow_id: 'f1' });
    expect(client.deleteSharedSession).toHaveBeenCalledWith('s1', 'f1');
  });

  it('user.create dispatches to createUser', async () => {
    await server.handleUserTool({ action: 'create', username: 'bob', password: 'pw' });
    expect(client.createUser).toHaveBeenCalledWith({ username: 'bob', password: 'pw' });
  });

  it('auth.save_store_key dispatches to saveStoreApiKey', async () => {
    await server.handleAuthTool({ action: 'save_store_key', api_key: 'k' });
    expect(client.saveStoreApiKey).toHaveBeenCalledWith('k');
  });

  it('store.like dispatches to likeStoreComponent', async () => {
    await server.handleStoreTool({ action: 'like', component_id: 'cid' });
    expect(client.likeStoreComponent).toHaveBeenCalledWith('cid');
  });

  it('store.update_custom dispatches to updateCustomComponentCode', async () => {
    await server.handleStoreTool({ action: 'update_custom', code: 'x', field: 'f', template: { a: 1 } });
    expect(client.updateCustomComponentCode).toHaveBeenCalledWith({ code: 'x', field: 'f', template: { a: 1 } });
  });

  it('system.session / webhook_events / health_check dispatch', async () => {
    await server.handleSystemTool({ action: 'session' });
    expect(client.getSession).toHaveBeenCalled();
    await server.handleSystemTool({ action: 'webhook_events', flow_id_or_name: 'fl', user_id: 'u1' });
    expect(client.getWebhookEvents).toHaveBeenCalledWith('fl', { user_id: 'u1' });
    await server.handleSystemTool({ action: 'health_check' });
    expect(client.getHealthCheck).toHaveBeenCalled();
  });

  it('flow_version.activate dispatches with save_draft', async () => {
    await server.handleFlowVersionTool({ action: 'activate', flow_id: VALID_UUID, version_id: 'v1', save_draft: true });
    expect(client.activateFlowVersion).toHaveBeenCalledWith(VALID_UUID, 'v1', { save_draft: true });
  });

  it('flow_version.create_event dispatches to createFlowEvent', async () => {
    await server.handleFlowVersionTool({ action: 'create_event', flow_id: VALID_UUID, type: 'flow_settled', summary: 's' });
    expect(client.createFlowEvent).toHaveBeenCalledWith(VALID_UUID, { type: 'flow_settled', summary: 's' });
  });

  it('file_v2.upload passes buffer and params', async () => {
    await server.handleFileV2Tool({ action: 'upload', file_content: 'dGVzdA==', file_name: 'a.txt', ephemeral: true });
    const [buf, name, params] = client.uploadFileV2.mock.calls[0];
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(name).toBe('a.txt');
    expect(params).toEqual({ ephemeral: true });
  });

  it('file_v2.batch_delete dispatches to batchDeleteFilesV2', async () => {
    await server.handleFileV2Tool({ action: 'batch_delete', file_ids: ['1', '2'] });
    expect(client.batchDeleteFilesV2).toHaveBeenCalledWith(['1', '2']);
  });

  it('model.set_default dispatches to setDefaultModel', async () => {
    await server.handleModelTool({ action: 'set_default', provider: 'openai', model_name: 'gpt', model_type: 'language' });
    expect(client.setDefaultModel).toHaveBeenCalledWith({ provider: 'openai', model_name: 'gpt', model_type: 'language' });
  });

  it('model.validate_provider dispatches to validateModelProvider', async () => {
    await server.handleModelTool({ action: 'validate_provider', provider: 'openai', variables: { OPENAI_API_KEY: 'x' } });
    expect(client.validateModelProvider).toHaveBeenCalledWith({ provider: 'openai', variables: { OPENAI_API_KEY: 'x' } });
  });

  it('agentic.execute dispatches to agenticExecute', async () => {
    await server.handleAgenticTool({ action: 'execute', flow_name: 'n', flow_id: 'f1', input_value: 'hi' });
    expect(client.agenticExecute).toHaveBeenCalledWith('n', { flow_id: 'f1', input_value: 'hi' });
  });

  it('flow_execution.run dispatches to runFlow with input request and stream', async () => {
    await server.handleFlowExecutionTool({
      action: 'run',
      flow_id_or_name: 'my-flow',
      input_value: 'hi',
      output_component: 'ChatOutput-1',
      output_type: 'chat',
      session_id: 'session-1',
      context: { tenant: 'acme' }
    });
    expect(client.runFlow).toHaveBeenCalledWith(
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

  it('flow_execution.run_advanced dispatches to runFlowAdvanced with user_id and stream', async () => {
    await server.handleFlowExecutionTool({
      action: 'run_advanced', flow_id_or_name: 'my-flow', input_value: 'hi', user_id: VALID_UUID, stream: true
    });
    expect(client.runFlowAdvanced).toHaveBeenCalledWith(
      'my-flow',
      { input_value: 'hi' },
      true,
      VALID_UUID
    );
  });

  it('workflow.run dispatches to runWorkflow', async () => {
    await server.handleWorkflowTool({ action: 'run', flow_id: 'f1', inputs: { a: 1 } });
    expect(client.runWorkflow).toHaveBeenCalledWith({ flow_id: 'f1', inputs: { a: 1 } });
  });

  it('workflow.stop dispatches to stopWorkflow', async () => {
    await server.handleWorkflowTool({ action: 'stop', job_id: 'j1' });
    expect(client.stopWorkflow).toHaveBeenCalledWith('j1');
  });

  it('mcp_server.create dispatches to createMcpServer', async () => {
    await server.handleMcpServerTool({ action: 'create', server_name: 's', config: { command: 'npx' } });
    expect(client.createMcpServer).toHaveBeenCalledWith('s', { command: 'npx' });
  });

  it('mcp_project.install dispatches to installMcpProject', async () => {
    await server.handleMcpProjectTool({ action: 'install', project_id: VALID_UUID, client: 'cursor', transport: 'sse' });
    expect(client.installMcpProject).toHaveBeenCalledWith(VALID_UUID, { client: 'cursor', transport: 'sse' });
  });

  it('trace.delete_by_flow dispatches to deleteTraces', async () => {
    await server.handleTraceTool({ action: 'delete_by_flow', flow_id: 'f1' });
    expect(client.deleteTraces).toHaveBeenCalledWith('f1');
  });

  it('trace.get dispatches to getTrace', async () => {
    await server.handleTraceTool({ action: 'get', trace_id: 't1' });
    expect(client.getTrace).toHaveBeenCalledWith('t1');
  });

  it('response.create dispatches to createResponse', async () => {
    await server.handleResponseTool({ action: 'create', model: 'gpt-4o', input: 'hi' });
    expect(client.createResponse).toHaveBeenCalledWith({ model: 'gpt-4o', input: 'hi' });
  });

  it('rejects invalid args (model.set_default missing fields)', async () => {
    await expect(server.handleModelTool({ action: 'set_default', provider: 'openai' })).rejects.toThrow();
  });

  it('rejects invalid args (workflow.stop missing job_id)', async () => {
    await expect(server.handleWorkflowTool({ action: 'stop' })).rejects.toThrow();
  });
});
