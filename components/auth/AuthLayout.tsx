import { ReactNode } from 'react'
import Link from 'next/link'
import { Video, Sparkles } from 'lucide-react'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle: string
  backLink?: { href: string; text: string }
}

export function AuthLayout({ children, title, subtitle, backLink }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="hidden lg:block text-white space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl">
              <Video className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold">AI Video Repurposer</h1>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight">
              Transform Your Videos into Viral Clips
            </h2>
            <p className="text-xl text-slate-300">
              AI-powered platform that automatically extracts highlights from your long videos and creates engaging short clips for TikTok, Reels, and YouTube Shorts.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <div className="flex items-start gap-3">
              <div className="bg-purple-500/20 p-2 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold">AI-Powered Analysis</h3>
                <p className="text-sm text-slate-400">Smart highlight detection using GPT-4 Vision</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-purple-500/20 p-2 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold">Automatic Transcription</h3>
                <p className="text-sm text-slate-400">Powered by OpenAI Whisper</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-purple-500/20 p-2 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold">One-Click Export</h3>
                <p className="text-sm text-slate-400">Export to all major social platforms</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          {backLink && (
            <Link
              href={backLink.href}
              className="inline-flex items-center text-sm text-slate-300 hover:text-white transition-colors mb-6"
            >
              ← {backLink.text}
            </Link>
          )}
          
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
            <p className="text-slate-300">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
