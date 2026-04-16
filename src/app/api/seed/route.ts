import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'
import { seed } from '@/seed'

export async function GET(req: NextRequest) {
  // Safety: only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Seed endpoint is disabled in production.' },
      { status: 403 },
    )
  }

  const confirm = req.nextUrl.searchParams.get('confirm')
  if (confirm !== 'yes') {
    return NextResponse.json(
      {
        message:
          'Add ?confirm=yes to the URL to run the seed. This will populate the database with sample content. Existing entries with matching slugs will be skipped.',
      },
      { status: 200 },
    )
  }

  try {
    const payload = await getPayloadClient()
    const result = await seed(payload)
    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Seed failed', details: error?.message ?? String(error) },
      { status: 500 },
    )
  }
}
