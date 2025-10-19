import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { FleetService } from './fleet.service'
import { FleetController } from './fleet.controller'

@Module({
  imports: [PrismaModule],
  controllers: [FleetController],
  providers: [FleetService],
  exports: [FleetService],
})
export class FleetModule {}
