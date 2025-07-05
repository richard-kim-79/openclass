import { cloudinary } from '../config/cloudinary';
import { Readable } from 'stream';

export interface UploadResult {
  url: string;
  publicId: string;
  originalName: string;
  size: number;
  format: string;
}

export const uploadFileToCloudinary = async (
  file: Express.Multer.File,
  folder: string = 'openclass'
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto', // 자동으로 파일 타입 감지
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'md'],
        max_file_size: 10000000, // 10MB 제한
      },
      (error: any, result: any) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
          return;
        }

        if (!result) {
          reject(new Error('Upload failed: No result from Cloudinary'));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          originalName: file.originalname,
          size: result.bytes,
          format: result.format,
        });
      }
    );

    // Buffer를 스트림으로 변환하여 업로드
    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });
};

export const deleteFileFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new Error(`Failed to delete file: ${error}`);
  }
};