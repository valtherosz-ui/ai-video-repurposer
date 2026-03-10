'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, FileVideo, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { VideoUploadProgress, VideoUploadOptions, Video } from '@/types/video'
import { useAuth } from '@/hooks/useAuth'

interface VideoUploaderProps {
  onUploadComplete?: (video: Video) => void
  onError?: (error: Error) => void
}

export default function VideoUploader({ onUploadComplete, onError }: VideoUploaderProps) {
  const { session } = useAuth()
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<VideoUploadProgress | null>(null)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB
  const ALLOWED_FORMATS = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!ALLOWED_FORMATS.includes(file.type)) {
      return { valid: false, error: 'Invalid file format. Please upload MP4, MOV, AVI, or MKV files.' }
    }
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File size exceeds 500MB limit.' }
    }
    return { valid: true }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 0) {
      const videoFile = droppedFiles[0]
      processFile(videoFile)
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      processFile(selectedFiles[0])
    }
  }, [])

  const processFile = (videoFile: File) => {
    const validation = validateFile(videoFile)
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file')
      setUploadStatus('error')
      onError?.(new Error(validation.error))
      return
    }

    setFile(videoFile)
    setErrorMessage('')
    setUploadStatus('idle')
    setUploadProgress(null)
  }

  const uploadVideo = async () => {
    if (!file) return

    if (!session?.access_token) {
      setUploadStatus('error')
      setErrorMessage('Not authenticated. Please log in.')
      onError?.(new Error('Not authenticated'))
      return
    }

    setUploadStatus('uploading')
    setErrorMessage('')

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
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          setUploadStatus('success')
          setUploadProgress({ loaded: file.size, total: file.size, percentage: 100 })
          onUploadComplete?.(response.data)
        } else {
          const error = new Error(xhr.responseText || 'Upload failed')
          setUploadStatus('error')
          setErrorMessage(error.message)
          onError?.(error)
        }
      })

      xhr.addEventListener('error', () => {
        const error = new Error('Network error during upload')
        setUploadStatus('error')
        setErrorMessage(error.message)
        onError?.(error)
      })

      xhr.open('POST', '/api/videos/upload')
      xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
      xhr.send(formData)
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Upload failed')
      setUploadStatus('error')
      setErrorMessage(err.message)
      onError?.(err)
    }
  }

  const resetUpload = () => {
    setFile(null)
    setUploadProgress(null)
    setUploadStatus('idle')
    setErrorMessage('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200
          ${isDragging 
            ? 'border-purple-500 bg-purple-500/10' 
            : 'border-slate-600 hover:border-purple-400 hover:bg-slate-800/50'
          }
          ${file ? 'border-purple-500 bg-purple-500/10' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska"
          onChange={handleFileSelect}
          className="hidden"
          id="video-upload"
        />

        {!file ? (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Upload className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Upload your video
              </h3>
              <p className="text-slate-400 mb-4">
                Drag and drop your video here, or click to browse
              </p>
              <p className="text-sm text-slate-500">
                Supports MP4, MOV, AVI, MKV (max 500MB)
              </p>
            </div>
            <label
              htmlFor="video-upload"
              className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Upload className="w-5 h-5 mr-2" />
              Choose File
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <FileVideo className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium truncate max-w-xs">{file.name}</p>
                <p className="text-sm text-slate-400">{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={resetUpload}
                className="ml-4 p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadStatus === 'idle' && (
              <button
                onClick={uploadVideo}
                className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
              >
                <Upload className="w-5 h-5 mr-2" />
                Start Upload
              </button>
            )}

            {uploadStatus === 'uploading' && uploadProgress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Uploading...</span>
                  <span className="text-white font-medium">{uploadProgress.percentage}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  {formatFileSize(uploadProgress.loaded)} of {formatFileSize(uploadProgress.total)}
                </p>
              </div>
            )}

            {uploadStatus === 'success' && (
              <div className="flex items-center justify-center space-x-2 text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Upload successful!</span>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Upload failed</span>
                </div>
                {errorMessage && (
                  <p className="text-sm text-red-400">{errorMessage}</p>
                )}
                <button
                  onClick={uploadVideo}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Loader2 className="w-4 h-4 mr-2" />
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
