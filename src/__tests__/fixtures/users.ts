import {
  UserRead,
  UserCreate,
  UserUpdate,
  ListUsersParams
} from '../../types';

export const mockUserRead: UserRead = {
  id: 'user-123',
  username: 'testuser',
  email: 'test@example.com',
  is_active: true,
  is_superuser: false,
  profile_image: 'avatar.png',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

export const mockUserCreate: UserCreate = {
  username: 'newuser',
  password: 'securePassword123!',
  email: 'newuser@example.com',
  profile_image: 'default-avatar.png'
};

export const mockUserUpdate: UserUpdate = {
  username: 'updateduser',
  profile_image: 'new-avatar.png'
};

export const mockUsersList: UserRead[] = [
  mockUserRead,
  {
    id: 'user-124',
    username: 'admin',
    email: 'admin@example.com',
    is_active: true,
    is_superuser: true,
    profile_image: 'admin-avatar.png',
    created_at: '2023-12-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 'user-125',
    username: 'viewer',
    email: 'viewer@example.com',
    is_active: true,
    is_superuser: false,
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z'
  }
];

export const mockListUsersParams: ListUsersParams = {
  skip: 0,
  limit: 10
};

export const mockCurrentUser: UserRead = mockUserRead;

export const mockPasswordResetResponse: UserRead = {
  ...mockUserRead,
  updated_at: '2024-01-20T00:00:00Z'
};
