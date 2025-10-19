import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async listSettings() {
    return this.prisma.systemSetting.findMany({
      orderBy: { settingKey: "asc" },
    })
  }

  async getSetting(settingKey: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { settingKey },
    })
    if (!setting) throw new NotFoundException("Setting not found")
    return setting
  }

  async upsertSetting(settingKey: string, settingValue: string) {
    return this.prisma.systemSetting.upsert({
      where: { settingKey },
      update: { settingValue },
      create: { settingKey, settingValue },
    })
  }

  async upsertMany(settings: Record<string, string>) {
    const operations = Object.entries(settings).map(([key, value]) =>
      this.prisma.systemSetting.upsert({
        where: { settingKey: key },
        update: { settingValue: value },
        create: { settingKey: key, settingValue: value },
      }),
    )
    await this.prisma.$transaction(operations)
    return this.listSettings()
  }
}


