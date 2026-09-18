import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export function saveBase64Media(base64DataUrl: string, type: string = 'image'): string {
  if (!base64DataUrl || !base64DataUrl.startsWith('data:')) {
    return base64DataUrl;
  }
  try {
    const parts = base64DataUrl.split(';base64,');
    if (parts.length < 2) return base64DataUrl;

    const mime = parts[0].replace('data:', '');
    const base64 = parts[1];

    let ext = 'bin';
    if (mime.includes('mp4') || type === 'video') ext = 'mp4';
    else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
    else if (mime.includes('png')) ext = 'png';
    else if (mime.includes('webp')) ext = 'webp';
    else if (mime.includes('ogg') || mime.includes('audio')) ext = 'ogg';
    else if (mime.includes('pdf')) ext = 'pdf';

    const filename = `media-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);
    const buffer = Buffer.from(base64, 'base64');
    fs.writeFileSync(filePath, buffer);

    const backendBaseUrl = process.env.BACKEND_PUBLIC_URL || 'http://localhost:3001';
    console.log(`[mediaStorage] Saved ${type} (${buffer.length} bytes) to ${filename}`);
    return `${backendBaseUrl}/uploads/${filename}`;
  } catch (err) {
    console.error('[mediaStorage] Error saving base64 media to disk:', err);
    return base64DataUrl;
  }
}

export function deleteMediaFileByUrl(mediaUrl: string | null | undefined): void {
  if (!mediaUrl) return;
  try {
    if (mediaUrl.includes('/uploads/')) {
      const filename = mediaUrl.split('/uploads/')[1];
      if (filename) {
        const filePath = path.join(UPLOADS_DIR, filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`[mediaStorage] Deleted media file: ${filename}`);
        }
      }
    }
  } catch (err) {
    console.error('[mediaStorage] Error deleting media file:', err);
  }
}

export function getUploadsDir(): string {
  return UPLOADS_DIR;
}
