import React, { useState, useEffect } from 'react';
import { calcmd, ParsedTable } from '@calcmd/core';

const DEFAULT_MARKDOWN = `| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| Ramen | 2 | 1500 | 3000 |
| Ticket | 1 | 200 | 200 |
| **Sum** | | | **3200=sum(Total)** |`;

export default function LiveDemo() {
  const [input, setInput] = useState(DEFAULT_MARKDOWN);
  const [result, setResult] = useState<ParsedTable | null>(null);

  useEffect(() => {
    try {
      setResult(calcmd(input));
    } catch {
      setResult(null);
    }
  }, [input]);

  const tdStyle = (isFormula: boolean, isAgg: boolean): React.CSSProperties => ({
    padding: '0.6rem 1rem',
    textAlign: 'left',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap',
    fontFamily: '"SF Mono", "Fira Code", monospace',
    fontSize: '0.88rem',
    background: isAgg ? '#1c2d1f' : isFormula ? 'var(--formula-bg)' : undefined,
    color: isAgg ? 'var(--accent2)' : isFormula ? 'var(--accent)' : undefined,
    borderLeft: isAgg
      ? '2px solid var(--accent2)'
      : isFormula
        ? '2px solid var(--formula-border)'
        : undefined,
  });

  return (
    <section id="demo" style={{ maxWidth: 860, margin: '0 auto', padding: '3rem 2rem' }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Live demo</div>
      <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
        Edit the markdown below — the table updates in real time using <code>@calcmd/core</code>.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          alignItems: 'start',
        }}
      >
        {/* Editor */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.5rem',
            }}
          >
            Markdown input
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            style={{
              width: '100%',
              height: 240,
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '0.75rem 1rem',
              fontFamily: '"SF Mono", "Fira Code", monospace',
              fontSize: '0.82rem',
              lineHeight: 1.6,
              resize: 'vertical',
              outline: 'none',
              overflowY: 'auto',
            }}
          />
        </div>

        {/* Rendered table */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.5rem',
            }}
          >
            Computed output
          </div>
          {result ? (
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                overflow: 'auto',
                maxHeight: 240,
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {result.columns.map((col, i) => (
                      <th
                        key={i}
                        style={{
                          padding: '0.6rem 1rem',
                          textAlign: 'left',
                          borderBottom: '1px solid var(--border)',
                          background: '#1c2128',
                          fontWeight: 500,
                          color: col.formula ? 'var(--accent)' : 'var(--muted)',
                          fontFamily: '"SF Mono", "Fira Code", monospace',
                          fontSize: '0.85rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {col.formula ? `${col.name}=${col.formula}` : col.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, ri) => (
                    <tr key={ri}>
                      {row.cells.map((cell, ci) => {
                        const isFormula = !!cell.formula;
                        const isAgg = isFormula && /sum|avg|min|max|count/.test(cell.formula ?? '');
                        const display = cell.error
                          ? '#ERROR'
                          : cell.computed !== undefined
                            ? String(cell.computed)
                            : String(cell.value ?? '');
                        return (
                          <td
                            key={ci}
                            style={tdStyle(isFormula && !isAgg, isAgg)}
                            title={cell.formula ?? undefined}
                          >
                            {display}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', padding: '1rem' }}>
              Parse error — check your markdown syntax.
            </div>
          )}
          {result && result.errors.length > 0 && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#f85149' }}>
              {result.errors.map((e, i) => (
                <div key={i}>{e.message}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
