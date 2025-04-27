import { NextResponse } from 'next/server'

import { buildResumeData, generateResumePdf } from '@/lib/resume/resume-builder'

interface Params {
  params: { candidateId: string }
}

export async function GET(_req: Request, { params }: Params) {
  const candidateId = Number(params.candidateId)
  if (Number.isNaN(candidateId)) {
    return NextResponse.json({ error: 'Invalid candidate id.' }, { status: 400 })
  }

  /* Build resume */
  const data = await buildResumeData(candidateId)
  if (!data) {
    return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 })
  }

  /* Generate PDF */
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
