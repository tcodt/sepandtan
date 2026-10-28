import { Module } from '@nestjs/common';
import { MediaService } from './media.service.js';
import { MediaController } from './media.controller.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { S3StorageService } from './storage/s3-storage.service.js';
import { StorageService } from './storage/storage.service.js';


@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [MediaController],
    providers: [
        MediaService,
        PrismaService,
        S3StorageService,
        {
            provide: StorageService,
            useExisting: S3StorageService,
        },
    ],
    exports: [MediaService],
})
export class MediaModule { }