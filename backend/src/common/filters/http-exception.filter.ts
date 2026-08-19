import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

const PRISMA_STATUS_BY_CODE: Record<string, number> = {
  P2002: HttpStatus.CONFLICT,
  P2003: HttpStatus.BAD_REQUEST,
  P2025: HttpStatus.NOT_FOUND,
};

/** Single global filter: centralizes error shaping for HttpExceptions, known Prisma errors, and anything unhandled. */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, error } = this.resolve(exception, request);

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private resolve(exception: unknown, request: Request) {
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      const message =
        (typeof body === 'string' ? body : (body as { message?: string | string[] })?.message) ??
        exception.message;
      return { status: exception.getStatus(), message, error: exception.name };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const status = PRISMA_STATUS_BY_CODE[exception.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
      return { status, message: this.prismaMessage(exception), error: exception.code };
    }

    this.logger.error(
      `Unhandled exception on ${request.method} ${request.url}`,
      (exception as Error)?.stack,
    );
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Внутрішня помилка сервера',
      error: 'InternalServerError',
    };
  }

  private prismaMessage(exception: Prisma.PrismaClientKnownRequestError): string {
    switch (exception.code) {
      case 'P2002':
        return `Запис із таким значенням поля «${(exception.meta?.target as string[])?.join(', ') ?? 'value'}» вже існує`;
      case 'P2025':
        return 'Запис не знайдено';
      default:
        return 'Помилка бази даних';
    }
  }
}
