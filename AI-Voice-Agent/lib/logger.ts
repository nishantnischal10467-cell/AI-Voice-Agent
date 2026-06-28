type LogContext = Record<string, unknown>;

export const logger = {
  info(message: string, context?: LogContext) {
    console.info(JSON.stringify({ level: "info", message, ...context }));
  },
  error(message: string, context?: LogContext) {
    console.error(JSON.stringify({ level: "error", message, ...context }));
  },
};
