import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const nav = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-4xl mb-3">❌</div>
          <p className="text-ink font-semibold">Invalid reset link.</p>
          <Link to="/forgot-password" className="text-green text-sm mt-3 inline-block hover:underline">
            Request a new one
          </Link>
        </div>
      </div>
    );
  }

  async function handle(e) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.auth.resetPassword(token, password);
      setDone(true);
      setTimeout(() => nav('/login'), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl font-bold text-ink">
            <span className="text-green">পড়ার ঘর</span>
          </h1>
        </div>

        <div className="bg-card border border-line rounded-xl p-7 shadow-sm">
          {done ? (
            <div className="text-center">
              <div className="text-4xl mb-3">✅</div>
              <h2 className="font-serif text-xl font-bold mb-2">Password updated!</h2>
              <p className="text-muted text-sm">Redirecting to sign in…</p>
            </div>
          ) : (
            <>
              <h2 className="font-serif text-xl font-bold mb-5">Set new password</h2>

              <form onSubmit={handle} className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-muted block mb-1">New password</span>
                  <input
                    type="password" value={password}
                    onChange={e => setPassword(e.target.value)}
                    required minLength={6} placeholder="At least 6 characters"
                    className="w-full border border-line rounded-lg px-3 py-2.5 text-sm text-ink bg-paper focus:outline-none focus:border-green transition-colors"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-muted block mb-1">Confirm password</span>
                  <input
                    type="password" value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required placeholder="Same password again"
                    className="w-full border border-line rounded-lg px-3 py-2.5 text-sm text-ink bg-paper focus:outline-none focus:border-green transition-colors"
                  />
                </label>

                {error && (
                  <p className="text-sm text-ribbon bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit" disabled={loading}
                  className="w-full bg-green hover:bg-green-dark text-white font-semibold text-sm py-2.5 rounded-lg transition-colors disabled:opacity-60"
                >
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
