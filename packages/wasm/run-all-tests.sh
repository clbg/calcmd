#!/bin/bash
# Run all WASM tests

set -e

echo "=================================="
echo "CalcMD WASM - Running All Tests"
echo "=================================="
echo ""

# Build first
echo "Building WASM module..."
pnpm run build
echo ""

# Run Rust basic tests
echo "1. Running Rust basic tests..."
node tests/rust-basic.test.mjs
echo ""

echo "=================================="
echo "✅ All test suites passed!"
echo "=================================="
