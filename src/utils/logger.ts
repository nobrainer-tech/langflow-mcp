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

function initLogLevel(): LogLevel {
  const level = process.env.LOG_LEVEL?.toLowerCase() || 'info';
  return LOG_LEVEL_MAP[level] ?? LogLevel.INFO;
}

let currentLogLevel: LogLevel = initLogLevel();


function formatMessage(level: string, message: string, args: unknown[]): string {
  const timestamp = new Date().toISOString();
  if (!args || args.length === 0) {
    return `[${timestamp}] [${level}] ${message}`;
  }

  const seen = new WeakSet<object>();

  const serialize = (arg: unknown): string => {
    if (arg instanceof Error) return arg.stack || `${arg.name}: ${arg.message}`;
    if (typeof arg === 'bigint') return arg.toString();
    if (typeof arg === 'object' && arg !== null) {
      try {
        return JSON.stringify(arg, (key, value) => {
          if (typeof value === 'bigint') return value.toString();
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value as object)) return '[Circular]';
            seen.add(value as object);
          }
          return value;
        });
      } catch {
        try { return String(arg); } catch { return '[Unserializable]'; }
      }
    }
    return String(arg);
  };

  const formattedArgs = ' ' + args.map(serialize).join(' ');
  return `[${timestamp}] [${level}] ${message}${formattedArgs}`;
}

function shouldLog(level: LogLevel): boolean {
  return level >= currentLogLevel;
}

export function setLogLevel(level: string): void {
  currentLogLevel = LOG_LEVEL_MAP[level.toLowerCase()] ?? LogLevel.INFO;
}

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (shouldLog(LogLevel.INFO)) {
      console.log(formatMessage('INFO', message, args));
    }
  },
  error: (message: string, ...args: unknown[]) => {
    if (shouldLog(LogLevel.ERROR)) {
      console.error(formatMessage('ERROR', message, args));
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (shouldLog(LogLevel.WARN)) {
      console.warn(formatMessage('WARN', message, args));
    }
  },
  debug: (message: string, ...args: unknown[]) => {
    if (shouldLog(LogLevel.DEBUG)) {
      console.debug ? console.debug(formatMessage('DEBUG', message, args))
                    : console.log(formatMessage('DEBUG', message, args));
    }
  }
};
