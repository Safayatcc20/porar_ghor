const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function getToken() {
  return localStorage.getItem('pg_token');
}

async function req(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body && !(options.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Something went wrong');
  }

  return res.json();
}

export const api = {
  auth: {
    register:       (data)            => req('/api/auth/register',        { method: 'POST', body: JSON.stringify(data) }),
    login:          (data)            => req('/api/auth/login',           { method: 'POST', body: JSON.stringify(data) }),
    me:             ()                => req('/api/auth/me'),
    forgotPassword: (email)           => req('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword:  (token, password) => req('/api/auth/reset-password',  { method: 'POST', body: JSON.stringify({ token, password }) }),
  },
  pdfs: {
    list:           ()           => req('/api/pdfs'),
    getUrl:         (id)         => req(`/api/pdfs/${id}/url`),
    updateProgress: (id, page)   => req(`/api/pdfs/${id}/progress`, {
      method: 'PATCH',
      body: JSON.stringify({ lastPage: page }),
    }),
    upload: (file, numPages) => {
      const form = new FormData();
      form.append('pdf', file);
      form.append('numPages', String(numPages));
      return req('/api/pdfs/upload', { method: 'POST', body: form });
    },
    delete: (id) => req(`/api/pdfs/${id}`, { method: 'DELETE' }),
  },
};

export function saveToken(token) { localStorage.setItem('pg_token', token); }
export function clearToken()     { localStorage.removeItem('pg_token'); }
export function hasToken()       { return !!getToken(); }
