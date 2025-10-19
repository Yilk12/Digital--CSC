import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// Use local enum-like string unions to avoid depending on Prisma enum exports

const REPORT_STATUS = ['PENDING', 'RESOLVED', 'REJECTED'] as const;
type ReportStatus = typeof REPORT_STATUS[number];

const REPORT_TARGET_TYPES = ['USER', 'ARTICLE', 'TICKET', 'POST', 'COMMENT'] as const;
type ReportTargetType = typeof REPORT_TARGET_TYPES[number];

interface CreateParams {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  description?: string;
}

interface ListParams {
  status?: ReportStatus;
  targetType?: ReportTargetType;
  reporterId?: string;
}

@Injectable()
export class AbuseReportsService {
  constructor(private prisma: PrismaService) {}

  async create(params: CreateParams) {
    try {
      const report = await this.prisma.abuseReport.create({
        data: {
          reporterId: params.reporterId,
          targetType: params.targetType,
          targetId: params.targetId,
          reason: params.reason,
          description: params.description,
        },
      });
      return report;
    } catch (e: any) {
      if (String(e?.message || '').includes('uniq_open_report_per_target')) {
        throw new ForbiddenException('Duplicate pending report exists');
      }
      throw e;
    }
  }

  async list(params: ListParams) {
    return this.prisma.abuseReport.findMany({
      where: {
        status: params.status,
        targetType: params.targetType,
        reporterId: params.reporterId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: ReportStatus, actorId: string) {
    const existing = await this.prisma.abuseReport.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Report not found');

    const updated = await this.prisma.abuseReport.update({
      where: { id },
      data: { status },
    });

    // TODO: audit log and notifications
    await this.prisma.auditLog.create({
      data: {
        action: 'abuse_report_status_update',
        entity: 'abuse_report',
        entityId: id,
        userId: actorId,
        oldValues: { status: existing.status },
        newValues: { status },
      },
    }).catch(() => null);

    return updated;
  }
}