'use client'

import { formatDistanceToNow } from 'date-fns'
import { 
  Upload, 
  Loader2, 
  CheckCircle, 
  Scissors, 
  Trash2, 
  AlertCircle,
  FileVideo
} from 'lucide-react'
import { RecentActivityProps, Activity } from '@/types/dashboard'

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'upload':
      return <Upload className="w-4 h-4" />
    case 'processing':
      return <Loader2 className="w-4 h-4 animate-spin" />
    case 'completed':
      return <CheckCircle className="w-4 h-4" />
    case 'clip':
      return <Scissors className="w-4 h-4" />
    case 'delete':
      return <Trash2 className="w-4 h-4" />
    case 'failed':
      return <AlertCircle className="w-4 h-4" />
    default:
      return <FileVideo className="w-4 h-4" />
  }
}

const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'upload':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    case 'processing':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    case 'completed':
      return 'bg-green-500/10 text-green-400 border-green-500/20'
    case 'clip':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    case 'delete':
      return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    case 'failed':
      return 'bg-red-500/10 text-red-400 border-red-500/20'
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  }
}

const getActivityTitle = (type: Activity['type']) => {
  switch (type) {
    case 'upload':
      return 'Video Uploaded'
    case 'processing':
      return 'Processing Started'
    case 'completed':
      return 'Processing Completed'
    case 'clip':
      return 'Clips Generated'
    case 'delete':
      return 'Video Deleted'
    case 'failed':
      return 'Processing Failed'
    default:
      return 'Activity'
  }
}

export default function RecentActivity({ 
  activities, 
  maxItems = 10,
  loading = false 
}: RecentActivityProps) {
  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
        </div>
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      </div>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
        </div>
        <div className="p-8 text-center">
          <FileVideo className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No recent activity</p>
          <p className="text-slate-500 text-sm mt-1">Upload a video to get started</p>
        </div>
      </div>
    )
  }

  const displayedActivities = activities.slice(0, maxItems)

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
        <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-full">
          Last {displayedActivities.length} activities
        </span>
      </div>
      
      <div className="divide-y divide-white/5">
        {displayedActivities.map((activity) => (
          <div 
            key={activity.id} 
            className="p-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg border ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">
                    {getActivityTitle(activity.type)}
                  </p>
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </span>
                </div>
                
                <p className="text-sm text-slate-400 truncate mt-0.5">
                  {activity.message}
                </p>
                
                {activity.videoTitle && (
                  <p className="text-xs text-slate-500 mt-1 truncate">
                    {activity.videoTitle}
                    {activity.clipCount && ` • ${activity.clipCount} clips`}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
