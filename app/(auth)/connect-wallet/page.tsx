'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Wallet } from 'lucide-react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'

/**
 * Connect Wallet — prompts visitors to connect a wallet before using the app.
 * If a wallet is already connected, we immediately take them to the dashboard.
 */
export default function ConnectWalletPage() {
  const router = useRouter()
  const { isConnected } = useAccount()

  /* Auto-redirect once the wallet connects */
  useEffect(() => {
    if (isConnected) router.replace('/dashboard')
  }, [isConnected, router])

  return (
    <section className='mx-auto flex min-h-[calc(100dvh-64px)] max-w-md flex-col items-center justify-center gap-6 px-4 text-center'>
      <div className='flex flex-col items-center gap-4'>
        <Wallet className='h-10 w-10 text-primary' strokeWidth={1.5} />
        <h1 className='text-3xl font-extrabold tracking-tight'>Connect Your Wallet</h1>
        <p className='text-muted-foreground max-w-xs text-sm'>
          To continue, please connect an EVM wallet such as MetaMask or WalletConnect.
        </p>
      </div>

      <ConnectButton
        accountStatus='avatar'
        chainStatus='icon'
        showBalance={false}
        className='w-full justify-center'
      />
    </section>
  )
}