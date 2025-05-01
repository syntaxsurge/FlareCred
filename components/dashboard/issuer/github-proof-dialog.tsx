'use client'

import { Github } from 'lucide-react'

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function GithubProofDialog({ proofJson }: { proofJson: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type='button'
          className='text-primary inline-flex items-center gap-2 font-medium underline-offset-2 hover:underline'
        >
          <Github className='h-4 w-4' />
          View GitHub Proof
        </button>
      </DialogTrigger>

      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Github className='h-5 w-5' />
            GitHub Proof JSON
          </DialogTitle>
        </DialogHeader>

        <pre className='bg-muted max-h-[70vh] overflow-auto rounded-md p-4 text-xs leading-relaxed whitespace-pre-wrap'>
          {proofJson}
        </pre>
      </DialogContent>
    </Dialog>
  )
}
