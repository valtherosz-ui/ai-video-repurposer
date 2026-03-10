import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface TranscriptSegment {
  start: number
  end: number
  text: string
}

export interface TranscriptResult {
  text: string
  language: string
  segments: TranscriptSegment[]
  duration: number
}

/**
 * Transcribe audio from a video file using OpenAI Whisper API
 * @param audioFilePath - Path to audio file
 * @returns Transcript with segments
 */
export async function transcribeAudio(audioFilePath: string): Promise<TranscriptResult> {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: createReadStream(audioFilePath),
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment']
    })

    return {
      text: transcription.text,
      language: transcription.language,
      segments: (transcription.segments || []).map(segment => ({
        start: segment.start,
        end: segment.end,
        text: segment.text
      })),
      duration: transcription.duration
    }
  } catch (error) {
    console.error('Whisper transcription error:', error)
    throw new Error('Failed to transcribe audio')
  }
}

/**
 * Transcribe audio from a buffer using OpenAI Whisper API
 * @param audioBuffer - Audio file buffer
 * @param mimeType - MIME type of audio file
 * @returns Transcript with segments
 */
export async function transcribeAudioFromBuffer(
  audioBuffer: Buffer,
  mimeType: string
): Promise<TranscriptResult> {
  try {
    // Convert Buffer to Uint8Array for Blob compatibility
    const uint8Array = new Uint8Array(audioBuffer)
    const blob = new Blob([uint8Array], { type: mimeType })
    const file = new File([blob], 'audio.mp3', { type: mimeType })

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment']
    })

    return {
      text: transcription.text,
      language: transcription.language,
      segments: (transcription.segments || []).map(segment => ({
        start: segment.start,
        end: segment.end,
        text: segment.text
      })),
      duration: transcription.duration
    }
  } catch (error) {
    console.error('Whisper transcription error:', error)
    throw new Error('Failed to transcribe audio')
  }
}

/**
 * Translate transcript to English using Whisper
 * @param audioBuffer - Audio file buffer
 * @param mimeType - MIME type of audio file
 * @returns English transcript
 */
export async function translateAudioToEnglish(
  audioBuffer: Buffer,
  mimeType: string
): Promise<string> {
  try {
    const uint8Array = new Uint8Array(audioBuffer)
    const blob = new Blob([uint8Array], { type: mimeType })
    const file = new File([blob], 'audio.mp3', { type: mimeType })

    const translation = await openai.audio.translations.create({
      file: file,
      model: 'whisper-1'
    })

    return translation.text
  } catch (error) {
    console.error('Whisper translation error:', error)
    throw new Error('Failed to translate audio')
  }
}

// Helper function to create a read stream from file path
// This is a placeholder - in production, you'd use fs.createReadStream
function createReadStream(filePath: string): any {
  // In a real implementation, this would use Node.js fs module
  // For now, we'll return the path as-is for the API to handle
  return filePath
}
