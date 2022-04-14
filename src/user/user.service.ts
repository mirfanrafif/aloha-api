import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Role, UserEntity } from 'src/core/repository/user/user.entity';
import { USER_REPOSITORY } from 'src/core/repository/user/user.module';
import { CustomerService } from 'src/customer/customer.service';
import { ApiResponse } from 'src/utils/apiresponse.dto';
import { Not, Repository } from 'typeorm';
import { ChangePasswordDto } from './user.dto';
import { compare, hash } from 'bcrypt';
// import {} from 'bcrypt';
import { RegisterRequestDto } from 'src/auth/auth.dto';

const pageSize = 25;
@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: Repository<UserEntity>,
    private customerService: CustomerService,
  ) {}

  async findUser(id: number) {
    return await this.userRepository.findOne({
      where: {
        id: id,
      },
    });
  }

  async getCustomerByAgentId(user: UserEntity, lastCustomerId?: number) {
    const messages = await this.customerService.getCustomerByAgent({
      agent: user,
      lastCustomerId,
    });
    const result = {
      success: true,
      data: messages,
      message: `Success getting customer list by agent id ${user.id}`,
    };
    return result;
  }

  getAloha() {
    return this.userRepository.findOneOrFail({
      where: {
        email: 'aloha@rajadinar.com',
      },
    });
  }

  async getAllUsers(search?: string, page?: number) {
    const conditions: any = {
      role: Not(Role.sistem),
    };

    if (search !== undefined && search.length > 0) {
      conditions.full_name = search;
    }

    const users = await this.userRepository.find({
      relations: {
        job: true,
      },
      where: conditions,
      take: pageSize,
      skip: ((page ?? 1) - 1) * 25,
    });
    return <ApiResponse<UserEntity[]>>{
      success: true,
      data: users,
      message: 'Success getting users',
    };
  }

  async addUser(registerRequest: RegisterRequestDto) {
    const password = await hash(registerRequest.password, 10);

    const userData = this.userRepository.create({
      full_name: registerRequest.full_name,
      username: registerRequest.username,
      email: registerRequest.email,
      role: registerRequest.role,
      password: password,
    });
    const user = await this.userRepository.save(userData);

    const response: ApiResponse<UserEntity> = {
      success: true,
      data: user,
      message: 'Succesfully registered',
    };
    return response;
  }

  async changePassword(request: ChangePasswordDto, agent: UserEntity) {
    const validOldPassword = await compare(request.oldPassword, agent.password);
    if (!validOldPassword) {
      throw new BadRequestException('Old password not match');
    }

    const newHashedPassword = await hash(request.newPassword, 10);
    agent.password = newHashedPassword;

    await this.userRepository.save(agent);
    return <ApiResponse<UserEntity>>{
      success: true,
      data: agent,
      message: 'Password changed',
    };
  }
}
