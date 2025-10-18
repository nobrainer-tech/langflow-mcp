import { z } from 'zod';

export const CreateFlowSchema = z.object({
  name: z.string().min(1, 'Flow name is required').max(255, 'Flow name too long'),
  description: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  folder_id: z.string().uuid('Invalid folder ID format').optional()
});

export const ListFlowsSchema = z.object({
  page: z.number().int().positive().optional(),
  size: z.number().int().positive().max(100, 'Page size cannot exceed 100').optional(),
  folder_id: z.string().uuid('Invalid folder ID format').optional()
});

export const GetFlowSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format')
});

export const UpdateFlowSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format'),
  name: z.string().min(1, 'Flow name is required').max(255, 'Flow name too long').optional(),
  description: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  folder_id: z.string().uuid('Invalid folder ID format').optional()
}).refine(
  data => data.name !== undefined || data.description !== undefined || data.data !== undefined || data.folder_id !== undefined,
  { message: 'At least one field must be provided for update' }
);

export const DeleteFlowSchema = z.object({
  flow_id: z.string().uuid('Invalid flow ID format')
});

export const DeleteFlowsSchema = z.object({
  flow_ids: z.array(z.string().uuid('Invalid flow ID format')).min(1, 'At least one flow ID is required')
});

export const ListComponentsSchema = z.object({});

export const RunFlowSchema = z.object({
  flow_id_or_name: z.string().min(1, 'Flow ID or name is required'),
  input_request: z.object({
    input_value: z.string().optional(),
    output_type: z.string().optional(),
    input_type: z.string().optional(),
    tweaks: z.record(z.string(), z.unknown()).optional()
  }),
  stream: z.boolean().optional().default(false)
});

export const TriggerWebhookSchema = z.object({
  flow_id_or_name: z.string().min(1, 'Flow ID or name is required'),
  input_request: z.object({
    input_value: z.string().optional(),
    tweaks: z.record(z.string(), z.unknown()).optional()
  })
});

const FileSchema = z.object({
  name: z.string().min(1, 'Filename required'),
  content: z.string().min(1, 'File content required'),
  type: z.string().optional(),
}).refine(
  data => {
    const estimatedSize = data.content.length * 0.75;
    return estimatedSize < 10 * 1024 * 1024;
  },
  { message: 'File size exceeds 10MB limit' }
);

export const UploadFlowSchema = z.object({
  file: FileSchema
});

export const DownloadFlowsSchema = z.object({
  flow_ids: z.array(z.string().uuid('Invalid flow ID format')).min(1, 'At least one flow ID is required')
});

export const GetBasicExamplesSchema = z.object({});

export const ListFoldersSchema = z.object({
  page: z.number().int().positive().optional(),
  size: z.number().int().positive().max(100, 'Page size cannot exceed 100').optional()
});

export const CreateFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(255, 'Folder name too long'),
  description: z.string().optional(),
  parent_id: z.string().uuid('Invalid parent folder ID format').optional()
});

export const GetFolderSchema = z.object({
  folder_id: z.string().uuid('Invalid folder ID format')
});

export const UpdateFolderSchema = z.object({
  folder_id: z.string().uuid('Invalid folder ID format'),
  name: z.string().min(1, 'Folder name is required').max(255, 'Folder name too long').optional(),
  description: z.string().optional(),
  parent_id: z.string().uuid('Invalid parent folder ID format').optional()
}).refine(
  data => data.name !== undefined || data.description !== undefined || data.parent_id !== undefined,
  { message: 'At least one field must be provided for update' }
);

export const DeleteFolderSchema = z.object({
  folder_id: z.string().uuid('Invalid folder ID format')
});

export const ListProjectsSchema = z.object({
  page: z.number().int().positive().optional(),
  size: z.number().int().positive().max(100, 'Page size cannot exceed 100').optional()
});

export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255, 'Project name too long'),
  description: z.string().optional()
});

export const GetProjectSchema = z.object({
  project_id: z.string().uuid('Invalid project ID format')
});

export const UpdateProjectSchema = z.object({
  project_id: z.string().uuid('Invalid project ID format'),
  name: z.string().min(1, 'Project name is required').max(255, 'Project name too long').optional(),
  description: z.string().optional()
}).refine(
  data => data.name !== undefined || data.description !== undefined,
  { message: 'At least one field must be provided for update' }
);

export const DeleteProjectSchema = z.object({
  project_id: z.string().uuid('Invalid project ID format')
});

export const UploadProjectSchema = z.object({
  file: FileSchema
});

export const DownloadProjectSchema = z.object({
  project_id: z.string().uuid('Invalid project ID format')
});

export const ListVariablesSchema = z.object({});

export const CreateVariableSchema = z.object({
  name: z.string().min(1, 'Variable name is required').max(255, 'Variable name too long'),
  value: z.string().min(1, 'Variable value is required'),
  type: z.string().optional(),
  default_fields: z.array(z.string()).optional()
});

export const UpdateVariableSchema = z.object({
  variable_id: z.string().uuid('Invalid variable ID format'),
  name: z.string().min(1, 'Variable name is required').max(255, 'Variable name too long').optional(),
  value: z.string().optional(),
  type: z.string().optional()
}).refine(
  data => data.name !== undefined || data.value !== undefined || data.type !== undefined,
  { message: 'At least one field must be provided for update' }
);

export const DeleteVariableSchema = z.object({
  variable_id: z.string().uuid('Invalid variable ID format')
});

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
});

export const GetBuildStatusSchema = z.object({
  job_id: z.string().min(1, 'Job ID is required'),
  event_delivery: z.enum(['polling', 'streaming', 'direct']).optional().default('polling')
});

export const CancelBuildSchema = z.object({
  job_id: z.string().min(1, 'Job ID is required')
});

export const ListKnowledgeBasesSchema = z.object({});

export const GetKnowledgeBaseSchema = z.object({
  kb_name: z.string().min(1, 'Knowledge base name is required')
});

export const DeleteKnowledgeBaseSchema = z.object({
  kb_name: z.string().min(1, 'Knowledge base name is required')
});

export const BulkDeleteKnowledgeBasesSchema = z.object({
  kb_names: z.array(z.string().min(1, 'Knowledge base name cannot be empty')).min(1, 'At least one knowledge base name is required')
});

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
