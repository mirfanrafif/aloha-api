import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getVersion(): any {
    return {
      version: '1.2.3',
      lastUpdate: '11 Mar 2023',
    };
  }
}
