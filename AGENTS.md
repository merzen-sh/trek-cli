# trek-cli — agents guide

## Dev commands (via `justfile`)

| command                   | what                                                                  |
| ------------------------- | --------------------------------------------------------------------- |
| `just dev`                | `cargo run -p trek --features swagger` (port 8080, proxies Vite 5173) |
| `just fmt`                | `cargo fmt` then `pnpm oxfmt .`                                       |
| `just check`              | `cargo check --workspace`                                             |
| `just next-test`          | `cargo nextest run --workspace` (preferred over `cargo test`)         |
| `just release`            | `cargo build -p trek --release --features release-embed`              |
| `just build-wasm`         | compile + bindgen → `packages/wasm-web/`                              |
| `just compile-wasm`       | `cargo build -p trek-wasm --target wasm32-unknown-unknown --release`  |
| `just bindgen-wasm`       | `wasm-bindgen` → `packages/wasm-web/`                                 |
| `just install-wasm-tools` | installs `wasm32-unknown-unknown` target + `wasm-bindgen-cli` 0.2.121 |
| `just api-types`          | boots server on :9090 → `openapi-typescript` → kills server + fmt     |
| `just shear`              | `cargo shear --fix` (remove unused Rust deps)                         |
| `just shadcn <name>`      | adds shadcn component to `packages/ui/src/components/ui/`             |
| `just build-app`          | `pnpm build` in `packages/app`                                        |

Per-package `pnpm run dev` in `packages/app` runs Vite on :5173.  
`pnpm run build` in `packages/app` runs `tsc -b && vite build && node ../../scripts/inject-app-version.js`.

## Monorepo layout

Two workspaces sharing the root — **Cargo** (`crates/*`) and **pnpm** (`packages/*`).

### Rust crates

| crate                | type   | purpose                                                 |
| -------------------- | ------ | ------------------------------------------------------- |
| `trek`               | binary | CLI + axum HTTP server (reverse proxy, static files)    |
| `trek-log`           | rlib   | ANSI-colored stderr logging macros (`log_error!`, etc.) |
| `trek-configuration` | rlib   | TOML-based user config at `~/.config/trek/config.toml`  |
| `trek-scripts`       | rlib   | workspace fxmanifest.lua scanning and management        |
| `trek-fxmanifest`    | rlib   | FiveM fxmanifest.lua parser (lexer → parser → AST)      |
| `trek-wasm`          | cdylib | wasm-bindgen bindings → `@trek-cli/wasm`                |

### npm packages

| package           | dir                   | purpose                                                    |
| ----------------- | --------------------- | ---------------------------------------------------------- |
| `app`             | `packages/app/`       | React frontend (Vite 8 + TanStack Router + TanStack Query) |
| `ui`              | `packages/ui/`        | shadcn-style UI component library (CVA, `cn` utility)      |
| `@trek/api-types` | `packages/api-types/` | OpenAPI generated types + manual external API types        |
| `@trek-cli/wasm`  | `packages/wasm-web/`  | WASM bindings (generated, not committed as ts source)      |

## Build quirks

- **WASM must be built before the app** if WASM code changed → `just build-wasm` first
- `cargo build` alone does NOT compile `trek-wasm` for the web target (needs `wasm32-unknown-unknown` + `wasm-bindgen-cli`)
- The Rust binary embeds `packages/app/dist/` at release via `rust-embed`; `build.rs` panics if dist/ is missing
- In debug mode the CLI server proxies to `localhost:5173` (Vite); in release it serves the embedded dist/
- CLI server proxies `/external/api/*path` → `{BASE_URL}/api/*path` (reads `.env` or defaults to `http://localhost:3000`)
- `just release` does NOT include `build-wasm`/`build-app` — run those separately if needed
- `just api-types` boots the server on a temporary port 9090 to serve swagger, then kills it
- `release-embed` feature is required for release builds (enables `rust-embed/compression`)
- `trek-wasm/src/lib.rs` is currently empty (placeholder); the generated `.wasm`/`.js` in `packages/wasm-web/` may be stale
- `pnpm-workspace.yaml` lists `./npm/*` but that directory does not exist (harmless)

## TS/React conventions

- `verbatimModuleSyntax` → use `import type` / `export type` for type-only imports
- `erasableSyntaxOnly` → no `enum`, no `namespace`, no `parameter properties`
- `noUnusedLocals` + `noUnusedParameters` — remove unused imports/vars
- Components use `React.forwardRef` + `cn()` + CVA variants (see `packages/ui/` for patterns)
- All imports use `~/` prefix alias mapping to `src/` (e.g. `import { foo } from "~/lib/api"`)
- Routes defined in `packages/app/src/router.tsx` using TanStack Router `createRoute` + `createRootRoute`
- Tailwind CSS 4 with `@tailwindcss/vite` plugin
- State management: `zustand` for stores, `zod` for validation
- Typed API client via `openapi-fetch` against the CLI proxy; `apiFetch()` for endpoints not in OpenAPI spec
- React Compiler via `babel-plugin-react-compiler` + `@rolldown/plugin-babel`

### Data layer pattern

Every data domain lives in `packages/app/src/data/<name>/` with four files:

| file       | purpose                                                                                |
| ---------- | -------------------------------------------------------------------------------------- |
| `api.ts`   | standalone typed fetch function using `client` or `apiFetch` from `~/lib/api`          |
| `keys.ts`  | TanStack Query key factory (`all`, `byScript`, etc.)                                   |
| `query.ts` | `queryOptions()` wrapping the api function, or `mutation.ts` with `useMutation()` hook |
| `index.ts` | barrel re-export of all public symbols                                                 |

Consumers import only from the barrel: `import { getScriptsQuery } from "~/data/getScripts"`.

**Adding a new endpoint:** create `api.ts` with a function that calls `client.GET/POST(...)` (typed via openapi-fetch) or `apiFetch(...)` (for non-OpenAPI routes), then `query.ts` wraps it in `queryOptions({ queryKey, queryFn })`.

## Rust conventions

- Edition 2024
- Common workspace deps in root `Cargo.toml`; per-crate overrides add features
- `#[serde(default)]` for backward-compatible config field additions
- `dotenvy::dotenv().ok()` for optional `.env` loading (not required)
- `trek-fxmanifest` has optional `serialize` feature (serde derive); used by `trek-scripts`

### Adding a new API endpoint

1. Create handler in `crates/trek/src/api/<name>_api.rs` with `#[cfg_attr(feature = "swagger", utoipa::path(...))]` annotation
2. Register the route in `crates/trek/src/server/router.rs` via `route("/api/...", get/post(...))`
3. Add handler to the `#[openapi(paths(...))]` list in the `ApiDoc` struct (same file)
4. Declare the module in `crates/trek/src/api/mod.rs`
5. Run `just api-types` to regenerate TypeScript types

## Testing

- Rust: `cargo nextest run --workspace` (via `just next-test`) or `cargo test -p <crate>`
- Rust benchmarks: `cargo bench -p trek-fxmanifest`
- No JS/TS test framework set up yet
- No CI workflows configured

## Key architecture notes

- Login flow: CLI creates challenge → opens browser → user authorizes → CLI polls+claims → session saved to ~/.config/trek/config.toml
- App uses `/external/api/orders` (relative, same origin) → CLI server proxies to upstream
- Scripts: `trek-scripts` scans workspace subdirs for `fxmanifest.lua` and parses them via `trek-fxmanifest`
- Color conversions use `colorgrad` crate directly (no separate CSS parser crate in the workspace)
