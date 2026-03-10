'use client'

import { FileVideo, HardDrive, Scissors, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import StatCard from './StatCard'
import { DashboardStats as DashboardStatsType } from '@/types/dashboard'

interface DashboardStatsProps {
  stats: DashboardStatsType | null
  loading?: boolean
}

const formatStorage = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function DashboardStats({ stats, loading = false }: DashboardStatsProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Videos"
          value="-"
          icon={<FileVideo className="w-6 h-6" />}
          color="purple"
          loading
        />
        <StatCard
          title="Storage Used"
          value="-"
          icon={<HardDrive className="w-6 h-6" />}
          color="blue"
          loading
        />
        <StatCard
          title="Clips Generated"
          value="-"
          icon={<Scissors className="w-6 h-6" />}
          color="green"
          loading
        />
        <StatCard
          title="Processing"
          value="-"
          icon={<Loader2 className="w-6 h-6" />}
          color="yellow"
          loading
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Videos"
          value={stats.totalVideos}
          subtitle={`${stats.completedCount} completed`}
          icon={<FileVideo className="w-6 h-6" />}
          color="purple"
        />
        <StatCard
          title="Storage Used"
          value={formatStorage(stats.totalStorage)}
          subtitle="Total disk usage"
          icon={<HardDrive className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Clips Generated"
          value={stats.totalClips}
          subtitle="AI-generated clips"
          icon={<Scissors className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Processing"
          value={stats.processingCount}
          subtitle="Videos in queue"
          icon={<Loader2 className="w-6 h-6" />}
          color="yellow"
        />
      </div>

      {/* Status Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-green-500/10">
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Completed</p>
            <p className="text-xl font-bold text-white">{stats.completedCount}</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <Loader2 className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Uploading</p>
            <p className="text-xl font-bold text-white">{stats.uploadingCount}</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-red-500/10">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Failed</p>
            <p className="text-xl font-bold text-white">{stats.failedCount}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
