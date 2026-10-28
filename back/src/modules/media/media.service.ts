import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { UploadImageDto, UploadMediaDto } from './dto/upload-image.dto.js';
import { SearchMediaDto } from './dto/search.media.dto.js';

import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StorageService } from './storage/storage.service.js';
import { buildKey } from './storage/media.helper.js';
import pagination from '../../common/utils/pagination.js';
import { inspectUpload } from './storage/media-upload.js';
import { createReadStream } from 'node:fs';

@Injectable()
export class MediaService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private configService: ConfigService,
  ) { }

  private async safeDelete(key: string) {
    const deleted = await this.storageService.delete(key);
    if (!deleted) {
      console.error(`[MediaService] فایل یتیم روی S3: ${key}`);
    }
  }

  async uploadImage(file: Express.Multer.File, dto: UploadImageDto) {
    if (!file) throw new BadRequestException('فایلی آپلود نشده است');
    const { alt, isMain, productId, sortOrder = 0, type } = dto;
    const key = buildKey(file.mimetype, file.originalname);
    try {
      await this.storageService.upload(key, file.buffer, file.mimetype);
    } catch (err) {
      console.error(err);
      throw new BadRequestException('خطا در آپلود فایل');
    }

    let mediaRecord;
    try {
      mediaRecord = await this.prisma.media.create({
        data: {
          alt,
          url: key,
          isMain,
          size: file.size,
          productId,
          useCase: dto.useCase,
          sortOrder: Number(sortOrder),
          type: type || 'OTHER',
          reportsId: dto.reportsId,
          ticketMessageId: dto.ticketMessageId,
          returnRequestId: dto.returnRequestId,
        },
      });
    } catch (error) {
      await this.safeDelete(key);
      throw error;
    }
    return mediaRecord;
  }

  async uploadMedia(file: Express.Multer.File, dto: UploadMediaDto) {
    if (!file?.path) throw new BadRequestException('فایلی آپلود نشده است');

    // نوع، پسوند و mime واقعی از روی محتوای فایل (نه از کلاینت)
    const info = await inspectUpload(file);
    const key = buildKey(info.mime, file.originalname, info.ext);

    try {
      await this.storageService.upload(key, createReadStream(file.path), info.mime);
    } catch (err) {
      // اگه آپلود چندبخشی خطا بده، کتابخانه خودش بخش‌های نیمه‌کاره رو لغو می‌کنه
      console.error(err);
      throw new BadRequestException('خطا در آپلود فایل');
    }

    try {
      return await this.prisma.media.create({
        data: {
          url: key,
          alt: dto.alt,
          isMain: dto.isMain,
          sortOrder: dto.sortOrder ?? 0,
          size: file.size,
          useCase: dto.useCase,
          type: info.type,
          productId: dto.productId,
          reportsId: dto.reportsId,
          ticketMessageId: dto.ticketMessageId,
          returnRequestId: dto.returnRequestId,
        },
      });
    } catch (error) {
      // ثبت در دیتابیس شکست خورد (مثلاً productId ناموجود) ← فایل یتیم روی S3 نمونه
      await this.safeDelete(key);
      throw error;
    }
  }

  async deleteMedia(url: string) {
    const media = await this.prisma.media.findUnique({ where: { url: url } });
    if (!media) throw new NotFoundException('فایل پیدا نشد');

    await this.prisma.media.delete({ where: { url: url } });

    const deleted = await this.storageService.delete(media.url);
    if (!deleted) {
      console.error(`[MediaService] حذف از S3 ناموفق: ${media.url}`);
    }

    return { success: true, message: 'فایل حذف شد' };
  }

  async getAllMedia(query: SearchMediaDto) {
    const { page = 1, order = 'desc', limit, isMain, productId, url, useCase } = query;
    const where: any = {
      ...((isMain && isMain !== 'All') && { isMain: isMain === "true" ? true : false }),
      ...(productId && { productId: productId }),
      ...(url && { url: url }),
      ...((useCase !== "ALL" && useCase) && { useCase: useCase })
    }
    const limitPage = Number(limit) || Number(this.configService.get('limit.media'))
    const skip = (Number(page) - 1) * Number(limitPage);
    const take = Number(limitPage);

    const [data, count] = await this.prisma.$transaction([
      this.prisma.media.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: order || 'desc' },
      }),
      this.prisma.media.count({ where }),
    ]);
    return {
      media: data,
      pagination: pagination(count, Number(page), Number(limitPage)),
    };
  }
}