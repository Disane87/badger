# Design PRD — hon.ey

> **Zweck dieses Dokuments:** Eine implementierungsreife Design-Spezifikation für das
> hon.ey-Dashboard. Es ist so geschrieben, dass ein Agent (z. B. Claude) das Design ohne
> weitere Rückfragen umsetzen oder konsistent erweitern kann. Alle Werte sind verbindlich,
> nicht beispielhaft. Wo „SOLL" steht, ist es Pflicht; „KANN" ist optional.

---

## 1. Produkt & Kontext

**hon.ey** ist ein Cybersecurity-Tool (URL-Honeypot / Canary-Token). Nutzer:innen erstellen
unverdächtig aussehende Tracking-Links und sehen, *wer* sie öffnet und *mit welchen Metadaten*.

- **Plattform:** Web-App, Desktop-first, responsive bis Mobile.
- **Tech-Stack:** Nuxt 4 + Vue 3, `@nuxt/icon` (Lucide-Collection via Iconify), reines CSS
  (keine UI-Library, keine Tailwind). Globale Styles in `app/assets/css/main.css`.
- **Rendering:** SSR. Alle zeit-/origin-abhängigen Werte müssen SSR-stabil sein
  (siehe §13).

### Zielgruppe & Tonalität
Sicherheitsbewusste, technische Nutzer:innen (Pentester, IT-Security, Admins). Das Tool wird
oft in stressigen Situationen genutzt. Die UI SOLL deshalb **freundlich, ruhig und
vertrauenswürdig** wirken — bewusst das Gegenteil eines kühlen „Hacker-Terminals".

---

## 2. Design-Prinzipien

1. **Warm statt kalt.** Honig-Metapher (Name = hon.ey). Cremiges Licht-Theme, Bernstein-Akzente.
2. **Freundlich, nicht verspielt.** Runde Formen, weiche Schatten, aber präzise und professionell.
3. **Klarheit vor Dichte.** Großzügiger Weißraum, klare Hierarchie, gut lesbare Typo.
4. **Eine Akzentfarbe, sparsam.** Honig-Gold trägt Primäraktionen & Highlights; sonst neutral.
5. **Ruhige Bewegung.** Dezente Einblendungen beim Laden, sanfte Hover-Reaktionen. Kein Flackern.
6. **Keine Emojis.** Ausschließlich Lucide-Icons (Iconify). Konsistente Strichstärke.

---

## 3. Aesthetic Direction

Warmes „Honigwaben"-Licht-Theme. Cremiger Hintergrund mit weichen Honig-Glow-Verläufen und
einer sehr dezenten Punkt-Textur (Wabenanmutung). Distinktive redaktionelle Serif für
Überschriften (Fraunces) trifft auf eine freundliche geometrische Sans (Figtree) und eine
Mono für technische Werte (Space Mono). Karten sind großzügig gerundet, schweben auf weichen,
warm getönten Schatten.

---

## 4. Design Tokens (verbindlich)

Als CSS Custom Properties unter `:root` zu definieren.

### 4.1 Farben

```css
/* Flächen */
--bg:            #fdf7ec;  /* App-Hintergrund (warmes Creme) */
--bg-tint:       #fbeed6;  /* getönte Fläche */
--surface:       #ffffff;  /* Karten, Panels */
--surface-2:     #fffaf0;  /* Eingabefelder, Sub-Flächen, Tabellen-Header */
--border:        #f0e2c8;  /* Standard-Rahmen */
--border-strong: #e7d4ad;  /* betonter Rahmen */

/* Text */
--ink:       #2e2415;  /* Haupttext (Espresso) */
--ink-soft:  #6f5f45;  /* Sekundärtext */
--ink-faint: #a2906f;  /* Tertiär / Labels / Platzhalter */

/* Honig-Akzent (Primär) */
--honey:      #f2a007;
--honey-deep: #d98309;  /* Links, betonte Zahlen */
--honey-glow: #ffd166;  /* Verlauf-Highlight */
--honey-soft: #fff1cf;  /* sanfter Akzent-Hintergrund */

/* Semantisch */
--mint:      #1f9d57;  --mint-soft:  #e2f6ea;  /* Erfolg / „human" */
--coral:     #e05038;  --coral-soft: #fce6e0;  /* Fehler / „bot" / löschen */
--sky:       #2b7fc4;  --sky-soft:   #e3f0fb;  /* Info / redirect */
--plum:      #8a5bd0;  --plum-soft:  #f0e8fb;  /* pixel */
```

Akzentfarbe sparsam einsetzen: Primärbutton, aktive Nav, betonte KPI-Zahl, Logo, Fokus-Ring.

### 4.2 Typografie

```css
--display: "Fraunces", Georgia, serif;                 /* Überschriften */
--sans:    "Figtree", -apple-system, "Segoe UI", sans-serif; /* Body, UI */
--mono:    "Space Mono", ui-monospace, Menlo, monospace;     /* URLs, IPs, Code */
```

Laden via Google Fonts im `<head>` (siehe `nuxt.config.ts`). Fallbacks Pflicht.

| Element        | Font      | Größe / Gewicht / Tracking                          |
|----------------|-----------|------------------------------------------------------|
| H1             | display   | 38px / 600 / -0.02em / line-height 1.05             |
| H2             | display   | 22px / 600                                            |
| Lead-Absatz    | sans      | 16px / 400 / `--ink-soft` / max-width 56ch          |
| Body           | sans      | 15px / 400 / line-height 1.55                        |
| Section-Title  | mono      | 12px / 700 / 0.14em / UPPERCASE / `--ink-faint`     |
| Label (Form)   | sans      | 13px / 600 / `--ink-soft`                             |
| Tabelle TH     | mono      | 11px / 700 / 0.1em / UPPERCASE / `--ink-faint`      |
| Code / URL / IP| mono      | 12.5–13px                                            |

H1 SOLL ein eingefärbtes Akzent-Wort enthalten (`<span class="accent">` in `--honey-deep`).
Mobile (≤760px): H1 auf 30px.

### 4.3 Spacing, Radius, Schatten, Motion

```css
/* Radius */
--r-sm: 10px;   --r: 16px;   --r-lg: 22px;
/* Pills/Buttons/Badges: 999px (vollrund) */

/* Schatten (warm getönt) */
--shadow-sm: 0 1px 2px rgba(120,88,20,.06), 0 1px 3px rgba(120,88,20,.05);
--shadow:    0 4px 14px -4px rgba(150,110,30,.16), 0 2px 6px -2px rgba(150,110,30,.08);
--shadow-lg: 0 18px 40px -12px rgba(150,110,30,.28), 0 6px 14px -6px rgba(150,110,30,.12);
```

- **Spacing-Schritte:** 6 / 10 / 14 / 16 / 20 / 24 / 28 / 36 px.
- **Container:** `max-width: 1080px`, `padding: 0 24px`, zentriert.
- **Seiten-Padding vertikal:** `38px` oben, `80px` unten.
- **Motion-Timing:** Standard `0.15s ease` (Hover), Einblendungen
  `0.45–0.5s cubic-bezier(.2,.7,.2,1)`. `prefers-reduced-motion` respektieren (Animationen aus).

### 4.4 Hintergrund (App-Body)

Drei Layer kombiniert, `background-attachment: fixed`:
1. Honig-Glow oben rechts: `radial-gradient(900px 500px at 88% -8%, rgba(255,209,102,.5), transparent 60%)`
2. Sanfter Akzent links oben: `radial-gradient(800px 600px at -6% 8%, rgba(242,160,7,.14), transparent 55%)`
3. Punkt-Textur (Wabenanmutung): `radial-gradient(rgba(231,212,173,.55) 1.1px, transparent 1.2px)` mit `background-size: 26px 26px`.

---

## 5. Iconografie

- **Quelle:** ausschließlich **Lucide** über `@nuxt/icon` → `<Icon name="lucide:<name>" />`.
- **Keine Emojis** irgendwo in der UI.
- Icons erben `currentColor` und Größe `1em`; vertikale Ausrichtung `vertical-align: -0.135em`.
- **Icon-Mapping (verbindlich):**

| Zweck                    | Icon |
|--------------------------|------|
| Logo / Marke             | `lucide:hexagon` |
| Nav: Traps               | `lucide:layout-grid` |
| Nav: Live Feed           | `lucide:radio` |
| KPI aktive Traps         | `lucide:layout-grid` |
| KPI Hits gesamt          | `lucide:crosshair` |
| KPI ausgelöst            | `lucide:zap` |
| KPI Host                 | `lucide:globe` |
| Trap-Typ pixel           | `lucide:eye` |
| Trap-Typ redirect        | `lucide:corner-up-right` |
| Trap-Typ clone           | `lucide:copy` |
| Trap-Typ custom          | `lucide:image` |
| Trap-Typ decoy           | `lucide:venetian-mask` |
| Aktion neu / hinzufügen  | `lucide:plus` |
| Schließen                | `lucide:x` |
| Kopieren                 | `lucide:copy` |
| Löschen                  | `lucide:trash-2` |
| Treffer-Pille            | `lucide:target` (0 Treffer: `lucide:minus`) |
| Erfolg / Toast           | `lucide:check` |
| Fehler                   | `lucide:triangle-alert` |
| Mensch / Bot             | `lucide:user-round` / `lucide:bot` |
| Unique IPs               | `lucide:fingerprint` |
| Refresh                  | `lucide:refresh-cw` (lädt: Klasse `.spin`) |
| Zurück                   | `lucide:arrow-left` |
| Custom-HTML-Modus        | `lucide:code` |
| Empty: keine Traps       | `lucide:inbox` |
| Empty: Detail wartet     | `lucide:satellite-dish` |
| Empty: Feed leer         | `lucide:radar` |

---

## 6. Layout-System

- **Header (sticky):** Höhe 70px, halbtransparenter Creme-Hintergrund mit `backdrop-filter: blur(10px)`
  (inkl. `-webkit-`-Prefix), unten 1px `--border`.
  - **Links:** Brand = Logo-Kachel (40×40, gerundet 13px, Honig-Verlauf, leicht rotiert −4°,
    Icon in dunklem Braun) + Wortmarke `hon.ey` (display, der Punkt in `--honey-deep`) +
    Pille-Tag `HONEYPOT` (mono, 10px, `--honey-soft`).
  - **Rechts:** Nav-Pills mit Icon+Text. Hover: `--honey-soft`. Aktiv: dunkle Pille
    (`--ink` Hintergrund, weißer Text).
- **Content:** im `.container`. Seiten beginnen mit Header-Block (`.between`: H1+Lead links,
  Primäraktion rechts).
- **Grids:** KPI-Reihe = 4 Spalten (mobil 2). Trap-Liste = `auto-fill, minmax(330px, 1fr)`.

---

## 7. Komponenten-Spezifikation

Jede Komponente mit Default + relevanten States (hover/focus/disabled/active/empty).

### 7.1 Button (`.btn`)
- **Primär:** Honig-Verlauf `linear-gradient(150deg, --honey-glow, --honey)`, Text `#3a2a05`,
  vollrund, 11px 20px, Gewicht 700, weicher Honig-Schatten. Hover: `translateY(-2px)` + stärkerer
  Schatten. Active: zurück auf 0. Disabled: opacity .55, kein Lift.
- **Ghost (`.btn.ghost`):** weiße Fläche, `--ink-soft`, 1.5px `--border-strong`. Hover: `--honey-soft`.
- **Danger (`.btn.danger`):** transparent, `--coral`, Rahmen `--coral-soft`. Hover: `--coral-soft`-Fläche.
- **Small (`.btn.sm`):** 7px 13px / 13px.
- Buttons mit Icon: Icon links, `gap: 7–8px`.

### 7.2 Eingaben (`input, select, textarea`)
- Fläche `--surface-2`, Rahmen 1.5px `--border`, Radius `--r-sm`, Padding 11px 13px, 15px.
- **Focus:** Rahmen `--honey`, Fläche `--surface`, Fokus-Ring `0 0 0 4px rgba(242,160,7,.16)`.
- Platzhalter `--ink-faint`. `textarea.mono` für HTML/Code-Eingaben (mono, 13px).
- **Field-Row:** 2-spaltiges Grid (mobil 1-spaltig).

### 7.3 Segmented Control (`.seg` / `.seg-btn`)
- Vollrunde Leiste, Fläche `--surface-2`, 4px Innenabstand. Buttons vollrund.
- Aktiver Button (`.on`): `--ink`-Fläche, weißer Text. Inaktiv: `--ink-soft`, transparent.
- Einsatz: „Was sieht ein Mensch?" → *Redirect them* / *Show custom HTML*.

### 7.4 Panel (`.panel`, `.panel.pad`)
- `--surface`, 1px `--border`, Radius `--r`, `--shadow-sm`. `.pad` = 24px Innenabstand.

### 7.5 KPI-Kachel (`.stat`)
- Panel-Stil, 20px. Oben Icon-Kachel (`.ico`: 36×36, Radius 11px, `--honey-soft`).
- Zahl (`.n`): display, 30px. Varianten `.accent` (Honig), `.mint`, `.coral`. Host als `.n.host` (mono 16px).
- Label (`.l`): 13px `--ink-soft`. Hover: `translateY(-3px)` + `--shadow`.

### 7.6 Trap-Karte (`.trap-card`)
- Panel-Stil, 20px, Flex-Spalte, `gap: 12px`, klickbar (→ Detail).
- **Kopf:** Titel (display, 18px) links, Typ-Badge rechts.
- **Note:** 13.5px `--ink-soft` (optional).
- **URL-Chip** (`.url`, siehe 7.9) mit Copy-Button.
- **Fuß:** Treffer-Pille links; rechts relative Zeit + Delete-Button (sm danger, nur Icon).
- Hover: `translateY(-4px)` + `--shadow-lg` + Rahmen `--border-strong`.
- Eintritt: gestaffelte `pop`-Animation, `animation-delay: index * 0.04s`.

### 7.7 Treffer-Pille (`.hit-pill`)
- Vollrund, `--surface-2`. Variante `.live` (Treffer > 0): `--honey-soft` + `--honey-deep`.

### 7.8 Badge (`.badge` + Typ-/Verdict-Klasse)
- Vollrund, 12px/700, Icon+Text, kapitalisiert. Farbpaare:
  - `.redirect` → sky · `.clone` → mint · `.pixel` → plum · `.decoy` → honey ·
    `.custom` → burnt-orange (`#c2562f` / bg `#fbe7da` / border `#f3cbb0`)
  - `.human` → mint · `.bot` → coral

### 7.9 URL-/Code-Chip (`.url`, `.code`)
- `.url`: mono 12.5px, `--surface-2`, Rahmen `--border`, Radius `--r-sm`, `--honey-deep`-Text,
  inneres `<span class="u">` mit Ellipsis bei Overflow, Copy-Button (`.copy`) rechts.
- `.copy`: nur Icon, `--ink-faint`; Hover `--honey-deep` + leichte Skalierung.

### 7.10 Tabelle (`.table-wrap` + `table`)
- In `.panel.table-wrap` (gerundete Ecken). TH: mono-Uppercase, `--surface-2`-Hintergrund.
- Zeilen `.clickable`: Hover `--surface-2`. Aufklappbare Detailzeile mit `--surface-2`-Fläche.

### 7.11 OG-Vorschau-Karte (`.og-card`)
- Imitiert einen Social-Link-Unfurl. Max-Breite 540px, gerundet `--r`, Rahmen, `--shadow-sm`.
- **Bild** (`.og-img`): volle Breite, `max-height 260px`, `object-fit: cover`. Leerzustand
  (`.og-img--empty`): zentriertes `lucide:image`, Höhe 150px, `--ink-faint`.
- **Body:** Site-Name (mono uppercase, `--ink-faint`), Titel (display 17px), Beschreibung
  (3 Zeilen, `-webkit-line-clamp: 3`).

### 7.12 Custom-Preview-Builder (`.builder`)
- 2-spaltiges Grid (mobil 1): **links** Felder (Titel/Beschreibung/Bild-URL/Site-Name),
  **rechts** Live-`.og-card`, die sich beim Tippen in Echtzeit aktualisiert.
- Eingerahmt: `--surface-2`, Rahmen, Radius `--r`, 18px Padding.

### 7.13 Empty State (`.empty`)
- Zentriert, 64px Padding. Großes Icon (`.big`, 52px) mit sanfter `float`-Animation, H3
  (display 21px), erklärender Satz in `--ink-soft`.

### 7.14 Toast (`.toast`)
- Fixiert unten zentriert, dunkle Pille (`--ink`-Fläche, `--honey-glow`-Text), Check-Icon,
  `--shadow-lg`. Ein-/Ausblenden via `fade`-Transition (opacity + translateY). Auto-Hide ~1.8s.

### 7.15 Key-Value-Liste (`.kv`) & Header-Box (`.headers-box`)
- `.kv`: 2-Spalten-Grid (Label 150px / Wert), Werte in mono. Mobil 1-spaltig.
- `.headers-box`: `--surface-2`, mono 12px, scrollbar (max-height 320px), für Roh-Header/Tags.

---

## 8. Seiten

### 8.1 Dashboard `/` (Trap-Übersicht)
1. **Header-Block:** H1 „Your **honey traps**" + Lead; rechts Primärbutton (`plus` „New trap",
   togglet zu `x` „Close").
2. **KPI-Reihe (4):** Active traps · Total hits caught · Traps triggered (mint) · Tracking host.
3. **Anlege-Formular** (einklappbar, `fade`): Name; Field-Row [Typ-Select | Custom-Slug];
   typ-abhängige Felder:
   - `redirect`/`clone`: Ziel-URL (+ Hinweistext bei clone).
   - `custom`: **Builder** (7.12) + Segmented Control „When a human opens the link…"
     → bei *Redirect* Ziel-URL-Feld, bei *HTML* `textarea.mono` für das HTML.
   - Note-Feld. Fehlerzeile (`.form-error`). Submit-Button.
4. **Section-Title „All traps"** + entweder Empty-State (`inbox`) oder **Trap-Karten-Grid**.
5. Toast bei Aktionen.

### 8.2 Trap-Detail `/traps/:id`
1. Zurück-Link (`arrow-left`).
2. Header: Trap-Name (H1) + Note; rechts Typ-Badge.
3. **Tracking-URL-Panel** mit Copy; typ-abhängiger Hinweis (Embed-Snippet bei pixel;
   „Forwards to" bei redirect; „Clones… forwards to" bei clone; „Humans are forwarded to" /
   „Humans see your custom HTML" bei custom).
4. **Link-Preview-Panel** (wenn `ogData` existiert, also clone/custom): `.og-card` +
   aufklappbare Tag-Liste. Refresh-Button **nur** bei `clone`.
5. **KPI-Reihe (4):** Total hits · Unique IPs · Likely humans (mint) · Likely bots (coral).
6. **Section-Title „Hits"** (zeigt „refreshing…" beim Poll) + Empty-State (`satellite-dish`)
   oder **Treffer-Tabelle**. Zeile klickbar → klappt Detail auf:
   - Zwei `.kv`-Spalten (Zeitstempel, Method/Path, IP-Kette, Referer, Accept-Language, UA,
     Bot-Grund | Browser, OS, Device, Engine, Country, City/Region, ISP/Org, ASN).
   - Aufklappbare Roh-Header-Box.
7. Auto-Refresh alle 10s. Toast bei Copy/Refresh.

### 8.3 Live-Feed `/feed`
1. Header: H1 „Live **feed**" + Lead; rechts Ghost-Button „Refresh" (`refresh-cw`).
2. Empty-State (`radar`) oder **Tabelle**: When · Trap (→ Detail) · IP · Location · Client · Verdict.
3. Zeilen klickbar → Trap-Detail. Auto-Refresh alle 8s.

---

## 9. Motion & Micro-Interactions

- **Page-Load:** `.page` blendet mit `rise` (10px hoch, 0.5s) ein.
- **Trap-Karten:** gestaffelte `pop`-Animation (delay = index × 0.04s).
- **Hover-Lift:** Karten/Stats heben sich an + Schatten verstärkt.
- **Buttons:** Lift bei Hover, Reset bei Active.
- **Toast:** fade + slide-up.
- **Empty-Icons:** sanftes `float` (3s, ±8px).
- **Refresh-Icon:** `.spin` (0.9s linear) während des Ladens.
- `@media (prefers-reduced-motion: reduce)`: alle nicht-essenziellen Animationen deaktivieren.

---

## 10. Responsive

- **≤760px:** H1 30px; KPI-Grid 2-spaltig; Field-Row, `.kv`, Trap-Grid, `.builder` 1-spaltig.
- Header bleibt sticky; Nav-Pills bleiben sichtbar (ggf. Text via `&nbsp;` zusammenhalten).
- Tabellen: horizontal scrollbar zulassen (kein Layout-Bruch).

---

## 11. Accessibility

- Kontrast: Haupttext `--ink` auf `--surface`/`--bg` ≥ 7:1. Sekundärtext ≥ 4.5:1.
- Sichtbarer Fokus-Ring auf allen interaktiven Elementen (Honig-Ring, siehe 7.2). Niemals
  `outline: none` ohne Ersatz.
- Icons sind dekorativ → `aria-hidden` (vom Icon-Component gesetzt); Bedeutung immer auch als Text.
- Klickbare Tabellenzeilen/Karten: zusätzlich per Tastatur erreichbar (Link/Button-Semantik bevorzugen).
- `prefers-reduced-motion` respektieren.
- Formularfelder mit `<label>` verknüpft.

---

## 12. Content / Copy

- **Stimme:** freundlich, klar, kurz. Beispiele: „Your honey traps",
  „Friendly-looking links that quietly note down everyone who opens them — and exactly how.",
  „All quiet", „Waiting for the first visitor".
- UI-Sprache: Englisch. Fachbegriffe konsistent: *trap, hit, verdict (human/bot), preview*.
- Keine Ausrufezeichen-Inflation, keine Emojis, kein Marketing-Sprech.

---

## 13. Technische Constraints (Pflicht)

- **Nuxt 4 / Vue 3 SSR.** App-Code unter `app/` (`~` = `app/`, `~~` = Projekt-Root für
  `server/`-Importe).
- **`new URL(...)`/`new Date()` NIE direkt im Template** → in `computed`/Script auslagern
  (sonst `_ctx.URL is not a constructor`).
- **Hydration-Stabilität:**
  - Relative Zeiten (`Date.now()`) tragen `data-allow-mismatch` am Element.
  - Origin/Host via `useRequestURL()` (SSR+Client identisch), nicht `window.location`.
- **Icons:** `@nuxt/icon` v2 (Nuxt 4) + lokal gebündelte `@iconify-json/lucide`
  (`icon.serverBundle.collections: ['lucide']`) → offline, kein CDN.
- **Config-/Modul-Änderungen** erfordern Dev-Server-Neustart (kein HMR dafür).

---

## 14. Out of Scope (aktuell) / mögliche Erweiterungen

- Authentifizierung fürs Dashboard (derzeit keine) — empfohlen vor Deployment.
- Bearbeiten bestehender Traps (nur anlegen/löschen vorhanden).
- Dark-Mode-Variante (das Theme ist bewusst hell; ein Dark-Pendant wäre additiv).
- Karten-/Geo-Visualisierung der Treffer, CSV/JSON-Export, Charts.

---

## 15. Akzeptanzkriterien (Definition of Done)

- [ ] Alle Tokens aus §4 als CSS-Variablen vorhanden und genutzt (keine Hardcodes daneben).
- [ ] Fraunces/Figtree/Space Mono geladen; korrekte Zuordnung pro Element (§4.2).
- [ ] Keine Emojis; alle Icons via `lucide:` gemäß Mapping (§5).
- [ ] Drei Seiten (§8) inkl. aller States (empty/hover/focus/disabled/loading) umgesetzt.
- [ ] Custom-Builder mit funktionierender Live-Vorschau.
- [ ] Responsive-Regeln (§10) greifen; keine Layout-Brüche ≤360px.
- [ ] Fokus-Ringe sichtbar; `prefers-reduced-motion` respektiert.
- [ ] Keine Hydration-Warnungen/`constructor`-Fehler in der Konsole.
