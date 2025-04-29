'use client'

const steps = [
  {
    title: 'Create Account',
    detail: 'Sign up and spin-up your team workspace.',
  },
  {
    title: 'Add Credentials',
    detail: 'Upload diplomas, certificates and references to your vault.',
  },
  {
    title: 'Request Verification',
    detail: 'Choose a listed issuer to cryptographically sign each credential.',
  },
  {
    title: 'Prove Skills',
    detail: 'Pass AI-graded quizzes to mint SkillPass verifiable credentials.',
  },
  {
    title: 'Get Discovered',
    detail: 'Recruiters filter the talent pool by verified proofs and scores.',
  },
]

export default function WorkflowSection() {
  return (
    <section id='workflow' className='bg-background py-24'>
      <div className='mx-auto max-w-6xl px-4'>
        <h2 className='text-center text-3xl font-extrabold tracking-tight sm:text-4xl'>
          How FlareCred Works
        </h2>

        {/* Responsive layout: stacked on mobile, horizontal on md+ */}
        <div className='mt-16 grid gap-12 md:grid-cols-5'>
          {steps.map((step, idx) => (
            <div key={step.title} className='relative flex flex-col items-center text-center'>
              <div className='flex size-12 items-center justify-center rounded-full bg-flare-gradient text-lg font-bold text-white shadow-lg'>
                {idx + 1}
              </div>
              <h3 className='text-foreground mt-4 text-lg font-semibold'>{step.title}</h3>
              <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>{step.detail}</p>
              {/* Connector line (md+) */}
              {idx < steps.length - 1 && (
                <span className='bg-border absolute top-6 right-[-50%] hidden h-px w-[100%] md:block' />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}