// src/modules/media/storage/media.helper.ts
import { randomBytes } from 'node:crypto';

export function getMediaFolder(mimetype: string): string {
    if (mimetype.startsWith('image/')) return 'images';
    if (mimetype.startsWith('video/')) return 'videos';
    if (mimetype.startsWith('audio/')) return 'audios';
    if (
        mimetype === 'application/pdf' ||
        mimetype.startsWith('application/vnd.openxmlformats-officedocument.')
    ) return 'documents';
    return 'files';
}

export function buildKey(mimetype: string, originalName: string, detectedExt?: string): string {
    const ext = detectedExt ?? (originalName.split('.').pop()?.toLowerCase() || 'bin');
    const base = originalName
        .split('.').slice(0, -1).join('.')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50) || 'file';
    const now = new Date();
    const date = `${now.getFullYear()}`;
    const month = `${String(now.getMonth() + 1).padStart(2, '0')}`;
    const unique = randomBytes(6).toString('hex'); // url روی Media یکتاست؛ تصادف عملاً غیرممکنه
    return `marketino/${getMediaFolder(mimetype)}/${date}/${month}/${base}-${unique}.${ext}`;
}
