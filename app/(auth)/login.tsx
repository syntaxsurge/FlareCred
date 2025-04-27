'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useActionState, useEffect, useRef } from 'react'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ActionState } from '@/lib/auth/middleware'

import { signIn, signUp } from './actions'

type Role = 'candidate' | 'recruiter' | 'issuer'
interface LoginProps {
  mode?: 'signin' | 'signup'
  fixedRole?: Role
}

export function Login({ mode = 'signin', fixedRole }: LoginProps) {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const priceId = searchParams.get('priceId')
  const inviteId = searchParams.get('inviteId')
  const roleFromQuery = searchParams.get('role') as Role | null
  const role = fixedRole ?? roleFromQuery ?? undefined

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' },
  )

  /* ---------------- Wallet connection ---------------- */
  const { address } = useAccount()
  const prevAddress = useRef<string | undefined>(undefined)

  /* Toasts for auth feedback */
  useEffect(() => {
    if (state?.error) toast.error(state.error)
    if ((state as any)?.success) toast.success((state as any).success)
  }, [state])

  /* Notify when the user disconnects the wallet */
  useEffect(() => {
    if (mode === 'signup' && prevAddress.current && !address) {
      toast.info('Wallet disconnected. Please reconnect to continue.')
    }
    prevAddress.current = address
  }, [address, mode])

  /* ---------------- Helpers ---------------- */
  function buildSwapLink() {
    const base = mode === 'signin' ? '/sign-up' : '/sign-in'
    const qp = new URLSearchParams()
    if (redirect) qp.set('redirect', redirect)
    if (priceId) qp.set('priceId', priceId)
    if (role) qp.set('role', role)
    return `${base}?${qp.toString()}`
  }

  const heading = mode === 'signin' ? 'Sign in to FlareCred' : 'Create your FlareCred account'

  /* ---------------- View ---------------- */
  return (
    <div className='from-background via-muted to-background relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-gradient-to-br px-4 py-12 sm:px-6 lg:px-8'>
      {/* Decorative backdrop */}
      <div className='from-primary/10 pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] via-transparent to-transparent' />

      <Card className='ring-border/40 w-full max-w-md border-none shadow-xl ring-1 backdrop-blur-sm'>
        <CardHeader className='space-y-4 text-center'>
          <div className='flex justify-center'>
            <Image
              src='/images/flarecred-logo.png'
              alt='FlareCred logo'
              width={48}
              height={48}
              priority
              className='h-12 w-auto'
            />
          </div>
          <CardTitle className='text-foreground text-2xl font-extrabold sm:text-3xl'>
            {heading}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* RainbowKit wallet connect — only for sign-up */}
          {mode === 'signup' && (
            <div className='mb-6 flex justify-center'>
              <ConnectButton accountStatus='address' showBalance={false} chainStatus='icon' />
            </div>
          )}

          <form className='space-y-6' action={formAction}>
            {/* Hidden meta inputs */}
            <input type='hidden' name='redirect' value={redirect || ''} />
            <input type='hidden' name='priceId' value={priceId || ''} />
            <input type='hidden' name='inviteId' value={inviteId || ''} />
            {/* Wallet address (required for sign-up) */}
            {mode === 'signup' && (
              <input type='hidden' name='walletAddress' value={address || ''} />
            )}

            {mode === 'signup' && (
              <div>
                <Label htmlFor='role'>I am signing up as</Label>
                <select
                  id='role'
                  name='role'
                  defaultValue={role || 'candidate'}
                  className='border-border focus-visible:ring-primary bg-background mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:outline-none'
                >
                  <option value='candidate'>Candidate</option>
                  <option value='recruiter'>Recruiter / Employer</option>
                  <option value='issuer'>Issuer (University / Employer)</option>
                </select>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <Label htmlFor='name'>Full name</Label>
                <Input
                  id='name'
                  name='name'
                  type='text'
                  autoComplete='name'
                  required
                  maxLength={100}
                  placeholder='Jane Doe'
                  className='mt-1'
                />
              </div>
            )}

            <div>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                name='email'
                type='email'
                autoComplete='email'
                defaultValue={(state as any).email}
                required
                maxLength={50}
                placeholder='you@example.com'
                className='mt-1'
              />
            </div>

            <div>
              <Label htmlFor='password'>Password</Label>
              <Input
                id='password'
                name='password'
                type='password'
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                minLength={8}
                maxLength={100}
                placeholder='••••••••'
                className='mt-1'
              />
            </div>

            <Button
              type='submit'
              className='flex w-full items-center justify-center rounded-full'
              disabled={
                pending || (mode === 'signup' && !address)
              }
            >
              {pending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
                </>
              ) : mode === 'signin' ? (
                'Sign in'
              ) : (
                'Sign up'
              )}
            </Button>
          </form>

          <div className='mt-8 text-center text-sm'>
            {mode === 'signin' ? (
              <>
                New to FlareCred?{' '}
                <Link
                  href={buildSwapLink()}
                  className='text-primary font-medium underline-offset-4 hover:underline'
                >
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link
                  href={buildSwapLink()}
                  className='text-primary font-medium underline-offset-4 hover:underline'
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}