'use client'

import { useState, useTransition } from 'react'

import { Loader2 } from 'lucide-react'
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

/* -------------------------------------------------------------------------- */
/*                                    CONS                                    */
/* -------------------------------------------------------------------------- */

const CATEGORIES = [
  'EDUCATION',
  'EXPERIENCE',
  'PROJECT',
  'AWARD',
  'CERTIFICATION',
  'OTHER',
] as const

const PROOF_TYPES = ['EVM', 'JSON', 'PAYMENT', 'ADDRESS'] as const

/* -------------------------------------------------------------------------- */
/*                                   PROPS                                    */
/* -------------------------------------------------------------------------- */

interface Props {
  addCredentialAction: (formData: FormData) => Promise<{ error?: string } | void>
}

/* -------------------------------------------------------------------------- */
/*                                    VIEW                                    */
/* -------------------------------------------------------------------------- */

export default function AddCredentialForm({ addCredentialAction }: Props) {
  const [isPending, startTransition] = useTransition()
  const [proofType, setProofType] = useState<(typeof PROOF_TYPES)[number]>('EVM')

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
        /* NEXT redirects throw an error we treat as success */
        if (err?.digest === 'NEXT_REDIRECT' || err?.message === 'NEXT_REDIRECT') {
          toast.success('Credential added.', { id: toastId })
        } else {
          toast.error(err?.message ?? 'Something went wrong.', { id: toastId })
        }
      }
    })
  }

  /* ------------------------------ UI ----------------------------------- */
  const isJson = proofType === 'JSON'

  return (
    <form onSubmit={handleSubmit} className='space-y-8'>
      {/* Essential fields */}
      <div className='grid gap-6 sm:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='title'>Title</Label>
          <Input
            id='title'
            name='title'
            required
            placeholder='e.g. Senior Front-End Engineer'
            autoComplete='off'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='category'>Category</Label>
          <Select name='category' required defaultValue='EXPERIENCE'>
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

        <div className='space-y-2'>
          <Label htmlFor='type'>Type / Sub-type</Label>
          <Input id='type' name='type' required placeholder='e.g. full_time / github_repo' />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='fileUrl'>File URL</Label>
          <Input
            id='fileUrl'
            name='fileUrl'
            type='url'
            required
            placeholder='https://example.com/credential.pdf'
          />
        </div>

        {/* Proof type */}
        <div className='space-y-2'>
          <Label htmlFor='proofType'>Proof Type</Label>
          <Select
            name='proofType'
            required
            value={proofType}
            onValueChange={(val) => setProofType(val as (typeof PROOF_TYPES)[number])}
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
        </div>

        {/* Proof data */}
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
      </div>

      {/* Optional issuer combobox */}
      <IssuerSelect />

      {/* Submit */}
      <Button type='submit' disabled={isPending} className='w-full sm:w-max'>
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