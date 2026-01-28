import { describe, it, expect } from 'vitest';
import { consolidatedTools } from '../../mcp/tools-consolidated';
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
  SystemToolSchema
} from '../../mcp/validation-consolidated';

// Valid UUIDs for testing (v4 format: xxxxxxxx-xxxx-4xxx-[89ab]xxx-xxxxxxxxxxxx)
const VALID_UUID = '12345678-1234-4234-a234-123456789012';

describe('Consolidated Tools', () => {
  it('should have exactly 15 tools', () => {
    expect(consolidatedTools).toHaveLength(15);
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
});
