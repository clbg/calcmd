import React, { useState, useCallback, useEffect } from 'react';
import { calcmd, ParsedTable } from '@calcmd/core';
import { Editor, Preview, EXAMPLES } from '@calcmd/ui';
import '../playground.css';

function getInitialMarkdown(): string {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('c');
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      // fall through to default
    }
  }
  return EXAMPLES[0].markdown;
}

export default function PlaygroundPage() {
  const [markdown, setMarkdown] = useState(getInitialMarkdown);
  const [result, setResult] = useState<ParsedTable | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');

  const handleChange = useCallback((value: string) => {
    setMarkdown(value);
    // Keep URL in sync — share link always reflects current content
    const params = new URLSearchParams();
    params.set('c', encodeURIComponent(value));
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    try {
      setResult(calcmd(value));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setResult(null);
    }
  }, []);

  const loadExample = useCallback(
    (index: number) => {
      handleChange(EXAMPLES[index].markdown);
      setSelectedCell(null);
    },
    [handleChange],
  );

  useEffect(() => {
    handleChange(markdown);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)' }}>
      {/* Example buttons */}
      <div
        style={{
          padding: '0.6rem 1rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginRight: '0.5rem',
          }}
        >
          Examples
        </span>
        {EXAMPLES.map((ex, i) => (
          <button
            key={i}
            onClick={() => loadExample(i)}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
              padding: '0.3rem 0.7rem',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            {ex.name}
          </button>
        ))}
      </div>

      {/* Mobile view toggle */}
      <div className="mobile-toggle">
        <button
          onClick={() => setMobileView('editor')}
          className={mobileView === 'editor' ? 'active' : ''}
        >
          Editor
        </button>
        <button
          onClick={() => setMobileView('preview')}
          className={mobileView === 'preview' ? 'active' : ''}
        >
          Preview
        </button>
      </div>

      {/* Editor + Preview split */}
      <div className="playground-split">
        {/* Editor pane */}
        <div className={`editor-pane ${mobileView === 'editor' ? 'mobile-active' : ''}`}>
          <div className="pane-label">Editor</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Editor
              value={markdown}
              onChange={handleChange}
              parsedTable={result ?? undefined}
              onShare={() =>
                navigator.clipboard.writeText(window.location.href).then(
                  () => true,
                  () => false,
                )
              }
            />
          </div>
        </div>

        {/* Preview pane */}
        <div className={`preview-pane ${mobileView === 'preview' ? 'mobile-active' : ''}`}>
          <div className="pane-label">Preview</div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {error && (
              <div
                style={{
                  background: 'rgba(248,81,73,0.1)',
                  border: '1px solid rgba(248,81,73,0.3)',
                  color: 'var(--error)',
                  padding: '0.75rem 1rem',
                  margin: '0.75rem',
                  borderRadius: 6,
                  fontSize: '0.85rem',
                }}
              >
                {error}
              </div>
            )}
            {result && (
              <Preview
                table={result}
                selectedCell={selectedCell}
                onCellClick={(r, c) => setSelectedCell(r < 0 || c < 0 ? null : { row: r, col: c })}
              />
            )}
            {result && result.errors.length > 0 && (
              <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)' }}>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '0.4rem',
                  }}
                >
                  Errors
                </div>
                {result.errors.map((e, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--error)',
                      fontFamily: '"SF Mono","Fira Code",monospace',
                      padding: '0.3rem 0',
                    }}
                  >
                    {e.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .mobile-toggle {
          display: none;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
        }
        
        .mobile-toggle button {
          flex: 1;
          padding: 0.75rem;
          background: transparent;
          border: none;
          color: var(--muted);
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
          border-bottom: 2px solid transparent;
        }
        
        .mobile-toggle button.active {
          color: var(--accent);
          border-bottom-color: var(--accent);
        }
        
        .playground-split {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          overflow: hidden;
        }
        
        .editor-pane,
        .preview-pane {
          display: flex;
          flex-direction: 'column';
          overflow: hidden;
        }
        
        .editor-pane {
          border-right: 1px solid var(--border);
        }
        
        .pane-label {
          font-size: 0.75rem;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 0.6rem 1rem;
          border-bottom: 1px solid var(--border);
        }
        
        @media (max-width: 768px) {
          .mobile-toggle {
            display: flex;
          }
          
          .playground-split {
            grid-template-columns: 1fr;
          }
          
          .editor-pane,
          .preview-pane {
            display: none;
          }
          
          .editor-pane.mobile-active,
          .preview-pane.mobile-active {
            display: flex;
          }
          
          .editor-pane {
            border-right: none;
          }
          
          .pane-label {
            display: none;
          }
        }
        
        @media (max-width: 480px) {
          .playground-split {
            height: calc(100vh - 48px - 48px - 48px);
          }
        }
      `}</style>
    </div>
  );
}
