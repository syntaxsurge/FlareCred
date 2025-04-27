import { stripe } from '@/lib/payments/stripe'

export async function seedStripe() {
  console.log('Creating Stripe products and prices...')

  // Check if we already have existing products named 'Base' or 'Plus'
  const productsList = await stripe.products.list()
  const existingBase = productsList.data.find((p) => p.name === 'Base')
  const existingPlus = productsList.data.find((p) => p.name === 'Plus')

  if (!existingBase) {
    const baseProduct = await stripe.products.create({
      name: 'Base',
      description: 'Base subscription plan',
    })

    await stripe.prices.create({
      product: baseProduct.id,
      unit_amount: 800, // $8 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
        trial_period_days: 7,
      },
    })

    console.log('Base product + price created in Stripe.')
  } else {
    console.log('Base product already exists in Stripe. Skipping creation.')
  }

  if (!existingPlus) {
    const plusProduct = await stripe.products.create({
      name: 'Plus',
      description: 'Plus subscription plan',
    })

    await stripe.prices.create({
      product: plusProduct.id,
      unit_amount: 1200, // $12 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
        trial_period_days: 7,
      },
    })

    console.log('Plus product + price created in Stripe.')
  } else {
    console.log('Plus product already exists in Stripe. Skipping creation.')
  }

  console.log('Stripe products and prices seeded successfully.')
}
