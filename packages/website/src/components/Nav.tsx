import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Nav() {
  const location = useLocation();
  const isPlayground = location.pathname.includes('/playground');

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
      <Link to="/" style={{ textDecoration: 'none', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <img src={import.meta.env.BASE_URL + 'logo-icon.svg'} alt="CalcMD" style={{ height: 28 }} />
        Calc<span style={{ color: 'var(--accent)' }}>MD</span>
      </Link>
      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem' }}>
        {!isPlayground && (
          <>
            <a href="#syntax" style={{ color: 'var(--muted)' }}>Syntax</a>
            <a href="#features" style={{ color: 'var(--muted)' }}>Features</a>
            <a href="#demo" style={{ color: 'var(--muted)' }}>Demo</a>
          </>
        )}
        <Link to="/playground" style={{ color: isPlayground ? 'var(--accent)' : 'var(--muted)' }}>
          Playground
        </Link>
        <a href="https://github.com/clbg/calcmd" target="_blank" rel="noreferrer" style={{ color: 'var(--muted)' }}>
          GitHub
        </a>
      </div>
    </nav>
  );
}
