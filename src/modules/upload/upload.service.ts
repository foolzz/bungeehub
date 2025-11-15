/**
 * Upload Service
 * Handles file uploads to Google Cloud Storage
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private storage: Storage;
  private bucket: string;

  constructor() {
    // Initialize Google Cloud Storage
    this.storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GCP_KEY_FILE, // Path to service account key
    });

    this.bucket = process.env.GCS_BUCKET_NAME || 'bungeehub-media';
  }

  /**
   * Upload a single file
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf', // For ID documents
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    try {
      const fileName = `${folder}/${uuidv4()}-${file.originalname}`;
      const blob = this.storage.bucket(this.bucket).file(fileName);

      const blobStream = blob.createWriteStream({
        resumable: false,
        metadata: {
          contentType: file.mimetype,
        },
      });

      return new Promise((resolve, reject) => {
        blobStream.on('error', (err) => {
          reject(new BadRequestException(`Upload failed: ${err.message}`));
        });

        blobStream.on('finish', () => {
          // Make the file public
          blob.makePublic().then(() => {
            const publicUrl = `https://storage.googleapis.com/${this.bucket}/${fileName}`;
            resolve(publicUrl);
          });
        });

        blobStream.end(file.buffer);
      });
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: Express.Multer.File[],
    folder: string = 'uploads',
  ): Promise<string[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const uploadPromises = files.map((file) => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete a file
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract file name from URL
      const fileName = fileUrl.split(`${this.bucket}/`)[1];
      if (!fileName) {
        throw new Error('Invalid file URL');
      }

      await this.storage.bucket(this.bucket).file(fileName).delete();
    } catch (error) {
      throw new BadRequestException(`Delete failed: ${error.message}`);
    }
  }

  /**
   * Get signed URL for temporary access
   */
  async getSignedUrl(
    fileUrl: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    try {
      const fileName = fileUrl.split(`${this.bucket}/`)[1];
      if (!fileName) {
        throw new Error('Invalid file URL');
      }

      const [url] = await this.storage
        .bucket(this.bucket)
        .file(fileName)
        .getSignedUrl({
          action: 'read',
          expires: Date.now() + expiresIn * 1000,
        });

      return url;
    } catch (error) {
      throw new BadRequestException(
        `Failed to generate signed URL: ${error.message}`,
      );
    }
  }
}
