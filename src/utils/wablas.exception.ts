import { InternalServerErrorException } from '@nestjs/common';

export class WablasAPIException extends InternalServerErrorException {
  constructor(message: string) {
    super('Wablas API Error: ' + message);
  }
}
