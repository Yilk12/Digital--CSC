import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, Length } from 'class-validator'

export enum AdvertisementCategory {
  HR = 'HR',
  IT = 'IT',
  Facilities = 'Facilities',
  Policy = 'Policy',
  Other = 'Other',
}

export enum AdvertisementPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

export class CreateAdvertisementDto {
  @ApiProperty()
  @IsString()
  @Length(2, 200)
  title!: string

  @ApiProperty()
  @IsString()
  @Length(2, 5000)
  description!: string

  @ApiProperty({ enum: AdvertisementCategory })
  @IsEnum(AdvertisementCategory)
  category!: AdvertisementCategory

  @ApiProperty({ enum: AdvertisementPriority, required: false })
  @IsOptional()
  @IsEnum(AdvertisementPriority)
  priority?: AdvertisementPriority

  @ApiProperty({ required: false, type: String })
  @IsOptional()
  @IsDateString()
  publishDate?: string

  @ApiProperty({ required: false, type: String })
  @IsOptional()
  @IsDateString()
  expiryDate?: string

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean
}
