import { IsUUID, IsString, IsNumber, IsOptional, IsIn } from "class-validator";

export class CreateFuelRequestDto {
  @IsUUID()
  vehicleId!: string;

  @IsString()
  date!: string; // "2025-12-04"

  @IsNumber()
  odometer!: number;

  @IsNumber()
  amount!: number;

  @IsIn(['LITER', 'COUPON', 'CASH'])
  amountType!: 'LITER' | 'COUPON' | 'CASH';

  // Optional: current odometer / remaining fuel distance in Km
  @IsOptional()
  @IsNumber()
  remainingFuelRequest?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
