import { NextResponse } from 'next/server'

import { buildResumeData, generateResumePdf } from '@/lib/resume/resume-builder'
import type { ResumeRouteParams as Params } from '@/lib/types/forms'

/**
 * GET /api/candidates/[candidateId]/resume
 *
 * Generates a résumé PDF for the specified candidate.
 */
export async function GET(_req: Request, { params }: Params) {
  // `params` is (or soon will be) a Promise – always await before usage.
  const candidateId = Number((await params).candidateId)
  if (Number.isNaN(candidateId)) {
    return NextResponse.json({ error: 'Invalid candidate id.' }, { status: 400 })
  }

  /* -------------------------------------------------------------------- */
  /*                             Build résumé                             */
  /* -------------------------------------------------------------------- */
  const data = await buildResumeData(candidateId)
  if (!data) {
    return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 })
  }

  /* -------------------------------------------------------------------- */
  /*                            Generate PDF                              */
  /* -------------------------------------------------------------------- */
  const pdfBytes = await generateResumePdf(data)
  const fileName = `${data.name.replace(/\s+/g, '_').toLowerCase() || 'resume'}.pdf`

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  })
}