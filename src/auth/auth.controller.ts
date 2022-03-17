import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { LoginRequestDto, RegisterRequestDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private service: AuthService) {}

  @Post('login')
  login(@Body() loginRequestDto: LoginRequestDto) {
    return this.service.login(loginRequestDto);
  }

  @Post('register')
  register(@Body() registerRequest: RegisterRequestDto) {
    return this.service.register(registerRequest);
  }
}
