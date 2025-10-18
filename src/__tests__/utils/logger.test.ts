import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../../utils/logger';

describe('logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;
  const originalLogLevel = process.env.LOG_LEVEL;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleDebugSpy.mockRestore();
    process.env.LOG_LEVEL = originalLogLevel;
  });

  describe('info', () => {
    it('should log info messages by default', () => {
      delete process.env.LOG_LEVEL;

      logger.info('test message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] test message')
      );
    });

    it('should log info with additional arguments', () => {
      delete process.env.LOG_LEVEL;

      logger.info('test message', { foo: 'bar' }, 123);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] test message')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"foo":"bar"')
      );
    });

    it('should not log info when LOG_LEVEL is error', () => {
      process.env.LOG_LEVEL = 'error';

      logger.info('test message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should not log info when LOG_LEVEL is silent', () => {
      process.env.LOG_LEVEL = 'silent';

      logger.info('test message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log info when LOG_LEVEL is debug', () => {
      process.env.LOG_LEVEL = 'debug';

      logger.info('test message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] test message')
      );
    });

    it('should include timestamp in log', () => {
      delete process.env.LOG_LEVEL;

      logger.info('test message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)
      );
    });
  });

  describe('error', () => {
    it('should respect log level for error messages', () => {
      process.env.LOG_LEVEL = 'silent';

      logger.error('error message');

      expect(consoleErrorSpy).not.toHaveBeenCalled();

      process.env.LOG_LEVEL = 'error';
      logger.error('error message');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] error message')
      );
    });

    it('should log error with stack trace', () => {
      process.env.LOG_LEVEL = 'error';
      const error = new Error('test error');

      logger.error('error occurred', error);

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log warn messages by default', () => {
      delete process.env.LOG_LEVEL;

      logger.warn('warning message');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] warning message')
      );
    });

    it('should not log warn when LOG_LEVEL is error', () => {
      process.env.LOG_LEVEL = 'error';

      logger.warn('warning message');

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should log warn when LOG_LEVEL is warn', () => {
      process.env.LOG_LEVEL = 'warn';

      logger.warn('warning message');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] warning message')
      );
    });
  });

  describe('debug', () => {
    it('should not log debug by default', () => {
      delete process.env.LOG_LEVEL;

      logger.debug('debug message');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    it('should log debug when LOG_LEVEL is debug', () => {
      process.env.LOG_LEVEL = 'debug';

      logger.debug('debug message');

      expect(consoleDebugSpy).toHaveBeenCalled();
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] debug message')
      );
    });

    it('should not log debug when LOG_LEVEL is info', () => {
      process.env.LOG_LEVEL = 'info';

      logger.debug('debug message');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });
  });

  describe('log level hierarchy', () => {
    it('should respect log level hierarchy', () => {
      const levels = ['debug', 'info', 'warn', 'error', 'silent'];

      levels.forEach((level) => {
        consoleLogSpy.mockClear();
        consoleErrorSpy.mockClear();
        consoleWarnSpy.mockClear();
        consoleDebugSpy.mockClear();
        process.env.LOG_LEVEL = level;

        logger.debug('debug');
        logger.info('info');
        logger.warn('warn');
        logger.error('error');

        if (level === 'silent') {
          expect(consoleLogSpy).not.toHaveBeenCalled();
          expect(consoleWarnSpy).not.toHaveBeenCalled();
          expect(consoleErrorSpy).not.toHaveBeenCalled();
          expect(consoleDebugSpy).not.toHaveBeenCalled();
        } else if (level === 'debug') {
          expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
          expect(consoleLogSpy).toHaveBeenCalledTimes(1);
          expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
          expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        } else if (level === 'info') {
          expect(consoleDebugSpy).not.toHaveBeenCalled();
          expect(consoleLogSpy).toHaveBeenCalledTimes(1);
          expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
          expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        } else if (level === 'warn') {
          expect(consoleDebugSpy).not.toHaveBeenCalled();
          expect(consoleLogSpy).not.toHaveBeenCalled();
          expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
          expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        } else if (level === 'error') {
          expect(consoleDebugSpy).not.toHaveBeenCalled();
          expect(consoleLogSpy).not.toHaveBeenCalled();
          expect(consoleWarnSpy).not.toHaveBeenCalled();
          expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        }
      });
    });
  });
});
