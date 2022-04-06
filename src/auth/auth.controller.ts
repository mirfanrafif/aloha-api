import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Role } from 'src/core/repository/user/user.entity';
import { LoginRequestDto, RegisterRequestDto } from './auth.dto';
import { JwtAuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { Roles } from './role.decorator';
import { RolesGuard } from './roles.guard';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private service: AuthService) {}

  @Post('login')
  login(@Body() loginRequestDto: LoginRequestDto) {
    return this.service.login(loginRequestDto);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  register(@Body() registerRequest: RegisterRequestDto) {
    return this.service.register(registerRequest);
  }
}
