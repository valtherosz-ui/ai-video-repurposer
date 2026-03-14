import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/types'

type VideoRow = Database['public']['Tables']['videos']['Row']
type ClipRow = Database['public']['Tables']['clips']['Row']
type ProcessingJobRow = Database['public']['Tables']['processing_jobs']['Row']

interface Activity {
  id: string
  type: 'upload' | 'processing' | 'completed' | 'clip' | 'delete' | 'failed'
  message: string
  timestamp: string | null
  videoId?: string
  videoTitle?: string | null
  clipCount?: number
}

interface ProcessingJobInfo {
  id: string
  videoId: string
  videoTitle: string | null
  status: 'pending' | 'processing' | 'completed' | 'failed' | null
  currentStep: string | null
  progress: number | null
  createdAt: string | null
  updatedAt: string | null
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all videos for the user
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (videosError) {
      console.error('Error fetching videos:', videosError)
      return NextResponse.json(
        { error: 'Failed to fetch videos' },
        { status: 500 }
      )
    }

    // Fetch all clips for the user
    const { data: clips, error: clipsError } = await supabase
      .from('clips')
      .select(`
        id,
        video_id,
        title,
        created_at
      `)
      .in('video_id', videos?.map(v => v.id) || [])

    if (clipsError) {
      console.error('Error fetching clips:', clipsError)
      // Continue without clips data
    }

    // Fetch processing jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('processing_jobs')
      .select(`
        id,
        video_id,
        status,
        current_step,
        progress,
        created_at,
        updated_at
      `)
      .in('video_id', videos?.map(v => v.id) || [])
      .order('created_at', { ascending: false })

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError)
      // Continue without jobs data
    }

    // Calculate statistics
    const totalVideos = videos?.length || 0
    const totalStorage = videos?.reduce((sum, v) => sum + (v.file_size || 0), 0) || 0
    const totalClips = clips?.length || 0
    
    const processingCount = videos?.filter(v => v.status === 'processing').length || 0
    const completedCount = videos?.filter(v => v.status === 'completed').length || 0
    const failedCount = videos?.filter(v => v.status === 'failed').length || 0
    const uploadingCount = videos?.filter(v => v.status === 'uploading').length || 0

    // Build recent activity from videos
    const activities: Activity[] = []
    
    videos?.slice(0, 10).forEach(video => {
      // Add upload activity
      activities.push({
        id: `upload-${video.id}`,
        type: 'upload',
        message: 'Video uploaded successfully',
        timestamp: video.created_at,
        videoId: video.id,
        videoTitle: video.original_filename
      })

      // Add status-based activity
      if (video.status === 'completed') {
        const videoClips = clips?.filter(c => c.video_id === video.id) || []
        activities.push({
          id: `completed-${video.id}`,
          type: 'completed',
          message: 'Processing completed',
          timestamp: video.updated_at,
          videoId: video.id,
          videoTitle: video.original_filename,
          clipCount: videoClips.length
        })
      } else if (video.status === 'processing') {
        activities.push({
          id: `processing-${video.id}`,
          type: 'processing',
          message: 'Video is being processed',
          timestamp: video.updated_at,
          videoId: video.id,
          videoTitle: video.original_filename
        })
      } else if (video.status === 'failed') {
        activities.push({
          id: `failed-${video.id}`,
          type: 'failed',
          message: 'Processing failed',
          timestamp: video.updated_at,
          videoId: video.id,
          videoTitle: video.original_filename
        })
      }
    })

    // Sort activities by timestamp
    activities.sort((a, b) =>
      new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
    )

    // Build active jobs list
    const activeJobs: ProcessingJobInfo[] = []
    
    jobs?.forEach(job => {
      const video = videos?.find(v => v.id === job.video_id)
      if (video) {
        activeJobs.push({
          id: job.id,
          videoId: job.video_id,
          videoTitle: video.original_filename,
          status: job.status,
          currentStep: job.current_step || 'Initializing...',
          progress: job.progress || 0,
          createdAt: job.created_at,
          updatedAt: job.updated_at
        })
      }
    })

    // If no jobs exist for processing videos, create placeholder jobs
    videos?.filter(v => v.status === 'processing').forEach(video => {
      const existingJob = activeJobs.find(j => j.videoId === video.id)
      if (!existingJob) {
        activeJobs.push({
          id: `placeholder-${video.id}`,
          videoId: video.id,
          videoTitle: video.original_filename,
          status: 'processing',
          currentStep: 'Processing video...',
          progress: 50,
          createdAt: video.created_at,
          updatedAt: video.updated_at
        })
      }
    })

    return NextResponse.json({
      stats: {
        totalVideos,
        totalStorage,
        totalClips,
        processingCount,
        completedCount,
        failedCount,
        uploadingCount
      },
      recentActivity: activities.slice(0, 10),
      activeJobs
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
