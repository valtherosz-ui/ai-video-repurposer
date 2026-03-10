import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
 * GET /api/clips/[id]
 * Get a single clip by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const clipId = params.id

    // Fetch clip with video info to verify ownership
    const { data: clip, error } = await supabase
      .from('clips')
      .select(`
        *,
        videos!inner(user_id)
      `)
      .eq('id', clipId)
      .single()

    if (error || !clip) {
      return NextResponse.json(
        { error: 'Clip not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    const clipData = clip as ClipRecord & { videos: { user_id: string } }
    if (clipData.videos.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get public URLs
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

    // Remove the videos object from response
    const { videos, ...clipWithoutVideos } = clipData

    const clipWithUrls: ClipWithUrls = {
      ...clipWithoutVideos,
      public_url: clipUrl,
      thumbnail_url: thumbnailUrl
    }

    return NextResponse.json({
      success: true,
      data: clipWithUrls
    })

  } catch (error) {
    console.error('Clip detail route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/clips/[id]
 * Update a clip's metadata (title, description, times)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const clipId = params.id

    // Fetch clip with video info to verify ownership
    const { data: existingClip, error: fetchError } = await supabase
      .from('clips')
      .select(`
        *,
        videos!inner(user_id, duration)
      `)
      .eq('id', clipId)
      .single()

    if (fetchError || !existingClip) {
      return NextResponse.json(
        { error: 'Clip not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    const clipData = existingClip as ClipRecord & { videos: { user_id: string; duration: number | null } }
    if (clipData.videos.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      title,
      description,
      start_time,
      end_time,
      thumbnail_path
    } = body

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {}
    
    if (title !== undefined) {
      if (!title.trim()) {
        return NextResponse.json(
          { error: 'Title cannot be empty' },
          { status: 400 }
        )
      }
      updateData.title = title
    }
    
    if (description !== undefined) {
      updateData.description = description
    }
    
    if (thumbnail_path !== undefined) {
      updateData.thumbnail_path = thumbnail_path
    }

    // Handle time updates
    if (start_time !== undefined || end_time !== undefined) {
      const newStartTime = start_time !== undefined ? start_time : clipData.start_time
      const newEndTime = end_time !== undefined ? end_time : clipData.end_time

      // Validate time range
      if (newStartTime < 0 || newEndTime <= newStartTime) {
        return NextResponse.json(
          { error: 'Invalid time range: start_time must be >= 0 and end_time must be > start_time' },
          { status: 400 }
        )
      }

      // Validate against video duration
      if (clipData.videos.duration && newEndTime > clipData.videos.duration) {
        return NextResponse.json(
          { error: 'Clip end time exceeds video duration' },
          { status: 400 }
        )
      }

      updateData.start_time = newStartTime
      updateData.end_time = newEndTime
      updateData.duration = Math.round(newEndTime - newStartTime)
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Update clip
    const { data: updatedClip, error } = await supabase
      .from('clips')
      .update(updateData)
      .eq('id', clipId)
      .select()
      .single()

    if (error) {
      console.error('Update clip error:', error)
      return NextResponse.json(
        { error: 'Failed to update clip' },
        { status: 500 }
      )
    }

    // Get public URLs
    const updatedClipData = updatedClip as ClipRecord
    const { data: { publicUrl: clipUrl } } = supabase.storage
      .from('clips')
      .getPublicUrl(updatedClipData.storage_path)
    
    let thumbnailUrl: string | null = null
    if (updatedClipData.thumbnail_path) {
      const { data: { publicUrl } } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(updatedClipData.thumbnail_path)
      thumbnailUrl = publicUrl
    }

    const clipWithUrls: ClipWithUrls = {
      ...updatedClipData,
      public_url: clipUrl,
      thumbnail_url: thumbnailUrl
    }

    return NextResponse.json({
      success: true,
      data: clipWithUrls
    })

  } catch (error) {
    console.error('Update clip route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/clips/[id]
 * Delete a clip
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const clipId = params.id

    // Fetch clip with video info to verify ownership
    const { data: clip, error: fetchError } = await supabase
      .from('clips')
      .select(`
        id,
        storage_path,
        thumbnail_path,
        videos!inner(user_id)
      `)
      .eq('id', clipId)
      .single()

    if (fetchError || !clip) {
      return NextResponse.json(
        { error: 'Clip not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    const clipData = clip as unknown as {
      id: string
      storage_path: string
      thumbnail_path: string
      videos: { user_id: string }
    }
    if (clipData.videos.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Delete clip file from storage
    const { error: storageError } = await supabase.storage
      .from('clips')
      .remove([clipData.storage_path])

    if (storageError) {
      console.error('Storage deletion error:', storageError)
      // Continue with database deletion even if storage fails
    }

    // Delete thumbnail if exists
    if (clipData.thumbnail_path) {
      const { error: thumbnailError } = await supabase.storage
        .from('thumbnails')
        .remove([clipData.thumbnail_path])
      
      if (thumbnailError) {
        console.error('Thumbnail deletion error:', thumbnailError)
      }
    }

    // Delete clip record from database
    const { error } = await supabase
      .from('clips')
      .delete()
      .eq('id', clipId)

    if (error) {
      console.error('Delete clip error:', error)
      return NextResponse.json(
        { error: 'Failed to delete clip' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Clip deleted successfully'
    })

  } catch (error) {
    console.error('Delete clip route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
