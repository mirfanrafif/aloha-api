import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterRequestDto } from 'src/auth/auth.dto';
import { CustomerAgent } from 'src/core/repository/customer-agent/customer-agent.entity';
import { UserJobEntity } from 'src/core/repository/user-job/user-job.entity';
import { USER_JOB_REPOSITORY } from 'src/core/repository/user-job/user-job.module';
import { Role, UserEntity } from 'src/core/repository/user/user.entity';
import { USER_REPOSITORY } from 'src/core/repository/user/user.module';
import { CustomerService } from 'src/customer/customer.service';
import { ApiResponse } from 'src/utils/apiresponse.dto';
import { Repository } from 'typeorm';
import { AddJobRequest, UpdateUserRequestDto } from './user.dto';
import { hash } from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: Repository<UserEntity>,
    private customerService: CustomerService,
    @Inject(USER_JOB_REPOSITORY)
    private jobRepository: Repository<UserJobEntity>,
  ) {}

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
    const messages = await this.customerService.getCustomerByAgent(
      user,
      lastCustomerId,
    );
    const result: ApiResponse<CustomerAgent[]> = {
      success: true,
      data: messages,
      message: `Success getting customer list by agent id ${user.id}`,
    };
    return result;
  }

  getJobList() {
    return this.jobRepository.find();
  }

  async addJob(request: AddJobRequest) {
    const job = this.jobRepository.create({
      name: request.name,
      description: request.description,
    });
    return await this.jobRepository.save(job);
  }

  async getJobAgents(id: number) {
    const job = await this.jobRepository.findOneOrFail(id, {
      relations: ['agents'],
    });
    const result: ApiResponse<UserJobEntity> = {
      success: true,
      data: job,
      message: 'Success getting job and agents',
    };
    return result;
  }

  async updateProfile(user: UserEntity, request: UpdateUserRequestDto) {
    const currentUser = await this.userRepository.findOneOrFail(user.id);
    currentUser.full_name = request.full_name;
    currentUser.email = request.email;
    currentUser.password =
      request.password !== undefined
        ? await hash(request.password, 10)
        : user.password;
    const finalUser = await this.userRepository.save(currentUser);
    return finalUser;
  }

  async updateProfilePhoto(file: Express.Multer.File, user: UserEntity) {
    if (!file.mimetype.match(/image/gi)) {
      throw new BadRequestException();
    }
    user.profile_photo = file.filename;
    return await this.userRepository.save(user);
  }
}
