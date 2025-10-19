import { IsNotEmpty, IsString } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class AddCommentDto {
  @ApiProperty({ example: "This article was very helpful!" })
  @IsNotEmpty()
  @IsString()
  content: string
}
