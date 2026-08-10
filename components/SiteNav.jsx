import Link from 'next/link';
import { useEffect, useState } from 'react';
import { loadGym } from '../lib/store';

export default function SiteNav({ active }) {
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    setStreak(loadGym().streak || 0);
  }, []);

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
          {tab('/gym', 'gym', '🔥 Daily Gym')}
          {tab('/lifepad', 'lifepad', '✨ LifePad')}
        </nav>
        <span className="nav-streak" title="Daily Gym streak">🔥 {streak} day{streak === 1 ? '' : 's'}</span>
      </div>
    </header>
  );
}
