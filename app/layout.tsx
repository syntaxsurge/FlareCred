import './globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import { Inter } from 'next/font/google'

import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'

import PublicEnvScript from '@/components/public-env-script'
import SiteHeader from '@/components/site-header'
import { ThemeProvider } from '@/components/theme-provider'
import { UserProvider } from '@/lib/auth'
import { isDatabaseHealthy } from '@/lib/db/health'
import { getUser } from '@/lib/db/queries/queries'
import { Web3Provider } from '@/lib/wallet'

export const metadata: Metadata = {
  title: 'FlareCred',
  description: 'AI-Assisted, Credential-Backed Hiring on Flare.',
  icons: { icon: '/images/favicon.ico' },
}

export const viewport: Viewport = {
  maximumScale: 1,
}

const inter = Inter({ subsets: ['latin'] })

/**
 * Root layout — if the database is unreachable we short-circuit and render
 * a friendly downtime screen; otherwise the normal application shell loads.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const dbOk = await isDatabaseHealthy()

  /* --------------------------- Downtime screen --------------------------- */
  if (!dbOk) {
    return (
      <html lang='en' className={`bg-background text-foreground ${inter.className}`}>
        <body className='flex min-h-screen flex-col items-center justify-center px-4 text-center'>
          <h1 className='text-4xl font-extrabold tracking-tight'>
            Our database is having a nap 😴
          </h1>
          <p className='text-muted-foreground mt-4 max-w-md'>
            We’re unable to reach the FlareCred database right now. Please try again in a few
            minutes while we reconnect everything behind the scenes.
          </p>
        </body>
      </html>
    )
  }

  /* ---------------------------- Normal shell ----------------------------- */
  const userPromise = getUser()

  return (
    <html
      lang='en'
      className={`bg-background text-foreground ${inter.className}`}
      suppressHydrationWarning
    >
      <body className='min-h-[100dvh]'>
        <PublicEnvScript />

        <Web3Provider>
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            disableTransitionOnChange
          >
            <Toaster
              position='bottom-right'
              toastOptions={{
                classNames: {
                  toast:
                    'pointer-events-auto relative flex w-[360px] items-start overflow-hidden rounded-lg border bg-white/90 dark:bg-zinc-900/90 shadow-lg ring-1 ring-border/50 backdrop-blur-md',
                  title: 'font-semibold text-foreground',
                  description: 'text-sm text-muted-foreground',
                  actionButton:
                    'inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90',
                  cancelButton:
                    'inline-flex h-8 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-muted',
                  closeButton:
                    'p-1 ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                },
              }}
            />

            <UserProvider userPromise={userPromise}>
              <SiteHeader />
              <main className='px-4 md:px-6'>{children}</main>
            </UserProvider>
          </ThemeProvider>
        </Web3Provider>
      </body>
    </html>
  )
}
