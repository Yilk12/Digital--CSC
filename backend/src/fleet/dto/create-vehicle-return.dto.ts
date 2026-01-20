import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsDateString,
  IsBoolean,
  IsNumber,
  IsOptional
} from 'class-validator';

export class CreateVehicleReturnDto {

  @ApiProperty()
  @IsUUID()
  driverId: string;   // <-- CHANGED (driverName → driverId)

  @ApiProperty()
  @IsUUID()
  vehicleId: string;

  @ApiProperty()
  @IsString()
  plateNumber: string;

  @ApiProperty()
  @IsDateString()
  returnedAt: string;

  @ApiProperty()
  @IsNumber()
  finalOdometerKm: number;

  @ApiProperty()
  @IsString()
  fuelLevel: string;

  @ApiProperty()
  @IsBoolean()
  warningLightsOn: boolean;

  @ApiProperty()
  @IsString()
  vehicleInspection: string;

  @ApiProperty({ required: false })
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  fileUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  fileName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  fileType?: string;
}
