import { NextRequest, NextResponse } from 'next/server'
import { verifyShareToken } from '@/lib/shareTokens'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    if (!token) {
      return NextResponse.json(
        { error: 'Missing token parameter' },
        { status: 400 }
      )
    }

    // Verify and decode token
    const tokenData = verifyShareToken(token)

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired share token' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        bundleId: tokenData.bundleId,
        summaryData: tokenData.summaryData,
        reviewItems: tokenData.reviewItems,
        created: new Date(tokenData.created).toISOString(),
        expires: new Date(tokenData.expiry).toISOString()
      }
    })
  } catch (error) {
    console.error('Failed to retrieve shared data:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve shared data' },
      { status: 500 }
    )
  }
}