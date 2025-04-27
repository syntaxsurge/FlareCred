'use client'

import { Users, Mail, Lock, FolderKanban } from 'lucide-react'

const features = [
  {
    icon: Users,
    title: 'Team Management',
    description: 'Invite colleagues and manage roles seamlessly within your organisation.',
  },
  {
    icon: Mail,
    title: 'Issuer Workflow',
    description: 'Streamline credential requests and approvals with real issuers.',
  },
  {
    icon: Lock,
    title: 'Secure & Private',
    description: 'All data & credentials are encrypted and under your control.',
  },
  {
    icon: FolderKanban,
    title: 'Organised Dashboard',
    description: 'Navigate profiles, credentials and pipelines with ease.',
  },
]

export default function FeaturesSection() {
  return (
    <section id='features' className='bg-muted/50 py-20'>
      <div className='mx-auto max-w-6xl px-4 text-center'>
        <h2 className='text-foreground text-3xl font-extrabold tracking-tight sm:text-4xl'>
          Core Features
        </h2>

        <div className='mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4'>
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className='group border-border/60 bg-background/70 relative flex flex-col items-center overflow-hidden rounded-2xl border p-8 backdrop-blur transition-transform hover:-translate-y-1 hover:shadow-2xl'
            >
              <div className='mb-4 inline-flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 text-white shadow-lg'>
                <Icon className='h-6 w-6' />
              </div>

              <h3 className='text-foreground text-lg font-semibold'>{title}</h3>
              <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>{description}</p>

              {/* Hover glow */}
              <div className='pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-15'>
                <div className='absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 blur-3xl' />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
