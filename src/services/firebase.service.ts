import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  async uploadFile(file: Buffer, path: string): Promise<string> {
    const bucket = admin.storage().bucket();
    const fileUpload = bucket.file(path);

    try {
      await fileUpload.save(file, {
        contentType: 'application/pdf'
      });

      const [url] = await fileUpload.getSignedUrl({
        action: 'read',
        expires: '03-01-2500'
      });

      return url;
    } catch (error) {
      console.error('Error al subir archivo a Firebase:', error);
      throw error;
    }
  }

  async deleteFile(path: string): Promise<void> {
    const bucket = admin.storage().bucket();
    const file = bucket.file(path);

    try {
      await file.delete();
    } catch (error) {
      console.error('Error al eliminar archivo de Firebase:', error);
      throw error;
    }
  }
} 