import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import { api } from '../lib/api.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

export default function ReaderPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const canvasRef = useRef();
  const stageRef = useRef();

  const [pdfDoc, setPdfDoc] = useState(null);
  const [curPage, setCurPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [zoom, setZoom] = useState(0); // 0 = fit-width
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState('');
  const [pageInput, setPageInput] = useState('1');

  // Debounced progress save
  const saveTimer = useRef(null);
  function saveProgress(page) {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      api.pdfs.updateProgress(id, page).catch(() => {});
    }, 1500);
  }

  // Load PDF
  useEffect(() => {
    let doc;
    (async () => {
      try {
        setLoading(true);
        const { url } = await api.pdfs.getUrl(id);
        doc = await pdfjsLib.getDocument(url).promise;
        setNumPages(doc.numPages);
        setPdfDoc(doc);
      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
    })();
    return () => { if (doc) doc.destroy(); };
  }, [id]);

  // Render page
  const renderPage = useCallback(async (doc, page, zoomLevel) => {
    if (!doc || !canvasRef.current || !stageRef.current) return;
    setRendering(true);
    try {
      const pdfPage = await doc.getPage(page);
      const avail = stageRef.current.clientWidth - 28;
      const base = pdfPage.getViewport({ scale: 1 });
      const scale = zoomLevel === 0
        ? avail / base.width
        : (avail / base.width) * zoomLevel;

      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const vp = pdfPage.getViewport({ scale });
      const canvas = canvasRef.current;
      canvas.width = vp.width * dpr;
      canvas.height = vp.height * dpr;
      canvas.style.width = vp.width + 'px';
      canvas.style.height = vp.height + 'px';

      const ctx = canvas.getContext('2d');
      await pdfPage.render({
        canvasContext: ctx,
        viewport: vp,
        transform: [dpr, 0, 0, dpr, 0, 0],
      }).promise;

      stageRef.current.scrollTop = 0;
    } finally {
      setRendering(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pdfDoc) renderPage(pdfDoc, curPage, zoom);
  }, [pdfDoc, curPage, zoom, renderPage]);

  // Window resize → re-render
  useEffect(() => {
    const handle = () => { if (pdfDoc) renderPage(pdfDoc, curPage, zoom); };
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, [pdfDoc, curPage, zoom, renderPage]);

  function goTo(n) {
    const p = Math.min(Math.max(n, 1), numPages);
    if (p !== curPage) {
      setCurPage(p);
      setPageInput(String(p));
      saveProgress(p);
    }
  }

  // Keyboard nav
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(curPage + 1);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goTo(curPage - 1);
      else if (e.key === 'Escape') nav('/');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [curPage, numPages]);

  // Touch swipe
  const touch0 = useRef(null);
  function onTouchStart(e) { touch0.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }
  function onTouchEnd(e) {
    if (!touch0.current) return;
    const dx = e.changedTouches[0].clientX - touch0.current.x;
    const dy = e.changedTouches[0].clientY - touch0.current.y;
    if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.5) goTo(curPage + (dx < 0 ? 1 : -1));
    touch0.current = null;
  }

  const pct = numPages ? Math.round((curPage / numPages) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-[#EAE6DC] flex flex-col">
      {/* Top bar */}
      <div className="bg-ink text-white flex items-center gap-3 px-3 py-2.5 flex-shrink-0">
        <button
          onClick={() => nav('/')}
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
          aria-label="Back to shelf"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="flex-1 text-sm font-semibold truncate" id="rtitle" />

        <span className="font-mono text-xs opacity-80">{curPage}/{numPages}</span>

        {/* Progress pill */}
        {pct > 0 && (
          <span className="text-xs bg-green/80 px-2 py-0.5 rounded-full font-mono">{pct}%</span>
        )}
      </div>

      {/* Title display (set via DOM in render step) */}
      {/* Page stage */}
      <div
        ref={stageRef}
        className="flex-1 overflow-auto flex justify-center items-start p-3 scrollbar-hide"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {error ? (
          <div className="text-ribbon mt-20 text-sm">{error}</div>
        ) : (
          <canvas
            ref={canvasRef}
            className="shadow-xl rounded-sm bg-white"
            style={{ maxWidth: '100%' }}
          />
        )}
        {(loading || rendering) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-ink/70 text-white text-sm px-4 py-2 rounded-full">
              {loading ? 'Loading…' : 'Rendering…'}
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="bg-ink flex items-center justify-center gap-2 px-3 py-2 pb-[calc(8px+env(safe-area-inset-bottom))] flex-shrink-0">
        <button
          onClick={() => goTo(curPage - 1)}
          disabled={curPage <= 1}
          className="text-white bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-lg px-4 py-2 text-lg font-bold transition-colors disabled:opacity-30"
        >
          ‹
        </button>

        <input
          type="number"
          value={pageInput}
          onChange={(e) => setPageInput(e.target.value)}
          onBlur={() => { const n = parseInt(pageInput); if (n) goTo(n); else setPageInput(String(curPage)); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { const n = parseInt(pageInput); if (n) goTo(n); } }}
          className="w-14 text-center bg-white/10 border-none text-white font-mono text-sm rounded-lg py-2 focus:outline-none focus:bg-white/20"
          inputMode="numeric"
        />

        <button
          onClick={() => goTo(curPage + 1)}
          disabled={curPage >= numPages}
          className="text-white bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-lg px-4 py-2 text-lg font-bold transition-colors disabled:opacity-30"
        >
          ›
        </button>

        <div className="w-px h-6 bg-white/20 mx-1" />

        <button
          onClick={() => setZoom((z) => (z === 0 ? 1 : z) / 1.25)}
          className="text-white bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 text-sm font-bold transition-colors"
        >
          −
        </button>
        <button
          onClick={() => setZoom(0)}
          className="text-white bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 text-xs transition-colors"
        >
          Fit
        </button>
        <button
          onClick={() => setZoom((z) => (z === 0 ? 1 : z) * 1.25)}
          className="text-white bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 text-sm font-bold transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}
