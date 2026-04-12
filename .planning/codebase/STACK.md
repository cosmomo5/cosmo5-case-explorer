# Technology Stack

**Analysis Date:** 2026-04-13

## Languages

**Primary:**
- TypeScript 5.0+ - All application code in `src/`
- JavaScript - Build configuration, scripts

**Secondary:**
- Python 3 - Data conversion utility (`convert.py`)

## Runtime

**Environment:**
- Node.js (specified via TypeScript target ES2022)

**Package Manager:**
- npm 10+ (inferred from package-lock.json v3 format)
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Three.js 0.170.0 - 3D rendering engine for orbital visualization. Used throughout `src/scene/` and `src/main.ts`

**Animation:**
- GSAP 3.12.0 - Timeline-based animation library for orbital mechanics and UI transitions. Imported in `src/main.ts`, `src/scene/regroup.ts`, `src/scene/scene-state.ts`

**Data Visualization:**
- D3 7.9.0 - Included in dependencies but not observed in current source code. Likely reserved for future data transformation features
- TopoJSON Client 3.1.0 - Geospatial data utilities, included but not actively used in phase-1c

**Build/Dev:**
- Vite 6.0.0 - Fast build tool and dev server. Config: `vite.config.ts`
- TypeScript Compiler (tsc) - Pre-build step before Vite. Scripts: `build` runs `tsc && vite build`
- Vitest 2.0.0 - Unit test framework. Config embedded in `vite.config.ts`, environment set to `node`

**Controls:**
- Three.js OrbitControls - Camera interaction. Imported from `three/examples/jsm/controls/OrbitControls.js`

## Key Dependencies

**Critical:**
- `three` ^0.170.0 - Core 3D engine. Provides Scene, PerspectiveCamera, WebGLRenderer, Raycaster, Vector2, Vector3, BufferGeometry, Points, Mesh, Material classes
- `gsap` ^3.12.0 - Animation timeline. Used for count-up animations (`gsap.to()`), orbital transitions, focus animations

**Visualization:**
- `d3` ^7.9.0 - Reserved for advanced data visualization (not currently active)
- `topojson-client` ^3.1.0 - Geospatial topology (not currently active)

## Development Dependencies

**Type Support:**
- `@types/three` ^0.170.0 - Three.js type definitions
- `@types/d3` ^7.4.0 - D3 type definitions
- `@types/topojson-client` ^3.1.4 - TopoJSON type definitions

**Quality Assurance:**
- `typescript` ^5.0.0 - Language compiler
- `vitest` ^2.0.0 - Test runner

## Configuration

**TypeScript:**
- File: `tsconfig.json`
- Target: ES2022
- Module system: ESNext
- Strict mode enabled
- No unused locals/parameters allowed
- JSON module resolution enabled
- Root directory: `src/`

**Vite:**
- File: `vite.config.ts`
- Cache directory: OS temp directory (`path.join(os.tmpdir(), 'vite-cosmo5')`) to support constrained filesystems
- Build target: ES2022
- Test environment: Node

**Build Scripts:**
```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "test": "vitest run"
}
```

## Platform Requirements

**Development:**
- Node.js with npm
- TypeScript 5.0+
- Modern browser with WebGL support (for local testing)
- Python 3 (only if running `convert.py` data conversion)

**Production:**
- Deployment: Vercel (configured via `.vercel/project.json` - project ID: `prj_SwMBaoWZZaQ8zJ2ZL2ybxm1sMEVc`)
- Browser requirements: WebGL-capable browsers (Chrome 26+, Firefox 25+, Safari 8+, Edge 12+)
- Static site serving (cases.json from `public/`)

## Data

**Static Data:**
- `cases.json` (153 KB) - Case study records served from `public/`. Structure defined in `src/data/types.ts` (CaseStudy interface). Contains fields: id, client, year, services, countries, region, permission, contributor_source, contributor_name, title, challenge, approach, metrics
- Data generation: `convert.py` converts source data to cases.json format

## Environment Configuration

**No environment variables required** - This is a static site with no backend services.

**Secrets location:**
- `.vercel/` folder contains project configuration (not committed, added to .gitignore)

---

*Stack analysis: 2026-04-13*
