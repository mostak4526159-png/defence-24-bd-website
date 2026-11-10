# DEFENCE 24 BD — International & National Defense News Portal

A bilingual (**Bangla & English**), responsive, Google AdSense policy-ready, and **Google Firebase + Netlify** integrated defense and security news portal covering all 15 defense, security, and recruitment categories.

---

## 1. Key Features Implemented (All 15 Phases)

1. **Premium Editorial Design**:
   - Crafted with Navy Blue (`#0B1F3A`), Royal Blue (`#1D4ED8`), Light Navy Blue (`#1E3A5F` for Emergency Notice Banner), Red, White, Emerald Green, Orange, and Slate Gray.
   - 3-tier front-page hierarchy (Lead Story, Secondary Force Reports, 15-Category Filter Grid) + Official Recruitment Circulars Archive.
2. **Dark Mode & Light Mode**:
   - Instant Sun/Moon theme toggle with `localStorage` persistence (`defence24bd_theme_v2`) across all pages and refreshes.
3. **Separate Bangla & English Editions**:
   - Complete Bangla interface (`bn`) and Complete English interface (`en`) with `localStorage` persistence (`defence24bd_lang_v2`) and zero language mixing.
4. **All 15 Defense & Security Categories**:
   1. Bangladesh Army (`army`)
   2. Bangladesh Navy (`navy`)
   3. Bangladesh Air Force (`airforce`)
   4. Bangladesh Police (`police`)
   5. Ansar & VDP (`ansar`)
   6. Border Guard Bangladesh (`bgb`)
   7. Coast Guard (`coast_guard`)
   8. Fire Service (`fire_service`)
   9. Defence News (`defence_news`)
   10. International Military News (`intl_military`)
   11. Recruitment Circulars (`recruitment`)
   12. Results & Updates (`results`)
   13. Examination & Interview (`exam_interview`)
   14. Training & Preparation (`training_prep`)
   15. Other News (`other_news`)
5. **Breaking News & Live Notices**:
   - Scrolling Breaking News Ticker, Light Navy Blue Emergency Notice Banner, Important Announcements, and live Dhaka Standard Time (BST) clock.
6. **Complete Protected Admin Panel (All 20 Controls)**:
   - Restricted strictly to authorized administrators (`mostak4526159@gmail.com` / `admin@defence24bd.com`).
   - Supports Add News, Edit News, Delete News, Publish News, Unpublish News, Save Draft, Upload Images, Manage Videos, Manage Categories, Manage Notices, Manage Breaking News, Manage Advertisements, Manage SEO, Manage Authors, Manage Website Settings, Approve News, Reject News, Manage Submitted News, Manage Bangla News, and Manage English News.
7. **Public News Submission & Moderation Queue**:
   - Public visitors can submit news via **Submit News** (`PublicSubmitNews.tsx`).
   - All visitor submissions are strictly forced to `status: "pending"` by both the application and **Firestore Security Rules** (`firestore.rules`). Only an authorized Administrator can approve and publish them.
8. **Google Firebase Integration**:
   - **Firebase Authentication**: Admin Email/Password & Google Sign-In (`src/lib/firebase.ts`).
   - **Cloud Firestore Database**: Database ID `ai-studio-defence24bd-b33aa361-b799-4b5b-b83b-3a54dfed8380` (`articles`, `circulars`, `notices`, `settings`, `users`, `admins`, `activity_logs`).
   - **Firebase Storage**: Editorial image upload (`editorial_media/*`) and public submission image storage (`storage.rules`).
   - **Hardened Security Rules**: `firestore.rules` and `storage.rules`.
9. **Google AdSense Policy & Technical SEO**:
   - Includes `About Us`, `Contact Us`, `Privacy Policy`, `Terms & Conditions`, `Disclaimer`, and `Editorial Policy` in both Bangla and English.
   - Includes `public/ads.txt`, `public/robots.txt`, `public/sitemap.xml`, canonical URLs, Open Graph tags, and Schema.org `NewsMediaOrganization` + `NewsArticle` JSON-LD structured data.
10. **Zero Public ZIP Download**:
    - No ZIP download button or link exists anywhere on the public website.
    - The Netlify-ready project source ZIP is available exclusively to the authenticated Developer/Admin inside the protected Admin Panel.

---

## 2. Google Firebase Setup Instructions (বাংলা ও English)

1. **Firebase Configuration File**:
   - The project is pre-configured with `firebase-applet-config.json` (and template `firebase-config.template.json`).
   - No private service account keys are exposed in the frontend code.
2. **Firebase Authentication**:
   - In the [Firebase Console](https://console.firebase.google.com/), open project `southern-linker-nfx4d` (or your own project) → **Authentication** → **Sign-in method**, and enable **Email/Password** and **Google**.
   - Add your Netlify production domain (e.g., `defence24bd.netlify.app` or custom domain) under **Authentication → Settings → Authorized domains**.
3. **Cloud Firestore & Storage Rules Deployment**:
   - Firestore Security Rules are defined in `firestore.rules` and Storage Rules in `storage.rules`.
   - To deploy rules via Firebase CLI:
     ```bash
     firebase deploy --only firestore:rules,storage
     ```

---

## 3. Netlify Deployment Instructions

1. **Option A: Deploy via GitHub / Git Repository**:
   - Push this project to a GitHub/GitLab repository.
   - In Netlify, click **Add new site → Import an existing project**.
   - Netlify automatically reads `netlify.toml`:
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`
     - **Functions directory**: `netlify/functions`
2. **Option B: Manual CLI / Drag-and-Drop Build**:
   - Run locally:
     ```bash
     npm install
     npm run build
     ```
   - Deploy the generated `dist/` folder to Netlify.

## 4. Required Environment Variables

To ensure the Admin API and database integration work correctly on Netlify, set the following variables in your **Netlify Dashboard → Site settings → Environment variables**:

| Variable | Description |
| :--- | :--- |
| `SQL_HOST` | Your PostgreSQL host address (e.g. from Supabase or Neon). |
| `SQL_USER` | PostgreSQL database username. |
| `SQL_PASSWORD` | PostgreSQL database password. |
| `SQL_DB_NAME` | PostgreSQL database name (usually `postgres`). |
| `GEMINI_API_KEY` | (Optional) Your Google Gemini AI API key for AI features. |

---
