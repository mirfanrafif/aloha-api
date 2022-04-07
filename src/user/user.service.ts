import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, UserEntity } from 'src/core/repository/user/user.entity';
import { USER_REPOSITORY } from 'src/core/repository/user/user.module';
import { CustomerService } from 'src/customer/customer.service';
import { ApiResponse } from 'src/utils/apiresponse.dto';
import { Repository } from 'typeorm';
import {
  ChangePasswordDto,
  EditProfileRequestDto,
  JobAssignRequestDto,
  UpdateUserRequestDto,
} from './user.dto';
import { compare, hash } from 'bcrypt';
import { UserJobService } from 'src/user-job/user-job.service';
import {} from 'bcrypt';
import { RegisterRequestDto } from 'src/auth/auth.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: Repository<UserEntity>,
    private customerService: CustomerService,
    private userJobService: UserJobService,
  ) {}

  async findUser(id: number) {
    return await this.userRepository.findOne(id);
  }

  async getCurrentUser(id: number): Promise<ApiResponse<any>> {
    const user = await this.userRepository.findOneOrFail(id, {
      relations: ['job'],
    });
    return {
      success: true,
      data: user,
      message: 'Success getting profile data with user id ' + id,
    };
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

  async editProfile(user: UserEntity, request: EditProfileRequestDto) {
    const currentUser = await this.userRepository.findOneOrFail(user.id);
    currentUser.full_name = request.full_name;
    const finalUser = await this.userRepository.save(currentUser);
    return finalUser;
  }

  async updateUser(agentId: number, newData: UpdateUserRequestDto) {
    let user = await this.userRepository.findOneOrFail({
      where: {
        id: agentId,
      },
    });

    console.log(user);

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

  async updateProfilePhoto(file: Express.Multer.File, user: UserEntity) {
    user.profile_photo = file.filename;
    return await this.userRepository.save(user);
  }

  async assignAgentToJob(
    body: JobAssignRequestDto,
  ): Promise<ApiResponse<UserEntity>> {
    const agent = await this.userRepository.findOne(body.agentId, {
      relations: ['job'],
    });
    if (agent === undefined) {
      throw new NotFoundException(`Agent with id ${body.agentId} not found`);
    }
    if (agent.job.id === body.jobId) {
      throw new BadRequestException(
        `Agent with id ${body.agentId} is already assigned to job ${body.jobId}`,
      );
    }
    const jobs = await await this.userJobService.getJobList();
    const suitableJob = jobs.find((job) => job.id === body.jobId);

    if (!suitableJob) {
      throw new NotFoundException(`Job with id ${body.jobId} not found`);
    }

    agent.job = suitableJob;
    const newAgent = await this.userRepository.save(agent);

    return {
      success: true,
      data: newAgent,
      message:
        'Succesfully assign agent ' + agent.id + ' to job ' + agent.job.id,
    };
  }

  getAloha() {
    return this.userRepository.findOneOrFail({
      where: {
        email: 'aloha@rajadinar.com',
      },
    });
  }

  async getAllUsers() {
    const users = await this.userRepository.find({
      relations: ['job'],
      where: [
        {
          role: Role.admin,
        },
        {
          role: Role.agent,
        },
      ],
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
