import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface Highlight {
  start: number
  end: number
  score: number
  description: string
}

export interface VideoAnalysis {
  highlights: Highlight[]
  topics: string[]
  sentiment: string
  summary: string
}

/**
 * Analyze video frames using GPT-4 Vision API
 * @param frameUrls - Array of URLs to video frames
 * @param transcript - Video transcript for context
 * @returns Video analysis with highlights and topics
 */
export async function analyzeVideoFrames(
  frameUrls: string[],
  transcript?: string
): Promise<VideoAnalysis> {
  try {
    // Prepare messages for GPT-4 Vision
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are an expert video analyst specializing in identifying engaging moments for social media content.
Your task is to analyze video frames and identify the most compelling moments that would make great short clips.

Focus on:
1. Emotional peaks and reactions
2. Action sequences or dynamic movements
3. Key information delivery
4. Humorous or surprising moments
5. Visually striking scenes

Rate each moment on a scale of 1-10 for engagement potential.`
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: transcript 
              ? `Here are video frames with timestamps. Also, here's the transcript for context:\n\n${transcript}\n\nAnalyze these frames and identify the most engaging moments for short clips.`
              : 'Here are video frames with timestamps. Analyze these frames and identify the most engaging moments for short clips.'
          },
          ...frameUrls.map((url, index) => ({
            type: 'image_url' as const,
            image_url: {
              url: url,
              detail: 'low' as const
            }
          }))
        ]
      }
    ]

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 2000,
      temperature: 0.7
    })

    const content = response.choices[0]?.message?.content || ''
    
    // Parse the response to extract highlights, topics, and sentiment
    const analysis = parseAnalysisResponse(content)

    return analysis
  } catch (error) {
    console.error('GPT-4 Vision analysis error:', error)
    throw new Error('Failed to analyze video frames')
  }
}

/**
 * Analyze transcript for topics and sentiment
 * @param transcript - Video transcript
 * @returns Topics and sentiment analysis
 */
export async function analyzeTranscript(transcript: string): Promise<{
  topics: string[]
  sentiment: string
  summary: string
}> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert content analyst. Analyze the transcript and provide insights.'
        },
        {
          role: 'user',
          content: `Analyze this transcript and provide:
1. Main topics discussed (3-5 keywords)
2. Overall sentiment (positive, negative, neutral, mixed)
3. A brief 2-3 sentence summary

Transcript: ${transcript}

Format your response as JSON:
{
  "topics": ["topic1", "topic2", ...],
  "sentiment": "sentiment",
  "summary": "summary text"
}`
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
      temperature: 0.5
    })

    const content = response.choices[0]?.message?.content || '{}'
    return JSON.parse(content)
  } catch (error) {
    console.error('Transcript analysis error:', error)
    throw new Error('Failed to analyze transcript')
  }
}

/**
 * Generate clip suggestions based on analysis
 * @param analysis - Video analysis results
 * @param duration - Total video duration in seconds
 * @returns Suggested clip segments
 */
export async function generateClipSuggestions(
  analysis: VideoAnalysis,
  duration: number
): Promise<Array<{ start: number; end: number; title: string; description: string }>> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert video editor specializing in creating viral short clips.'
        },
        {
          role: 'user',
          content: `Based on this video analysis, suggest 3-5 optimal short clips (15-60 seconds each) for social media platforms.

Video duration: ${duration} seconds
Highlights: ${JSON.stringify(analysis.highlights)}
Topics: ${analysis.topics.join(', ')}
Sentiment: ${analysis.sentiment}

Format your response as JSON:
{
  "clips": [
    {
      "start": 0,
      "end": 30,
      "title": "Clip title",
      "description": "Brief description"
    }
  ]
}`
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
      temperature: 0.7
    })

    const content = response.choices[0]?.message?.content || '{"clips": []}'
    const result = JSON.parse(content)
    return result.clips || []
  } catch (error) {
    console.error('Clip generation error:', error)
    throw new Error('Failed to generate clip suggestions')
  }
}

/**
 * Parse GPT-4 Vision response to extract structured data
 */
function parseAnalysisResponse(content: string): VideoAnalysis {
  try {
    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(content)
      return {
        highlights: parsed.highlights || [],
        topics: parsed.topics || [],
        sentiment: parsed.sentiment || 'neutral',
        summary: parsed.summary || ''
      }
    } catch {
      // If not JSON, try to extract information from text
      const topics = extractTopics(content)
      const sentiment = extractSentiment(content)
      const highlights = extractHighlights(content)
      const summary = extractSummary(content)

      return {
        highlights,
        topics,
        sentiment,
        summary
      }
    }
  } catch (error) {
    console.error('Error parsing analysis response:', error)
    return {
      highlights: [],
      topics: [],
      sentiment: 'neutral',
      summary: ''
    }
  }
}

function extractTopics(content: string): string[] {
  const topicPatterns = [
    /topics?:\s*([^\n]+)/i,
    /main topics?:\s*([^\n]+)/i,
    /keywords?:\s*([^\n]+)/i
  ]

  for (const pattern of topicPatterns) {
    const match = content.match(pattern)
    if (match) {
      return match[1].split(',').map(t => t.trim()).filter(Boolean)
    }
  }

  return []
}

function extractSentiment(content: string): string {
  const sentimentPatterns = [
    /sentiment?:\s*(positive|negative|neutral|mixed)/i,
    /tone?:\s*(positive|negative|neutral|mixed)/i,
    /overall.*?(positive|negative|neutral|mixed)/i
  ]

  for (const pattern of sentimentPatterns) {
    const match = content.match(pattern)
    if (match) {
      return match[1].toLowerCase()
    }
  }

  return 'neutral'
}

function extractHighlights(content: string): Highlight[] {
  const highlightPattern = /highlight.*?(\d+).*?(\d+).*?(\d+).*?([^\n]+)/gi
  const highlights: Highlight[] = []
  let match

  while ((match = highlightPattern.exec(content)) !== null) {
    highlights.push({
      start: parseInt(match[1]),
      end: parseInt(match[2]),
      score: parseInt(match[3]),
      description: match[4].trim()
    })
  }

  return highlights
}

function extractSummary(content: string): string {
  const summaryPatterns = [
    /summary?:\s*([^\n]+)/i,
    /brief:?([^\n]+)/i,
    /overview:?([^\n]+)/i
  ]

  for (const pattern of summaryPatterns) {
    const match = content.match(pattern)
    if (match) {
      return match[1].trim()
    }
  }

  return ''
}
