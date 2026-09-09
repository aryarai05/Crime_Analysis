import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';

export function LoginPage() {
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error);
      showToast(error, 'error');
    } else {
      showToast('Welcome back to CRIMEWATCH', 'success');
      navigate('/dashboard');
    }
  };

  const fillDemo = (role: 'admin' | 'analyst') => {
    if (role === 'admin') {
      setEmail('admin@crimewatch.io');
      setPassword('CrimeWatch2026!');
    } else {
      setEmail('analyst@crimewatch.io');
      setPassword('CrimeWatch2026!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 grid-bg">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Shield className="w-8 h-8 text-cyan-400" />
          <span className="text-xl font-bold text-white tracking-wider">CRIMEWATCH</span>
        </Link>

        <div className="glass-panel p-8">
          <h1 className="text-2xl font-bold text-white mb-1">Sign In</h1>
          <p className="text-sm text-slate-400 mb-6">Access the intelligence platform</p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-field pl-10 pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-cyan-500/10">
            <p className="text-xs text-slate-500 mb-3 text-center">Quick demo access</p>
            <div className="flex gap-2">
              <button onClick={() => fillDemo('admin')} className="btn-secondary flex-1 text-xs">
                Admin Demo
              </button>
              <button onClick={() => fillDemo('analyst')} className="btn-secondary flex-1 text-xs">
                Analyst Demo
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-cyan-400 hover:text-cyan-300">
              Create one
            </Link>
          </div>
          <div className="mt-2 text-center">
            <Link to="/forgot-password" className="text-xs text-slate-500 hover:text-slate-300">
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
