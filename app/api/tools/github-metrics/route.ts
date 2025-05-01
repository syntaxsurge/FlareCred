import { NextRequest, NextResponse } from 'next/server'

import { Octokit } from '@octokit/rest'

import { requireAuth } from '@/lib/auth/guards'
import { GITHUB_TOKEN } from '@/lib/config'

/**
 * GET /api/tools/github-metrics?repo={owner}/{repo}
 *
 * Returns: { proof: IJsonApi.Proof }
 */
export async function GET(req: NextRequest) {
  /* ---------------------------- Auth guard ---------------------------- */
  const user = await requireAuth(['candidate'])

  /* --------------------------- Param parse ---------------------------- */
  const repoParam = req.nextUrl.searchParams.get('repo')?.trim()
  if (!repoParam || !/^[\w.-]+\/[\w.-]+$/.test(repoParam)) {
    return NextResponse.json({ error: 'Invalid repo param' }, { status: 400 })
  }
  const [owner, repo] = repoParam.split('/') as [string, string]

  /* ----------------------- GitHub fetch + proof ----------------------- */
  try {
    const octokit = new Octokit({ auth: GITHUB_TOKEN })
    const { data } = await octokit.rest.repos.get({ owner, repo })

    const metrics = {
      full_name: data.full_name,
      description: data.description,
      html_url: data.html_url,
      default_branch: data.default_branch,
      stargazers_count: data.stargazers_count,
      forks_count: data.forks_count,
      open_issues_count: data.open_issues_count,
      watchers_count: data.watchers_count,
      size: data.size,
      language: data.language,
      license: data.license?.spdx_id ?? data.license?.key ?? null,
      created_at: data.created_at,
      updated_at: data.updated_at,
      pushed_at: data.pushed_at,
    }

    const proof = {
      schema: 'fdc:flareschema/jsonapi/1-0-0',
      request: {
        method: 'GET',
        url: `https://api.github.com/repos/${owner}/${repo}`,
        headers: { Accept: 'application/vnd.github.v3+json' },
      },
      response: {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: metrics,
      },
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json({ proof })
  } catch (err: any) {
    const msg =
      err?.response?.status === 404
        ? 'Repository not found on GitHub'
        : err?.message || 'GitHub API error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
