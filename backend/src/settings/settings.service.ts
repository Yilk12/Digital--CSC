import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async listSettings() {
    return this.prisma.systemSetting.findMany({
      orderBy: { key: "asc" },
    })
  }

  async getSetting(settingKey: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: settingKey },
    })
    if (!setting) throw new NotFoundException("Setting not found")
    return setting
  }

  async upsertSetting(settingKey: string, settingValue: string) {
    return this.prisma.systemSetting.upsert({
      where: { key: settingKey },
      update: { value: settingValue },
      create: { key: settingKey, value: settingValue },
    })
  }

  async upsertMany(settings: Record<string, string>) {
    const operations = Object.entries(settings).map(([key, value]) =>
      this.prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      }),
    )
    await this.prisma.$transaction(operations)
    return this.listSettings()
  }
}
