// Centralised utilities for recruiter "Why Hire” summaries
export type CandidateFitJson = {
  bullets: string[]
  bestPipeline: string
  pros: string[]
  cons: string[]
}

/**
 * Validate the JSON object returned by OpenAI for the "Why Hire” prompt.
 *
 * @param payload Parsed JSON value
 * @returns       `null` when valid, otherwise a human-readable error message
 */
export function validateCandidateFitJson(payload: any): string | null {
  if (typeof payload !== 'object' || payload === null) {
    return 'Response is not a JSON object.'
  }

  /* ----------- bullets ----------- */
  if (!Array.isArray(payload.bullets) || payload.bullets.length !== 5) {
    return '"bullets" must be an array containing exactly 5 items.'
  }
  if (payload.bullets.some((b: any) => typeof b !== 'string' || b.trim().length === 0)) {
    return 'Every "bullets" item must be a non-empty string.'
  }

  /* -------- bestPipeline --------- */
  if (typeof payload.bestPipeline !== 'string' || payload.bestPipeline.trim().length === 0) {
    return '"bestPipeline" must be a non-empty string (or "NONE").'
  }

  /* ------------ pros ------------- */
  if (!Array.isArray(payload.pros) || payload.pros.length === 0) {
    return '"pros" must be a non-empty string array.'
  }
  if (payload.pros.some((p: any) => typeof p !== 'string' || p.trim().length === 0)) {
    return 'Every "pros" item must be a non-empty string.'
  }

  /* ------------ cons ------------- */
  if (!Array.isArray(payload.cons) || payload.cons.length === 0) {
    return '"cons" must be a non-empty string array.'
  }
  if (payload.cons.some((c: any) => typeof c !== 'string' || c.trim().length === 0)) {
    return 'Every "cons" item must be a non-empty string.'
  }

  return null
}