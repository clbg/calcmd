import React from 'react';

const FEATURES = [
  {
    icon: '🔍',
    title: 'Verifiable',
    desc: 'Formulas are embedded in plain text. Anyone can check the math — no spreadsheet required.',
  },
  {
    icon: '🤖',
    title: 'AI-friendly',
    desc: 'Column-name formulas like Total=Qty*Price are easy for LLMs to generate and validate.',
  },
  {
    icon: '📝',
    title: 'Human-readable',
    desc: 'No A1 cell references. Formulas read like plain English and degrade gracefully in any markdown viewer.',
  },
  {
    icon: '🌿',
    title: 'Git-friendly',
    desc: 'Plain text format. Formula changes show up cleanly in diffs. Works everywhere markdown works.',
  },
  {
    icon: '🔒',
    title: 'Secure',
    desc: 'Whitelist-only functions, sandboxed evaluation. No scripting, no file access, no surprises.',
  },
  {
    icon: '⚡',
    title: 'Lightweight',
    desc: 'Not a spreadsheet. Not a notebook. Just tables with formulas — simple by design.',
  },
];

export default function Features() {
  return (
    <section id="features" style={{ maxWidth: 860, margin: '0 auto', padding: '3rem 2rem' }}>
      <h2
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.5rem',
          fontWeight: 700,
          marginBottom: '0.5rem',
        }}
      >
        Why CalcMD?
      </h2>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
        AI assistants generate tables with numbers every day. CalcMD makes those numbers
        trustworthy.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        {FEATURES.map((f) => (
          <div
            key={f.title}
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              transition: 'border-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{f.icon}</div>
            <div style={{ fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.95rem' }}>
              {f.title}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
