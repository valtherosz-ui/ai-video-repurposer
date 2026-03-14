import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

// Types for API responses
interface ClipRecord {
  id: string
  video_id: string
  title: string
  description: string
  start_time: number
  end_time: number
  storage_path: string
  thumbnail_path: string
  duration: number
  format: string
  resolution: string
  created_at: string
}

interface ClipWithUrls extends ClipRecord {
  public_url: string
  thumbnail_url: string | null
}

/**
 * GET /api/clips
 * List clips for a specific video or all user's clips
 * Query params:
 * - videoId: string (optional) - Filter by video ID
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()

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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const offset = (page - 1) * limit

    // First get user's video IDs
    const { data: userVideos, error: videosError } = await supabase
      .from('videos')
      .select('id')
      .eq('user_id', user.id)

    if (videosError) {
      console.error('Fetch user videos error:', videosError)
      return NextResponse.json(
        { error: 'Failed to fetch clips' },
        { status: 500 }
      )
    }

    const userVideoIds = (userVideos || []).map((v: { id: string }) => v.id)

    if (userVideoIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      })
    }

    // Build query for clips
    let query = supabase
      .from('clips')
      .select('*', { count: 'exact' })
      .in('video_id', userVideoIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by video if provided
    if (videoId) {
      // Verify the video belongs to the user
      if (!userVideoIds.includes(videoId)) {
        return NextResponse.json(
          { error: 'Video not found or access denied' },
          { status: 404 }
        )
      }
      query = query.eq('video_id', videoId)
    }

    const { data: clips, error, count } = await query

    if (error) {
      console.error('Fetch clips error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch clips' },
        { status: 500 }
      )
    }

    // Get public URLs for clips
    const clipsWithUrls: ClipWithUrls[] = await Promise.all(
      (clips as ClipRecord[] || []).map(async (clip): Promise<ClipWithUrls> => {
        const { data: { publicUrl: clipUrl } } = supabase.storage
          .from('clips')
          .getPublicUrl(clip.storage_path)
        
        let thumbnailUrl: string | null = null
        if (clip.thumbnail_path) {
          const { data: { publicUrl } } = supabase.storage
            .from('thumbnails')
            .getPublicUrl(clip.thumbnail_path)
          thumbnailUrl = publicUrl
        }
        
        return {
          ...clip,
          public_url: clipUrl,
          thumbnail_url: thumbnailUrl
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: clipsWithUrls,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Clips list route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/clips
 * Create a new clip
 * Body:
 * - video_id: string (required)
 * - title: string (required)
 * - description: string (optional)
 * - start_time: number (required)
 * - end_time: number (required)
 * - storage_path: string (required)
 * - thumbnail_path: string (optional)
 * - duration: number (optional, calculated from start/end if not provided)
 * - format: string (optional, default: 'mp4')
 * - resolution: string (optional, default: '1080p')
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()

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

    // Parse request body
    const body = await request.json()
    const {
      video_id,
      title,
      description = '',
      start_time,
      end_time,
      storage_path,
      thumbnail_path = '',
      duration: providedDuration,
      format = 'mp4',
      resolution = '1080p'
    } = body

    // Validate required fields
    if (!video_id || !title || start_time === undefined || end_time === undefined || !storage_path) {
      return NextResponse.json(
        { error: 'Missing required fields: video_id, title, start_time, end_time, storage_path' },
        { status: 400 }
      )
    }

    // Validate start/end times
    if (start_time < 0 || end_time <= start_time) {
      return NextResponse.json(
        { error: 'Invalid time range: start_time must be >= 0 and end_time must be > start_time' },
        { status: 400 }
      )
    }

    // Verify video belongs to user
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('id, duration')
      .eq('id', video_id)
      .eq('user_id', user.id)
      .single()

    if (videoError || !video) {
      return NextResponse.json(
        { error: 'Video not found or access denied' },
        { status: 404 }
      )
    }

    // Validate clip times against video duration
    const videoData = video as { id: string; duration: number | null }
    if (videoData.duration && end_time > videoData.duration) {
      return NextResponse.json(
        { error: 'Clip end time exceeds video duration' },
        { status: 400 }
      )
    }

    // Calculate duration if not provided
    const duration = providedDuration || Math.round(end_time - start_time)

    // Create clip record
    const { data: clip, error } = await supabase
      .from('clips')
      .insert({
        video_id,
        title,
        description,
        start_time,
        end_time,
        storage_path,
        thumbnail_path,
        duration,
        format,
        resolution
      })
      .select()
      .single()

    if (error) {
      console.error('Create clip error:', error)
      return NextResponse.json(
        { error: 'Failed to create clip' },
        { status: 500 }
      )
    }

    // Get public URLs
    const clipData = clip as ClipRecord
    const { data: { publicUrl: clipUrl } } = supabase.storage
      .from('clips')
      .getPublicUrl(clipData.storage_path)
    
    let thumbnailUrl: string | null = null
    if (clipData.thumbnail_path) {
      const { data: { publicUrl } } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(clipData.thumbnail_path)
      thumbnailUrl = publicUrl
    }

    const clipWithUrls: ClipWithUrls = {
      ...clipData,
      public_url: clipUrl,
      thumbnail_url: thumbnailUrl
    }

    return NextResponse.json({
      success: true,
      data: clipWithUrls
    }, { status: 201 })

  } catch (error) {
    console.error('Create clip route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
