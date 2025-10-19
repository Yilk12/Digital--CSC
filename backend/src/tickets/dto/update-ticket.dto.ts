import { PartialType } from "@nestjs/swagger"
import { IsEnum, IsOptional } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"
import { CreateTicketDto } from "./create-ticket.dto"
import { TicketStatus } from "@prisma/client"
import { i18nValidationMessage } from 'nestjs-i18n'

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @ApiProperty({ enum: TicketStatus, required: false })
  @IsOptional()
  @IsEnum(TicketStatus, { message: i18nValidationMessage('validation.ENUM') })
  status?: TicketStatus
}
