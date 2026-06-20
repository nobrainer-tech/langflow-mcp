import { z } from 'zod';

const FileNameSchema = z.string()
  .min(1, 'Filename is required')
  .max(255, 'Filename too long')
  .refine(
    (name) => {
      // Path separators and traversal
      if (/[\\\/]/.test(name)) return false;
      if (/\.\./.test(name)) return false;
      // Control characters (0x00-0x1F, 0x7F)
      if (/[\x00-\x1F\x7F]/.test(name)) return false;
      // Windows reserved characters
      if (/[<>:"|?*]/.test(name)) return false;
      // Windows reserved filenames (case-insensitive)
      const baseName = name.split('.')[0].toUpperCase();
      const reserved = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/;
      if (reserved.test(baseName)) return false;
      return true;
    },
    { message: 'Invalid filename. Contains forbidden characters, reserved names, or path traversal sequences.' }
  );

export const CreateFlowSchema = z.object({
  name: z.string().min(1, 'Flow name is required').max(255, 'Flow name too long'),
  description: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  folder_id: z.string().uuid('Invalid folder ID format').optional()
}).strict();

export const ListFlowsSchema = z.object({
  page: z.number().int().positive().optional(),
  size: z.number().int().positive().max(100, 'Page size cannot exceed 100').optional(),
  folder_id: z.string().uuid('Invalid folder ID format').optional(),
  components_only: z.boolean().optional(),
  get_all: z.boolean().optional()
}).strict();

export const GetFlowSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format')
}).strict();

export const UpdateFlowSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format'),
  name: z.string().min(1, 'Flow name is required').max(255, 'Flow name too long').optional(),
  description: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  folder_id: z.string().uuid('Invalid folder ID format').optional()
}).strict().refine(
  data => data.name !== undefined || data.description !== undefined || data.data !== undefined || data.folder_id !== undefined,
  { message: 'At least one field must be provided for update' }
);

export const DeleteFlowSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format')
}).strict();

export const DeleteFlowsSchema = z.object({
  flow_ids: z.array(z.string().uuid('Invalid flow ID format')).min(1, 'At least one flow ID is required')
}).strict();

export const ListComponentsSchema = z.object({}).strict();

export const RunFlowSchema = z.object({
  flow_id_or_name: z.string().min(1, 'Flow ID or name is required'),
  input_request: z.object({
    input_value: z.string().optional(),
    output_component: z.string().optional(),
    output_type: z.string().optional(),
    input_type: z.string().optional(),
    session_id: z.string().optional(),
    tweaks: z.record(z.string(), z.unknown()).optional(),
    context: z.record(z.string(), z.unknown()).optional()
  }),
  context: z.record(z.string(), z.unknown()).optional(),
  stream: z.boolean().optional().default(false)
}).strict();

export const TriggerWebhookSchema = z.object({
  flow_id_or_name: z.string().min(1, 'Flow ID or name is required'),
  input_request: z.object({
    input_value: z.string().optional(),
    tweaks: z.record(z.string(), z.unknown()).optional()
  })
}).strict();

const FileSchema = z.object({
  name: FileNameSchema,  // Use secure FileNameSchema instead of basic string validation
  content: z.string().min(1, 'File content required'),
  type: z.string().optional(),
}).refine(
  data => {
    const byteSize = Buffer.byteLength(data.content, 'utf8');
    return byteSize < 10 * 1024 * 1024;
  },
  { message: 'File size exceeds 10MB limit' }
);

export const UploadFlowSchema = z.object({
  file: FileSchema
}).strict();

export const DownloadFlowsSchema = z.object({
  flow_ids: z.array(z.string().uuid('Invalid flow ID format')).min(1, 'At least one flow ID is required')
}).strict();

export const GetBasicExamplesSchema = z.object({}).strict();

export const ListFoldersSchema = z.object({
  page: z.number().int().positive().optional(),
  size: z.number().int().positive().max(100, 'Page size cannot exceed 100').optional()
}).strict();

export const CreateFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(255, 'Folder name too long'),
  description: z.string().optional(),
  parent_id: z.string().uuid('Invalid parent folder ID format').optional()
}).strict();

export const GetFolderSchema = z.object({
  folder_id: z.string().uuid('Invalid folder ID format')
}).strict();

export const UpdateFolderSchema = z.object({
  folder_id: z.string().uuid('Invalid folder ID format'),
  name: z.string().min(1, 'Folder name is required').max(255, 'Folder name too long').optional(),
  description: z.string().optional(),
  parent_id: z.string().uuid('Invalid parent folder ID format').optional()
}).strict().refine(
  data => data.name !== undefined || data.description !== undefined || data.parent_id !== undefined,
  { message: 'At least one field must be provided for update' }
);

export const DeleteFolderSchema = z.object({
  folder_id: z.string().uuid('Invalid folder ID format')
}).strict();

export const ListProjectsSchema = z.object({
  page: z.number().int().positive().optional(),
  size: z.number().int().positive().max(100, 'Page size cannot exceed 100').optional()
}).strict();

export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255, 'Project name too long'),
  description: z.string().optional()
}).strict();

export const GetProjectSchema = z.object({
  project_id: z.string().uuid('Invalid project ID format')
}).strict();

export const UpdateProjectSchema = z.object({
  project_id: z.string().uuid('Invalid project ID format'),
  name: z.string().min(1, 'Project name is required').max(255, 'Project name too long').optional(),
  description: z.string().optional()
}).strict().refine(
  data => data.name !== undefined || data.description !== undefined,
  { message: 'At least one field must be provided for update' }
);

export const DeleteProjectSchema = z.object({
  project_id: z.string().uuid('Invalid project ID format')
}).strict();

export const UploadProjectSchema = z.object({
  file: FileSchema
}).strict();

export const DownloadProjectSchema = z.object({
  project_id: z.string().uuid('Invalid project ID format')
}).strict();

export const ListVariablesSchema = z.object({}).strict();

export const CreateVariableSchema = z.object({
  name: z.string().min(1, 'Variable name is required').max(255, 'Variable name too long'),
  value: z.string().min(1, 'Variable value is required'),
  type: z.string().optional(),
  default_fields: z.array(z.string()).optional()
}).strict();

export const UpdateVariableSchema = z.object({
  variable_id: z.string().uuid('Invalid variable ID format'),
  name: z.string().min(1, 'Variable name is required').max(255, 'Variable name too long').optional(),
  value: z.string().optional(),
  type: z.string().optional()
}).strict().refine(
  data => data.name !== undefined || data.value !== undefined || data.type !== undefined,
  { message: 'At least one field must be provided for update' }
);

export const DeleteVariableSchema = z.object({
  variable_id: z.string().uuid('Invalid variable ID format')
}).strict();

export const BuildFlowSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format'),
  inputs: z.record(z.string(), z.unknown()).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  files: z.array(z.string()).optional(),
  stop_component_id: z.string().optional(),
  start_component_id: z.string().optional(),
  log_builds: z.boolean().optional().default(true),
  flow_name: z.string().optional(),
  event_delivery: z.enum(['polling', 'streaming', 'direct']).optional().default('polling')
}).strict();

export const GetBuildStatusSchema = z.object({
  job_id: z.string().min(1, 'Job ID is required'),
  event_delivery: z.enum(['polling', 'streaming', 'direct']).optional().default('streaming')  // Changed from 'polling' to match api.yaml spec
}).strict();

export const CancelBuildSchema = z.object({
  job_id: z.string().min(1, 'Job ID is required')
}).strict();

export const ListKnowledgeBasesSchema = z.object({}).strict();

export const GetKnowledgeBaseSchema = z.object({
  kb_name: z.string().min(1, 'Knowledge base name is required')
}).strict();

export const DeleteKnowledgeBaseSchema = z.object({
  kb_name: z.string().min(1, 'Knowledge base name is required')
}).strict();

export const BulkDeleteKnowledgeBasesSchema = z.object({
  kb_names: z.array(z.string().min(1, 'Knowledge base name cannot be empty')).min(1, 'At least one knowledge base name is required')
}).strict();

export const UploadFileSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format'),
  file_content: z.string().min(1, 'File content is required')
    .refine(
      content => Buffer.byteLength(content, 'base64') <= 10 * 1024 * 1024,
      { message: 'File size exceeds maximum of 10MB (before base64 decode check)' }
    ),
  file_name: FileNameSchema
}).strict();

export const DownloadFileSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format'),
  file_name: FileNameSchema
}).strict();

export const ListFilesSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format')
}).strict();

export const DeleteFileSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format'),
  file_name: FileNameSchema
}).strict();

export const GetFileImageSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format'),
  file_name: FileNameSchema
}).strict();

export const ListProfilePicturesSchema = z.object({}).strict();

export const GetProfilePictureSchema = z.object({
  folder_name: FileNameSchema,
  file_name: FileNameSchema
}).strict();

export const ValidateCodeSchema = z.object({
  code: z.string().min(1, 'Code is required')
}).strict();

export const ValidatePromptSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required')
}).strict();

export const CheckStoreSchema = z.object({}).strict();

export const CheckStoreApiKeySchema = z.object({
  api_key: z.string().min(1, 'API key is required')
}).strict();

export const ListStoreComponentsSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100, 'Limit cannot exceed 100').optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional()
}).strict();

export const GetStoreComponentSchema = z.object({
  component_id: z.string().min(1, 'Component ID is required')
}).strict();

export const ListStoreTagsSchema = z.object({}).strict();

export const GetUserLikesSchema = z.object({}).strict();

export const RunFlowAdvancedSchema = z.object({
  flow_id_or_name: z.string().min(1, 'Flow ID or name is required'),
  input_value: z.string().optional(),
  input_type: z.string().optional(),
  output_type: z.string().optional(),
  output_component: z.string().optional(),
  tweaks: z.record(z.string(), z.unknown()).optional(),
  session_id: z.string().optional(),
  user_id: z.string().uuid('Invalid user ID format').optional(),
  stream: z.boolean().optional().default(false)
}).strict();

export const RunFlowSessionSchema = z.object({
  flow_id_or_name: z.string().min(1, 'Flow ID or name is required'),
  input_value: z.string().optional(),
  input_type: z.string().optional(),
  output_type: z.string().optional(),
  output_component: z.string().optional(),
  tweaks: z.record(z.string(), z.unknown()).optional(),
  session_id: z.string().min(1, 'Session ID is required'),
  context: z.record(z.string(), z.unknown()).optional(),
  stream: z.boolean().optional().default(false)
}).strict();

export const GetRegistrationSchema = z.object({}).strict();

export const RegisterUserSchema = z.object({
  email: z.string().email('Invalid email format')
}).strict();

export const ProcessFlowSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format'),
  inputs: z.record(z.string(), z.unknown()).optional(),
  tweaks: z.record(z.string(), z.unknown()).optional()
}).strict();

export const PredictFlowSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format'),
  inputs: z.record(z.string(), z.unknown()).optional(),
  tweaks: z.record(z.string(), z.unknown()).optional()
}).strict();

export const GetMonitorBuildsSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format')
}).strict();

export const GetMonitorMessagesSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format').optional(),
  session_id: z.string().optional(),
  sender: z.string().optional(),
  sender_name: z.string().optional(),
  order_by: z.string().optional()
}).strict();

export const GetMonitorMessageSchema = z.object({
  message_id: z.string().uuid('Invalid message ID format')
}).strict();

export const GetMonitorSessionsSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format').optional()
}).strict();

export const GetMonitorSessionMessagesSchema = z.object({
  session_id: z.string().min(1, 'Session ID is required')
}).strict();

export const MigrateMonitorSessionSchema = z.object({
  old_session_id: z.string().min(1, 'Old session ID is required'),
  new_session_id: z.string().min(1, 'New session ID is required')
}).strict();

export const GetMonitorTransactionsSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format'),
  page: z.number().int().positive().optional(),
  size: z.number().int().positive().max(100, 'Page size cannot exceed 100').optional()
}).strict();

export const DeleteMonitorBuildsSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format')
}).strict();

export const DeleteMonitorMessagesSchema = z.object({
  message_ids: z.array(z.string().uuid('Invalid message ID format')).min(1, 'At least one message ID is required')
}).strict();

export const BuildVerticesSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format'),
  data: z.record(z.string(), z.unknown()).optional(),
  stop_component_id: z.string().optional(),
  start_component_id: z.string().optional()
}).strict();

export const StreamVertexBuildSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format'),
  vertex_id: z.string().min(1, 'Vertex ID is required')
}).strict();

export const GetVersionSchema = z.object({}).strict();

export const ListUsersSchema = z.object({
  skip: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().max(100, 'Limit cannot exceed 100').optional()
}).strict();

export const GetCurrentUserSchema = z.object({}).strict();

export const UpdateUserSchema = z.object({
  user_id: z.string().uuid('Invalid user ID format'),
  username: z.string().min(1, 'Username is required').max(255, 'Username too long').optional(),
  password: z.string().min(1, 'Password cannot be empty').optional(),
  profile_image: z.string().optional(),
  is_active: z.boolean().optional(),
  is_superuser: z.boolean().optional()
}).strict().refine(
  data =>
    data.username !== undefined ||
    data.password !== undefined ||
    data.profile_image !== undefined ||
    data.is_active !== undefined ||
    data.is_superuser !== undefined,
  { message: 'At least one field must be provided for update' }
);

export const ResetUserPasswordSchema = z.object({
  user_id: z.string().uuid('Invalid user ID format'),
  new_password: z.string().min(8, 'Password must be at least 8 characters')
}).strict();

export const ListApiKeysSchema = z.object({}).strict();

export const CreateApiKeySchema = z.object({
  name: z.string().min(1, 'API key name is required').max(255, 'API key name too long')
}).strict();

export const DeleteApiKeySchema = z.object({
  api_key_id: z.string().uuid('Invalid API key ID format')
}).strict();

export const CreateCustomComponentSchema = z.object({
  code: z.string().min(1, 'Component code is required'),
  name: z.string().min(1, 'Component name is required').max(255, 'Component name too long'),
  description: z.string().optional(),
  return_type: z.string().optional()
}).strict();

export const LoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
}).strict();

export const AutoLoginSchema = z.object({}).strict();

export const RefreshTokenSchema = z.object({}).strict();

export const LogoutSchema = z.object({}).strict();

export const GetPublicFlowSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format')
}).strict();

export const BatchCreateFlowsSchema = z.object({
  flows: z.array(z.object({
    name: z.string().min(1, 'Flow name is required').max(255, 'Flow name too long'),
    description: z.string().optional(),
    data: z.record(z.string(), z.unknown()).optional(),
    folder_id: z.string().uuid('Invalid folder ID format').optional()
  })).min(1, 'At least one flow is required')
}).strict();

export const GetTaskStatusSchema = z.object({
  task_id: z.string().min(1, 'Task ID is required')
}).strict();

export const DownloadFolderSchema = z.object({
  folder_id: z.string().uuid('Invalid folder ID format')
}).strict();

export const UploadFolderSchema = z.object({
  file_content: z.string().min(1, 'File content is required')
    .refine(
      content => Buffer.byteLength(content, 'base64') <= 10 * 1024 * 1024,
      { message: 'File size exceeds maximum of 10MB (before base64 decode check)' }
    ),
  file_name: FileNameSchema
}).strict();

export const ListStarterProjectsSchema = z.object({}).strict();

export const UploadKnowledgeBaseSchema = z.object({
  kb_name: z.string().min(1, 'Knowledge base name is required'),
  file_content: z.string().min(1, 'File content is required')
    .refine(
      content => Buffer.byteLength(content, 'base64') <= 10 * 1024 * 1024,
      { message: 'File size exceeds maximum of 10MB (before base64 decode check)' }
    ),
  file_name: FileNameSchema
}).strict();

export const ListElevenLabsVoicesSchema = z.object({}).strict();

export const GetLogsSchema = z.object({
  stream: z.boolean().optional().default(false)
}).strict();

// === Langflow 1.9.x tools ===

// Flows / versions / events
export const ReplaceFlowSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format'),
  name: z.string().min(1, 'Flow name is required').max(255, 'Flow name too long'),
  description: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  folder_id: z.string().uuid('Invalid folder ID format').optional()
}).strict();

export const ExpandFlowsSchema = z.object({
  body: z.record(z.string(), z.unknown())
}).strict();

export const GetFlowEventsSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format'),
  since: z.number().int().optional()
}).strict();

export const CreateFlowEventSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format'),
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
}).strict();

export const ListFlowVersionsSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format'),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
  deployment_provider_id: z.string().optional()
}).strict();

export const CreateFlowVersionSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format'),
  body: z.record(z.string(), z.unknown()).optional()
}).strict();

export const GetFlowVersionSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format'),
  version_id: z.string().min(1, 'Version ID is required')
}).strict();

export const DeleteFlowVersionSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format'),
  version_id: z.string().min(1, 'Version ID is required')
}).strict();

export const ActivateFlowVersionSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format'),
  version_id: z.string().min(1, 'Version ID is required'),
  save_draft: z.boolean().optional()
}).strict();

// Singletons
export const DetectVariablesSchema = z.object({
  flow_version_ids: z.array(z.string().min(1, 'Flow version ID cannot be empty')).min(1, 'At least one flow version ID is required')
}).strict();

export const SaveStoreApiKeySchema = z.object({
  api_key: z.string().min(1, 'API key is required')
}).strict();

export const UpdateCustomComponentSchema = z.object({
  code: z.string().min(1, 'Component code is required'),
  field: z.string().min(1, 'Field is required'),
  template: z.record(z.string(), z.unknown()),
  field_value: z.unknown().optional(),
  frontend_node: z.record(z.string(), z.unknown()).optional(),
  tool_mode: z.boolean().optional()
}).strict();

export const CreateStoreComponentSchema = z.object({
  name: z.string().min(1, 'Component name is required'),
  description: z.string().nullable().optional(),
  data: z.record(z.string(), z.unknown()),
  tags: z.array(z.string()).nullable().optional(),
  is_component: z.boolean().nullable().optional(),
  parent: z.string().optional(),
  last_tested_version: z.string().optional(),
  private: z.boolean().optional()
}).strict();

export const LikeStoreComponentSchema = z.object({
  component_id: z.string().min(1, 'Component ID is required')
}).strict();

export const CreateResponseSchema = z.object({
  model: z.string().min(1, 'Model is required'),
  input: z.string().min(1, 'Input is required'),
  stream: z.boolean().optional(),
  background: z.boolean().optional(),
  previous_response_id: z.string().optional(),
  include: z.array(z.string()).optional(),
  tools: z.array(z.record(z.string(), z.unknown())).optional()
}).strict();

export const GetSessionSchema = z.object({}).strict();

export const CreateUserSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  optins: z.record(z.string(), z.unknown()).optional()
}).strict();

export const GetWebhookEventsSchema = z.object({
  flow_id_or_name: z.string().min(1, 'Flow ID or name is required'),
  user_id: z.string().optional()
}).strict();

export const GetHealthCheckSchema = z.object({}).strict();

// Files V2
export const ListFilesV2Schema = z.object({}).strict();

export const UploadFileV2Schema = z.object({
  file_content: z.string().min(1, 'File content is required')
    .refine(
      content => Buffer.byteLength(content, 'base64') <= 10 * 1024 * 1024,
      { message: 'File size exceeds maximum of 10MB (before base64 decode check)' }
    ),
  file_name: FileNameSchema,
  append: z.boolean().optional(),
  ephemeral: z.boolean().optional()
}).strict();

export const GetFileV2Schema = z.object({
  file_id: z.string().min(1, 'File ID is required'),
  return_content: z.boolean().optional()
}).strict();

export const RenameFileV2Schema = z.object({
  file_id: z.string().min(1, 'File ID is required'),
  name: FileNameSchema
}).strict();

export const DeleteFileV2Schema = z.object({
  file_id: z.string().min(1, 'File ID is required')
}).strict();

export const DeleteAllFilesV2Schema = z.object({}).strict();

export const BatchDownloadFilesV2Schema = z.object({
  file_ids: z.array(z.string().min(1, 'File ID cannot be empty')).min(1, 'At least one file ID is required')
}).strict();

export const BatchDeleteFilesV2Schema = z.object({
  file_ids: z.array(z.string().min(1, 'File ID cannot be empty')).min(1, 'At least one file ID is required')
}).strict();

// Knowledge base (1.9.x)
export const ListKnowledgeBasesDetailedSchema = z.object({}).strict();

export const CreateKnowledgeBaseSchema = z.object({
  name: z.string().min(1, 'Knowledge base name is required'),
  embedding_provider: z.string().min(1, 'Embedding provider is required'),
  embedding_model: z.string().min(1, 'Embedding model is required'),
  column_config: z.array(z.record(z.string(), z.unknown())).optional()
}).strict();

export const PreviewKnowledgeBaseChunksSchema = z.object({
  file_content: z.string().min(1, 'File content is required')
    .refine(
      content => Buffer.byteLength(content, 'base64') <= 10 * 1024 * 1024,
      { message: 'File size exceeds maximum of 10MB (before base64 decode check)' }
    ),
  file_name: FileNameSchema,
  params: z.record(z.string(), z.unknown()).optional()
}).strict();

export const ListKnowledgeBaseChunksSchema = z.object({
  kb_name: z.string().min(1, 'Knowledge base name is required'),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  search: z.string().optional()
}).strict();

export const IngestKnowledgeBaseSchema = z.object({
  kb_name: z.string().min(1, 'Knowledge base name is required'),
  file_content: z.string().min(1, 'File content is required')
    .refine(
      content => Buffer.byteLength(content, 'base64') <= 10 * 1024 * 1024,
      { message: 'File size exceeds maximum of 10MB (before base64 decode check)' }
    ),
  file_name: FileNameSchema,
  params: z.record(z.string(), z.unknown()).optional()
}).strict();

export const CancelKnowledgeBaseIngestSchema = z.object({
  kb_name: z.string().min(1, 'Knowledge base name is required')
}).strict();

// Monitor (1.9.x)
export const UpdateMonitorMessageSchema = z.object({
  message_id: z.string().min(1, 'Message ID is required'),
  text: z.string().optional(),
  sender: z.string().optional(),
  sender_name: z.string().optional(),
  session_id: z.string().optional(),
  files: z.array(z.string()).optional(),
  properties: z.record(z.string(), z.unknown()).optional()
}).strict();

export const DeleteMonitorSessionMessagesSchema = z.object({
  session_id: z.string().min(1, 'Session ID is required')
}).strict();

export const DeleteMonitorSessionsSchema = z.object({
  session_ids: z.array(z.string().min(1, 'Session ID cannot be empty')).min(1, 'At least one session ID is required')
}).strict();

export const GetSharedMessagesSchema = z.object({
  source_flow_id: z.string().min(1, 'Source flow ID is required'),
  session_id: z.string().optional(),
  order_by: z.string().optional()
}).strict();

export const GetSharedSessionsSchema = z.object({
  source_flow_id: z.string().min(1, 'Source flow ID is required')
}).strict();

export const UpdateSharedMessageSchema = z.object({
  message_id: z.string().min(1, 'Message ID is required'),
  source_flow_id: z.string().min(1, 'Source flow ID is required'),
  text: z.string().optional(),
  sender: z.string().optional(),
  sender_name: z.string().optional(),
  session_id: z.string().optional(),
  files: z.array(z.string()).optional(),
  properties: z.record(z.string(), z.unknown()).optional()
}).strict();

export const MigrateSharedSessionSchema = z.object({
  session_id: z.string().min(1, 'Session ID is required'),
  new_session_id: z.string().min(1, 'New session ID is required'),
  source_flow_id: z.string().min(1, 'Source flow ID is required')
}).strict();

export const DeleteSharedSessionSchema = z.object({
  session_id: z.string().min(1, 'Session ID is required'),
  source_flow_id: z.string().min(1, 'Source flow ID is required')
}).strict();

// Traces
export const ListTracesSchema = z.object({
  flow_id: z.string().optional(),
  session_id: z.string().optional(),
  status: z.enum(['unset', 'ok', 'error']).optional(),
  query: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  page: z.number().int().positive().optional(),
  size: z.number().int().positive().max(100, 'Page size cannot exceed 100').optional()
}).strict();

export const DeleteTracesSchema = z.object({
  flow_id: z.string().min(1, 'Flow ID is required')
}).strict();

export const GetTraceSchema = z.object({
  trace_id: z.string().min(1, 'Trace ID is required')
}).strict();

export const DeleteTraceSchema = z.object({
  trace_id: z.string().min(1, 'Trace ID is required')
}).strict();

// Models
export const ListModelsSchema = z.object({
  provider: z.string().optional(),
  model_name: z.string().optional(),
  model_type: z.string().optional(),
  include_unsupported: z.boolean().optional(),
  include_deprecated: z.boolean().optional(),
  tool_calling: z.boolean().optional(),
  reasoning: z.boolean().optional(),
  search: z.string().optional()
}).strict();

export const ListModelProvidersSchema = z.object({}).strict();

export const ListEnabledProvidersSchema = z.object({
  providers: z.array(z.string()).optional()
}).strict();

export const ListEnabledModelsSchema = z.object({
  model_names: z.array(z.string()).optional()
}).strict();

export const SetEnabledModelsSchema = z.object({
  models: z.array(z.object({
    provider: z.string().min(1, 'Provider is required'),
    model_id: z.string().min(1, 'Model ID is required'),
    enabled: z.boolean()
  })).min(1, 'At least one model status is required')
}).strict();

export const GetDefaultModelSchema = z.object({
  model_type: z.string().min(1, 'Model type is required')
}).strict();

export const SetDefaultModelSchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  model_name: z.string().min(1, 'Model name is required'),
  model_type: z.string().min(1, 'Model type is required')
}).strict();

export const DeleteDefaultModelSchema = z.object({
  model_type: z.string().min(1, 'Model type is required')
}).strict();

export const GetProviderVariableMappingSchema = z.object({}).strict();

export const ValidateModelProviderSchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  variables: z.record(z.string(), z.unknown())
}).strict();

export const GetLanguageModelOptionsSchema = z.object({}).strict();

export const GetEmbeddingModelOptionsSchema = z.object({}).strict();

// Agentic
const agenticAssistFields = {
  flow_id: z.string().min(1, 'Flow ID is required'),
  input_value: z.string().optional(),
  session_id: z.string().optional(),
  component_id: z.string().optional(),
  field_name: z.string().optional(),
  model_name: z.string().optional(),
  provider: z.string().optional(),
  max_retries: z.number().int().nonnegative().optional()
};

export const AgenticAssistSchema = z.object({ ...agenticAssistFields }).strict();

export const AgenticCheckConfigSchema = z.object({}).strict();

export const AgenticExecuteSchema = z.object({
  flow_name: z.string().min(1, 'Flow name is required'),
  ...agenticAssistFields
}).strict();

// Workflows V2
export const GetWorkflowResultSchema = z.object({
  job_id: z.string().optional()
}).strict();

export const RunWorkflowSchema = z.object({
  flow_id: z.string().min(1, 'Flow ID is required'),
  inputs: z.record(z.string(), z.unknown()).optional(),
  stream: z.boolean().optional(),
  background: z.boolean().optional(),
  globals: z.record(z.string(), z.string()).optional()
}).strict();

export const StopWorkflowSchema = z.object({
  job_id: z.string().min(1, 'Job ID is required')
}).strict();

// MCP servers
const mcpServerConfigSchema = z.object({
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
  url: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional()
});

export const ListMcpServersSchema = z.object({
  action_count: z.boolean().optional()
}).strict();

export const GetMcpServerSchema = z.object({
  server_name: z.string().min(1, 'Server name is required')
}).strict();

export const CreateMcpServerSchema = z.object({
  server_name: z.string().min(1, 'Server name is required'),
  config: mcpServerConfigSchema
}).strict();

export const UpdateMcpServerSchema = z.object({
  server_name: z.string().min(1, 'Server name is required'),
  config: mcpServerConfigSchema
}).strict();

export const DeleteMcpServerSchema = z.object({
  server_name: z.string().min(1, 'Server name is required')
}).strict();

// MCP project
export const GetMcpProjectConfigSchema = z.object({
  project_id: z.string().uuid('Invalid project ID format'),
  mcp_enabled: z.boolean().optional()
}).strict();

export const UpdateMcpProjectConfigSchema = z.object({
  project_id: z.string().uuid('Invalid project ID format'),
  settings: z.array(z.record(z.string(), z.unknown())),
  auth_settings: z.record(z.string(), z.unknown()).optional()
}).strict();

export const GetMcpProjectInstalledSchema = z.object({
  project_id: z.string().uuid('Invalid project ID format')
}).strict();

export const InstallMcpProjectSchema = z.object({
  project_id: z.string().uuid('Invalid project ID format'),
  client: z.string().min(1, 'Client is required'),
  transport: z.enum(['sse', 'streamablehttp']).optional()
}).strict();

export const GetMcpProjectComposerUrlSchema = z.object({
  project_id: z.string().uuid('Invalid project ID format')
}).strict();

export type ReplaceFlowInput = z.infer<typeof ReplaceFlowSchema>;
export type ExpandFlowsInput = z.infer<typeof ExpandFlowsSchema>;
export type GetFlowEventsInput = z.infer<typeof GetFlowEventsSchema>;
export type CreateFlowEventInput = z.infer<typeof CreateFlowEventSchema>;
export type ListFlowVersionsInput = z.infer<typeof ListFlowVersionsSchema>;
export type CreateFlowVersionInput = z.infer<typeof CreateFlowVersionSchema>;
export type GetFlowVersionInput = z.infer<typeof GetFlowVersionSchema>;
export type DeleteFlowVersionInput = z.infer<typeof DeleteFlowVersionSchema>;
export type ActivateFlowVersionInput = z.infer<typeof ActivateFlowVersionSchema>;
export type DetectVariablesInput = z.infer<typeof DetectVariablesSchema>;
export type SaveStoreApiKeyInput = z.infer<typeof SaveStoreApiKeySchema>;
export type UpdateCustomComponentInput = z.infer<typeof UpdateCustomComponentSchema>;
export type CreateStoreComponentInput = z.infer<typeof CreateStoreComponentSchema>;
export type LikeStoreComponentInput = z.infer<typeof LikeStoreComponentSchema>;
export type CreateResponseInput = z.infer<typeof CreateResponseSchema>;
export type GetSessionInput = z.infer<typeof GetSessionSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type GetWebhookEventsInput = z.infer<typeof GetWebhookEventsSchema>;
export type GetHealthCheckInput = z.infer<typeof GetHealthCheckSchema>;
export type ListFilesV2Input = z.infer<typeof ListFilesV2Schema>;
export type UploadFileV2Input = z.infer<typeof UploadFileV2Schema>;
export type GetFileV2Input = z.infer<typeof GetFileV2Schema>;
export type RenameFileV2Input = z.infer<typeof RenameFileV2Schema>;
export type DeleteFileV2Input = z.infer<typeof DeleteFileV2Schema>;
export type DeleteAllFilesV2Input = z.infer<typeof DeleteAllFilesV2Schema>;
export type BatchDownloadFilesV2Input = z.infer<typeof BatchDownloadFilesV2Schema>;
export type BatchDeleteFilesV2Input = z.infer<typeof BatchDeleteFilesV2Schema>;
export type ListKnowledgeBasesDetailedInput = z.infer<typeof ListKnowledgeBasesDetailedSchema>;
export type CreateKnowledgeBaseInput = z.infer<typeof CreateKnowledgeBaseSchema>;
export type PreviewKnowledgeBaseChunksInput = z.infer<typeof PreviewKnowledgeBaseChunksSchema>;
export type ListKnowledgeBaseChunksInput = z.infer<typeof ListKnowledgeBaseChunksSchema>;
export type IngestKnowledgeBaseInput = z.infer<typeof IngestKnowledgeBaseSchema>;
export type CancelKnowledgeBaseIngestInput = z.infer<typeof CancelKnowledgeBaseIngestSchema>;
export type UpdateMonitorMessageInput = z.infer<typeof UpdateMonitorMessageSchema>;
export type DeleteMonitorSessionMessagesInput = z.infer<typeof DeleteMonitorSessionMessagesSchema>;
export type DeleteMonitorSessionsInput = z.infer<typeof DeleteMonitorSessionsSchema>;
export type GetSharedMessagesInput = z.infer<typeof GetSharedMessagesSchema>;
export type GetSharedSessionsInput = z.infer<typeof GetSharedSessionsSchema>;
export type UpdateSharedMessageInput = z.infer<typeof UpdateSharedMessageSchema>;
export type MigrateSharedSessionInput = z.infer<typeof MigrateSharedSessionSchema>;
export type DeleteSharedSessionInput = z.infer<typeof DeleteSharedSessionSchema>;
export type ListTracesInput = z.infer<typeof ListTracesSchema>;
export type DeleteTracesInput = z.infer<typeof DeleteTracesSchema>;
export type GetTraceInput = z.infer<typeof GetTraceSchema>;
export type DeleteTraceInput = z.infer<typeof DeleteTraceSchema>;
export type ListModelsInput = z.infer<typeof ListModelsSchema>;
export type ListModelProvidersInput = z.infer<typeof ListModelProvidersSchema>;
export type ListEnabledProvidersInput = z.infer<typeof ListEnabledProvidersSchema>;
export type ListEnabledModelsInput = z.infer<typeof ListEnabledModelsSchema>;
export type SetEnabledModelsInput = z.infer<typeof SetEnabledModelsSchema>;
export type GetDefaultModelInput = z.infer<typeof GetDefaultModelSchema>;
export type SetDefaultModelInput = z.infer<typeof SetDefaultModelSchema>;
export type DeleteDefaultModelInput = z.infer<typeof DeleteDefaultModelSchema>;
export type GetProviderVariableMappingInput = z.infer<typeof GetProviderVariableMappingSchema>;
export type ValidateModelProviderInput = z.infer<typeof ValidateModelProviderSchema>;
export type GetLanguageModelOptionsInput = z.infer<typeof GetLanguageModelOptionsSchema>;
export type GetEmbeddingModelOptionsInput = z.infer<typeof GetEmbeddingModelOptionsSchema>;
export type AgenticAssistInput = z.infer<typeof AgenticAssistSchema>;
export type AgenticCheckConfigInput = z.infer<typeof AgenticCheckConfigSchema>;
export type AgenticExecuteInput = z.infer<typeof AgenticExecuteSchema>;
export type GetWorkflowResultInput = z.infer<typeof GetWorkflowResultSchema>;
export type RunWorkflowInput = z.infer<typeof RunWorkflowSchema>;
export type StopWorkflowInput = z.infer<typeof StopWorkflowSchema>;
export type ListMcpServersInput = z.infer<typeof ListMcpServersSchema>;
export type GetMcpServerInput = z.infer<typeof GetMcpServerSchema>;
export type CreateMcpServerInput = z.infer<typeof CreateMcpServerSchema>;
export type UpdateMcpServerInput = z.infer<typeof UpdateMcpServerSchema>;
export type DeleteMcpServerInput = z.infer<typeof DeleteMcpServerSchema>;
export type GetMcpProjectConfigInput = z.infer<typeof GetMcpProjectConfigSchema>;
export type UpdateMcpProjectConfigInput = z.infer<typeof UpdateMcpProjectConfigSchema>;
export type GetMcpProjectInstalledInput = z.infer<typeof GetMcpProjectInstalledSchema>;
export type InstallMcpProjectInput = z.infer<typeof InstallMcpProjectSchema>;
export type GetMcpProjectComposerUrlInput = z.infer<typeof GetMcpProjectComposerUrlSchema>;

export type CreateFlowInput = z.infer<typeof CreateFlowSchema>;
export type ListFlowsInput = z.infer<typeof ListFlowsSchema>;
export type GetFlowInput = z.infer<typeof GetFlowSchema>;
export type UpdateFlowInput = z.infer<typeof UpdateFlowSchema>;
export type DeleteFlowInput = z.infer<typeof DeleteFlowSchema>;
export type DeleteFlowsInput = z.infer<typeof DeleteFlowsSchema>;
export type ListComponentsInput = z.infer<typeof ListComponentsSchema>;
export type RunFlowInput = z.infer<typeof RunFlowSchema>;
export type TriggerWebhookInput = z.infer<typeof TriggerWebhookSchema>;
export type UploadFlowInput = z.infer<typeof UploadFlowSchema>;
export type DownloadFlowsInput = z.infer<typeof DownloadFlowsSchema>;
export type GetBasicExamplesInput = z.infer<typeof GetBasicExamplesSchema>;
export type ListFoldersInput = z.infer<typeof ListFoldersSchema>;
export type CreateFolderInput = z.infer<typeof CreateFolderSchema>;
export type GetFolderInput = z.infer<typeof GetFolderSchema>;
export type UpdateFolderInput = z.infer<typeof UpdateFolderSchema>;
export type DeleteFolderInput = z.infer<typeof DeleteFolderSchema>;
export type ListProjectsInput = z.infer<typeof ListProjectsSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type GetProjectInput = z.infer<typeof GetProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type DeleteProjectInput = z.infer<typeof DeleteProjectSchema>;
export type UploadProjectInput = z.infer<typeof UploadProjectSchema>;
export type DownloadProjectInput = z.infer<typeof DownloadProjectSchema>;
export type ListVariablesInput = z.infer<typeof ListVariablesSchema>;
export type CreateVariableInput = z.infer<typeof CreateVariableSchema>;
export type UpdateVariableInput = z.infer<typeof UpdateVariableSchema>;
export type DeleteVariableInput = z.infer<typeof DeleteVariableSchema>;
export type BuildFlowInput = z.infer<typeof BuildFlowSchema>;
export type GetBuildStatusInput = z.infer<typeof GetBuildStatusSchema>;
export type CancelBuildInput = z.infer<typeof CancelBuildSchema>;
export type ListKnowledgeBasesInput = z.infer<typeof ListKnowledgeBasesSchema>;
export type GetKnowledgeBaseInput = z.infer<typeof GetKnowledgeBaseSchema>;
export type DeleteKnowledgeBaseInput = z.infer<typeof DeleteKnowledgeBaseSchema>;
export type BulkDeleteKnowledgeBasesInput = z.infer<typeof BulkDeleteKnowledgeBasesSchema>;
export type UploadFileInput = z.infer<typeof UploadFileSchema>;
export type DownloadFileInput = z.infer<typeof DownloadFileSchema>;
export type ListFilesInput = z.infer<typeof ListFilesSchema>;
export type DeleteFileInput = z.infer<typeof DeleteFileSchema>;
export type GetFileImageInput = z.infer<typeof GetFileImageSchema>;
export type ListProfilePicturesInput = z.infer<typeof ListProfilePicturesSchema>;
export type GetProfilePictureInput = z.infer<typeof GetProfilePictureSchema>;
export type ValidateCodeInput = z.infer<typeof ValidateCodeSchema>;
export type ValidatePromptInput = z.infer<typeof ValidatePromptSchema>;
export type CheckStoreInput = z.infer<typeof CheckStoreSchema>;
export type CheckStoreApiKeyInput = z.infer<typeof CheckStoreApiKeySchema>;
export type ListStoreComponentsInput = z.infer<typeof ListStoreComponentsSchema>;
export type GetStoreComponentInput = z.infer<typeof GetStoreComponentSchema>;
export type ListStoreTagsInput = z.infer<typeof ListStoreTagsSchema>;
export type GetUserLikesInput = z.infer<typeof GetUserLikesSchema>;
export type RunFlowAdvancedInput = z.infer<typeof RunFlowAdvancedSchema>;
export type RunFlowSessionInput = z.infer<typeof RunFlowSessionSchema>;
export type GetRegistrationInput = z.infer<typeof GetRegistrationSchema>;
export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
export type ProcessFlowInput = z.infer<typeof ProcessFlowSchema>;
export type PredictFlowInput = z.infer<typeof PredictFlowSchema>;
export type GetMonitorBuildsInput = z.infer<typeof GetMonitorBuildsSchema>;
export type GetMonitorMessagesInput = z.infer<typeof GetMonitorMessagesSchema>;
export type GetMonitorMessageInput = z.infer<typeof GetMonitorMessageSchema>;
export type GetMonitorSessionsInput = z.infer<typeof GetMonitorSessionsSchema>;
export type GetMonitorSessionMessagesInput = z.infer<typeof GetMonitorSessionMessagesSchema>;
export type MigrateMonitorSessionInput = z.infer<typeof MigrateMonitorSessionSchema>;
export type GetMonitorTransactionsInput = z.infer<typeof GetMonitorTransactionsSchema>;
export type DeleteMonitorBuildsInput = z.infer<typeof DeleteMonitorBuildsSchema>;
export type DeleteMonitorMessagesInput = z.infer<typeof DeleteMonitorMessagesSchema>;
export type BuildVerticesInput = z.infer<typeof BuildVerticesSchema>;
export type StreamVertexBuildInput = z.infer<typeof StreamVertexBuildSchema>;
export type GetVersionInput = z.infer<typeof GetVersionSchema>;
export type ListUsersInput = z.infer<typeof ListUsersSchema>;
export type GetCurrentUserInput = z.infer<typeof GetCurrentUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type ResetUserPasswordInput = z.infer<typeof ResetUserPasswordSchema>;
export type ListApiKeysInput = z.infer<typeof ListApiKeysSchema>;
export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;
export type DeleteApiKeyInput = z.infer<typeof DeleteApiKeySchema>;
export type CreateCustomComponentInput = z.infer<typeof CreateCustomComponentSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type AutoLoginInput = z.infer<typeof AutoLoginSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type LogoutInput = z.infer<typeof LogoutSchema>;
export type GetPublicFlowInput = z.infer<typeof GetPublicFlowSchema>;
export type BatchCreateFlowsInput = z.infer<typeof BatchCreateFlowsSchema>;
export type GetTaskStatusInput = z.infer<typeof GetTaskStatusSchema>;
export type DownloadFolderInput = z.infer<typeof DownloadFolderSchema>;
export type UploadFolderInput = z.infer<typeof UploadFolderSchema>;
export type ListStarterProjectsInput = z.infer<typeof ListStarterProjectsSchema>;
export type UploadKnowledgeBaseInput = z.infer<typeof UploadKnowledgeBaseSchema>;
export type ListElevenLabsVoicesInput = z.infer<typeof ListElevenLabsVoicesSchema>;
export type GetLogsInput = z.infer<typeof GetLogsSchema>;

// --- Authorization (Langflow 1.10.0) ---
export const ListAuthzRolesSchema = z.object({
  is_system: z.boolean().optional(),
  name: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional()
}).strict();

export const GetAuthzRoleSchema = z.object({
  role_id: z.string().min(1, 'Role ID is required')
}).strict();

export const CreateAuthzRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  parent_role_id: z.string().optional()
}).strict();

export const UpdateAuthzRoleSchema = z.object({
  role_id: z.string().min(1, 'Role ID is required'),
  name: z.string().optional(),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  parent_role_id: z.string().optional()
}).strict();

export const DeleteAuthzRoleSchema = z.object({
  role_id: z.string().min(1, 'Role ID is required')
}).strict();

export const ListAuthzRoleAssignmentsSchema = z.object({
  user_id: z.string().optional(),
  role_id: z.string().optional(),
  domain_type: z.string().optional(),
  domain_id: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional()
}).strict();

export const CreateAuthzRoleAssignmentSchema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
  role_id: z.string().min(1, 'Role ID is required'),
  domain_type: z.enum(['global', 'org', 'workspace', 'project']).optional(),
  domain_id: z.string().optional()
}).strict();

export const DeleteAuthzRoleAssignmentSchema = z.object({
  assignment_id: z.string().min(1, 'Assignment ID is required')
}).strict();

export const ListAuthzTeamsSchema = z.object({
  search: z.string().optional(),
  is_active: z.boolean().optional(),
  limit: z.number().optional(),
  offset: z.number().optional()
}).strict();

export const GetAuthzTeamSchema = z.object({
  team_id: z.string().min(1, 'Team ID is required')
}).strict();

export const CreateAuthzTeamSchema = z.object({
  team_name: z.string().min(1, 'Team name is required'),
  adom_name: z.string().min(1, 'Administrative domain name is required'),
  description: z.string().optional(),
  is_active: z.boolean().optional()
}).strict();

export const UpdateAuthzTeamSchema = z.object({
  team_id: z.string().min(1, 'Team ID is required'),
  team_name: z.string().optional(),
  adom_name: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional()
}).strict();

export const DeleteAuthzTeamSchema = z.object({
  team_id: z.string().min(1, 'Team ID is required')
}).strict();

export const ListAuthzTeamMembersSchema = z.object({
  team_id: z.string().min(1, 'Team ID is required'),
  limit: z.number().optional(),
  offset: z.number().optional()
}).strict();

export const AddAuthzTeamMemberSchema = z.object({
  team_id: z.string().min(1, 'Team ID is required'),
  user_id: z.string().min(1, 'User ID is required'),
  source: z.enum(['manual', 'sso']).optional()
}).strict();

export const RemoveAuthzTeamMemberSchema = z.object({
  team_id: z.string().min(1, 'Team ID is required'),
  user_id: z.string().min(1, 'User ID is required')
}).strict();

export const ListAuthzSharesSchema = z.object({
  resource_type: z.string().optional(),
  resource_id: z.string().optional(),
  target_id: z.string().optional(),
  scope: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional()
}).strict();

export const GetAuthzShareSchema = z.object({
  share_id: z.string().min(1, 'Share ID is required')
}).strict();

export const CreateAuthzShareSchema = z.object({
  resource_type: z.enum(['flow', 'deployment', 'project', 'knowledge_base', 'variable', 'file']),
  resource_id: z.string().min(1, 'Resource ID is required'),
  scope: z.enum(['private', 'team', 'user', 'public']),
  target_id: z.string().optional(),
  permission_level: z.enum(['read', 'write', 'execute', 'admin']).optional()
}).strict();

export const UpdateAuthzShareSchema = z.object({
  share_id: z.string().min(1, 'Share ID is required'),
  permission_level: z.enum(['read', 'write', 'execute', 'admin'])
}).strict();

export const DeleteAuthzShareSchema = z.object({
  share_id: z.string().min(1, 'Share ID is required')
}).strict();

export const GetAuthzAuditSchema = z.object({
  user_id: z.string().optional(),
  resource_type: z.string().optional(),
  resource_id: z.string().optional(),
  action: z.string().optional(),
  result: z.string().optional(),
  since: z.string().optional(),
  until: z.string().optional(),
  page: z.number().optional(),
  size: z.number().optional()
}).strict();

export const GetMyPermissionsSchema = z.object({
  resource_type: z.enum(['flow', 'deployment', 'project', 'knowledge_base', 'variable', 'file', 'component']),
  resource_ids: z.array(z.string()).min(1, 'At least one resource ID is required'),
  actions: z.array(z.string()).optional(),
  domain: z.string().optional()
}).strict();

// --- Memory bases (Langflow 1.10.0) ---
export const CreateMemoryBaseSchema = z.object({
  name: z.string().min(1, 'Memory base name is required'),
  flow_id: z.string().min(1, 'Flow ID is required'),
  threshold: z.number().optional(),
  auto_capture: z.boolean().optional(),
  embedding_model: z.string().optional(),
  preprocessing: z.boolean().optional(),
  preproc_model: z.string().optional(),
  preproc_instructions: z.string().optional(),
  preproc_kill_phrase: z.string().optional()
}).strict();

export const ListMemoryBasesSchema = z.object({
  flow_id: z.string().optional(),
  page: z.number().optional(),
  size: z.number().optional()
}).strict();

export const GetMemoryBaseSchema = z.object({
  memory_base_id: z.string().min(1, 'Memory base ID is required')
}).strict();

export const ListMemoryBaseSessionsSchema = z.object({
  memory_base_id: z.string().min(1, 'Memory base ID is required'),
  page: z.number().optional(),
  size: z.number().optional()
}).strict();

export const ListMemoryBaseMessagesSchema = z.object({
  memory_base_id: z.string().min(1, 'Memory base ID is required'),
  session_id: z.string().optional(),
  page: z.number().optional(),
  size: z.number().optional()
}).strict();

export const UpdateMemoryBaseSchema = z.object({
  memory_base_id: z.string().min(1, 'Memory base ID is required'),
  name: z.string().optional(),
  threshold: z.number().optional(),
  auto_capture: z.boolean().optional()
}).strict();

export const DeleteMemoryBaseSchema = z.object({
  memory_base_id: z.string().min(1, 'Memory base ID is required')
}).strict();

export const FlushMemoryBaseSchema = z.object({
  memory_base_id: z.string().min(1, 'Memory base ID is required'),
  session_id: z.string().min(1, 'Session ID is required')
}).strict();

export const CheckMemoryBaseMismatchSchema = z.object({
  memory_base_id: z.string().min(1, 'Memory base ID is required')
}).strict();

export const RegenerateMemoryBaseSchema = z.object({
  memory_base_id: z.string().min(1, 'Memory base ID is required')
}).strict();

// --- Knowledge base (Langflow 1.10.0) ---
export const TestKnowledgeBaseConnectionSchema = z.object({
  backend_type: z.string().min(1, 'Backend type is required'),
  backend_config: z.record(z.string(), z.unknown()).optional()
}).strict();

export const ListKnowledgeBaseConnectorsSchema = z.object({}).strict();

export const IngestKnowledgeBaseFolderSchema = z.object({
  kb_name: z.string().min(1, 'Knowledge base name is required'),
  path: z.string().min(1, 'Path is required'),
  recursive: z.boolean().optional(),
  extensions: z.array(z.string()).optional(),
  max_file_size_bytes: z.number().optional(),
  source_name: z.string().optional(),
  chunk_size: z.number().optional(),
  chunk_overlap: z.number().optional(),
  separator: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  per_file_metadata: z.record(z.string(), z.record(z.string(), z.unknown())).optional()
}).strict();

export const IngestKnowledgeBaseConnectorSchema = z.object({
  kb_name: z.string().min(1, 'Knowledge base name is required'),
  source_type: z.string().min(1, 'Source type is required'),
  source_config: z.record(z.string(), z.unknown()).optional(),
  source_name: z.string().optional(),
  chunk_size: z.number().optional(),
  chunk_overlap: z.number().optional(),
  separator: z.string().optional()
}).strict();

export const GetKnowledgeBaseMetadataKeysSchema = z.object({
  kb_name: z.string().min(1, 'Knowledge base name is required')
}).strict();

export const ListKnowledgeBaseRunsSchema = z.object({
  kb_name: z.string().min(1, 'Knowledge base name is required'),
  page: z.number().optional(),
  limit: z.number().optional()
}).strict();

export const GetKnowledgeBaseRunSchema = z.object({
  kb_name: z.string().min(1, 'Knowledge base name is required'),
  run_id: z.string().min(1, 'Run ID is required')
}).strict();

// --- Extensions (Langflow 1.10.0) ---
export const ReloadExtensionBundleSchema = z.object({
  extension_id: z.string().min(1, 'Extension ID is required'),
  bundle_name: z.string().min(1, 'Bundle name is required')
}).strict();

export const GetExtensionEventsSchema = z.object({
  since: z.number().optional()
}).strict();

// --- Agentic (Langflow 1.10.0) ---
export const GetAgenticFileSchema = z.object({
  path: z.string().min(1, 'Path is required'),
  download: z.boolean().optional()
}).strict();

export const ResetAgenticSessionSchema = z.object({
  session_id: z.string().optional()
}).strict();

// --- Misc (Langflow 1.10.0) ---
export const GetFlowNoteTranslationsSchema = z.object({
  flow_id: z.string().min(1, 'Flow ID is required')
}).strict();

export const GetJobQueueMetricsSchema = z.object({}).strict();

export type ListAuthzRolesInput = z.infer<typeof ListAuthzRolesSchema>;
export type GetAuthzRoleInput = z.infer<typeof GetAuthzRoleSchema>;
export type CreateAuthzRoleInput = z.infer<typeof CreateAuthzRoleSchema>;
export type UpdateAuthzRoleInput = z.infer<typeof UpdateAuthzRoleSchema>;
export type DeleteAuthzRoleInput = z.infer<typeof DeleteAuthzRoleSchema>;
export type ListAuthzRoleAssignmentsInput = z.infer<typeof ListAuthzRoleAssignmentsSchema>;
export type CreateAuthzRoleAssignmentInput = z.infer<typeof CreateAuthzRoleAssignmentSchema>;
export type DeleteAuthzRoleAssignmentInput = z.infer<typeof DeleteAuthzRoleAssignmentSchema>;
export type ListAuthzTeamsInput = z.infer<typeof ListAuthzTeamsSchema>;
export type GetAuthzTeamInput = z.infer<typeof GetAuthzTeamSchema>;
export type CreateAuthzTeamInput = z.infer<typeof CreateAuthzTeamSchema>;
export type UpdateAuthzTeamInput = z.infer<typeof UpdateAuthzTeamSchema>;
export type DeleteAuthzTeamInput = z.infer<typeof DeleteAuthzTeamSchema>;
export type ListAuthzTeamMembersInput = z.infer<typeof ListAuthzTeamMembersSchema>;
export type AddAuthzTeamMemberInput = z.infer<typeof AddAuthzTeamMemberSchema>;
export type RemoveAuthzTeamMemberInput = z.infer<typeof RemoveAuthzTeamMemberSchema>;
export type ListAuthzSharesInput = z.infer<typeof ListAuthzSharesSchema>;
export type GetAuthzShareInput = z.infer<typeof GetAuthzShareSchema>;
export type CreateAuthzShareInput = z.infer<typeof CreateAuthzShareSchema>;
export type UpdateAuthzShareInput = z.infer<typeof UpdateAuthzShareSchema>;
export type DeleteAuthzShareInput = z.infer<typeof DeleteAuthzShareSchema>;
export type GetAuthzAuditInput = z.infer<typeof GetAuthzAuditSchema>;
export type GetMyPermissionsInput = z.infer<typeof GetMyPermissionsSchema>;
export type CreateMemoryBaseInput = z.infer<typeof CreateMemoryBaseSchema>;
export type ListMemoryBasesInput = z.infer<typeof ListMemoryBasesSchema>;
export type GetMemoryBaseInput = z.infer<typeof GetMemoryBaseSchema>;
export type ListMemoryBaseSessionsInput = z.infer<typeof ListMemoryBaseSessionsSchema>;
export type ListMemoryBaseMessagesInput = z.infer<typeof ListMemoryBaseMessagesSchema>;
export type UpdateMemoryBaseInput = z.infer<typeof UpdateMemoryBaseSchema>;
export type DeleteMemoryBaseInput = z.infer<typeof DeleteMemoryBaseSchema>;
export type FlushMemoryBaseInput = z.infer<typeof FlushMemoryBaseSchema>;
export type CheckMemoryBaseMismatchInput = z.infer<typeof CheckMemoryBaseMismatchSchema>;
export type RegenerateMemoryBaseInput = z.infer<typeof RegenerateMemoryBaseSchema>;
export type TestKnowledgeBaseConnectionInput = z.infer<typeof TestKnowledgeBaseConnectionSchema>;
export type ListKnowledgeBaseConnectorsInput = z.infer<typeof ListKnowledgeBaseConnectorsSchema>;
export type IngestKnowledgeBaseFolderInput = z.infer<typeof IngestKnowledgeBaseFolderSchema>;
export type IngestKnowledgeBaseConnectorInput = z.infer<typeof IngestKnowledgeBaseConnectorSchema>;
export type GetKnowledgeBaseMetadataKeysInput = z.infer<typeof GetKnowledgeBaseMetadataKeysSchema>;
export type ListKnowledgeBaseRunsInput = z.infer<typeof ListKnowledgeBaseRunsSchema>;
export type GetKnowledgeBaseRunInput = z.infer<typeof GetKnowledgeBaseRunSchema>;
export type ReloadExtensionBundleInput = z.infer<typeof ReloadExtensionBundleSchema>;
export type GetExtensionEventsInput = z.infer<typeof GetExtensionEventsSchema>;
export type GetAgenticFileInput = z.infer<typeof GetAgenticFileSchema>;
export type ResetAgenticSessionInput = z.infer<typeof ResetAgenticSessionSchema>;
export type GetFlowNoteTranslationsInput = z.infer<typeof GetFlowNoteTranslationsSchema>;
export type GetJobQueueMetricsInput = z.infer<typeof GetJobQueueMetricsSchema>;
