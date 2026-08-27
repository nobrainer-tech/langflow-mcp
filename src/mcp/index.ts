#!/usr/bin/env node

import { LangflowMCPServer } from './server';
import { LangflowMCPServerConsolidated } from './server-consolidated';
import { LangflowMCPHttpServer } from './http';
import { logger } from '../utils/logger';
import * as dotenv from 'dotenv';

const HTTP_FORCE_EXIT_TIMEOUT_MS = 15_000;

// dotenv's startup notice is written to stdout by default, which would corrupt
// the JSON-RPC stream used by stdio MCP hosts.
dotenv.config({ quiet: true });

process.on('uncaughtException', (error) => {
  if (process.env.MCP_MODE !== 'stdio') {
    console.error('Uncaught Exception:', error);
  }
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  if (process.env.MCP_MODE !== 'stdio') {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  }
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

async function main() {
  try {
    const mode = process.env.MCP_MODE || 'stdio';
    const useConsolidated = process.env.LANGFLOW_CONSOLIDATED_TOOLS === 'true';

    if (!['stdio', 'http'].includes(mode)) {
      throw new Error(`Unsupported MCP_MODE: ${mode}. Use "stdio" or "http".`);
    }

    if (mode === 'http') {
      const httpServer = new LangflowMCPHttpServer({
        createMcpServer: () => useConsolidated
          ? new LangflowMCPServerConsolidated()
          : new LangflowMCPServer()
      });

      let isShuttingDown = false;
      const shutdown = async (signal: string = 'UNKNOWN') => {
        if (isShuttingDown) return;
        isShuttingDown = true;

        const forceExitTimer = setTimeout(() => {
          logger.warn('HTTP shutdown did not finish within the force-exit window');
          process.exit(0);
        }, HTTP_FORCE_EXIT_TIMEOUT_MS);

        try {
          logger.info(`Shutdown initiated by: ${signal}`);
          await httpServer.shutdown();
        } catch (error) {
          logger.error('Error during HTTP shutdown:', error);
          process.exitCode = 1;
        } finally {
          clearTimeout(forceExitTimer);
        }
      };

      process.on('SIGTERM', () => void shutdown('SIGTERM'));
      process.on('SIGINT', () => void shutdown('SIGINT'));
      process.on('SIGHUP', () => void shutdown('SIGHUP'));

      await httpServer.start();
      return;
    }

    // Use consolidated tools or granular tools.
    const server = useConsolidated
      ? new LangflowMCPServerConsolidated()
      : new LangflowMCPServer();

    if (useConsolidated) {
      logger.info('Using consolidated tools mode');
    }

    let isShuttingDown = false;
    const shutdown = async (signal: string = 'UNKNOWN') => {
      if (isShuttingDown) return;
      isShuttingDown = true;

      try {
        logger.info(`Shutdown initiated by: ${signal}`);
        await server.shutdown();

        if (process.stdin && !process.stdin.destroyed) {
          process.stdin.pause();
          process.stdin.destroy();
        }

        setTimeout(() => {
          logger.warn('Shutdown timeout exceeded, forcing exit');
          process.exit(0);
        }, 1000).unref();
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGHUP', () => shutdown('SIGHUP'));

    if (process.stdin.readable && !process.stdin.destroyed) {
      try {
        process.stdin.on('end', () => shutdown('STDIN_END'));
        process.stdin.on('close', () => shutdown('STDIN_CLOSE'));
      } catch (error) {
        logger.error('Failed to register stdin handlers:', error);
      }
    }

    await server.run();
  } catch (error) {
    logger.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
