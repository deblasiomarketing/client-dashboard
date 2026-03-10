# DeBlasio Client Dashboard

A modern client-facing marketing dashboard built with React + Vite.

---

## 🚀 Deploy to Vercel (5 minutes)

### Option A — Drag & Drop (easiest)
1. Download this folder as a ZIP
2. Go to [vercel.com](https://vercel.com) and sign up free
3. From your Vercel dashboard, click **"Add New Project"**
4. Drag and drop the ZIP file (or the unzipped folder)
5. Vercel auto-detects Vite — just click **Deploy**
6. Your dashboard is live at `your-project.vercel.app` ✅

### Option B — Via GitHub
1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → "Add New Project"
3. Connect your GitHub and select the repo
4. Click Deploy — done!

### Point your own domain
In Vercel dashboard → Settings → Domains → add `portal.yourdomain.com`

---

## 🔧 Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

**Demo login:** `client@demo.com` / `demo1234`

---

## 📁 Project Structure

```
dashboard/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx      ← React entry point
    ├── App.jsx       ← All dashboard logic & data
    ├── App.css       ← All styles
    └── index.css     ← Global reset + fonts
```

---

## 🎨 Adding Your Logos

In `src/App.jsx`, find the `logo-drop` divs and replace with:

```jsx
// Agency logo (in Login screen + Sidebar)
<img src="/agency-logo.png" alt="Your Agency" style={{ maxHeight: 40 }} />

// Client logo (in Sidebar)
<img src="/client-logo.png" alt="Client Name" style={{ maxHeight: 32 }} />
```

Place logo files in the `/public` folder.

---

## 🔌 Next Steps (when ready to go fully live)

- **Real authentication** — connect to Firebase Auth or Supabase
- **Google Analytics API** — OAuth + GA4 Data API
- **Google Ads API** — Google Ads API with OAuth
- **Gravity Forms leads** — REST API or webhook to a backend
- **Per-client data** — database (Supabase or Firebase Firestore)
