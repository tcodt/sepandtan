import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateColorDto, UpdateColorDto } from './dto/color.dto.js';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ColorSearchDto } from './dto/color.search.dto.js';
import pagination from '../../common/utils/pagination.js';

@Injectable()
export class ColorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) { }

  async findAll() {
    return this.prisma.color.findMany({
      select: { id: true, name: true, hexCode: true, slug: true },
      orderBy: { name: 'asc' },
    });
  }

  async findAllAdmin(query: ColorSearchDto) {
    const { search, limit, order, page = 1 } = query
    const limitPage = Number(limit) || Number(this.configService.get('limit.color'))
    const skip = (Number(page) - 1) * limitPage;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [colors, total] = await this.prisma.$transaction([
      this.prisma.color.findMany({
        where,
        skip,
        take: limitPage,
        orderBy: { createdAt: order },
        include: { _count: { select: { productVariants: true } } },
      }),
      this.prisma.color.count({ where })
    ]);
    return {
      colors,
      pagination: pagination(total, page, limitPage),
    }
  }

  async create(dto: CreateColorDto) {
    await this.prisma.color.create({
      data: { ...dto },
    });
    return { success: true }
  }

  async update(id: string, dto: UpdateColorDto) {
    const color = await this.prisma.color.findUnique({ where: { id } });
    if (!color) throw new NotFoundException('رنگ یافت نشد');
    const data: any = { ...dto };
    await this.prisma.color.update({ where: { id }, data });
    return { success: true }
  }

  async delete(id: string) {
    const color = await this.prisma.color.findUnique({
      where: { id },
      include: { _count: { select: { productVariants: true } } },
    });
    if (!color) throw new NotFoundException('رنگ یافت نشد');

    if (color._count.productVariants > 0) {
      throw new BadRequestException(
        `امکان حذف این رنگ وجود ندارد زیرا ${color._count.productVariants} محصول به آن متصل است.`
      );
    }

    return this.prisma.color.delete({ where: { id } });
  }
}