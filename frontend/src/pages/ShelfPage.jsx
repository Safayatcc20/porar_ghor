import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import { api } from '../lib/api.js';
import { useAuth } from '../hooks/useAuth.jsx';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

function fmtSize(b) {
  return b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.round(b / 1024) + ' KB';
}
function fmtDate(t) {
  return new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export default function ShelfPage() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef();

  useEffect(() => { fetchPdfs(); }, []);

  async function fetchPdfs() {
    try {
      const data = await api.pdfs.list();
      setPdfs(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFiles(files) {
    setUploading(true);
    setError('');
    for (const file of files) {
      try {
        // Get page count client-side before uploading
        const buf = await file.arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: buf }).promise;
        const numPages = doc.numPages;
        doc.destroy();
        await api.pdfs.upload(file, numPages);
      } catch (e) {
        setError(`Failed to upload "${file.name}": ${e.message}`);
      }
    }
    setUploading(false);
    fetchPdfs();
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete "${name}" from your shelf?`)) return;
    try {
      await api.pdfs.delete(id);
      setPdfs((p) => p.filter((x) => x.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  // Drag & drop
  function onDrop(e) {
    e.preventDefault();
    const files = [...e.dataTransfer.files].filter((f) => f.type === 'application/pdf');
    if (files.length) handleFiles(files);
  }

  const filtered = search
    ? pdfs.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : pdfs;

  return (
    <div
      className="min-h-screen bg-paper"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {/* Header */}
      <header className="border-b-2 border-ink">
        <div className="max-w-4xl mx-auto px-5 py-5 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold leading-tight">
              <span className="text-green">পড়ার ঘর</span>
            </h1>
            <p className="text-muted text-xs mt-0.5">
              {user?.name}'s shelf · {pdfs.length} PDF{pdfs.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileRef.current.click()}
              disabled={uploading}
              className="bg-green hover:bg-green-dark text-white text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {uploading ? 'Uploading…' : 'Add PDF'}
            </button>
            <button
              onClick={logout}
              className="text-muted hover:text-ink text-sm px-3 py-2.5 rounded-lg hover:bg-line transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 py-6">
        {/* Search */}
        {pdfs.length > 0 && (
          <div className="mb-5">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your shelf…"
              className="border border-line rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:border-green transition-colors w-full max-w-xs"
            />
          </div>
        )}

        {error && (
          <div className="mb-4 text-sm text-ribbon bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-muted text-sm py-10 text-center">Loading your shelf…</div>
        ) : pdfs.length === 0 ? (
          /* Empty state */
          <div
            className="border-2 border-dashed border-line rounded-xl p-14 text-center cursor-pointer hover:border-green transition-colors group"
            onClick={() => fileRef.current.click()}
          >
            <div className="text-4xl mb-3">📚</div>
            <div className="font-serif text-xl font-bold text-ink mb-1">Your shelf is empty</div>
            <p className="text-muted text-sm">
              Click or drag & drop PDF files to add them.<br />
              Your files sync across all your devices.
            </p>
            <button className="mt-5 bg-green hover:bg-green-dark text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
              Add your first PDF
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((pdf) => {
              const pct = pdf.numPages ? Math.round((pdf.lastPage / pdf.numPages) * 100) : 0;
              const ribbonH = Math.max(14, Math.min(pct * 0.8, 60));
              return (
                <div
                  key={pdf.id}
                  onClick={() => nav(`/read/${pdf.id}`)}
                  className="relative bg-card border border-line rounded-xl p-4 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all group"
                >
                  {/* Bookmark ribbon showing progress */}
                  <div
                    className="absolute top-0 right-4 w-3.5 bg-ribbon transition-all duration-300"
                    style={{
                      height: ribbonH + 'px',
                      clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 6px), 0 100%)',
                    }}
                  />

                  <h3 className="font-serif font-bold text-sm leading-snug pr-8 line-clamp-2 mb-2">
                    {pdf.name}
                  </h3>
                  <p className="text-xs text-muted">
                    {pdf.numPages ? `${pdf.numPages} pages · ` : ''}{fmtSize(pdf.size)} · {fmtDate(pdf.createdAt)}
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-mono text-green font-semibold">
                      {pct > 0 ? `page ${pdf.lastPage} · ${pct}%` : 'not started'}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(pdf.id, pdf.name); }}
                      className="text-xs text-muted hover:text-ribbon px-2 py-1 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      delete
                    </button>
                  </div>

                  {/* Progress bar */}
                  {pct > 0 && (
                    <div className="mt-2 h-0.5 bg-line rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green transition-all"
                        style={{ width: pct + '%' }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        multiple
        hidden
        onChange={(e) => { handleFiles([...e.target.files]); e.target.value = ''; }}
      />
    </div>
  );
}
