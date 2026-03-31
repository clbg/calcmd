import React from 'react';

const codeStyle: React.CSSProperties = {
  background: 'var(--surface-raised)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: '1.25rem 1.5rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.85rem',
  overflowX: 'auto',
  lineHeight: 1.7,
};

export default function Syntax() {
  return (
    <section id="syntax" style={{ maxWidth: 860, margin: '0 auto', padding: '3rem 2rem' }}>
      <h2
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.5rem',
          fontWeight: 700,
          marginBottom: '0.5rem',
        }}
      >
        Syntax at a glance
      </h2>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
        Two places to put formulas. That's it.
      </p>

      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
        Column header formula — applies to every row
      </p>
      <div style={codeStyle}>
        <span style={{ color: 'var(--muted)' }}>| Item | Qty | Price | </span>
        <span style={{ color: 'var(--accent)' }}>Total=Qty*Price</span>
        <span style={{ color: 'var(--muted)' }}> |</span>
        <br />
        <span style={{ color: 'var(--muted)' }}>|------|-----|-------|-----------------|</span>
        <br />
        <span style={{ color: 'var(--muted)' }}>| Apple | 3 | 1.50 | </span>
        <span style={{ color: 'var(--accent)' }}>4.50</span>
        <span style={{ color: 'var(--muted)' }}> |</span>
        <br />
        <span style={{ color: 'var(--muted)' }}>| Banana | 5 | 0.80 | </span>
        <span style={{ color: 'var(--accent)' }}>4.00</span>
        <span style={{ color: 'var(--muted)' }}> |</span>
      </div>

      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '1.5rem 0 0.5rem' }}>
        Cell formula — typically used for aggregations
      </p>
      <div style={codeStyle}>
        <span style={{ color: 'var(--muted)' }}>
          | <strong>Total</strong> | | |{' '}
        </span>
        <span style={{ color: 'var(--accent2)' }}>
          <strong>8.50=sum(Total)</strong>
        </span>
        <span style={{ color: 'var(--muted)' }}> |</span>
      </div>

      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '1.5rem 0 0.5rem' }}>
        Supported functions
      </p>
      <div style={codeStyle}>
        <span style={{ color: 'var(--muted)' }}># Aggregations</span>
        <br />
        <span>sum(col) &nbsp; avg(col) &nbsp; min(col) &nbsp; max(col) &nbsp; count(col)</span>
        <br />
        <br />
        <span style={{ color: 'var(--muted)' }}># Math</span>
        <br />
        <span>round(n, d) &nbsp; abs(n) &nbsp; floor(n) &nbsp; ceil(n)</span>
        <br />
        <br />
        <span style={{ color: 'var(--muted)' }}># Conditional</span>
        <br />
        <span>{'if(Score>=90, "A", "B")'}</span>
      </div>
    </section>
  );
}
