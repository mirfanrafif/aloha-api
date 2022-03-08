import { HttpException, HttpStatus } from '@nestjs/common';

export class WablasAPIException extends HttpException {
  constructor(message: any) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
