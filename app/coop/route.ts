import { NextResponse } from 'next/server'

/**
 * Responds to Next.js’ client-side "checkCrossOriginOpenerPolicy” fetch.
 * Returning 204 along with the required headers prevents the 404 error
 * that surfaces in the browser console during development.
 */
const headers = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
}

export function GET() {
  return new NextResponse(null, { status: 204, headers })
}

export function HEAD() {
  return new NextResponse(null, { status: 204, headers })
}