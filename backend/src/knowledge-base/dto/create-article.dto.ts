import { IsNotEmpty, IsEnum, IsOptional, IsString, IsArray, IsDateString } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"
import { ArticleStatus, Language } from "@prisma/client"
import { i18nValidationMessage } from 'nestjs-i18n'

export class CreateArticleDto {
  @ApiProperty({ example: "How to Reset Your Password" })
  @IsNotEmpty({ message: i18nValidationMessage('validation.REQUIRED') })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  title: string

  @ApiProperty({ example: "የይለፍ ቃልዎን እንዴት እንደሚዳግሙ", required: false })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  titleAm?: string

  @ApiProperty({ example: "Detailed article content..." })
  @IsNotEmpty({ message: i18nValidationMessage('validation.REQUIRED') })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  content: string

  @ApiProperty({ example: "የዝርዝር ጽሑፍ ይዘት...", required: false })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  contentAm?: string

  @ApiProperty({ example: "Brief description of the article", required: false })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  excerpt?: string

  @ApiProperty({ enum: ArticleStatus, example: ArticleStatus.DRAFT })
  @IsEnum(ArticleStatus, { message: i18nValidationMessage('validation.ENUM') })
  status: ArticleStatus

  @ApiProperty({ enum: Language, example: Language.EN })
  @IsEnum(Language, { message: i18nValidationMessage('validation.ENUM') })
  language: Language

  @ApiProperty({ example: "category-uuid", required: false })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  categoryId?: string

  @ApiProperty({ example: ["password", "reset", "security"], required: false })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage('validation.IS_ARRAY') })
  @IsString({ each: true, message: i18nValidationMessage('validation.IS_STRING') })
  tags?: string[]

  @ApiProperty({ example: "2024-12-31T23:59:59Z", required: false })
  @IsOptional()
  @IsDateString({}, { message: i18nValidationMessage('validation.IS_DATE') })
  expiresAt?: string
}
