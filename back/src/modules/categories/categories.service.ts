import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { CreateCategoryDto, SearchCategoryPublic, UpdateCategoryDto } from './dto/category.dto.js';
import slugify = require('slugify');
import { PrismaService } from '../../prisma/prisma.service.js';
import { BreadcrumbItem } from '../products/products.service.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';
import { ConfigService } from '@nestjs/config';
import pagination from '../../common/utils/pagination.js';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * دریافت تمام دسته‌بندی‌های فعال (برای کاربران عادی)
   * ساختار درختی با children
   */
  async findAll() {
    return this.prisma.category.findMany({
      where: { parentId: null, isActive: true },
      select: {
        name: true,
        slug: true,
        icon: true,
        id: true,
        image: true,
        parentId: true,
        sortOrder: true,
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            name: true,
            slug: true,
            icon: true,
            id: true,
            image: true,
            parentId: true,
            sortOrder: true,
            children: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
              select: {
                name: true,
                slug: true,
                icon: true,
                id: true,
                image: true,
                parentId: true,
                sortOrder: true,
              }
            },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findNotChildren(query: SearchCategoryPublic) {
    const { allCategory } = query
    return this.prisma.category.findMany({
      where: {
        ...(allCategory && { parentId: null }),
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findAllAdmin(query: QueryDefaultDto) {
    const { limit, order, page = 1 } = query
    const limitPage = Number(limit) || Number(this.configService.get('limit.category'))
    const [data, count] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        where: { parentId: null },
        include: {
          children: {
            include: {
              _count: { select: { products: true } },
              children: {
                include: {
                  _count: { select: { products: true } },
                },
                orderBy: { sortOrder: 'asc' },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
          _count: { select: { products: true } },
        },
        orderBy: { sortOrder: order },
      }),
      this.prisma.category.count({ where: { parentId: null } }),
    ]);
    return { category: data, pagination: pagination(count, page, limitPage) }
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { children: true, parent: true, _count: { select: { products: true } } },
    });
    if (!category) throw new NotFoundException('دسته‌بندی یافت نشد');
    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findFirst({
      where: { OR: [{ slug }], isActive: true },
      include: {
        children: { where: { isActive: true } },
      },
    });

    if (!category) throw new NotFoundException('دسته‌بندی یافت نشد');
    let breadcrumbs: BreadcrumbItem[] = [];
    if (category.id) {
      const { ancestorIds } = category;
      const parentCategories = await this.prisma.category.findMany({
        where: { id: { in: ancestorIds } },
        select: { id: true, name: true, slug: true },
      });
      const parentMap = new Map(parentCategories.map((c) => [c.id, c]));
      const sortedParents = ancestorIds
        .map((ancestorId) => parentMap.get(ancestorId))
        .filter((item): item is BreadcrumbItem => Boolean(item));
      breadcrumbs = [
        ...sortedParents,
        {
          id: category.id,
          name: category.name,
          slug: category.slug,
        },
      ];
    }
    return { ...category, breadcrumbs };
  }

  async create(dto: CreateCategoryDto) {
    let ancestorIds: string[] = [];

    if (dto.parentId) {
      const parent = await this.prisma.category.findUniqueOrThrow({
        where: { id: dto.parentId },
        select: { ancestorIds: true },
      });
      ancestorIds = [...parent.ancestorIds, dto.parentId];
    }

    // اصلاح شد: اضافه شدن ancestorIds به دیتابیس
    return this.prisma.category.create({
      data: { ...dto, ancestorIds },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true, parentId: true },
    });
    if (!category) throw new NotFoundException('دسته‌بندی یافت نشد');
    const parentChanged =
      dto.parentId !== undefined && (dto.parentId ?? null) !== category.parentId;
    if (!parentChanged) {
      try {
        return await this.prisma.category.update({ where: { id }, data: dto });
      } catch (error) {
        throw this.toUpdateError(error);
      }
    }

    // ───── والد تغییر کرده ─────
    const newParentId = dto.parentId ?? null;

    if (newParentId === id) {
      throw new BadRequestException('نمی‌توان دسته را زیر خودش قرار داد');
    }

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          let newAncestorIds: string[] = [];

          if (newParentId) {
            const parent = await tx.category.findUnique({
              where: { id: newParentId },
              select: { ancestorIds: true },
            });

            if (!parent) {
              throw new NotFoundException('دسته‌ی والد یافت نشد');
            }
            // اگه خودِ این دسته جزو اجداد والد جدید باشه، والد جدید فرزندِ همین دسته‌ست
            if (parent.ancestorIds.includes(id)) {
              throw new BadRequestException('نمی‌توان دسته را زیر فرزندش قرار داد');
            }

            newAncestorIds = [...parent.ancestorIds, newParentId];
          }

          const updated = await tx.category.update({
            where: { id },
            data: { ...dto, parentId: newParentId, ancestorIds: newAncestorIds },
          });

          // مسیر اجداد همه‌ی زیرمجموعه‌ها (فرزند، نوه، ...) رو بازسازی می‌کنیم
          const descendants = await tx.category.findMany({
            where: { ancestorIds: { has: id } },
            select: { id: true, ancestorIds: true },
          });

          for (const d of descendants) {
            const idx = d.ancestorIds.indexOf(id);
            await tx.category.update({
              where: { id: d.id },
              data: { ancestorIds: [...newAncestorIds, id, ...d.ancestorIds.slice(idx + 1)] },
            });
          }

          return updated
        },
        { timeout: 15_000 }, // پیش‌فرض ۵ ثانیه‌ست؛ برای درخت‌های بزرگ کمه
      );
    } catch (error) {
      throw this.toUpdateError(error);
    }
  }

  /** خطای یکتایی اسلاگ (P2002) رو به ۴۰۹ تبدیل می‌کنه؛ بقیه‌ی خطاها دست‌نخورده می‌مونن */
  private toUpdateError(error: unknown): unknown {
    const code =
      typeof error === 'object' && error !== null ? (error as { code?: string }).code : undefined;

    return code === 'P2002'
      ? new ConflictException('این اسلاگ قبلا برای دسته‌ی دیگری استفاده شده است')
      : error;
  }

  /**
   * حذف دسته‌بندی (در صورت نداشتن محصول)
   */
  async delete(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!category) throw new NotFoundException('دسته‌بندی یافت نشد');

    if (category._count.products > 0) {
      // به‌جای حذف، غیرفعال کن
      await this.prisma.category.update({ where: { id }, data: { isActive: false } });
      return { success: true }
    }
    await this.prisma.category.delete({ where: { id } });
    return { success: true }
  }
}
