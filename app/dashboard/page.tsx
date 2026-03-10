'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { 
  Loader2, 
  Upload, 
  FileVideo, 
  LogOut, 
  User, 
  LayoutDashboard,
  RefreshCw
} from 'lucide-react'
import VideoUploader from '@/components/VideoUploader'
import VideoList from '@/components/VideoList'
import DashboardStats from '@/components/DashboardStats'
import RecentActivity from '@/components/RecentActivity'
import ActiveJobs from '@/components/ActiveJobs'
import { Video } from '@/types/video'
import { DashboardData } from '@/types/dashboard'

type TabType = 'overview' | 'upload' | 'videos'

export default function DashboardPage() {
  const { user, loading, session, logout } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!session?.access_token) return

    try {
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setDashboardLoading(false)
      setRefreshing(false)
    }
  }, [session?.access_token])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && session) {
      fetchDashboardData()
    }
  }, [user, session, fetchDashboardData, refreshTrigger])

  const handleUploadComplete = (video: Video) => {
    // Switch to videos tab and refresh the data
    setActiveTab('videos')
    setRefreshTrigger(prev => prev + 1)
  }

  const handleLogout = async () => {
    await logout()
  }

  const handleRefresh = () => {
    setRefreshing(true)
    setRefreshTrigger(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'upload', label: 'Upload Video', icon: <Upload className="w-4 h-4" /> },
    { id: 'videos', label: 'My Videos', icon: <FileVideo className="w-4 h-4" /> }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                <FileVideo className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">AI Video Repurposer</h1>
                <p className="text-sm text-slate-400">Transform videos into engaging clips</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300">{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg border border-red-600/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-2 bg-slate-800/50 p-1 rounded-xl w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-white/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm">Refresh</span>
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' ? (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Welcome back!</h2>
              <p className="text-slate-400">
                Here's an overview of your video processing activity
              </p>
            </div>

            {/* Statistics Cards */}
            <DashboardStats 
              stats={dashboardData?.stats || null} 
              loading={dashboardLoading} 
            />

            {/* Two Column Layout for Activity and Jobs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Jobs */}
              <ActiveJobs 
                jobs={dashboardData?.activeJobs || []}
                loading={dashboardLoading}
                onRefresh={handleRefresh}
              />

              {/* Recent Activity */}
              <RecentActivity 
                activities={dashboardData?.recentActivity || []}
                loading={dashboardLoading}
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('upload')}
                  className="flex items-center gap-3 p-4 bg-purple-600/10 hover:bg-purple-600/20 rounded-lg border border-purple-600/20 transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-purple-600/20 group-hover:bg-purple-600/30">
                    <Upload className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">Upload Video</p>
                    <p className="text-slate-400 text-sm">Add a new video to process</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('videos')}
                  className="flex items-center gap-3 p-4 bg-blue-600/10 hover:bg-blue-600/20 rounded-lg border border-blue-600/20 transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-blue-600/20 group-hover:bg-blue-600/30">
                    <FileVideo className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">View Videos</p>
                    <p className="text-slate-400 text-sm">Manage your video library</p>
                  </div>
                </button>

                <div className="flex items-center gap-3 p-4 bg-slate-600/10 rounded-lg border border-slate-600/20">
                  <div className="p-2 rounded-lg bg-slate-600/20">
                    <LayoutDashboard className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-slate-300 font-medium">Dashboard</p>
                    <p className="text-slate-500 text-sm">You're already here</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'upload' ? (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Upload a New Video</h2>
              <p className="text-slate-400">
                Upload your video and let AI transform it into engaging clips for social media
              </p>
            </div>
            <VideoUploader
              onUploadComplete={handleUploadComplete}
            />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">My Videos</h2>
              <p className="text-slate-400">
                Manage and track all your uploaded videos and their processing status
              </p>
            </div>
            <VideoList
              refreshTrigger={refreshTrigger}
              onVideoSelect={(video) => {
                // TODO: Navigate to video detail page
                console.log('Selected video:', video)
              }}
            />
          </div>
        )}
      </main>
    </div>
  )
}
