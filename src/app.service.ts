import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getVersion(): any {
    return {
      version: '1.2.0',
      lastUpdate: '21 Feb 2023',
    };
  }
}
