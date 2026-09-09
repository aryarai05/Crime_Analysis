import { AlertTriangle, FileSearch, AlertCircle } from 'lucide-react';

export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="h-4 bg-slate-700/30 rounded mb-2" />
      <div className="h-4 bg-slate-700/20 rounded w-3/4" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-slate-700/30 rounded-lg" />
        <div className="flex-1">
          <div className="h-3 bg-slate-700/30 rounded w-20 mb-2" />
          <div className="h-5 bg-slate-700/20 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ title, message, icon: Icon = FileSearch }: { title: string; message: string; icon?: typeof FileSearch }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 bg-slate-700/20 rounded-full mb-4">
        <Icon className="w-8 h-8 text-slate-500" />
      </div>
      <h3 className="text-sm font-semibold text-slate-300 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm">{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 bg-red-500/10 rounded-full mb-4 border border-red-500/20">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-300 mb-1">Something went wrong</h3>
      <p className="text-xs text-slate-500 max-w-sm mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-xs">
          Try Again
        </button>
      )}
    </div>
  );
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <div className="flex items-center justify-center py-8">
      <div className={`${sizes[size]} animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400`} />
    </div>
  );
}
