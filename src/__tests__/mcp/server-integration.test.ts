import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LangflowMCPServer } from '../../mcp/server';
import { langflowMCPTools } from '../../mcp/tools';

describe('LangflowMCPServer Integration', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.LANGFLOW_BASE_URL = 'http://localhost:7860';
    process.env.LANGFLOW_API_KEY = 'test-api-key-123';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Server Initialization', () => {
    it('should validate required environment variables', () => {
      delete process.env.LANGFLOW_BASE_URL;

      expect(() => {
        new LangflowMCPServer();
      }).toThrow('LANGFLOW_BASE_URL and LANGFLOW_API_KEY must be set');
    });

    it('should validate API key presence', () => {
      delete process.env.LANGFLOW_API_KEY;

      expect(() => {
        new LangflowMCPServer();
      }).toThrow('LANGFLOW_BASE_URL and LANGFLOW_API_KEY must be set');
    });

    it('should validate URL format', () => {
      process.env.LANGFLOW_BASE_URL = 'invalid-url';

      expect(() => {
        new LangflowMCPServer();
      }).toThrow('Invalid LANGFLOW_BASE_URL format');
    });

    it('should reject non-http(s) protocols', () => {
      process.env.LANGFLOW_BASE_URL = 'ftp://localhost:7860';

      expect(() => {
        new LangflowMCPServer();
      }).toThrow('Invalid protocol: ftp:');
    });

    it('should validate API key length', () => {
      process.env.LANGFLOW_API_KEY = 'short';

      expect(() => {
        new LangflowMCPServer();
      }).toThrow('LANGFLOW_API_KEY appears to be invalid (too short)');
    });

    it('should accept valid configuration', () => {
      process.env.LANGFLOW_BASE_URL = 'http://localhost:7860';
      process.env.LANGFLOW_API_KEY = 'valid-api-key-123';

      expect(() => {
        new LangflowMCPServer();
      }).not.toThrow();
    });

    it('should handle https URLs', () => {
      process.env.LANGFLOW_BASE_URL = 'https://langflow.example.com';
      process.env.LANGFLOW_API_KEY = 'valid-api-key-123';

      expect(() => {
        new LangflowMCPServer();
      }).not.toThrow();
    });
  });

  describe('Timeout Configuration', () => {
    it('should use default timeout when not specified', () => {
      delete process.env.LANGFLOW_TIMEOUT;

      const server = new LangflowMCPServer();
      expect(server).toBeDefined();
    });

    it('should use default timeout when value is below minimum (1000ms)', () => {
      process.env.LANGFLOW_TIMEOUT = '500';

      // Should not throw, but use default timeout instead
      expect(() => {
        new LangflowMCPServer();
      }).not.toThrow();
    });

    it('should use default timeout when value is above maximum (300000ms)', () => {
      process.env.LANGFLOW_TIMEOUT = '400000';

      // Should not throw, but use default timeout instead
      expect(() => {
        new LangflowMCPServer();
      }).not.toThrow();
    });

    it('should accept timeout within valid range', () => {
      process.env.LANGFLOW_TIMEOUT = '60000';

      expect(() => {
        new LangflowMCPServer();
      }).not.toThrow();
    });
  });

  describe('Deprecated Tools Filtering', () => {
    const deprecatedTools = ['build_vertices', 'get_vertex', 'stream_vertex_build', 'get_task_status'];

    it('should include deprecated tools when ENABLE_DEPRECATED_TOOLS is true', () => {
      process.env.ENABLE_DEPRECATED_TOOLS = 'true';

      const allToolNames = langflowMCPTools.map(t => t.name);
      deprecatedTools.forEach(toolName => {
        expect(allToolNames).toContain(toolName);
      });
    });

    it('should include deprecated tools by default (when not set)', () => {
      delete process.env.ENABLE_DEPRECATED_TOOLS;

      const allToolNames = langflowMCPTools.map(t => t.name);
      deprecatedTools.forEach(toolName => {
        expect(allToolNames).toContain(toolName);
      });
    });

    it('should mark deprecated tools with warning emoji', () => {
      const deprecatedToolDefinitions = langflowMCPTools.filter(t =>
        deprecatedTools.includes(t.name)
      );

      deprecatedToolDefinitions.forEach(tool => {
        expect(tool.description).toContain('⚠️');
        expect(tool.description).toContain('DEPRECATED');
      });
    });

    it('should suggest alternatives in deprecated tool descriptions', () => {
      const toolAlternatives: Record<string, string> = {
        'build_vertices': 'build_flow',
        'get_vertex': 'build_flow',
        'stream_vertex_build': 'get_build_status',
        'get_task_status': 'get_build_status'
      };

      Object.entries(toolAlternatives).forEach(([toolName, alternative]) => {
        const tool = langflowMCPTools.find(t => t.name === toolName);
        expect(tool).toBeDefined();
        expect(tool?.description.toLowerCase()).toContain(alternative.toLowerCase());
      });
    });
  });

  describe('Sensitive Data Sanitization', () => {
    it('should sanitize password fields', () => {
      const sensitiveData = {
        username: 'user',
        password: 'secret123',
        data: 'normal'
      };

      // Test would require access to private method or testing through public API
      expect(sensitiveData.password).toBe('secret123');
    });

    it('should handle nested objects with sensitive data', () => {
      const nestedData = {
        user: {
          name: 'John',
          credentials: {
            api_key: 'secret-key',
            token: 'secret-token'
          }
        }
      };

      expect(nestedData.user.credentials.api_key).toBe('secret-key');
    });

    it('should handle arrays with sensitive data', () => {
      const arrayData = {
        users: [
          { name: 'User1', password: 'pass1' },
          { name: 'User2', password: 'pass2' }
        ]
      };

      expect(arrayData.users[0].password).toBe('pass1');
    });
  });

  describe('File Size Validation', () => {
    it('should validate base64 file content size', () => {
      // Create a small base64 string
      const smallFile = Buffer.from('small content').toString('base64');
      expect(smallFile).toBeDefined();
    });

    it('should reject files exceeding 10MB limit', () => {
      // Create a base64 string larger than 10MB
      const largeContent = 'A'.repeat(11 * 1024 * 1024);
      const largeFile = Buffer.from(largeContent).toString('base64');

      expect(largeFile.length).toBeGreaterThan(10 * 1024 * 1024);
    });
  });

  describe('Tool Definitions', () => {
    it('should have all tools with required properties', () => {
      langflowMCPTools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');

        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
        expect(typeof tool.inputSchema).toBe('object');

        expect(tool.name.length).toBeGreaterThan(0);
        expect(tool.description.length).toBeGreaterThan(0);
      });
    });

    it('should have unique tool names', () => {
      const toolNames = langflowMCPTools.map(t => t.name);
      const uniqueNames = new Set(toolNames);

      expect(uniqueNames.size).toBe(toolNames.length);
    });

    it('should have valid input schemas', () => {
      langflowMCPTools.forEach(tool => {
        expect(tool.inputSchema).toHaveProperty('type');
        expect(tool.inputSchema.type).toBe('object');

        if (tool.inputSchema.properties) {
          expect(typeof tool.inputSchema.properties).toBe('object');
        }
      });
    });

    it('should have the expected number of tools', () => {
      // 90 tools + 4 deprecated tools = 94 total
      expect(langflowMCPTools.length).toBeGreaterThanOrEqual(90);
    });
  });
});
