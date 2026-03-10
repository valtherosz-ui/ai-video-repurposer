// Dashboard-related type definitions for the AI Video Repurposer

export interface DashboardStats {
  totalVideos: number
  totalStorage: number // in bytes
  totalClips: number
  processingCount: number
  completedCount: number
  failedCount: number
  uploadingCount: number
}

export interface Activity {
  id: string
  type: 'upload' | 'processing' | 'completed' | 'clip' | 'delete' | 'failed'
  message: string
  timestamp: string
  videoId?: string
  videoTitle?: string
  clipCount?: number
}

export interface DashboardData {
  stats: DashboardStats
  recentActivity: Activity[]
  activeJobs: ProcessingJobInfo[]
}

export interface ProcessingJobInfo {
  id: string
  videoId: string
  videoTitle: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  currentStep: string
  progress: number // 0-100
  createdAt: string
  updatedAt: string
}

export interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color: 'purple' | 'blue' | 'green' | 'yellow' | 'red'
  loading?: boolean
}

export interface RecentActivityProps {
  activities: Activity[]
  maxItems?: number
  loading?: boolean
}

export interface ActiveJobsProps {
  jobs: ProcessingJobInfo[]
  loading?: boolean
  onRefresh?: () => void
}
