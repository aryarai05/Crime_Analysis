import { useEffect, useState } from 'react';
import type { RiskLevel } from '@/lib/types';
import { RISK_LEVEL_COLORS } from '@/lib/types';

interface RiskGaugeProps {
  score: number;
  level: RiskLevel;
  size?: number;
}

export function RiskGauge({ score, level, size = 200 }: RiskGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const color = RISK_LEVEL_COLORS[level];

  useEffect(() => {
    const duration = 1000;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(score * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  const radius = (size - 20) / 2;
  const circumference = Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
        <path
          d={`M 10 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2}`}
          fill="none"
          stroke="rgba(100, 116, 139, 0.2)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d={`M 10 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.1s linear',
            filter: `drop-shadow(0 0 6px ${color}80)`,
          }}
        />
      </svg>
      <div className="-mt-12 flex flex-col items-center">
        <span className="text-4xl font-bold" style={{ color }}>
          {animatedScore}
        </span>
        <span className="text-xs text-slate-500">/ 100</span>
        <span
          className="badge mt-2"
          style={{
            backgroundColor: `${color}20`,
            color,
            border: `1px solid ${color}40`,
          }}
        >
          {level}
        </span>
      </div>
    </div>
  );
}
