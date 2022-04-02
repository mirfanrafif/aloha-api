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
import { JobAssignRequestDto, UpdateUserRequestDto } from './user.dto';
import { hash } from 'bcrypt';
import { UserJobService } from 'src/user-job/user-job.service';

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

  async updateProfile(user: UserEntity, request: UpdateUserRequestDto) {
    const currentUser = await this.userRepository.findOneOrFail(user.id);
    currentUser.full_name = request.full_name;
    currentUser.email = request.email;
    currentUser.password =
      request.password !== undefined
        ? await hash(request.password, 10)
        : user.password;
    currentUser.username = request.username;
    const finalUser = await this.userRepository.save(currentUser);
    return finalUser;
  }

  async updateProfilePhoto(file: Express.Multer.File, user: UserEntity) {
    const fileType = /image\/(.*)/gi.exec(file.mimetype);
    if (fileType === null) {
      throw new BadRequestException();
    }
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
    var users = await this.userRepository.find({
      relations: ['job'],
      where: {
        role: Role.agent
      }
    });
    return <ApiResponse<UserEntity[]>>{
      success: true,
      data: users,
      message: 'Success getting users'
    }
  }
}
