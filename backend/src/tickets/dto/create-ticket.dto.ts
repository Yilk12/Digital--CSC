import { IsNotEmpty, IsEnum, IsOptional, IsString, MaxLength } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"
import { TicketPriority, TicketCategory } from "@prisma/client"
import { i18nValidationMessage } from 'nestjs-i18n'

export class CreateTicketDto {
  @ApiProperty({ example: "Unable to access email system" })
  @IsNotEmpty({ message: i18nValidationMessage('validation.REQUIRED') })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MaxLength(200, { message: i18nValidationMessage('validation.MAX_LENGTH', { length: 200 }) })
  title: string

  @ApiProperty({ example: "Detailed description of the issue..." })
  @IsNotEmpty({ message: i18nValidationMessage('validation.REQUIRED') })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  description: string

  @ApiProperty({ enum: TicketPriority, example: TicketPriority.MEDIUM })
  @IsEnum(TicketPriority, { message: i18nValidationMessage('validation.ENUM') })
  priority: TicketPriority

  @ApiProperty({ enum: TicketCategory, example: TicketCategory.INCIDENT })
  @IsEnum(TicketCategory, { message: i18nValidationMessage('validation.ENUM') })
  category: TicketCategory

  @ApiProperty({ example: "dept-uuid", required: false })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  departmentId?: string

  @ApiProperty({ example: "agent-uuid", required: false })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  assigneeId?: string

  @ApiProperty({ example: "Finance", required: false })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  departmentName?: string
}
