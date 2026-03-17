import React from 'react';

export default function Nav() {
  return (
    <nav style={{
      borderBottom: '1px solid var(--border)',
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 56,
      position: 'sticky',
      top: 0,
      background: 'var(--bg)',
      zIndex: 10,
    }}>
      <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
        Calc<span style={{ color: 'var(--accent)' }}>MD</span>
      </span>
      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem' }}>
        <a href="#syntax" style={{ color: 'var(--muted)' }}>Syntax</a>
        <a href="#features" style={{ color: 'var(--muted)' }}>Features</a>
        <a href="#demo" style={{ color: 'var(--muted)' }}>Demo</a>
        <a href="https://github.com/clbg/calcmd" target="_blank" rel="noreferrer" style={{ color: 'var(--muted)' }}>GitHub</a>
      </div>
    </nav>
  );
}
