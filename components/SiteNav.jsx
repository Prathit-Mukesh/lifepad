import Link from 'next/link';

export default function SiteNav({ active }) {
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
      </div>
    </header>
  );
}
