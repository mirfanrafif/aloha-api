import { Inject, Injectable } from '@nestjs/common';
import { UserJobEntity } from 'src/core/repository/user-job/user-job.entity';
import { USER_JOB_REPOSITORY } from 'src/core/repository/user-job/user-job.module';
import { AddJobRequest } from 'src/user/user.dto';
import { ApiResponse } from 'src/utils/apiresponse.dto';
import { Repository } from 'typeorm';

@Injectable()
export class UserJobService {
  constructor(
    @Inject(USER_JOB_REPOSITORY)
    private jobRepository: Repository<UserJobEntity>,
  ) {}

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
