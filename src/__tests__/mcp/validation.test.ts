import { describe, it, expect } from 'vitest';
import {
  CreateFlowSchema,
  ListFlowsSchema,
  GetFlowSchema,
  UpdateFlowSchema,
  DeleteFlowSchema,
  DeleteFlowsSchema,
  ListComponentsSchema,
  RunFlowSchema,
  TriggerWebhookSchema,
  UploadFlowSchema,
  DownloadFlowsSchema,
  GetBasicExamplesSchema,
  ListFoldersSchema,
  CreateFolderSchema,
  GetFolderSchema,
  UpdateFolderSchema,
  DeleteFolderSchema,
  ListProjectsSchema,
  CreateProjectSchema,
  GetProjectSchema,
  UpdateProjectSchema,
  DeleteProjectSchema,
  UploadProjectSchema,
  DownloadProjectSchema,
  ListVariablesSchema,
  CreateVariableSchema,
  UpdateVariableSchema,
  DeleteVariableSchema,
  BuildFlowSchema,
  GetBuildStatusSchema,
  CancelBuildSchema,
  ListKnowledgeBasesSchema,
  GetKnowledgeBaseSchema,
  DeleteKnowledgeBaseSchema,
  BulkDeleteKnowledgeBasesSchema
} from '../../mcp/validation';

describe('Validation Schemas', () => {
  describe('CreateFlowSchema', () => {
    it('should validate valid flow creation data', () => {
      const validData = {
        name: 'Test Flow',
        description: 'A test flow',
        data: { nodes: [] },
        folder_id: '123e4567-e89b-12d3-a456-426614174000'
      };

      expect(() => CreateFlowSchema.parse(validData)).not.toThrow();
    });

    it('should validate minimal flow data', () => {
      const minimalData = {
        name: 'Test Flow'
      };

      expect(() => CreateFlowSchema.parse(minimalData)).not.toThrow();
    });

    it('should reject empty name', () => {
      const invalidData = {
        name: ''
      };

      expect(() => CreateFlowSchema.parse(invalidData)).toThrow();
    });

    it('should reject name longer than 255 characters', () => {
      const invalidData = {
        name: 'a'.repeat(256)
      };

      expect(() => CreateFlowSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid folder_id UUID', () => {
      const invalidData = {
        name: 'Test Flow',
        folder_id: 'not-a-uuid'
      };

      expect(() => CreateFlowSchema.parse(invalidData)).toThrow('Invalid folder ID format');
    });

    it('should reject missing name', () => {
      const invalidData = {
        description: 'Test'
      };

      expect(() => CreateFlowSchema.parse(invalidData)).toThrow();
    });
  });

  describe('ListFlowsSchema', () => {
    it('should validate valid pagination params', () => {
      const validData = {
        page: 1,
        size: 10,
        folder_id: '123e4567-e89b-12d3-a456-426614174000'
      };

      expect(() => ListFlowsSchema.parse(validData)).not.toThrow();
    });

    it('should validate empty params', () => {
      expect(() => ListFlowsSchema.parse({})).not.toThrow();
    });

    it('should reject negative page number', () => {
      const invalidData = {
        page: -1
      };

      expect(() => ListFlowsSchema.parse(invalidData)).toThrow();
    });

    it('should reject zero page number', () => {
      const invalidData = {
        page: 0
      };

      expect(() => ListFlowsSchema.parse(invalidData)).toThrow();
    });

    it('should reject size greater than 100', () => {
      const invalidData = {
        size: 101
      };

      expect(() => ListFlowsSchema.parse(invalidData)).toThrow();
    });

    it('should reject non-integer page', () => {
      const invalidData = {
        page: 1.5
      };

      expect(() => ListFlowsSchema.parse(invalidData)).toThrow();
    });
  });

  describe('GetFlowSchema', () => {
    it('should validate valid flow_id', () => {
      const validData = {
        flow_id: '123e4567-e89b-12d3-a456-426614174000'
      };

      expect(() => GetFlowSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid UUID format', () => {
      const invalidData = {
        flow_id: 'not-a-uuid'
      };

      expect(() => GetFlowSchema.parse(invalidData)).toThrow('Invalid flow ID format');
    });

    it('should reject missing flow_id', () => {
      expect(() => GetFlowSchema.parse({})).toThrow();
    });
  });

  describe('UpdateFlowSchema', () => {
    it('should validate full update data', () => {
      const validData = {
        flow_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Updated Flow',
        description: 'Updated description',
        data: { nodes: [] },
        folder_id: '123e4567-e89b-12d3-a456-426614174001'
      };

      expect(() => UpdateFlowSchema.parse(validData)).not.toThrow();
    });

    it('should validate partial update with name only', () => {
      const validData = {
        flow_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Updated Flow'
      };

      expect(() => UpdateFlowSchema.parse(validData)).not.toThrow();
    });

    it('should reject update with no fields', () => {
      const invalidData = {
        flow_id: '123e4567-e89b-12d3-a456-426614174000'
      };

      expect(() => UpdateFlowSchema.parse(invalidData)).toThrow(
        'At least one field must be provided for update'
      );
    });

    it('should reject invalid flow_id', () => {
      const invalidData = {
        flow_id: 'not-a-uuid',
        name: 'Updated Flow'
      };

      expect(() => UpdateFlowSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing flow_id', () => {
      const invalidData = {
        name: 'Updated Flow'
      };

      expect(() => UpdateFlowSchema.parse(invalidData)).toThrow();
    });
  });

  describe('DeleteFlowSchema', () => {
    it('should validate valid flow_id', () => {
      const validData = {
        flow_id: '123e4567-e89b-12d3-a456-426614174000'
      };

      expect(() => DeleteFlowSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid flow_id', () => {
      const invalidData = {
        flow_id: 'not-a-uuid'
      };

      expect(() => DeleteFlowSchema.parse(invalidData)).toThrow();
    });
  });

  describe('DeleteFlowsSchema', () => {
    it('should validate array of flow_ids', () => {
      const validData = {
        flow_ids: [
          '123e4567-e89b-12d3-a456-426614174000',
          '123e4567-e89b-12d3-a456-426614174001'
        ]
      };

      expect(() => DeleteFlowsSchema.parse(validData)).not.toThrow();
    });

    it('should reject empty array', () => {
      const invalidData = {
        flow_ids: []
      };

      expect(() => DeleteFlowsSchema.parse(invalidData)).toThrow(
        'At least one flow ID is required'
      );
    });

    it('should reject array with invalid UUID', () => {
      const invalidData = {
        flow_ids: [
          '123e4567-e89b-12d3-a456-426614174000',
          'not-a-uuid'
        ]
      };

      expect(() => DeleteFlowsSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing flow_ids', () => {
      expect(() => DeleteFlowsSchema.parse({})).toThrow();
    });
  });

  describe('ListComponentsSchema', () => {
    it('should validate empty object', () => {
      expect(() => ListComponentsSchema.parse({})).not.toThrow();
    });
  });

  describe('RunFlowSchema', () => {
    it('should validate valid run flow request', () => {
      const validData = {
        flow_id_or_name: 'test-flow',
        input_request: {
          input_value: 'test input',
          output_type: 'chat',
          input_type: 'text',
          tweaks: { param1: 'value1' }
        },
        stream: false
      };

      expect(() => RunFlowSchema.parse(validData)).not.toThrow();
    });

    it('should validate minimal run flow request', () => {
      const minimalData = {
        flow_id_or_name: 'test-flow',
        input_request: {}
      };

      expect(() => RunFlowSchema.parse(minimalData)).not.toThrow();
    });

    it('should default stream to false', () => {
      const data = {
        flow_id_or_name: 'test-flow',
        input_request: {}
      };

      const parsed = RunFlowSchema.parse(data);
      expect(parsed.stream).toBe(false);
    });

    it('should reject empty flow_id_or_name', () => {
      const invalidData = {
        flow_id_or_name: '',
        input_request: {}
      };

      expect(() => RunFlowSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing flow_id_or_name', () => {
      const invalidData = {
        input_request: {}
      };

      expect(() => RunFlowSchema.parse(invalidData)).toThrow();
    });
  });

  describe('TriggerWebhookSchema', () => {
    it('should validate valid webhook request', () => {
      const validData = {
        flow_id_or_name: 'test-flow',
        input_request: {
          input_value: 'test input',
          tweaks: { param1: 'value1' }
        }
      };

      expect(() => TriggerWebhookSchema.parse(validData)).not.toThrow();
    });

    it('should validate minimal webhook request', () => {
      const minimalData = {
        flow_id_or_name: 'test-flow',
        input_request: {}
      };

      expect(() => TriggerWebhookSchema.parse(minimalData)).not.toThrow();
    });

    it('should reject empty flow_id_or_name', () => {
      const invalidData = {
        flow_id_or_name: '',
        input_request: {}
      };

      expect(() => TriggerWebhookSchema.parse(invalidData)).toThrow();
    });
  });

  describe('UploadFlowSchema', () => {
    it('should validate file object', () => {
      const validData = {
        file: {
          name: 'flow.json',
          content: 'file content'
        }
      };

      expect(() => UploadFlowSchema.parse(validData)).not.toThrow();
    });

    it('should reject missing file', () => {
      expect(() => UploadFlowSchema.parse({})).toThrow();
    });

    it('should reject empty file object', () => {
      const validData = {
        file: {}
      };

      expect(() => UploadFlowSchema.parse(validData)).toThrow();
    });

    it('should reject file without name', () => {
      const invalidData = {
        file: {
          content: 'file content'
        }
      };

      expect(() => UploadFlowSchema.parse(invalidData)).toThrow();
    });

    it('should reject file without content', () => {
      const invalidData = {
        file: {
          name: 'test.json'
        }
      };

      expect(() => UploadFlowSchema.parse(invalidData)).toThrow();
    });

    it('should reject file exceeding size limit', () => {
      const largeContent = 'x'.repeat(15 * 1024 * 1024);
      const invalidData = {
        file: {
          name: 'large.json',
          content: largeContent
        }
      };

      expect(() => UploadFlowSchema.parse(invalidData)).toThrow(/File size exceeds 10MB limit/);
    });
  });

  describe('DownloadFlowsSchema', () => {
    it('should validate array of flow_ids', () => {
      const validData = {
        flow_ids: [
          '123e4567-e89b-12d3-a456-426614174000',
          '123e4567-e89b-12d3-a456-426614174001'
        ]
      };

      expect(() => DownloadFlowsSchema.parse(validData)).not.toThrow();
    });

    it('should validate single flow_id', () => {
      const validData = {
        flow_ids: ['123e4567-e89b-12d3-a456-426614174000']
      };

      expect(() => DownloadFlowsSchema.parse(validData)).not.toThrow();
    });

    it('should reject empty array', () => {
      const invalidData = {
        flow_ids: []
      };

      expect(() => DownloadFlowsSchema.parse(invalidData)).toThrow(
        'At least one flow ID is required'
      );
    });

    it('should reject invalid UUID in array', () => {
      const invalidData = {
        flow_ids: ['not-a-uuid']
      };

      expect(() => DownloadFlowsSchema.parse(invalidData)).toThrow();
    });
  });

  describe('GetBasicExamplesSchema', () => {
    it('should validate empty object', () => {
      expect(() => GetBasicExamplesSchema.parse({})).not.toThrow();
    });
  });

  describe('ListFoldersSchema', () => {
    it('should validate valid pagination params', () => {
      const validData = {
        page: 1,
        size: 50
      };

      expect(() => ListFoldersSchema.parse(validData)).not.toThrow();
    });

    it('should validate empty params', () => {
      expect(() => ListFoldersSchema.parse({})).not.toThrow();
    });

    it('should reject negative page', () => {
      const invalidData = {
        page: -1
      };

      expect(() => ListFoldersSchema.parse(invalidData)).toThrow();
    });

    it('should reject size greater than 100', () => {
      const invalidData = {
        size: 101
      };

      expect(() => ListFoldersSchema.parse(invalidData)).toThrow();
    });

    it('should reject non-integer page', () => {
      const invalidData = {
        page: 1.5
      };

      expect(() => ListFoldersSchema.parse(invalidData)).toThrow();
    });
  });

  describe('CreateFolderSchema', () => {
    it('should validate valid folder creation data', () => {
      const validData = {
        name: 'Test Folder',
        description: 'A test folder',
        parent_id: '123e4567-e89b-12d3-a456-426614174000'
      };

      expect(() => CreateFolderSchema.parse(validData)).not.toThrow();
    });

    it('should validate minimal folder data', () => {
      const minimalData = {
        name: 'Test Folder'
      };

      expect(() => CreateFolderSchema.parse(minimalData)).not.toThrow();
    });

    it('should reject empty name', () => {
      const invalidData = {
        name: ''
      };

      expect(() => CreateFolderSchema.parse(invalidData)).toThrow();
    });

    it('should reject name longer than 255 characters', () => {
      const invalidData = {
        name: 'a'.repeat(256)
      };

      expect(() => CreateFolderSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid parent_id UUID', () => {
      const invalidData = {
        name: 'Test Folder',
        parent_id: 'not-a-uuid'
      };

      expect(() => CreateFolderSchema.parse(invalidData)).toThrow('Invalid parent folder ID format');
    });

    it('should reject missing name', () => {
      const invalidData = {
        description: 'Test'
      };

      expect(() => CreateFolderSchema.parse(invalidData)).toThrow();
    });
  });

  describe('GetFolderSchema', () => {
    it('should validate valid folder_id', () => {
      const validData = {
        folder_id: '123e4567-e89b-12d3-a456-426614174000'
      };

      expect(() => GetFolderSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid UUID format', () => {
      const invalidData = {
        folder_id: 'not-a-uuid'
      };

      expect(() => GetFolderSchema.parse(invalidData)).toThrow('Invalid folder ID format');
    });

    it('should reject missing folder_id', () => {
      expect(() => GetFolderSchema.parse({})).toThrow();
    });
  });

  describe('UpdateFolderSchema', () => {
    it('should validate full update data', () => {
      const validData = {
        folder_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Updated Folder',
        description: 'Updated description',
        parent_id: '123e4567-e89b-12d3-a456-426614174001'
      };

      expect(() => UpdateFolderSchema.parse(validData)).not.toThrow();
    });

    it('should validate partial update with name only', () => {
      const validData = {
        folder_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Updated Folder'
      };

      expect(() => UpdateFolderSchema.parse(validData)).not.toThrow();
    });

    it('should validate partial update with description only', () => {
      const validData = {
        folder_id: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Updated description'
      };

      expect(() => UpdateFolderSchema.parse(validData)).not.toThrow();
    });

    it('should reject update with no fields', () => {
      const invalidData = {
        folder_id: '123e4567-e89b-12d3-a456-426614174000'
      };

      expect(() => UpdateFolderSchema.parse(invalidData)).toThrow(
        'At least one field must be provided for update'
      );
    });

    it('should reject invalid folder_id', () => {
      const invalidData = {
        folder_id: 'not-a-uuid',
        name: 'Updated Folder'
      };

      expect(() => UpdateFolderSchema.parse(invalidData)).toThrow();
    });
  });

  describe('DeleteFolderSchema', () => {
    it('should validate valid folder_id', () => {
      const validData = {
        folder_id: '123e4567-e89b-12d3-a456-426614174000'
      };

      expect(() => DeleteFolderSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid folder_id', () => {
      const invalidData = {
        folder_id: 'not-a-uuid'
      };

      expect(() => DeleteFolderSchema.parse(invalidData)).toThrow();
    });
  });

  describe('ListProjectsSchema', () => {
    it('should validate valid pagination params', () => {
      const validData = {
        page: 1,
        size: 50
      };

      expect(() => ListProjectsSchema.parse(validData)).not.toThrow();
    });

    it('should validate empty params', () => {
      expect(() => ListProjectsSchema.parse({})).not.toThrow();
    });

    it('should reject negative page', () => {
      const invalidData = {
        page: -1
      };

      expect(() => ListProjectsSchema.parse(invalidData)).toThrow();
    });

    it('should reject size greater than 100', () => {
      const invalidData = {
        size: 101
      };

      expect(() => ListProjectsSchema.parse(invalidData)).toThrow();
    });
  });

  describe('CreateProjectSchema', () => {
    it('should validate valid project creation data', () => {
      const validData = {
        name: 'Test Project',
        description: 'A test project'
      };

      expect(() => CreateProjectSchema.parse(validData)).not.toThrow();
    });

    it('should validate minimal project data', () => {
      const minimalData = {
        name: 'Test Project'
      };

      expect(() => CreateProjectSchema.parse(minimalData)).not.toThrow();
    });

    it('should reject empty name', () => {
      const invalidData = {
        name: ''
      };

      expect(() => CreateProjectSchema.parse(invalidData)).toThrow();
    });

    it('should reject name longer than 255 characters', () => {
      const invalidData = {
        name: 'a'.repeat(256)
      };

      expect(() => CreateProjectSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing name', () => {
      const invalidData = {
        description: 'Test'
      };

      expect(() => CreateProjectSchema.parse(invalidData)).toThrow();
    });
  });

  describe('GetProjectSchema', () => {
    it('should validate valid project_id', () => {
      const validData = {
        project_id: '123e4567-e89b-12d3-a456-426614174000'
      };

      expect(() => GetProjectSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid UUID format', () => {
      const invalidData = {
        project_id: 'not-a-uuid'
      };

      expect(() => GetProjectSchema.parse(invalidData)).toThrow('Invalid project ID format');
    });

    it('should reject missing project_id', () => {
      expect(() => GetProjectSchema.parse({})).toThrow();
    });
  });

  describe('UpdateProjectSchema', () => {
    it('should validate full update data', () => {
      const validData = {
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Updated Project',
        description: 'Updated description'
      };

      expect(() => UpdateProjectSchema.parse(validData)).not.toThrow();
    });

    it('should validate partial update with name only', () => {
      const validData = {
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Updated Project'
      };

      expect(() => UpdateProjectSchema.parse(validData)).not.toThrow();
    });

    it('should validate partial update with description only', () => {
      const validData = {
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Updated description'
      };

      expect(() => UpdateProjectSchema.parse(validData)).not.toThrow();
    });

    it('should reject update with no fields', () => {
      const invalidData = {
        project_id: '123e4567-e89b-12d3-a456-426614174000'
      };

      expect(() => UpdateProjectSchema.parse(invalidData)).toThrow(
        'At least one field must be provided for update'
      );
    });

    it('should reject invalid project_id', () => {
      const invalidData = {
        project_id: 'not-a-uuid',
        name: 'Updated Project'
      };

      expect(() => UpdateProjectSchema.parse(invalidData)).toThrow();
    });
  });

  describe('DeleteProjectSchema', () => {
    it('should validate valid project_id', () => {
      const validData = {
        project_id: '123e4567-e89b-12d3-a456-426614174000'
      };

      expect(() => DeleteProjectSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid project_id', () => {
      const invalidData = {
        project_id: 'not-a-uuid'
      };

      expect(() => DeleteProjectSchema.parse(invalidData)).toThrow();
    });
  });

  describe('UploadProjectSchema', () => {
    it('should validate file object', () => {
      const validData = {
        file: {
          name: 'project.json',
          content: 'file content'
        }
      };

      expect(() => UploadProjectSchema.parse(validData)).not.toThrow();
    });

    it('should reject missing file', () => {
      expect(() => UploadProjectSchema.parse({})).toThrow();
    });

    it('should reject empty file object', () => {
      const validData = {
        file: {}
      };

      expect(() => UploadProjectSchema.parse(validData)).toThrow();
    });

    it('should reject file without name', () => {
      const invalidData = {
        file: {
          content: 'file content'
        }
      };

      expect(() => UploadProjectSchema.parse(invalidData)).toThrow();
    });

    it('should reject file without content', () => {
      const invalidData = {
        file: {
          name: 'test.json'
        }
      };

      expect(() => UploadProjectSchema.parse(invalidData)).toThrow();
    });

    it('should reject file exceeding size limit', () => {
      const largeContent = 'x'.repeat(15 * 1024 * 1024);
      const invalidData = {
        file: {
          name: 'large.json',
          content: largeContent
        }
      };

      expect(() => UploadProjectSchema.parse(invalidData)).toThrow(/File size exceeds 10MB limit/);
    });
  });

  describe('DownloadProjectSchema', () => {
    it('should validate valid project_id', () => {
      const validData = {
        project_id: '123e4567-e89b-12d3-a456-426614174000'
      };

      expect(() => DownloadProjectSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid UUID format', () => {
      const invalidData = {
        project_id: 'not-a-uuid'
      };

      expect(() => DownloadProjectSchema.parse(invalidData)).toThrow('Invalid project ID format');
    });

    it('should reject missing project_id', () => {
      expect(() => DownloadProjectSchema.parse({})).toThrow();
    });
  });

  describe('ListVariablesSchema', () => {
    it('should validate empty object', () => {
      expect(() => ListVariablesSchema.parse({})).not.toThrow();
    });
  });

  describe('CreateVariableSchema', () => {
    it('should validate valid variable creation data', () => {
      const validData = {
        name: 'TEST_VAR',
        value: 'test_value',
        type: 'string',
        default_fields: ['field1', 'field2']
      };

      expect(() => CreateVariableSchema.parse(validData)).not.toThrow();
    });

    it('should validate minimal variable data', () => {
      const minimalData = {
        name: 'TEST_VAR',
        value: 'test_value'
      };

      expect(() => CreateVariableSchema.parse(minimalData)).not.toThrow();
    });

    it('should reject empty name', () => {
      const invalidData = {
        name: '',
        value: 'test_value'
      };

      expect(() => CreateVariableSchema.parse(invalidData)).toThrow();
    });

    it('should reject empty value', () => {
      const invalidData = {
        name: 'TEST_VAR',
        value: ''
      };

      expect(() => CreateVariableSchema.parse(invalidData)).toThrow();
    });

    it('should reject name longer than 255 characters', () => {
      const invalidData = {
        name: 'a'.repeat(256),
        value: 'test_value'
      };

      expect(() => CreateVariableSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing name', () => {
      const invalidData = {
        value: 'test_value'
      };

      expect(() => CreateVariableSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing value', () => {
      const invalidData = {
        name: 'TEST_VAR'
      };

      expect(() => CreateVariableSchema.parse(invalidData)).toThrow();
    });
  });

  describe('UpdateVariableSchema', () => {
    it('should validate full update data', () => {
      const validData = {
        variable_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'UPDATED_VAR',
        value: 'updated_value',
        type: 'string'
      };

      expect(() => UpdateVariableSchema.parse(validData)).not.toThrow();
    });

    it('should validate partial update with name only', () => {
      const validData = {
        variable_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'UPDATED_VAR'
      };

      expect(() => UpdateVariableSchema.parse(validData)).not.toThrow();
    });

    it('should validate partial update with value only', () => {
      const validData = {
        variable_id: '123e4567-e89b-12d3-a456-426614174000',
        value: 'updated_value'
      };

      expect(() => UpdateVariableSchema.parse(validData)).not.toThrow();
    });

    it('should validate partial update with type only', () => {
      const validData = {
        variable_id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'number'
      };

      expect(() => UpdateVariableSchema.parse(validData)).not.toThrow();
    });

    it('should reject update with no fields', () => {
      const invalidData = {
        variable_id: '123e4567-e89b-12d3-a456-426614174000'
      };

      expect(() => UpdateVariableSchema.parse(invalidData)).toThrow(
        'At least one field must be provided for update'
      );
    });

    it('should reject invalid variable_id', () => {
      const invalidData = {
        variable_id: 'not-a-uuid',
        name: 'UPDATED_VAR'
      };

      expect(() => UpdateVariableSchema.parse(invalidData)).toThrow();
    });
  });

  describe('DeleteVariableSchema', () => {
    it('should validate valid variable_id', () => {
      const validData = {
        variable_id: '123e4567-e89b-12d3-a456-426614174000'
      };

      expect(() => DeleteVariableSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid variable_id', () => {
      const invalidData = {
        variable_id: 'not-a-uuid'
      };

      expect(() => DeleteVariableSchema.parse(invalidData)).toThrow('Invalid variable ID format');
    });

    it('should reject missing variable_id', () => {
      expect(() => DeleteVariableSchema.parse({})).toThrow();
    });
  });

  describe('BuildFlowSchema', () => {
    it('should validate valid flow_id with UUID', () => {
      const validData = {
        flow_id: '123e4567-e89b-12d3-a456-426614174000'
      };

      expect(() => BuildFlowSchema.parse(validData)).not.toThrow();
    });

    it('should validate with optional inputs', () => {
      const validData = {
        flow_id: '123e4567-e89b-12d3-a456-426614174000',
        inputs: { param1: 'value1', param2: 123 }
      };

      expect(() => BuildFlowSchema.parse(validData)).not.toThrow();
    });

    it('should validate with optional data', () => {
      const validData = {
        flow_id: '123e4567-e89b-12d3-a456-426614174000',
        data: { nodes: [], edges: [] }
      };

      expect(() => BuildFlowSchema.parse(validData)).not.toThrow();
    });

    it('should validate with optional files array', () => {
      const validData = {
        flow_id: '123e4567-e89b-12d3-a456-426614174000',
        files: ['file1.txt', 'file2.json']
      };

      expect(() => BuildFlowSchema.parse(validData)).not.toThrow();
    });

    it('should validate with all optional parameters', () => {
      const validData = {
        flow_id: '123e4567-e89b-12d3-a456-426614174000',
        inputs: { param1: 'value' },
        data: { nodes: [] },
        files: ['test.txt'],
        stop_component_id: 'comp-1',
        start_component_id: 'comp-2',
        log_builds: false,
        flow_name: 'Test Flow',
        event_delivery: 'streaming'
      };

      expect(() => BuildFlowSchema.parse(validData)).not.toThrow();
    });

    it('should validate event_delivery as polling', () => {
      const validData = {
        flow_id: '123e4567-e89b-12d3-a456-426614174000',
        event_delivery: 'polling'
      };

      expect(() => BuildFlowSchema.parse(validData)).not.toThrow();
    });

    it('should validate event_delivery as streaming', () => {
      const validData = {
        flow_id: '123e4567-e89b-12d3-a456-426614174000',
        event_delivery: 'streaming'
      };

      expect(() => BuildFlowSchema.parse(validData)).not.toThrow();
    });

    it('should validate event_delivery as direct', () => {
      const validData = {
        flow_id: '123e4567-e89b-12d3-a456-426614174000',
        event_delivery: 'direct'
      };

      expect(() => BuildFlowSchema.parse(validData)).not.toThrow();
    });

    it('should default event_delivery to polling', () => {
      const validData = {
        flow_id: '123e4567-e89b-12d3-a456-426614174000'
      };

      const parsed = BuildFlowSchema.parse(validData);
      expect(parsed.event_delivery).toBe('polling');
    });

    it('should default log_builds to true', () => {
      const validData = {
        flow_id: '123e4567-e89b-12d3-a456-426614174000'
      };

      const parsed = BuildFlowSchema.parse(validData);
      expect(parsed.log_builds).toBe(true);
    });

    it('should reject invalid flow_id', () => {
      const invalidData = {
        flow_id: 'not-a-uuid'
      };

      expect(() => BuildFlowSchema.parse(invalidData)).toThrow('Invalid flow ID format');
    });

    it('should reject invalid event_delivery', () => {
      const invalidData = {
        flow_id: '123e4567-e89b-12d3-a456-426614174000',
        event_delivery: 'invalid-mode'
      };

      expect(() => BuildFlowSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing flow_id', () => {
      const invalidData = {
        inputs: { test: 'value' }
      };

      expect(() => BuildFlowSchema.parse(invalidData)).toThrow();
    });
  });

  describe('GetBuildStatusSchema', () => {
    it('should validate valid job_id', () => {
      const validData = {
        job_id: 'job-123'
      };

      expect(() => GetBuildStatusSchema.parse(validData)).not.toThrow();
    });

    it('should validate with event_delivery', () => {
      const validData = {
        job_id: 'job-123',
        event_delivery: 'streaming'
      };

      expect(() => GetBuildStatusSchema.parse(validData)).not.toThrow();
    });

    it('should default event_delivery to polling', () => {
      const validData = {
        job_id: 'job-123'
      };

      const parsed = GetBuildStatusSchema.parse(validData);
      expect(parsed.event_delivery).toBe('polling');
    });

    it('should validate event_delivery as polling', () => {
      const validData = {
        job_id: 'job-123',
        event_delivery: 'polling'
      };

      expect(() => GetBuildStatusSchema.parse(validData)).not.toThrow();
    });

    it('should validate event_delivery as direct', () => {
      const validData = {
        job_id: 'job-123',
        event_delivery: 'direct'
      };

      expect(() => GetBuildStatusSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid event_delivery', () => {
      const invalidData = {
        job_id: 'job-123',
        event_delivery: 'websocket'
      };

      expect(() => GetBuildStatusSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing job_id', () => {
      const invalidData = {
        event_delivery: 'polling'
      };

      expect(() => GetBuildStatusSchema.parse(invalidData)).toThrow();
    });

    it('should reject empty job_id', () => {
      const invalidData = {
        job_id: ''
      };

      expect(() => GetBuildStatusSchema.parse(invalidData)).toThrow();
    });
  });

  describe('CancelBuildSchema', () => {
    it('should validate valid job_id', () => {
      const validData = {
        job_id: 'job-123'
      };

      expect(() => CancelBuildSchema.parse(validData)).not.toThrow();
    });

    it('should validate alphanumeric job_id', () => {
      const validData = {
        job_id: 'job-abc-123-xyz'
      };

      expect(() => CancelBuildSchema.parse(validData)).not.toThrow();
    });

    it('should reject missing job_id', () => {
      expect(() => CancelBuildSchema.parse({})).toThrow();
    });

    it('should reject empty job_id', () => {
      const invalidData = {
        job_id: ''
      };

      expect(() => CancelBuildSchema.parse(invalidData)).toThrow('Job ID is required');
    });
  });

  describe('ListKnowledgeBasesSchema', () => {
    it('should validate empty object', () => {
      expect(() => ListKnowledgeBasesSchema.parse({})).not.toThrow();
    });

    it('should reject extra properties', () => {
      const data = {
        extra_param: 'should be rejected'
      };

      expect(() => ListKnowledgeBasesSchema.parse(data)).toThrow();
    });
  });

  describe('GetKnowledgeBaseSchema', () => {
    it('should validate valid kb_name', () => {
      const validData = {
        kb_name: 'test-kb'
      };

      expect(() => GetKnowledgeBaseSchema.parse(validData)).not.toThrow();
    });

    it('should validate kb_name with special characters', () => {
      const validData = {
        kb_name: 'test_kb-123'
      };

      expect(() => GetKnowledgeBaseSchema.parse(validData)).not.toThrow();
    });

    it('should reject missing kb_name', () => {
      expect(() => GetKnowledgeBaseSchema.parse({})).toThrow();
    });

    it('should reject empty kb_name', () => {
      const invalidData = {
        kb_name: ''
      };

      expect(() => GetKnowledgeBaseSchema.parse(invalidData)).toThrow('Knowledge base name is required');
    });
  });

  describe('DeleteKnowledgeBaseSchema', () => {
    it('should validate valid kb_name', () => {
      const validData = {
        kb_name: 'test-kb'
      };

      expect(() => DeleteKnowledgeBaseSchema.parse(validData)).not.toThrow();
    });

    it('should validate kb_name with alphanumeric and underscores', () => {
      const validData = {
        kb_name: 'production_kb_v1'
      };

      expect(() => DeleteKnowledgeBaseSchema.parse(validData)).not.toThrow();
    });

    it('should reject missing kb_name', () => {
      expect(() => DeleteKnowledgeBaseSchema.parse({})).toThrow();
    });

    it('should reject empty kb_name', () => {
      const invalidData = {
        kb_name: ''
      };

      expect(() => DeleteKnowledgeBaseSchema.parse(invalidData)).toThrow('Knowledge base name is required');
    });
  });

  describe('BulkDeleteKnowledgeBasesSchema', () => {
    it('should validate array with single kb_name', () => {
      const validData = {
        kb_names: ['test-kb']
      };

      expect(() => BulkDeleteKnowledgeBasesSchema.parse(validData)).not.toThrow();
    });

    it('should validate array with multiple kb_names', () => {
      const validData = {
        kb_names: ['test-kb-1', 'test-kb-2', 'test-kb-3']
      };

      expect(() => BulkDeleteKnowledgeBasesSchema.parse(validData)).not.toThrow();
    });

    it('should reject empty array', () => {
      const invalidData = {
        kb_names: []
      };

      expect(() => BulkDeleteKnowledgeBasesSchema.parse(invalidData)).toThrow(
        'At least one knowledge base name is required'
      );
    });

    it('should reject array with empty string', () => {
      const invalidData = {
        kb_names: ['test-kb', '']
      };

      expect(() => BulkDeleteKnowledgeBasesSchema.parse(invalidData)).toThrow(
        'Knowledge base name cannot be empty'
      );
    });

    it('should reject missing kb_names', () => {
      expect(() => BulkDeleteKnowledgeBasesSchema.parse({})).toThrow();
    });

    it('should reject non-array kb_names', () => {
      const invalidData = {
        kb_names: 'not-an-array'
      };

      expect(() => BulkDeleteKnowledgeBasesSchema.parse(invalidData)).toThrow();
    });
  });
});
