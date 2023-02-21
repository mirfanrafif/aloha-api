import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { WablasService } from './wablas.service';

@Module({
  imports: [
    HttpModule.register({
      withCredentials: true,
      baseURL: 'https://solo.wablas.com',
    }),
  ],
  providers: [WablasService],
  exports: [WablasService],
})
export class WablasModule {}
