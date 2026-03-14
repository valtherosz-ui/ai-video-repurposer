import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const videoId = id

    // Fetch video
    const { data: video, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .eq('user_id', user.id)
      .single()

    if (error || !video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // Get public URL for the video
    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(video.storage_path)

    // Fetch related data
    const [transcript, analysis, clips, processingJob] = await Promise.all([
      supabase
        .from('transcripts')
        .select('*')
        .eq('video_id', videoId)
        .single(),
      supabase
        .from('analyses')
        .select('*')
        .eq('video_id', videoId)
        .single(),
      supabase
        .from('clips')
        .select('*')
        .eq('video_id', videoId)
        .order('created_at', { ascending: false }),
      supabase
        .from('processing_jobs')
        .select('*')
        .eq('video_id', videoId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
    ])

    // Get public URLs for clips
    const clipsWithUrls = await Promise.all(
      (clips.data || []).map(async (clip) => {
        const { data: { publicUrl: clipUrl } } = supabase.storage
          .from('clips')
          .getPublicUrl(clip.storage_path)
        
        const { data: { publicUrl: thumbnailUrl } } = supabase.storage
          .from('thumbnails')
          .getPublicUrl(clip.thumbnail_path)
        
        return {
          ...clip,
          public_url: clipUrl,
          thumbnail_url: thumbnailUrl
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        ...video,
        public_url: publicUrl,
        transcript: transcript.data || null,
        analysis: analysis.data || null,
        clips: clipsWithUrls,
        processing_job: processingJob.data || null
      }
    })

  } catch (error) {
    console.error('Video detail route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const videoId = id

    // Fetch video to get storage path
    const { data: video, error: fetchError } = await supabase
      .from('videos')
      .select('storage_path')
      .eq('id', videoId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // Delete video file from storage
    const { error: storageError } = await supabase.storage
      .from('videos')
      .remove([video.storage_path])

    if (storageError) {
      console.error('Storage deletion error:', storageError)
    }

    // Delete video record and related data
    await Promise.all([
      supabase.from('videos').delete().eq('id', videoId),
      supabase.from('transcripts').delete().eq('video_id', videoId),
      supabase.from('analyses').delete().eq('video_id', videoId),
      supabase.from('clips').delete().eq('video_id', videoId),
      supabase.from('processing_jobs').delete().eq('video_id', videoId)
    ])

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully'
    })

  } catch (error) {
    console.error('Video deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
