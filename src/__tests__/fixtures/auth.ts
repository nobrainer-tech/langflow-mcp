import { LoginRequest, LoginResponse } from '../../types';

export const mockLoginRequest: LoginRequest = {
  username: 'testuser',
  password: 'securePassword123!'
};

export const mockLoginResponse: LoginResponse = {
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6MTcwNjc4NDAwMH0',
  refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6MTcwNjg3MDQwMH0',
  token_type: 'bearer'
};

export const mockAutoLoginResponse: LoginResponse = {
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.auto_token',
  refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.auto_refresh',
  token_type: 'bearer'
};

export const mockRefreshTokenResponse: LoginResponse = {
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new_access_token',
  refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new_refresh_token',
  token_type: 'bearer'
};

export const mockLogoutResponse = {
  message: 'Successfully logged out'
};
