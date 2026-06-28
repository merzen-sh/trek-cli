# trek-cli — agents guide

## Dev commands (via `justfile`)

| command           | what                                                                     |
| ----------------- | ------------------------------------------------------------------------ |
| `just dev`        | `cargo run -p trek --features swagger` (port 8080, proxies Vite on 5173) |
| `just fmt`        | `cargo fmt` then `pnpm oxfmt .`                                          |
| `just check`      | `cargo check --workspace`                                                |
| `just next-test`  | `cargo nextest run --workspace` (preferred over `cargo test`)            |
| `just release`    | build-wasm → build-app → `cargo build -p trek --release`                 |
| `just build-wasm` | compile WASM + bindgen → `npm/trek-wasm-web/`                            |
| `just api-types`  | regenerate OpenAPI types from `packages/api-types/redocly.yaml`          |
| `just shear`      | `cargo shear --fix` (remove unused Rust deps)                            |

Per-package: `npm run build` inside `packages/app` runs `tsc -b && vite build`.

## Monorepo layout

Two workspaces sharing the root:

- **pnpm** `packages/*` and `npm/*` — TypeScript/React
- **Cargo** `crates/*` — Rust

### Rust crates

| crate             | type   | purpose                                              |
| ----------------- | ------ | ---------------------------------------------------- |
| `trek`            | binary | CLI + axum HTTP server (reverse proxy, static files) |
| `trek-css-parser` | rlib   | CSS theme parser/generator, color conversions        |
| `trek-wasm`       | cdylib | wasm-bindgen bindings → `@trek-cli/wasm`             |
| `trek-fxmanifest` | rlib   | FiveM fxmanifest.lua parser (lexer → parser → AST)   |

### npm packages

| package           | dir                   | purpose                                                  |
| ----------------- | --------------------- | -------------------------------------------------------- |
| `app`             | `packages/app/`       | React frontend (Vite + TanStack Router + TanStack Query) |
| `ui`              | `packages/ui/`        | shadcn-style UI component library (CVA, `cn` utility)    |
| `@trek/api-types` | `packages/api-types/` | OpenAPI generated types + manual external API types      |
| `@trek-cli/wasm`  | `npm/trek-wasm-web/`  | WASM bindings (generated, not committed as src)          |
| `@trek-cli/trek`  | `npm/trek-cli/`       | CLI binary npm wrapper (stub)                            |

## Build quirks

- **WASM must be built before the app** if WASM code changed → `just build-wasm` first
- `cargo build` alone does NOT compile the WASM crate for the web target (requires `wasm32-unknown-unknown` target + wasm-bindgen-cli)
- The Rust binary embeds `packages/app/dist/` at release time via `rust-embed`; `build.rs` panics if dist/ is missing
- In debug mode the CLI server proxies to `localhost:5173` (Vite); in release it serves the embedded dist/
- The CLI server proxies `/external/api/*path` → `{BASE_URL}/api/*path` (reads from `.env` or defaults to `http://localhost:3000`)

## TS/React conventions

- `verbatimModuleSyntax` → use `import type` / `export type` for type-only imports
- `erasableSyntaxOnly` → no `enum`, no `namespace`, no `parameter properties`
- `noUnusedLocals` + `noUnusedParameters` → remove unused imports/vars
- Components use `React.forwardRef` + `cn()` + CVA variants (see `packages/ui/` for patterns)
- Data fetching via TanStack Query with colocated files: `data/<name>/keys.ts` + `query.ts`
- Routes defined in `packages/app/src/router.tsx` using TanStack Router `createRoute` + `createRootRoute`
- Tailwind CSS 4 with `@tailwindcss/vite` plugin

## Rust conventions

- Edition 2024
- Common workspace deps in root `Cargo.toml`; per-crate overrides add features
- `#[serde(default)]` for backward-compatible config field additions
- `dotenvy::dotenv().ok()` pattern for optional `.env` loading (not required)

## Testing

- Rust: `cargo nextest run --workspace` (via `just next-test`) or `cargo test -p <crate>`
- Rust benchmarks: `cargo bench -p trek-fxmanifest`
- No JS/TS test framework is set up yet

## Adding shadcn components

`just shadcn <component-name>` — runs inside `packages/ui/`, adds to `packages/ui/src/components/ui/`.

## Key architecture notes

- The login flow: CLI creates challenge → opens browser → user authorizes → CLI polls+claims → session saved to `~/.config/trek/config.toml`
- The app uses `/external/api/orders` (relative, same origin) → CLI server proxies to upstream
- Theme editor uses WASM (parse_css / generate_css) loaded from `@trek-cli/wasm` with async `init()` call
- Color conversions use OKLCH internally; `srgb_to_oklch` uses the numerical inverse of `oklch_to_srgb` matrices (not the OKLab paper standard) for roundtrip consistency
- `trek-css-parser` is pure rlib (no wasm-bindgen); `trek-wasm` wraps it — this separation avoids duplicate WASM symbols
