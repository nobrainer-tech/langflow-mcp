import { ApiKeyRead, ApiKeyCreate } from '../../types';

export const mockApiKeyRead: ApiKeyRead = {
  id: 'apikey-123',
  name: 'Production API Key',
  created_at: '2024-01-01T00:00:00Z',
  last_used_at: '2024-01-15T12:30:00Z',
  total_uses: 1500,
  is_active: true
};

export const mockApiKeyCreate: ApiKeyCreate = {
  name: 'New API Key'
};

export const mockApiKeyWithToken: ApiKeyRead & { api_key: string } = {
  ...mockApiKeyRead,
  api_key: 'sk-test-1234567890abcdefghijklmnopqrstuvwxyz'
};

export const mockApiKeysList: ApiKeyRead[] = [
  mockApiKeyRead,
  {
    id: 'apikey-124',
    name: 'Development API Key',
    created_at: '2024-01-05T00:00:00Z',
    last_used_at: '2024-01-18T09:15:00Z',
    total_uses: 850,
    is_active: true
  },
  {
    id: 'apikey-125',
    name: 'Testing API Key',
    created_at: '2024-01-10T00:00:00Z',
    last_used_at: '2024-01-12T14:20:00Z',
    total_uses: 120,
    is_active: false
  }
];
