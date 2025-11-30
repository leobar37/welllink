export class HttpException extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'HttpException';
  }
}

export class BadRequestException extends HttpException {
  constructor(message: string = 'Bad Request', code?: string) {
    super(message, 400, code);
    this.name = 'BadRequestException';
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message: string = 'Unauthorized', code?: string) {
    super(message, 401, code);
    this.name = 'UnauthorizedException';
  }
}

export class ForbiddenException extends HttpException {
  constructor(message: string = 'Forbidden', code?: string) {
    super(message, 403, code);
    this.name = 'ForbiddenException';
  }
}

export class NotFoundException extends HttpException {
  constructor(message: string = 'Not Found', code?: string) {
    super(message, 404, code);
    this.name = 'NotFoundException';
  }
}

export class ConflictException extends HttpException {
  constructor(message: string = 'Conflict', code?: string) {
    super(message, 409, code);
    this.name = 'ConflictException';
  }
}

export class ValidationException extends BadRequestException {
  constructor(message: string = 'Validation Failed', code?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationException';
  }
}

export class InternalServerErrorException extends HttpException {
  constructor(message: string = 'Internal Server Error', code?: string) {
    super(message, 500, code);
    this.name = 'InternalServerErrorException';
  }
}
