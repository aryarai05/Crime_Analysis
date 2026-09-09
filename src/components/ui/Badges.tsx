import type { Severity, RiskLevel } from '@/lib/types';
import { SEVERITY_COLORS, RISK_LEVEL_COLORS } from '@/lib/types';

export function SeverityBadge({ severity }: { severity: Severity }) {
  const color = SEVERITY_COLORS[severity];
  return (
    <span
      className="badge"
      style={{
        backgroundColor: `${color}20`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      {severity}
    </span>
  );
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const color = RISK_LEVEL_COLORS[level];
  return (
    <span
      className="badge"
      style={{
        backgroundColor: `${color}20`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      {level}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Open: '#22d3ee',
    'Under Investigation': '#fbbf24',
    Closed: '#22c55e',
    Arrested: '#a78bfa',
  };
  const color = colors[status] || '#64748b';
  return (
    <span
      className="badge"
      style={{
        backgroundColor: `${color}20`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      {status}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    ADMIN: '#ef4444',
    ANALYST: '#fbbf24',
    VIEWER: '#22d3ee',
  };
  const color = colors[role] || '#64748b';
  return (
    <span
      className="badge"
      style={{
        backgroundColor: `${color}20`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      {role}
    </span>
  );
}
