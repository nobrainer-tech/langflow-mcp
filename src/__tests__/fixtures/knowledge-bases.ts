import { KnowledgeBaseInfo } from '../../types';

export const mockKnowledgeBaseInfo: KnowledgeBaseInfo = {
  name: 'test-kb',
  description: 'Test Knowledge Base',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  documents_count: 10,
  size_bytes: 1024000
};

export const mockKnowledgeBasesList: KnowledgeBaseInfo[] = [
  mockKnowledgeBaseInfo,
  {
    name: 'production-kb',
    description: 'Production Knowledge Base',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    documents_count: 50,
    size_bytes: 5120000
  },
  {
    name: 'dev-kb',
    description: 'Development Knowledge Base',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    documents_count: 5,
    size_bytes: 512000
  }
];

export const mockEmptyKnowledgeBasesList: KnowledgeBaseInfo[] = [];

export const mockBulkDeleteResponse = {
  deleted: 2,
  failed: 0,
  errors: []
};

export const mockPartialBulkDeleteResponse = {
  deleted: 1,
  failed: 1,
  errors: [
    {
      kb_name: 'non-existent-kb',
      error: 'Knowledge base not found'
    }
  ]
};

export const mockDeleteResponse = {
  success: true,
  message: 'Knowledge base deleted successfully'
};
