import { Injectable, OnModuleInit } from '@nestjs/common';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { StorageService } from './storage.service.js';
import { Readable } from 'stream';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3StorageService implements StorageService, OnModuleInit {
  private client!: S3Client;
  private bucket!: string;

  constructor(private readonly configService: ConfigService) { }

  onModuleInit() {
    this.bucket = this.configService.get<string>('S3_BUCKET_NAME') || '';
    this.client = new S3Client({
      endpoint: this.configService.get('S3_ENDPOINT') as string,
      region: this.configService.get('S3_REGION') || 'us-east-1' as string,
      credentials: {
        accessKeyId: this.configService.get('S3_ACCESS_KEY') as string,
        secretAccessKey: this.configService.get('S3_SECRET_KEY') as string,
      },
      forcePathStyle: true,
    });
  }

  async upload(key: string, data: Buffer | Readable, mimeType: string): Promise<void> {
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: mimeType,
      },
      queueSize: 4,
      partSize: 5 * 1024 * 1024,
    });

    await upload.done();
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.client.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
      return true;
    } catch (err) {
      console.error(`[S3StorageService] حذف ناموفق: ${key}`, err);
      return false;
    }
  }
}