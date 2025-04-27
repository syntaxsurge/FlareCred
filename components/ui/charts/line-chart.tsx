'use client'

import * as React from 'react'

import { CartesianGrid, Line as ReLine, LineChart as ReLineChart, XAxis, YAxis } from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/charts/chart'

interface LineChartProps<D extends Record<string, any> = any> {
  /** Source array */
  data: D[]
  /** X-axis key */
  xKey: keyof D
  /** Y-axis key */
  yKey: keyof D
  /** Optional fixed Y-domain */
  yDomain?: [number, number]
  /** Colour / label config */
  config: ChartConfig
  /** Optional X-tick formatter (default: first 3 chars) */
  xTickFormatter?: (value: any) => string
}

export function LineChart<D extends Record<string, any> = any>({
  data,
  xKey,
  yKey,
  yDomain,
  config,
  xTickFormatter = (v) => String(v).slice(0, 3),
}: LineChartProps<D>) {
  const colourVar = `var(--color-${String(yKey)})`

  return (
    <ChartContainer config={config}>
      <ReLineChart data={data} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={xKey as string}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={xTickFormatter}
        />
        <YAxis domain={yDomain} tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <ReLine
          dataKey={yKey as string}
          type='natural'
          stroke={colourVar}
          strokeWidth={2}
          dot={{ fill: colourVar }}
          activeDot={{ r: 6 }}
        />
      </ReLineChart>
    </ChartContainer>
  )
}
