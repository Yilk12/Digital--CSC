import { IsNotEmpty, IsString, IsBoolean, IsOptional } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"
import { i18nValidationMessage } from 'nestjs-i18n'

export class CreateCommentDto {
  @ApiProperty({ example: "I am experiencing the same issue." })
  @IsNotEmpty({ message: i18nValidationMessage('validation.REQUIRED') })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  content: string

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  isInternal?: boolean
}
