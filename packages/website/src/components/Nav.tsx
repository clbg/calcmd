import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Nav() {
  const location = useLocation();
  const isPlayground = location.pathname.includes('/playground');

  return (
    <nav
      style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        position: 'sticky',
        top: 0,
        background: 'var(--bg)',
        zIndex: 10,
      }}
    >
      <Link
        to="/"
        style={{
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: '1.1rem',
          color: 'var(--text)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontFamily: 'var(--font-heading)',
        }}
      >
        <img src={import.meta.env.BASE_URL + 'logo-icon.svg'} alt="CalcMD" style={{ height: 28 }} />
        <span className="nav-title">
          Calc<span style={{ color: 'var(--accent)' }}>MD</span>
        </span>
      </Link>
      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', flexWrap: 'wrap' }}>
        {!isPlayground && (
          <>
            <a href="#syntax" style={{ color: 'var(--muted)' }} className="nav-link">
              Syntax
            </a>
            <a href="#features" style={{ color: 'var(--muted)' }} className="nav-link">
              Features
            </a>
            <a href="#demo" style={{ color: 'var(--muted)' }} className="nav-link">
              Demo
            </a>
          </>
        )}
        <Link
          to="/playground"
          style={{ color: isPlayground ? 'var(--accent)' : 'var(--muted)' }}
          className="nav-link"
        >
          Playground
        </Link>
        <a
          href="https://github.com/clbg/calcmd"
          target="_blank"
          rel="noreferrer"
          style={{ color: 'var(--muted)' }}
          className="nav-link"
        >
          GitHub
        </a>
      </div>
      <style>{`
        .nav-link {
          transition: color 0.15s ease;
        }
        .nav-link:hover {
          color: var(--accent) !important;
          text-decoration: none;
        }
        @media (max-width: 768px) {
          nav {
            padding: 0 0.75rem !important;
            height: 48px !important;
          }
          .nav-title {
            font-size: 1rem !important;
          }
          .nav-link {
            font-size: 0.8rem !important;
          }
        }
        @media (max-width: 480px) {
          .nav-link:not([href*="playground"]):not([href*="github"]) {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
}
