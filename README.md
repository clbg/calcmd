# CalcMD — Verifiable Tables for the AI Era

CalcMD is an open specification that extends markdown tables with embedded formulas, making AI-generated calculations transparent, checkable, and Git-friendly.

Formulas use human-readable column names like `Total=Qty*Price` instead of cell references. They degrade gracefully in any standard markdown viewer and diff cleanly in Git.

```
| Item   | Qty | Price | Total=Qty*Price |
|--------|-----|-------|-----------------|
| Apple  | 3   | 1.50  | 4.50            |
| Banana | 5   | 0.80  | 4.00            |
| **Sum**|     |       | **8.50=sum(Total)** |
```

## 🌐 Live Demo

Try it in the browser: **[clbg.github.io/calcmd](https://clbg.github.io/calcmd/)**

## Documentation

- [Specification (v0.1)](docs/04-Spec.md)
- [Examples](docs/05-Examples.md)
- [Vision](docs/01-Vision.md)
- [Roadmap](docs/06-Roadmap.md)

## Getting Started

The proof-of-concept lives in `poc/`. See [poc/QUICKSTART.md](poc/QUICKSTART.md) for setup instructions.

```bash
cd poc
pnpm install
pnpm test        # run core tests
pnpm dev         # start playground
```

## License

CalcMD is an open specification released under [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
