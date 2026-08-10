import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import SiteNav from '../components/SiteNav'
import { GROUPS, TOTAL_CHAPTERS, QUESTIONS_PER_CHAPTER } from '../lib/curriculum'
import { loadGym, loadLearn, levelFromXp } from '../lib/store'

export default function HomePage() {
  const [stats, setStats] = useState({ chaptersDone: 0, streak: 0, level: 1 })

  useEffect(() => {
    const learn = loadLearn()
    let done = 0
    for (const g of GROUPS) {
      const gp = learn[g.id] || {}
      done += Object.keys(gp).filter((k) => k !== 'lastGroup' && gp[k] && gp[k].total).length
    }
    const gym = loadGym()
    setStats({ chaptersDone: done, streak: gym.streak || 0, level: levelFromXp(gym.xp) })
  }, [])

  return (
    <>
      <Head>
        <title>NEEV — Skills that never expire</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <SiteNav active="home" />

      <section className="hero">
        <div className="hero-inner fade-in">
          <div className="eyebrow">Learn · Train · Organise <span className="dot">·</span> For every age</div>
          <h1 className="hero-title">Stay sharp in a world where <mark>tools keep changing</mark>.</h1>
          <p className="hero-sub">
            Apps expire. Syllabi get rewritten. AI rewrites job descriptions yearly.
            What compounds is the ability to think clearly, handle numbers, judge evidence,
            and keep learning — at any age. NEEV trains exactly that: structured chapters for
            your stage of life, a daily cognitive gym that serves a fresh workout every single day,
            and LifePad to run the rest of your life.
          </p>
          <div className="hero-note">school student, college, working or at home — your path is here ↷</div>
          <br />
          <Link href="/learn"><button className="hero-cta">Start learning ↓</button></Link>{' '}
          <Link href="/gym"><button className="hero-cta gold" style={{ marginLeft: 10 }}>Today&apos;s workout 🔥</button></Link>
        </div>
      </section>

      <section className="strip">
        <div className="strip-grid">
          <div className="strip-item"><h3>Tools expire</h3><p>The hot app of Class 6 is forgotten by Class 12. Software versions die. Chasing tools alone is running on a treadmill.</p></div>
          <div className="strip-item"><h3>Foundations compound</h3><p>Clear thinking, estimation, evidence, communication, money sense — every year of use makes them stronger, and they transfer to whatever comes next.</p></div>
          <div className="strip-item"><h3>Minds need reps</h3><p>Like muscles, cognition keeps its edge through daily use. Ten focused minutes a day beats a heroic burst once a month.</p></div>
        </div>
      </section>

      <section className="section" id="pillars">
        <div className="section-head">
          <h2>One home, three rooms</h2>
          <span className="count">
            {stats.chaptersDone > 0 || stats.streak > 0
              ? `You: ${stats.chaptersDone} chapters done · 🔥 ${stats.streak}-day streak · Gym level ${stats.level}`
              : `${TOTAL_CHAPTERS} chapters · ${TOTAL_CHAPTERS * QUESTIONS_PER_CHAPTER}+ questions · a new workout daily`}
          </span>
        </div>
        <div className="pillars">
          <Link href="/learn" className="pillar">
            <span className="p-chip" style={{ background: '#12777B' }}>📚</span>
            <span className="p-meta">Structured curriculum</span>
            <h3>Learn</h3>
            <p>
              Ten learning paths — Class 6 through 12, College, Working and Non-Working Adults —
              each with 15–18 chapters and {QUESTIONS_PER_CHAPTER} questions per chapter.
              Every answer comes with the reasoning, because mistakes are data.
            </p>
            <span className="p-go">Pick your path →</span>
          </Link>
          <Link href="/gym" className="pillar">
            <span className="p-chip" style={{ background: '#E1595C' }}>🔥</span>
            <span className="p-meta">A new set every day</span>
            <h3>Daily Gym</h3>
            <p>
              Five quick game rounds — speed math, memory matrix, focus filter, pattern hunt
              and the odd one out. The set evolves every single day. Keep the streak alive,
              earn XP, level up, collect badges.
            </p>
            <span className="p-go">Today&apos;s workout →</span>
          </Link>
          <Link href="/lifepad" className="pillar">
            <span className="p-chip" style={{ background: '#7C6AFF' }}>✨</span>
            <span className="p-meta">Your personal dashboard</span>
            <h3>LifePad</h3>
            <p>
              Tasks, expenses, notes, reminders, collections, habits, moods and holidays —
              your whole life organised in one private place on your device.
            </p>
            <span className="p-go">Open LifePad →</span>
          </Link>
        </div>
      </section>

      <section className="section tight">
        <div className="section-head">
          <h2>Who is NEEV for?</h2>
          <span className="count">everyone with a brain worth keeping sharp</span>
        </div>
        <div className="strip-grid">
          <div className="strip-item"><h3>Class 6–12</h3><p>Foundation maths, reasoning and word power, tuned per class — plus the digital wisdom school doesn&apos;t teach.</p></div>
          <div className="strip-item"><h3>College students</h3><p>Placement-grade aptitude, guesstimates, interview communication, and first-salary money sense.</p></div>
          <div className="strip-item"><h3>Working adults</h3><p>Decision-making, workplace judgment, AI-era career strategy, and a mental-math engine kept warm.</p></div>
          <div className="strip-item"><h3>Non-working adults</h3><p>Scam shields, digital confidence, household maths, and brain teasers that keep the mind young.</p></div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="fm">NEEV · Skills that never expire</div>
        <div>Learn for your stage · Train every day · Organise your life</div>
        <div style={{ marginTop: 6 }}>A Create-from-India project 🇮🇳 · Everything stays on your device</div>
      </footer>
    </>
  )
}
