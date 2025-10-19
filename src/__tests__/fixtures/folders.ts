import { FolderRead, FolderCreate, FolderUpdate } from '../../types';

export const mockFolderCreate: FolderCreate = {
  name: 'Test Folder',
  description: 'A test folder for unit testing',
  parent_id: '123e4567-e89b-12d3-a456-426614174000'
};

export const mockFolderRead: FolderRead = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  name: 'Test Folder',
  description: 'A test folder for unit testing',
  parent_id: '123e4567-e89b-12d3-a456-426614174000',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

export const mockFolderUpdate: FolderUpdate = {
  name: 'Updated Folder',
  description: 'Updated description'
};

export const mockFoldersList: FolderRead[] = [
  mockFolderRead,
  {
    ...mockFolderRead,
    id: '123e4567-e89b-12d3-a456-426614174002',
    name: 'Test Folder 2',
    parent_id: undefined
  }
];
