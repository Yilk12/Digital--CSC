import { Controller, Get, Param, Patch, Body, UseGuards, Post } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger"
import { SettingsService } from "./settings.service"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"
import { UserRole } from "@prisma/client"
import { DEFAULT_SETTINGS } from "./defaults"

@ApiTags("System Settings")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @ApiOperation({ summary: "List all settings" })
  @Get()
  list() {
    return this.settingsService.listSettings()
  }

  @ApiOperation({ summary: "Get a single setting by key" })
  @Get(":key")
  get(@Param("key") key: string) {
    return this.settingsService.getSetting(key)
  }

  @ApiOperation({ summary: "Create or update a setting" })
  @Patch(":key")
  upsert(@Param("key") key: string, @Body("value") value: string) {
    return this.settingsService.upsertSetting(key, value)
  }

  @ApiOperation({ summary: "Bulk upsert settings" })
  @Post("bulk")
  bulk(@Body() payload: Record<string, string>) {
    return this.settingsService.upsertMany(payload)
  }

  @ApiOperation({ summary: "Seed default settings" })
  @Post("seed-defaults")
  seedDefaults() {
    return this.settingsService.upsertMany(DEFAULT_SETTINGS)
  }
}


