import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SubmissionsService, CreateSubmissionInput, GMActionInput } from './submissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { $Enums } from '@prisma/client';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

class CreateSubmissionDto {
  @IsOptional() @IsString() submitterName?: string;
  @IsOptional() @IsString() submitterDepartment?: string;
  @IsOptional() @IsEmail() contactEmail?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsBoolean() anonymous?: boolean;

  @IsEnum($Enums.SubmissionType) type!: $Enums.SubmissionType;
  @IsString() @MaxLength(200) subject!: string;
  @IsString() @MaxLength(5000) description!: string;
}

class GMActionDto {
  @IsEnum(['ACCEPT','REJECT','ESCALATE','MORE_INFO_REQUEST','CLOSE'] as any) action!: GMActionInput['action'];
  @IsOptional() @IsString() @MaxLength(2000) decisionSummary?: string;
  @IsOptional() @IsString() assignedDepartmentId?: string;
  @IsOptional() @IsString() escalatedTo?: string;
}

@ApiTags('Submissions')
@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly service: SubmissionsService) {}

  @ApiOperation({ summary: 'Create a complaint/suggestion (anonymous or authenticated)' })
  @Post()
  async create(@Request() req, @Body() dto: CreateSubmissionDto) {
    const maybeUserId = req?.user?.id || req?.user?.userId || null;
    const input: CreateSubmissionInput = {
      userId: dto.anonymous ? null : maybeUserId,
      submitterName: dto.submitterName,
      submitterDepartment: dto.submitterDepartment,
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone,
      anonymous: Boolean(dto.anonymous),
      type: dto.type,
      subject: dto.subject,
      description: dto.description,
    };
    return this.service.create(input);
  }

  @ApiOperation({ summary: 'List submissions (GM/Admin only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GENERAL_DIRECTOR','ADMIN')
  @Get()
  async list(
    @Query('type') type?: $Enums.SubmissionType,
    @Query('status') status?: $Enums.SubmissionStatus,
  ) {
    return this.service.list({ type, status });
  }

  @ApiOperation({ summary: 'GM/Admin action on a submission' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GENERAL_DIRECTOR','ADMIN')
  @Patch(':id')
  async gmAct(@Param('id') id: string, @Body() dto: GMActionDto, @Request() req) {
    const gmReviewerId = req.user.id || req.user.userId;
    const input: GMActionInput = {
      action: dto.action,
      decisionSummary: dto.decisionSummary,
      assignedDepartmentId: dto.assignedDepartmentId,
      escalatedTo: dto.escalatedTo,
      gmReviewerId,
    };
    return this.service.gmAct(id, input);
  }
}
