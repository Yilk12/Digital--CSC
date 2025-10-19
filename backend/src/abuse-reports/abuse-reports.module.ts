import { Module } from '@nestjs/common';
import { AbuseReportsService } from './abuse-reports.service';
import { AbuseReportsController } from './abuse-reports.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AbuseReportsController],
  providers: [AbuseReportsService, PrismaService],
  exports: [AbuseReportsService],
})
export class AbuseReportsModule {}
