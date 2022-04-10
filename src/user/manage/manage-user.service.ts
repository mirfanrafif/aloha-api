import { Inject, Injectable } from '@nestjs/common';
import { hash } from 'bcrypt';
import { UserEntity } from 'src/core/repository/user/user.entity';
import { USER_REPOSITORY } from 'src/core/repository/user/user.module';
import { ApiResponse } from 'src/utils/apiresponse.dto';
import { Repository } from 'typeorm';
import { ChangeSalesPasswordDto, UpdateUserRequestDto } from '../user.dto';

@Injectable()
export class ManageUserService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: Repository<UserEntity>,
  ) {}

  async updateUser(agentId: number, newData: UpdateUserRequestDto) {
    let user = await this.userRepository.findOneOrFail({
      where: {
        id: agentId,
      },
    });

    user.full_name = newData.full_name;
    user.email = newData.email;
    user.username = newData.username;
    user.role = newData.role;

    user = await this.userRepository.save(user);
    return <ApiResponse<UserEntity>>{
      success: true,
      data: user,
      message: 'Success update user data with id ' + agentId,
    };
  }

  async changeSalesPassword(request: ChangeSalesPasswordDto, agentId: number) {
    const agent = await this.userRepository.findOneOrFail({
      where: {
        id: agentId,
      },
    });

    const newHashedPassword = await hash(request.newPassword, 10);
    agent.password = newHashedPassword;

    await this.userRepository.save(agent);
    return <ApiResponse<UserEntity>>{
      success: true,
      data: agent,
      message: 'Password changed',
    };
  }

  async getStats(id: number) {
    const userWithMessages = await this.userRepository.findOneOrFail({
      where: {
        id: id,
      },
      relations: {
        messages: {
          customer: true,
        },
      },
    });
    let messages = userWithMessages.messages;
    // yang di cek yang jam kerja aja
    // messages = messages.filter(
    //   (message) =>
    //     message.created_at.getHours() >= 8 &&
    //     message.created_at.getHours() <= 16,
    // );
    //untuk demo, pake chat nya arik aja
    messages = messages.filter((message) => message.customer.id === 19);
    return messages;
  }
}
