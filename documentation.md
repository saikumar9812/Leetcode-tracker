# 🎯 LeetCode Tracker

A personal LeetCode practice tracker with real-time cloud sync, DSA category filtering, and an integrated code editor.

**Live URL:** [https://saikumar98125-4fe54.web.app](https://saikumar98125-4fe54.web.app)

---

## ✨ Features

### Core Functionality
- **📊 Problem Tracking** — Track progress on 3,500+ LeetCode problems (To Do / In Progress / Completed)
- **💻 Integrated Code Editor** — Monaco Editor (same as VS Code) with syntax highlighting for Python, JavaScript, Java, C++
- **🔄 Real-time Cloud Sync** — Instant sync via Firebase Realtime Database (500ms debounce, stale-closure-safe via ref)
- **🔐 Password Protection** — Client-side hashed authentication (SHA-256)
- **✏️ Editable Priority List** — Add/remove/rename categories and problems from the UI, synced to Firebase

### Filtering & Organization
- **🏷️ DSA Categories** — 13 curated priority categories (Arrays, Trees, Graphs, DP, etc.) — fully editable via UI
- **🏢 Company Tags** — Filter by Google, Amazon, Meta, Microsoft, etc.
- **⚡ Difficulty Levels** — Easy / Medium / Hard filtering
- **📈 Progress Filter** — Show only solved, in-progress, or to-do problems
- **🔍 Search** — Full-text search on home page and problems page
- **🏷️ Topic Filter** — Filter by LeetCode topic tags
- **🔗 Shareable Filters** — All filters are URL search params (bookmarkable, back-button works)

### User Experience
- **🌑 Dark Slate Theme** — Navy-gray dark theme (not pure black), JetBrains Mono for numbers
- **✨ Smooth Animations** — Fade-in effects and hover states
- **📝 Auto-save** — Solutions save automatically as you type (500ms debounce)
- **🔗 Direct Links** — Click problem titles to open on LeetCode
- **📄 No Pagination** — All problems render on one page
- **🖱️ Clickable Stats** — Home stat cards navigate to filtered problem views

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19 + Vite 7 |
| **Routing** | React Router DOM v7 |
| **Code Editor** | Monaco Editor (@monaco-editor/react) |
| **Styling** | Vanilla CSS with CSS Variables + Google Fonts (Inter, JetBrains Mono) |
| **Database** | Firebase Realtime Database |
| **Hosting** | Firebase Hosting |
| **Auth** | Client-side SHA-256 hashing (Web Crypto API) |

---

## 📁 Project Structure

```
Programming Practice/
├── public/
│   └── data/
│       └── processed_data.json    # Problem data (3500+ problems)
├── src/
│   ├── App.jsx                    # All page components + routing (HomePage, ProblemsPage, ProblemRow)
│   ├── App.css                    # App-level styles
│   ├── index.css                  # Global styles & design system
│   ├── main.jsx                   # React entry point (wraps with BrowserRouter)
│   └── firebase.js                # Firebase config & helpers
├── .env                           # Environment variables (not in git)
├── .env.example                   # Template for environment variables
├── firebase.json                  # Firebase hosting config (SPA rewrite: ** → /index.html)
├── package.json                   # Dependencies & scripts
└── vite.config.js                 # Vite build configuration
```

---

## 🗺️ Routes

| Route | Description |
|-------|-------------|
| `/` | Redirects to `/priority` |
| `/priority` | Home — priority DSA categories |
| `/topics` | Home — all LeetCode topic tags |
| `/problems` | Full problems list |
| `/problems?search=two+sum` | Pre-filtered by search |
| `/problems?company=Google&difficulty=Hard` | Pre-filtered by company + difficulty |
| `/problems?categories=Trees,Graphs` | Pre-filtered by priority categories |
| `/problems?progress=solved` | Show only solved problems |
| `*` | Redirects to `/priority` |

---

## 🚀 Deploy

```bash
npm run build
firebase deploy --only hosting
```

---

## 🔐 Authentication

- **Username:** `saikumar98125`
- **Password hash:** SHA-256 constant in `App.jsx` (`AUTH_HASH`)
- Auth state persisted in `localStorage`

To change password — run in browser console:
```javascript
const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('your-new-password'))
console.log(Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join(''))
```
Replace `AUTH_HASH` in `App.jsx` with the output.

---

## 🔄 Data Sync

- `saveUserData(problemId, field, value)` uses **functional `setUserData`** to avoid stale closure race conditions
- A `userDataRef` ref always holds the latest state — the debounced Firebase write reads from the ref, never the closure
- Firebase subscription (`onValue`) for realtime updates across devices

---

## 📊 Database Structure

```json
{
  "users": {
    "saikumar98125": {
      "problems": {
        "1": {
          "progress": "solved",
          "solution": "class Solution:\n    ...",
          "language": "python",
          "updatedAt": 1706951234567
        }
      },
      "priorityCategories": {
        "Arrays & Hashing": ["Two Sum", "Group Anagrams", "..."],
        "Trees": ["Maximum Depth of Binary Tree", "..."]
      }
    }
  }
}
```

---

## 🎨 Design System

### CSS Variables (`index.css`)

```css
:root {
  --bg-primary:     hsl(222, 16%, 15%);  /* dark navy-gray page */
  --bg-secondary:   hsl(222, 14%, 20%);  /* card surfaces */
  --bg-tertiary:    hsl(222, 12%, 27%);  /* elevated / hover */
  --text-primary:   hsl(220, 25%, 95%);  /* near-white */
  --text-secondary: hsl(220, 10%, 58%);  /* muted */
  --border:         hsl(222, 12%, 30%);  /* dividers */
  --accent:         hsl(160, 55%, 42%);  /* teal-green */
  --easy:           hsl(171, 70%, 42%);
  --medium:         hsl(38, 95%, 55%);
  --hard:           hsl(348, 90%, 58%);
}
```

**Fonts:** Inter (UI text) + JetBrains Mono (numbers/stats)

---

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build production bundle to `dist/` |
| `npm run preview` | Preview production build locally |
| `firebase deploy --only hosting` | Deploy frontend to Firebase |

---

## 📈 Firebase Free Tier

| Resource | Limit | Usage |
|----------|-------|-------|
| Storage | 1 GB | ~1-5 MB |
| Bandwidth | 10 GB/month | ~10-50 MB |
| Connections | 100 simultaneous | 1-2 |
| Hosting Bandwidth | 360 MB/day | ~1-10 MB |

---

## 🐛 Troubleshooting

### "❌ Error" sync status
Go to Firebase Console → Realtime Database → Rules:
```json
{ "rules": { ".read": true, ".write": true } }
```

### Solutions not saving
- Verify `.env` has correct `VITE_FIREBASE_DATABASE_URL`
- Restart dev server after changing `.env`

### Priority list not saving edits
- Check Firebase sync status indicator (top right)
- Data saves to `users/saikumar98125/priorityCategories` in Realtime DB
