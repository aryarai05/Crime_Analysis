import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  color?: 'cyan' | 'amber' | 'red' | 'green' | 'blue';
  suffix?: string;
}

const colorMap = {
  cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  amber: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  red: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  green: { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  blue: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
};

function useAnimatedNumber(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + (target - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);
  return value;
}

export function KpiCard({ label, value, icon: Icon, change, changeLabel, color = 'cyan', suffix }: KpiCardProps) {
  const numericValue = typeof value === 'number' ? value : 0;
  const animated = useAnimatedNumber(numericValue);
  const colors = colorMap[color];

  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change === 0 || change === undefined;

  return (
    <div className="glass-card p-5 relative overflow-hidden group">
      <div className={`absolute top-0 left-0 w-1 h-full ${colors.bg.replace('/10', '/40')}`} />
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${colors.bg} ${colors.border} border`}>
          <Icon className={`w-5 h-5 ${colors.text}`} />
        </div>
        {change !== undefined && !isNeutral && (
          <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-red-400' : 'text-green-400'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
        {isNeutral && (
          <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
            <Minus className="w-3 h-3" />
          </div>
        )}
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-white">
          {typeof value === 'number' ? animated.toLocaleString() : value}
          {suffix && <span className="text-sm text-slate-400 ml-1">{suffix}</span>}
        </p>
        {changeLabel && <p className="text-xs text-slate-500 mt-1">{changeLabel}</p>}
      </div>
    </div>
  );
}
