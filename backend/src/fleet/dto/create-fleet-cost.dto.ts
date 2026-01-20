import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsUUID, IsDateString } from 'class-validator';

export class CreateFleetCostDto {
  @IsDateString()
  @ApiProperty({ description: 'Date of the cost (ISO string or yyyy-mm-dd)' })
  date!: string;

  @IsUUID()
  @ApiProperty({ description: 'Vehicle ID (UUID)' })
  vehicleId!: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, description: 'Cost category (e.g. fuel, maintenance, tolls)' })
  category?: string;

  @IsNumber()
  @ApiProperty({ description: 'Amount of the cost' })
  amount!: number;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, default: 'ETB', description: 'Currency code (default ETB)' })
  currency?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, description: 'Reference / document number' })
  reference?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, description: 'Description of the cost' })
  description?: string;
}
