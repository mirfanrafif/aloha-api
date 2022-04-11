import { Inject, Injectable } from '@nestjs/common';
import { CONVERSATION_REPOSITORY } from 'src/core/repository/conversation/conversation-repository.module';
import {
  ConversationEntity,
  ConversationStatus,
} from 'src/core/repository/conversation/conversation.entity';
import { CustomerEntity } from 'src/core/repository/customer/customer.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ConversationService {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private conversationRepository: Repository<ConversationEntity>,
  ) {}

  async getCurrentConversationSession(customer: CustomerEntity) {
    const conversation = await this.conversationRepository.findOne({
      where: {
        customer: customer,
      },
      order: {
        id: 'DESC',
      },
      relations: {
        customer: true,
      },
    });

    return conversation;
  }

  async startConversation(customer: CustomerEntity) {
    const conversation = this.conversationRepository.create({
      customer: customer,
      status: ConversationStatus.STARTED,
    });
    return await this.conversationRepository.save(conversation);
  }

  async connectConversation(conversation: ConversationEntity) {
    conversation.status = ConversationStatus.CONNECTED;
    await this.conversationRepository.save(conversation);
  }
}
