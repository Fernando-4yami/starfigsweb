import { storage } from './admin';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export async function uploadImageFromUrl(imageUrl: string, folder: string = 'products') {
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(response.data, 'binary');
  const extension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
  const filename = `${folder}/${uuidv4()}.${extension}`;

  const bucket = storage.bucket();
  const file = bucket.file(filename);

  await file.save(buffer, {
    metadata: {
      contentType: response.headers['content-type'],
      firebaseStorageDownloadTokens: uuidv4(),
    },
    public: true,
  });

  const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filename)}?alt=media`;
  return publicUrl;
}
