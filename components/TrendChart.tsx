"use client";

import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendInsight } from "@/types";

interface TrendChartProps {
  trend: TrendInsight;
  unit: string;
}

export default function TrendChart({ trend, unit }: TrendChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-48 w-full bg-[#1a2a22]/10 border border-[#2d4a3b]/30 rounded-xl flex items-center justify-center animate-pulse">
        <span className="text-xs text-zinc-500">Loading trend chart...</span>
      </div>
    );
  }

  // Parse dataPoints and sort them chronologically (oldest to newest for plotting)
  const chartData = [...trend.dataPoints]
    .map((dp) => ({
      // Format date nicely e.g. "Jun 06"
      displayDate: new Date(dp.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      value: dp.value,
      dateVal: new Date(dp.date).getTime(),
    }))
    .sort((a, b) => a.dateVal - b.dateVal);

  const getLineColor = () => {
    if (trend.direction === "improving") return "#3ddc84"; // emerald green
    if (trend.direction === "worsening") return "#ef4444"; // red
    return "#71717a"; // gray
  };

  const lineColor = getLineColor();

  return (
    <div className="glass-card rounded-xl p-5 border border-[#2d4a3b] bg-[#1a2a22]/20 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
            Historical Trend
          </span>
          <h4 className="text-base font-bold text-zinc-200">{trend.biomarkerName}</h4>
        </div>
        <div className="text-right">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded border uppercase"
            style={{
              color: lineColor,
              borderColor: `${lineColor}30`,
              backgroundColor: `${lineColor}10`,
            }}
          >
            {trend.direction}
          </span>
        </div>
      </div>

      <p className="text-xs text-zinc-400 italic bg-[#080c0a]/40 p-2.5 rounded-lg border border-[#2d4a3b]/20">
        {trend.message}
      </p>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d4a3b" opacity={0.2} />
            <XAxis
              dataKey="displayDate"
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#080c0a",
                borderColor: "#2d4a3b",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#f4f4f5",
              }}
              formatter={(value: any) => [`${value} ${unit}`, "Value"]}
              labelFormatter={(label: any) => `Date: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={lineColor}
              strokeWidth={2}
              dot={{ r: 4, stroke: lineColor, strokeWidth: 1, fill: "#080c0a" }}
              activeDot={{ r: 6, stroke: lineColor, strokeWidth: 2, fill: lineColor }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
