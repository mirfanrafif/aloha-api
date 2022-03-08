import { Inject, Injectable } from '@nestjs/common';
import { CHAT_REPOSITORY } from 'src/core/repository/chat/chat.module';
import { MessageEntity } from 'src/core/repository/chat/message.entity';
import { UserEntity } from 'src/core/repository/user/user.entity';
import { USER_REPOSITORY } from 'src/core/repository/user/user.module';
import { ApiResponse } from 'src/utils/apiresponse.dto';
import { Repository } from 'typeorm';

const pageSize = 20;
@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: Repository<UserEntity>,
    @Inject(CHAT_REPOSITORY)
    private messageRepository: Repository<MessageEntity>,
  ) {}

  getCurrentUser() {
    return this.userRepository.find();
  }

  async getCustomerBySalesId(id: number, page: number) {
    const messages = this.messageRepository.find({
      take: pageSize,
      skip: page * pageSize,
    });
    const result: ApiResponse<any> = {
      success: true,
      data: messages,
      message: `Success getting customer list by sales id ${id}`,
    };
    return result;
  }
}
