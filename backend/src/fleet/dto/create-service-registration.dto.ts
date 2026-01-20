import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateServiceRegistrationDto {
  @ApiProperty()
  @IsUUID()
  vehicleId!: string;

  @ApiProperty()
  @IsString()
  plateNumber!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  vehicleModel?: string;

  @ApiProperty()
  @IsInt()
  odometerKm!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  reachedDate5000?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  driverName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  garageName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  serviceCenter?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  serviceStart?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  serviceEnd?: string;
}
