import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobEntity } from '../core/repository/job/job.entity';
import { JOB_REPOSITORY } from '../core/repository/job/job.module';
import { UserJobEntity } from '../core/repository/user-job/user-job.entity';
import { USER_JOB_REPOSITORY } from '../core/repository/user-job/user-job.module';
import { UserEntity } from '../core/repository/user/user.entity';
import { USER_REPOSITORY } from '../core/repository/user/user.module';
import { AddJobRequest, JobAssignRequestDto } from '../user/user.dto';
import { ApiResponse } from '../utils/apiresponse.dto';
import { Repository } from 'typeorm';

@Injectable()
export class UserJobService {
  constructor(
    @Inject(JOB_REPOSITORY)
    private jobRepository: Repository<JobEntity>,
    @Inject(USER_REPOSITORY) private userRepository: Repository<UserEntity>,
    @Inject(USER_JOB_REPOSITORY)
    private userJobRepository: Repository<UserJobEntity>,
  ) {}

  async assignAgentToJob(
    body: JobAssignRequestDto,
  ): Promise<ApiResponse<UserEntity>> {
    const agent = await this.userRepository.findOne({
      where: {
        id: body.agentId,
      },
      relations: {
        job: {
          job: true,
        },
      },
    });
    if (agent === null) {
      throw new NotFoundException(`Agent with id ${body.agentId} not found`);
    }

    if (agent.job.find((job) => job.job.id === body.jobId) !== undefined) {
      throw new BadRequestException(
        `Agent with id ${body.agentId} is already assigned to job ${body.jobId}`,
      );
    }

    const job = await this.jobRepository.findOne({
      where: {
        id: body.jobId,
      },
    });

    if (job === null) {
      throw new NotFoundException(`Job with id ${body.jobId} not found`);
    }

    await this.userJobRepository.save({
      agent: agent,
      job: job,
      priority: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const newAgent = await this.userRepository.findOneOrFail({
      where: {
        id: body.agentId,
      },
      relations: {
        job: {
          job: true,
        },
      },
    });

    return {
      success: true,
      data: newAgent,
      message: 'Succesfully assign agent ' + agent.id + ' to job ' + body.jobId,
    };
  }

  async unassignAgentToJob(
    body: JobAssignRequestDto,
  ): Promise<ApiResponse<UserEntity>> {
    await this.userJobRepository.delete({
      job: {
        id: body.jobId,
      },
      agent: {
        id: body.agentId,
      },
    });

    const newAgent = await this.userRepository.findOneOrFail({
      where: {
        id: body.agentId,
      },
      relations: {
        job: {
          job: true,
        },
      },
    });

    return {
      success: true,
      data: newAgent,
      message:
        'Succesfully assign agent ' + newAgent.id + ' to job ' + body.jobId,
    };
  }

  async cekJobSesuai(pilihan: number) {
    const userJobs = await this.jobRepository.find({
      relations: {
        agents: {
          agent: true,
        },
      },
    });
    const pilihanSesuai = userJobs
      .map((value, index) => ({
        job: value,
        menu: index + 1,
      }))
      .find((job) => job.menu === pilihan);
    return pilihanSesuai;
  }

  //tampilkan menu
  async showMenu() {
    const userJobs = await this.jobRepository.find();
    return userJobs
      .map((job, index) => {
        return `${index + 1}. ${job.name}`;
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
    const job = await this.jobRepository.findOneOrFail({
      where: {
        id: id,
      },
      relations: {
        agents: {
          agent: true,
        },
      },
    });
    const result: ApiResponse<JobEntity> = {
      success: true,
      data: job,
      message: 'Success getting job and agents',
    };
    return result;
  }

  async updateJob(id: number, request: AddJobRequest) {
    const job = await this.jobRepository.findOneOrFail({
      where: {
        id: id,
      },
    });
    job.name = request.name;
    job.description = request.description;
    const newJob = await this.jobRepository.save(job);
    return <ApiResponse<JobEntity>>{
      success: true,
      data: newJob,
      message: 'Success update job with id ' + id,
    };
  }

  async deleteJob(id: number) {
    const job = await this.jobRepository.findOneOrFail({
      where: {
        id: id,
      },
      relations: {
        agents: true,
      },
    });
    if (job.agents.length > 0) {
      throw new BadRequestException('Job is not empty. Move agents to new job');
    }
    await this.jobRepository.delete(job.id);
    return <ApiResponse<JobEntity>>{
      success: true,
      data: job,
      message: 'Success delete job with id ' + id,
    };
  }
}
