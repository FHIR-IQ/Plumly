import { NextRequest, NextResponse } from 'next/server'
import { generateShareToken } from '@/lib/shareTokens'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bundleId, summaryData, reviewItems } = body

    if (!bundleId || !summaryData) {
      return NextResponse.json(
        { error: 'Missing required fields: bundleId, summaryData' },
        { status: 400 }
      )
    }

    // Generate share token
    const token = generateShareToken({
      bundleId,
      summaryData,
      reviewItems: reviewItems || []
    })

    // Create shareable URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const shareUrl = `${baseUrl}/share/${token}`

    return NextResponse.json({
      success: true,
      shareUrl,
      token,
      expiresIn: '7 days',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })
  } catch (error) {
    console.error('Failed to create share link:', error)
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    )
  }
}