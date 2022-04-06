import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserJobRepositoryModule } from 'src/core/repository/user-job/user-job.module';
import { UserRepositoryModule } from 'src/core/repository/user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    UserRepositoryModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          secret: configService.get('JWT_SECRET'),
          signOptions: {
            expiresIn: '1d',
          },
        };
      },
      inject: [ConfigService],
    }),
    UserJobRepositoryModule,
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard, ConfigService],
})
export class AuthModule {}
