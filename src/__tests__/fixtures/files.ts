import { FileListItem } from '../../types';

export const mockFileListItem: FileListItem = {
  name: 'test-file.txt',
  path: '/uploads/flow-123/test-file.txt',
  size: 1024,
  modified: '2024-01-01T00:00:00Z'
};

export const mockFilesList: FileListItem[] = [
  mockFileListItem,
  {
    name: 'data.json',
    path: '/uploads/flow-123/data.json',
    size: 2048,
    modified: '2024-01-01T00:05:00Z'
  },
  {
    name: 'image.png',
    path: '/uploads/flow-123/image.png',
    size: 15360,
    modified: '2024-01-01T00:10:00Z'
  }
];

export const mockFileUploadResponse = {
  file_path: '/uploads/flow-123/test-file.txt',
  file_name: 'test-file.txt',
  flow_id: 'flow-123',
  size: 1024,
  success: true
};

export const mockFileBuffer = Buffer.from('Test file content', 'utf-8');

export const mockImageBuffer = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
]);

export const mockProfilePicturesList: string[] = [
  'avatar1.png',
  'avatar2.jpg',
  'company-logo.svg'
];
