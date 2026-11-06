import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class SettingsService {
  private settingsCache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_DURATION = 2 * 60 * 1000 // 2 minutes
  
  constructor(private readonly prisma: PrismaService) {}

  async listSettings(): Promise<any[]> {
    const cacheKey = "all-settings"
    const cached = this.settingsCache.get(cacheKey)
    
    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }

    // Optimized query with only necessary fields
    const settings = await this.prisma.systemSetting.findMany({
      select: {
        key: true,
        value: true
      },
      orderBy: { key: "asc" },
    })
    
    // Cache the result
    this.settingsCache.set(cacheKey, { data: settings, timestamp: Date.now() })
    
    return settings
  }

  async getSetting(settingKey: string) {
    const cacheKey = `setting-${settingKey}`
    const cached = this.settingsCache.get(cacheKey)
    
    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }

    // Optimized query with only necessary fields
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: settingKey },
      select: {
        key: true,
        value: true
      }
    })
    
    if (!setting) throw new NotFoundException("Setting not found")
    
    // Cache the result
    this.settingsCache.set(cacheKey, { data: setting, timestamp: Date.now() })
    
    return setting
  }

  async upsertSetting(settingKey: string, settingValue: string) {
    const result = await this.prisma.systemSetting.upsert({
      where: { key: settingKey },
      update: { value: settingValue },
      create: { key: settingKey, value: settingValue },
      select: {
        key: true,
        value: true
      }
    })
    
    // Invalidate relevant caches
    this.invalidateCache(settingKey)
    
    return result
  }

  async upsertMany(settings: Record<string, string>) {
    // Optimized batch operation with proper error handling
    const operations = Object.entries(settings).map(([key, value]) =>
      this.prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
        select: {
          key: true,
          value: true
        }
      }),
    )
    
    try {
      await this.prisma.$transaction(operations)
      
      // Invalidate all caches since we're doing bulk updates
      this.invalidateAllCaches()
      
      // Return fresh data
      return this.listSettings()
    } catch (error) {
      // Log error for debugging
      console.error('Bulk upsert operation failed:', error)
      throw error
    }
  }
  
  // Helper methods for cache management
  private invalidateCache(key?: string) {
    if (key) {
      this.settingsCache.delete(`setting-${key}`)
    }
    this.settingsCache.delete("all-settings")
  }
  
  private invalidateAllCaches() {
    this.settingsCache.clear()
  }
  
  // Method to clear cache manually if needed
  clearCache() {
    this.invalidateAllCaches()
  }
}
