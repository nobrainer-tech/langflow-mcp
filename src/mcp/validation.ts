import { z } from 'zod';

export const CreateFlowSchema = z.object({
  name: z.string().min(1, 'Flow name is required').max(255, 'Flow name too long'),
  description: z.string().optional(),
  data: z.record(z.unknown()).optional(),
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
  data: z.record(z.unknown()).optional(),
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

export type CreateFlowInput = z.infer<typeof CreateFlowSchema>;
export type ListFlowsInput = z.infer<typeof ListFlowsSchema>;
export type GetFlowInput = z.infer<typeof GetFlowSchema>;
export type UpdateFlowInput = z.infer<typeof UpdateFlowSchema>;
export type DeleteFlowInput = z.infer<typeof DeleteFlowSchema>;
export type DeleteFlowsInput = z.infer<typeof DeleteFlowsSchema>;
export type ListComponentsInput = z.infer<typeof ListComponentsSchema>;
