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
  z.object({ action: z.literal('get_starters') })
]);

// Flow execution tool schema
export const FlowExecutionToolSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('run'),
    flow_id_or_name: z.string().min(1),
    input_value: z.string().optional(),
    output_type: z.string().optional(),
    input_type: z.string().optional(),
    tweaks: z.record(z.string(), z.unknown()).optional(),
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
    action: z.literal('get_vertex'),
    flow_id: uuidSchema('flow ID'),
    vertex_id: z.string().min(1)
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
  z.object({ action: z.literal('delete'), variable_id: uuidSchema('variable ID') })
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
  })
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
  z.object({ action: z.literal('get_message'), message_id: z.string().min(1) }),
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
  })
]);

// User tool schema
export const UserToolSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list'), ...paginationSchema }),
  z.object({ action: z.literal('get'), user_id: uuidSchema('user ID') }),
  z.object({ action: z.literal('get_current') }),
  z.object({
    action: z.literal('update'),
    user_id: uuidSchema('user ID'),
    username: z.string().optional(),
    profile_image: z.string().optional(),
    is_active: z.boolean().optional(),
    is_superuser: z.boolean().optional()
  }),
  z.object({
    action: z.literal('reset_password'),
    user_id: uuidSchema('user ID'),
    new_password: z.string().min(8)
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
  z.object({ action: z.literal('delete_key'), api_key_id: uuidSchema('API key ID') })
]);

// Store tool schema
export const StoreToolSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list_components') }),
  z.object({ action: z.literal('list_custom') }),
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
  z.object({ action: z.literal('get_likes') })
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
  z.object({ action: z.literal('list_voices') })
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
