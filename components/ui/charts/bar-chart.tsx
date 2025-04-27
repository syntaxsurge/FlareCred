'use client'

import React from 'react'

import { Bar as ReBar, BarChart as ReBarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/charts/chart'

interface BarChartProps<D extends Record<string, any> = any> {
  /** Source data array */
  data: D[]
  /** Categorical X-axis key */
  xKey: keyof D
  /** Numeric Y-axis key */
  yKey: keyof D
  /** Colour / label configuration map */
  config: ChartConfig
  /** Optional X-tick formatter (default: full label) */
  xTickFormatter?: (value: any) => string
}

export function BarChart<D extends Record<string, any> = any>({
  data,
  xKey,
  yKey,
  config,
  xTickFormatter = (v) => String(v),
}: BarChartProps<D>) {
  const colourVar = `var(--color-${String(yKey)})`

  return (
    <ChartContainer config={config}>
      <ReBarChart data={data} margin={{ top: 8, left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={xKey as string}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={xTickFormatter}
        />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <ReBar dataKey={yKey as string} fill={colourVar} radius={[4, 4, 0, 0]} />
      </ReBarChart>
    </ChartContainer>
  )
}
