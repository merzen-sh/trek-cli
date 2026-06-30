default:
    @just --list

dev:
    @cargo run -p trek --features swagger

fmt:
    @cargo fmt
    @pnpm oxfmt .

[working-directory("./packages/ui")]
shadcn component:
    @pnpm run shadcn add {{ component }} --yes

api-types:
    #!/usr/bin/env bash
    set -euo pipefail
    PORT=9090
    cargo run -p trek --features swagger -- --port $PORT &
    SERVER_PID=$!
    for i in $(seq 1 30); do
        if curl -sf http://localhost:$PORT/api/health > /dev/null 2>&1; then
            break
        fi
        sleep 0.5
    done
    (cd packages/api-types && pnpm run generate-api-types)
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
    just fmt

[working-directory("./packages/app")]
build-app:
    @pnpm build

release: build-app
    @cargo build -p trek --release --features release-embed

check:
    @cargo check --workspace

install-wasm-tools:
    rustup target add wasm32-unknown-unknown
    cargo install wasm-bindgen-cli --version 0.2.121

compile-wasm:
    cargo build -p trek-wasm --target wasm32-unknown-unknown --release

bindgen-wasm:
    wasm-bindgen target/wasm32-unknown-unknown/release/trek_wasm.wasm \
        --out-dir packages/wasm-web \
        --no-demangle \
        --target web \
        --typescript

build-wasm:
    just compile-wasm
    just bindgen-wasm

shear:
    @cargo shear --fix

next-test:
	cargo nextest run --workspace
