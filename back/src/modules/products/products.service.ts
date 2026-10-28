/**
 * ProductsService - سرویس مدیریت محصولات
 * CRUD کامل، مدیریت وضعیت، جستجو و فیلتر
 */
import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { CreateProductDto, UpdateProductDto, ProductFilterDto, ProductSearchDto } from './dto/product.dto.js';
import slugifyLib = require('slugify');
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';
import { DefaultStatus, Prisma } from '../../generated/prisma/client.js';
import pagination from '../../common/utils/pagination.js';

export const productSelector: Prisma.ProductSelect = {
  id: true, title: true, slug: true, categoryId: true,
  status: true, updatedAt: true,
  isFeatured: true, viewCount: true, saleCount: true, rating: true,
  reviewCount: true, storeId: true, brandId: true,
  originalPrice: true, minPrice: true, discountPercent: true,
  brand: { select: { name: true, slug: true } },
  images: { select: { alt: true, sortOrder: true, url: true }, take: 1, orderBy: { sortOrder: 'asc' } },
  category: { select: { name: true, icon: true, slug: true } },
}

export interface BreadcrumbItem {
  id: string;
  name: string;
  slug: string;
}
@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) { }

  async findAll(filters: ProductFilterDto) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || Number(this.configService.get('limit.product'));
    const skip = (page - 1) * limit;
    const where: Prisma.ProductWhereInput = { status: filters.status || 'APPROVED' };

    if (filters.category) where.categoryId = filters.category;
    if (filters.seller) where.storeId = filters.seller;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.minPrice = {
        ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
        ...(filters.maxPrice !== undefined && { lte: filters.maxPrice }),
      };
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (filters.sort) {
      const sortMap: Record<string, Prisma.ProductOrderByWithRelationInput> = {
        price_asc: { minPrice: 'asc' },
        price_desc: { minPrice: 'desc' },
        newest: { createdAt: 'desc' },
        oldest: { createdAt: 'asc' },
        popular: { saleCount: 'desc' },
        rating: { rating: 'desc' },
      };
      orderBy = sortMap[filters.sort] || orderBy;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: productSelector,
        skip, take: limit, orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getProducts(params: ProductSearchDto) {
    const { brandId, categoryId, featured, limit, sort, page = 1, search, sellerId, status, discountId, maxPrice, minPrice } = params;

    const limitPage = Number(limit) || Number(this.configService.get('limit.product') || 10);
    const skip = (Number(page) - 1) * limitPage;
    const where: Prisma.ProductWhereInput = {
      ...(brandId && { brandId }),
      ...(categoryId && { categoryId }),
      ...(sellerId && { storeId: sellerId }),
      ...((status && status !== 'all') && { status: status as DefaultStatus }),
      ...((featured) && { isFeatured: featured }),
      // ✅ شرط درست برای discountId
      ...(discountId && discountId !== 'all' && discountId !== 'undefined' && {
        variants: {
          some: { discountId }
        }
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...((minPrice !== undefined || maxPrice !== undefined) && {
        minPrice: {
          ...(minPrice !== undefined && { gte: Number(minPrice) }),
          ...(maxPrice !== undefined && { lte: Number(maxPrice) }),
        },
      }),
    };
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };

    if (sort) {
      switch (sort) {
        case 'saleCount-up':
          orderBy = { saleCount: 'desc' };
          break;
        case 'saleCount-down':
          orderBy = { saleCount: 'asc' };
          break;
        case 'rating-up':
          orderBy = { rating: 'desc' };
          break;
        case 'rating-down':
          orderBy = { rating: 'asc' };
          break;
        case 'reviewCount-up':
          orderBy = { reviewCount: 'desc' };
          break;
        case 'reviewCount-down':
          orderBy = { reviewCount: 'asc' };
          break;
        case 'updatedAt':
          orderBy = { updatedAt: 'asc' };
          break;
        default:
          orderBy = { createdAt: 'desc' };
          break;
      }
    }
    const [productss, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          categoryId: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          isFeatured: true,
          viewCount: true,
          saleCount: true,
          rating: true,
          reviewCount: true,
          storeId: true,
          originalPrice: true,
          minPrice: true,
          discountPercent: true,
          images: {
            take: 1,
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              alt: true,
              url: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              parentId: true,
            },
          },
          store: { select: { id: true, name: true } },
          variants: {
            where: {
              quantity: { gt: 0 },
            },
            orderBy: { price: 'asc' },
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              quantity: true,
              discountId: true,
              discount: {
                select: {
                  type: true,
                  value: true,
                  isActive: true,
                  startsAt: true,
                  endsAt: true,
                },
              },
            },
          },
        },
        skip,
        take: limitPage,
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    const now = new Date();
    const products = productss.map((product) => {
      const displayVariant =
        product.variants.find(
          (v) =>
            v.discount &&
            v.discount.isActive &&
            (!v.discount.startsAt || new Date(v.discount.startsAt) <= now) &&
            (!v.discount.endsAt || new Date(v.discount.endsAt) >= now)
        ) ??
        product.variants[0] ??
        null;

      return {
        ...product,
        variants: displayVariant ? [displayVariant] : [],
      };
    });

    return {
      products,
      pagination: pagination(total, Number(page), limitPage),
    };
  }

  async approveProduct(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('محصول یافت نشد');

    await this.prisma.product.update({ where: { id }, data: { status: 'APPROVED' } });
    return { message: 'محصول تأیید شد' };
  }

  async featureProduct(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('محصول یافت نشد');

    const updated = await this.prisma.product.update({
      where: { id },
      data: { isFeatured: !product.isFeatured, status: product.isFeatured ? product.status : 'APPROVED' },
    });

    return { message: updated.isFeatured ? 'محصول ویژه شد' : 'محصول از ویژه خارج شد' };
  }

  /**
   * دریافت یک محصول با slug
   */
  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        status: 'APPROVED',
      },
      select: {
        content: true, description: true, minPrice: true,
        isFeatured: true, slug: true, metaTitle: true, productTable: true, rating: true,
        saleCount: true, reviewCount: true, originalPrice: true, title: true, viewCount: true, id: true, discountPercent: true,
        brand: { select: { name: true, slug: true } },
        store: { select: { name: true, logo: true, slug: true, } },
        images: {
          select: { alt: true, url: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' },
        },
        reviews: {
          select: { body: true, answerReview: true, user: { select: { id: true, name: true } }, rating: true, createdAt: true },
          where: { isApproved: true },
          take: 3,
          orderBy: { createdAt: 'desc' }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            ancestorIds: true,
          },
        },
        variants: {
          select: {
            id: true,
            discountId: true,
            colorId: true,
            name: true,

            image: true,
            price: true,
            quantity: true,
            sku: true,
            saleCount: true,
            color: { select: { hexCode: true, name: true } },
            discount: {
              where: { isActive: true },
              select: { type: true, endsAt: true, startsAt: true, value: true, isActive: true },
            },
            attributes: {
              select: {
                value: true,
                attribute: { select: { key: true, label: true } },
              },
            },
          },
        },
        _count: {
          select: {
            reviews: { where: { isApproved: true } },
          },
        },
      },
    });

    if (!product) throw new NotFoundException('محصول یافت نشد');
    let breadcrumbs: BreadcrumbItem[] = [];
    if (product.category) {
      const { ancestorIds } = product.category;
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
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        },
      ];
    }

    return { ...product, breadcrumbs, };
  }

  /**
   * دریافت یک محصول با id
   */
  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { OR: [{ id }] },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: {
          select: { name: true, icon: true, slug: true }
        },
        variants: {
          include: {
            discount: true,
            attributes: true,
          }
        },
        store: { select: { id: true, name: true, slug: true, logo: true, description: true } },
        reviews: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' }, take: 10
        },
      },
    });
    if (!product) throw new NotFoundException('محصول یافت نشد');
    return product;
  }

  async create(dto: CreateProductDto, userId: string) {
    let storeId = dto.storeId
    if (!dto.storeId) {
      const data = await this.prisma.user.findUnique({ where: { id: userId }, select: { store: { where: { isActive: true, isVerified: true, status: 'APPROVED' }, select: { id: true } } } })
      storeId = data?.store?.id
    }
    const { images, ...rest } = dto;
    const existingSlug = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
    if (existingSlug) throw new ConflictException('محصولی با این عنوان وجود دارد');
    if (!storeId) throw new BadRequestException('فروشنده ای ثبت نشده دوباره وارد حساب خود شوید یا درخواست فروشندگی بدهید');

    return this.prisma.product.create({
      data: {
        ...rest,
        storeId: storeId,
        status: 'PENDING',
        ...(images?.length && {
          images: {
            connect: images?.map((i) => ({ url: i }))
          }
        }),
      },
      include: { images: true, category: true },
    });
  }

  /**
   * به‌روزرسانی محصول (فقط فروشنده خود محصول)
    */
  async update(id: string, dto: UpdateProductDto) {
    const { images, ...rest } = dto;
    const data: any = { ...rest };
    if (images !== undefined) {
      data.images = {
        set: images.map((imgId: string) => ({ url: imgId })),
      };
    }
    try {
      return await this.prisma.product.update({
        where: { id },
        data,
        include: { images: true, category: true },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException('محصولی با این عنوان وجود دارد');
      }
      if (error.code === 'P2025') {
        throw new BadRequestException('یکی از عکس‌های انتخاب‌شده یافت نشد');
      }
      throw error;
    }
  }

  /**
   * حذف محصول (تغییر وضعیت به inactive)
   */
  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }

  /**
   * افزایش تعداد بازدید محصول
   */
  async incrementViewCount(id: string) {
    return this.prisma.product.update({ where: { id }, data: { viewCount: { increment: 1 } } });
  }

  /**
   * دریافت محصولات مرتبط (هم‌دسته)
   */
  async getRelated(slug: string, limit: number = 6) {
    const product = await this.prisma.product.findUnique({ where: { slug } });
    if (!product) throw new NotFoundException('محصول یافت نشد');
    return this.prisma.product.findMany({
      where: { categoryId: product.categoryId, id: { not: product.id }, status: 'APPROVED' },
      select: productSelector,
      take: limit,
      orderBy: { saleCount: 'desc' },
    });
  }
}