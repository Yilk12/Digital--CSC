import { IsNotEmpty, IsString, IsOptional, IsBoolean } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class CreateCategoryDto {
  @ApiProperty({ example: "Technical Support" })
  @IsNotEmpty()
  @IsString()
  name: string

  @ApiProperty({ example: "ቴክኒካል ድጋፍ", required: false })
  @IsOptional()
  @IsString()
  nameAm?: string

  @ApiProperty({ example: "Category for technical support articles", required: false })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ example: "parent-category-uuid", required: false })
  @IsOptional()
  @IsString()
  parentId?: string

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
