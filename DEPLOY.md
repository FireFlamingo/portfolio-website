# Deploying this site

This portfolio is a static site. It renders client-side via `support.js` (the design-tool
runtime), which loads a pinned, integrity-checked React from `./vendor/` — no external CDN
is required for the framework.

## What to deploy (the ONLY files/folders that should go live)
- `index.html`          ← the entry point (a copy of `Portfolio.dc.html`)
- `support.js`
- `vendor/`             ← self-hosted React (react + react-dom, SRI-verified)
- `photos/`             ← your award photos (add your .jpg files here)
- `_headers`            ← security headers (Netlify / Cloudflare Pages)
- `vercel.json`         ← security headers (Vercel)
- `robots.txt`

## DO NOT deploy these (private / third-party / internal)
- `uploads/`  → contains your **resume PDF** and **copies of other people's websites**. Never publish.
- `screenshots/`, `.thumbnail`
- `Portfolio-standalone-src.html`, `Amogh Toshniwal - Portfolio.html`  → old drafts
- `Portfolio.dc.html` is the source; only `index.html` needs to be served (keep them in sync —
  if you edit `Portfolio.dc.html`, re-copy it to `index.html`).

`.gitignore` already excludes the private/old items, so a `git`-based deploy (Netlify/Vercel/
Cloudflare/GitHub) won't publish them — **as long as they were never committed**. If you ever
committed `uploads/`, remove it from history before pushing.

## Quick deploy options
- **Netlify / Cloudflare Pages:** drag-drop the folder (minus the DO-NOT items) or connect the
  repo. `_headers` is applied automatically.
- **Vercel:** `vercel` (or connect repo). `vercel.json` applies the headers.
- **GitHub Pages:** works, but it **cannot set HTTP headers**, so the CSP / X-Frame-Options in
  `_headers`/`vercel.json` won't apply. For real header support prefer Netlify/Vercel/Cloudflare.

## Security headers (already configured)
CSP, `X-Frame-Options: DENY` (anti-clickjacking), `X-Content-Type-Options`, `Referrer-Policy`,
`Permissions-Policy`, `COOP`. Note: the CSP includes `script-src 'unsafe-eval'` because the
design-tool runtime (`support.js`) uses `new Function(...)` to render. If you later flatten this
to plain static HTML you can drop `'unsafe-eval'` for a stricter policy.

## Before going live — checklist
- [ ] Add the 4 photos to `photos/` (see `photos/README.txt`).
- [ ] Confirm `uploads/` is NOT in the deploy.
- [ ] Set your real domain in `robots.txt` (Sitemap line).
- [ ] Test on a phone (or DevTools device mode) — the layout switches to a mobile stack ≤ 860px.
