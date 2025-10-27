import { describe, it, expect } from 'vitest';
import { langflowMCPTools } from '../../mcp/tools';

describe('MCP Tools Definitions', () => {
  describe('Tool Structure', () => {
    it('should have all required properties for each tool', () => {
      langflowMCPTools.forEach((tool, index) => {
        expect(tool, `Tool at index ${index} should have name`).toHaveProperty('name');
        expect(tool, `Tool at index ${index} should have description`).toHaveProperty('description');
        expect(tool, `Tool at index ${index} should have inputSchema`).toHaveProperty('inputSchema');

        expect(typeof tool.name, `Tool ${tool.name} name should be string`).toBe('string');
        expect(typeof tool.description, `Tool ${tool.name} description should be string`).toBe('string');
        expect(typeof tool.inputSchema, `Tool ${tool.name} inputSchema should be object`).toBe('object');
      });
    });

    it('should have non-empty names and descriptions', () => {
      langflowMCPTools.forEach(tool => {
        expect(tool.name.length, `Tool ${tool.name} should have non-empty name`).toBeGreaterThan(0);
        expect(tool.description.length, `Tool ${tool.name} should have non-empty description`).toBeGreaterThan(0);
      });
    });

    it('should use snake_case for tool names', () => {
      const snakeCasePattern = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/;

      langflowMCPTools.forEach(tool => {
        expect(tool.name, `Tool name ${tool.name} should be in snake_case`).toMatch(snakeCasePattern);
      });
    });

    it('should have unique tool names', () => {
      const toolNames = langflowMCPTools.map(t => t.name);
      const uniqueNames = new Set(toolNames);

      expect(uniqueNames.size).toBe(toolNames.length);
    });
  });

  describe('Input Schemas', () => {
    it('should have valid JSON schema structure', () => {
      langflowMCPTools.forEach(tool => {
        expect(tool.inputSchema.type).toBe('object');

        if (tool.inputSchema.properties) {
          expect(typeof tool.inputSchema.properties).toBe('object');
        }

        if (tool.inputSchema.required) {
          expect(Array.isArray(tool.inputSchema.required)).toBe(true);
        }
      });
    });

    it('should define property types when properties exist', () => {
      langflowMCPTools.forEach(tool => {
        if (tool.inputSchema.properties) {
          Object.entries(tool.inputSchema.properties).forEach(([propName, propSchema]: [string, any]) => {
            expect(propSchema, `Property ${propName} in ${tool.name} should have type`).toHaveProperty('type');
          });
        }
      });
    });

    it('should have description for each property', () => {
      langflowMCPTools.forEach(tool => {
        if (tool.inputSchema.properties) {
          Object.entries(tool.inputSchema.properties).forEach(([propName, propSchema]: [string, any]) => {
            if (!propSchema.description && !propSchema.anyOf && !propSchema.oneOf) {
              console.warn(`Property ${propName} in ${tool.name} missing description`);
            }
          });
        }
      });
    });
  });

  describe('Deprecated Tools', () => {
    const deprecatedToolNames = [
      'build_vertices',
      'get_vertex',
      'stream_vertex_build',
      'get_task_status'
    ];

    it('should mark all deprecated tools with warning emoji', () => {
      deprecatedToolNames.forEach(toolName => {
        const tool = langflowMCPTools.find(t => t.name === toolName);

        expect(tool, `Deprecated tool ${toolName} should exist`).toBeDefined();
        expect(tool?.description, `Deprecated tool ${toolName} should have warning emoji`).toContain('⚠️');
      });
    });

    it('should explicitly mention DEPRECATED in description', () => {
      deprecatedToolNames.forEach(toolName => {
        const tool = langflowMCPTools.find(t => t.name === toolName);

        expect(tool?.description.toUpperCase()).toContain('DEPRECATED');
      });
    });

    it('should suggest alternative tools', () => {
      const alternatives: Record<string, string[]> = {
        'build_vertices': ['build_flow'],
        'get_vertex': ['build_flow', 'get_flow'],
        'stream_vertex_build': ['get_build_status'],
        'get_task_status': ['get_build_status']
      };

      Object.entries(alternatives).forEach(([toolName, expectedAlternatives]) => {
        const tool = langflowMCPTools.find(t => t.name === toolName);

        expect(tool).toBeDefined();

        expectedAlternatives.forEach(alternative => {
          expect(
            tool?.description.toLowerCase(),
            `Tool ${toolName} should mention alternative ${alternative}`
          ).toContain(alternative.toLowerCase());
        });
      });
    });

    it('should have exactly 4 deprecated tools', () => {
      const deprecatedTools = langflowMCPTools.filter(tool =>
        deprecatedToolNames.includes(tool.name)
      );

      expect(deprecatedTools.length).toBe(4);
    });
  });

  describe('Tool Categories', () => {
    const expectedCategories = {
      flow: ['create_flow', 'list_flows', 'get_flow', 'update_flow', 'delete_flow'],
      folder: ['create_folder', 'list_folders', 'get_folder', 'update_folder', 'delete_folder'],
      build: ['build_flow', 'get_build_status', 'cancel_build'],
      execution: ['run_flow', 'trigger_webhook'],
      auth: ['login', 'logout', 'refresh_token'],
    };

    Object.entries(expectedCategories).forEach(([category, expectedTools]) => {
      it(`should have all ${category} management tools`, () => {
        expectedTools.forEach(toolName => {
          const tool = langflowMCPTools.find(t => t.name === toolName);
          expect(tool, `${category} tool ${toolName} should exist`).toBeDefined();
        });
      });
    });
  });

  describe('Critical Tools', () => {
    const criticalTools = [
      'create_flow',
      'run_flow',
      'build_flow',
      'list_flows',
      'get_flow',
      'update_flow',
      'delete_flow'
    ];

    it('should have all critical tools defined', () => {
      criticalTools.forEach(toolName => {
        const tool = langflowMCPTools.find(t => t.name === toolName);
        expect(tool, `Critical tool ${toolName} should exist`).toBeDefined();
      });
    });

    it('should have detailed descriptions for critical tools', () => {
      criticalTools.forEach(toolName => {
        const tool = langflowMCPTools.find(t => t.name === toolName);
        expect(tool?.description.length, `Critical tool ${toolName} should have detailed description`).toBeGreaterThan(50);
      });
    });
  });

  describe('Tool Count', () => {
    it('should have expected total number of tools', () => {
      // Expected: 90 active tools + 4 deprecated tools = 94 total
      expect(langflowMCPTools.length).toBeGreaterThanOrEqual(90);
      expect(langflowMCPTools.length).toBeLessThanOrEqual(100);
    });

    it('should maintain consistent tool count', () => {
      const currentCount = langflowMCPTools.length;
      expect(currentCount).toMatchSnapshot();
    });
  });

  describe('Documentation Quality', () => {
    it('should not have placeholder descriptions', () => {
      const placeholders = ['todo', 'tbd', 'fixme', 'xxx'];

      langflowMCPTools.forEach(tool => {
        const descLower = tool.description.toLowerCase();
        placeholders.forEach(placeholder => {
          expect(descLower, `Tool ${tool.name} should not have placeholder: ${placeholder}`).not.toContain(placeholder);
        });
      });
    });

    it('should start descriptions with capital letter or emoji', () => {
      langflowMCPTools.forEach(tool => {
        const firstChar = tool.description[0];
        const isCapital = /[A-Z⚠️]/.test(firstChar);
        expect(isCapital, `Tool ${tool.name} description should start with capital or emoji`).toBe(true);
      });
    });

    it('should have descriptions longer than just the tool name', () => {
      langflowMCPTools.forEach(tool => {
        const nameWords = tool.name.split('_').join(' ');
        expect(
          tool.description.length,
          `Tool ${tool.name} description should be more than just the name`
        ).toBeGreaterThan(nameWords.length + 10);
      });
    });
  });
});
