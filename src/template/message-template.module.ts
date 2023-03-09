import { Module } from '@nestjs/common';
import { MessageTemplateRepoModule } from '../core/repository/message-template/message-template.module';
import { MessageTemplateController } from './message-template.controller';
import { MessageTemplateService } from './message-template.service';

@Module({
  imports: [MessageTemplateRepoModule],
  controllers: [MessageTemplateController],
  providers: [MessageTemplateService],
})
export class MessageTemplateModule {}
