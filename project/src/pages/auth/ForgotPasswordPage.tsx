import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      showToast(error, 'error');
    } else {
      setSent(true);
      showToast('Password reset email sent', 'success');
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
          <h1 className="text-2xl font-bold text-white mb-1">Reset Password</h1>
          <p className="text-sm text-slate-400 mb-6">We'll send you a reset link</p>

          {sent ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-sm text-white mb-2">Check your email</p>
              <p className="text-xs text-slate-400 mb-6">We've sent a password reset link to {email}</p>
              <Link to="/login" className="btn-secondary inline-block">
                Back to Sign In
              </Link>
            </div>
          ) : (
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
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? 'Sending...' : 'Send Reset Link'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-xs text-slate-500 hover:text-slate-300">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
