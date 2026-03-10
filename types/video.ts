// Video-related type definitions for the AI Video Repurposer

export interface Video {
  id: string
  user_id: string
  original_filename: string
  storage_path: string
  duration: number // in seconds
  file_size: number // in bytes
  width: number
  height: number
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

export interface Transcript {
  id: string
  video_id: string
  content: string
  language: string
  segments: TranscriptSegment[]
  created_at: string
}

export interface TranscriptSegment {
  start: number
  end: number
  text: string
}

export interface Analysis {
  id: string
  video_id: string
  highlights: Highlight[]
  topics: string[]
  sentiment: string
  created_at: string
}

export interface Highlight {
  start: number
  end: number
  score: number
  description: string
}

export interface Clip {
  id: string
  video_id: string
  title: string
  description: string
  start_time: number
  end_time: number
  storage_path: string
  thumbnail_path: string
  duration: number // in seconds
  format: string
  resolution: string
  created_at: string
}

export interface ProcessingJob {
  id: string
  video_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  current_step: string
  progress: number // 0-100
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface VideoUploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface VideoUploadOptions {
  file: File
  onProgress?: (progress: VideoUploadProgress) => void
  onComplete?: (video: Video) => void
  onError?: (error: Error) => void
}
