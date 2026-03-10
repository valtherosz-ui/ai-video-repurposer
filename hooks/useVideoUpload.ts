'use client'

import { useState, useCallback } from 'react'
import { Video, VideoUploadProgress } from '@/types/video'

interface UseVideoUploadOptions {
  onProgress?: (progress: VideoUploadProgress) => void
  onComplete?: (video: Video) => void
  onError?: (error: Error) => void
}

export function useVideoUpload({
  onProgress,
  onComplete,
  onError
}: UseVideoUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<VideoUploadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const uploadVideo = useCallback(async (file: File, authToken: string) => {
    setIsUploading(true)
    setError(null)
    setUploadProgress(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress: VideoUploadProgress = {
            loaded: e.loaded,
            total: e.total,
            percentage: Math.round((e.loaded / e.total) * 100)
          }
          setUploadProgress(progress)
          onProgress?.(progress)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          setIsUploading(false)
          setUploadProgress({ loaded: file.size, total: file.size, percentage: 100 })
          onComplete?.(response.data)
        } else {
          const error = new Error(xhr.responseText || 'Upload failed')
          setIsUploading(false)
          setError(error.message)
          onError?.(error)
        }
      })

      xhr.addEventListener('error', () => {
        const error = new Error('Network error during upload')
        setIsUploading(false)
        setError(error.message)
        onError?.(error)
      })

      xhr.open('POST', '/api/videos/upload')
      xhr.setRequestHeader('Authorization', `Bearer ${authToken}`)
      xhr.send(formData)

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Upload failed')
      setIsUploading(false)
      setError(err.message)
      onError?.(err)
    }
  }, [onProgress, onComplete, onError])

  const reset = useCallback(() => {
    setIsUploading(false)
    setUploadProgress(null)
    setError(null)
  }, [])

  return {
    uploadVideo,
    isUploading,
    uploadProgress,
    error,
    reset
  }
}
