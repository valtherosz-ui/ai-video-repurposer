'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Scissors, Download, Trash2, Plus, Save } from 'lucide-react'
import { Clip } from '@/types/video'

interface ClipSegment {
  id: string
  start: number
  end: number
  title: string
  description: string
}

interface ClipEditorProps {
  videoUrl: string
  duration: number
  initialClips?: ClipSegment[]
  onSave?: (clips: ClipSegment[]) => void
  onPreview?: (startTime: number, endTime: number) => void
}

export default function ClipEditor({
  videoUrl,
  duration,
  initialClips = [],
  onSave,
  onPreview
}: ClipEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [clips, setClips] = useState<ClipSegment[]>(initialClips)
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [newClipStart, setNewClipStart] = useState<number | null>(null)
  const [newClipEnd, setNewClipEnd] = useState<number | null>(null)
  const [isCreatingClip, setIsCreatingClip] = useState(false)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return
    setCurrentTime(video.currentTime)
  }

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (time: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = time
    setCurrentTime(time)
  }

  const startCreatingClip = () => {
    const video = videoRef.current
    if (!video) return

    setNewClipStart(video.currentTime)
    setNewClipEnd(video.currentTime)
    setIsCreatingClip(true)
  }

  const updateClipEnd = () => {
    const video = videoRef.current
    if (!video || newClipStart === null) return

    setNewClipEnd(video.currentTime)
  }

  const finishCreatingClip = () => {
    if (newClipStart === null || newClipEnd === null) return

    const newClip: ClipSegment = {
      id: `clip_${Date.now()}`,
      start: Math.min(newClipStart, newClipEnd),
      end: Math.max(newClipStart, newClipEnd),
      title: `Clip ${clips.length + 1}`,
      description: ''
    }

    setClips([...clips, newClip])
    setNewClipStart(null)
    setNewClipEnd(null)
    setIsCreatingClip(false)
  }

  const cancelCreatingClip = () => {
    setNewClipStart(null)
    setNewClipEnd(null)
    setIsCreatingClip(false)
  }

  const deleteClip = (clipId: string) => {
    setClips(clips.filter(c => c.id !== clipId))
  }

  const updateClip = (clipId: string, updates: Partial<ClipSegment>) => {
    setClips(clips.map(c => 
      c.id === clipId ? { ...c, ...updates } : c
    ))
  }

  const handleSave = () => {
    onSave?.(clips)
  }

  const handlePreview = (clip: ClipSegment) => {
    onPreview?.(clip.start, clip.end)
    handleSeek(clip.start)
  }

  const getClipPosition = (clip: ClipSegment) => {
    const startPercent = (clip.start / duration) * 100
    const endPercent = (clip.end / duration) * 100
    const width = endPercent - startPercent
    return { left: `${startPercent}%`, width: `${width}%` }
  }

  const getCurrentTimePercent = () => {
    return (currentTime / duration) * 100
  }

  return (
    <div className="bg-slate-900 rounded-xl p-6 border border-white/10">
      {/* Video Preview */}
      <div className="mb-6">
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onClick={togglePlay}
          />

          {/* Play/Pause Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-auto cursor-pointer" onClick={togglePlay}>
              {isPlaying ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </div>
          </div>

          {/* New Clip Selection */}
          {isCreatingClip && newClipStart !== null && newClipEnd !== null && (
            <div
              className="absolute top-0 bottom-0 bg-purple-600/30 border-2 border-purple-500 pointer-events-none"
              style={{
                left: `${Math.min(newClipStart, newClipEnd) / duration * 100}%`,
                width: `${Math.abs(newClipEnd - newClipStart) / duration * 100}%`
              }}
            />
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-6">
        <div className="relative h-12 bg-slate-800 rounded-lg overflow-hidden cursor-pointer" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const percent = (e.clientX - rect.left) / rect.width
          handleSeek(percent * duration)
        }}>
          {/* Time markers */}
          <div className="absolute inset-0 flex justify-between px-2 pointer-events-none">
            {[0, 0.25, 0.5, 0.75, 1].map(percent => (
              <span key={percent} className="text-xs text-slate-400">
                {formatTime(percent * duration)}
              </span>
            ))}
          </div>

          {/* Clips overlay */}
          <div className="absolute inset-0 top-2 bottom-2">
            {clips.map(clip => (
              <div
                key={clip.id}
                className={`absolute top-0 bottom-0 rounded cursor-pointer transition-all ${
                  selectedClipId === clip.id
                    ? 'bg-purple-600 ring-2 ring-purple-400'
                    : 'bg-purple-500/60 hover:bg-purple-500/80'
                }`}
                style={getClipPosition(clip)}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedClipId(clip.id)
                }}
              >
                <div className="h-full px-2 flex items-center overflow-hidden">
                  <span className="text-xs text-white font-medium truncate">
                    {clip.title}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Current time indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none"
            style={{ left: `${getCurrentTimePercent()}%` }}
          />
        </div>

        {/* Current time display */}
        <div className="flex items-center justify-between mt-2 text-sm">
          <span className="text-slate-400">Current: {formatTime(currentTime)}</span>
          <span className="text-slate-400">Duration: {formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {isCreatingClip ? (
            <>
              <button
                onClick={finishCreatingClip}
                disabled={Math.abs((newClipEnd || 0) - (newClipStart || 0)) < 1}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Save Clip
              </button>
              <button
                onClick={cancelCreatingClip}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={startCreatingClip}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Scissors className="w-4 h-4" />
              Create Clip
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={clips.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export Clips
          </button>
        </div>
      </div>

      {/* Clips List */}
      {clips.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Clips ({clips.length})</h3>
          <div className="space-y-2">
            {clips.map(clip => (
              <div
                key={clip.id}
                className={`p-4 rounded-lg border transition-all ${
                  selectedClipId === clip.id
                    ? 'bg-purple-600/20 border-purple-500'
                    : 'bg-slate-800/50 border-white/10 hover:border-purple-500/50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={clip.title}
                      onChange={(e) => updateClip(clip.id, { title: e.target.value })}
                      className="bg-transparent text-white font-medium mb-1 w-full focus:outline-none focus:ring-1 focus:ring-purple-500 rounded px-1"
                    />
                    <textarea
                      value={clip.description}
                      onChange={(e) => updateClip(clip.id, { description: e.target.value })}
                      placeholder="Add description..."
                      rows={2}
                      className="bg-transparent text-slate-400 text-sm w-full resize-none focus:outline-none focus:ring-1 focus:ring-purple-500 rounded px-1"
                    />
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                      <span>Start: {formatTime(clip.start)}</span>
                      <span>End: {formatTime(clip.end)}</span>
                      <span>Duration: {formatTime(clip.end - clip.start)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePreview(clip)}
                      className="p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-600/20 rounded-lg transition-colors"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteClip(clip.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-600/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
