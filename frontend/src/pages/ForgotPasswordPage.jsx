import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handle(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.auth.forgotPassword(email);
      setSent(true);
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
          <p className="text-muted text-sm mt-1">Your interview-prep PDF shelf</p>
        </div>

        <div className="bg-card border border-line rounded-xl p-7 shadow-sm">
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-3">📬</div>
              <h2 className="font-serif text-xl font-bold mb-2">Check your email</h2>
              <p className="text-muted text-sm leading-relaxed">
                If <strong>{email}</strong> has an account, a reset link has been sent. Check your inbox (and spam folder).
              </p>
              <p className="text-muted text-xs mt-4">Link expires in 1 hour.</p>
              <Link
                to="/login"
                className="mt-5 inline-block text-green text-sm font-medium hover:underline"
              >
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-serif text-xl font-bold mb-2">Forgot password?</h2>
              <p className="text-muted text-sm mb-5">
                Enter your email and we'll send a reset link.
              </p>

              <form onSubmit={handle} className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-muted block mb-1">Email</span>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="you@example.com"
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
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <p className="text-center text-sm text-muted mt-4">
                <Link to="/login" className="text-green font-medium hover:underline">
                  ← Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
