import {
  Controller, Post, Delete, Get,
  UseInterceptors, UploadedFile,
  Body, Param, Query,
  UseGuards, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiParam, ApiOkResponse } from '@nestjs/swagger';
import { MediaService } from './media.service.js';
import { UploadImageDto, UploadImageSwaggerDto, UploadMediaDto, UploadMediaSwaggerDto } from './dto/upload-image.dto.js';
import { SearchMediaDto } from './dto/search.media.dto.js';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { MediaEntity } from './entities/media.entitie.js';
import { PaginatedResponse } from '../../common/dtos/pagination-response.dto.js';
import { ConfigService } from '@nestjs/config';
import { TempFileCleanupInterceptor, uploadMulterOptions } from './storage/media-upload.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

const limitUpload = Number(process.env.MAX_FILE_SIZE) || Number(10 * 1024 * 1024)

@ApiTags('Media')
@Controller('media')
@UseGuards(AccessTokenGuard)
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly configService: ConfigService
  ) { }

  @Post('/')
  @ApiOperation({ summary: 'آپلود یک تصویر دسترسی تمام کاربران (User)', description: 'برای نمایش عکس ها از این آدرس استفاده کن https://c333224.parspack.net/' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadImageSwaggerDto })
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: limitUpload, files: 1 },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new BadRequestException('فقط فایل تصویری مجاز است'), false);
      }
      cb(null, true);
    },
  }))
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadImageSwaggerDto,
  ) {
    if (!file) throw new BadRequestException('فایلی آپلود نشده است');
    return this.mediaService.uploadImage(file, dto);
  }

  @Post('/upload')
  @ApiOperation({
    summary: ' (User) آپلود تصویر، ویدیو، صدا یا سند دسترسی تمام کاربران',
    description:
      'نوع فایل از روی محتوای واقعی آن تشخیص داده می‌شود (نه Content-Type ارسالی). برای نمایش فایل‌ها از این آدرس استفاده کن https://c333224.parspack.net/',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadMediaSwaggerDto })
  @UseInterceptors(FileInterceptor('file', uploadMulterOptions), TempFileCleanupInterceptor)
  uploadMedia(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadMediaDto,
  ) {
    if (!file) throw new BadRequestException('فایلی آپلود نشده است');
    return this.mediaService.uploadMedia(file, dto);
  }


  @Delete('/:url')
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'حذف رسانه ها و دسترسی ادمین (Admin)' })
  deleteMedia(
    @Param('url') url: string,
  ) {
    return this.mediaService.deleteMedia(url);
  }


  @Get('/')
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'فیلتر و نمایش لیست رسانه‌های کاربر دسترسی ادمین (Admin)', description: 'جستجوی تمام فایل ها و عکس ها برای نمایش اطلاعات این ادرس رو اول لینکشون بزار https://c333224.parspack.net/' })
  @ApiOkResponse({ type: PaginatedResponse(MediaEntity, 'media'), description: 'لیست پست‌ها' })
  async getAll(@Query() query: SearchMediaDto) {
    return this.mediaService.getAllMedia(query);
  }
}
