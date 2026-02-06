'use client';

import React from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export interface AreaConfig {
  key: string;
  color: string;
  name: string;
}

export interface AreaChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  areas: AreaConfig[];
  title?: string;
  height?: number;
}

export function AreaChart({
  data,
  xKey,
  areas,
  title,
  height = 300,
}: AreaChartProps) {
  return (
    <div className="w-full">
      {title && (
        <h4 className="text-sm font-semibold text-slate-100 mb-3">{title}</h4>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart
          data={data}
          margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
        >
          <defs>
            {areas.map((area) => (
              <linearGradient
                key={`gradient-${area.key}`}
                id={`gradient-${area.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={area.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={area.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#334155"
            vertical={false}
          />
          <XAxis
            dataKey={xKey}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: '#475569' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
              color: '#e2e8f0',
              fontSize: '0.75rem',
            }}
            itemStyle={{ color: '#e2e8f0' }}
            cursor={{ stroke: '#475569', strokeDasharray: '4 4' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '0.75rem', color: '#94a3b8' }}
          />
          {areas.map((area) => (
            <Area
              key={area.key}
              type="monotone"
              dataKey={area.key}
              name={area.name}
              stroke={area.color}
              strokeWidth={2}
              fill={`url(#gradient-${area.key})`}
              activeDot={{ r: 5, fill: area.color, strokeWidth: 2, stroke: '#0f172a' }}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
