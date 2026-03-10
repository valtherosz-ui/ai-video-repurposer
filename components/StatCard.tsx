'use client'

import { Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import { StatCardProps } from '@/types/dashboard'

const colorVariants = {
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    icon: 'text-purple-400',
    text: 'text-purple-400',
    gradient: 'from-purple-500/20 to-purple-500/5'
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: 'text-blue-400',
    text: 'text-blue-400',
    gradient: 'from-blue-500/20 to-blue-500/5'
  },
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    icon: 'text-green-400',
    text: 'text-green-400',
    gradient: 'from-green-500/20 to-green-500/5'
  },
  yellow: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    icon: 'text-yellow-400',
    text: 'text-yellow-400',
    gradient: 'from-yellow-500/20 to-yellow-500/5'
  },
  red: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    icon: 'text-red-400',
    text: 'text-red-400',
    gradient: 'from-red-500/20 to-red-500/5'
  }
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color,
  loading = false
}: StatCardProps) {
  const variant = colorVariants[color]

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-center h-24">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-gradient-to-br ${variant.gradient} backdrop-blur-sm rounded-xl p-6 border ${variant.border} hover:scale-[1.02] transition-transform duration-200`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${variant.bg}`}>
          <div className={variant.icon}>
            {icon}
          </div>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {trend.isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      
      <div>
        <p className="text-slate-400 text-sm mb-1">{title}</p>
        <p className="text-3xl font-bold text-white mb-1">{value}</p>
        {subtitle && (
          <p className="text-slate-500 text-sm">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
