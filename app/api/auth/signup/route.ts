import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { headers } from 'next/headers'
import { signupRateLimiter } from '@/lib/rate-limit'

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
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
    const rateLimitResult = await signupRateLimiter.check(ip)
    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      console.warn(`Rate limit exceeded for IP: ${ip}`)
      return NextResponse.json(
        { 
          error: 'Too many signup attempts. Please try again later.',
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
    const validationResult = signupSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, password } = validationResult.data

    // Create user with Supabase
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      // Log failed signup attempt with masked email (PII-safe)
      console.warn(`Failed signup attempt for email: ${maskEmail(email)}, IP: ${ip}, Error: ${error.message}`)

      // Handle specific error cases with generic messages
      if (error.message.includes('already registered') || error.message.includes('User already registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 400 }
      )
    }

    // Clear rate limit on successful signup
    await signupRateLimiter.reset(ip)

    // Log successful signup with masked email (PII-safe)
    console.info(`Successful signup for user: ${data.user?.id}, Email: ${maskEmail(email)}, IP: ${ip}`)

    return NextResponse.json({
      message: 'Signup successful',
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
      session: data.session, // Return session for auto-login
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
