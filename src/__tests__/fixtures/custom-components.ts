import { CustomComponentRead, CustomComponentCreate } from '../../types';

export const mockCustomComponentCreate: CustomComponentCreate = {
  code: `
from langflow import CustomComponent

class MyComponent(CustomComponent):
    display_name = "My Custom Component"
    description = "A custom component for testing"

    def build(self):
        return "Hello from custom component"
  `,
  name: 'MyCustomComponent',
  description: 'A custom component for testing',
  return_type: 'Message'
};

export const mockCustomComponentRead: CustomComponentRead = {
  id: 'custom-comp-123',
  name: 'MyCustomComponent',
  code: mockCustomComponentCreate.code,
  description: 'A custom component for testing',
  return_type: 'Message',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

export const mockCustomComponentsList: CustomComponentRead[] = [
  mockCustomComponentRead,
  {
    id: 'custom-comp-124',
    name: 'DataProcessor',
    code: 'class DataProcessor(CustomComponent):\n    pass',
    description: 'Processes data streams',
    return_type: 'Data',
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 'custom-comp-125',
    name: 'APIConnector',
    code: 'class APIConnector(CustomComponent):\n    pass',
    description: 'Connects to external APIs',
    return_type: 'Text',
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z'
  }
];
