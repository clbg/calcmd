import React from 'react';
import Hero from '../components/Hero';
import LiveDemo from '../components/LiveDemo';
import Features from '../components/Features';
import Syntax from '../components/Syntax';

export default function LandingPage() {
  return (
    <>
      <Hero />
      <LiveDemo />
      <Features />
      <Syntax />
      <footer style={{
        borderTop: '1px solid var(--border)',
        textAlign: 'center',
        padding: '2rem',
        color: 'var(--muted)',
        fontSize: '0.85rem',
      }}>
        CalcMD is an open specification released under{' '}
        <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer" style={{ color: 'var(--muted)' }}>CC0</a>
        {' '}·{' '}
        <a href="https://github.com/clbg/calcmd" target="_blank" rel="noreferrer" style={{ color: 'var(--muted)' }}>GitHub</a>
      </footer>
    </>
  );
}
