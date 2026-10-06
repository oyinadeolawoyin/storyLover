import { supabase } from '../lib/supabase';

const BUCKET = 'blog-media';
const MAX_SIZE = 25 * 1024 * 1024; // 25 MB, same as the bucket limit
const ALLOWED = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm',
];

export class MediaService {
  /**
   * Upload an image or video file to Supabase Storage.
   * Returns the public link to the file.
   */
  static async upload(file, folder = 'posts') {
    if (!ALLOWED.includes(file.type)) {
      throw new Error('That file type is not allowed. Use JPG, PNG, WEBP, GIF, MP4 or WEBM.');
    }
    if (file.size > MAX_SIZE) {
      throw new Error('That file is too big. The limit is 25 MB.');
    }

    // Make a safe, unique file name
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.\-_]+/g, '-');
    const path = `${folder}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: '31536000', upsert: false, contentType: file.type });

    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }
}