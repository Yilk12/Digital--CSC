import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { CreateCommentDto } from "./dto/create-comment.dto"

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(ticketId: string, createCommentDto: CreateCommentDto, authorId: string) {
    return this.prisma.ticketComment.create({
      data: {
        ...createCommentDto,
        ticketId,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    })
  }

  async findByTicket(ticketId: string) {
    return this.prisma.ticketComment.findMany({
      where: { ticketId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    })
  }

  async update(id: string, content: string) {
    return this.prisma.ticketComment.update({
      where: { id },
      data: { content },
    })
  }

  async remove(id: string) {
    return this.prisma.ticketComment.delete({
      where: { id },
    })
  }
}
