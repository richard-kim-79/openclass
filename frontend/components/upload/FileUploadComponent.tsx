'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, FileIcon, Image, AlertCircle, CheckCircle } from 'lucide-react';
import { FileUploadService, FileUploadOptions, UploadProgress, UploadedFile } from '@/lib/upload/fileUploadService';
import toast from 'react-hot-toast';

interface FileUploadComponentProps {
  onUploadSuccess?: (files: UploadedFile[]) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  categories?: Array<{ id: string; name: string; color?: string }>;
  className?: string;
}

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  uploadedFile?: UploadedFile;
}

export function FileUploadComponent({
  onUploadSuccess,
  onUploadError,
  maxFiles = 5,
  categories = [],
  className = '',
}: FileUploadComponentProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadOptions, setUploadOptions] = useState<FileUploadOptions>({
    title: '',
    description: '',
    categoryId: '',
    tags: '',
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FileWithProgress[] = [];
    
    for (let i = 0; i < selectedFiles.length && files.length + newFiles.length < maxFiles; i++) {
      const file = selectedFiles[i];
      const validation = FileUploadService.validateFile(file);
      
      if (!validation.isValid) {
        toast.error(validation.error || '유효하지 않은 파일입니다.');
        continue;
      }

      newFiles.push({
        file,
        progress: 0,
        status: 'pending',
      });
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
    }

    if (selectedFiles.length > maxFiles - files.length) {
      toast.error(`최대 ${maxFiles}개 파일까지 업로드 가능합니다.`);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      toast.error('업로드할 파일을 선택해주세요.');
      return;
    }

    if (!uploadOptions.title.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }

    setIsUploading(true);
    const uploadedFiles: UploadedFile[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const fileData = files[i];
        
        if (fileData.status !== 'pending') continue;

        // 파일별 제목 설정
        const fileTitle = files.length === 1 
          ? uploadOptions.title 
          : `${uploadOptions.title} - ${fileData.file.name}`;

        const options: FileUploadOptions = {
          ...uploadOptions,
          title: fileTitle,
        };

        // 상태 업데이트
        setFiles(prev => prev.map((f, index) => 
          index === i ? { ...f, status: 'uploading' as const } : f
        ));

        try {
          const response = fileData.file.type.startsWith('image/')
            ? await FileUploadService.uploadImage(
                fileData.file,
                options,
                (progress: UploadProgress) => {
                  setFiles(prev => prev.map((f, index) => 
                    index === i ? { ...f, progress: progress.percentage } : f
                  ));
                }
              )
            : await FileUploadService.uploadFile(
                fileData.file,
                options,
                (progress: UploadProgress) => {
                  setFiles(prev => prev.map((f, index) => 
                    index === i ? { ...f, progress: progress.percentage } : f
                  ));
                }
              );

          // 성공 상태 업데이트
          setFiles(prev => prev.map((f, index) => 
            index === i 
              ? { ...f, status: 'success' as const, progress: 100, uploadedFile: response.file } 
              : f
          ));

          uploadedFiles.push(response.file);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '업로드 실패';
          
          // 실패 상태 업데이트
          setFiles(prev => prev.map((f, index) => 
            index === i 
              ? { ...f, status: 'error' as const, error: errorMessage } 
              : f
          ));

          toast.error(`${fileData.file.name}: ${errorMessage}`);
        }
      }

      if (uploadedFiles.length > 0) {
        toast.success(`${uploadedFiles.length}개 파일이 성공적으로 업로드되었습니다!`);
        onUploadSuccess?.(uploadedFiles);
        
        // 성공한 파일들 제거
        setFiles(prev => prev.filter(f => f.status !== 'success'));
        
        // 옵션 초기화
        setUploadOptions({
          title: '',
          description: '',
          categoryId: '',
          tags: '',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.';
      onUploadError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = (status: FileWithProgress['status']) => {
    switch (status) {
      case 'uploading':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 업로드 옵션 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">파일 정보</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="파일의 제목을 입력하세요"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={uploadOptions.title}
              onChange={(e) => setUploadOptions(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명
            </label>
            <textarea
              placeholder="파일에 대한 설명을 입력하세요"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              value={uploadOptions.description}
              onChange={(e) => setUploadOptions(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={uploadOptions.categoryId}
                  onChange={(e) => setUploadOptions(prev => ({ ...prev, categoryId: e.target.value }))}
                >
                  <option value="">카테고리 선택</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                태그
              </label>
              <input
                type="text"
                placeholder="태그를 쉼표로 구분하여 입력하세요"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={uploadOptions.tags}
                onChange={(e) => setUploadOptions(prev => ({ ...prev, tags: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 파일 업로드 영역 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          파일 업로드 ({files.length}/{maxFiles})
        </h3>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">파일을 드래그하거나 클릭하여 업로드</p>
          <p className="text-sm text-gray-500 mb-4">
            PDF, DOC, PPT, 이미지, 비디오, 오디오 파일 지원 (최대 50MB)
          </p>
          <button
            type="button"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            disabled={files.length >= maxFiles}
          >
            파일 선택
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.txt,.md"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>

      {/* 선택된 파일 목록 */}
      {files.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">선택된 파일</h3>
          
          <div className="space-y-3">
            {files.map((fileData, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex-shrink-0">
                  {getStatusIcon(fileData.status)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">
                      {FileUploadService.getFileIcon(fileData.file.type)}
                    </span>
                    <span className="font-medium text-gray-900 truncate">
                      {fileData.file.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({FileUploadService.formatFileSize(fileData.file.size)})
                    </span>
                  </div>

                  {fileData.status === 'uploading' && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${fileData.progress}%` }}
                      />
                    </div>
                  )}

                  {fileData.status === 'error' && fileData.error && (
                    <p className="text-sm text-red-500">{fileData.error}</p>
                  )}

                  {fileData.status === 'success' && (
                    <p className="text-sm text-green-500">업로드 완료</p>
                  )}
                </div>

                {fileData.status === 'pending' && (
                  <button
                    onClick={() => removeFile(index)}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setFiles([])}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isUploading}
            >
              모두 제거
            </button>
            <button
              onClick={uploadFiles}
              className="flex-1 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              disabled={isUploading || files.length === 0 || !uploadOptions.title.trim()}
            >
              {isUploading ? '업로드 중...' : `${files.filter(f => f.status === 'pending').length}개 파일 업로드`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
