import { IsString, IsOptional, IsUUID, IsNumber, IsEnum } from 'class-validator';
import { VehicleType } from '@prisma/client';

export class CreateVehicleDto {
  @IsString()
  plate: string;

  @IsOptional()
  @IsString()
  make?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  year?: number;

  // Country where the vehicle was manufactured
  @IsOptional()
  @IsString()
  countryOfOrigin?: string;

  // How many persons the vehicle can carry
  @IsOptional()
  @IsNumber()
  seatingCapacity?: number;

  // How many kilometers the vehicle moves per liter of fuel
  @IsOptional()
  @IsNumber()
  kmPerLiter?: number;

  // Human-readable vehicle type (e.g., Sedan, Pickup)
  @IsOptional()
  @IsString()
  vehicleTypeName?: string;

  // Chassis / VIN number
  @IsOptional()
  @IsString()
  chassisNumber?: string;

  // Engine number
  @IsOptional()
  @IsString()
  engineNumber?: string;

  // Fuel type (e.g., Diesel, Benzene)
  @IsOptional()
  @IsString()
  fuelType?: string;

  // Number of cylinders
  @IsOptional()
  @IsNumber()
  cylinderCount?: number;

  @IsOptional()
  @IsEnum(VehicleType)
  type?: VehicleType;

  @IsOptional()
  @IsUUID()
  userId?: string; // driver assignment

  @IsOptional()
  @IsNumber()
  reqId?: number; // link to fleet request
}
