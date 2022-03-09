import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { DbexceptionFilter } from 'src/utils/dbexception.filter';
import { LoginRequestDto, RegisterRequestDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
@UseFilters(DbexceptionFilter)
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
