export interface FileUploadOptions {
  title: string;
  description?: string;
  categoryId?: string;
  tags?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadedFile {
  id: string;
  title: string;
  description?: string;
  url: string;
  type: string;
  size: number;
  originalName: string;
  mimeType: string;
  tags: string[];
  createdAt: string;
}

export interface FileUploadResponse {
  success: boolean;
  message: string;
  file: UploadedFile;
}

export interface MultipleFileUploadResponse {
  success: boolean;
  message: string;
  files: UploadedFile[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export class FileUploadService {
  static async uploadFile(
    file: File,
    options: FileUploadOptions,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', options.title);
    
    if (options.description) {
      formData.append('description', options.description);
    }
    if (options.categoryId) {
      formData.append('categoryId', options.categoryId);
    }
    if (options.tags) {
      formData.append('tags', options.tags);
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // 인증 토큰 추가
      const token = localStorage.getItem('openclass_access_token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress: UploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100),
            };
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('응답 파싱 오류'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.error || '업로드 실패'));
          } catch {
            reject(new Error(`업로드 실패: ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('네트워크 오류'));
      });

      xhr.open('POST', `${API_BASE_URL}/files/file`);
      xhr.send(formData);
    });
  }

  static async uploadImage(
    file: File,
    options: FileUploadOptions,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('title', options.title);
    
    if (options.description) {
      formData.append('description', options.description);
    }
    if (options.categoryId) {
      formData.append('categoryId', options.categoryId);
    }
    if (options.tags) {
      formData.append('tags', options.tags);
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // 인증 토큰 추가
      const token = localStorage.getItem('openclass_access_token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress: UploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100),
            };
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('응답 파싱 오류'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.error || '업로드 실패'));
          } catch {
            reject(new Error(`업로드 실패: ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('네트워크 오류'));
      });

      xhr.open('POST', `${API_BASE_URL}/files/image`);
      xhr.send(formData);
    });
  }

  static async uploadMultipleFiles(
    files: File[],
    options: FileUploadOptions,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<MultipleFileUploadResponse> {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append('files', file);
    });
    
    formData.append('title', options.title);
    
    if (options.description) {
      formData.append('description', options.description);
    }
    if (options.categoryId) {
      formData.append('categoryId', options.categoryId);
    }
    if (options.tags) {
      formData.append('tags', options.tags);
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // 인증 토큰 추가
      const token = localStorage.getItem('openclass_access_token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress: UploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100),
            };
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('응답 파싱 오류'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.error || '업로드 실패'));
          } catch {
            reject(new Error(`업로드 실패: ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('네트워크 오류'));
      });

      xhr.open('POST', `${API_BASE_URL}/files/multiple`);
      xhr.send(formData);
    });
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static validateFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/markdown',
      'video/mp4',
      'video/avi',
      'video/mov',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
    ];

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `파일 크기가 너무 큽니다. 최대 ${this.formatFileSize(maxSize)}까지 업로드 가능합니다.`,
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: '지원되지 않는 파일 형식입니다.',
      };
    }

    return { isValid: true };
  }

  static getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📊';
    if (mimeType.includes('text')) return '📄';
    return '📁';
  }

  static getFileTypeLabel(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '이미지';
    if (mimeType.startsWith('video/')) return '비디오';
    if (mimeType.startsWith('audio/')) return '오디오';
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'Word 문서';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'PowerPoint';
    if (mimeType.includes('text')) return '텍스트';
    return '파일';
  }
}
