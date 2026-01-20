import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Announcements')
@Controller('announcements')
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new announcement' })
  create(@Body() dto: CreateAnnouncementDto) {
    return this.announcementService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get announcements with pagination and optional search' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'maintenance' })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
  ) {
    const pageNum = Number(page);
    const limitNum = Number(limit);
    return this.announcementService.findAll(pageNum, limitNum, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single announcement by ID' })
  findOne(@Param('id') id: string) {
    return this.announcementService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing announcement' })
  update(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.announcementService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an announcement' })
  remove(@Param('id') id: string) {
    return this.announcementService.remove(id);
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Increment like count' })
  like(@Param('id') id: string) {
    return this.announcementService.like(id);
  }

  @Post(':id/dislike')
  @ApiOperation({ summary: 'Increment dislike count' })
  dislike(@Param('id') id: string) {
    return this.announcementService.dislike(id);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'List comments for an announcement' })
  findComments(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.announcementService.listComments(id, Number(page) || 1, Number(limit) || 10);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment to an announcement' })
  addComment(
    @Param('id') id: string,
    @Body() body: { content: string; authorId?: string },
  ) {
    return this.announcementService.addComment(id, body?.content, body?.authorId);
  }
}
