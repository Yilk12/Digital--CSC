import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AbuseReportsService } from './abuse-reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const REPORT_STATUS = ['PENDING', 'RESOLVED', 'REJECTED'] as const;
type ReportStatus = typeof REPORT_STATUS[number];
const REPORT_TARGET_TYPES = ['USER', 'ARTICLE', 'TICKET', 'POST', 'COMMENT'] as const;
type ReportTargetType = typeof REPORT_TARGET_TYPES[number];

class CreateAbuseReportDto {
  @IsOptional()
  @IsString()
  reporterId?: string;

  @IsIn(REPORT_TARGET_TYPES as readonly string[])
  targetType!: ReportTargetType;

  @IsString()
  targetId!: string;

  @IsString()
  @MaxLength(256)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

class UpdateAbuseReportStatusDto {
  @IsIn(REPORT_STATUS as readonly string[])
  status!: ReportStatus;
}

@ApiTags('Abuse Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('abuse-reports')
export class AbuseReportsController {
  constructor(private readonly service: AbuseReportsService) {}

  @ApiOperation({ summary: 'Create a new abuse report' })
  @Post()
  async create(@Request() req, @Body() dto: CreateAbuseReportDto) {
    const reporterId = req.user.id || req.user.userId || dto.reporterId;
    return this.service.create({ ...dto, reporterId });
  }

  @ApiOperation({ summary: 'List abuse reports (admin/staff_manager only)' })
  @Roles('ADMIN', 'Department_Head')
  @Get()
  async list(
    @Query('status') status?: ReportStatus,
    @Query('targetType') targetType?: ReportTargetType,
    @Query('reporterId') reporterId?: string,
  ) {
    return this.service.list({ status, targetType, reporterId });
  }

  @ApiOperation({ summary: 'Update abuse report status (admin/staff_manager only)' })
  @Roles('ADMIN', 'Department_Head')
  @Patch(':id')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateAbuseReportStatusDto, @Request() req) {
    const actorId = req.user.id || req.user.userId;
    return this.service.updateStatus(id, dto.status, actorId);
  }
}
