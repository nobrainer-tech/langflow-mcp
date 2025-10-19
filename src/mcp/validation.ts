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
    output_type: z.string().optional(),
    input_type: z.string().optional(),
    tweaks: z.record(z.string(), z.unknown()).optional()
  }),
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
  name: z.string().min(1, 'Filename required'),
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
  event_delivery: z.enum(['polling', 'streaming', 'direct']).optional().default('polling')
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
  flow_id: z.string().uuid('Invalid flow ID format'),
  input_value: z.string().optional(),
  input_type: z.string().optional(),
  output_type: z.string().optional(),
  output_component: z.string().optional(),
  tweaks: z.record(z.string(), z.unknown()).optional(),
  session_id: z.string().optional(),
  stream: z.boolean().optional().default(false)
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

export const GetVertexSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format'),
  vertex_id: z.string().min(1, 'Vertex ID is required')
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

export const GetUserSchema = z.object({
  user_id: z.string().uuid('Invalid user ID format')
}).strict();

export const UpdateUserSchema = z.object({
  user_id: z.string().uuid('Invalid user ID format'),
  username: z.string().min(1, 'Username is required').max(255, 'Username too long').optional(),
  password: z.string().min(1, 'Password cannot be empty').optional(),
  profile_image: z.string().optional()
}).strict().refine(
  data => data.username !== undefined || data.password !== undefined || data.profile_image !== undefined,
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

export const ListCustomComponentsSchema = z.object({}).strict();

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
export type GetVertexInput = z.infer<typeof GetVertexSchema>;
export type StreamVertexBuildInput = z.infer<typeof StreamVertexBuildSchema>;
export type GetVersionInput = z.infer<typeof GetVersionSchema>;
export type ListUsersInput = z.infer<typeof ListUsersSchema>;
export type GetCurrentUserInput = z.infer<typeof GetCurrentUserSchema>;
export type GetUserInput = z.infer<typeof GetUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type ResetUserPasswordInput = z.infer<typeof ResetUserPasswordSchema>;
export type ListApiKeysInput = z.infer<typeof ListApiKeysSchema>;
export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;
export type DeleteApiKeyInput = z.infer<typeof DeleteApiKeySchema>;
export type ListCustomComponentsInput = z.infer<typeof ListCustomComponentsSchema>;
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
