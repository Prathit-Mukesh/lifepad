import Head from 'next/head'
import { useCallback, useEffect, useRef, useState } from 'react'
import SiteNav from '../components/SiteNav'
import { makeRng } from '../lib/rng'
import { generate } from '../lib/generators'
import { LOGIC, WORDS, GEO, GK, SEQS, RIDDLES, LATERALS } from '../lib/brainbank'

/* ─────────────────────── profile store (no login) ─────────────────────── */

const PKEY = 'neev_prajnify_v1'
const blank = () => ({
  name: 'Thinker', points: 0, gold: 0, diamonds: 0, totalPts: 0, xp: 0,
  streak: 0, lastActive: null, daily: { date: null, sessions: {} },
  totalSessions: 0, playedModules: [], history: [],
})
const loadProf = () => {
  try { return { ...blank(), ...(JSON.parse(localStorage.getItem(PKEY)) || {}) } } catch { return blank() }
}
const saveProf = (p) => { try { localStorage.setItem(PKEY, JSON.stringify(p)) } catch { /* full */ } }

const dstr = (d = new Date()) => d.toDateString()
const ystr = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dstr(d) }

const iqOf = (p) => Math.min(160, 85 + Math.floor((p.totalPts || 0) / 40))
const levelOf = (p) => Math.floor((p.xp || 0) / 150) + 1
const rankOf = (iq) =>
  iq >= 150 ? { label: 'Diamond Sage', icon: '💎', color: '#38C6F4' }
  : iq >= 135 ? { label: 'Gold Scholar', icon: '🥇', color: '#FFD060' }
  : iq >= 118 ? { label: 'Silver Thinker', icon: '🥈', color: '#C0C0C8' }
  : iq >= 100 ? { label: 'Bronze Learner', icon: '🥉', color: '#CD7F32' }
  : { label: 'Rookie Mind', icon: '🌱', color: '#2EC9B0' }

const rng = () => makeRng(`live:${Math.random()}:${Date.now()}`)
const shuffle = (arr) => rng().shuffle(arr)

// shuffle an MCQ's options, keeping the answer index correct
const mix = (item) => {
  const order = shuffle(item.o.map((_, i) => i))
  return { q: item.q, o: order.map((i) => item.o[i]), a: order.indexOf(item.a) }
}

const SESSION_CAP = 10

const MODULES = [
  { id: 'math', icon: '⚡', name: 'Math Sprint', color: '#FF5F8F', desc: '60 seconds. Streaks multiply your points.' },
  { id: 'logic', icon: '🧩', name: 'Logic Grid', color: '#7B5EFF', desc: 'Deduction, syllogisms, famous puzzles.' },
  { id: 'memory', icon: '🧠', name: 'Neural Memory', color: '#2EC9B0', desc: 'Watch the colour sequence. Reproduce it.' },
  { id: 'recall', icon: '🔢', name: 'Digit Vault', color: '#38C6F4', desc: 'Hold growing numbers in your head.' },
  { id: 'word', icon: '🔤', name: 'Word Forge', color: '#FFD060', desc: 'Unscramble scientific vocabulary.' },
  { id: 'pattern', icon: '🌀', name: 'Pattern Hunt', color: '#C77DFF', desc: 'Crack the hidden rule in each series.' },
  { id: 'focus', icon: '🎯', name: 'Focus Lock', color: '#00E5C4', desc: 'Stroop conflicts and visual searches, fast.' },
  { id: 'geo', icon: '🌍', name: 'GeoMind', color: '#7EDD62', desc: 'The world, from Baikal to the Deccan.' },
  { id: 'gk', icon: '📡', name: 'Knowledge Pulse', color: '#FF9F2E', desc: 'Science, tech and thinking trivia.' },
  { id: 'crusher', icon: '🧨', name: 'Brain Crusher', color: '#FF6B35', desc: 'One hard puzzle. Big points. Dare.' },
]
const MOD = (id) => MODULES.find((m) => m.id === id)

/* ─────────────────────── tiny shared pieces ─────────────────────── */

function Pop({ val }) {
  if (!val) return null
  return <div className="a-pop" key={val.k}>+{val.v}</div>
}

function Ring({ t, total, size = 64 }) {
  const r = size / 2 - 5, c = 2 * Math.PI * r
  const pct = Math.max(0, t / Math.max(1, total))
  const col = pct > 0.55 ? '#2EC9B0' : pct > 0.28 ? '#FFD060' : '#FF5F8F'
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: '0 0 auto' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`} style={{ transition: 'stroke-dasharray 1s linear, stroke .4s' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: col, fontFamily: 'JetBrains Mono, monospace' }}>{t}</div>
    </div>
  )
}

/* ─────────────────────── module sessions ─────────────────────── */

function MathSprint({ onDone }) {
  const TOTAL = 60
  const r = useRef(rng()).current
  const [q, setQ] = useState(() => generate(r.pick(['addsub', 'mult', 'bodmas', 'percent', 'powerroot']), r, r.int(3, 6)))
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [count, setCount] = useState(0)
  const [sel, setSel] = useState(null)
  const [pop, setPop] = useState(null)
  const scoreRef = useRef(0)
  const doneRef = useRef(false)
  const finish = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    onDone(scoreRef.current)
  }, [onDone])
  const [t] = useState(TOTAL)
  const [left, setLeft] = useState(TOTAL)
  useEffect(() => {
    const id = setInterval(() => setLeft((x) => {
      if (x <= 1) { clearInterval(id); finish(); return 0 }
      return x - 1
    }), 1000)
    return () => clearInterval(id)
  }, [finish])

  const pick = (oi) => {
    if (sel !== null) return
    setSel(oi)
    const ok = oi === q.c
    if (ok) {
      const bonus = streak >= 5 ? 60 : streak >= 3 ? 40 : streak >= 1 ? 25 : 15
      scoreRef.current += bonus
      setScore(scoreRef.current)
      setStreak(streak + 1)
      setPop({ v: bonus, k: Math.random() })
    } else setStreak(0)
    setCount(count + 1)
    setTimeout(() => {
      setSel(null)
      setQ(generate(r.pick(['addsub', 'mult', 'bodmas', 'percent', 'powerroot']), r, r.int(3, 6)))
    }, ok ? 300 : 800)
  }

  return (
    <div className="acard glow" style={{ '--gc': 'rgba(255,95,143,.2)' }}>
      <Pop val={pop} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div><div className="a-eyebrow">score</div><div style={{ fontFamily: 'Young Serif', fontSize: '1.6rem', color: '#FFD060' }}>{score}</div></div>
        <Ring t={left} total={t} />
        <div style={{ textAlign: 'right' }}><div className="a-eyebrow">solved</div><div style={{ fontFamily: 'Young Serif', fontSize: '1.6rem', color: '#FF5F8F' }}>{count}</div></div>
      </div>
      {streak >= 2 && <div style={{ textAlign: 'center', color: '#FF9F2E', fontWeight: 800, fontSize: '.85rem' }}>🔥 {streak}× streak — {streak >= 5 ? 60 : streak >= 3 ? 40 : 25} pts each</div>}
      <div className="a-big-q">{q.q.replace('What is ', '').replace('Solve: ', '').replace(' = ?', '')} = ?</div>
      <div className="a-grid2 keep2">
        {q.o.map((o, oi) => {
          let cls = 'a-opt'
          if (sel !== null) { if (oi === q.c) cls += ' ok'; else if (oi === sel) cls += ' bad'; else cls += ' dim' }
          return <button key={oi} className={cls} disabled={sel !== null} onClick={() => pick(oi)}>{o}</button>
        })}
      </div>
    </div>
  )
}

function McqSession({ bank, n = 8, ptsPer = 55, tag, color, onDone }) {
  const [items] = useState(() => shuffle(bank).slice(0, n).map(mix))
  const [i, setI] = useState(0)
  const [sel, setSel] = useState(null)
  const [score, setScore] = useState(0)
  const [pop, setPop] = useState(null)
  const item = items[i]

  const pick = (oi) => {
    if (sel !== null) return
    setSel(oi)
    if (oi === item.a) { setScore(score + ptsPer); setPop({ v: ptsPer, k: Math.random() }) }
  }
  const next = () => {
    if (i + 1 >= items.length) onDone(score)
    else { setI(i + 1); setSel(null) }
  }

  return (
    <div className="acard glow" style={{ '--gc': `${color}33` }}>
      <Pop val={pop} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span className="a-eyebrow" style={{ color }}>{tag} · {i + 1}/{items.length}</span>
        <span className="a-eyebrow" style={{ color: '#FFD060' }}>score {score}</span>
      </div>
      <div className="a-big-q txt">{item.q}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {item.o.map((o, oi) => {
          let cls = 'a-opt left'
          if (sel !== null) { if (oi === item.a) cls += ' ok'; else if (oi === sel) cls += ' bad'; else cls += ' dim' }
          return <button key={oi} className={cls} disabled={sel !== null} onClick={() => pick(oi)}>{o}</button>
        })}
      </div>
      {sel !== null && (
        <button className="abtn full" style={{ '--bc': color, marginTop: 14 }} onClick={next}>
          {i + 1 >= items.length ? 'Finish →' : 'Next →'}
        </button>
      )}
    </div>
  )
}

const MEMC = ['#FF5F8F', '#7B5EFF', '#2EC9B0', '#FFD060', '#FF9F2E', '#C77DFF', '#4ECD7A', '#38C6F4']

function MemorySeq({ onDone }) {
  const [len] = useState(6)
  const [seq] = useState(() => Array.from({ length: 6 }, () => MEMC[Math.floor(Math.random() * MEMC.length)]))
  const [phase, setPhase] = useState('cd') // cd | show | recall | done
  const [cd, setCd] = useState(3)
  const [showIdx, setShowIdx] = useState(-1)
  const [flash, setFlash] = useState(null)
  const [guess, setGuess] = useState([])

  useEffect(() => {
    if (phase !== 'cd') return undefined
    if (cd <= 0) { setPhase('show'); setShowIdx(0); return undefined }
    const id = setTimeout(() => setCd(cd - 1), 800)
    return () => clearTimeout(id)
  }, [phase, cd])

  useEffect(() => {
    if (phase !== 'show') return undefined
    if (showIdx >= seq.length) { setFlash(null); setPhase('recall'); return undefined }
    setFlash(seq[showIdx])
    const a = setTimeout(() => {
      setFlash(null)
      const b = setTimeout(() => setShowIdx(showIdx + 1), 200)
      return () => clearTimeout(b)
    }, 550)
    return () => clearTimeout(a)
  }, [phase, showIdx, seq])

  const tap = (c) => {
    if (phase !== 'recall') return
    const g = [...guess, c]
    setGuess(g)
    if (g.length >= seq.length) {
      const right = g.filter((v, i) => v === seq[i]).length
      const pts = right === seq.length ? seq.length * 30 : Math.round((right / seq.length) * seq.length * 18)
      setPhase('done')
      setTimeout(() => onDone(pts), 1400)
    }
  }

  return (
    <div className="acard glow" style={{ '--gc': 'rgba(46,201,176,.2)', textAlign: 'center' }}>
      {phase === 'cd' && (
        <div style={{ padding: '40px 0' }}>
          <div className="a-eyebrow">prepare your mind</div>
          <div style={{ fontFamily: 'Young Serif', fontSize: '5.5rem', color: '#7B5EFF', textShadow: '0 0 60px #7B5EFF66' }}>{cd > 0 ? cd : 'GO'}</div>
          <div className="a-sub">{len} colours are coming</div>
        </div>
      )}
      {phase === 'show' && (
        <div style={{ padding: '16px 0' }}>
          <div className="a-eyebrow" style={{ marginBottom: 16 }}>{Math.min(showIdx + 1, seq.length)} / {seq.length} shown</div>
          <div className="seq-orb" style={flash ? { background: `radial-gradient(circle at 36% 30%, ${flash}, ${flash}88)`, borderColor: flash, boxShadow: `0 0 70px ${flash}aa` } : {}} />
          <div className="a-dots" style={{ marginTop: 18 }}>
            {seq.map((c, i) => <i key={i} style={i < showIdx ? { background: c } : {}} />)}
          </div>
        </div>
      )}
      {phase === 'recall' && (
        <div style={{ padding: '8px 0' }}>
          <div className="a-eyebrow" style={{ marginBottom: 12 }}>reproduce the sequence · {guess.length}/{seq.length}</div>
          <div className="a-dots" style={{ marginBottom: 18 }}>
            {seq.map((_, i) => <i key={i} style={i < guess.length ? { background: guess[i] } : {}} />)}
          </div>
          <div className="color-pad">
            {MEMC.map((c) => <button key={c} style={{ background: c, boxShadow: `0 4px 16px ${c}55` }} onClick={() => tap(c)} aria-label={c} />)}
          </div>
        </div>
      )}
      {phase === 'done' && (
        <div style={{ padding: '26px 0' }}>
          <div style={{ fontSize: '3rem' }}>{guess.every((v, i) => v === seq[i]) ? '🎯' : '💥'}</div>
          <div style={{ fontFamily: 'Young Serif', fontSize: '1.4rem', color: guess.every((v, i) => v === seq[i]) ? '#4ECD7A' : '#FF5F8F' }}>
            {guess.every((v, i) => v === seq[i]) ? 'Perfect recall' : 'Partial match'}
          </div>
          <div className="a-dots" style={{ marginTop: 12 }}>
            {seq.map((c, i) => <i key={i} style={{ background: c, outline: guess[i] !== c ? '2px solid #FF5F8F' : 'none' }} />)}
          </div>
        </div>
      )}
    </div>
  )
}

function DigitVault({ onDone }) {
  const LENS = [4, 5, 6, 7, 8]
  const [round, setRound] = useState(0)
  const [num, setNum] = useState('')
  const [phase, setPhase] = useState('show')
  const [val, setVal] = useState('')
  const [score, setScore] = useState(0)
  const [fb, setFb] = useState(null)

  useEffect(() => {
    const n = Array.from({ length: LENS[round] }, () => Math.floor(Math.random() * 10)).join('')
    setNum(n); setPhase('show'); setVal(''); setFb(null)
    const id = setTimeout(() => setPhase('type'), 1100 + LENS[round] * 260)
    return () => clearTimeout(id)
  }, [round]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = () => {
    const ok = val.trim() === num
    const pts = ok ? LENS[round] * 12 : 0
    setScore(score + pts)
    setFb(ok ? 'ok' : 'bad')
    setTimeout(() => {
      if (round + 1 >= LENS.length) onDone(score + pts)
      else setRound(round + 1)
    }, 1100)
  }

  return (
    <div className="acard glow" style={{ '--gc': 'rgba(56,198,244,.2)', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span className="a-eyebrow" style={{ color: '#38C6F4' }}>digit vault · round {round + 1}/{LENS.length}</span>
        <span className="a-eyebrow" style={{ color: '#FFD060' }}>score {score}</span>
      </div>
      {phase === 'show' ? (
        <div style={{ padding: '30px 0' }}>
          <div className="a-eyebrow" style={{ marginBottom: 10 }}>memorise</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '2.6rem', fontWeight: 700, letterSpacing: '.4em', color: '#fff' }}>{num}</div>
        </div>
      ) : (
        <div style={{ padding: '14px 0' }}>
          <div className="a-eyebrow" style={{ marginBottom: 12 }}>type the number</div>
          <input
            className="a-input center" inputMode="numeric" autoFocus value={val}
            style={fb === 'ok' ? { borderColor: '#4ECD7A' } : fb === 'bad' ? { borderColor: '#FF5F8F' } : {}}
            onChange={(e) => setVal(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && !fb && submit()}
            disabled={!!fb}
          />
          {fb === 'bad' && <div className="a-feedback bad">it was {num}</div>}
          {fb === 'ok' && <div className="a-feedback good">locked in! +{LENS[round] * 12}</div>}
          {!fb && <button className="abtn" style={{ '--bc': '#38C6F4', marginTop: 14 }} onClick={submit} disabled={!val}>Check ↵</button>}
        </div>
      )}
    </div>
  )
}

function WordForge({ onDone }) {
  const [items] = useState(() => shuffle(WORDS).slice(0, 6).map((w) => {
    let s = w.w
    let guard = 0
    while (s === w.w && guard++ < 20) s = shuffle(w.w.split('')).join('')
    return { ...w, s }
  }))
  const [i, setI] = useState(0)
  const [val, setVal] = useState('')
  const [fb, setFb] = useState(null) // ok | bad | revealed
  const [score, setScore] = useState(0)
  const w = items[i]

  const check = () => {
    if (val.trim().toUpperCase() === w.w) { setFb('ok'); setScore(score + 50) }
    else { setFb('bad'); setTimeout(() => setFb((f) => (f === 'bad' ? null : f)), 600) }
  }
  const next = () => {
    if (i + 1 >= items.length) onDone(score)
    else { setI(i + 1); setVal(''); setFb(null) }
  }

  return (
    <div className="acard glow" style={{ '--gc': 'rgba(255,208,96,.18)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span className="a-eyebrow" style={{ color: '#FFD060' }}>word forge · {i + 1}/{items.length}</span>
        <span className="a-eyebrow" style={{ color: '#FFD060' }}>score {score}</span>
      </div>
      <div style={{ textAlign: 'center' }}>
        <span className="a-chip" style={{ cursor: 'default', color: '#FFD060', borderColor: '#FFD06055' }}>{w.c}</span>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.6rem', fontWeight: 700, letterSpacing: '.35em', margin: '18px 0 8px', color: '#fff' }}>
          {w.s.split('').join(' ')}
        </div>
        <div className="a-sub" style={{ fontStyle: 'italic', marginBottom: 16 }}>💡 {w.h}</div>
      </div>
      <input
        className="a-input center" placeholder="TYPE THE WORD" value={val} disabled={fb === 'ok' || fb === 'revealed'}
        style={fb === 'ok' ? { borderColor: '#4ECD7A' } : fb === 'bad' ? { borderColor: '#FF5F8F' } : {}}
        onChange={(e) => setVal(e.target.value.toUpperCase())}
        onKeyDown={(e) => e.key === 'Enter' && fb !== 'ok' && fb !== 'revealed' && check()}
      />
      {(fb === 'ok' || fb === 'revealed') && (
        <div className={`a-feedback ${fb === 'ok' ? 'good' : 'bad'}`}>{fb === 'ok' ? `${w.w} — forged! +50` : `it was ${w.w}`}</div>
      )}
      <div style={{ display: 'flex', gap: 9, marginTop: 14 }}>
        {fb !== 'ok' && fb !== 'revealed' && <button className="abtn" style={{ '--bc': '#FFD060', color: '#12122e', flex: 1 }} onClick={check}>Check ↵</button>}
        {fb !== 'ok' && fb !== 'revealed' && <button className="abtn ghost" onClick={() => setFb('revealed')}>Reveal</button>}
        {(fb === 'ok' || fb === 'revealed') && <button className="abtn full" style={{ '--bc': '#FFD060', color: '#12122e' }} onClick={next}>{i + 1 >= items.length ? 'Finish →' : 'Next word →'}</button>}
      </div>
    </div>
  )
}

function PatternHunt({ onDone }) {
  const r = useRef(rng()).current
  const [items] = useState(() => {
    const out = []
    const seen = new Set()
    let g = 0
    while (out.length < 7 && g++ < 100) {
      const q = generate(r.bool(0.72) ? 'series_number' : 'series_letter', r, r.int(4, 8))
      if (q && !seen.has(q.q)) { seen.add(q.q); out.push(q) }
    }
    return out
  })
  const [i, setI] = useState(0)
  const [sel, setSel] = useState(null)
  const [score, setScore] = useState(0)
  const item = items[i]
  const pick = (oi) => {
    if (sel !== null) return
    setSel(oi)
    if (oi === item.c) setScore(score + 55)
    setTimeout(() => {
      if (i + 1 >= items.length) onDone(score + (oi === item.c ? 55 : 0))
      else { setI(i + 1); setSel(null) }
    }, oi === item.c ? 550 : 1500)
  }
  return (
    <div className="acard glow" style={{ '--gc': 'rgba(199,125,255,.2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span className="a-eyebrow" style={{ color: '#C77DFF' }}>pattern hunt · {i + 1}/{items.length}</span>
        <span className="a-eyebrow" style={{ color: '#FFD060' }}>score {score}</span>
      </div>
      <div className="a-big-q" style={{ fontSize: 'clamp(1.2rem,4vw,1.7rem)' }}>{item.q.replace('What comes next: ', '').replace(', … ?', '')} , … ?</div>
      <div className="a-grid2 keep2">
        {item.o.map((o, oi) => {
          let cls = 'a-opt'
          if (sel !== null) { if (oi === item.c) cls += ' ok'; else if (oi === sel) cls += ' bad'; else cls += ' dim' }
          return <button key={oi} className={cls} disabled={sel !== null} onClick={() => pick(oi)}>{o}</button>
        })}
      </div>
      {sel !== null && sel !== item.c && <div className="a-feedback bad">{item.why}</div>}
    </div>
  )
}

const STROOPC = [
  { name: 'RED', hex: '#FF5F5F' }, { name: 'BLUE', hex: '#4D8DFF' },
  { name: 'GREEN', hex: '#4ECD7A' }, { name: 'GOLD', hex: '#FFD060' },
]

function FocusLock({ onDone }) {
  const ROUNDS = 8
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [task, setTask] = useState(null)
  const [locked, setLocked] = useState(false)
  const startRef = useRef(0)

  useEffect(() => {
    if (Math.random() < 0.55) {
      const word = STROOPC[Math.floor(Math.random() * 4)]
      let ink = STROOPC[Math.floor(Math.random() * 4)]
      if (Math.random() < 0.75) while (ink.name === word.name) ink = STROOPC[Math.floor(Math.random() * 4)]
      setTask({ kind: 'stroop', word: word.name, ink })
    } else {
      const idx = Math.floor(Math.random() * 16)
      setTask({ kind: 'odd', idx })
    }
    setLocked(false)
    startRef.current = Date.now()
  }, [round])

  const answer = (ok) => {
    if (locked) return
    setLocked(true)
    const ms = Date.now() - startRef.current
    const pts = ok ? Math.max(10, 60 - Math.floor(ms / 100) * 4) : 0
    const ns = score + pts
    setScore(ns)
    setTimeout(() => {
      if (round + 1 >= ROUNDS) onDone(ns)
      else setRound(round + 1)
    }, ok ? 350 : 800)
  }

  if (!task) return null
  return (
    <div className="acard glow" style={{ '--gc': 'rgba(0,229,196,.18)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span className="a-eyebrow" style={{ color: '#00E5C4' }}>focus lock · {round + 1}/{ROUNDS}</span>
        <span className="a-eyebrow" style={{ color: '#FFD060' }}>score {score} · faster = more</span>
      </div>
      {task.kind === 'stroop' ? (
        <>
          <div className="a-sub" style={{ textAlign: 'center' }}>Tap the colour of the <b style={{ color: '#fff' }}>INK</b> — not the word.</div>
          <div className="stroop-big" style={{ color: task.ink.hex }}>{task.word}</div>
          <div className="a-grid2 keep2">
            {STROOPC.map((c) => (
              <button key={c.name} className="a-opt" style={{ color: c.hex, borderColor: `${c.hex}66` }} disabled={locked}
                onClick={() => answer(c.name === task.ink.name)}>{c.name}</button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="a-sub" style={{ textAlign: 'center', marginBottom: 14 }}>Tap the different shape — fast.</div>
          <div className="focus-grid4">
            {Array.from({ length: 16 }, (_, i) => (
              <button key={`${round}-${i}`} className="focus-cell" disabled={locked} onClick={() => answer(i === task.idx)}>
                {i === task.idx ? '◆' : '●'}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function BrainCrusher({ onDone }) {
  const [puz] = useState(() => {
    const roll = Math.random()
    if (roll < 0.4) { const s = SEQS[Math.floor(Math.random() * SEQS.length)]; return { kind: 'seq', ...s } }
    if (roll < 0.75) { const r0 = RIDDLES[Math.floor(Math.random() * RIDDLES.length)]; return { kind: 'riddle', ...mix(r0) } }
    const l = LATERALS[Math.floor(Math.random() * LATERALS.length)]
    return { kind: 'lateral', ...l }
  })
  const TOTAL = 120
  const [left, setLeft] = useState(TOTAL)
  const [hint, setHint] = useState(false)
  const [sel, setSel] = useState(null)
  const [val, setVal] = useState('')
  const [done, setDone] = useState(null) // {pts, msg}
  const leftRef = useRef(TOTAL)
  useEffect(() => {
    const id = setInterval(() => setLeft((x) => {
      leftRef.current = Math.max(0, x - 1)
      if (x <= 1) clearInterval(id)
      return Math.max(0, x - 1)
    }), 1000)
    return () => clearInterval(id)
  }, [])

  const settle = (pts, msg) => setDone({ pts: Math.max(0, pts - (hint ? 20 : 0)), msg })

  const submit = () => {
    if (puz.kind === 'seq') {
      const ok = parseInt(val.trim(), 10) === puz.n
      settle(ok ? Math.max(30, Math.round(leftRef.current * 1.6)) : 0, ok ? 'Cracked it.' : `Answer: ${puz.n} — ${puz.r}`)
    } else if (puz.kind === 'riddle') {
      const ok = sel === puz.a
      settle(ok ? Math.max(30, Math.round(leftRef.current * 1.3)) : 0, ok ? 'Sharp.' : `Answer: ${puz.o[puz.a]}`)
    }
  }

  if (done) {
    return (
      <div className="acard glow" style={{ '--gc': 'rgba(255,107,53,.22)', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>{done.pts > 100 ? '🏆' : done.pts > 30 ? '💪' : '😤'}</div>
        <div style={{ fontFamily: 'Young Serif', fontSize: '2rem', color: '#FFD060', margin: '8px 0' }}>+{done.pts} pts</div>
        <div className="a-sub" style={{ maxWidth: '46ch', margin: '0 auto 18px' }}>{done.msg}</div>
        <button className="abtn full" style={{ '--bc': '#FF6B35' }} onClick={() => onDone(done.pts)}>Continue →</button>
      </div>
    )
  }

  return (
    <div className="acard glow" style={{ '--gc': 'rgba(255,107,53,.22)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span className="a-eyebrow" style={{ color: '#FF6B35' }}>🧨 brain crusher</span>
        <Ring t={left} total={TOTAL} />
      </div>
      <div className="a-big-q txt">
        {puz.kind === 'seq' ? <>Find the pattern and the next term:<br /><span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.3rem', color: '#FFD060' }}>{puz.s.join('  →  ')}  →  ???</span></> : puz.q}
      </div>
      {hint
        ? <div className="a-sub" style={{ border: '1px dashed #FF6B3588', borderRadius: 12, padding: '10px 14px', marginBottom: 12, color: '#FF9F2E' }}>💡 {puz.kind === 'seq' ? puz.r : puz.hint || 'Think laterally, not literally.'}</div>
        : <button className="abtn ghost sm" style={{ marginBottom: 12 }} onClick={() => setHint(true)}>💡 Hint (−20 pts)</button>}
      {puz.kind === 'riddle' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {puz.o.map((o, oi) => (
            <button key={oi} className={`a-opt left${sel === oi ? ' ok' : ''}`} onClick={() => setSel(oi)}>{o}</button>
          ))}
        </div>
      )}
      {puz.kind === 'seq' && (
        <input className="a-input center" inputMode="numeric" placeholder="?" value={val}
          onChange={(e) => setVal(e.target.value.replace(/[^\d-]/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && submit()} />
      )}
      {puz.kind === 'lateral' && (
        <div className="a-sub" style={{ marginBottom: 6 }}>Think it through out loud (great with a friend), then reveal — and be honest.</div>
      )}
      {puz.kind !== 'lateral'
        ? <button className="abtn full" style={{ '--bc': '#FF6B35', marginTop: 14 }} disabled={puz.kind === 'riddle' ? sel === null : !val} onClick={submit}>Submit solution</button>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 12 }}>
            <div className="a-sub" style={{ border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, padding: '10px 14px' }}>
              <b style={{ color: '#fff' }}>Solution:</b> {puz.a}
            </div>
            <div className="a-grid2 keep2">
              <button className="a-opt" onClick={() => settle(Math.max(30, Math.round(leftRef.current * 1.2)), 'Lateral genius — verified by your own conscience.')}>I solved it 🎯</button>
              <button className="a-opt" onClick={() => settle(15, 'The attempt is the workout. Next one falls.')}>Not quite 😅</button>
            </div>
          </div>
        )}
    </div>
  )
}

/* ─────────────────────── main page ─────────────────────── */

export default function PrajnifyPage() {
  const [prof, setProf] = useState(null)
  const [view, setView] = useState('home')
  const [tab, setTab] = useState('train')
  const [mode, setMode] = useState(null)
  const [result, setResult] = useState(null)
  const [editName, setEditName] = useState(false)

  useEffect(() => {
    const p = loadProf()
    if (p.daily.date !== dstr()) p.daily = { date: dstr(), sessions: {} }
    saveProf(p)
    setProf(p)
  }, [])

  const usedToday = (id) => (prof?.daily?.sessions?.[id]) || 0
  const sessionsToday = prof ? Object.values(prof.daily.sessions).reduce((a, b) => a + b, 0) : 0

  const play = (id) => {
    if (usedToday(id) >= SESSION_CAP) return
    setMode(id)
    setView('play')
    if (typeof window !== 'undefined') window.scrollTo(0, 0)
  }

  const finish = (score) => {
    const p = { ...loadProf() }
    if (p.daily.date !== dstr()) p.daily = { date: dstr(), sessions: {} }
    const xpGain = Math.floor(score / 2.5) + 22
    const ptsGain = Math.floor(score / 1.8) + 12
    const beforeG = p.gold, beforeD = p.diamonds
    let pts = p.points + ptsGain
    while (pts >= 100) { pts -= 100; p.gold++ }
    while (p.gold >= 100) { p.gold -= 100; p.diamonds++ }
    p.points = pts
    p.totalPts = (p.totalPts || 0) + ptsGain
    p.xp = (p.xp || 0) + xpGain
    if (p.lastActive !== dstr()) {
      p.streak = p.lastActive === ystr() ? (p.streak || 0) + 1 : 1
      p.lastActive = dstr()
    }
    p.daily.sessions[mode] = (p.daily.sessions[mode] || 0) + 1
    p.totalSessions = (p.totalSessions || 0) + 1
    if (!p.playedModules.includes(mode)) p.playedModules = [...p.playedModules, mode]
    const h = [...(p.history || [])]
    const todayH = h.find((x) => x.date === dstr())
    if (todayH) todayH.pts += ptsGain
    else h.push({ date: dstr(), pts: ptsGain })
    p.history = h.slice(-21)
    saveProf(p)
    setProf(p)
    setResult({ score, xpGain, ptsGain, goldGain: p.gold - beforeG + (p.diamonds - beforeD) * 100, diaGain: p.diamonds - beforeD, maxed: p.daily.sessions[mode] >= SESSION_CAP })
    setView('result')
    if (typeof window !== 'undefined') window.scrollTo(0, 0)
  }

  const renameProfile = (name) => {
    const p = { ...loadProf(), name: name.trim() || 'Thinker' }
    saveProf(p); setProf(p); setEditName(false)
  }

  const iq = prof ? iqOf(prof) : 85
  const rk = rankOf(iq)
  const lvl = prof ? levelOf(prof) : 1
  const m = mode ? MOD(mode) : null

  const BADGES = prof ? [
    { i: '🌟', n: 'First Step', d: '1 session done', ok: prof.totalSessions >= 1 },
    { i: '🔥', n: 'Week Warrior', d: '7-day streak', ok: prof.streak >= 7 },
    { i: '🥇', n: 'Gold Rush', d: 'Earn 10 Gold', ok: prof.gold + prof.diamonds * 100 >= 10 },
    { i: '💎', n: 'Diamond Mind', d: 'First Diamond', ok: prof.diamonds >= 1 },
    { i: '🏆', n: 'Polymath', d: 'Play all 10 modules', ok: prof.playedModules.length >= 10 },
    { i: '🧠', n: 'Brain Athlete', d: '50 sessions', ok: prof.totalSessions >= 50 },
    { i: '🎓', n: 'Sharp Thinker', d: 'Brain IQ 120', ok: iq >= 120 },
    { i: '🦁', n: 'Scholar', d: 'Brain IQ 140', ok: iq >= 140 },
    { i: '👑', n: 'Consistency', d: '30-day streak', ok: prof.streak >= 30 },
    { i: '🚀', n: 'Mission Control', d: '200 sessions', ok: prof.totalSessions >= 200 },
  ] : []

  const grade = result ? (result.score >= 220 ? 'S' : result.score >= 140 ? 'A' : result.score >= 70 ? 'B' : 'C') : 'C'
  const gradeCol = { S: '#FFD060', A: '#4ECD7A', B: '#7B5EFF', C: '#7E7BA8' }[grade]
  const gradeMsg = { S: 'LEGENDARY', A: 'EXCELLENT', B: 'SOLID', C: 'KEEP GOING' }[grade]

  return (
    <>
      <Head>
        <title>Prajnify — Brain Training · NEEV</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <SiteNav active="gym" />
      <div className="arena">
        <div className="arena-inner">

          {view === 'home' && prof && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div className="a-eyebrow">Prajnify · ancient wisdom, modern cognition</div>
                <h1 className="a-title">Train your brain like an <span className="a-grad">athlete</span>.</h1>
              </div>

              {/* profile hero */}
              <div className="acard glow" style={{ '--gc': 'rgba(123,94,255,.22)', display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="iq-ring">
                  <svg width="110" height="110">
                    <circle cx="55" cy="55" r="48" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="7" />
                    <circle cx="55" cy="55" r="48" fill="none" stroke="url(#iqg)" strokeWidth="7" strokeLinecap="round"
                      strokeDasharray={`${((iq - 85) / 75) * 2 * Math.PI * 48} ${2 * Math.PI * 48}`} />
                    <defs><linearGradient id="iqg"><stop offset="0%" stopColor="#7B5EFF" /><stop offset="100%" stopColor="#2EC9B0" /></linearGradient></defs>
                  </svg>
                  <div className="iq-val"><b>{iq}</b><span>BRAIN IQ</span></div>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  {editName ? (
                    <input className="a-input" autoFocus defaultValue={prof.name} style={{ maxWidth: 240, padding: '8px 12px' }}
                      onBlur={(e) => renameProfile(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && renameProfile(e.target.value)} />
                  ) : (
                    <div style={{ fontFamily: 'Young Serif', fontSize: '1.5rem', color: '#fff', cursor: 'pointer' }} onClick={() => setEditName(true)} title="Tap to rename">
                      {prof.name} <span style={{ fontSize: '.8rem', opacity: .4 }}>✏️</span>
                    </div>
                  )}
                  <div style={{ color: rk.color, fontWeight: 800, fontSize: '.85rem', margin: '2px 0 8px' }}>{rk.icon} {rk.label} · Level {lvl}</div>
                  <div className="a-chiprow">
                    <span className="a-chip" style={{ cursor: 'default', color: '#38C6F4', borderColor: '#38C6F455' }}>💎 {prof.diamonds}</span>
                    <span className="a-chip" style={{ cursor: 'default', color: '#FFD060', borderColor: '#FFD06055' }}>🥇 {prof.gold}</span>
                    <span className="a-chip" style={{ cursor: 'default', color: '#C77DFF', borderColor: '#C77DFF55' }}>⚡ {prof.points}</span>
                    <span className="a-chip" style={{ cursor: 'default', color: '#FF9F2E', borderColor: '#FF9F2E55' }}>🔥 {prof.streak}-day</span>
                  </div>
                </div>
                <div style={{ fontSize: '.72rem', color: 'var(--amut)', fontWeight: 700, textAlign: 'right' }}>
                  100 ⚡ = 1 🥇<br />100 🥇 = 1 💎<br />today: {sessionsToday} sessions
                </div>
              </div>

              <div className="a-chiprow">
                {[['train', '🏋️ Train'], ['badges', '🏅 Badges'], ['stats', '📈 Stats']].map(([k, l]) => (
                  <button key={k} className={`a-chip${tab === k ? ' on' : ''}`} onClick={() => setTab(k)}>{l}</button>
                ))}
              </div>

              {tab === 'train' && (
                <div className="mod-grid">
                  {MODULES.map((mm) => {
                    const used = usedToday(mm.id)
                    return (
                      <button key={mm.id} className={`mod-tile${used >= SESSION_CAP ? ' spent' : ''}`} style={{ '--mc': mm.color }} onClick={() => play(mm.id)}>
                        <span className="m-ico">{mm.icon}</span>
                        <h3>{mm.name}</h3>
                        <p>{mm.desc}</p>
                        <span className="m-meta">
                          <span className="m-bar"><i style={{ width: `${(used / SESSION_CAP) * 100}%` }} /></span>
                          {used >= SESSION_CAP ? '✓ done today' : `${used}/${SESSION_CAP} today`}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {tab === 'badges' && (
                <div className="badge-grid">
                  {BADGES.map((b) => (
                    <div key={b.n} className={`a-badge${b.ok ? '' : ' locked'}`}>
                      <div className="bi">{b.i}</div>
                      <div className="bn">{b.n}</div>
                      <div className="bd">{b.d}</div>
                      {b.ok && <div style={{ fontSize: '.6rem', fontWeight: 800, color: '#2EC9B0', marginTop: 4, letterSpacing: '.15em' }}>UNLOCKED</div>}
                    </div>
                  ))}
                </div>
              )}

              {tab === 'stats' && (
                <>
                  <div className="a-stats">
                    <div className="a-stat"><div className="v">{prof.totalSessions}</div><div className="l">sessions</div></div>
                    <div className="a-stat"><div className="v">{prof.totalPts.toLocaleString()}</div><div className="l">lifetime ⚡</div></div>
                    <div className="a-stat"><div className="v">🔥 {prof.streak}</div><div className="l">day streak</div></div>
                    <div className="a-stat"><div className="v">{prof.playedModules.length}/10</div><div className="l">modules tried</div></div>
                  </div>
                  {prof.history.length > 0 && (
                    <div className="acard">
                      <div className="a-eyebrow" style={{ marginBottom: 12 }}>points earned · last {prof.history.length} active days</div>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end', height: 70 }}>
                        {prof.history.map((h) => (
                          <div key={h.date} title={`${h.date}: ${h.pts} pts`}
                            style={{ flex: 1, minHeight: 5, height: `${Math.min(100, (h.pts / Math.max(...prof.history.map((x) => x.pts))) * 100)}%`, borderRadius: '5px 5px 0 0', background: h.date === dstr() ? 'linear-gradient(180deg,#FF9F2E,#FF5F8F)' : 'rgba(123,94,255,.5)' }} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {view === 'play' && m && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="a-chip" style={{ cursor: 'default', color: m.color, borderColor: `${m.color}55` }}>
                  {m.icon} {m.name} · session {usedToday(mode) + 1}/{SESSION_CAP}
                </span>
                <button className="abtn ghost sm" onClick={() => setView('home')}>← Exit</button>
              </div>
              {mode === 'math' && <MathSprint onDone={finish} />}
              {mode === 'logic' && <McqSession bank={LOGIC} tag="🧩 logic" ptsPer={60} color="#7B5EFF" onDone={finish} />}
              {mode === 'memory' && <MemorySeq onDone={finish} />}
              {mode === 'recall' && <DigitVault onDone={finish} />}
              {mode === 'word' && <WordForge onDone={finish} />}
              {mode === 'pattern' && <PatternHunt onDone={finish} />}
              {mode === 'focus' && <FocusLock onDone={finish} />}
              {mode === 'geo' && <McqSession bank={GEO} tag="🌍 geography" color="#7EDD62" onDone={finish} />}
              {mode === 'gk' && <McqSession bank={GK} tag="📡 knowledge" color="#FF9F2E" onDone={finish} />}
              {mode === 'crusher' && <BrainCrusher onDone={finish} />}
            </div>
          )}

          {view === 'result' && result && m && (
            <div className="fade-in" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="a-eyebrow" style={{ marginTop: 10 }}>session complete · {m.name}</div>
              <div className="a-result-grade" style={{ '--gcol': gradeCol }}>
                <b>{grade}</b><span>{gradeMsg}</span>
              </div>
              <div className="a-stats" style={{ maxWidth: 460, margin: '0 auto', width: '100%' }}>
                <div className="a-stat"><div className="v" style={{ color: '#FFD060' }}>{result.score}</div><div className="l">score</div></div>
                <div className="a-stat"><div className="v" style={{ color: '#7B5EFF' }}>+{result.xpGain}</div><div className="l">xp</div></div>
                <div className="a-stat"><div className="v" style={{ color: '#C77DFF' }}>+{result.ptsGain}</div><div className="l">points ⚡</div></div>
              </div>
              {result.goldGain > 0 && <div style={{ color: '#FFD060', fontWeight: 800 }}>🥇 +{result.goldGain} Gold earned!</div>}
              {result.diaGain > 0 && <div style={{ color: '#38C6F4', fontWeight: 800 }}>💎 Diamond unlocked!</div>}
              {result.maxed && <div className="a-sub">Daily limit reached for {m.name} — fresh challenges tomorrow.</div>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                {!result.maxed && <button className="abtn" style={{ '--bc': m.color }} onClick={() => play(mode)}>Play again</button>}
                <button className="abtn ghost" onClick={() => { setView('home'); setResult(null) }}>← All modules</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
