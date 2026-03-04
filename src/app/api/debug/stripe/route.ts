import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY
  
  // Test direct Stripe API call
  let stripeTest = 'not tested'
  try {
    const res = await fetch('https://api.stripe.com/v1/products?limit=1', {
      headers: { 'Authorization': `Bearer ${key}` },
    })
    stripeTest = `status=${res.status}`
  } catch (e: any) {
    stripeTest = `error: ${e.message}`
  }

  return NextResponse.json({
    hasKey: !!key,
    keyLength: key?.length || 0,
    keyPrefix: key?.slice(0, 12) || 'MISSING',
    keySuffix: key?.slice(-4) || 'MISSING',
    nodeEnv: process.env.NODE_ENV,
    stripeTest,
  })
}
