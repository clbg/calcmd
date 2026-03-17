# CalcMD - Product Overview

CalcMD (Calculated Markdown) is an open specification that extends markdown table syntax with embedded formulas, making calculated values verifiable and transparent — especially in AI-generated content.

## Core Problem

AI assistants frequently generate tables with calculated values, but users have no way to verify the math without manually checking or re-querying. CalcMD solves this by embedding human-readable formulas directly in the table.

## Syntax

Formulas appear in two places:

- Column headers: `| Total=Qty*Price |` — applies formula to every row in that column
- Individual cells: `| **300=sum(Amount)** |` — typically used for aggregations

## Key Design Principles

- Human-readable: formulas use column names, not A1 cell references
- AI-friendly: easy for LLMs to generate and validate
- Git-friendly: plain text, diffs cleanly
- Graceful degradation: renders as normal markdown without tools
- Secure: whitelist-only functions, sandboxed evaluation, no scripting

## Supported Formula Features

- Arithmetic: `+`, `-`, `*`, `/`, `%`, `()`
- Comparison: `==`, `!=`, `>`, `<`, `>=`, `<=`
- Logical: `and`, `or`, `not`
- Aggregations: `sum()`, `avg()`, `min()`, `max()`, `count()`
- Math: `round()`, `abs()`, `floor()`, `ceil()`
- Conditional: `if(condition, true_val, false_val)`
- Row labels: `@label` for cross-row references

## Current State

This repo contains the CalcMD specification documents and a proof-of-concept (POC) implementation. The POC is not a production product — it demonstrates the concept and validates the spec.
