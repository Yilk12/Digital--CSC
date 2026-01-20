import {
  Controller,
  Get,
  Post as HttpPost,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common'
import { ApiBearerAuth, ApiConsumes, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger'
import { FilesInterceptor } from '@nestjs/platform-express'
import { AdvertisementsService } from './advertisements.service'
import { CreateAdvertisementDto } from './dto/create-advertisement.dto'
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '@prisma/client'

@ApiTags('Advertisements')
@Controller('advertisements')
export class AdvertisementsController {
  constructor(private readonly service: AdvertisementsService) {}

  // Public list with filters
  @Get()
  @ApiOperation({ summary: 'List advertisements' })
  @ApiOkResponse({ description: 'List of advertisements' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'sort', required: false, enum: ['newest', 'oldest'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  list(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('sort') sort?: 'newest' | 'oldest',
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 12,
  ) {
    return this.service.list({ q, category, sort, page: Number(page) || 1, pageSize: Number(pageSize) || 12 })
  }

  // Public get one
  @Get(':id')
  @ApiOperation({ summary: 'Get advertisement by id' })
  @ApiParam({ name: 'id' })
  getOne(@Param('id') id: string) {
    return this.service.getOne(id)
  }

  // Agents create
  @HttpPost()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_AGENT, UserRole.Department_Head)
  @ApiOperation({ summary: 'Create advertisement' })
  create(@Body() dto: CreateAdvertisementDto) {
    return this.service.create(dto)
  }

  // Agents update
  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_AGENT, UserRole.Department_Head)
  @ApiOperation({ summary: 'Update advertisement' })
  @ApiParam({ name: 'id' })
  update(@Param('id') id: string, @Body() dto: UpdateAdvertisementDto) {
    return this.service.update(id, dto)
  }

  // Agents remove
  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_AGENT, UserRole.Department_Head)
  @ApiOperation({ summary: 'Remove advertisement' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }

  // Attachments upload
  @HttpPost(':id/attachments')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_AGENT, UserRole.Department_Head)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({ summary: 'Upload attachments for advertisement' })
  upload(@Param('id') id: string, @UploadedFiles() files: Express.Multer.File[]) {
    return this.service.addAttachments(id, files || [])
  }

  // Public interactions: like/share
  @HttpPost(':id/like')
  @ApiOperation({ summary: 'Increment like count for advertisement' })
  like(@Param('id') id: string) {
    return this.service.like(id)
  }

  @HttpPost(':id/share')
  @ApiOperation({ summary: 'Increment share count for advertisement' })
  share(@Param('id') id: string) {
    return this.service.share(id)
  }

  // Public comments
  @Get(':id/comments')
  @ApiOperation({ summary: 'List comments for advertisement' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  comments(@Param('id') id: string, @Query('page') page?: number, @Query('pageSize') pageSize?: number) {
    return this.service.listComments(id, Number(page) || 1, Number(pageSize) || 10)
  }

  @HttpPost(':id/comments')
  @ApiOperation({ summary: 'Add a comment for advertisement' })
  addComment(@Param('id') id: string, @Body() body: { text: string; author?: string }) {
    return this.service.addComment(id, body?.text, body?.author)
  }

  @Patch(':id/comments/:commentId')
  @ApiOperation({ summary: 'Update a comment for advertisement' })
  updateComment(@Param('id') id: string, @Param('commentId') commentId: string, @Body() body: { text: string }) {
    return this.service.updateComment(id, commentId, body?.text)
  }

  @Delete(':id/comments/:commentId')
  @ApiOperation({ summary: 'Delete a comment for advertisement' })
  deleteComment(@Param('id') id: string, @Param('commentId') commentId: string) {
    return this.service.deleteComment(id, commentId)
  }
}

