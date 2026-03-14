/**
 * Rate Limiting Utility
 *
 * Uses Upstash Redis for rate limiting in production.
 * If Redis is not configured, rate limiting is disabled (for development).
 *
 * Usage:
 *   // For login endpoints (5 attempts per 15 minutes)
 *   const loginLimiter = createRateLimiter('login', { maxAttempts: 5, windowMs: 15 * 60 * 1000 })
 *   const allowed = await loginLimiter.check(identifier)
 *
 * Environment Variables:
 *   - UPSTASH_REDIS_REST_URL: Upstash Redis REST URL (required for rate limiting)
 *   - UPSTASH_REDIS_REST_TOKEN: Upstash Redis REST token (required for rate limiting)
 */

interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
}

/**
 * Check if Redis is configured
 */
function isRedisConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

/**
 * Redis-based rate limiting using Upstash REST API
 */
async function redisCheck(
  key: string, 
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env
  
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Redis not configured')
  }

  const redisKey = `ratelimit:${key}`
  const now = Date.now()
  const resetTime = now + config.windowMs

  try {
    // Use Upstash REST API for atomic operations
    const response = await fetch(`${UPSTASH_REDIS_REST_URL}/pipeline`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        // Get current count
        ['GET', redisKey],
        // Set expiry on the key
        ['PEXPIRE', redisKey, config.windowMs.toString()],
      ]),
    })

    if (!response.ok) {
      console.error('Redis rate limit check failed, falling back to allow')
      return { allowed: true, remaining: config.maxAttempts, resetTime }
    }

    const results = await response.json() as [string | null, string][]
    const currentCount = results[0]?.[1] ? parseInt(results[0][1], 10) : 0

    if (currentCount >= config.maxAttempts) {
      // Get TTL for reset time
      const ttlResponse = await fetch(`${UPSTASH_REDIS_REST_URL}/pttl/${redisKey}`, {
        headers: {
          'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        },
      })
      const ttl = ttlResponse.ok ? parseInt(await ttlResponse.text(), 10) : config.windowMs
      
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: now + ttl 
      }
    }

    // Increment counter
    await fetch(`${UPSTASH_REDIS_REST_URL}/incr/${redisKey}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
      },
    })

    return { 
      allowed: true, 
      remaining: config.maxAttempts - currentCount - 1, 
      resetTime 
    }
  } catch (error) {
    console.error('Redis rate limit error:', error)
    // Fail open - allow the request if Redis is unavailable
    return { allowed: true, remaining: config.maxAttempts, resetTime }
  }
}

/**
 * Create a rate limiter with the given configuration
 */
export function createRateLimiter(prefix: string, config: RateLimitConfig) {
  return {
    /**
     * Check if the request should be allowed
     * @param identifier - Unique identifier (e.g., IP address, user ID)
     * @returns Object with allowed status, remaining attempts, and reset time
     */
    async check(identifier: string): Promise<{
      allowed: boolean
      remaining: number
      resetTime: number
    }> {
      const key = `${prefix}:${identifier}`

      // Use Redis if configured (production)
      if (isRedisConfigured()) {
        return redisCheck(key, config)
      }

      // No Redis configured - disable rate limiting entirely
      return {
        allowed: true,
        remaining: config.maxAttempts,
        resetTime: Date.now() + config.windowMs
      }
    },

    /**
     * Reset the rate limit for an identifier
     * Useful for clearing rate limits after successful authentication
     */
    async reset(identifier: string): Promise<void> {
      const key = `${prefix}:${identifier}`

      if (isRedisConfigured()) {
        const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env
        if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
          await fetch(`${UPSTASH_REDIS_REST_URL}/del/${key}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
            },
          })
        }
      }
      // No-op when Redis not configured
    },

    /**
     * Get remaining attempts for an identifier without incrementing
     */
    async getRemaining(identifier: string): Promise<number> {
      const key = `${prefix}:${identifier}`

      if (isRedisConfigured()) {
        const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env
        if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
          try {
            const response = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${key}`, {
              headers: {
                'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
              },
            })
            if (response.ok) {
              const count = await response.text()
              const currentCount = count ? parseInt(count, 10) : 0
              return Math.max(0, config.maxAttempts - currentCount)
            }
          } catch (error) {
            console.error('Redis get remaining error:', error)
          }
        }
      }
      // When Redis not configured, always return max attempts
      return config.maxAttempts
    },
  }
}

// Pre-configured rate limiters for common use cases
export const loginRateLimiter = createRateLimiter('login', {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
})

export const signupRateLimiter = createRateLimiter('signup', {
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
})

export const passwordResetRateLimiter = createRateLimiter('password-reset', {
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
})
