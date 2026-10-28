// src/modules/media/storage/media-upload.ts   ← تنها فایل جدید
import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { fileTypeFromFile } from 'file-type';
import { diskStorage } from 'multer';
import { unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { finalize, type Observable } from 'rxjs';
import type { TypeMedia } from '../../../generated/prisma/enums.js';
type UploadOptions = NonNullable<Parameters<typeof FileInterceptor>[1]>;
const MB = 1024 * 1024;

interface MediaRule {
  type: TypeMedia; // مقداری که توی Media.type ذخیره می‌شه
  maxBytes: number;
  exts: readonly string[]; // پسوندهای مجاز (بر اساس محتوای واقعی فایل)
}

/**
 * قوانین هر دسته. اگه اسم مقدارهای enum تو (TypeMedia) فرق داره، همین‌جا عوضشون کن.
 * فایل SVG عمداً مجاز نیست (می‌تونه اسکریپت داشته باشه و تشخیص محتواش هم قابل اعتماد نیست).
 */
export const MEDIA_RULES: Record<'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT', MediaRule> = {
  IMAGE: { type: 'IMAGE', maxBytes: 10 * MB, exts: ['jpg', 'png', 'webp', 'gif', 'avif'] },
  VIDEO: { type: 'VIDEO', maxBytes: 300 * MB, exts: ['mp4', 'webm', 'mov'] },
  AUDIO: { type: 'VOICE', maxBytes: 50 * MB, exts: ['mp3', 'm4a', 'ogg', 'wav', 'aac', 'flac'] },
  DOCUMENT: { type: 'FILE', maxBytes: 20 * MB, exts: ['pdf', 'docx', 'xlsx', 'pptx'] },
};

const RULE_BY_EXT = new Map<string, MediaRule>(
  Object.values(MEDIA_RULES).flatMap((rule) => rule.exts.map((ext) => [ext, rule] as const)),
);

// سقف multer = بزرگ‌ترین حجم مجاز؛ سقف دقیق هر دسته بعد از تشخیص نوع چک می‌شه
const MAX_UPLOAD_BYTES = Math.max(...Object.values(MEDIA_RULES).map((rule) => rule.maxBytes));

/**
 * فایل روی دیسکِ موقت (tmp) نوشته می‌شه، نه توی رم؛
 * پس یک ویدیوی ۳۰۰ مگابایتی فشاری به حافظه‌ی سرور نمی‌آره.
 */
export const uploadMulterOptions: UploadOptions = {
  storage: diskStorage({ destination: tmpdir() }),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  // فیلتر زودهنگام و درشت بر اساس Content-Type اعلام‌شده (جعل‌شدنیه؛ بررسی اصلی پایین‌تره)
  fileFilter: (_req, file, cb) => {
    const declared = file.mimetype;
    const ok =
      /^(image|video|audio)\//.test(declared) ||
      declared === 'application/pdf' ||
      declared === 'application/octet-stream' ||
      declared.startsWith('application/vnd.openxmlformats-officedocument.');

    cb(ok ? null : new BadRequestException('نوع فایل پشتیبانی نمی‌شود'), ok);
  },
};

export interface InspectedUpload {
  type: TypeMedia;
  ext: string;
  mime: string;
}

/** نوع واقعی فایل رو از بایت‌های ابتدایی می‌خونه و حجم رو با سقف همون دسته مقایسه می‌کنه */
export async function inspectUpload(file: Express.Multer.File): Promise<InspectedUpload> {
  const detected = await fileTypeFromFile(file.path);
  const rule = detected ? RULE_BY_EXT.get(detected.ext) : undefined;

  if (!detected || !rule) {
    throw new BadRequestException('نوع فایل پشتیبانی نمی‌شود یا فایل معتبر نیست');
  }
  if (file.size > rule.maxBytes) {
    throw new BadRequestException(`حجم این نوع فایل حداکثر ${rule.maxBytes / MB} مگابایت است`);
  }

  return { type: rule.type, ext: detected.ext, mime: detected.mime };
}

/**
 * فایل موقت رو «درجا» پاک می‌کنه؛ چه آپلود موفق باشه، چه validation خطا بده، چه کلاینت قطع کنه.
 * (اگه فقط توی سرویس پاک می‌کردیم، خطای validation فایل رو روی دیسک جا می‌ذاشت.)
 * باید بعد از FileInterceptor قرار بگیره.
 */
@Injectable()
export class TempFileCleanupInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      finalize(() => {
        if (req.file?.path) {
          void unlink(req.file.path).catch(() => undefined);
        }
      }),
    );
  }
}
