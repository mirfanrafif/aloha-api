import { Inject, Injectable, UseFilters } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/core/repository/user/user.entity';
import { USER_REPOSITORY } from 'src/core/repository/user/user.module';
import { Repository } from 'typeorm';
import { LoginRequestDto, RegisterRequestDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(loginRequest: LoginRequestDto) {
    const user = await this.userRepository.findOneOrFail({
      where: {
        email: loginRequest.email,
      },
    });
    if (user && user.password === loginRequest.password) {
      const { password, ...payload } = user;
      return this.jwtService.sign(payload);
    }
    return null;
  }

  async register(registerRequest: RegisterRequestDto) {
    const user = await this.userRepository.save({
      ...registerRequest,
      created_at: Date(),
    });
    const { password, ...userData } = user;
    const result = {
      ...userData,
      token: this.jwtService.sign(userData),
    };
    return user;
  }
}
