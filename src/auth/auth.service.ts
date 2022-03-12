import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from 'src/core/repository/user/user.entity';
import { USER_REPOSITORY } from 'src/core/repository/user/user.module';
import { ApiResponse } from 'src/utils/apiresponse.dto';
import { Repository } from 'typeorm';
import { LoginRequestDto, RegisterRequestDto } from './auth.dto';
import { hash, compare } from 'bcrypt';
import { USER_JOB_REPOSITORY } from 'src/core/repository/user-job/user-job.module';
import { UserJobEntity } from 'src/core/repository/user-job/user-job.entity';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: Repository<UserEntity>,
    private jwtService: JwtService,
    @Inject(USER_JOB_REPOSITORY)
    private jobRepository: Repository<UserJobEntity>,
  ) {}

  async login(loginRequest: LoginRequestDto): Promise<ApiResponse<any>> {
    const user = await this.userRepository.findOneOrFail({
      where: {
        email: loginRequest.email,
      },
      relations: ['job'],
    });
    if (user && (await compare(loginRequest.password, user.password))) {
      // const userData = this.getUserData(user);
      const jwtPayload = this.getPayload(user);
      return {
        success: true,
        data: { user: user, token: this.jwtService.sign(jwtPayload) },
        message: 'Login Success',
      };
    }
    return {
      success: false,
      message: 'Password not match',
      data: null,
    };
  }

  async register(registerRequest: RegisterRequestDto) {
    const password = await hash(registerRequest.password, 10);
    const job = await this.jobRepository.findOneOrFail(registerRequest.jobId);
    const userData = this.userRepository.create({
      full_name: registerRequest.full_name,
      email: registerRequest.email,
      role: registerRequest.role,
      password: password,
      job: job,
      created_at: Date(),
    });
    const user = await this.userRepository.save(userData);
    // const userData = this.getUserData(user);
    const jwtPayload = this.getPayload(user);
    const result = {
      user: user,
      token: this.jwtService.sign(jwtPayload),
    };
    const response: ApiResponse<any> = {
      success: true,
      data: result,
      message: 'Succesfully registered',
    };
    return response;
  }

  getPayload(user: UserEntity) {
    return {
      id: user.id,
    };
  }

  findUser(id: number) {
    return this.userRepository.findOne(id);
  }
}
