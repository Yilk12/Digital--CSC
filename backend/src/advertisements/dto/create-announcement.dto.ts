import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsDateString, IsUrl } from 'class-validator';

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'System Maintenance Notice' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'We will be performing maintenance on Sunday.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2025-11-05T09:00:00Z', description: 'Date of the announcement' })
  @IsDateString()
  date: Date;

  @ApiProperty({ example: 'https://res.cloudinary.com/.../announcement.jpg' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({ example: 'published', required: false, description: 'Publish status of the announcement' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ example: 'General', required: false, description: 'Category of the announcement' })
  @IsOptional()
  @IsString()
  category?: string;
}
