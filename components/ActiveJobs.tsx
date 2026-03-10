'use client'

import { formatDistanceToNow } from 'date-fns'
import { Loader2, RefreshCw, FileVideo, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { ActiveJobsProps, ProcessingJobInfo } from '@/types/dashboard'

const getStatusIcon = (status: ProcessingJobInfo['status']) => {
  switch (status) {
    case 'pending':
      return <Clock className="w-4 h-4 text-yellow-400" />
    case 'processing':
      return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-400" />
    case 'failed':
      return <AlertCircle className="w-4 h-4 text-red-400" />
    default:
      return <FileVideo className="w-4 h-4 text-slate-400" />
  }
}

const getStatusColor = (status: ProcessingJobInfo['status']) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    case 'processing':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    case 'completed':
      return 'bg-green-500/10 text-green-400 border-green-500/20'
    case 'failed':
      return 'bg-red-500/10 text-red-400 border-red-500/20'
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  }
}

const getProgressColor = (status: ProcessingJobInfo['status']) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500'
    case 'processing':
      return 'bg-blue-500'
    case 'completed':
      return 'bg-green-500'
    case 'failed':
      return 'bg-red-500'
    default:
      return 'bg-slate-500'
  }
}

export default function ActiveJobs({ 
  jobs, 
  loading = false,
  onRefresh 
}: ActiveJobsProps) {
  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Active Jobs</h3>
        </div>
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      </div>
    )
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Active Jobs</h3>
        </div>
        <div className="p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="text-slate-400">No active jobs</p>
          <p className="text-slate-500 text-sm mt-1">All videos have been processed</p>
        </div>
      </div>
    )
  }

  // Filter to show only pending and processing jobs
  const activeJobs = jobs.filter(job => 
    job.status === 'pending' || job.status === 'processing'
  )

  if (activeJobs.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Active Jobs</h3>
        </div>
        <div className="p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="text-slate-400">No active jobs</p>
          <p className="text-slate-500 text-sm mt-1">All videos have been processed</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">Active Jobs</h3>
          <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-full">
            {activeJobs.length} processing
          </span>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="divide-y divide-white/5">
        {activeJobs.map((job) => (
          <div 
            key={job.id} 
            className="p-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg border ${getStatusColor(job.status)}`}>
                {getStatusIcon(job.status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white truncate">
                    {job.videoTitle}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>
                
                <p className="text-xs text-slate-400 mt-1">
                  {job.currentStep}
                </p>
                
                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Progress</span>
                    <span>{job.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-500 ${getProgressColor(job.status)}`}
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>
                
                <p className="text-xs text-slate-500 mt-2">
                  Started {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
