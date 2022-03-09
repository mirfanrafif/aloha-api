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
      const userData = this.getUserData(user);
      const jwtPayload = this.getPayload(user);
      return {
        success: true,
        data: { user: userData, token: this.jwtService.sign(jwtPayload) },
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
    const userData = this.getUserData(user);
    const jwtPayload = this.getPayload(user);
    const result = {
      user: userData,
      token: this.jwtService.sign(jwtPayload),
    };
    const response: ApiResponse<any> = {
      success: true,
      data: result,
      message: 'Succesfully registered',
    };
    return response;
  }

  getUserData(user: UserEntity) {
    return {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      profile_photo_url: user.profile_photo_url,
    };
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
