import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';

@Catch(EntityNotFoundError, QueryFailedError)
export class DbexceptionFilter implements ExceptionFilter {
  catch(
    exception: EntityNotFoundError | QueryFailedError,
    host: ArgumentsHost,
  ) {
    if (exception instanceof EntityNotFoundError) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      return response.status(404).json({
        message: {
          statusCode: 404,
          error: 'Not Found',
          message: exception.message,
        },
      });
    } else if (exception instanceof QueryFailedError) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      return response.status(400).json({
        message: {
          statusCode: 400,
          error: 'Bad Request',
          message: exception.message,
        },
      });
    }
  }
}
