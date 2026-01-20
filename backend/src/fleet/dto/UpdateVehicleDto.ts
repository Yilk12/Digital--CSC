// dto/update-vehicle.dto.ts
import { IsOptional, IsString, IsNumber, IsEnum, IsInt, IsUUID } from 'class-validator'
import { VehicleType } from '@prisma/client'

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  plate?: string

  @IsOptional()
  @IsString()
  make?: string

  @IsOptional()
  @IsString()
  model?: string

  @IsOptional()
  @IsNumber()
  year?: number

  // Country where the vehicle was manufactured
  @IsOptional()
  @IsString()
  countryOfOrigin?: string

  // How many persons the vehicle can carry
  @IsOptional()
  @IsNumber()
  seatingCapacity?: number

  // How many kilometers the vehicle moves per liter of fuel
  @IsOptional()
  @IsNumber()
  kmPerLiter?: number

  // Human-readable vehicle type (e.g., Sedan, Pickup)
  @IsOptional()
  @IsString()
  vehicleTypeName?: string

  // Chassis / VIN number
  @IsOptional()
  @IsString()
  chassisNumber?: string

  // Engine number
  @IsOptional()
  @IsString()
  engineNumber?: string

  // Fuel type (e.g., Diesel, Benzene)
  @IsOptional()
  @IsString()
  fuelType?: string

  // Number of cylinders
  @IsOptional()
  @IsNumber()
  cylinderCount?: number

  @IsOptional()
  @IsEnum(VehicleType)
  type?: VehicleType

  @IsOptional()
  @IsUUID()
  userId?: string // driver assignment

  @IsOptional()
  @IsNumber()
  reqId?: number // link to fleet request

  @IsOptional()
  @IsEnum(['available','assigned','maintenance','out_of_service'])
  status?: string
}

export class UpdateTripMetricsDto {
  @IsOptional()
  @IsInt()
  startOdometerKm?: number;

  @IsOptional()
  @IsInt()
  odometerKmDiff?: number;

  @IsOptional()
  @IsInt()
  returnOdometerKm?: number;

  @IsOptional()
  @IsString()
  returnTime?: string;

  @IsOptional()
  @IsInt()
  passengerCount?: number;
}