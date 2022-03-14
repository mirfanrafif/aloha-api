import { Inject, Injectable } from '@nestjs/common';
import { CONVERSATION_REPOSITORY } from 'src/core/repository/conversation/conversation-repository.module';
import {
  ConversationEntity,
  ConversationStatus,
} from 'src/core/repository/conversation/conversation.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ConversationService {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private conversationRepository: Repository<ConversationEntity>,
  ) {}

  async getCurrentConversationSession(customerNumber: string) {
    const conversation = await this.conversationRepository.findOne({
      where: {
        customerNumber: customerNumber,
      },
      order: {
        id: 'DESC',
      },
    });

    return conversation;
  }

  async startConversation(customerNumber: string) {
    const conversation = this.conversationRepository.create({
      customerNumber: customerNumber,
      status: ConversationStatus.STARTED,
    });
    return await this.conversationRepository.save(conversation);
  }

  async connectConversation(conversation: ConversationEntity) {
    conversation.status = ConversationStatus.CONNECTED;
    await this.conversationRepository.save(conversation);
  }
}
