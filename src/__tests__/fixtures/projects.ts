import { ProjectRead, ProjectCreate, ProjectUpdate } from '../../types';

export const mockProjectCreate: ProjectCreate = {
  name: 'Test Project',
  description: 'A test project for unit testing'
};

export const mockProjectRead: ProjectRead = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  name: 'Test Project',
  description: 'A test project for unit testing',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

export const mockProjectUpdate: ProjectUpdate = {
  name: 'Updated Project',
  description: 'Updated description'
};

export const mockProjectsList: ProjectRead[] = [
  mockProjectRead,
  {
    ...mockProjectRead,
    id: '123e4567-e89b-12d3-a456-426614174002',
    name: 'Test Project 2'
  }
];
