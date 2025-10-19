import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  content: string;

  @IsEnum(['TEXT', 'FILE', 'IMAGE', 'SYSTEM'])
  type: 'TEXT' | 'FILE' | 'IMAGE' | 'SYSTEM' = 'TEXT';

  @IsUUID()
  conversationId: string;

  @IsOptional()
  @IsUUID()
  replyToId?: string;
}
