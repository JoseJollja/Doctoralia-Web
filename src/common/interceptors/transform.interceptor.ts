import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

function jsonReplacer(key: string, value: any): any {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

export interface ApiResponse<T> {
  state: boolean;
  status: number;
  message: string;
  payload: {
    state: boolean;
    message: string;
    body: {
      data: T;
    };
  };
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse<Response>();
    const status = response.statusCode || 200;

    return next.handle().pipe(
      map((data) => {
        const serializedData = JSON.parse(JSON.stringify(data, jsonReplacer));

        // Si la respuesta ya tiene la estructura esperada, retornarla tal cual
        if (
          serializedData &&
          typeof serializedData === 'object' &&
          'state' in serializedData &&
          'payload' in serializedData
        ) {
          return serializedData;
        }

        // Determinar el mensaje según el método HTTP y la ruta
        const request = context.switchToHttp().getRequest();
        const method = request.method;
        const url = request.url;
        let message = 'El proceso se completó satisfactoriamente.';

        // Mensajes personalizados según el endpoint
        if (url.includes('/auth/login')) {
          message = 'Inicio de sesión exitoso.';
        } else if (url.includes('/doctors/search')) {
          message = 'Búsqueda de doctores completada exitosamente.';
        } else if (url.includes('/doctors') && url.includes('/availability')) {
          message = 'Disponibilidad del doctor obtenida correctamente.';
        } else if (url.includes('/doctors') && url.includes('/treatments')) {
          message = 'Tratamientos del doctor obtenidos correctamente.';
        } else if (url.includes('/doctors') && url.includes('/details')) {
          message = 'Detalles del doctor obtenidos correctamente.';
        } else if (url.includes('/doctors/specialties/list')) {
          message = 'Lista de especialidades obtenida correctamente.';
        } else if (url.includes('/doctors/cities/list')) {
          message = 'Lista de ciudades obtenida correctamente.';
        } else if (url.includes('/doctors') && method === 'GET') {
          message = 'Información del doctor obtenida correctamente.';
        } else if (url.includes('/appointments/calendar')) {
          message = 'Calendario de citas obtenido correctamente.';
        } else if (url.includes('/appointments/doctor/')) {
          message = 'Citas del doctor obtenidas correctamente.';
        } else if (url.includes('/appointments')) {
          message = 'Información de citas obtenida correctamente.';
        }

        return {
          state: true,
          status,
          message: 'El proceso se completó satisfactoriamente.',
          payload: {
            state: true,
            message: message,
            body: {
              data: serializedData || null,
            },
          },
        };
      }),
    );
  }
}
