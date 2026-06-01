import { z } from 'zod';

// Shared validators
const uuidSchema = (name: string) => z.string().uuid(`Invalid ${name} format`);
const paginationSchema = {
  page: z.number().int().positive().optional(),
  size: z.number().int().positive().max(100).optional()
};

// Flow tool schema
export const FlowToolSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('list'),
    ...paginationSchema,
    folder_id: uuidSchema('folder ID').optional()
  }),
  z.object({
    action: z.literal('get'),
    flow_id: uuidSchema('flow ID')
  }),
  z.object({
    action: z.literal('create'),
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    data: z.record(z.string(), z.unknown()).optional(),
    folder_id: uuidSchema('folder ID').optional()
  }),
  z.object({
    action: z.literal('update'),
    flow_id: uuidSchema('flow ID'),
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    data: z.record(z.string(), z.unknown()).optional(),
    folder_id: uuidSchema('folder ID').optional()
  }),
  z.object({
    action: z.literal('delete'),
    flow_id: uuidSchema('flow ID')
  }),
  z.object({
    action: z.literal('delete_many'),
    flow_ids: z.array(uuidSchema('flow ID')).min(1)
  }),
  z.object({
    action: z.literal('batch_create'),
    flows: z.array(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      data: z.record(z.string(), z.unknown()).optional()
    })).min(1)
  }),
  z.object({
    action: z.literal('download'),
    flow_ids: z.array(uuidSchema('flow ID')).min(1)
  }),
  z.object({
    action: z.literal('upload'),
    file: z.object({
      name: z.string().min(1),
      content: z.string().min(1)
    })
  }),
  z.object({
    action: z.literal('get_public'),
    flow_id: uuidSchema('flow ID')
  }),
  z.object({ action: z.literal('get_examples') }),
  z.object({ action: z.literal('get_starters') }),
  z.object({
    action: z.literal('replace'),
    flow_id: uuidSchema('flow ID'),
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    data: z.record(z.string(), z.unknown()).optional(),
    folder_id: uuidSchema('folder ID').optional()
  }),
  z.object({
    action: z.literal('expand'),
    body: z.record(z.string(), z.unknown())
  })
]);

// Flow version tool schema
export const FlowVersionToolSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('list'),
    flow_id: uuidSchema('flow ID'),
    limit: z.number().int().positive().optional(),
    offset: z.number().int().nonnegative().optional(),
    deployment_provider_id: z.string().optional()
  }),
  z.object({
    action: z.literal('create'),
    flow_id: uuidSchema('flow ID'),
    body: z.record(z.string(), z.unknown()).optional()
  }),
  z.object({
    action: z.literal('get'),
    flow_id: uuidSchema('flow ID'),
    version_id: z.string().min(1)
  }),
  z.object({
    action: z.literal('delete'),
    flow_id: uuidSchema('flow ID'),
    version_id: z.string().min(1)
  }),
  z.object({
    action: z.literal('activate'),
    flow_id: uuidSchema('flow ID'),
    version_id: z.string().min(1),
    save_draft: z.boolean().optional()
  }),
  z.object({
    action: z.literal('get_events'),
    flow_id: uuidSchema('flow ID'),
    since: z.number().int().optional()
  }),
  z.object({
    action: z.literal('create_event'),
    flow_id: uuidSchema('flow ID'),
    type: z.enum([
      'component_added',
      'component_removed',
      'component_configured',
      'connection_added',
      'connection_removed',
      'flow_updated',
      'flow_settled'
    ]),
    summary: z.string().optional()
  })
]);

// Flow execution tool schema
export const FlowExecutionToolSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('run'),
    flow_id_or_name: z.string().min(1),
    input_value: z.string().optional(),
    output_component: z.string().optional(),
    output_type: z.string().optional(),
    input_type: z.string().optional(),
    session_id: z.string().optional(),
    tweaks: z.record(z.string(), z.unknown()).optional(),
    context: z.record(z.string(), z.unknown()).optional(),
    stream: z.boolean().optional().default(false)
  }),
  z.object({
    action: z.literal('run_advanced'),
    flow_id_or_name: z.string().min(1),
    input_value: z.string().optional(),
    input_type: z.string().optional(),
    output_type: z.string().optional(),
    output_component: z.string().optional(),
    tweaks: z.record(z.string(), z.unknown()).optional(),
    session_id: z.string().optional(),
    user_id: uuidSchema('user ID').optional(),
    stream: z.boolean().optional().default(false)
  }),
  z.object({
    action: z.literal('run_session'),
    flow_id_or_name: z.string().min(1),
    session_id: z.string().min(1),
    input_value: z.string().optional(),
    input_type: z.string().optional(),
    output_type: z.string().optional(),
    output_component: z.string().optional(),
    tweaks: z.record(z.string(), z.unknown()).optional(),
    context: z.record(z.string(), z.unknown()).optional(),
    stream: z.boolean().optional().default(false)
  }),
  z.object({
    action: z.literal('webhook'),
    flow_id_or_name: z.string().min(1),
    input_value: z.string().optional(),
    tweaks: z.record(z.string(), z.unknown()).optional()
  }),
  z.object({
    action: z.literal('process'),
    flow_id: uuidSchema('flow ID'),
    inputs: z.record(z.string(), z.unknown()).optional(),
    tweaks: z.record(z.string(), z.unknown()).optional()
  }),
  z.object({
    action: z.literal('predict'),
    flow_id: uuidSchema('flow ID'),
    inputs: z.record(z.string(), z.unknown()).optional(),
    tweaks: z.record(z.string(), z.unknown()).optional()
  })
]);

// Build tool schema
export const BuildToolSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('start'),
    flow_id: uuidSchema('flow ID'),
    flow_name: z.string().optional(),
    inputs: z.record(z.string(), z.unknown()).optional(),
    data: z.record(z.string(), z.unknown()).optional(),
    files: z.array(z.string()).optional(),
    stop_component_id: z.string().optional(),
    start_component_id: z.string().optional(),
    log_builds: z.boolean().optional().default(true),
    event_delivery: z.enum(['polling', 'streaming', 'direct']).optional().default('polling')
  }),
  z.object({
    action: z.literal('status'),
    job_id: z.string().min(1),
    event_delivery: z.enum(['polling', 'streaming', 'direct']).optional().default('streaming')
  }),
  z.object({
    action: z.literal('cancel'),
    job_id: z.string().min(1)
  }),
  z.object({
    action: z.literal('vertices'),
    flow_id: uuidSchema('flow ID'),
    data: z.record(z.string(), z.unknown()).optional(),
    stop_component_id: z.string().optional(),
    start_component_id: z.string().optional()
  }),
  z.object({
    action: z.literal('stream_vertex'),
    flow_id: uuidSchema('flow ID'),
    vertex_id: z.string().min(1)
  }),
  z.object({
    action: z.literal('task_status'),
    task_id: z.string().min(1)
  })
]);

// Folder tool schema
export const FolderToolSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list'), ...paginationSchema }),
  z.object({ action: z.literal('get'), folder_id: uuidSchema('folder ID') }),
  z.object({
    action: z.literal('create'),
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    parent_id: uuidSchema('parent folder ID').optional()
  }),
  z.object({
    action: z.literal('update'),
    folder_id: uuidSchema('folder ID'),
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    parent_id: uuidSchema('parent folder ID').optional()
  }),
  z.object({ action: z.literal('delete'), folder_id: uuidSchema('folder ID') }),
  z.object({ action: z.literal('download'), folder_id: uuidSchema('folder ID') }),
  z.object({
    action: z.literal('upload'),
    file_content: z.string().min(1),
    file_name: z.string().min(1)
  })
]);

// Project tool schema
export const ProjectToolSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list'), ...paginationSchema }),
  z.object({ action: z.literal('get'), project_id: uuidSchema('project ID') }),
  z.object({
    action: z.literal('create'),
    name: z.string().min(1).max(255),
    description: z.string().optional()
  }),
  z.object({
    action: z.literal('update'),
    project_id: uuidSchema('project ID'),
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional()
  }),
  z.object({ action: z.literal('delete'), project_id: uuidSchema('project ID') }),
  z.object({ action: z.literal('download'), project_id: uuidSchema('project ID') }),
  z.object({
    action: z.literal('upload'),
    file: z.object({ name: z.string().min(1), content: z.string().min(1) })
  })
]);

// Variable tool schema
export const VariableToolSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list') }),
  z.object({
    action: z.literal('create'),
    name: z.string().min(1).max(255),
    value: z.string().min(1),
    type: z.string().optional(),
    default_fields: z.array(z.string()).optional()
  }),
  z.object({
    action: z.literal('update'),
    variable_id: uuidSchema('variable ID'),
    name: z.string().min(1).max(255).optional(),
    value: z.string().min(1).optional(),
    type: z.string().optional()
  }),
  z.object({ action: z.literal('delete'), variable_id: uuidSchema('variable ID') }),
  z.object({
    action: z.literal('detect'),
    flow_version_ids: z.array(z.string().min(1)).min(1)
  })
]);

// Knowledge base tool schema
export const KnowledgeBaseToolSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list') }),
  z.object({ action: z.literal('get'), kb_name: z.string().min(1) }),
  z.object({ action: z.literal('delete'), kb_name: z.string().min(1) }),
  z.object({
    action: z.literal('bulk_delete'),
    kb_names: z.array(z.string().min(1)).min(1)
  }),
  z.object({
    action: z.literal('upload'),
    kb_name: z.string().min(1),
    file_content: z.string().min(1),
    file_name: z.string().min(1)
  }),
  z.object({
    action: z.literal('create'),
    name: z.string().min(1),
    embedding_provider: z.string().min(1),
    embedding_model: z.string().min(1),
    column_config: z.array(z.record(z.string(), z.unknown())).optional()
  }),
  z.object({ action: z.literal('list_detailed') }),
  z.object({
    action: z.literal('list_chunks'),
    kb_name: z.string().min(1),
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().optional(),
    search: z.string().optional()
  }),
  z.object({
    action: z.literal('ingest'),
    kb_name: z.string().min(1),
    file_content: z.string().min(1),
    file_name: z.string().min(1),
    params: z.record(z.string(), z.unknown()).optional()
  }),
  z.object({
    action: z.literal('preview_chunks'),
    file_content: z.string().min(1),
    file_name: z.string().min(1),
    params: z.record(z.string(), z.unknown()).optional()
  }),
  z.object({ action: z.literal('cancel_ingest'), kb_name: z.string().min(1) })
]);

// File tool schema
export const FileToolSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list'), flow_id: uuidSchema('flow ID') }),
  z.object({
    action: z.literal('upload'),
    flow_id: uuidSchema('flow ID'),
    file_content: z.string().min(1),
    file_name: z.string().min(1)
  }),
  z.object({
    action: z.literal('download'),
    flow_id: uuidSchema('flow ID'),
    file_name: z.string().min(1)
  }),
  z.object({
    action: z.literal('delete'),
    flow_id: uuidSchema('flow ID'),
    file_name: z.string().min(1)
  }),
  z.object({
    action: z.literal('get_image'),
    flow_id: uuidSchema('flow ID'),
    file_name: z.string().min(1)
  })
]);

// File V2 tool schema (user-scoped /api/v2/files)
export const FileV2ToolSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list') }),
  z.object({
    action: z.literal('upload'),
    file_content: z.string().min(1),
    file_name: z.string().min(1),
    append: z.boolean().optional(),
    ephemeral: z.boolean().optional()
  }),
  z.object({
    action: z.literal('get'),
    file_id: z.string().min(1),
    return_content: z.boolean().optional()
  }),
  z.object({
    action: z.literal('rename'),
    file_id: z.string().min(1),
    name: z.string().min(1)
  }),
  z.object({ action: z.literal('delete'), file_id: z.string().min(1) }),
  z.object({ action: z.literal('delete_all') }),
  z.object({
    action: z.literal('batch_download'),
    file_ids: z.array(z.string().min(1)).min(1)
  }),
  z.object({
    action: z.literal('batch_delete'),
    file_ids: z.array(z.string().min(1)).min(1)
  })
]);

// Monitor tool schema
export const MonitorToolSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('get_builds'), flow_id: uuidSchema('flow ID') }),
  z.object({ action: z.literal('delete_builds'), flow_id: uuidSchema('flow ID') }),
  z.object({
    action: z.literal('get_messages'),
    flow_id: uuidSchema('flow ID').optional(),
    session_id: z.string().optional(),
    sender: z.string().optional(),
    sender_name: z.string().optional(),
    order_by: z.string().optional()
  }),
  z.object({ action: z.literal('get_message'), message_id: uuidSchema('message ID') }),
  z.object({
    action: z.literal('delete_messages'),
    message_ids: z.array(z.string().min(1)).min(1)
  }),
  z.object({
    action: z.literal('get_sessions'),
    flow_id: uuidSchema('flow ID').optional(),
    ...paginationSchema
  }),
  z.object({
    action: z.literal('get_session_messages'),
    session_id: z.string().min(1)
  }),
  z.object({
    action: z.literal('migrate_session'),
    session_id: z.string().min(1),
    new_session_id: z.string().min(1)
  }),
  z.object({
    action: z.literal('get_transactions'),
    flow_id: uuidSchema('flow ID'),
    ...paginationSchema
  }),
  z.object({
    action: z.literal('update_message'),
    message_id: uuidSchema('message ID'),
    text: z.string().optional(),
    sender: z.string().optional(),
    sender_name: z.string().optional(),
    session_id: z.string().optional(),
    files: z.array(z.string()).optional(),
    properties: z.record(z.string(), z.unknown()).optional()
  }),
  z.object({
    action: z.literal('delete_session_messages'),
    session_id: z.string().min(1)
  }),
  z.object({
    action: z.literal('delete_sessions'),
    session_ids: z.array(z.string().min(1)).min(1)
  }),
  z.object({
    action: z.literal('get_shared'),
    source_flow_id: z.string().min(1),
    session_id: z.string().optional(),
    order_by: z.string().optional()
  }),
  z.object({
    action: z.literal('get_shared_sessions'),
    source_flow_id: z.string().min(1)
  }),
  z.object({
    action: z.literal('update_shared'),
    message_id: uuidSchema('message ID'),
    source_flow_id: z.string().min(1),
    text: z.string().optional(),
    sender: z.string().optional(),
    sender_name: z.string().optional(),
    session_id: z.string().optional(),
    files: z.array(z.string()).optional(),
    properties: z.record(z.string(), z.unknown()).optional()
  }),
  z.object({
    action: z.literal('migrate_shared_session'),
    session_id: z.string().min(1),
    new_session_id: z.string().min(1),
    source_flow_id: z.string().min(1)
  }),
  z.object({
    action: z.literal('delete_shared_session'),
    session_id: z.string().min(1),
    source_flow_id: z.string().min(1)
  })
]);

// User tool schema
export const UserToolSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list'), ...paginationSchema }),
  z.object({ action: z.literal('get_current') }),
  z.object({
    action: z.literal('update'),
    user_id: uuidSchema('user ID'),
    username: z.string().optional(),
    password: z.string().min(1, 'Password cannot be empty').optional(),
    profile_image: z.string().optional(),
    is_active: z.boolean().optional(),
    is_superuser: z.boolean().optional()
  }),
  z.object({
    action: z.literal('reset_password'),
    user_id: uuidSchema('user ID'),
    new_password: z.string().min(8)
  }),
  z.object({
    action: z.literal('create'),
    username: z.string().min(1),
    password: z.string().min(1),
    optins: z.record(z.string(), z.unknown()).optional()
  })
]);

// Auth tool schema
export const AuthToolSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('login'),
    username: z.string().min(1),
    password: z.string().min(1)
  }),
  z.object({ action: z.literal('auto_login') }),
  z.object({ action: z.literal('logout') }),
  z.object({ action: z.literal('refresh') }),
  z.object({ action: z.literal('list_keys') }),
  z.object({ action: z.literal('create_key'), name: z.string().min(1) }),
  z.object({ action: z.literal('delete_key'), api_key_id: uuidSchema('API key ID') }),
  z.object({ action: z.literal('save_store_key'), api_key: z.string().min(1) })
]);

// Store tool schema
export const StoreToolSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list_components') }),
  z.object({
    action: z.literal('create_custom'),
    name: z.string().min(1),
    code: z.string().min(1)
  }),
  z.object({ action: z.literal('check') }),
  z.object({ action: z.literal('check_key'), api_key: z.string().min(1) }),
  z.object({
    action: z.literal('list_store'),
    search: z.string().optional(),
    tags: z.array(z.string()).optional(),
    ...paginationSchema
  }),
  z.object({ action: z.literal('get_store'), component_id: z.string().min(1) }),
  z.object({ action: z.literal('list_tags') }),
  z.object({ action: z.literal('get_likes') }),
  z.object({
    action: z.literal('create_store'),
    name: z.string().min(1),
    description: z.string().nullable().optional(),
    data: z.record(z.string(), z.unknown()),
    tags: z.array(z.string()).nullable().optional(),
    is_component: z.boolean().nullable().optional(),
    parent: z.string().optional(),
    last_tested_version: z.string().optional(),
    private: z.boolean().optional()
  }),
  z.object({ action: z.literal('like'), component_id: z.string().min(1) }),
  z.object({
    action: z.literal('update_custom'),
    code: z.string().min(1),
    field: z.string().min(1),
    template: z.record(z.string(), z.unknown()),
    field_value: z.unknown().optional(),
    frontend_node: z.record(z.string(), z.unknown()).optional(),
    tool_mode: z.boolean().optional()
  })
]);

// Registration tool schema
export const RegistrationToolSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('get') }),
  z.object({ action: z.literal('register'), email: z.string().email() })
]);

// Validation tool schema
export const ValidationToolSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('code'), code: z.string().min(1) }),
  z.object({ action: z.literal('prompt'), prompt: z.string().min(1) })
]);

// System tool schema
export const SystemToolSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('health') }),
  z.object({ action: z.literal('version') }),
  z.object({ action: z.literal('logs'), stream: z.boolean().optional() }),
  z.object({ action: z.literal('list_pictures') }),
  z.object({
    action: z.literal('get_picture'),
    folder_name: z.string().min(1),
    file_name: z.string().min(1)
  }),
  z.object({ action: z.literal('list_voices') }),
  z.object({ action: z.literal('session') }),
  z.object({
    action: z.literal('webhook_events'),
    flow_id_or_name: z.string().min(1),
    user_id: z.string().optional()
  }),
  z.object({ action: z.literal('health_check') })
]);

// Model tool schema
export const ModelToolSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('list'),
    provider: z.string().optional(),
    model_name: z.string().optional(),
    model_type: z.string().optional(),
    include_unsupported: z.boolean().optional(),
    include_deprecated: z.boolean().optional(),
    tool_calling: z.boolean().optional(),
    reasoning: z.boolean().optional(),
    search: z.string().optional()
  }),
  z.object({ action: z.literal('providers') }),
  z.object({
    action: z.literal('enabled_providers'),
    providers: z.array(z.string()).optional()
  }),
  z.object({
    action: z.literal('enabled_models'),
    model_names: z.array(z.string()).optional()
  }),
  z.object({
    action: z.literal('set_enabled'),
    models: z.array(z.object({
      provider: z.string().min(1),
      model_id: z.string().min(1),
      enabled: z.boolean()
    })).min(1)
  }),
  z.object({ action: z.literal('get_default'), model_type: z.string().min(1) }),
  z.object({
    action: z.literal('set_default'),
    provider: z.string().min(1),
    model_name: z.string().min(1),
    model_type: z.string().min(1)
  }),
  z.object({ action: z.literal('delete_default'), model_type: z.string().min(1) }),
  z.object({ action: z.literal('provider_mapping') }),
  z.object({
    action: z.literal('validate_provider'),
    provider: z.string().min(1),
    variables: z.record(z.string(), z.unknown())
  }),
  z.object({ action: z.literal('options_language') }),
  z.object({ action: z.literal('options_embedding') })
]);

// Agentic tool schema
const assistantRequestShape = {
  flow_id: z.string().min(1),
  input_value: z.string().optional(),
  session_id: z.string().optional(),
  component_id: z.string().optional(),
  field_name: z.string().optional(),
  model_name: z.string().optional(),
  provider: z.string().optional(),
  max_retries: z.number().int().nonnegative().optional()
};

export const AgenticToolSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('assist'), ...assistantRequestShape }),
  z.object({ action: z.literal('check_config') }),
  z.object({
    action: z.literal('execute'),
    flow_name: z.string().min(1),
    ...assistantRequestShape
  })
]);

// Workflow tool schema
export const WorkflowToolSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('run'),
    flow_id: z.string().min(1),
    inputs: z.record(z.string(), z.unknown()).optional(),
    stream: z.boolean().optional(),
    background: z.boolean().optional()
  }),
  z.object({ action: z.literal('get_result'), job_id: z.string().optional() }),
  z.object({ action: z.literal('stop'), job_id: z.string().min(1) })
]);

// MCP server config (shared)
const mcpServerConfigShape = {
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
  url: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional()
};

// MCP server tool schema
export const McpServerToolSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list'), action_count: z.boolean().optional() }),
  z.object({ action: z.literal('get'), server_name: z.string().min(1) }),
  z.object({
    action: z.literal('create'),
    server_name: z.string().min(1),
    config: z.object(mcpServerConfigShape)
  }),
  z.object({
    action: z.literal('update'),
    server_name: z.string().min(1),
    config: z.object(mcpServerConfigShape)
  }),
  z.object({ action: z.literal('delete'), server_name: z.string().min(1) })
]);

// MCP project tool schema
export const McpProjectToolSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('get_config'),
    project_id: uuidSchema('project ID'),
    mcp_enabled: z.boolean().optional()
  }),
  z.object({
    action: z.literal('update_config'),
    project_id: uuidSchema('project ID'),
    settings: z.array(z.record(z.string(), z.unknown())),
    auth_settings: z.record(z.string(), z.unknown()).optional()
  }),
  z.object({ action: z.literal('get_installed'), project_id: uuidSchema('project ID') }),
  z.object({
    action: z.literal('install'),
    project_id: uuidSchema('project ID'),
    client: z.string().min(1),
    transport: z.enum(['sse', 'streamablehttp']).optional()
  }),
  z.object({ action: z.literal('get_composer_url'), project_id: uuidSchema('project ID') })
]);

// Trace tool schema
export const TraceToolSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('list'),
    flow_id: z.string().optional(),
    session_id: z.string().optional(),
    status: z.enum(['unset', 'ok', 'error']).optional(),
    query: z.string().optional(),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
    ...paginationSchema
  }),
  z.object({ action: z.literal('get'), trace_id: z.string().min(1) }),
  z.object({ action: z.literal('delete'), trace_id: z.string().min(1) }),
  z.object({ action: z.literal('delete_by_flow'), flow_id: z.string().min(1) })
]);

// Response tool schema
export const ResponseToolSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('create'),
    model: z.string().min(1),
    input: z.string().min(1),
    stream: z.boolean().optional(),
    background: z.boolean().optional(),
    previous_response_id: z.string().optional(),
    include: z.array(z.string()).optional(),
    tools: z.array(z.record(z.string(), z.unknown())).optional()
  })
]);

// Export type inferences
export type FlowToolInput = z.infer<typeof FlowToolSchema>;
export type FlowExecutionToolInput = z.infer<typeof FlowExecutionToolSchema>;
export type BuildToolInput = z.infer<typeof BuildToolSchema>;
export type FolderToolInput = z.infer<typeof FolderToolSchema>;
export type ProjectToolInput = z.infer<typeof ProjectToolSchema>;
export type VariableToolInput = z.infer<typeof VariableToolSchema>;
export type KnowledgeBaseToolInput = z.infer<typeof KnowledgeBaseToolSchema>;
export type FileToolInput = z.infer<typeof FileToolSchema>;
export type MonitorToolInput = z.infer<typeof MonitorToolSchema>;
export type UserToolInput = z.infer<typeof UserToolSchema>;
export type AuthToolInput = z.infer<typeof AuthToolSchema>;
export type StoreToolInput = z.infer<typeof StoreToolSchema>;
export type RegistrationToolInput = z.infer<typeof RegistrationToolSchema>;
export type ValidationToolInput = z.infer<typeof ValidationToolSchema>;
export type SystemToolInput = z.infer<typeof SystemToolSchema>;
export type FlowVersionToolInput = z.infer<typeof FlowVersionToolSchema>;
export type FileV2ToolInput = z.infer<typeof FileV2ToolSchema>;
export type ModelToolInput = z.infer<typeof ModelToolSchema>;
export type AgenticToolInput = z.infer<typeof AgenticToolSchema>;
export type WorkflowToolInput = z.infer<typeof WorkflowToolSchema>;
export type McpServerToolInput = z.infer<typeof McpServerToolSchema>;
export type McpProjectToolInput = z.infer<typeof McpProjectToolSchema>;
export type TraceToolInput = z.infer<typeof TraceToolSchema>;
export type ResponseToolInput = z.infer<typeof ResponseToolSchema>;
