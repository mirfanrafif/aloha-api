import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserRepositoryModule } from 'src/core/repository/user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UserRepositoryModule,
    JwtModule.register({
      secret: 'sebuah_secret',
      signOptions: {
        expiresIn: '1d',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
