import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function AuthForm({ mode, onSubmit }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handle(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl font-bold text-ink">
            <span className="text-green">পড়ার ঘর</span>
          </h1>
          <p className="text-muted text-sm mt-1">Your interview-prep PDF shelf</p>
        </div>

        <div className="bg-card border border-line rounded-xl p-7 shadow-sm">
          <h2 className="font-serif text-xl font-bold mb-5">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>

          <form onSubmit={handle} className="space-y-4">
            {mode === 'register' && (
              <label className="block">
                <span className="text-sm font-medium text-muted block mb-1">Name</span>
                <input
                  type="text" value={form.name} onChange={set('name')} required
                  placeholder="Your name"
                  className="w-full border border-line rounded-lg px-3 py-2.5 text-sm text-ink bg-paper focus:outline-none focus:border-green transition-colors"
                />
              </label>
            )}

            <label className="block">
              <span className="text-sm font-medium text-muted block mb-1">Email</span>
              <input
                type="email" value={form.email} onChange={set('email')} required
                placeholder="you@example.com"
                className="w-full border border-line rounded-lg px-3 py-2.5 text-sm text-ink bg-paper focus:outline-none focus:border-green transition-colors"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-muted block mb-1">Password</span>
              <input
                type="password" value={form.password} onChange={set('password')} required
                placeholder={mode === 'register' ? 'At least 6 characters' : ''}
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
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-4">
            {mode === 'login' ? (
              <>No account? <Link to="/register" className="text-green font-medium hover:underline">Sign up</Link></>
            ) : (
              <>Already have one? <Link to="/login" className="text-green font-medium hover:underline">Sign in</Link></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
