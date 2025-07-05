'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileText, Image, Video, File } from 'lucide-react'
import { useUploadFile, useUploadMultipleFiles, UploadedFile } from '@/hooks/useFileUpload'

interface FileUploadProps {
  onFilesUploaded?: (files: UploadedFile[]) => void
  multiple?: boolean
  maxFiles?: number
  maxSize?: number // bytes
  accept?: Record<string, string[]>
  className?: string
}

const getFileIcon = (format: string) => {
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(format.toLowerCase())) {
    return <Image className="w-8 h-8 text-green-500" />
  }
  if (['mp4', 'avi', 'mov', 'wmv'].includes(format.toLowerCase())) {
    return <Video className="w-8 h-8 text-red-500" />
  }
  if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(format.toLowerCase())) {
    return <FileText className="w-8 h-8 text-blue-500" />
  }
  return <File className="w-8 h-8 text-gray-500" />
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function FileUpload({ 
  onFilesUploaded,
  multiple = false,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = {
    'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
    'text/markdown': ['.md'],
  },
  className = ''
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([])

  const uploadSingleMutation = useUploadFile()
  const uploadMultipleMutation = useUploadMultipleFiles()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploadingFiles(acceptedFiles)

    try {
      if (multiple && acceptedFiles.length > 1) {
        // 다중 파일 업로드
        const result = await uploadMultipleMutation.mutateAsync(acceptedFiles)
        const newFiles = Array.isArray(result.data) ? result.data : [result.data]
        setUploadedFiles(prev => [...prev, ...newFiles])
        onFilesUploaded?.(newFiles)
      } else {
        // 단일 파일 업로드들을 순차적으로 처리
        const newFiles: UploadedFile[] = []
        for (const file of acceptedFiles) {
          const result = await uploadSingleMutation.mutateAsync(file)
          const uploadedFile = Array.isArray(result.data) ? result.data[0] : result.data
          newFiles.push(uploadedFile)
        }
        setUploadedFiles(prev => [...prev, ...newFiles])
        onFilesUploaded?.(newFiles)
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setUploadingFiles([])
    }
  }, [multiple, uploadSingleMutation, uploadMultipleMutation, onFilesUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: multiple ? maxFiles : 1,
    maxSize,
    multiple,
  })

  const removeUploadedFile = (indexToRemove: number) => {
    setUploadedFiles(prev => prev.filter((_, index) => index !== indexToRemove))
  }

  const isUploading = uploadSingleMutation.isPending || uploadMultipleMutation.isPending

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 드롭존 */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        
        {isDragActive ? (
          <p className="text-blue-600 font-medium">파일을 여기에 놓으세요...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              파일을 드래그하거나 클릭하여 업로드
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {multiple ? `최대 ${maxFiles}개 파일, ` : ''}
              각 파일 최대 {formatFileSize(maxSize)}
            </p>
            <button
              type="button"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              disabled={isUploading}
            >
              {isUploading ? '업로드 중...' : '파일 선택'}
            </button>
          </div>
        )}
      </div>

      {/* 업로드 중인 파일들 */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">업로드 중...</h4>
          {uploadingFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 업로드된 파일들 */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">업로드된 파일</h4>
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              {getFileIcon(file.format)}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{file.originalName}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
              >
                보기
              </a>
              <button
                onClick={() => removeUploadedFile(index)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}