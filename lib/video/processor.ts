import ffmpeg from 'fluent-ffmpeg'
import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

export interface VideoMetadata {
  duration: number
  width: number
  height: number
  fps: number
  codec: string
}

export interface ClipOptions {
  startTime: number
  endTime: number
  outputPath: string
  format?: 'mp4' | 'mov' | 'webm'
  resolution?: '1080p' | '720p' | '480p' | '360p'
  bitrate?: string
  includeAudio?: boolean
}

export interface ThumbnailOptions {
  outputPath: string
  timestamp?: number
  width?: number
  height?: number
}

/**
 * Get video metadata using FFmpeg
 * @param inputPath - Path to video file
 * @returns Video metadata
 */
export async function getVideoMetadata(inputPath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .ffprobe((err, metadata) => {
        if (err) {
          reject(new Error('Failed to get video metadata'))
          return
        }

        const videoStream = metadata.streams?.find(s => s.codec_type === 'video')
        
        resolve({
          duration: metadata.format?.duration || 0,
          width: videoStream?.width || 1920,
          height: videoStream?.height || 1080,
          fps: eval(videoStream?.r_frame_rate || '30'),
          codec: videoStream?.codec_name || 'h264'
        })
      })
  })
}

/**
 * Extract audio from video file
 * @param inputPath - Path to video file
 * @param outputPath - Path to save audio file
 * @returns Path to extracted audio file
 */
export async function extractAudio(
  inputPath: string,
  outputPath: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .save(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
  })
}

/**
 * Extract frames from video at specified timestamps
 * @param inputPath - Path to video file
 * @param outputDir - Directory to save frames
 * @param timestamps - Array of timestamps in seconds
 * @returns Array of frame file paths
 */
export async function extractFrames(
  inputPath: string,
  outputDir: string,
  timestamps: number[]
): Promise<string[]> {
  const framePaths: string[] = []

  for (const timestamp of timestamps) {
    const framePath = path.join(outputDir, `frame_${timestamp.toFixed(2)}.jpg`)
    
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .seekInput(timestamp)
        .frames(1)
        .output(framePath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run()
    })

    framePaths.push(framePath)
  }

  return framePaths
}

/**
 * Generate a clip from video
 * @param inputPath - Path to video file
 * @param options - Clip options
 * @returns Path to generated clip
 */
export async function generateClip(
  inputPath: string,
  options: ClipOptions
): Promise<string> {
  const {
    startTime,
    endTime,
    outputPath,
    format = 'mp4',
    resolution = '1080p',
    bitrate = '2M',
    includeAudio = true
  } = options

  const duration = endTime - startTime
  const resolutions: Record<string, { width: number; height: number }> = {
    '1080p': { width: 1920, height: 1080 },
    '720p': { width: 1280, height: 720 },
    '480p': { width: 854, height: 480 },
    '360p': { width: 640, height: 360 }
  }

  const { width, height } = resolutions[resolution]

  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(duration)
      .videoCodec('libx264')
      .videoBitrate(bitrate)
      .size(`${width}x${height}`)
      .outputOptions([
        '-preset', 'fast',
        '-crf', '23',
        '-movflags', '+faststart'
      ])

    if (!includeAudio) {
      command = command.noAudio()
    } else {
      command = command.audioCodec('aac')
        .audioBitrate('128k')
    }

    command
      .save(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
  })
}

/**
 * Generate thumbnail for video
 * @param inputPath - Path to video file
 * @param options - Thumbnail options
 * @returns Path to generated thumbnail
 */
export async function generateThumbnail(
  inputPath: string,
  options: ThumbnailOptions
): Promise<string> {
  const {
    outputPath,
    timestamp = 1,
    width = 320,
    height = 180
  } = options

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .seekInput(timestamp)
      .frames(1)
      .size(`${width}x${height}`)
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .run()
  })
}

/**
 * Generate multiple clips from video
 * @param inputPath - Path to video file
 * @param outputDir - Directory to save clips
 * @param segments - Array of clip segments
 * @returns Array of clip file paths
 */
export async function generateClips(
  inputPath: string,
  outputDir: string,
  segments: Array<{ start: number; end: number }>
): Promise<string[]> {
  const clipPaths: string[] = []

  for (const segment of segments) {
    const clipPath = path.join(outputDir, `clip_${randomUUID()}.mp4`)
    
    await generateClip(inputPath, {
      startTime: segment.start,
      endTime: segment.end,
      outputPath: clipPath
    })

    clipPaths.push(clipPath)
  }

  return clipPaths
}

/**
 * Optimize video for web playback
 * @param inputPath - Path to video file
 * @param outputPath - Path to save optimized video
 * @returns Path to optimized video
 */
export async function optimizeVideo(
  inputPath: string,
  outputPath: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-preset', 'fast',
        '-crf', '23',
        '-movflags', '+faststart'
      ])
      .save(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
  })
}

/**
 * Add watermark to video
 * @param inputPath - Path to video file
 * @param watermarkPath - Path to watermark image
 * @param outputPath - Path to save watermarked video
 * @returns Path to watermarked video
 */
export async function addWatermark(
  inputPath: string,
  watermarkPath: string,
  outputPath: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .input(watermarkPath)
      .complexFilter([
        '[0:v][1:v]overlay=10:10:format=auto'
      ])
      .save(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
  })
}

/**
 * Concatenate multiple videos into one
 * @param inputPaths - Array of video file paths
 * @param outputPath - Path to save concatenated video
 * @returns Path to concatenated video
 */
export async function concatenateVideos(
  inputPaths: string[],
  outputPath: string
): Promise<string> {
  // Create concat list file
  const listPath = path.join(path.dirname(outputPath), 'concat.txt')
  const listContent = inputPaths
    .map(p => `file '${p.replace(/\\/g, '/')}'`)
    .join('\n')
  
  await fs.writeFile(listPath, listContent)

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(listPath)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .outputOptions(['-c', 'copy'])
      .save(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
  })
}
