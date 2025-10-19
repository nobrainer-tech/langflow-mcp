import { VariableRead, VariableCreate, VariableUpdate } from '../../types';

export const mockVariableCreate: VariableCreate = {
  name: 'TEST_VAR',
  value: 'test_value',
  type: 'string',
  default_fields: ['field1', 'field2']
};

export const mockVariableRead: VariableRead = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  name: 'TEST_VAR',
  value: 'test_value',
  type: 'string',
  default_fields: ['field1', 'field2'],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

export const mockVariableUpdate: VariableUpdate = {
  name: 'UPDATED_VAR',
  value: 'updated_value',
  type: 'string'
};

export const mockVariablesList: VariableRead[] = [
  mockVariableRead,
  {
    ...mockVariableRead,
    id: '123e4567-e89b-12d3-a456-426614174002',
    name: 'TEST_VAR_2',
    value: 'test_value_2'
  }
];
