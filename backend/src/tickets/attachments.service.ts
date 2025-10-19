import { Injectable } from "@nestjs/common"
import  { PrismaService } from "../prisma/prisma.service"
import  { Express } from "express"

@Injectable()
export class AttachmentsService {
  constructor(private prisma: PrismaService) {}

  async createMultiple(ticketId: string, files: Express.Multer.File[]) {
    const attachments = files.map((file) => ({
      ticketId,
      filename: file.originalname,
      filepath: file.path,
      mimetype: file.mimetype,
      size: file.size,
    }))

    return this.prisma.ticketAttachment.createMany({
      data: attachments,
    })
  }

  async findByTicket(ticketId: string) {
    return this.prisma.ticketAttachment.findMany({
      where: { ticketId },
      orderBy: { createdAt: "desc" },
    })
  }

  async remove(id: string) {
    return this.prisma.ticketAttachment.delete({
      where: { id },
    })
  }
}
