import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { videoId } = body

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      )
    }

    // Verify video belongs to user
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .eq('user_id', user.id)
      .single()

    if (videoError || !video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // Check if video is already being processed
    const { data: existingJob } = await supabase
      .from('processing_jobs')
      .select('*')
      .eq('video_id', videoId)
      .in('status', ['pending', 'processing'])
      .single()

    if (existingJob) {
      return NextResponse.json(
        { error: 'Video is already being processed' },
        { status: 400 }
      )
    }

    // Create processing job
    const { data: processingJob, error: jobError } = await supabase
      .from('processing_jobs')
      .insert({
        id: randomUUID(),
        video_id: videoId,
        status: 'pending',
        current_step: 'Initializing',
        progress: 0,
        error_message: null
      })
      .select()
      .single()

    if (jobError) {
      console.error('Failed to create processing job:', jobError)
      return NextResponse.json(
        { error: 'Failed to create processing job' },
        { status: 500 }
      )
    }

    // Update video status to processing
    await supabase
      .from('videos')
      .update({ status: 'processing' })
      .eq('id', videoId)

    // Start async processing (in production, this would be a background job)
    // For now, we'll return immediately and the client will poll for status
    startVideoProcessing(videoId, processingJob.id, video.storage_path)

    return NextResponse.json({
      success: true,
      data: processingJob
    })

  } catch (error) {
    console.error('Processing route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// This function would be called in a background job in production
// For now, it's a placeholder that simulates processing
async function startVideoProcessing(videoId: string, jobId: string, storagePath: string) {
  try {
    // Update job status
    await supabase
      .from('processing_jobs')
      .update({ status: 'processing', current_step: 'Extracting audio', progress: 10 })
      .eq('id', jobId)

    // Simulate processing steps with delays
    await new Promise(resolve => setTimeout(resolve, 2000))
    await supabase
      .from('processing_jobs')
      .update({ current_step: 'Transcribing with Whisper', progress: 30 })
      .eq('id', jobId)

    await new Promise(resolve => setTimeout(resolve, 3000))
    await supabase
      .from('processing_jobs')
      .update({ current_step: 'Analyzing with GPT-4 Vision', progress: 50 })
      .eq('id', jobId)

    await new Promise(resolve => setTimeout(resolve, 3000))
    await supabase
      .from('processing_jobs')
      .update({ current_step: 'Generating clips', progress: 70 })
      .eq('id', jobId)

    await new Promise(resolve => setTimeout(resolve, 2000))
    await supabase
      .from('processing_jobs')
      .update({ current_step: 'Finalizing', progress: 90 })
      .eq('id', jobId)

    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mark as completed
    await supabase
      .from('processing_jobs')
      .update({ status: 'completed', current_step: 'Completed', progress: 100 })
      .eq('id', jobId)

    // Update video status
    await supabase
      .from('videos')
      .update({ status: 'completed' })
      .eq('id', videoId)

  } catch (error) {
    console.error('Video processing error:', error)
    await supabase
      .from('processing_jobs')
      .update({
        status: 'failed',
        current_step: 'Failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('id', jobId)

    await supabase
      .from('videos')
      .update({ status: 'failed' })
      .eq('id', videoId)
  }
}
