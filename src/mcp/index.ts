#!/usr/bin/env node

import { LangflowMCPServer } from './server';
import { logger } from '../utils/logger';
import * as dotenv from 'dotenv';

dotenv.config();

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

    if (mode === 'http') {
      logger.error('HTTP mode not yet implemented. Use stdio mode.');
      process.exit(1);
    }

    const server = new LangflowMCPServer();

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
