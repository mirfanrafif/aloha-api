import { IsNotEmpty } from 'class-validator';

export class MessageTemplateRequestDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  template: string;
}
