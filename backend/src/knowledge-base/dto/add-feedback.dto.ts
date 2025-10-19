import { IsBoolean } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class AddFeedbackDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isLike: boolean
}
