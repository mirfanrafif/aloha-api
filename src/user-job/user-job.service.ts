import { Inject, Injectable } from '@nestjs/common';
import { UserJobEntity } from 'src/core/repository/user-job/user-job.entity';
import { USER_JOB_REPOSITORY } from 'src/core/repository/user-job/user-job.module';
import { Repository } from 'typeorm';

@Injectable()
export class UserJobService {
  constructor(
    @Inject(USER_JOB_REPOSITORY)
    private userJobRepository: Repository<UserJobEntity>,
  ) {}

  async cekJobSesuai(pilihan: number) {
    const userJobs = await this.userJobRepository.find({
      relations: ['agents'],
    });
    const pilihanSesuai = userJobs.find((job) => job.id === pilihan);
    return pilihanSesuai;
  }
}
