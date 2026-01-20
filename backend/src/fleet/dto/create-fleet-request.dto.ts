import { IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class CreateFleetRequestDto {
  @IsUUID()
  requestorId: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  // Remove fieldType since it doesn't exist in FleetRequest model
  // @IsOptional()
  // @IsString()
  // fieldType?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsString()
  tripType?: string;

  @IsOptional()
  @IsString()
  destination?: string;

  @IsOptional()
  @IsString()
  durationType?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;
}