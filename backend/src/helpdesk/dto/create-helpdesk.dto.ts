import { IsString, IsOptional, IsEnum, IsUUID } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"
import { TicketPriority, TicketCategory } from "@prisma/client"

export class CreateHelpdeskDto {
  @ApiProperty({ description: "Ticket title" })
  @IsString()
  title: string

  @ApiProperty({ description: "Ticket description" })
  @IsString()
  description: string

  @ApiProperty({ enum: TicketPriority, description: "Ticket priority" })
  @IsEnum(TicketPriority)
  priority: TicketPriority

  @ApiProperty({ enum: TicketCategory, description: "Ticket category" })
  @IsEnum(TicketCategory)
  category: TicketCategory

  @ApiProperty({ description: "Department ID", required: false })
  @IsOptional()
  @IsUUID()
  departmentId?: string

  @ApiProperty({ description: "Assignee ID", required: false })
  @IsOptional()
  @IsUUID()
  assigneeId?: string
}
