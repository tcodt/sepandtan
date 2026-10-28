import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CountrySearchDto, CreateCountryDto, UpdateCountryDto } from './dto/country.dto.js';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';
import pagination from '../../common/utils/pagination.js';

@Injectable()
export class CountriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) { }

  async findAll() {
    return this.prisma.countries.findMany({
      select: { id: true, name: true, slug: true, flag: true },
      orderBy: { name: 'asc' },
    });
  }

  async findAllAdmin(query: CountrySearchDto) {
    const { search, limit, order, page = 1 } = query;
    const limitPage = Number(limit) || Number(this.configService.get('limit.color'));
    const skip = (Number(page) - 1) * limitPage;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [countries, total] = await this.prisma.$transaction([
      this.prisma.countries.findMany({
        where,
        skip,
        take: limitPage,
        orderBy: { name: 'asc' },
        include: { _count: { select: { products: true } } },
      }),
      this.prisma.countries.count({ where })
    ]);
    return {
      countries,
      pagination: pagination(total, page, limitPage),
    }
  }

  async create(dto: CreateCountryDto) {
    await this.prisma.countries.create({
      data: { ...dto },
    });
    return { success: true }
  }

  async update(id: string, dto: UpdateCountryDto) {
    const country = await this.prisma.countries.findUnique({ where: { id } });
    if (!country) throw new NotFoundException('کشور یافت نشد');
    const data: any = { ...dto };
    await this.prisma.countries.update({ where: { id }, data });
    return { success: true }
  }

  async delete(id: string) {
    const country = await this.prisma.countries.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!country) throw new NotFoundException('کشور یافت نشد');

    if (country._count.products > 0) {
      throw new BadRequestException(
        `امکان حذف این کشور وجود ندارد زیرا ${country._count.products} محصول به آن متصل است.`
      );
    }

    return this.prisma.countries.delete({ where: { id } });
  }
}