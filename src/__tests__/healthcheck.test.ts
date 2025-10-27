import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

describe('healthcheck.js', () => {
  const healthcheckPath = path.resolve(__dirname, '../../healthcheck.js');
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('STDIO mode', () => {
    it('should exit with code 0 when MCP_MODE is stdio', async () => {
      const { stdout, stderr } = await execAsync(`node ${healthcheckPath}`, {
        env: { ...process.env, MCP_MODE: 'stdio' }
      });

      expect(stdout).toBe('');
      expect(stderr).toBe('');
    });

    it('should exit with code 0 when MCP_MODE is not set (defaults to stdio)', async () => {
      const env = { ...process.env };
      delete env.MCP_MODE;

      const { stdout, stderr } = await execAsync(`node ${healthcheckPath}`, { env });

      expect(stdout).toBe('');
      expect(stderr).toBe('');
    });

    it('should exit with code 0 for any non-http mode', async () => {
      const { stdout, stderr } = await execAsync(`node ${healthcheckPath}`, {
        env: { ...process.env, MCP_MODE: 'websocket' }
      });

      expect(stdout).toBe('');
      expect(stderr).toBe('');
    });
  });

  describe('HTTP mode', () => {
    it('should exit with code 1 when health endpoint is not available', async () => {
      try {
        await execAsync(`node ${healthcheckPath}`, {
          env: {
            ...process.env,
            MCP_MODE: 'http',
            PORT: '9999' // Port that's not listening
          },
          timeout: 10000
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.code).toBe(1);
      }
    });

    it('should use default port 3000 when PORT is not set', async () => {
      const env = { ...process.env, MCP_MODE: 'http' };
      delete env.PORT;

      try {
        await execAsync(`node ${healthcheckPath}`, {
          env,
          timeout: 10000
        });
        expect(true).toBe(false);
      } catch (error: any) {
        // Should exit with code 1 since no server is running
        expect(error.code).toBe(1);
      }
    });

    it('should handle custom PORT environment variable', async () => {
      try {
        await execAsync(`node ${healthcheckPath}`, {
          env: {
            ...process.env,
            MCP_MODE: 'http',
            PORT: '8888'
          },
          timeout: 10000
        });
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.code).toBe(1);
      }
    });
  });

  describe('Script validation', () => {
    it('should be executable and not throw syntax errors', async () => {
      const { stderr } = await execAsync(`node --check ${healthcheckPath}`);
      expect(stderr).toBe('');
    });

    it('should have proper shebang and be a valid Node.js script', async () => {
      const { readFile } = await import('fs/promises');
      const content = await readFile(healthcheckPath, 'utf-8');

      expect(content).toContain('#!/usr/bin/env node');
      expect(content).toContain("require('http')");
      expect(content).toContain('process.env.MCP_MODE');
      expect(content).toContain('process.exit');
    });
  });

  describe('Error handling', () => {
    it('should timeout after configured timeout period', async () => {
      const startTime = Date.now();

      try {
        await execAsync(`node ${healthcheckPath}`, {
          env: {
            ...process.env,
            MCP_MODE: 'http',
            PORT: '9999'
          },
          timeout: 10000
        });
        expect(true).toBe(false);
      } catch (error: any) {
        const duration = Date.now() - startTime;
        // Should fail within reasonable time (health check has 5s timeout)
        expect(duration).toBeLessThan(10000);
        expect(error.code).toBe(1);
      }
    });
  });
});
