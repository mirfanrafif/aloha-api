import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from 'src/core/repository/user/user.entity';
import { USER_REPOSITORY } from 'src/core/repository/user/user.module';
import { ApiResponse } from 'src/utils/apiresponse.dto';
import { Repository } from 'typeorm';
import { LoginRequestDto, RegisterRequestDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: Repository<UserEntity>,
    private jwtService: JwtService,
  ) {}

  async login(loginRequest: LoginRequestDto): Promise<ApiResponse<any>> {
    const user = await this.userRepository.findOneOrFail({
      where: {
        email: loginRequest.email,
      },
    });
    if (user && user.password === loginRequest.password) {
      const { password, ...payload } = user;
      return {
        success: true,
        data: { ...payload, token: this.jwtService.sign(payload) },
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
    const user = await this.userRepository.save({
      ...registerRequest,
      created_at: Date(),
    });
    const { password, ...userData } = user;
    const result = {
      user: userData,
      token: this.jwtService.sign(userData),
    };
    return result;
  }
}
