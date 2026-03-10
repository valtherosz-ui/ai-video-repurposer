import Link from "next/link";
import { Upload, Video, Wand2, Share2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="h-8 w-8 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">AI Video Repurposer</h1>
          </div>
          <nav className="flex gap-4">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-white/80 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full text-purple-300 mb-6">
            <Wand2 className="h-4 w-4" />
            <span className="text-sm font-medium">Powered by AI</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Transform Long Videos Into{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Viral Short Clips
            </span>
          </h2>
          <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
            Upload your video and let AI automatically extract highlights, generate
            engaging clips, and prepare them for TikTok, Reels, and YouTube Shorts.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all transform hover:scale-105 font-semibold text-lg"
            >
              <Upload className="h-5 w-5" />
              Get Started Free
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all backdrop-blur-sm font-semibold text-lg"
            >
              Learn More
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <FeatureCard
              icon={<Video className="h-8 w-8 text-purple-400" />}
              title="Smart Analysis"
              description="AI analyzes your video content to identify the most engaging moments and highlights"
            />
            <FeatureCard
              icon={<Wand2 className="h-8 w-8 text-pink-400" />}
              title="Auto-Generate Clips"
              description="Automatically create perfectly timed clips optimized for social media platforms"
            />
            <FeatureCard
              icon={<Share2 className="h-8 w-8 text-blue-400" />}
              title="Easy Export"
              description="Download clips or share directly to TikTok, Instagram, and YouTube"
            />
          </div>

          {/* How It Works */}
          <div id="how-it-works" className="text-left max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-white mb-10 text-center">
              How It Works
            </h3>
            <div className="space-y-8">
              <Step
                step="1"
                title="Upload Your Video"
                description="Drag and drop or select your video file. We support MP4, MOV, AVI, and MKV formats up to 500MB."
              />
              <Step
                step="2"
                title="AI Processing"
                description="Our AI transcribes the audio, analyzes the video content, and identifies key moments and highlights."
              />
              <Step
                step="3"
                title="Review & Edit"
                description="Preview the generated clips, adjust timing, add titles, and customize as needed."
              />
              <Step
                step="4"
                title="Export & Share"
                description="Download your clips in various formats or share directly to your favorite social media platforms."
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-4 text-center text-white/60">
          <p>&copy; 2025 AI Video Repurposer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition-all">
      <div className="flex justify-center mb-4">{icon}</div>
      <h4 className="text-xl font-semibold text-white mb-2">{title}</h4>
      <p className="text-white/70">{description}</p>
    </div>
  );
}

function Step({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-6">
      <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
        {step}
      </div>
      <div>
        <h4 className="text-xl font-semibold text-white mb-2">{title}</h4>
        <p className="text-white/70">{description}</p>
      </div>
    </div>
  );
}
