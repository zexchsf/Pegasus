import { HttpException, InternalServerErrorException, Logger } from '@nestjs/common';

class ApiError {
  private static readonly logger = new Logger(ApiError.name);

  constructor(message: string = 'An unexpected error occurred', error: unknown = null) {
    ApiError.handleError(message, error);
  }

  static handleError(message: string = 'An unexpected error occurred', error: unknown = null): never {
    if (error) {
      ApiError.logger.error(message, error instanceof Error ? error.stack : String(error));
    }

    if (error instanceof HttpException) {
      throw error;
    }

    throw new InternalServerErrorException(message);
  }
}

export { ApiError };
