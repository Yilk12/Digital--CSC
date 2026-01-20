import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAnnouncementDto) {
    const announcement = await this.prisma.announcement.create({
      data: {
        title: dto.title,
        description: dto.description,
        date: new Date(dto.date),
        imageUrl: dto.imageUrl,
        status: dto.status || 'published',
        category: dto.category || 'General',
      },
    });

    // After creating an announcement, notify all active users.
    try {
      const users = await this.prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      if (users.length) {
        await this.prisma.allNotification.createMany({
          data: users.map((u) => ({
            userId: u.id,
            message: 'announcement has posted',
          })),
          skipDuplicates: true,
        });
      }
    } catch (e) {
      // Notification failure should not block announcement creation
      console.error('Failed to create announcement notifications:', e);
    }

    return announcement;
  }

  async findAll(page = 1, limit = 10, search?: string, status?: string, category?: string) {
    const skip = (page - 1) * limit;

    // Build where condition dynamically
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });
    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }
    return announcement;
  }

  async update(id: string, dto: UpdateAnnouncementDto) {
    await this.findOne(id); // ensure it exists
    return this.prisma.announcement.update({
      where: { id },
      data: { ...dto },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.announcement.delete({
      where: { id },
    });
  }

  async like(id: string) {
    return this.prisma.announcement.update({
      where: { id },
      data: { likeCount: { increment: 1 } },
    });
  }

  async dislike(id: string) {
    return this.prisma.announcement.update({
      where: { id },
      data: { dislikeCount: { increment: 1 } },
    });
  }

  async listComments(announcementId: string, page = 1, limit = 10) {
    await this.findOne(announcementId);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.announcementComment.findMany({
        where: { announcementId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { author: true },
      }),
      this.prisma.announcementComment.count({ where: { announcementId } }),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
      },
    };
  }

  async addComment(announcementId: string, content: string, authorId?: string) {
    const text = (content || '').trim();
    if (!text) {
      throw new NotFoundException('Comment text required');
    }

    await this.findOne(announcementId);

    return this.prisma.announcementComment.create({
      data: {
        announcementId,
        content: text,
        authorId,
      },
    });
  }
}