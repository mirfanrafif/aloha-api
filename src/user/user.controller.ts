import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/auth.guard';

@Controller('user')
export class UserController {
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@Request() request) {
    return request.user;
  }
}
