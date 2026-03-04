import { NextResponse } from 'next/server'

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY
  return NextResponse.json({
    hasKey: !!key,
    keyLength: key?.length || 0,
    keyPrefix: key?.slice(0, 12) || 'MISSING',
    keySuffix: key?.slice(-4) || 'MISSING',
    nodeEnv: process.env.NODE_ENV,
  })
}
