import { IsEmail, IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { Role } from 'src/core/repository/user/user.entity';

export class AddJobRequest {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  description: string;
}

export class UpdateUserRequestDto {
  @IsNotEmpty()
  full_name: string;

  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsEnum(Role)
  role: Role;
}

export class EditProfileRequestDto {
  @IsNotEmpty()
  full_name: string;
}

export class JobAssignRequestDto {
  @IsNotEmpty()
  @IsNumber()
  agentId: number;

  @IsNotEmpty()
  @IsNumber()
  jobId: number;
}

export class ChangePasswordDto {
  @IsNotEmpty()
  oldPassword: string;

  @IsNotEmpty()
  newPassword: string;
}

export class ChangeSalesPasswordDto {
  @IsNotEmpty()
  newPassword: string;
}
