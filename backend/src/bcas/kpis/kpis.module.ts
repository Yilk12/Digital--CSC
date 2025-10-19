import { Module } from '@nestjs/common'
import { KpisService } from './kpis.service'
import { KpisController } from './kpis.controller'
import { PrismaService } from '../../prisma/prisma.service'

@Module({
  controllers: [KpisController],
  providers: [KpisService, PrismaService],
  exports: [KpisService],
})
export class KpisModule {}
