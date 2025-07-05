import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

export interface UploadedFile {
  url: string
  publicId: string
  originalName: string
  size: number
  format: string
}

export interface UploadResponse {
  success: boolean
  message: string
  data: UploadedFile | UploadedFile[]
}

// 단일 파일 업로드
export const useUploadFile = () => {
  return useMutation({
    mutationFn: async (file: File): Promise<UploadResponse> => {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post<UploadResponse>('/upload/single', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      return response.data
    },
    onSuccess: (data) => {
      toast.success(data.message || '파일이 업로드되었습니다!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '파일 업로드에 실패했습니다.')
    },
  })
}

// 다중 파일 업로드
export const useUploadMultipleFiles = () => {
  return useMutation({
    mutationFn: async (files: File[]): Promise<UploadResponse> => {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })

      const response = await api.post<UploadResponse>('/upload/multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      return response.data
    },
    onSuccess: (data) => {
      toast.success(data.message || '파일들이 업로드되었습니다!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '파일 업로드에 실패했습니다.')
    },
  })
}

// 파일 삭제
export const useDeleteFile = () => {
  return useMutation({
    mutationFn: async (publicId: string): Promise<void> => {
      const encodedPublicId = encodeURIComponent(publicId)
      await api.delete(`/upload/${encodedPublicId}`)
    },
    onSuccess: () => {
      toast.success('파일이 삭제되었습니다!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '파일 삭제에 실패했습니다.')
    },
  })
}