import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../../utils/logger';

describe('logger', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  const originalLogLevel = process.env.LOG_LEVEL;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    process.env.LOG_LEVEL = originalLogLevel;
  });

  describe('info', () => {
    it('should log info messages by default', () => {
      delete process.env.LOG_LEVEL;

      logger.info('test message');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] test message')
      );
    });

    it('should log info with additional arguments', () => {
      delete process.env.LOG_LEVEL;

      logger.info('test message', { foo: 'bar' }, 123);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] test message')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"foo":"bar"')
      );
    });

    it('should not log info when LOG_LEVEL is error', () => {
      process.env.LOG_LEVEL = 'error';

      logger.info('test message');

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should not log info when LOG_LEVEL is silent', () => {
      process.env.LOG_LEVEL = 'silent';

      logger.info('test message');

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should log info when LOG_LEVEL is debug', () => {
      process.env.LOG_LEVEL = 'debug';

      logger.info('test message');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] test message')
      );
    });

    it('should include timestamp in log', () => {
      delete process.env.LOG_LEVEL;

      logger.info('test message');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)
      );
    });
  });

  describe('error', () => {
    it('should always log error messages', () => {
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

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] warning message')
      );
    });

    it('should not log warn when LOG_LEVEL is error', () => {
      process.env.LOG_LEVEL = 'error';

      logger.warn('warning message');

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should log warn when LOG_LEVEL is warn', () => {
      process.env.LOG_LEVEL = 'warn';

      logger.warn('warning message');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] warning message')
      );
    });
  });

  describe('debug', () => {
    it('should not log debug by default', () => {
      delete process.env.LOG_LEVEL;

      logger.debug('debug message');

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should log debug when LOG_LEVEL is debug', () => {
      process.env.LOG_LEVEL = 'debug';

      logger.debug('debug message');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] debug message')
      );
    });

    it('should not log debug when LOG_LEVEL is info', () => {
      process.env.LOG_LEVEL = 'info';

      logger.debug('debug message');

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('log level hierarchy', () => {
    it('should respect log level hierarchy', () => {
      const levels = ['debug', 'info', 'warn', 'error', 'silent'];

      levels.forEach((level, index) => {
        consoleErrorSpy.mockClear();
        process.env.LOG_LEVEL = level;

        logger.debug('debug');
        logger.info('info');
        logger.warn('warn');
        logger.error('error');

        const expectedCalls = 4 - index;
        if (level === 'silent') {
          expect(consoleErrorSpy).not.toHaveBeenCalled();
        } else {
          expect(consoleErrorSpy).toHaveBeenCalledTimes(expectedCalls);
        }
      });
    });
  });
});
