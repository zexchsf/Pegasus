import { Injectable, Logger, LogLevel } from '@nestjs/common';

@Injectable()
export class AppLogger extends Logger {
  private logLevels: LogLevel[];

  constructor(context: string = 'Application') {
    super(context);
    this.logLevels = ['log', 'error', 'warn', 'debug', 'verbose'];
  }

  setLogLevels(levels: LogLevel[]): void {
    this.logLevels = levels;
  }

  log(message: string, context?: string): void {
    if (this.isLevelEnabled('log')) {
      const cleanMessage = message.replace(/\n/g, ' ').trim();
      super.log(cleanMessage, context);
    }
  }

  error(message: string, trace?: string, context?: string): void {
    if (this.isLevelEnabled('error')) {
      super.error(message, trace, context);
    }
  }

  warn(message: string, context?: string): void {
    if (this.isLevelEnabled('warn')) {
      super.warn(message, context);
    }
  }

  debug(message: string, context?: string): void {
    if (this.isLevelEnabled('debug')) {
      super.debug(message, context);
    }
  }

  verbose(message: string, context?: string): void {
    if (this.isLevelEnabled('verbose')) {
      super.verbose(message, context);
    }
  }

  private isLevelEnabled(level: LogLevel): boolean {
    return this.logLevels.includes(level);
  }
}
