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

/**
 * POST /api/clips/[id]/download
 * Generate a signed download URL for a clip
 * 
 * Query params:
 * - expiresIn: number (optional) - URL expiration time in seconds (default: 3600, max: 86400)
 * 
 * Response:
 * - signedUrl: string - Time-limited download URL
 * - expiresAt: string - ISO timestamp when URL expires
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const clipId = id

    // Get expiration time from query params
    const { searchParams } = new URL(request.url)
    const expiresIn = Math.min(
      parseInt(searchParams.get('expiresIn') || '3600', 10),
      86400 // Max 24 hours
    )

    // Fetch clip with video info to verify ownership
    const { data: clip, error: fetchError } = await supabase
      .from('clips')
      .select(`
        id,
        title,
        storage_path,
        format,
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
      title: string
      storage_path: string
      format: string
      videos: { user_id: string }
    }
    if (clipData.videos.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Generate signed URL for download
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('clips')
      .createSignedUrl(clipData.storage_path, expiresIn, {
        download: `${clipData.title.replace(/[^a-z0-9]/gi, '_')}.${clipData.format || 'mp4'}`
      })

    if (signedUrlError || !signedUrlData) {
      console.error('Signed URL error:', signedUrlError)
      return NextResponse.json(
        { error: 'Failed to generate download URL' },
        { status: 500 }
      )
    }

    // Calculate expiration timestamp
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    return NextResponse.json({
      success: true,
      data: {
        signedUrl: signedUrlData.signedUrl,
        expiresAt,
        filename: `${clipData.title.replace(/[^a-z0-9]/gi, '_')}.${clipData.format || 'mp4'}`
      }
    })

  } catch (error) {
    console.error('Download URL route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/clips/[id]/download
 * Redirect to the clip file (public access if bucket is public)
 * This is an alternative for quick downloads without generating signed URLs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const clipId = id

    // Fetch clip with video info to verify ownership
    const { data: clip, error: fetchError } = await supabase
      .from('clips')
      .select(`
        id,
        storage_path,
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
      videos: { user_id: string }
    }
    if (clipData.videos.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get public URL and redirect
    const { data: { publicUrl } } = supabase.storage
      .from('clips')
      .getPublicUrl(clipData.storage_path)

    // Redirect to the public URL
    return NextResponse.redirect(publicUrl)

  } catch (error) {
    console.error('Download redirect route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
