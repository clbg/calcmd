import React, { useState, useCallback, useEffect } from 'react';
import { calcmd, ParsedTable } from '@calcmd/core';
import { Editor, Preview, EXAMPLES } from '@calcmd/ui';
import '../playground.css';

export default function PlaygroundPage() {
  const [markdown, setMarkdown] = useState(EXAMPLES[0].markdown);
  const [result, setResult] = useState<ParsedTable | null>(null);
  const [selectedCell, setSelectedCell] = useState<{row: number; col: number} | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback((value: string) => {
    setMarkdown(value);
    try {
      setResult(calcmd(value));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setResult(null);
    }
  }, []);

  const loadExample = useCallback((index: number) => {
    handleChange(EXAMPLES[index].markdown);
    setSelectedCell(null);
  }, [handleChange]);

  useEffect(() => { handleChange(markdown); }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)' }}>
      {/* Example buttons */}
      <div style={{
        padding: '0.6rem 1rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: '0.5rem' }}>
          Examples
        </span>
        {EXAMPLES.map((ex, i) => (
          <button key={i} onClick={() => loadExample(i)} style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--muted)',
            padding: '0.3rem 0.7rem',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: '0.8rem',
          }}>
            {ex.name}
          </button>
        ))}
      </div>

      {/* Editor + Preview split */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>
        {/* Editor pane */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)' }}>
            Editor
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Editor value={markdown} onChange={handleChange} />
          </div>
        </div>

        {/* Preview pane */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)' }}>
            Preview
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {error && (
              <div style={{
                background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)',
                color: 'var(--error)', padding: '0.75rem 1rem', margin: '0.75rem', borderRadius: 6, fontSize: '0.85rem',
              }}>
                {error}
              </div>
            )}
            {result && (
              <Preview table={result} selectedCell={selectedCell} onCellClick={(r, c) => setSelectedCell({ row: r, col: c })} />
            )}
            {result && result.errors.length > 0 && (
              <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Errors</div>
                {result.errors.map((e, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', color: 'var(--error)', fontFamily: '"SF Mono","Fira Code",monospace', padding: '0.3rem 0' }}>
                    {e.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
