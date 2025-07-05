'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FileUploadComponent } from './FileUploadComponent'
import { UploadedFile } from '@/lib/upload/fileUploadService'

export function UploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const router = useRouter()

  const handleUploadSuccess = (files: UploadedFile[]) => {
    setUploadedFiles(prev => [...prev, ...files])
  }

  const handleUploadError = (error: string) => {
    toast.error(error)
  }

  const removeUploadedFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">학습자료 업로드</h1>
        <p className="text-gray-600">새로운 학습자료를 업로드하고 공유해보세요</p>
      </div>

      {/* 파일 업로드 컴포넌트 */}
      <div>
        <FileUploadComponent
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
          maxFiles={10}
          categories={[]} // 카테고리 데이터가 있으면 여기에 전달
        />

        {/* 업로드된 파일 목록 */}
        {uploadedFiles.length > 0 && (
          <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              업로드 완료된 파일 ({uploadedFiles.length}개)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">
                      {file.type === 'IMAGE' ? '🖼️' : file.type === 'VIDEO' ? '🎥' : file.type === 'AUDIO' ? '🎵' : '📄'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{file.title}</h4>
                      <p className="text-sm text-gray-500 truncate">{file.originalName}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                      {file.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {file.tags.slice(0, 2).map((tag, index) => (
                            <span key={index} className="inline-block px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded">
                              #{tag}
                            </span>
                          ))}
                          {file.tags.length > 2 && (
                            <span className="text-xs text-gray-500">+{file.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-center"
                    >
                      보기
                    </a>
                    <button
                      onClick={() => removeUploadedFile(file.id)}
                      className="px-3 py-2 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 홈으로 돌아가기 버튼 */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  )
}
