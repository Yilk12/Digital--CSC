import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { $Enums, Prisma } from '@prisma/client';

export type CreateSubmissionInput = {
  userId?: string | null;
  submitterName?: string | null;
  submitterDepartment?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  anonymous?: boolean;
  type: $Enums.SubmissionType;
  subject: string;
  description: string;
};

export type GMActionInput = {
  action: 'ACCEPT' | 'REJECT' | 'ESCALATE' | 'MORE_INFO_REQUEST' | 'CLOSE';
  decisionSummary?: string | null;
  assignedDepartmentId?: string | null;
  escalatedTo?: string | null;
  gmReviewerId: string;
};

@Injectable()
export class SubmissionsService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreateSubmissionInput) {
    const data: Prisma.SubmissionCreateInput = {
      user: input.userId ? { connect: { id: input.userId } } : undefined,
      submitterName: input.submitterName ?? null,
      submitterDepartment: input.submitterDepartment ?? null,
      contactEmail: input.contactEmail ?? null,
      contactPhone: input.contactPhone ?? null,
      anonymous: Boolean(input.anonymous),
      type: input.type,
      subject: input.subject,
      description: input.description,
      status: $Enums.SubmissionStatus.SUBMITTED,
    };
    return this.prisma.submission.create({ data });
  }

  async list(params: { type?: $Enums.SubmissionType; status?: $Enums.SubmissionStatus }) {
    const { type, status } = params;
    return this.prisma.submission.findMany({
      where: { type, status },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    const sub = await this.prisma.submission.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('Submission not found');
    return sub;
  }

  async gmAct(id: string, input: GMActionInput) {
    const exists = await this.getById(id);

    let status: $Enums.SubmissionStatus = exists.status;
    switch (input.action) {
      case 'ACCEPT':
        status = $Enums.SubmissionStatus.ACCEPTED;
        break;
      case 'REJECT':
        status = $Enums.SubmissionStatus.REJECTED;
        break;
      case 'ESCALATE':
        status = $Enums.SubmissionStatus.ESCALATED;
        break;
      case 'MORE_INFO_REQUEST':
        status = $Enums.SubmissionStatus.MORE_INFO_REQUESTED;
        break;
      case 'CLOSE':
        status = $Enums.SubmissionStatus.CLOSED;
        break;
    }

    return this.prisma.submission.update({
      where: { id },
      data: {
        status,
        decisionSummary: input.decisionSummary ?? null,
        decisionAt: new Date(),
        gmReviewer: { connect: { id: input.gmReviewerId } },
        assignedDepartment: input.assignedDepartmentId ? { connect: { id: input.assignedDepartmentId } } : undefined,
        escalatedTo: input.escalatedTo ?? null,
      },
    });
  }
}
