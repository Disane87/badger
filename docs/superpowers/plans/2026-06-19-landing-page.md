# hon.ey Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bilingual (EN/DE), SEO-complete, high-performance static marketing landing page for hon.ey, deployed to GitHub Pages, sharing the app's honey design and showcasing real screenshots.

**Architecture:** A standalone static site in `landing/` (no framework, no Docker, no Nuxt build). Two language pages (EN root + DE under `de/`) share one stylesheet, self-hosted fonts, inlined SVG icons, and a tiny vanilla-JS file. A build-less GitHub Actions workflow uploads `landing/` to GitHub Pages. Screenshots are real captures of the running Nuxt app with sanitized demo data.

**Tech Stack:** Plain HTML5, CSS (custom properties from DESIGN_PRD), vanilla JS, self-hosted woff2 fonts, GitHub Actions Pages deploy. App for screenshots: Nuxt 4 + Playwright MCP.

## Global Constraints

- Hosting: `https://disane87.github.io/honey/`, base path `/honey/`. All internal links/assets **relative** (no leading `/`).
- Voice: Disane87 README voice (warm, emoji-rich). Reuse/condense `README.md` copy.
- Never use em/en-dashes anywhere (use `-` or rephrase).
- Visual language: honey design tokens from `DESIGN_PRD.md` section 4 (colors, Fraunces/Figtree/Space Mono, radii `--r-sm:10px/--r:16px/--r-lg:22px`, warm shadows, honey-glow background). Accent `--honey:#f2a007`, `--honey-deep:#d98309`, theme-color `#F2A007`.
- Icons: Lucide as inlined raw SVG only. No CDN, no `@nuxt/icon`. Emoji allowed in copy/headings only.
- Fonts: self-hosted woff2 (latin), `font-display:swap`. No Google Fonts CDN at runtime.
- SEO: page must be `index,follow` (opposite of the Nuxt app). Full OG/Twitter/hreflang/JSON-LD/sitemap/robots.
- Links: site `https://disane.de`, blog `https://blog.disane.dev`, repo `https://github.com/Disane87/honey`, license MIT.
- Demo data for screenshots: fully fabricated/sanitized, never committed, no real IPs/people.
- Don't touch the Nuxt app or `.github/workflows/docker-publish.yml`.

---

### Task 1: Scaffold landing structure + Pages workflow

**Files:**
- Create: `landing/.nojekyll` (empty)
- Create: `landing/robots.txt`
- Create: `landing/assets/.gitkeep`
- Create: `.github/workflows/pages.yml`

- [ ] **Step 1: Create `landing/.nojekyll`** (empty file - prevents Jekyll mangling `assets/` and underscore paths).

- [ ] **Step 2: Create `landing/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://disane87.github.io/honey/sitemap.xml
```

- [ ] **Step 3: Create `.github/workflows/pages.yml`**

```yaml
name: Deploy landing page

on:
  push:
    branches: [main]
    paths: ['landing/**', '.github/workflows/pages.yml']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: landing
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 4: Verify** `ls landing` shows `.nojekyll`, `robots.txt`, `assets/`. Workflow YAML is valid (no tabs).

- [ ] **Step 5: Commit**

```bash
git add landing/.nojekyll landing/robots.txt landing/assets/.gitkeep .github/workflows/pages.yml
git commit -m "feat(landing): scaffold static site + GitHub Pages workflow"
```

---

### Task 2: Self-host fonts

**Files:**
- Create: `landing/assets/fonts/*.woff2` (downloaded)

Download latin woff2 from Fontsource CDN (stable, exact filenames). Faces needed:
Fraunces 400 + 600 (display), Figtree 400 + 600 + 700 (body/UI), Space Mono 400 + 700 (mono).

- [ ] **Step 1: Download fonts** (run from repo root)

```bash
cd landing/assets/fonts
base=https://cdn.jsdelivr.net/fontsource/fonts
curl -fsSLO $base/fraunces@latest/latin-400-normal.woff2
curl -fsSLO $base/fraunces@latest/latin-600-normal.woff2
curl -fsSLO $base/figtree@latest/latin-400-normal.woff2
curl -fsSLO $base/figtree@latest/latin-600-normal.woff2
curl -fsSLO $base/figtree@latest/latin-700-normal.woff2
curl -fsSLO $base/space-mono@latest/latin-400-normal.woff2
curl -fsSLO $base/space-mono@latest/latin-700-normal.woff2
cd -
```

- [ ] **Step 2: Verify** all 7 files exist and are non-trivial size (`ls -la landing/assets/fonts` - each > 10 KB). If any 404s, fall back to `https://cdn.jsdelivr.net/npm/@fontsource/<family>/files/<family>-latin-<weight>-normal.woff2`.

- [ ] **Step 3: Commit**

```bash
git add landing/assets/fonts
git commit -m "feat(landing): self-host Fraunces/Figtree/Space Mono woff2"
```

---

### Task 3: Stylesheet (honey tokens + components)

**Files:**
- Create: `landing/assets/styles.css`

Contains: `@font-face` for the 7 faces (`font-display:swap`, relative `url('fonts/...')`); `:root` tokens from DESIGN_PRD 4.1-4.3; body honey-glow background (4.4); and component styles for header, hero, buttons (`.btn`/`.btn.ghost`), feature grid, showcase frames + gallery + lightbox, trap-type cards + badges (7.8 colors), capture list, code block + copy button, warning callout, footer, lang switcher. Responsive `@media (max-width:760px)`. `prefers-reduced-motion` block.

- [ ] **Step 1: Write `landing/assets/styles.css`** with the full token set and all component classes used by `index.html` (Task 4). Use exact DESIGN_PRD values. Keep selectors flat and reusable.

- [ ] **Step 2: Verify** file parses (no unclosed braces): open in browser later with Task 4. For now `npx --yes csslint landing/assets/styles.css || true` (advisory only).

- [ ] **Step 3: Commit**

```bash
git add landing/assets/styles.css
git commit -m "feat(landing): honey design tokens + component styles"
```

---

### Task 4: English page (`index.html`)

**Files:**
- Create: `landing/index.html`

**Interfaces:**
- Produces: DOM hooks used by `main.js` (Task 5): `[data-copy]` on copy buttons with target `<code>`; `[data-shot]` on showcase images for lightbox; `.lang-switch a` links (`./` and `de/`). Body has class for root page.
- Consumes: `assets/styles.css`, `assets/main.js`, `assets/fonts/*`, `assets/shots/*` (Task 7), `assets/og.png` + `assets/favicon.svg` (Task 8).

- [ ] **Step 1: Write `<head>`** - charset, viewport, title, description, `theme-color #F2A007`, `robots: index,follow`, canonical `https://disane87.github.io/honey/`, hreflang en + de + x-default, OG (type/title/description/url/image absolute/locale en_US + alternate de_DE), Twitter `summary_large_image`, favicon, font preloads (Fraunces 600 + Figtree 400), `<link rel="stylesheet" href="assets/styles.css">`, inline critical CSS for header+hero, and JSON-LD `SoftwareApplication` (author -> disane.de, license MIT, price 0, applicationCategory SecurityApplication).

- [ ] **Step 2: Write `<body>`** with all sections from spec (header w/ logo+wordmark+HONEYPOT pill+lang switch+GitHub; hero w/ CTAs; features; "See it in action" showcase + gallery; trap types; what gets captured; self-host docker snippet w/ copy button; legal callout; footer w/ "Made with ♥️ by disane.de" + blog + repo + MIT). Inline Lucide SVGs. EN copy condensed from README, no em-dashes.

- [ ] **Step 3: Reference `assets/main.js`** with `defer` before `</body>`.

- [ ] **Step 4: Verify** serve and eyeball:

```bash
npx --yes serve landing -l 5055
```
Open `http://localhost:5055/` - page renders, fonts load, honey theme correct, no console errors, all sections present. Stop server.

- [ ] **Step 5: Commit**

```bash
git add landing/index.html
git commit -m "feat(landing): English landing page with full SEO"
```

---

### Task 5: Client script (`main.js`)

**Files:**
- Create: `landing/assets/main.js`

**Interfaces:**
- Consumes: DOM hooks from Task 4 (`[data-copy]`, `[data-shot]`, `.lang-switch a`).

- [ ] **Step 1: Write `landing/assets/main.js`** (vanilla, no deps):
  - `pickLanguage()`: only if `document.documentElement.lang === 'en'` AND `!localStorage.getItem('honey-lang')` AND `navigator.language?.toLowerCase().startsWith('de')` -> `location.replace('de/')`.
  - Lang switch clicks: set `localStorage.honey-lang` to the chosen lang, then follow href.
  - Copy buttons: `[data-copy]` copies the referenced code text via `navigator.clipboard`, swaps label to "Copied"/"Kopiert" (read from `data-copied`) for ~1.6s.
  - `lightbox()`: clicking `[data-shot]` opens an overlay with the full image; Escape or click-outside closes. Respect `prefers-reduced-motion`.

- [ ] **Step 2: Verify** reload `http://localhost:5055/`: copy button works, screenshot lightbox opens/closes, switching to DE then back to root does not auto-redirect (preference saved).

- [ ] **Step 3: Commit**

```bash
git add landing/assets/main.js
git commit -m "feat(landing): language switch, copy buttons, lightbox"
```

---

### Task 6: German page (`de/index.html`)

**Files:**
- Create: `landing/de/index.html`

- [ ] **Step 1: Copy `index.html` to `de/index.html`** and translate all visible copy to German in the same warm voice. Set `<html lang="de">`. Fix relative paths for the subdirectory: assets become `../assets/...`, root link `../`, DE self-link `./`, OG/canonical URL -> `https://disane87.github.io/honey/de/`, `og:locale de_DE` + alternate `en_US`, hreflang entries reciprocal, JSON-LD `inLanguage: de`.

- [ ] **Step 2: Verify** open `http://localhost:5055/de/` - renders, German copy, assets resolve (no 404 in console), switcher back to EN works.

- [ ] **Step 3: Commit**

```bash
git add landing/de/index.html
git commit -m "feat(landing): German translation page"
```

---

### Task 7: Capture product screenshots

**Files:**
- Create: `landing/assets/shots/{dashboard,trap-detail,live-feed,custom-builder}.webp`
- Temp (not committed): demo data under `.data/`

- [ ] **Step 1: Seed rich, meaningful, sanitized demo data.** Back up any existing `.data` first. The screens must look expressive and believable, so seed a realistic scenario - not empty, not obviously fake:
  - ~6-8 traps spanning every type with plausible names/notes (e.g. "Leaked admin credentials.docx" pixel, "Q3 board deck" clone of a real-looking site, "Invoice payment portal" custom, "Internal wiki shortcut" redirect, "VPN config" decoy), each with sensible slugs and non-zero hit counts.
  - 20-40 hits spread across traps and time (varied relative times: minutes/hours/days ago) with a realistic mix of human vs bot verdicts and bot reasons.
  - Fabricated but coherent metadata: reserved-range IPs (`203.0.113.x`, `198.51.100.x`, `192.0.2.x`), believable geo (e.g. Berlin/DE, Amsterdam/NL, Ashburn/US), real-looking ISPs/ASNs, and genuine User-Agent strings (Chrome/Firefox/Safari/iOS plus curl/python-requests/Googlebot for the bots).
  - Make the trap chosen for `trap-detail.webp` clearly the busiest, with one expandable hit row that shows a full, satisfying metadata block.
  Seed via the app's create/hit API or by writing the unstorage fs files directly. Absolutely no real IPs or people.

- [ ] **Step 2: Run the app**

```bash
npm run dev
```
(or `npm run build && node .output/server/index.mjs`). Confirm `http://localhost:3000` shows populated traps.

- [ ] **Step 3: Capture with Playwright MCP** at viewport 1440 wide, `deviceScaleFactor: 2`: dashboard `/`, a trap detail `/traps/:id` with one hit row expanded, live feed `/feed`, and the dashboard with the custom builder form open showing its live OG card. Save PNGs to a temp dir.

- [ ] **Step 4: Optimize to webp** (quality ~80, max width ~1600) into `landing/assets/shots/`:

```bash
# if cwebp available; else use sharp via npx
for f in dashboard trap-detail live-feed custom-builder; do \
  npx --yes sharp-cli -i /tmp/$f.png -o landing/assets/shots/$f.webp --webp.quality 80 resize 1600; done
```

- [ ] **Step 5: Restore `.data`** backup (or clear demo data). Confirm `git status` shows only the 4 webp files under `landing/assets/shots/`.

- [ ] **Step 6: Commit**

```bash
git add landing/assets/shots
git commit -m "feat(landing): product screenshots (sanitized demo data)"
```

---

### Task 8: OG image + favicon

**Files:**
- Create: `landing/assets/favicon.svg`
- Create: `landing/assets/og.png` (1200x630)

- [ ] **Step 1: Create `favicon.svg`** - honey hexagon tile with the gradient (`--honey-glow` -> `--honey`) and a dark mark, matching the app logo.

- [ ] **Step 2: Build a 1200x630 OG card** - an HTML file using the honey theme (wordmark `hon.ey`, tagline, honey-glow bg). Render it with Playwright MCP at 1200x630 and save as `landing/assets/og.png`. (Use a real PNG, not SVG, for social compatibility.)

- [ ] **Step 3: Verify** `og.png` is 1200x630 and `favicon.svg` renders. Reload pages - favicon shows, OG image path resolves.

- [ ] **Step 4: Commit**

```bash
git add landing/assets/favicon.svg landing/assets/og.png
git commit -m "feat(landing): OG social card + favicon"
```

---

### Task 9: Sitemap

**Files:**
- Create: `landing/sitemap.xml`

- [ ] **Step 1: Write `landing/sitemap.xml`** listing both URLs with reciprocal `xhtml:link rel="alternate" hreflang` entries (en, de, x-default).

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://disane87.github.io/honey/</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://disane87.github.io/honey/"/>
    <xhtml:link rel="alternate" hreflang="de" href="https://disane87.github.io/honey/de/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://disane87.github.io/honey/"/>
  </url>
  <url>
    <loc>https://disane87.github.io/honey/de/</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://disane87.github.io/honey/"/>
    <xhtml:link rel="alternate" hreflang="de" href="https://disane87.github.io/honey/de/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://disane87.github.io/honey/"/>
  </url>
</urlset>
```

- [ ] **Step 2: Commit**

```bash
git add landing/sitemap.xml
git commit -m "feat(landing): sitemap with hreflang alternates"
```

---

### Task 10: Final verification + README link

**Files:**
- Modify: `README.md` (add a link to the live landing page)

- [ ] **Step 1: Serve and run Lighthouse**

```bash
npx --yes serve landing -l 5055
```
Run a Lighthouse audit (Chrome DevTools MCP `lighthouse_audit` on `http://localhost:5055/`). Confirm Performance >= 95, Accessibility >= 95, Best Practices 100, SEO 100. Fix any flagged issue (contrast, labels, image dims).

- [ ] **Step 2: Cross-check** hreflang reciprocity, both pages' canonical/OG URLs, switcher + redirect behavior, no console 404s on either page.

- [ ] **Step 3: Add a landing link to `README.md`** near the top (e.g. a "Website" badge/line pointing at `https://disane87.github.io/honey/`).

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: link to landing page"
```

- [ ] **Step 5: Push branch and open PR**

```bash
git push -u origin feat/landing-page
gh pr create --fill
```
Note: enable GitHub Pages (Settings -> Pages -> Source: GitHub Actions) after merge.
```
```

## Notes on TDD

This is a static content site, so classic unit tests do not apply. "Tests" here are concrete verification steps: serve locally, eyeball each section, check console for errors/404s, and run a Lighthouse audit against measurable score targets. Each task ends with an independently checkable deliverable.
