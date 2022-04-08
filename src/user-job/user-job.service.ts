import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserJobEntity } from 'src/core/repository/user-job/user-job.entity';
import { USER_JOB_REPOSITORY } from 'src/core/repository/user-job/user-job.module';
import { UserEntity } from 'src/core/repository/user/user.entity';
import { USER_REPOSITORY } from 'src/core/repository/user/user.module';
import { AddJobRequest, JobAssignRequestDto } from 'src/user/user.dto';
import { ApiResponse } from 'src/utils/apiresponse.dto';
import { Repository } from 'typeorm';

@Injectable()
export class UserJobService {
  constructor(
    @Inject(USER_JOB_REPOSITORY)
    private jobRepository: Repository<UserJobEntity>,
    @Inject(USER_REPOSITORY) private userRepository: Repository<UserEntity>,
  ) {}

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
    const jobs = await await this.getJobList();
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

  async cekJobSesuai(pilihan: number) {
    const userJobs = await this.jobRepository.find({
      relations: ['agents'],
    });
    const pilihanSesuai = userJobs.find((job) => job.id === pilihan);
    return pilihanSesuai;
  }

  //tampilkan menu
  async showMenu() {
    const userJobs = await this.jobRepository.find();
    return userJobs
      .map((job) => {
        return `${job.id}. ${job.name}`;
      })
      .join('\n');
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
}
