import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from 'src/core/repository/user/user.entity';

export class LoginRequestDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}

export class RegisterRequestDto {
  @IsNotEmpty()
  full_name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  @IsEnum(Role)
  role: Role;
}

export class UserJwtPayload {
  id: number;
}
