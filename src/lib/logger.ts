type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogContext = Record<string, unknown>;

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const minLevel = (process.env.LOG_LEVEL as LogLevel) ??
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function log(level: LogLevel, message: string, context?: LogContext) {
  if (LEVELS[level] < LEVELS[minLevel]) return;

  const isServer = typeof window === 'undefined';
  const isDev = process.env.NODE_ENV !== 'production';

  if (isServer && !isDev) {
    process.stdout.write(
      JSON.stringify({ level, message, timestamp: new Date().toISOString(), ...context }) + '\n'
    );
    return;
  }

  const fn = { debug: console.debug, info: console.info, warn: console.warn, error: console.error }[level];
  fn(`[${level.toUpperCase()}]`, message, ...(context ? [context] : []));
}

export const logger = {
  debug: (msg: string, ctx?: LogContext) => log('debug', msg, ctx),
  info:  (msg: string, ctx?: LogContext) => log('info',  msg, ctx),
  warn:  (msg: string, ctx?: LogContext) => log('warn',  msg, ctx),
  error: (msg: string, ctx?: LogContext) => log('error', msg, ctx),
};
