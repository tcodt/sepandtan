import { Readable } from 'stream';

export abstract class StorageService {
  abstract upload(key: string, data: Buffer | Readable, mimeType: string): Promise<void>;
  abstract delete(key: string): Promise<boolean>;
}