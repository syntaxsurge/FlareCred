import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  ;(await cookies()).delete('session')
  return NextResponse.json({ success: true })
}

export async function GET() {
  ;(await cookies()).delete('session')
  return NextResponse.json({ success: true })
}
