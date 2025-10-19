import {
  StoreComponent,
  ListStoreComponentsParams,
  StoreTag,
  UserLike
} from '../../types';

export const mockStoreComponent: StoreComponent = {
  id: 'store-comp-123',
  name: 'Chat Model Component',
  description: 'A pre-built chat model component',
  tags: ['chat', 'llm', 'openai'],
  author: 'Langflow Team',
  downloads: 1500,
  likes: 245,
  version: '1.0.0',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z'
};

export const mockStoreComponentsList: StoreComponent[] = [
  mockStoreComponent,
  {
    id: 'store-comp-124',
    name: 'Vector Store Component',
    description: 'Component for vector storage and retrieval',
    tags: ['vector', 'embeddings', 'rag'],
    author: 'Community',
    downloads: 890,
    likes: 156,
    version: '2.1.0',
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-20T00:00:00Z'
  },
  {
    id: 'store-comp-125',
    name: 'Data Processor',
    description: 'Process and transform data',
    tags: ['data', 'processing', 'utility'],
    author: 'Langflow Team',
    downloads: 2100,
    likes: 378,
    version: '1.5.0',
    created_at: '2023-12-01T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z'
  }
];

export const mockListStoreComponentsParams: ListStoreComponentsParams = {
  page: 1,
  limit: 10,
  tags: ['chat', 'llm'],
  search: 'chat model'
};

export const mockStoreTag: StoreTag = {
  name: 'chat',
  count: 45
};

export const mockStoreTagsList: StoreTag[] = [
  mockStoreTag,
  {
    name: 'llm',
    count: 38
  },
  {
    name: 'vector',
    count: 22
  },
  {
    name: 'rag',
    count: 19
  },
  {
    name: 'data',
    count: 31
  }
];

export const mockUserLike: UserLike = {
  component_id: 'store-comp-123',
  liked_at: '2024-01-15T12:30:00Z'
};

export const mockUserLikesList: UserLike[] = [
  mockUserLike,
  {
    component_id: 'store-comp-124',
    liked_at: '2024-01-10T09:15:00Z'
  },
  {
    component_id: 'store-comp-125',
    liked_at: '2024-01-05T14:45:00Z'
  }
];

export const mockCheckStoreResponse = {
  available: true,
  status: 'online',
  version: '1.0.0'
};

export const mockCheckStoreApiKeyResponse = {
  valid: true,
  permissions: ['read', 'download']
};
