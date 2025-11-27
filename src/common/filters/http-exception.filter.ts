import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

export interface ErrorResponse {
  state: boolean;
  status: number;
  message: string;
  payload: {
    state: boolean;
    message: string;
    body: {
      data: null;
      errors?: any;
    };
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor.';
    let errors: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message || message;

        // Si hay errores de validación, extraerlos
        if (responseObj.message && Array.isArray(responseObj.message)) {
          errors = responseObj.message;
          message = 'Error de validación.';
        } else if (responseObj.error) {
          message = responseObj.message || responseObj.error || message;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message || message;
      this.logger.error(
        `Unexpected error: ${exception.message}`,
        exception.stack,
      );
    }

    // Mensajes personalizados según el código de estado
    if (status === HttpStatus.UNAUTHORIZED) {
      message = 'No autorizado. Credenciales inválidas o token expirado.';
    } else if (status === HttpStatus.FORBIDDEN) {
      message =
        'Acceso denegado. No tienes permisos para realizar esta acción.';
    } else if (status === HttpStatus.NOT_FOUND) {
      message = 'Recurso no encontrado.';
    } else if (status === HttpStatus.BAD_REQUEST) {
      message = message || 'Solicitud inválida.';
    } else if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      message = 'Error interno del servidor.';
    }

    const errorResponse: ErrorResponse = {
      state: false,
      status,
      message,
      payload: {
        state: false,
        message: message,
        body: {
          data: null,
          ...(errors && { errors }),
        },
      },
    };

    this.logger.error(
      `HTTP ${status} Error: ${message}`,
      JSON.stringify({
        path: request.url,
        method: request.method,
        status,
        errors,
      }),
    );

    response.status(status).json(errorResponse);
  }
}
