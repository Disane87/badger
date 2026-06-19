[![Build & publish Docker image](https://github.com/Disane87/honey/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/Disane87/honey/actions/workflows/docker-publish.yml)
[![Container](https://img.shields.io/badge/ghcr.io-honey-2496ED?logo=docker&logoColor=white)](https://github.com/Disane87/honey/pkgs/container/honey)
![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt&logoColor=white)
![Vue](https://img.shields.io/badge/Vue-3-42b883?logo=vuedotjs&logoColor=white)
![GitHub license](https://img.shields.io/github/license/Disane87/honey)
![GitHub issues](https://img.shields.io/github/issues/Disane87/honey?color=red)
[![semantic-release: conventionalcommits](https://img.shields.io/badge/semantic--release-conventionalcommits-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)
[![Website](https://img.shields.io/badge/website-disane87.github.io%2Fhoney-f2a007?logo=githubpages&logoColor=white)](https://disane87.github.io/honey/)


# 🍯 hon.ey URL Honeypot

Hey there! 👋 **hon.ey** turns any link into a tripwire. Create innocent-looking URLs, plant them
wherever you want to keep an eye on things, and the moment someone opens one you'll know exactly
*who* showed up and *with what*. 🕵️‍♀️✨

> [!TIP]
> 🌐 Prefer the pretty version? There's a **[landing page](https://disane87.github.io/honey/)** (English & German) with the full tour.

![hon.ey dashboard](landing/assets/shots/dashboard.webp)

Think of it as a [canary token](https://canarytokens.org/) you fully control: leaked-credential
docs, fake internal links, "confidential" attachments, tracking pixels in emails. Drop a hon.ey
link and watch the metadata roll in.

> [!WARNING]
> ## 🔒 This is a defensive tool, so keep it on a leash
> hon.ey is for **authorized** security testing and monitoring of assets *you own or are allowed to
> watch*. The dashboard API is gated by a shared token (see
> [Authentication](#-authentication)) and the `custom` trap renders **raw HTML**, so still treat
> the dashboard as sensitive: keep the token strong, run it behind a VPN or IP allowlist if you
> can, and never reuse the token elsewhere. Using tracking or cloaked links against third parties
> without consent may break privacy law (GDPR & friends), and impersonating a brand you don't
> control is plain phishing. Be a good human. 🙏


# ✨ What Can This Thing Do?

Glad you asked! Here's the good stuff:

- 🪤 **Four Trap Flavors**: tracking pixels, redirect links, preview clones, and fully custom fake pages
- 🔍 **Deep Metadata Capture**: IP chain, geo/ISP/ASN, parsed browser & OS, referer, language, raw headers
- 🤖 **Bot vs. Human Verdict**: a built-in heuristic flags automated clients (with the reason why!)
- 🪞 **Link Preview Cloning (MITM)**: copy any URL's OpenGraph card so your trap unfurls identically in Slack/Discord/X
- 🎨 **Custom Preview Builder**: design your *own* fake link preview (image, title, description) with a live preview
- 🧭 **Your Choice of Payload**: send humans onward with a redirect, or show them your own custom HTML page
- 📡 **Live Feed**: every hit across every trap, streaming in and auto-refreshing
- 🌍 **Geo Enrichment**: turn raw IPs into country / city / ISP (toggleable, stays local if you want)
- 💾 **Zero-Setup Storage**: file-based persistence, no database to babysit
- 🐳 **One-Command Docker**: prebuilt image on GHCR, ships as a tiny ~170 MB Alpine container
- 🍯 **Actually Nice to Look At**: a warm, friendly honey-themed dashboard (no scary hacker terminal here)


# 🪤 Trap Types Explained

Each trap is just a URL you plant somewhere. What happens when it's opened depends on the type:

| Type | What the visitor sees | Great for |
|------|------------------------|-----------|
| 👁️ **pixel** | An invisible 1×1 image | Emails & documents: embed `<img src="…/p/<slug>.png">` |
| ↪️ **redirect** | Gets forwarded to a real URL | Looks like a totally normal short link |
| 🪞 **clone** | The cloned preview of a target, then forwarded to it | Making a link unfurl exactly like the real thing |
| 🎨 **custom** | Your hand-crafted preview plus a redirect *or* your own HTML | Suggesting a believable fake page |
| 🎭 **decoy** | A friendly "loading…" page | A soft landing that reveals nothing |

> [!NOTE]
> 🔔 Whatever the type, every single open is logged with the full metadata, and the visitor just
> never notices a thing.


# 🔍 What Gets Captured

Every hit records the juicy details:

- 🌐 **Full IP chain**: `X-Forwarded-For`, `CF-Connecting-IP`, `X-Real-IP`, and the socket address
- 📍 **Geo & network**: country, city, region, ISP, org, ASN (via [ip-api.com](https://ip-api.com), can be turned off)
- 🧭 **Client fingerprint**: browser, version, OS, device, engine (parsed from the User-Agent)
- 🗣️ **Headers & hints**: referer, `Accept-Language`, and the complete raw request headers
- 🤖 **Bot verdict**: human or bot, plus the heuristic reason it decided that


# 📦 Installation

Two easy ways to get going: grab the container, or run it from source. 🎉


# 🐳 Docker (the easy way)

The image is built and pushed to **GitHub Container Registry** automatically on every push to the
default branch and on version tags. Just pull and run:

```bash
docker run -d --name honey \
  -p 3000:3000 \
  -e NUXT_PUBLIC_BASE_URL=https://honey.example.com \
  -e HONEY_DASHBOARD_TOKEN="$(openssl rand -hex 32)" \
  -v honey-data:/app/.data \
  ghcr.io/disane87/honey:latest
```

Then open **http://localhost:3000** and start setting traps! 🍯

- 🔌 Listens on `:3000` (change with `-e PORT=`), binds `0.0.0.0`, runs as a non-root user
- 💾 Trap & hit data lives in `/app/.data`, so mount a volume to keep it across restarts
- ❤️ Built-in healthcheck hits `/api/traps` so your orchestrator knows when it's ready
- 🏷️ Tags available: `latest`, `sha-<short>`, and semver (`1.2.3`, `1.2`) on `v*` releases

Prefer to build it yourself?

```bash
docker build -t honey .
docker run -d -p 3000:3000 -v honey-data:/app/.data honey
```


# 🚀 Getting Started (from source)

Ready to roll? Here's the dev setup:

```bash
npm install
npm run dev
```

That's it! 🎉 Open **http://localhost:3000**.

Building for production without Docker?

```bash
npm run build
node .output/server/index.mjs
```

> [!IMPORTANT]
> Put hon.ey behind a reverse proxy (nginx / Caddy / Traefik) so `X-Forwarded-For` carries the
> *real* client IP. Otherwise every hit looks like it came from your proxy. 🤷


# ⚙️ Configuration

A couple of environment variables, that's all:

| Variable | Default | What it does |
|----------|---------|--------------|
| `NUXT_PUBLIC_BASE_URL` | *(empty)* | The public base URL for your tracking links. Set it to your domain (e.g. `https://honey.example.com`) so copied URLs point at the right place. If empty, it falls back to the browser's current origin. |
| `NUXT_GEO_LOOKUP` | `true` | Outbound IP to geo enrichment via ip-api.com. Set `false` to stay 100% local with zero outbound calls. |
| `HONEY_DASHBOARD_TOKEN` | *(unset)* | Shared secret guarding every `/api/*` dashboard endpoint. **Required** — if unset the server returns `503` for all API calls. See [Authentication](#-authentication). |
| `HONEY_AUTH_DISABLED` | *(unset)* | Set to `1` to bypass `HONEY_DASHBOARD_TOKEN` entirely. **Local development only — never set in production.** |
| `PORT` | `3000` | Port the server listens on. |
| `HOST` | `0.0.0.0` | Bind address. |

There's a ready-to-copy [`.env.example`](.env.example) too. 📝


# 🔐 Authentication

Every `/api/*` endpoint streams sensitive honeypot data — visitor IPs, request headers, the cookies
their browser leaked, the full trap configuration. So hon.ey gates the entire dashboard API behind
a single shared token. It's deliberately simple: one secret, no user accounts, no session store. 🗝️

## Setting the token

Generate something long and random, then hand it to the server via `HONEY_DASHBOARD_TOKEN`:

```bash
# Generate
openssl rand -hex 32
# → put the result in your .env, docker-compose, or -e flag
```

> [!IMPORTANT]
> If `HONEY_DASHBOARD_TOKEN` is **unset**, the server fails closed and answers every dashboard
> request with `503 Dashboard auth not configured`. That's intentional — there is no "default open"
> mode for production. 🚪

## How clients send it

The middleware accepts the token from any of these (first match wins):

| Where | How it looks |
|-------|--------------|
| 🏷️ Header | `Authorization: Bearer <token>` |
| 🍪 Cookie | `honey_token=<token>` |
| 🔗 Query  | `?token=<token>` (handy for quick `curl`, avoid in URLs you share) |

Quick smoke test against a running instance:

```bash
curl -H "Authorization: Bearer $HONEY_DASHBOARD_TOKEN" http://localhost:3000/api/traps
```

## Reverse-proxy injection (recommended for prod)

The cleanest way to use the dashboard from a browser today is to let your reverse proxy attach the
header for you. Example with nginx:

```nginx
location / {
  proxy_pass http://honey:3000;
  proxy_set_header Authorization "Bearer $HONEY_TOKEN_FROM_NGINX_ENV";
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

…or Caddy:

```caddy
honey.example.com {
  reverse_proxy honey:3000 {
    header_up Authorization "Bearer {env.HONEY_DASHBOARD_TOKEN}"
  }
}
```

That way the browser never has to know the secret. Pair this with VPN access or an IP allowlist if
you want defense-in-depth. 🛡️

## Local development

`npm run dev` against a fresh checkout would 503 on every API call. Two options:

```bash
# 1. Run with a throwaway token (mirrors production behavior)
HONEY_DASHBOARD_TOKEN=dev-only npm run dev

# 2. Skip auth entirely. Quick, but never use this in production.
HONEY_AUTH_DISABLED=1 npm run dev
```

> [!CAUTION]
> 🧨 The dashboard's Vue frontend doesn't have a login form *yet* — opening `http://localhost:3000`
> in a browser only works when you're behind a reverse proxy that injects the header, or when
> `HONEY_AUTH_DISABLED=1`. A proper login flow is a planned follow-up.


# 🎨 The Dashboard

hon.ey ships with three friendly screens:

- 🪤 **Traps**: your command center. Create traps, copy their URLs, see hit counts at a glance.
- 📡 **Live Feed**: every recent visitor across all traps, auto-refreshing so you don't have to.
- 🔎 **Trap Detail**: the full hit timeline with expandable metadata, plus the link-preview card for clone/custom traps.

| 🔎 Trap detail | 📡 Live feed |
|----------------|--------------|
| ![Trap detail with expanded hit metadata](landing/assets/shots/trap-detail.webp) | ![Live feed of recent visitors](landing/assets/shots/live-feed.webp) |

Want to design a fake preview? The **Custom Preview Builder** lets you type a title, description and
image URL and watch the social-card preview update live, then pick whether humans get redirected or
shown your own HTML. 🪄

![Custom preview builder with a live social-card preview](landing/assets/shots/custom-builder.webp)

> [!NOTE]
> 📸 The screenshots above use fabricated demo data, no real IPs or people.


# 🛠️ Tech Stack

Built with the good stuff:

- ⚡ **[Nuxt 4](https://nuxt.com) + [Vue 3](https://vuejs.org)**: SSR app & Nitro server in one
- 🎀 **[@nuxt/icon](https://github.com/nuxt/icon)** with the [Lucide](https://lucide.dev) set (bundled locally, no CDN)
- 🧩 **[unstorage](https://unstorage.unjs.io)**: file-based persistence, nothing else to install
- 🐳 **Multi-stage Docker** plus GitHub Actions to GHCR


# ⚠️ Legal & Ethical Note

hon.ey is a **defensive** instrument. Only deploy it on assets and networks you own or are
explicitly authorized to monitor. The geo lookup sends visitor IPs to a third-party API (disable it
if that's a concern), the `clone` and `custom` traps can reproduce or fabricate link previews, and
the `custom` trap renders operator-authored HTML verbatim. Don't use any of this to deceive or
impersonate third parties, because that crosses into phishing and is illegal in most places. 🙏


# 🚀 Releases

Versioning is fully automated with [semantic-release](https://semantic-release.gitbook.io/). Every
push to `main` is analyzed, and your [Conventional Commits](https://www.conventionalcommits.org/)
decide what happens next:

- 🐛 `fix:` → patch release (1.0.**1**)
- ✨ `feat:` → minor release (1.**1**.0)
- 💥 `feat!:` or a `BREAKING CHANGE:` footer → major release (**2**.0.0)
- 🧹 `chore:`, `docs:`, `refactor:`, `test:` and friends → no release

When a release is cut, the pipeline automatically:

1. 🏷️ Tags the commit and creates a **GitHub Release** with generated notes
2. 📝 Updates [`CHANGELOG.md`](CHANGELOG.md) and the version in `package.json`
3. 🐳 Builds and pushes the Docker image to GHCR as `:x.y.z`, `:x.y`, and `:latest`

So just write good commit messages and let the robots do the boring part! 🤖✨


# 📄 License

[MIT](LICENSE). Do good things with it.
