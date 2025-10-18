export const logger = {
  info: (message: string, ...args: any[]) => {
    if (process.env.LOG_LEVEL !== 'error') {
      console.error('[INFO]', message, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    console.error('[ERROR]', message, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    if (process.env.LOG_LEVEL !== 'error') {
      console.error('[WARN]', message, ...args);
    }
  },
  debug: (message: string, ...args: any[]) => {
    if (process.env.LOG_LEVEL === 'debug') {
      console.error('[DEBUG]', message, ...args);
    }
  }
};
