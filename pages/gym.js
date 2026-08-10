import Head from 'next/head'
import { useCallback, useEffect, useRef, useState } from 'react'
import SiteNav from '../components/SiteNav'
import { makeRng, todaySeed } from '../lib/rng'
import { generate } from '../lib/generators'
import { loadGym, saveGym, levelFromXp, xpForLevel } from '../lib/store'

/* ---------------- daily workout definition ---------------- */

const ROUND_DEFS = [
  { id: 'speed', icon: '⚡', name: 'Speed Math', desc: '60 seconds. Answer as many as you can.', max: 12 },
  { id: 'memory', icon: '🧠', name: 'Memory Matrix', desc: 'Watch the tiles light up, then recall them.', max: 25 },
  { id: 'stroop', icon: '🎯', name: 'Focus Filter', desc: 'Tap the ink colour — not the word. 45 seconds.', max: 12 },
  { id: 'pattern', icon: '🔢', name: 'Pattern Hunt', desc: 'Crack the hidden rule in each series.', max: 8 },
  { id: 'odd', icon: '🃏', name: 'Odd One Out', desc: 'Spot what does not belong.', max: 8 },
]
const MAX_SCORE = ROUND_DEFS.reduce((n, r) => n + r.max, 0)

function buildSpeedItems(seed) {
  const rng = makeRng(`gym:${seed}:speed`)
  const topics = ['addsub', 'mult', 'bodmas', 'percent', 'powerroot', 'fraction']
  const items = []
  const seen = new Set()
  let guard = 0
  while (items.length < 12 && guard++ < 200) {
    const q = generate(rng.pick(topics), rng, rng.int(2, 4))
    if (q && !seen.has(q.q)) { seen.add(q.q); items.push(q) }
  }
  return items
}

function buildMemoryTrials(seed) {
  const rng = makeRng(`gym:${seed}:memory`)
  const sizes = [3, 4, 5, 6, 7] // lit cells per trial on a 4x4 grid
  return sizes.map((k) => ({ k, cells: rng.sample(Array.from({ length: 16 }, (_, i) => i), k) }))
}

const STROOP_COLORS = [
  { name: 'RED', hex: '#C0392B' },
  { name: 'BLUE', hex: '#2C4FA3' },
  { name: 'GREEN', hex: '#2E7D46' },
  { name: 'ORANGE', hex: '#B4530A' },
]
function buildStroopItems(seed) {
  const rng = makeRng(`gym:${seed}:stroop`)
  return Array.from({ length: 12 }, () => {
    const word = rng.pick(STROOP_COLORS)
    let ink = rng.pick(STROOP_COLORS)
    if (rng.bool(0.7)) { // mostly incongruent — that's the workout
      while (ink.name === word.name) ink = rng.pick(STROOP_COLORS)
    }
    return { word: word.name, ink }
  })
}

function buildPatternItems(seed) {
  const rng = makeRng(`gym:${seed}:pattern`)
  const items = []
  const seen = new Set()
  let guard = 0
  while (items.length < 8 && guard++ < 200) {
    const q = generate(rng.bool(0.7) ? 'series_number' : 'series_letter', rng, rng.int(3, 6))
    if (q && !seen.has(q.q)) { seen.add(q.q); items.push(q) }
  }
  return items
}

function buildOddItems(seed) {
  const rng = makeRng(`gym:${seed}:odd`)
  const items = []
  const seen = new Set()
  let guard = 0
  while (items.length < 8 && guard++ < 200) {
    const q = generate(rng.bool(0.6) ? 'odd_one' : 'analogy', rng, rng.int(3, 7))
    if (q && !seen.has(q.q)) { seen.add(q.q); items.push(q) }
  }
  return items
}

/* ---------------- shared MCQ round (speed / pattern / odd) ---------------- */

function McqRound({ def, items, timed, onDone }) {
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [chosen, setChosen] = useState(null)
  const [timeLeft, setTimeLeft] = useState(timed || 0)
  const doneRef = useRef(false)
  const scoreRef = useRef(0)

  const finish = useCallback((finalScore) => {
    if (doneRef.current) return
    doneRef.current = true
    onDone(finalScore)
  }, [onDone])

  useEffect(() => {
    if (!timed) return undefined
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) { clearInterval(t); finish(scoreRef.current); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [timed, finish])

  const item = items[idx]
  if (!item) return null

  const pick = (oi) => {
    if (chosen !== null) return
    setChosen(oi)
    const gained = oi === item.c ? 1 : 0
    const ns = score + gained
    setScore(ns)
    scoreRef.current = ns
    setTimeout(() => {
      setChosen(null)
      if (idx + 1 >= items.length) finish(ns)
      else setIdx(idx + 1)
    }, gained ? 350 : 900)
  }

  return (
    <div className="game-stage fade-in">
      <div className="game-head">
        <span className="g-title">{def.icon} {def.name}</span>
        <span className="g-score">{score} pts · Q{idx + 1}/{items.length}{timed ? ` · ${timeLeft}s` : ''}</span>
      </div>
      {timed ? <div className="timebar"><i style={{ width: `${(timeLeft / timed) * 100}%` }} /></div> : null}
      <div className={`big-q${item.q.length > 40 ? ' small' : ''}`}>{item.q}</div>
      <div className="answer-grid">
        {item.o.map((o, oi) => {
          let cls = 'answer-btn'
          if (chosen !== null) {
            if (oi === item.c) cls += ' correct'
            else if (oi === chosen) cls += ' wrong'
          }
          return (
            <button key={oi} className={cls} disabled={chosen !== null} onClick={() => pick(oi)}>{o}</button>
          )
        })}
      </div>
      <div className={`flash-feedback ${chosen === null ? '' : chosen === item.c ? 'good' : 'bad'}`}>
        {chosen === null ? '' : chosen === item.c ? 'correct!' : `answer: ${item.o[item.c]}`}
      </div>
    </div>
  )
}

/* ---------------- memory matrix round ---------------- */

function MemoryRound({ def, trials, onDone }) {
  const [trialIdx, setTrialIdx] = useState(0)
  const [phase, setPhase] = useState('show') // show | recall | feedback
  const [picked, setPicked] = useState([])
  const [score, setScore] = useState(0)

  const trial = trials[trialIdx]

  useEffect(() => {
    if (phase !== 'show') return undefined
    const t = setTimeout(() => { setPhase('recall'); setPicked([]) }, 1400 + trial.k * 180)
    return () => clearTimeout(t)
  }, [phase, trialIdx, trial.k])

  const tap = (i) => {
    if (phase !== 'recall' || picked.includes(i)) return
    const np = [...picked, i]
    setPicked(np)
    if (np.length >= trial.k) {
      const hits = np.filter((c) => trial.cells.includes(c)).length
      const ns = score + hits
      setScore(ns)
      setPhase('feedback')
      setTimeout(() => {
        if (trialIdx + 1 >= trials.length) onDone(ns)
        else { setTrialIdx(trialIdx + 1); setPhase('show') }
      }, 1100)
    }
  }

  return (
    <div className="game-stage fade-in">
      <div className="game-head">
        <span className="g-title">{def.icon} {def.name}</span>
        <span className="g-score">{score} pts · Round {trialIdx + 1}/{trials.length}</span>
      </div>
      <div className="stroop-hint">
        {phase === 'show' ? `Memorise the ${trial.k} golden tiles…`
          : phase === 'recall' ? `Tap the ${trial.k} tiles that were lit (${picked.length}/${trial.k})`
          : 'Checking…'}
      </div>
      <div className="memory-grid" style={{ gridTemplateColumns: 'repeat(4, auto)' }}>
        {Array.from({ length: 16 }, (_, i) => {
          let cls = 'mem-cell'
          if (phase === 'show' && trial.cells.includes(i)) cls += ' lit'
          if (phase === 'recall' && picked.includes(i)) cls += ' lit'
          if (phase === 'feedback') {
            if (picked.includes(i)) cls += trial.cells.includes(i) ? ' hit' : ' miss'
            else if (trial.cells.includes(i)) cls += ' lit'
          }
          return (
            <button
              key={i}
              className={cls}
              disabled={phase !== 'recall'}
              onClick={() => tap(i)}
              aria-label={`tile ${i + 1}`}
            />
          )
        })}
      </div>
      <div className="flash-feedback">{phase === 'feedback' ? 'green = right, red = slip' : ''}</div>
    </div>
  )
}

/* ---------------- stroop round ---------------- */

function StroopRound({ def, items, onDone }) {
  const TIME = 45
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [flash, setFlash] = useState(null)
  const [timeLeft, setTimeLeft] = useState(TIME)
  const doneRef = useRef(false)
  const scoreRef = useRef(0)

  const finish = useCallback((s) => {
    if (doneRef.current) return
    doneRef.current = true
    onDone(s)
  }, [onDone])

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) { clearInterval(t); finish(scoreRef.current); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [finish])

  const item = items[idx]
  if (!item) return null

  const pick = (name) => {
    if (flash) return
    const ok = name === item.ink.name
    const ns = score + (ok ? 1 : 0)
    setScore(ns)
    scoreRef.current = ns
    setFlash(ok ? 'good' : 'bad')
    setTimeout(() => {
      setFlash(null)
      if (idx + 1 >= items.length) finish(ns)
      else setIdx(idx + 1)
    }, ok ? 220 : 600)
  }

  return (
    <div className="game-stage fade-in">
      <div className="game-head">
        <span className="g-title">{def.icon} {def.name}</span>
        <span className="g-score">{score} pts · {idx + 1}/{items.length} · {timeLeft}s</span>
      </div>
      <div className="timebar"><i style={{ width: `${(timeLeft / TIME) * 100}%` }} /></div>
      <div className="stroop-hint">Tap the colour of the INK — ignore what the word says.</div>
      <div className="stroop-word" style={{ color: item.ink.hex }}>{item.word}</div>
      <div className="answer-grid">
        {STROOP_COLORS.map((c) => (
          <button key={c.name} className="answer-btn" style={{ borderColor: c.hex, color: c.hex }} onClick={() => pick(c.name)}>
            {c.name}
          </button>
        ))}
      </div>
      <div className={`flash-feedback ${flash || ''}`}>{flash === 'good' ? 'sharp!' : flash === 'bad' ? 'the word is the trap' : ''}</div>
    </div>
  )
}

/* ---------------- page ---------------- */

export default function GymPage() {
  const [gym, setGym] = useState(null)
  const [seed, setSeed] = useState(null)
  const [phase, setPhase] = useState('home') // home | playing | finished
  const [roundIdx, setRoundIdx] = useState(0)
  const [roundScores, setRoundScores] = useState([])
  const [content, setContent] = useState(null)
  const [earnedToday, setEarnedToday] = useState(false) // true = this run counts for XP/streak

  useEffect(() => {
    const g = loadGym()
    const s = todaySeed()
    setGym(g)
    setSeed(s)
  }, [])

  const playedToday = gym && seed && gym.history.some((h) => h.date === seed)

  const startWorkout = () => {
    setContent({
      speed: buildSpeedItems(seed),
      memory: buildMemoryTrials(seed),
      stroop: buildStroopItems(seed),
      pattern: buildPatternItems(seed),
      odd: buildOddItems(seed),
    })
    setEarnedToday(!playedToday)
    setRoundIdx(0)
    setRoundScores([])
    setPhase('playing')
    if (typeof window !== 'undefined') window.scrollTo(0, 0)
  }

  const yesterdaySeed = () => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return todaySeed(d)
  }

  const onRoundDone = (score) => {
    const scores = [...roundScores, score]
    setRoundScores(scores)
    if (roundIdx + 1 < ROUND_DEFS.length) {
      setRoundIdx(roundIdx + 1)
    } else {
      const total = scores.reduce((a, b) => a + b, 0)
      if (earnedToday) {
        const g = loadGym()
        const newStreak = g.lastPlayed === yesterdaySeed() ? (g.streak || 0) + 1 : 1
        const xpGain = total * 10 + (total >= Math.round(MAX_SCORE * 0.9) ? 100 : 0)
        const badges = new Set(g.badges || [])
        badges.add('First Workout')
        if (newStreak >= 3) badges.add('3-Day Streak')
        if (newStreak >= 7) badges.add('7-Day Streak')
        if (newStreak >= 30) badges.add('30-Day Streak')
        if (total >= Math.round(MAX_SCORE * 0.9)) badges.add('Sharp Shooter')
        if (scores.some((s, i) => s >= ROUND_DEFS[i].max)) badges.add('Perfect Round')
        const next = {
          ...g,
          xp: (g.xp || 0) + xpGain,
          streak: newStreak,
          lastPlayed: seed,
          best: Math.max(g.best || 0, total),
          history: [...(g.history || []), { date: seed, score: total, max: MAX_SCORE }].slice(-30),
          badges: [...badges],
        }
        if (levelFromXp(next.xp) >= 5) next.badges = [...new Set([...next.badges, 'Level 5'])]
        if (levelFromXp(next.xp) >= 10) next.badges = [...new Set([...next.badges, 'Level 10'])]
        saveGym(next)
        setGym(next)
      }
      setPhase('finished')
    }
  }

  const total = roundScores.reduce((a, b) => a + b, 0)
  const def = ROUND_DEFS[roundIdx]

  return (
    <>
      <Head>
        <title>Daily Gym — NEEV</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <SiteNav active="gym" />

      <div className="gym-wrap">
        {phase === 'home' && (
          <div className="fade-in">
            <div className="eyebrow" style={{ marginTop: 10 }}>The Daily Cognitive Gym <span style={{ color: 'var(--margin-red)' }}>·</span> {seed || '…'}</div>
            <h1 className="lesson-title">Five rounds. <mark>New set every day.</mark></h1>
            <p style={{ color: 'var(--ink-soft)', marginTop: 12, maxWidth: '56ch' }}>
              Speed, memory, focus, patterns and judgment — one short workout, evolved daily from the date itself.
              Come back tomorrow and every question is different. Miss a day, lose the streak.
            </p>

            {gym && (
              <div className="gym-stats">
                <div className="stat-card"><div className="v">🔥 {gym.streak || 0}</div><div className="l">day streak</div></div>
                <div className="stat-card"><div className="v">Lv {levelFromXp(gym.xp)}</div><div className="l">{gym.xp || 0} XP</div></div>
                <div className="stat-card"><div className="v">{gym.best || 0}</div><div className="l">best score / {MAX_SCORE}</div></div>
                <div className="stat-card"><div className="v">{(gym.history || []).length}</div><div className="l">workouts done</div></div>
              </div>
            )}

            <div className="section-head" style={{ marginTop: 24, marginBottom: 12 }}>
              <h2 style={{ fontSize: '1.3rem' }}>Today&apos;s circuit</h2>
              <span className="count">{MAX_SCORE} points on the table</span>
            </div>
            <div className="gym-round-list">
              {ROUND_DEFS.map((r) => (
                <div className="gym-round-row" key={r.id}>
                  <span className="g-icon">{r.icon}</span>
                  <span className="g-info"><h4>{r.name}</h4><span>{r.desc}</span></span>
                  <span className="g-state todo">{r.max} pts</span>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 28 }}>
              {playedToday ? (
                <>
                  <div className="hero-note" style={{ transform: 'none', marginBottom: 12 }}>
                    ✓ today&apos;s workout done — score {gym.history.find((h) => h.date === seed)?.score}/{MAX_SCORE}. New set at midnight!
                  </div>
                  <br />
                  <button className="hero-cta" onClick={startWorkout}>Practice again (no XP) ↻</button>
                </>
              ) : (
                <button className="hero-cta gold" style={{ fontSize: '1.05rem', padding: '16px 34px' }} onClick={startWorkout} disabled={!seed}>
                  Start today&apos;s workout 🔥
                </button>
              )}
            </div>

            {gym && gym.history && gym.history.length > 0 && (
              <>
                <div className="section-head" style={{ marginTop: 36, marginBottom: 4 }}>
                  <h2 style={{ fontSize: '1.1rem' }}>Last {Math.min(14, gym.history.length)} workouts</h2>
                </div>
                <div className="history-strip">
                  {gym.history.slice(-14).map((h, i, arr) => (
                    <div
                      key={h.date}
                      className={`h-bar${i === arr.length - 1 && h.date === seed ? ' today' : ''}`}
                      style={{ height: `${Math.max(8, (h.score / h.max) * 100)}%` }}
                      title={`${h.date}: ${h.score}/${h.max}`}
                    />
                  ))}
                </div>
              </>
            )}

            {gym && gym.badges && gym.badges.length > 0 && (
              <div className="badge-row" style={{ justifyContent: 'flex-start', marginTop: 24 }}>
                {gym.badges.map((b) => <span className="badge" key={b}>🏅 {b}</span>)}
              </div>
            )}
          </div>
        )}

        {phase === 'playing' && content && (
          <>
            <div className="quiz-progress" style={{ marginTop: 8 }}>
              <span>Round {roundIdx + 1}/{ROUND_DEFS.length}</span>
              <span className="bar"><i style={{ width: `${(roundIdx / ROUND_DEFS.length) * 100}%` }} /></span>
              <span>{total} pts</span>
            </div>
            {def.id === 'speed' && <McqRound key="speed" def={def} items={content.speed} timed={60} onDone={onRoundDone} />}
            {def.id === 'memory' && <MemoryRound key="memory" def={def} trials={content.memory} onDone={onRoundDone} />}
            {def.id === 'stroop' && <StroopRound key="stroop" def={def} items={content.stroop} onDone={onRoundDone} />}
            {def.id === 'pattern' && <McqRound key="pattern" def={def} items={content.pattern} timed={0} onDone={onRoundDone} />}
            {def.id === 'odd' && <McqRound key="odd" def={def} items={content.odd} timed={0} onDone={onRoundDone} />}
          </>
        )}

        {phase === 'finished' && (
          <div className="game-stage game-over fade-in">
            <div className="go-title">Workout complete!</div>
            <p className="go-sub">
              {total >= MAX_SCORE * 0.9 ? 'Elite. Your brain showed up today.'
                : total >= MAX_SCORE * 0.7 ? 'Strong session — the streak is doing its work.'
                : total >= MAX_SCORE * 0.4 ? 'Good reps. Tomorrow’s set will feel a little easier.'
                : 'Showing up is the hardest rep — done. See you tomorrow.'}
            </p>
            <div className="xp-pill">{earnedToday ? `+${total * 10 + (total >= Math.round(MAX_SCORE * 0.9) ? 100 : 0)} XP` : 'practice run · no XP'} · {total}/{MAX_SCORE}</div>
            <div className="gym-round-list" style={{ textAlign: 'left', marginBottom: 18 }}>
              {ROUND_DEFS.map((r, i) => (
                <div className="gym-round-row" key={r.id}>
                  <span className="g-icon">{r.icon}</span>
                  <span className="g-info"><h4>{r.name}</h4></span>
                  <span className={`g-state ${roundScores[i] >= r.max ? 'done' : 'todo'}`}>{roundScores[i] ?? 0}/{r.max}</span>
                </div>
              ))}
            </div>
            {gym && (
              <div className="go-sub">
                🔥 streak: <b>{gym.streak}</b> · level <b>{levelFromXp(gym.xp)}</b>
                {' '}({gym.xp} XP · next level at {xpForLevel(levelFromXp(gym.xp) + 1)})
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <button className="hero-cta" onClick={() => setPhase('home')}>Back to the gym →</button>
            </div>
            <div className="hero-note" style={{ marginTop: 18 }}>a brand-new set unlocks at midnight ↷</div>
          </div>
        )}
      </div>

      <footer className="site-footer">
        <div className="fm">NEEV · Daily Cognitive Gym</div>
        <div>Five rounds a day keeps the rust away.</div>
      </footer>
    </>
  )
}
