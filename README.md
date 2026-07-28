# পড়ার ঘর — Porar Ghor

Interview-prep PDF shelf. Login once, upload PDFs, read from any device.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + TailwindCSS |
| Backend | Node.js + Express + Prisma |
| Database | PostgreSQL (via Render free tier) |
| File Storage | Supabase Storage |
| Auth | JWT (30-day tokens) |
| Deploy | Frontend → Netlify · Backend → Render |

---

## Local Setup

### 1. Supabase — file storage (free)

1. Go to [supabase.com](https://supabase.com) → create a project
2. Go to **Storage** → create a new bucket called `pdfs` (set to **private**)
3. Go to **Project Settings → API** and copy:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` secret key → `SUPABASE_SERVICE_KEY`

### 2. Backend

```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_KEY
# For local dev, use a free Supabase PostgreSQL or local postgres

npm install
npx prisma db push      # creates tables
npm run dev             # runs on port 4000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:4000

npm install
npm run dev             # runs on port 5173
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deploy to Production

### Backend → Render

1. Push code to GitHub
2. Go to [render.com](https://render.com) → **New → Blueprint**
3. Connect your repo — it picks up `backend/render.yaml` automatically
4. In Environment Variables, fill in:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `FRONTEND_URL` (your Netlify URL, e.g. `https://porar-ghor.netlify.app`)
5. Deploy! Render creates the PostgreSQL DB and runs migrations automatically.

### Frontend → Netlify

1. Go to [netlify.com](https://netlify.com) → **Add new site → Import from Git**
2. Select your repo, set **Base directory** to `frontend`
3. Build command: `npm run build` | Publish directory: `dist`
4. In **Site configuration → Environment variables**, add:
   - `VITE_API_URL` = your Render backend URL (e.g. `https://porar-ghor-api.onrender.com`)
5. Deploy!

---

## Project Structure

```
porar-ghor/
├── backend/
│   ├── prisma/schema.prisma     # DB schema
│   ├── src/
│   │   ├── index.js             # Express app entry
│   │   ├── middleware/auth.js   # JWT middleware
│   │   ├── routes/auth.js       # /api/auth/*
│   │   ├── routes/pdfs.js       # /api/pdfs/*
│   │   └── lib/storage.js       # Supabase storage helper
│   ├── render.yaml              # Render deploy config
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx              # Router
    │   ├── hooks/useAuth.js     # Auth context
    │   ├── lib/api.js           # API client
    │   └── pages/
    │       ├── LoginPage.jsx
    │       ├── RegisterPage.jsx
    │       ├── ShelfPage.jsx    # Main library view
    │       └── ReaderPage.jsx   # PDF reader
    ├── netlify.toml             # Netlify SPA redirect
    └── .env.example
```

## Features

- Register/login with email + password
- Upload PDFs (up to 50 MB each)
- Auto page-count detection in browser before upload
- Reading progress synced to server (saves last page)
- Visual progress bar + bookmark ribbon on shelf cards
- Drag & drop file upload
- Search your shelf
- Keyboard navigation (←/→ arrows, Esc to exit)
- Swipe left/right on mobile to turn pages
- Zoom in/out/fit-width
- One-hour signed URLs for secure PDF access
