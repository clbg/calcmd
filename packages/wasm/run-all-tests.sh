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

# Run unit tests
echo "1. Running unit tests..."
node tests/unit.test.mjs
echo ""

# Run comparison tests
echo "2. Running comparison tests..."
node tests/compare.test.mjs
echo ""

# Run core test suite
echo "3. Running core test suite..."
node tests/all-core-tests.mjs
echo ""

echo "=================================="
echo "✅ All test suites passed!"
echo "=================================="
