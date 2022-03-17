import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';

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

  password?: string;
}

export class JobAssignRequestDto {
  @IsNotEmpty()
  @IsNumber()
  agentId: number;

  @IsNotEmpty()
  @IsNumber()
  jobId: number;
}
