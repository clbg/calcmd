import React, { useState, useEffect } from 'react';
import { calcmd, ParsedTable } from '@calcmd/core';
import { Preview } from '@calcmd/ui';

const DEFAULT_MARKDOWN = `| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| Ramen | 2 | 1500 | 3000 |
| Ticket | 1 | 200 | 200 |
| **Sum** | | | **3200=sum(Total)** |`;

export default function LiveDemo() {
  const [input, setInput] = useState(DEFAULT_MARKDOWN);
  const [result, setResult] = useState<ParsedTable | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  useEffect(() => {
    try {
      setResult(calcmd(input));
    } catch {
      setResult(null);
    }
  }, [input]);

  const label = (text: string) => (
    <div
      style={{
        fontSize: '0.75rem',
        color: 'var(--muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: '0.5rem',
      }}
    >
      {text}
    </div>
  );

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
          {label('Markdown input')}
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

        {/* Preview */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {label('Computed output')}
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
              <Preview
                table={result}
                selectedCell={selectedCell}
                onCellClick={(row, col) => setSelectedCell(row === -1 ? null : { row, col })}
              />
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
