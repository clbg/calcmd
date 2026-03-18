import React from 'react';

export default function Hero() {
  return (
    <section style={{ maxWidth: 860, margin: '0 auto', padding: '5rem 2rem 3rem', textAlign: 'center' }}>
      <div style={{
        display: 'inline-block',
        background: 'var(--formula-bg)',
        border: '1px solid var(--formula-border)',
        color: 'var(--accent)',
        fontSize: '0.75rem',
        padding: '0.25rem 0.75rem',
        borderRadius: 999,
        marginBottom: '1.5rem',
        letterSpacing: '0.05em',
      }}>
        Open Specification · v0.1 Draft
      </div>

      <h1 style={{
        fontSize: 'clamp(2rem, 5vw, 3.2rem)',
        fontWeight: 800,
        lineHeight: 1.15,
        marginBottom: '1.25rem',
        letterSpacing: '-0.02em',
      }}>
        Verifiable tables for<br />
        <span style={{ color: 'var(--accent)' }}>the AI era</span>
      </h1>

      <p style={{ fontSize: '1.15rem', color: 'var(--muted)', maxWidth: 580, margin: '0 auto 2.5rem' }}>
        CalcMD extends markdown tables with embedded formulas —
        making AI-generated calculations transparent, checkable, and Git-friendly.
      </p>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <a href="https://github.com/clbg/calcmd" target="_blank" rel="noreferrer" style={{
          padding: '0.65rem 1.5rem', borderRadius: 6, fontSize: '0.95rem', fontWeight: 600,
          background: 'var(--accent)', color: '#0d1117', textDecoration: 'none',
        }}>
          View on GitHub
        </a>
        <a href="#demo" style={{
          padding: '0.65rem 1.5rem', borderRadius: 6, fontSize: '0.95rem', fontWeight: 600,
          background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)',
          textDecoration: 'none',
        }}>
          Try the demo
        </a>
      </div>
    </section>
  );
}
