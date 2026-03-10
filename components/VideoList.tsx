'use client'

import { useState, useEffect } from 'react'
import { Video } from '@/types/video'
import { FileVideo, Clock, Calendar, Trash2, Play, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { formatDistanceToNow } from 'date-fns'

interface VideoListProps {
  onVideoSelect?: (video: Video) => void
  refreshTrigger?: number
}

export default function VideoList({ onVideoSelect, refreshTrigger }: VideoListProps) {
  const { session } = useAuth()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchVideos = async () => {
    if (!session?.access_token) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/videos', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch videos')
      }

      setVideos(data.data || [])
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch videos')
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [session, refreshTrigger])

  const handleDelete = async (videoId: string) => {
    if (!session?.access_token) return
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return
    }

    setDeletingId(videoId)

    try {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete video')
      }

      // Remove video from list
      setVideos(videos.filter(v => v.id !== videoId))
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete video')
      setError(error.message)
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusColor = (status: Video['status']) => {
    switch (status) {
      case 'uploading':
        return 'text-yellow-400 bg-yellow-400/10'
      case 'processing':
        return 'text-blue-400 bg-blue-400/10'
      case 'completed':
        return 'text-green-400 bg-green-400/10'
      case 'failed':
        return 'text-red-400 bg-red-400/10'
      default:
        return 'text-slate-400 bg-slate-400/10'
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <FileVideo className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">No videos uploaded yet</p>
          <p className="text-slate-500 text-sm mt-2">Upload your first video to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {videos.map((video) => (
        <div
          key={video.id}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-purple-500/50 transition-all duration-200 group"
        >
          <div className="flex items-start gap-4">
            <div className="w-32 h-20 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0 relative group-hover:ring-2 group-hover:ring-purple-500/50 transition-all">
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="w-8 h-8 text-white/70" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate mb-1">
                    {video.original_filename}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(video.duration)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}</span>
                    </div>
                    <span>{formatFileSize(video.file_size)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(video.status)}`}>
                    {video.status}
                  </span>
                  <button
                    onClick={() => handleDelete(video.id)}
                    disabled={deletingId === video.id}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingId === video.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {video.status === 'processing' && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Processing video...</span>
                    <span>AI analysis in progress</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-purple-600 h-1.5 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
