# Design: hon.ey marketing landing page (GitHub Pages)

**Date:** 2026-06-19
**Status:** Approved (design), pending implementation plan

## Purpose

A public, static marketing landing page for **hon.ey** (the URL-honeypot tool),
published to **GitHub Pages** (not built into the Docker image). It must have:

- Full SEO (meta, Open Graph, Twitter, hreflang, JSON-LD, sitemap, robots).
- Excellent performance (no framework, self-hosted fonts, inlined critical CSS,
  inlined SVG icons; target Lighthouse 95-100 across the board).
- Bilingual content (English + German) selected by browser language, with a
  manual override.
- The Disane87 README writing voice (warm, enthusiastic, emoji-rich).
- The obligatory footer: **"Made with ♥️ by disane.de"** plus links to the blog
  and personal site.

The repo (`Disane87/honey`) is currently private and **will be made public** after
this work, so the call-to-action is GitHub stars + self-hosting.

## Constraints & decisions

- **No Docker, no Nuxt build for this page.** A standalone static site lives in a
  new top-level `landing/` directory and is the deploy artifact for GitHub Pages.
  The existing `.github/workflows/docker-publish.yml` is left untouched.
- **Hosting:** default project-pages URL `https://disane87.github.io/honey/`
  (base path `/honey/`). All links and assets use **relative** paths so the base
  path needs no special handling. No custom domain / CNAME.
- **Voice:** README voice (emoji-rich), per `readme-writing-style` memory. Reuse
  and condense the existing `README.md` copy. Never use em/en-dashes (per the
  `no-em-dashes` memory).
- **Visual language:** the honey light-theme design tokens from `DESIGN_PRD.md`
  (colors, Fraunces/Figtree/Space Mono typography, radii, warm shadows, honey-glow
  background) so the landing and the dashboard read as one product.
- **Icons:** Lucide, but **inlined as raw SVG** in the HTML (no `@nuxt/icon`, no
  CDN). Emoji are allowed in copy/headings (README voice); Lucide SVGs carry the
  feature-card and UI iconography.
- **Fonts:** **self-hosted** `woff2` (latin subset) for Fraunces, Figtree, Space
  Mono. `font-display: swap`, `<link rel="preload">` for the two above-the-fold
  faces. No Google Fonts CDN call (faster + GDPR-clean).
- **Blog:** `https://blog.disane.dev`. **Site:** `https://disane.de`.

## File structure

```
landing/
  index.html              # English (default, canonical)
  de/
    index.html            # German
  assets/
    styles.css            # honey design tokens + page styles (shared by both langs)
    main.js               # tiny: language redirect/switcher + copy-to-clipboard
    fonts/
      fraunces-*.woff2
      figtree-*.woff2
      space-mono-*.woff2
    og.png                # 1200x630 social card
    favicon.svg
  robots.txt
  sitemap.xml
  .nojekyll               # disable Jekyll processing on Pages
.github/workflows/
  pages.yml               # build-less deploy of landing/ to GitHub Pages
```

## Components / units (each has one clear job)

1. **HTML page template (per language).** `index.html` and `de/index.html` share
   identical structure and styling; only the visible copy and the language-specific
   `<head>` tags differ. Each is self-contained and independently viewable.
2. **`styles.css`.** All design tokens as CSS custom properties on `:root` (from
   DESIGN_PRD section 4) plus component styles for the landing sections. Shared
   verbatim by both languages. Critical above-the-fold CSS is additionally inlined
   in each page `<head>`; this file is the cached remainder.
3. **`main.js`.** Three small, independent functions:
   - `pickLanguage()` - on the root (EN) page only: if `localStorage.honey-lang`
     is unset and `navigator.language` starts with `de`, `location.replace('de/')`.
     Runs once; guarded against loops.
   - language switcher click handler - sets `localStorage.honey-lang` and navigates.
   - `copyButtons()` - copy the Docker snippet, show a brief "Copied" state.
   - Degrades gracefully: with JS off, EN renders fully and both languages are
     reachable via the visible switcher links.
4. **`pages.yml` workflow.** On push to the default branch (paths: `landing/**`),
   `actions/upload-pages-artifact` (path `landing`) -> `actions/deploy-pages`.
   No build step. Needs `pages: write` + `id-token: write` permissions and the
   `github-pages` environment.
5. **SEO assets.** `robots.txt` (allow all, link sitemap), `sitemap.xml` (both
   language URLs with `xhtml:link` hreflang alternates), `og.png` (1200x630).

## Page content (sections)

Same sections in both languages; English copy condensed from `README.md`, German
is a faithful translation in the same voice.

1. **Header** - logo tile (honey-gradient, Lucide `hexagon`) + `hon.ey` wordmark
   (the dot in `--honey-deep`) + `HONEYPOT` pill; right side: **EN | DE** switcher
   and a "GitHub" link.
2. **Hero** - H1 with accent word, tagline ("turns any link into a tripwire"),
   lead paragraph, primary CTA **Star on GitHub**, secondary CTA **Self-host**
   (anchors to the Docker section). Honey-glow background layers from DESIGN_PRD 4.4.
3. **What can this thing do?** - feature grid (Lucide icon + bold lead-in + short
   line), drawn from the README feature list.
4. **Trap types** - cards for pixel / redirect / clone / custom / decoy using the
   honey badge color pairs (DESIGN_PRD 7.8).
5. **What gets captured** - metadata bullet list (IP chain, geo/ASN, client
   fingerprint, headers, bot verdict).
6. **Self-host in one command** - the `docker run` snippet in a mono code block
   with a copy button; note about reverse-proxy / `X-Forwarded-For`.
7. **Legal & ethical note** - the README warning callout (warm but clear).
8. **Footer** - **"Made with ♥️ by disane.de"** linking to `https://disane.de`;
   plus links to the blog (`https://blog.disane.dev`), the GitHub repo, and the MIT
   license. Small, calm.

## SEO specification

Per page, in `<head>`:

- `<title>`, `<meta name="description">` (language-appropriate).
- `<link rel="canonical">` to that page's own URL.
- `<link rel="alternate" hreflang="en" ...>`, `hreflang="de"`, and
  `hreflang="x-default"` (-> EN) on **both** pages.
- Open Graph: `og:type=website`, `og:title`, `og:description`, `og:url`,
  `og:image` (absolute URL to `assets/og.png`, 1200x630), `og:locale`
  (`en_US` / `de_DE`) + `og:locale:alternate`.
- Twitter: `summary_large_image` card with title/description/image.
- `<meta name="theme-color" content="#F2A007">`, `robots: index,follow`.
- JSON-LD `SoftwareApplication` (name, description, applicationCategory
  `SecurityApplication`, operatingSystem, author -> disane.de, license MIT,
  offers price 0).

Root-level: `robots.txt` (allow all + `Sitemap:` line) and `sitemap.xml`
(both URLs, each with `xhtml:link rel="alternate" hreflang"` entries).

> Note: the main Nuxt app sets `noindex,nofollow`; the landing page is the
> opposite and **must** be indexable.

## Performance specification

- One CSS file + one tiny JS file; no third-party requests at runtime.
- Self-hosted `woff2` fonts, latin subset, `font-display: swap`; preload the two
  hero faces (Fraunces display + Figtree body).
- Inlined critical CSS in `<head>`; inlined SVG icons (no icon font/CDN).
- `og.png` and `favicon.svg` the only image assets; lazy-load anything below fold
  if added later.
- Respect `prefers-reduced-motion` (disable non-essential animation).
- Target Lighthouse: Performance >= 95, Accessibility >= 95, Best Practices 100,
  SEO 100.

## Accessibility

- Contrast per DESIGN_PRD 11 (main text >= 7:1). Visible honey focus ring on all
  interactive elements; never `outline:none` without replacement.
- Decorative SVGs `aria-hidden`; meaning always conveyed by text too.
- Language switcher is real links; `<html lang>` set correctly per page.
- Semantic landmarks (`header`, `main`, `section`, `footer`), one `h1` per page.

## Error handling / edge cases

- JS disabled: EN page renders fully; both languages reachable via switcher links;
  copy button falls back to a selectable code block.
- Redirect loop prevention: root only redirects when no stored preference; the DE
  page never auto-redirects.
- Base-path safety: all internal links/assets relative, so `/honey/` works without
  edits and the site is also previewable from `landing/` directly.

## Testing / verification

- Serve `landing/` locally and verify both pages render, switcher works, redirect
  fires for a `de` browser language and is overridable.
- Validate HTML, hreflang reciprocity, and JSON-LD.
- Run a Lighthouse audit against the served `landing/` and confirm the score
  targets above.
- Confirm relative paths resolve under a `/honey/` base (e.g. serve from a
  `/honey/` sub-path locally).

## Out of scope

- Custom domain / CNAME (using default gh-pages URL).
- A third language or a CMS-driven content model.
- Embedding a live demo of the dashboard.
- Changes to the Nuxt app or the Docker workflow.
