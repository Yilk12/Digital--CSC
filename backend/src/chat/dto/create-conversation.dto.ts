import { IsString, IsOptional, IsEnum, IsArray, IsUUID } from 'class-validator';

export class CreateConversationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsEnum(['PRIVATE', 'GROUP', 'DEPARTMENT'])
  type: 'PRIVATE' | 'GROUP' | 'DEPARTMENT';

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  participantIds: string[];
}
