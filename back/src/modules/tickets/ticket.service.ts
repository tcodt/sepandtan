/**
 * TicketService - مدیریت تیکت‌ها و پیام‌های تیکت
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateTicketDto, QueryTicketsDto, UpdateTicketDto } from './dto/create-ticket.dto.js';
import { CreateTicketMessageDto } from './dto/create-ticket-message.dto.js';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';
import pagination from '../../common/utils/pagination.js';

@Injectable()
export class TicketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) { }

  /**
   * ایجاد تیکت جدید
   */
  async create(userId: string, dto: CreateTicketDto) {

    await this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({
        data: {
          title: dto.title,
          priority: dto.priority,
          trackingCode: `TICKET-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          userId,
          orderId: dto.orderId || undefined,
          isUserRead: true,
          status: 'PENDING',
        },
      })
      await tx.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          content: dto.content,
          senderId: userId,
          ...(dto.images?.length && {
            images: {
              connect: dto.images.map((i) => ({ url: i }))
            }
          })
        }
      })
    })
    return { suceess: true }
  }


  /**
   * Updates ticket
   */
  async update(id: string, dto: UpdateTicketDto, userId: string, role: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('تیکت یافت نشد');

    // Check access control
    if ((role !== 'ADMIN' || 'SUPERADMIN') && ticket.userId !== userId) {
      throw new BadRequestException('دسترسی ندارید');
    }

    const data: any = {};
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.isUserRead !== undefined) data.isUserRead = dto.isUserRead;

    if (Object.keys(data).length === 0) {
      return ticket; // No changes
    }

    return this.prisma.ticket.update({
      where: { id },
      data,
      include: { user: { select: { id: true, username: true } } },
    });
  }

  /**
   * GetUser's tickets with pagination
   */
  async getUserTickets(userId: string, query: QueryTicketsDto) {
    const { page = 1, limit = 10, status, priority } = query;
    const skip = (page - 1) * limit;
    const where: any = { userId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          order: { select: { id: true, orderNumber: true, totalPrice: true } },
        },
        skip, take: limit, orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      tickets,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get all tickets (admin/seller view)
   */
  async getAllTickets(userId: string, query: QueryTicketsDto) {
    const { page = 1, limit, status, priority, order, search } = query;
    const limitPage = Number(limit) || Number(this.configService.get('limit.ticket'))
    const skip = (page - 1) * limitPage;
    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (priority && priority !== "ALL") where.priority = priority;
    if (search) where.trackingCode = { contains: search, mode: 'insensitive' }
    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, firstName: true, lastName: true, store: { select: { name: true } } } },
          order: { select: { id: true, orderNumber: true, totalPrice: true, status: true } },
        },
        skip, take: limitPage, orderBy: { createdAt: order },

      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      tickets,
      pagination: pagination(total, page, limitPage),
    };
  }

  /**
   * Get single ticket by ID
   */
  async findOne(id: string, userId: string, role: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, role: true, firstName: true, lastName: true, phone: true } },
        order: { select: { id: true, orderNumber: true, totalPrice: true } },
        ticketMessages: {
          include: {
            images: { select: { url: true, id: true } },
            sender: { select: { id: true, username: true, role: true } }
          }, orderBy: { createdAt: 'asc' }
        },
      },
    });

    if (!ticket) throw new NotFoundException('تیکت یافت نشد');

    // Check user has access to this ticket
    if (role !== "admin" && ticket.userId !== userId) {
      throw new BadRequestException('دسترسی ندارید');
    }

    return ticket;
  }

  /**
   * Create new message for a ticket
   */
  async createMessage(ticketId: string, dto: CreateTicketMessageDto, senderId: string, role: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('تیکت یافت نشد');
    if (role !== "admin" && ticket.userId !== senderId) {
      throw new BadRequestException('دسترسی ندارید');
    }
    await this.prisma.$transaction(async (tx) => {
      if (role === "admin") {
        await tx.ticket.update({
          where: { id: ticketId },
          data: {
            isUserRead: false,
            status: 'WAITING',
          }
        });
      }
      if (role === "buyer") {
        await tx.ticket.update({
          where: { id: ticketId },
          data: {
            isUserRead: true,
            status: 'PENDING',
          }
        });
      }
      await tx.ticketMessage.create({
        data: {
          content: dto.content,
          ticketId,
          senderId,
          ...(dto.images?.length && {
            images: {
              connect: dto.images.map((i) => ({ url: i }))
            }
          })
        }
      });
    })
    return { suceess: true }
  }

  /**
   * Mark ticket as read for user
   */
  async markAsRead(ticketId: string, userId: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId, userId } });
    if (!ticket) throw new NotFoundException('تیکت یافت نشد یا دسترسی ندارید');

    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { isUserRead: true },
    });
  }

  /**
   * Statistics for admin
   */
  async getStats() {
    const total = await this.prisma.ticket.count();
    const pending = await this.prisma.ticket.count({ where: { status: 'PENDING' } });
    const waiting = await this.prisma.ticket.count({ where: { status: 'WAITING' } });
    const resolved = await this.prisma.ticket.count({ where: { status: 'RESOLVED' } });
    const closed = await this.prisma.ticket.count({ where: { status: 'CLOSED' } });

    return { total, pending, waiting, resolved, closed };
  }

  async deleteTicket(id: string) {
    await this.prisma.ticket.delete({ where: { id } })
    return { success: true };
  }
}