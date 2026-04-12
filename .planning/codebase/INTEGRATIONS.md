# External Integrations

**Analysis Date:** 2026-04-13

## APIs & External Services

**None detected** - This is a fully client-side application with no external API calls.

**Static Content Loading:**
- Cases data: Fetches `/cases.json` via standard `fetch()` API (browser Fetch API). Location: `src/main.ts` line 52, `src/data/cases.ts`
- Google Fonts: Loads fonts via Google Fonts CDN in `index.html` (Fraunces, Noto Sans, DM Mono)

## Data Storage

**Databases:**
- None. The application is stateless.

**File Storage:**
- Local filesystem only
- Static data served from `public/cases.json`
- Client-side state management only (no persistence)

**Caching:**
- Browser standard HTTP caching (configured by web server/Vercel)
- No persistent storage (localStorage, sessionStorage not used)

## Authentication & Identity

**Auth Provider:**
- None. No user authentication system.

**Access Control:**
- Public site - no access restrictions

## Monitoring & Observability

**Error Tracking:**
- None detected. Basic console logging present (`src/main.ts` lines 1, 299-312)

**Logs:**
- Browser console only
- Example: `[v3] main.ts module executing`, `[v3] boot() resolved`, `[v3 boot error]`

## CI/CD & Deployment

**Hosting:**
- Vercel
- Project: cosmo5-case-explorer
- Project ID: `prj_SwMBaoWZZaQ8zJ2ZL2ybxm1sMEVc`
- Org ID: `team_4HNjqecNMNgZkWXtckXG3QHf`

**Build Pipeline:**
- Vercel auto-detects Node.js project
- Build command (inferred): `npm run build` → runs `tsc && vite build`
- Output directory: `dist/`

**CI System:**
- None configured (git commits trigger Vercel auto-deployments)

## Environment Configuration

**Required env vars:**
- None

**Secrets location:**
- `.vercel/project.json` - Contains Vercel project metadata (not sensitive keys)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Third-Party Embeds

**Fonts:**
- Google Fonts (googleapis.com, fonts.gstatic.com)
  - Families: Fraunces (weights 300, 400 + italics), Noto Sans (weights 300-900), DM Mono (weights 300, 400)
  - Loaded in `index.html` with preconnect hints

## Code Dependencies Network

**Direct NPM packages:**
- three (Three.js)
- gsap (GSAP)
- d3 (D3)
- topojson-client (TopoJSON)

**Transitive dependencies:**
- Three.js includes OrbitControls (imported from `three/examples/jsm/controls/OrbitControls.js`)
- All others are leaf packages (no deep dependency chains observed)

## Browser APIs Used

**Window/DOM APIs:**
- `window.matchMedia()` - Reduced motion detection (`src/main.ts` line 15)
- `requestAnimationFrame()` - Animation loop
- `localStorage` - Not used
- `sessionStorage` - Not used
- `fetch()` - Data loading
- Event listeners: `pointerdown`, `pointermove`, `pointerup`, `keydown`, `click`, `input`, `resize`

**Graphics APIs:**
- WebGL (via Three.js WebGLRenderer)
- Canvas API (2D context for starfield background)

---

*Integration audit: 2026-04-13*
