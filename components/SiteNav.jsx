import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const THEMES = [
  { id: 'classic', name: 'Marigold', dot: 'linear-gradient(135deg,#F4B217,#E1595C)' },
  { id: 'ocean', name: 'Ocean', dot: 'linear-gradient(135deg,#35A7DA,#2C7DA0)' },
  { id: 'forest', name: 'Forest', dot: 'linear-gradient(135deg,#6BAF4F,#2E5C1F)' },
  { id: 'blossom', name: 'Blossom', dot: 'linear-gradient(135deg,#E86FA4,#C2447A)' },
  { id: 'midnight', name: 'Midnight', dot: 'linear-gradient(135deg,#2A2E44,#12141F)' },
];

export const applyTheme = (id) => {
  if (typeof document === 'undefined') return;
  if (id && id !== 'classic') document.documentElement.dataset.theme = id;
  else delete document.documentElement.dataset.theme;
};

export default function SiteNav({ active }) {
  const [theme, setTheme] = useState('classic');
  const [open, setOpen] = useState(false);
  const popRef = useRef(null);

  useEffect(() => {
    let saved = 'classic';
    try { saved = localStorage.getItem('neev_theme') || 'classic'; } catch { /* blocked */ }
    setTheme(saved);
    applyTheme(saved);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (popRef.current && !popRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  const pick = (id) => {
    setTheme(id);
    applyTheme(id);
    try { localStorage.setItem('neev_theme', id); } catch { /* blocked */ }
    setOpen(false);
  };

  const tab = (href, key, label) => (
    <Link href={href} className={`nav-tab${active === key ? ' active' : ''}`}>{label}</Link>
  );

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="brand" aria-label="NEEV home">
          <span className="brand-name">NEEV</span>
          <span className="brand-dev">नींव</span>
        </Link>
        <nav className="nav-tabs" aria-label="Main">
          {tab('/learn', 'learn', '📚 Learn')}
          {tab('/gym', 'gym', '🧠 Prajnify')}
          {tab('/games', 'games', '🎮 Games')}
          {tab('/lifepad', 'lifepad', '✨ LifePad')}
        </nav>
        <div className="theme-wrap" ref={popRef}>
          <button className="theme-btn" aria-label="Choose colour theme" title="Colour theme" onClick={() => setOpen(!open)}>🎨</button>
          {open && (
            <div className="theme-pop">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  className={`theme-dot${theme === t.id ? ' on' : ''}`}
                  style={{ background: t.dot }}
                  aria-label={t.name}
                  onClick={() => pick(t.id)}
                >
                  <span>{t.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
