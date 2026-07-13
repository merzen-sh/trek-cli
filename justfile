default:
    @command -v fzf >/dev/null 2>&1 && just --choose || just --list

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
    SERVER_READY=false
    echo "Building server"
    cargo build -p trek --features swagger 2>&1
    echo "Starting server on port $PORT"
    cargo run -p trek --features swagger -- --port $PORT --browser false > /dev/null 2>&1 &

    SERVER_PID=$!
    echo "Waiting for server"

    for i in $(seq 1 30); do
        if curl -sf http://localhost:$PORT/api/health > /dev/null 2>&1; then
            SERVER_READY=true
            break
        fi
        echo -n "."
        sleep 0.5
    done

    echo ""

    if [ "$SERVER_READY" = false ]; then
        echo "Server not ready"
        echo "Cleaning up"
        kill $SERVER_PID 2>/dev/null || true
        wait $SERVER_PID 2>/dev/null || true
        exit 1
    fi

    echo "Generating api-types"
    (cd packages/api-types && pnpm run generate-api-types)
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
    echo "Formatting"
    pnpm exec oxfmt ./packages/api-types/src/types/api-types.d.ts

[working-directory("./packages/app")]
build-app:
    @pnpm build

release:
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
