import { IsString, IsOptional, IsEnum, IsDateString, IsObject } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class GenerateReportDto {
  @ApiProperty({ description: "Report start date (ISO string)" })
  @IsDateString()
  dateFrom: string

  @ApiProperty({ description: "Report end date (ISO string)" })
  @IsDateString()
  dateTo: string

  @ApiProperty({ 
    enum: ["csv", "xlsx", "pdf", "json"], 
    description: "Report format",
    default: "xlsx"
  })
  @IsEnum(["csv", "xlsx", "pdf", "json"])
  format: "csv" | "xlsx" | "pdf" | "json"

  @ApiProperty({ description: "Additional filters for the report", required: false })
  @IsOptional()
  @IsObject()
  filters?: {
    status?: string
    priority?: string
    categoryId?: string
    departmentId?: string
    assigneeId?: string
    [key: string]: any
  }

  @ApiProperty({ description: "Report title", required: false })
  @IsOptional()
  @IsString()
  title?: string

  @ApiProperty({ description: "Report description", required: false })
  @IsOptional()
  @IsString()
  description?: string
}
