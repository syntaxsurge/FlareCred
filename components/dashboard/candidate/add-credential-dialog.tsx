'use client'

import * as React from 'react'

import AddCredentialForm from '@/app/(dashboard)/candidate/credentials/add/add-credential-form'
import { DidRequiredModal } from '@/components/dashboard/candidate/did-required-modal'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Props {
  /** Server action wrapper passed from the parent server component */
  addCredentialAction: (formData: FormData) => Promise<{ error?: string } | void>
  /** Whether the current user’s team already has a DID */
  hasDid: boolean
}

/**
 * Renders an "Add Credential” button that opens a modal with the full
 * AddCredentialForm. If the user lacks a team DID, a blocking modal
 * prompts them to create one instead of showing the form.
 */
export default function AddCredentialDialog({ addCredentialAction, hasDid }: Props) {
  const [open, setOpen] = React.useState(false)
  const [showDidModal, setShowDidModal] = React.useState(false)

  function handleClick() {
    if (hasDid) {
      setOpen(true)
    } else {
      setShowDidModal(true)
    }
  }

  return (
    <>
      <Button size='sm' onClick={handleClick}>
        Add Credential
      </Button>

      {/* Credential form dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-xl'>
          <DialogHeader>
            <DialogTitle>New Credential</DialogTitle>
          </DialogHeader>
          <AddCredentialForm addCredentialAction={addCredentialAction} />
        </DialogContent>
      </Dialog>

      {/* DID requirement modal */}
      {showDidModal && !hasDid && <DidRequiredModal />}
    </>
  )
}
