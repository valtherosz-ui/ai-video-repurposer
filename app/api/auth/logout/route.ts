import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (user) {
      console.info(`Logout for user: ${user.id}, IP: ${ip}, User-Agent: ${userAgent}`)
    }

    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      console.error('Logout error:', signOutError)
      return NextResponse.json(
        { error: 'Failed to logout. Please try again.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Logout successful',
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
