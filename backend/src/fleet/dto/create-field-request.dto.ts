import { IsUUID, IsString, IsOptional, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateFieldRequestDto {
  @IsUUID()
  requestorId: string; // Changed from reqId to requestorId

  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsNotEmpty()
  fieldType: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsDateString()
  fromDate: string;

  @IsDateString()
  toDate: string;

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  durationType?: string;
}