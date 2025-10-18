import { describe, it, expect } from 'vitest';
import {
  CreateFlowSchema,
  ListFlowsSchema,
  GetFlowSchema,
  UpdateFlowSchema,
  DeleteFlowSchema,
  DeleteFlowsSchema,
  ListComponentsSchema
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
});
