import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min, IsIn } from "class-validator";
import { type $Enums, FeedbackType, UserRole } from "@prisma/client";

export class CreateFeedbackDto {
  @ApiProperty({ enum: FeedbackType }) // runtime enum object
  @IsEnum(FeedbackType)
  type!: $Enums.FeedbackType; // type

  @ApiProperty({ description: "Department ID", format: "uuid" })
  @IsUUID()
  departmentId!: string;

  @ApiPropertyOptional({ description: "Article ID if KB feedback", format: "uuid" })
  @IsOptional()
  @IsUUID()
  articleId?: string;

  @ApiPropertyOptional({ description: "Ticket ID if ticket feedback", format: "uuid" })
  @IsOptional()
  @IsUUID()
  ticketId?: string;

  @ApiPropertyOptional({ description: "Likert scale 1-5" })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: "Helpful binary" })
  @IsOptional()
  @IsBoolean()
  helpful?: boolean;

  @ApiPropertyOptional({ description: "Free-form comments" })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiPropertyOptional({ description: "Attachment path (server-side)" })
  @IsOptional()
  @IsString()
  attachmentPath?: string;

  @ApiPropertyOptional({ description: "Submit anonymously" })
  @IsOptional()
  @IsBoolean()
  anonymous?: boolean;

  @ApiPropertyOptional({
    enum: UserRole,
    description: "Role of submitter (used if anonymous or no session)",
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: $Enums.UserRole;

  // Role-specific fields
  @ApiPropertyOptional({ description: "Was the solution clear?" })
  @IsOptional()
  @IsBoolean()
  experienceClarity?: boolean;

  @ApiPropertyOptional({ description: "Was the issue solved?" })
  @IsOptional()
  @IsBoolean()
  resolutionOutcome?: boolean;

  @ApiPropertyOptional({ description: "Impact on team performance" })
  @IsOptional()
  @IsString()
  departmentImpact?: string;

  @ApiPropertyOptional({ description: "Process/training improvements suggested" })
  @IsOptional()
  @IsString()
  processTrainingImprovements?: string;

  @ApiPropertyOptional({ description: "Strategic impact on business" })
  @IsOptional()
  @IsString()
  strategicImpact?: string;

  @ApiPropertyOptional({ enum: ["LOW", "MEDIUM", "HIGH"] })
  @IsOptional()
  @IsIn(["LOW", "MEDIUM", "HIGH"] as const)
  escalationPriority?: $Enums.EscalationPriority;
}
