import { IsString, IsOptional, IsArray, IsEnum, IsNumber, IsDateString, Min } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"
import { Language } from "@prisma/client"

export class SearchQueryDto {
  @ApiProperty({ description: "Search query text", required: false })
  @IsOptional()
  @IsString()
  title?: string

  @ApiProperty({ description: "Search in content", required: false })
  @IsOptional()
  @IsString()
  content?: string

  @ApiProperty({ description: "Author ID", required: false })
  @IsOptional()
  @IsString()
  authorId?: string

  @ApiProperty({ description: "Category IDs", required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[]

  @ApiProperty({ description: "Tags to search for", required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @ApiProperty({ enum: Language, description: "Language filter", required: false })
  @IsOptional()
  @IsEnum(Language)
  language?: Language

  @ApiProperty({ description: "Date from (ISO string)", required: false })
  @IsOptional()
  @IsDateString()
  dateFrom?: string

  @ApiProperty({ description: "Date to (ISO string)", required: false })
  @IsOptional()
  @IsDateString()
  dateTo?: string

  @ApiProperty({ description: "Minimum views", required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minViews?: number

  @ApiProperty({ description: "Sort by field", required: false, default: "createdAt" })
  @IsOptional()
  @IsString()
  sortBy?: string

  @ApiProperty({ description: "Sort order", required: false, enum: ["asc", "desc"], default: "desc" })
  @IsOptional()
  @IsEnum(["asc", "desc"])
  sortOrder?: "asc" | "desc"

  @ApiProperty({ description: "Page number", required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number

  @ApiProperty({ description: "Items per page", required: false, default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number
}
