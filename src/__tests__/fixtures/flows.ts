import { FlowRead, FlowCreate, FlowUpdate } from '../../types';

export const mockFlowCreate: FlowCreate = {
  name: 'Test Flow',
  description: 'A test flow for unit testing',
  data: { nodes: [], edges: [] },
  folder_id: '123e4567-e89b-12d3-a456-426614174000'
};

export const mockFlowRead: FlowRead = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  name: 'Test Flow',
  description: 'A test flow for unit testing',
  data: { nodes: [], edges: [] },
  folder_id: '123e4567-e89b-12d3-a456-426614174000',
  user_id: 'user-123',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

export const mockFlowUpdate: FlowUpdate = {
  name: 'Updated Flow',
  description: 'Updated description'
};

export const mockFlowsList: FlowRead[] = [
  mockFlowRead,
  {
    ...mockFlowRead,
    id: '123e4567-e89b-12d3-a456-426614174002',
    name: 'Test Flow 2'
  }
];
