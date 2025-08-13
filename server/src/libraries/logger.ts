import { ENV } from "@/environment";

export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
  TRACE = "trace",
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  error?: Error;
  requestId?: string;
  userId?: number;
  tenantId?: number;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  duration?: number;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  filePath?: string;
  maxFileSize: number;
  maxFiles: number;
  format: "json" | "text";
  includeTimestamp: boolean;
  includeContext: boolean;
  includeStack: boolean;
}

class Logger {
  private config: LoggerConfig;
  private logLevels: Record<LogLevel, number> = {
    [LogLevel.ERROR]: 0,
    [LogLevel.WARN]: 1,
    [LogLevel.INFO]: 2,
    [LogLevel.DEBUG]: 3,
    [LogLevel.TRACE]: 4,
  };

  constructor() {
    this.config = this.getDefaultConfig();
  }

  private getDefaultConfig(): LoggerConfig {
    const envLevel = (ENV.LOG_LEVEL as LogLevel) || LogLevel.INFO;

    return {
      level: this.logLevels[envLevel] !== undefined ? envLevel : LogLevel.INFO,
      enableConsole: ENV.NODE_ENV !== "production" || ENV.ENABLE_LOGGING,
      enableFile: ENV.LOG_FILE !== undefined,
      filePath: ENV.LOG_FILE,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      format: ENV.NODE_ENV === "production" ? "json" : "text",
      includeTimestamp: true,
      includeContext: true,
      includeStack: true,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return this.logLevels[level] <= this.logLevels[this.config.level];
  }

  private formatMessage(entry: LogEntry): string {
    if (this.config.format === "json") {
      return JSON.stringify(entry);
    }

    let message = "";

    if (this.config.includeTimestamp) {
      message += `[${entry.timestamp}] `;
    }

    message += `[${entry.level.toUpperCase()}]`;

    if (this.config.includeContext && entry.context) {
      message += ` [${entry.context}]`;
    }

    message += ` ${entry.message}`;

    if (entry.requestId) {
      message += ` (Request: ${entry.requestId})`;
    }

    if (entry.userId) {
      message += ` (User: ${entry.userId})`;
    }

    if (entry.tenantId) {
      message += ` (Tenant: ${entry.tenantId})`;
    }

    if (entry.duration) {
      message += ` (Duration: ${entry.duration}ms)`;
    }

    if (entry.data) {
      message += ` | Data: ${JSON.stringify(entry.data)}`;
    }

    if (entry.error && this.config.includeStack) {
      message += ` | Error: ${entry.error.message}`;
      if (entry.error.stack) {
        message += ` | Stack: ${entry.error.stack}`;
      }
    }

    return message;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any,
    error?: Error,
    requestInfo?: {
      requestId?: string;
      userId?: number;
      tenantId?: number;
      ip?: string;
      userAgent?: string;
      method?: string;
      url?: string;
      duration?: number;
    }
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
      error,
      ...requestInfo,
    };
  }

  private writeToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const formattedMessage = this.formatMessage(entry);

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.TRACE:
        console.trace(formattedMessage);
        break;
    }
  }

  private async writeToFile(entry: LogEntry): Promise<void> {
    if (!this.config.enableFile || !this.config.filePath) return;

    try {
      const fs = await import("fs/promises");
      const path = await import("path");

      // Ensure directory exists
      const dir = path.dirname(this.config.filePath);
      await fs.mkdir(dir, { recursive: true });

      const formattedMessage = this.formatMessage(entry) + "\n";
      await fs.appendFile(this.config.filePath, formattedMessage);
    } catch (error) {
      // Fallback to console if file writing fails
      console.error("Failed to write to log file:", error);
      this.writeToConsole(entry);
    }
  }

  private async log(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any,
    error?: Error,
    requestInfo?: {
      requestId?: string;
      userId?: number;
      tenantId?: number;
      ip?: string;
      userAgent?: string;
      method?: string;
      url?: string;
      duration?: number;
    }
  ): Promise<void> {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(
      level,
      message,
      context,
      data,
      error,
      requestInfo
    );

    // Write to console synchronously for immediate feedback
    this.writeToConsole(entry);

    // Write to file asynchronously
    await this.writeToFile(entry);
  }

  // Public logging methods
  async error(
    message: string,
    context?: string,
    data?: any,
    error?: Error,
    requestInfo?: any
  ): Promise<void> {
    await this.log(LogLevel.ERROR, message, context, data, error, requestInfo);
  }

  async warn(
    message: string,
    context?: string,
    data?: any,
    requestInfo?: any
  ): Promise<void> {
    await this.log(
      LogLevel.WARN,
      message,
      context,
      data,
      undefined,
      requestInfo
    );
  }

  async info(
    message: string,
    context?: string,
    data?: any,
    requestInfo?: any
  ): Promise<void> {
    await this.log(
      LogLevel.INFO,
      message,
      context,
      data,
      undefined,
      requestInfo
    );
  }

  async debug(
    message: string,
    context?: string,
    data?: any,
    requestInfo?: any
  ): Promise<void> {
    await this.log(
      LogLevel.DEBUG,
      message,
      context,
      data,
      undefined,
      requestInfo
    );
  }

  async trace(
    message: string,
    context?: string,
    data?: any,
    requestInfo?: any
  ): Promise<void> {
    await this.log(
      LogLevel.TRACE,
      message,
      context,
      data,
      undefined,
      requestInfo
    );
  }

  // Convenience methods for common use cases
  async logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    requestId: string,
    userId?: number,
    tenantId?: number,
    ip?: string,
    userAgent?: string
  ): Promise<void> {
    const level = statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    const message = `${method} ${url} - ${statusCode} (${duration}ms)`;

    await this.log(level, message, "HTTP", { statusCode }, undefined, {
      requestId,
      userId,
      tenantId,
      ip,
      userAgent,
      method,
      url,
      duration,
    });
  }

  async logDatabase(
    operation: string,
    table: string,
    duration: number,
    userId?: number,
    tenantId?: number
  ): Promise<void> {
    const message = `Database ${operation} on ${table} (${duration}ms)`;
    await this.log(
      LogLevel.DEBUG,
      message,
      "DATABASE",
      { operation, table },
      undefined,
      {
        userId,
        tenantId,
        duration,
      }
    );
  }

  async logAuth(
    action: string,
    userId: number,
    tenantId: number,
    ip: string,
    success: boolean,
    error?: Error
  ): Promise<void> {
    const message = `Authentication ${action} for user ${userId} (${
      success ? "SUCCESS" : "FAILED"
    })`;
    const level = success ? LogLevel.INFO : LogLevel.WARN;

    await this.log(level, message, "AUTH", { action, success }, error, {
      userId,
      tenantId,
      ip,
    });
  }

  async logAudit(
    action: string,
    module: string,
    recordId: number,
    userId: number,
    tenantId: number,
    ip: string,
    oldValues?: any,
    newValues?: any
  ): Promise<void> {
    const message = `Audit: ${action} on ${module} (ID: ${recordId})`;

    await this.log(
      LogLevel.INFO,
      message,
      "AUDIT",
      {
        action,
        module,
        recordId,
        oldValues,
        newValues,
      },
      undefined,
      {
        userId,
        tenantId,
        ip,
      }
    );
  }

  async logError(
    error: Error,
    context: string,
    userId?: number,
    tenantId?: number,
    requestInfo?: any
  ): Promise<void> {
    await this.log(LogLevel.ERROR, error.message, context, undefined, error, {
      userId,
      tenantId,
      ...requestInfo,
    });
  }

  // Configuration methods
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  // Utility methods
  isLevelEnabled(level: LogLevel): boolean {
    return this.shouldLog(level);
  }

  // Create child logger with context
  child(context: string): Logger {
    const childLogger = new Logger();
    childLogger.config = { ...this.config };

    // Override log method to include context
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = async (
      level: LogLevel,
      message: string,
      childContext?: string,
      data?: any,
      error?: Error,
      requestInfo?: any
    ) => {
      const fullContext = childContext ? `${context}:${childContext}` : context;
      await originalLog(level, message, fullContext, data, error, requestInfo);
    };

    return childLogger;
  }
}

// Create singleton instance
const logger = new Logger();

// Export logger instance and types
export { logger };
export default logger;

// Convenience exports for common use cases
export const logError = (error: Error, context?: string) =>
  logger.error(error.message, context, undefined, error);
export const logInfo = (message: string, context?: string, data?: any) =>
  logger.info(message, context, data);
export const logWarning = (message: string, context?: string, data?: any) =>
  logger.warn(message, context, data);
export const logDebug = (message: string, context?: string, data?: any) =>
  logger.debug(message, context, data);
