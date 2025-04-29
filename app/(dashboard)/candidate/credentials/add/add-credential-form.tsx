'use client'

import { useEffect, useRef, useState, useTransition } from 'react'

import { CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import IssuerSelect from '@/components/issuer-select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { PROOF_TYPES, type ProofType } from '@/lib/constants/credential'
import type { AddCredentialFormProps } from '@/lib/types/forms'

/* -------------------------------------------------------------------------- */
/*                                 CONSTANTS                                  */
/* -------------------------------------------------------------------------- */

const CATEGORIES = [
  'EDUCATION',
  'EXPERIENCE',
  'PROJECT',
  'AWARD',
  'CERTIFICATION',
  'OTHER',
] as const

const SUB_TYPES = ['github_repo'] as const

const GITHUB_REPO_REGEX = /^https?:\/\/github\.com\/([\w.-]+)\/([\w.-]+)(?:\/?|\.git)$/i

/* -------------------------------------------------------------------------- */
/*                                    VIEW                                    */
/* -------------------------------------------------------------------------- */

export default function AddCredentialForm({ addCredentialAction }: AddCredentialFormProps) {
  const [isPending, startTransition] = useTransition()

  const [proofType, setProofType] = useState<ProofType>('EVM')
  const [subType, setSubType] = useState<string>('')
  const [fileUrl, setFileUrl] = useState<string>('')

  const [attachPending, setAttachPending] = useState(false)
  const [proofJson, setProofJson] = useState<string>('')
  const [proofAttached, setProofAttached] = useState(false)
  const [repoDetected, setRepoDetected] = useState(false)

  const repoUrlRef = useRef<string>('')

  /* ---------------------------------------------------------------------- */
  /*                       R E P O   D E T E C T I O N                       */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const m = fileUrl.match(GITHUB_REPO_REGEX)
    if (!m) {
      if (repoDetected) {
        setRepoDetected(false)
        setProofType('EVM')
        setProofJson('')
        setProofAttached(false)
        setSubType('')
      }
      return
    }

    const repoPath = `${m[1]}/${m[2]}`
    if (repoDetected && repoUrlRef.current === repoPath) return

    repoUrlRef.current = repoPath
    setRepoDetected(true)
    setSubType('github_repo')
    setProofType('JSON')
    setAttachPending(true)
    setProofAttached(false)
    ;(async () => {
      try {
        const res = await fetch(`/api/tools/github-metrics?repo=${encodeURIComponent(repoPath)}`, {
          cache: 'no-store',
        })
        if (!res.ok) {
          throw new Error(`Endpoint error (${res.status})`)
        }
        const { proof } = await res.json()
        setProofJson(JSON.stringify(proof))
        setProofAttached(true)
      } catch (err: any) {
        toast.error(err?.message || 'Failed to attach GitHub proof – try again later.')
        setRepoDetected(false)
        setProofType('EVM')
        setSubType('')
      } finally {
        setAttachPending(false)
      }
    })()
  }, [fileUrl, repoDetected])

  /* ---------------------------------------------------------------------- */
  /*                               S U B M I T                              */
  /* ---------------------------------------------------------------------- */

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    const toastId = toast.loading('Adding credential…')
    startTransition(async () => {
      try {
        const res = await addCredentialAction(fd)
        if (res && typeof res === 'object' && 'error' in res && res.error) {
          toast.error(res.error, { id: toastId })
        } else {
          toast.success('Credential added.', { id: toastId })
        }
      } catch (err: any) {
        if (err?.digest === 'NEXT_REDIRECT' || err?.message === 'NEXT_REDIRECT') {
          toast.success('Credential added.', { id: toastId })
        } else {
          toast.error(err?.message ?? 'Something went wrong.', { id: toastId })
        }
      }
    })
  }

  const isJson = proofType === 'JSON'

  /* ---------------------------------------------------------------------- */
  /*                                   UI                                   */
  /* ---------------------------------------------------------------------- */

  return (
    <form onSubmit={handleSubmit} className='space-y-8'>
      {/* Essentials */}
      <div className='grid gap-6 sm:grid-cols-2'>
        {/* Title */}
        <div className='space-y-2'>
          <Label htmlFor='title'>Title</Label>
          <Input
            id='title'
            name='title'
            required
            placeholder='e.g. Repository Maintainer'
            autoComplete='off'
          />
        </div>

        {/* Category */}
        <div className='space-y-2'>
          <Label htmlFor='category'>Category</Label>
          <Select name='category' required defaultValue='PROJECT'>
            <SelectTrigger id='category'>
              <SelectValue placeholder='Select category' />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat.charAt(0) + cat.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Type / sub-type */}
        <div className='space-y-2'>
          <Label htmlFor='type'>Type / Sub-type</Label>
          {repoDetected ? (
            <>
              <Input
                id='type'
                name='type'
                value='github_repo'
                readOnly
                disabled
                className='opacity-70'
              />
              <input type='hidden' name='type' value='github_repo' />
            </>
          ) : (
            <Input
              id='type'
              name='type'
              required
              placeholder='e.g. full_time / github_repo'
              value={subType}
              onChange={(e) => setSubType(e.target.value)}
            />
          )}
        </div>

        {/* File / Repo URL */}
        {!repoDetected && (
          <div className='space-y-2'>
            <Label htmlFor='fileUrl'>File URL / Repository URL</Label>
            <Input
              id='fileUrl'
              name='fileUrl'
              type='url'
              required
              placeholder='https://example.com/credential.pdf or https://github.com/user/repo'
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
            />
          </div>
        )}
        {repoDetected && (
          <>
            <input type='hidden' name='fileUrl' value={fileUrl} />
            <div className='flex items-end gap-2'>
              <Label className='sr-only'>Repository URL</Label>
              <Input value={fileUrl} readOnly disabled className='flex-1 opacity-70' />
              {attachPending ? (
                <Loader2 className='text-muted-foreground h-4 w-4 animate-spin' />
              ) : proofAttached ? (
                <span className='inline-flex items-center gap-1 text-xs font-medium text-emerald-600'>
                  <CheckCircle className='h-4 w-4' />
                  proof attached
                </span>
              ) : null}
            </div>
          </>
        )}

        {/* Proof type */}
        <div className='space-y-2'>
          <Label htmlFor='proofType'>Proof Type</Label>
          <Select
            name='proofType'
            required
            value={proofType}
            onValueChange={(val) => setProofType(val as ProofType)}
            disabled={repoDetected}
          >
            <SelectTrigger id='proofType'>
              <SelectValue placeholder='Select proof type' />
            </SelectTrigger>
            <SelectContent>
              {PROOF_TYPES.map((pt) => (
                <SelectItem key={pt} value={pt}>
                  {pt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {repoDetected && <input type='hidden' name='proofType' value={proofType} />}
        </div>

        {/* Proof data */}
        {repoDetected ? (
          <textarea name='proofData' value={proofJson} readOnly hidden aria-hidden='true' />
        ) : (
          <div className='space-y-2 sm:col-span-2'>
            <Label htmlFor='proofData'>Proof Data / URL / Tx-hash</Label>
            {isJson ? (
              <textarea
                id='proofData'
                name='proofData'
                rows={4}
                required
                className='border-border w-full rounded-md border p-2 text-sm'
                placeholder='Paste raw JSON proof object here…'
              />
            ) : (
              <Input
                id='proofData'
                name='proofData'
                required
                placeholder={
                  proofType === 'EVM'
                    ? '0x… (transaction hash)'
                    : proofType === 'PAYMENT'
                      ? 'Payment tx-hash'
                      : proofType === 'ADDRESS'
                        ? '0x… (wallet address)'
                        : 'Enter proof'
                }
              />
            )}
          </div>
        )}
      </div>

      <IssuerSelect />

      <Button
        type='submit'
        disabled={isPending || attachPending || (repoDetected && !proofAttached)}
        className='w-full sm:w-max'
      >
        {isPending ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Saving…
          </>
        ) : (
          'Add Credential'
        )}
      </Button>
    </form>
  )
}
