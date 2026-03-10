import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { headers } from 'next/headers'
import { loginRateLimiter } from '@/lib/rate-limit'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
})

/**
 * Mask email for privacy-safe logging
 * Example: "john.doe@example.com" -> "jo***@example.com"
 */
function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) return '***'
  const maskedLocal = localPart.length > 2 
    ? `${localPart.slice(0, 2)}***` 
    : '***'
  return `${maskedLocal}@${domain}`
}

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') || 
               headersList.get('x-real-ip') || 
               'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    // Rate limiting
    const rateLimitResult = await loginRateLimiter.check(ip)
    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      console.warn(`Rate limit exceeded for IP: ${ip}`)
      return NextResponse.json(
        { 
          error: 'Too many login attempts. Please try again later.',
          retryAfter 
        },
        { 
          status: 429,
          headers: { 'Retry-After': String(retryAfter) }
        }
      )
    }

    const body = await request.json()

    // Validate input
    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, password, rememberMe } = validationResult.data

    // Sign in with Supabase
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Log failed login attempt with masked email (PII-safe)
      console.warn(`Failed login attempt for email: ${maskEmail(email)}, IP: ${ip}, Error: ${error.message}`)

      // Handle specific error cases with generic messages
      if (error.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }
      if (error.message.includes('Email not confirmed')) {
        return NextResponse.json(
          { error: 'Please confirm your email address' },
          { status: 403 }
        )
      }
      return NextResponse.json(
        { error: 'Authentication failed. Please try again.' },
        { status: 400 }
      )
    }

    // Clear rate limit on successful login
    await loginRateLimiter.reset(ip)

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      // Don't fail login if profile doesn't exist yet
      // Profile will be created by database trigger
    }

    // Log successful login with masked email (PII-safe)
    console.info(`Successful login for user: ${data.user.id}, Email: ${maskEmail(email)}, IP: ${ip}`)

    // Handle "Remember Me" functionality
    // If rememberMe is true, the session will persist longer
    // Supabase handles this via cookie configuration
    if (rememberMe) {
      // The session cookie is already set by Supabase
      // Additional session persistence is handled by the auth state
    }

    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        profile,
      },
      session: data.session,
      remembered: rememberMe,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
