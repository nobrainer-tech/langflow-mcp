enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
  silent: LogLevel.SILENT
};

function getCurrentLogLevel(): LogLevel {
  const level = process.env.LOG_LEVEL?.toLowerCase() || 'info';
  return LOG_LEVEL_MAP[level] ?? LogLevel.INFO;
}

function formatMessage(level: string, message: string, args: any[]): string {
  const timestamp = new Date().toISOString();
  const formattedArgs = args.length > 0 ? ' ' + args.map(arg =>
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ') : '';

  return `[${timestamp}] [${level}] ${message}${formattedArgs}`;
}

function shouldLog(level: LogLevel): boolean {
  return level >= getCurrentLogLevel();
}

export const logger = {
  info: (message: string, ...args: any[]) => {
    if (shouldLog(LogLevel.INFO)) {
      console.error(formatMessage('INFO', message, args));
    }
  },
  error: (message: string, ...args: any[]) => {
    if (shouldLog(LogLevel.ERROR)) {
      console.error(formatMessage('ERROR', message, args));
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (shouldLog(LogLevel.WARN)) {
      console.error(formatMessage('WARN', message, args));
    }
  },
  debug: (message: string, ...args: any[]) => {
    if (shouldLog(LogLevel.DEBUG)) {
      console.error(formatMessage('DEBUG', message, args));
    }
  }
};
