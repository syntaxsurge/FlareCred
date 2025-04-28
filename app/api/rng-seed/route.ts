import { NextResponse } from 'next/server'

import { randomMod } from '@/lib/contracts/flare'

/**
 * GET /api/rng-seed?max=NUMBER
 *
 * Returns a JSON payload `{ seed: "0x…" }` where the seed is a hex-encoded
 * uint256 obtained from RngHelper.randomMod(max).  Clients include this seed
 * in quiz attempts so anyone can later reproduce the question order.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const maxRaw = searchParams.get('max')

  /* Validate query param -------------------------------------------------- */
  const max = Number(maxRaw)
  if (!maxRaw || !Number.isFinite(max) || max < 1) {
    return NextResponse.json({ error: 'Invalid or missing "max” query param' }, { status: 400 })
  }

  /* Fetch verifiable randomness ------------------------------------------ */
  try {
    const rnd = await randomMod(BigInt(max))
    const seed = `0x${rnd.toString(16)}`

    return NextResponse.json({ seed })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'RNG failure' }, { status: 500 })
  }
}