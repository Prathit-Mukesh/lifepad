import Head from 'next/head'
import { useEffect, useRef, useState } from 'react'
import SiteNav from '../components/SiteNav'
import { makeRng } from '../lib/rng'
import { generate } from '../lib/generators'
import { PARTY_POOL, PAIR_EMOJI, GEO } from '../lib/brainbank'
import { TRIVIA, WORDLE_WORDS, BLOOM_PUZZLES, EMOJI_RIDDLES } from '../lib/trivia'
import { WYR, MLT, NHIE } from '../lib/instagames'

/* ───────── local bests ───────── */
const GKEY = 'neev_games_v1'
const loadG = () => { try { return JSON.parse(localStorage.getItem(GKEY)) || {} } catch { return {} } }
const saveG = (g) => { try { localStorage.setItem(GKEY, JSON.stringify(g)) } catch { /* full */ } }

const rng = () => makeRng(`games:${Math.random()}:${Date.now()}`)
const shuffle = (a) => rng().shuffle(a)
const mix = (item) => {
  const order = shuffle(item.o.map((_, i) => i))
  return { ...item, o: order.map((i) => item.o[i]), a: order.indexOf(item.a) }
}

const GAMES = [
  { id: 'wordle', icon: '🟩', name: 'Word Guess', mode: 'solo', color: '#4ECD7A', desc: 'The famous 5-letter guessing game. Six tries, colour clues.', best: (g) => (g.wordleWon ? `${g.wordleWon} wins · 🔥${g.wordleStreak || 0}` : null) },
  { id: 'bloom', icon: '🌼', name: 'Word Bloom', mode: 'solo', color: '#FFD060', desc: 'Six letters, 75 seconds — forge every word you can find.', best: (g) => (g.bloomBest ? `${g.bloomBest} pts` : null) },
  { id: 'trivia', icon: '🌐', name: 'Trivia Trek', mode: 'solo', color: '#38C6F4', desc: 'Nine awareness worlds: movies, history, animals, economy…', best: () => null },
  { id: 'emoji', icon: '🎭', name: 'Emoji Riddles', mode: 'solo', color: '#FF9F2E', desc: 'Guess the movie from emojis alone. Harder than it looks.', best: (g) => (g.emojiBest ? `${g.emojiBest} pts` : null) },
  { id: 'numguess', icon: '🎲', name: 'Number Hunt', mode: 'solo', color: '#7B5EFF', desc: 'A secret number between 1 and 100. Corner it in 7 guesses.', best: (g) => (g.numBest ? `${g.numBest} guesses` : null) },
  { id: 'reaction', icon: '🫲', name: 'Reaction Flash', mode: 'solo', color: '#2EC9B0', desc: 'Wait for green. Tap. How fast are your reflexes?', best: (g) => (g.reactionBest ? `${g.reactionBest} ms avg` : null) },
  { id: 'schulte', icon: '🔢', name: 'Number Rush', mode: 'solo', color: '#38C6F4', desc: 'Tap 1→25 in order. The classic Schulte attention table.', best: (g) => (g.schulteBest ? `${g.schulteBest}s` : null) },
  { id: 'pairs', icon: '🎴', name: 'Memory Pairs', mode: 'solo', color: '#C77DFF', desc: 'Flip and match all 8 pairs in as few moves as possible.', best: (g) => (g.pairsBest ? `${g.pairsBest} moves` : null) },
  { id: 'g2048', icon: '🔢', name: '2048', mode: 'solo', color: '#FFB44D', desc: 'Swipe, merge, double. The legendary tile puzzle.', best: (g) => (g.g2048Best ? `${g.g2048Best} pts` : null) },
  { id: 'wyr', icon: '🤔', name: 'Would You Rather', mode: 'group', color: '#5AD6FF', desc: 'Impossible choices, big debates. The insta-story classic.', best: () => null },
  { id: 'mlt', icon: '👉', name: 'Most Likely To', mode: 'group', color: '#DA9BFF', desc: 'Everyone points on three… two… one. Tally the votes.', best: () => null },
  { id: 'nhie', icon: '🖐️', name: 'Never Have I Ever', mode: 'group', color: '#FF7FA8', desc: 'Five lives each. The confessions game, family edition.', best: () => null },
  { id: 'tapduel', icon: '⚔️', name: 'Tap Duel', mode: 'duo', color: '#FF5F8F', desc: 'Two players, one screen. First to tap on GO wins. Best of 5.', best: () => null },
  { id: 'mathduel', icon: '🥊', name: 'Math Duel', mode: 'duo', color: '#FF9F2E', desc: 'Face-to-face mental math. First correct answer takes the point.', best: () => null },
  { id: 'ttt', icon: '⭕', name: 'Tic-Tac-Toe', mode: 'duo', color: '#7B5EFF', desc: 'The eternal strategy classic — with a running score.', best: () => null },
  { id: 'party', icon: '🎉', name: 'Quiz Party', mode: 'group', color: '#FFD060', desc: 'Pass the phone. 2–8 players, rapid questions, podium finish.', best: () => null },
]
const MODES = [['all', 'All'], ['solo', '🧍 Solo'], ['duo', '🧑‍🤝‍🧑 2 Players'], ['group', '👨‍👩‍👧‍👦 Group']]
const MODE_TAG = { solo: '1 player', duo: '2 players', group: '2–8 players' }

// Quiz Party draws from everything: brainbank + all trivia worlds + emoji riddles
const PARTY_ALL = [
  ...PARTY_POOL,
  ...Object.values(TRIVIA).flatMap((c) => c.items.map((x) => ({ ...x, tag: c.name }))),
  ...EMOJI_RIDDLES.map((r) => ({ q: `Guess from the emojis:  ${r.e}`, o: r.o, a: r.a, tag: 'Emoji riddle' })),
]

/* ───────── Reaction Flash ───────── */
function Reaction({ onExit, bests, setBests }) {
  const ROUNDS = 5
  const [phase, setPhase] = useState('idle') // idle | wait | go | between | done
  const [times, setTimes] = useState([])
  const [msg, setMsg] = useState('')
  const goAt = useRef(0)
  const timer = useRef(null)

  const arm = () => {
    setPhase('wait')
    setMsg('')
    timer.current = setTimeout(() => {
      goAt.current = Date.now()
      setPhase('go')
    }, 1400 + Math.random() * 2600)
  }
  useEffect(() => () => clearTimeout(timer.current), [])

  const tap = () => {
    if (phase === 'idle' || phase === 'between') { arm(); return }
    if (phase === 'wait') {
      clearTimeout(timer.current)
      setMsg('Too soon! Wait for green…')
      setPhase('between')
      return
    }
    if (phase === 'go') {
      const ms = Date.now() - goAt.current
      const t = [...times, ms]
      setTimes(t)
      if (t.length >= ROUNDS) {
        const avg = Math.round(t.reduce((a, b) => a + b, 0) / t.length)
        const g = { ...bests }
        if (!g.reactionBest || avg < g.reactionBest) g.reactionBest = avg
        saveG(g); setBests(g)
        setPhase('done')
      } else {
        setMsg(`${ms} ms!`)
        setPhase('between')
      }
    }
  }

  if (phase === 'done') {
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    const verdict = avg < 250 ? '🐆 Cheetah-class reflexes' : avg < 330 ? '⚡ Sharp — above average' : avg < 420 ? '🙂 Solid human speed' : '🐢 Warm up and try again'
    return (
      <div className="acard glow" style={{ '--gc': 'rgba(46,201,176,.2)', textAlign: 'center' }}>
        <div style={{ fontSize: '2.6rem' }}>🫲</div>
        <div style={{ fontFamily: 'Young Serif', fontSize: '2.4rem', color: '#2EC9B0' }}>{avg} ms</div>
        <div className="a-sub" style={{ marginBottom: 8 }}>{verdict}</div>
        <div className="a-sub" style={{ fontSize: '.8rem', marginBottom: 16 }}>rounds: {times.map((t) => `${t}ms`).join(' · ')} · best ever: {bests.reactionBest} ms</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="abtn" style={{ '--bc': '#2EC9B0' }} onClick={() => { setTimes([]); setPhase('idle') }}>Again</button>
          <button className="abtn ghost" onClick={onExit}>← Games</button>
        </div>
      </div>
    )
  }

  const cls = phase === 'go' ? 'go' : phase === 'wait' ? 'wait' : 'idle'
  return (
    <div className={`react-zone ${cls}`} onPointerDown={tap}>
      <div style={{ fontSize: '2.2rem' }}>{phase === 'go' ? '🟢' : phase === 'wait' ? '🔴' : '🫲'}</div>
      {phase === 'idle' && <>Tap to start round 1/{ROUNDS}<span className="a-sub" style={{ fontWeight: 400 }}>wait for GREEN, then tap as fast as you can</span></>}
      {phase === 'wait' && <>Wait for it…</>}
      {phase === 'go' && <>TAP NOW!</>}
      {phase === 'between' && <>{msg}<span className="a-sub" style={{ fontWeight: 400 }}>tap for round {times.length + 1}/{ROUNDS}</span></>}
    </div>
  )
}

/* ───────── Number Rush (Schulte) ───────── */
function Schulte({ onExit, bests, setBests }) {
  const [cells] = useState(() => shuffle(Array.from({ length: 25 }, (_, i) => i + 1)))
  const [next, setNext] = useState(1)
  const [err, setErr] = useState(null)
  const [start, setStart] = useState(null)
  const [now, setNow] = useState(null)
  const [done, setDone] = useState(null)

  useEffect(() => {
    if (!start || done) return undefined
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [start, done])

  const tap = (n) => {
    if (done) return
    if (!start && n !== 1) return
    if (n === 1 && !start) setStart(Date.now())
    if (n === next) {
      if (n === 25) {
        const secs = Math.round((Date.now() - (start || Date.now())) / 100) / 10
        const g = { ...bests }
        if (!g.schulteBest || secs < g.schulteBest) g.schulteBest = secs
        saveG(g); setBests(g)
        setDone(secs)
      }
      setNext(next + 1)
    } else {
      setErr(n)
      setTimeout(() => setErr(null), 320)
    }
  }

  const elapsed = start && !done ? Math.round((now - start) / 100) / 10 : done || 0
  return (
    <div className="acard glow" style={{ '--gc': 'rgba(56,198,244,.2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <span className="a-eyebrow" style={{ color: '#38C6F4' }}>find: <b style={{ fontSize: '1.1rem', color: '#fff' }}>{done ? '✓' : next}</b></span>
        <span className="a-eyebrow" style={{ color: '#FFD060' }}>⏱ {elapsed.toFixed(1)}s{bests.schulteBest ? ` · best ${bests.schulteBest}s` : ''}</span>
      </div>
      {done ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '2.4rem' }}>🏁</div>
          <div style={{ fontFamily: 'Young Serif', fontSize: '2.2rem', color: '#38C6F4' }}>{done.toFixed(1)}s</div>
          <div className="a-sub" style={{ marginBottom: 16 }}>{done < 25 ? 'Elite scanning speed!' : done < 40 ? 'Sharp eyes — keep training.' : 'Every run rewires your attention.'}</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="abtn" style={{ '--bc': '#38C6F4' }} onClick={onExit}>← Games</button>
          </div>
        </div>
      ) : (
        <>
          <div className="schulte-grid">
            {cells.map((n) => (
              <button key={n} className={`schulte-cell${n < next ? ' hit' : ''}${err === n ? ' err' : ''}`} onClick={() => tap(n)}>{n}</button>
            ))}
          </div>
          {!start && <div className="a-sub" style={{ textAlign: 'center', marginTop: 12 }}>tap <b style={{ color: '#fff' }}>1</b> to start the clock</div>}
        </>
      )}
    </div>
  )
}

/* ───────── Memory Pairs ───────── */
function Pairs({ onExit, bests, setBests }) {
  const [deck] = useState(() => shuffle([...PAIR_EMOJI.slice(0, 8), ...PAIR_EMOJI.slice(0, 8)]))
  const [open, setOpen] = useState([])
  const [found, setFound] = useState([])
  const [moves, setMoves] = useState(0)
  const [lock, setLock] = useState(false)
  const doneAll = found.length === 16

  useEffect(() => {
    if (!doneAll) return
    const g = { ...bests }
    if (!g.pairsBest || moves < g.pairsBest) g.pairsBest = moves
    saveG(g); setBests(g)
  }, [doneAll]) // eslint-disable-line react-hooks/exhaustive-deps

  const flip = (i) => {
    if (lock || open.includes(i) || found.includes(i)) return
    const o = [...open, i]
    setOpen(o)
    if (o.length === 2) {
      setMoves(moves + 1)
      if (deck[o[0]] === deck[o[1]]) {
        setFound([...found, ...o]); setOpen([])
      } else {
        setLock(true)
        setTimeout(() => { setOpen([]); setLock(false) }, 750)
      }
    }
  }

  return (
    <div className="acard glow" style={{ '--gc': 'rgba(199,125,255,.2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <span className="a-eyebrow" style={{ color: '#C77DFF' }}>pairs found: {found.length / 2}/8</span>
        <span className="a-eyebrow" style={{ color: '#FFD060' }}>moves: {moves}{bests.pairsBest ? ` · best ${bests.pairsBest}` : ''}</span>
      </div>
      {doneAll ? (
        <div style={{ textAlign: 'center', padding: '18px 0' }}>
          <div style={{ fontSize: '2.4rem' }}>🎴</div>
          <div style={{ fontFamily: 'Young Serif', fontSize: '1.9rem', color: '#C77DFF' }}>{moves} moves</div>
          <div className="a-sub" style={{ marginBottom: 16 }}>{moves <= 12 ? 'Photographic! (12 is near-perfect)' : moves <= 18 ? 'Strong visual memory.' : 'The grid trains you every game.'}</div>
          <button className="abtn ghost" onClick={onExit}>← Games</button>
        </div>
      ) : (
        <div className="pairs-grid">
          {deck.map((e, i) => {
            const up = open.includes(i)
            const ok = found.includes(i)
            return <button key={i} className={`pair-card${up ? ' up' : ''}${ok ? ' done' : ''}`} onClick={() => flip(i)}>{up || ok ? e : '·'}</button>
          })}
        </div>
      )}
    </div>
  )
}

/* ───────── Tap Duel (2P) ───────── */
function TapDuel({ onExit }) {
  const WIN = 3
  const [score, setScore] = useState([0, 0])
  const [phase, setPhase] = useState('ready') // ready | wait | go | roundover | matchover
  const [note, setNote] = useState('First to 3 rounds wins')
  const timer = useRef(null)

  const arm = () => {
    setPhase('wait')
    setNote('')
    timer.current = setTimeout(() => setPhase('go'), 1200 + Math.random() * 2800)
  }
  useEffect(() => () => clearTimeout(timer.current), [])

  const point = (p, why) => {
    clearTimeout(timer.current)
    const s = [...score]
    s[p] += 1
    setScore(s)
    setNote(why)
    setPhase(s[p] >= WIN ? 'matchover' : 'roundover')
  }

  const tap = (p) => {
    if (phase === 'wait') point(p === 0 ? 1 : 0, `${p === 0 ? 'Blue' : 'Pink'} jumped early — point to the other side!`)
    else if (phase === 'go') point(p, `${p === 0 ? 'Blue' : 'Pink'} strikes first!`)
  }

  return (
    <div>
      <div className="duel-score" style={{ marginBottom: 10 }}>
        <span style={{ color: '#38C6F4' }}>{score[0]}</span><span style={{ color: 'var(--amut)', fontSize: '1rem' }}>vs</span><span style={{ color: '#FF5F8F' }}>{score[1]}</span>
      </div>
      {phase === 'matchover' ? (
        <div className="acard" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.6rem' }}>🏆</div>
          <div style={{ fontFamily: 'Young Serif', fontSize: '1.7rem', color: score[0] > score[1] ? '#38C6F4' : '#FF5F8F' }}>
            {score[0] > score[1] ? 'Blue' : 'Pink'} wins the duel!
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
            <button className="abtn" style={{ '--bc': '#FF5F8F' }} onClick={() => { setScore([0, 0]); setPhase('ready'); setNote('First to 3 rounds wins') }}>Rematch</button>
            <button className="abtn ghost" onClick={onExit}>← Games</button>
          </div>
        </div>
      ) : (
        <div className="duel-zone">
          <div className={`duel-half p2 flip${phase === 'go' ? ' go' : ''}`} onPointerDown={() => tap(1)}>
            {phase === 'go' ? 'TAP!' : phase === 'wait' ? 'wait…' : 'PINK — tap when GREEN'}
          </div>
          <div style={{ textAlign: 'center', color: 'var(--amut)', fontWeight: 800, fontSize: '.85rem', minHeight: 22 }}>
            {phase === 'ready' || phase === 'roundover'
              ? <button className="abtn sm" style={{ '--bc': '#4ECD7A' }} onClick={arm}>{phase === 'ready' ? 'Start round ▶' : 'Next round ▶'}</button>
              : note || (phase === 'wait' ? 'hands ready…' : 'GO!')}
            {(phase === 'ready' || phase === 'roundover') && note && <div style={{ marginTop: 6 }}>{note}</div>}
          </div>
          <div className={`duel-half p1${phase === 'go' ? ' go' : ''}`} onPointerDown={() => tap(0)}>
            {phase === 'go' ? 'TAP!' : phase === 'wait' ? 'wait…' : 'BLUE — tap when GREEN'}
          </div>
        </div>
      )}
    </div>
  )
}

/* ───────── Math Duel (2P) ───────── */
function MathDuel({ onExit }) {
  const WIN = 4
  const r = useRef(rng()).current
  const newQ = () => generate(r.pick(['addsub', 'mult', 'bodmas', 'percent']), r, r.int(3, 5))
  const [q, setQ] = useState(newQ)
  const [score, setScore] = useState([0, 0])
  const [locked, setLocked] = useState([false, false])
  const [flash, setFlash] = useState(null) // {p, ok}
  const [over, setOver] = useState(false)

  const pick = (p, oi) => {
    if (locked[p] || over || flash?.ok) return
    if (oi === q.c) {
      const s = [...score]; s[p] += 1
      setScore(s)
      setFlash({ p, ok: true })
      if (s[p] >= WIN) { setOver(true); return }
      setTimeout(() => { setQ(newQ()); setLocked([false, false]); setFlash(null) }, 900)
    } else {
      const l = [...locked]; l[p] = true
      setLocked(l)
      setFlash({ p, ok: false })
      if (l[0] && l[1]) setTimeout(() => { setQ(newQ()); setLocked([false, false]); setFlash(null) }, 900)
    }
  }

  const pad = (p, flip) => (
    <div style={{ transform: flip ? 'rotate(180deg)' : 'none', opacity: locked[p] ? 0.35 : 1 }}>
      <div className="a-grid2 keep2">
        {q.o.map((o, oi) => (
          <button key={oi} className="a-opt" style={{ borderColor: p === 0 ? '#38C6F466' : '#FF5F8F66', color: p === 0 ? '#38C6F4' : '#FF5F8F', padding: '12px 8px' }}
            disabled={locked[p] || !!flash?.ok} onClick={() => pick(p, oi)}>{o}</button>
        ))}
      </div>
      {locked[p] && <div className="a-feedback bad" style={{ transform: flip ? 'rotate(180deg)' : 'none' }}>locked out this round</div>}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="duel-score">
        <span style={{ color: '#38C6F4' }}>{score[0]}</span><span style={{ color: 'var(--amut)', fontSize: '1rem' }}>vs</span><span style={{ color: '#FF5F8F' }}>{score[1]}</span>
      </div>
      {over ? (
        <div className="acard" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.6rem' }}>🥊</div>
          <div style={{ fontFamily: 'Young Serif', fontSize: '1.7rem', color: score[0] > score[1] ? '#38C6F4' : '#FF5F8F' }}>
            {score[0] > score[1] ? 'Blue' : 'Pink'} takes the match {Math.max(...score)}–{Math.min(...score)}!
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
            <button className="abtn" style={{ '--bc': '#FF9F2E' }} onClick={() => { setScore([0, 0]); setLocked([false, false]); setFlash(null); setOver(false); setQ(newQ()) }}>Rematch</button>
            <button className="abtn ghost" onClick={onExit}>← Games</button>
          </div>
        </div>
      ) : (
        <div className="acard glow" style={{ '--gc': 'rgba(255,159,46,.2)' }}>
          {pad(1, true)}
          <div style={{ textAlign: 'center', margin: '16px 0' }}>
            <div className="a-eyebrow">first correct wins the point · first to {WIN}</div>
            <div className="a-big-q" style={{ margin: '8px 0' }}>{q.q.replace('What is ', '').replace('Solve: ', '').replace(' = ?', '')} = ?</div>
            {flash?.ok && <div className="a-feedback good">{flash.p === 0 ? 'Blue' : 'Pink'} scores! ⚡</div>}
          </div>
          {pad(0, false)}
        </div>
      )}
    </div>
  )
}

/* ───────── Tic-Tac-Toe (2P) ───────── */
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]
function TicTacToe({ onExit }) {
  const [board, setBoard] = useState(Array(9).fill(null))
  const [turn, setTurn] = useState('X')
  const [score, setScore] = useState({ X: 0, O: 0, D: 0 })
  const winLine = LINES.find((l) => board[l[0]] && board[l[0]] === board[l[1]] && board[l[1]] === board[l[2]])
  const winner = winLine ? board[winLine[0]] : null
  const full = board.every(Boolean)
  const over = !!winner || full

  const tap = (i) => {
    if (board[i] || over) return
    const b = [...board]
    b[i] = turn
    setBoard(b)
    const wl = LINES.find((l) => b[l[0]] && b[l[0]] === b[l[1]] && b[l[1]] === b[l[2]])
    if (wl) setScore({ ...score, [b[wl[0]]]: score[b[wl[0]]] + 1 })
    else if (b.every(Boolean)) setScore({ ...score, D: score.D + 1 })
    else setTurn(turn === 'X' ? 'O' : 'X')
  }
  const again = () => { setBoard(Array(9).fill(null)); setTurn(winner === 'X' ? 'O' : 'X') }

  return (
    <div className="acard glow" style={{ '--gc': 'rgba(123,94,255,.2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <span className="a-eyebrow"><b style={{ color: '#38C6F4' }}>X {score.X}</b> · <b style={{ color: '#FF5F8F' }}>O {score.O}</b> · draws {score.D}</span>
        <span className="a-eyebrow" style={{ color: '#fff' }}>{over ? (winner ? `${winner} wins!` : 'Draw!') : `${turn} to move`}</span>
      </div>
      <div className="ttt-grid">
        {board.map((v, i) => (
          <button key={i} className={`ttt-cell${v === 'X' ? ' x' : v === 'O' ? ' o' : ''}${winLine?.includes(i) ? ' win' : ''}`} onClick={() => tap(i)}>{v}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
        {over && <button className="abtn" style={{ '--bc': '#7B5EFF' }} onClick={again}>Next round</button>}
        <button className="abtn ghost" onClick={onExit}>← Games</button>
      </div>
    </div>
  )
}

/* ───────── Quiz Party (group) ───────── */
function QuizParty({ onExit }) {
  const [phase, setPhase] = useState('setup') // setup | handoff | question | podium
  const [players, setPlayers] = useState(['', ''])
  const [rounds, setRounds] = useState(3)
  const [scores, setScores] = useState([])
  const [turn, setTurn] = useState(0) // overall question index
  const [q, setQ] = useState(null)
  const [sel, setSel] = useState(null)
  const pool = useRef([])

  const names = players.map((p, i) => p.trim() || `Player ${i + 1}`)
  const cur = turn % players.length
  const totalQs = players.length * rounds

  const start = () => {
    pool.current = shuffle(PARTY_ALL).slice(0, totalQs + 5).map(mix)
    setScores(players.map(() => 0))
    setTurn(0)
    setPhase('handoff')
  }
  const ask = () => { setQ(pool.current[turn]); setSel(null); setPhase('question') }
  const answer = (oi) => {
    if (sel !== null) return
    setSel(oi)
    if (oi === q.a) {
      const s = [...scores]; s[cur] += 10
      setScores(s)
    }
    setTimeout(() => {
      if (turn + 1 >= totalQs) setPhase('podium')
      else { setTurn(turn + 1); setPhase('handoff') }
    }, 1600)
  }

  if (phase === 'setup') {
    return (
      <div className="acard glow" style={{ '--gc': 'rgba(255,208,96,.18)' }}>
        <div className="a-eyebrow" style={{ color: '#FFD060', marginBottom: 12 }}>🎉 quiz party · set up your table</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {players.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 8 }}>
              <input className="a-input" placeholder={`Player ${i + 1} name`} value={p}
                onChange={(e) => setPlayers(players.map((x, j) => (j === i ? e.target.value : x)))} />
              {players.length > 2 && <button className="abtn ghost sm" onClick={() => setPlayers(players.filter((_, j) => j !== i))}>✕</button>}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {players.length < 8 && <button className="abtn ghost sm" onClick={() => setPlayers([...players, ''])}>+ Add player</button>}
          <span style={{ flex: 1 }} />
          <span className="a-sub" style={{ alignSelf: 'center' }}>questions each:</span>
          {[3, 5, 7].map((n) => (
            <button key={n} className={`a-chip${rounds === n ? ' on' : ''}`} onClick={() => setRounds(n)}>{n}</button>
          ))}
        </div>
        <button className="abtn full" style={{ '--bc': '#FFD060', color: '#12122e', marginTop: 16 }} onClick={start}>
          Start the party ({players.length} players · {totalQs} questions) 🎉
        </button>
      </div>
    )
  }

  if (phase === 'handoff') {
    return (
      <div className="acard glow" style={{ '--gc': 'rgba(255,208,96,.18)', textAlign: 'center', padding: '38px 20px' }}>
        <div className="a-eyebrow">question {turn + 1} of {totalQs}</div>
        <div style={{ fontSize: '2.6rem', margin: '10px 0' }}>📱</div>
        <div style={{ fontFamily: 'Young Serif', fontSize: '1.7rem', color: '#fff' }}>Pass the phone to <span style={{ color: '#FFD060' }}>{names[cur]}</span></div>
        <div className="a-sub" style={{ margin: '6px 0 18px' }}>current score: {scores[cur]} pts</div>
        <button className="abtn" style={{ '--bc': '#FFD060', color: '#12122e' }} onClick={ask}>I&apos;m {names[cur]} — show my question ▶</button>
      </div>
    )
  }

  if (phase === 'question' && q) {
    return (
      <div className="acard glow" style={{ '--gc': 'rgba(255,208,96,.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span className="a-eyebrow" style={{ color: '#FFD060' }}>{names[cur]} · {q.tag}</span>
          <span className="a-eyebrow">+10 for a correct answer</span>
        </div>
        <div className="a-big-q txt">{q.q}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {q.o.map((o, oi) => {
            let cls = 'a-opt left'
            if (sel !== null) { if (oi === q.a) cls += ' ok'; else if (oi === sel) cls += ' bad'; else cls += ' dim' }
            return <button key={oi} className={cls} disabled={sel !== null} onClick={() => answer(oi)}>{o}</button>
          })}
        </div>
        {sel !== null && <div className={`a-feedback ${sel === q.a ? 'good' : 'bad'}`}>{sel === q.a ? `+10 for ${names[cur]}!` : 'no points this time'}</div>}
      </div>
    )
  }

  // podium
  const ranked = names.map((n, i) => ({ n, s: scores[i] })).sort((a, b) => b.s - a.s)
  const podium = [ranked[1], ranked[0], ranked[2]].filter(Boolean)
  const heights = ranked.length >= 3 ? [70, 100, 50] : [70, 100]
  const colors = ['#C0C0C8', '#FFD060', '#CD7F32']
  return (
    <div className="acard glow" style={{ '--gc': 'rgba(255,208,96,.2)', textAlign: 'center' }}>
      <div style={{ fontSize: '2.4rem' }}>🏆</div>
      <div style={{ fontFamily: 'Young Serif', fontSize: '1.6rem', color: '#fff', marginBottom: 4 }}>{ranked[0].n} takes the crown!</div>
      <div className="podium">
        {podium.map((p, i) => (
          <div className="p-col" key={p.n}>
            <span className="p-name">{p.n}</span>
            <div className="p-bar" style={{ height: heights[i], background: colors[ranked.indexOf(p)] }}>{p.s}</div>
          </div>
        ))}
      </div>
      {ranked.slice(3).map((p) => <div key={p.n} className="a-sub">{p.n} · {p.s} pts</div>)}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
        <button className="abtn" style={{ '--bc': '#FFD060', color: '#12122e' }} onClick={() => setPhase('setup')}>New party</button>
        <button className="abtn ghost" onClick={onExit}>← Games</button>
      </div>
    </div>
  )
}

/* ───────── Word Guess (Wordle-style) ───────── */
const KB_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', '↵ZXCVBNM⌫']

function evalGuess(guess, answer) {
  const res = Array(5).fill('miss')
  const counts = {}
  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) res[i] = 'hit'
    else counts[answer[i]] = (counts[answer[i]] || 0) + 1
  }
  for (let i = 0; i < 5; i++) {
    if (res[i] === 'hit') continue
    if (counts[guess[i]] > 0) { res[i] = 'near'; counts[guess[i]] -= 1 }
  }
  return res
}

function Wordle({ onExit, bests, setBests }) {
  const [answer, setAnswer] = useState(() => WORDLE_WORDS[Math.floor(Math.random() * WORDLE_WORDS.length)])
  const [rows, setRows] = useState([]) // [{word, marks}]
  const [cur, setCur] = useState('')
  const [status, setStatus] = useState('playing') // playing | won | lost
  const [note, setNote] = useState('')

  const keyState = {}
  rows.forEach(({ word, marks }) => {
    word.split('').forEach((ch, i) => {
      const m = marks[i]
      if (m === 'hit') keyState[ch] = 'hit'
      else if (m === 'near' && keyState[ch] !== 'hit') keyState[ch] = 'near'
      else if (!keyState[ch]) keyState[ch] = 'miss'
    })
  })

  const settle = (won, tries) => {
    const g = { ...bests }
    g.wordlePlayed = (g.wordlePlayed || 0) + 1
    if (won) { g.wordleWon = (g.wordleWon || 0) + 1; g.wordleStreak = (g.wordleStreak || 0) + 1 }
    else g.wordleStreak = 0
    saveG(g); setBests(g)
    setStatus(won ? 'won' : 'lost')
    setNote(won ? ['Genius!', 'Magnificent!', 'Splendid!', 'Great!', 'Nice!', 'Phew!'][tries - 1] : `The word was ${answer}`)
  }

  const key = (k) => {
    if (status !== 'playing') return
    if (k === '⌫') { setCur(cur.slice(0, -1)); return }
    if (k === '↵') {
      if (cur.length !== 5) { setNote('5 letters needed'); setTimeout(() => setNote(''), 900); return }
      const marks = evalGuess(cur, answer)
      const next = [...rows, { word: cur, marks }]
      setRows(next)
      setCur('')
      if (cur === answer) settle(true, next.length)
      else if (next.length >= 6) settle(false, 6)
      return
    }
    if (/^[A-Z]$/.test(k) && cur.length < 5) setCur(cur + k)
  }

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Enter') key('↵')
      else if (e.key === 'Backspace') key('⌫')
      else if (/^[a-zA-Z]$/.test(e.key)) key(e.key.toUpperCase())
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })

  const again = () => {
    setAnswer(WORDLE_WORDS[Math.floor(Math.random() * WORDLE_WORDS.length)])
    setRows([]); setCur(''); setStatus('playing'); setNote('')
  }

  return (
    <div className="acard glow" style={{ '--gc': 'rgba(78,205,122,.2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span className="a-eyebrow" style={{ color: '#4ECD7A' }}>guess the 5-letter word · {6 - rows.length} tries left</span>
        <span className="a-eyebrow" style={{ color: '#FFD060' }}>🔥 streak {bests.wordleStreak || 0}</span>
      </div>
      <div className="wordle-grid">
        {Array.from({ length: 6 }, (_, r) => (
          <div className="wordle-row" key={r}>
            {Array.from({ length: 5 }, (_, c) => {
              const done = rows[r]
              const ch = done ? done.word[c] : r === rows.length ? cur[c] : ''
              const cls = done ? ` ${done.marks[c]}` : ch ? ' filled' : ''
              return <div key={c} className={`wordle-tile${cls}`}>{ch || ''}</div>
            })}
          </div>
        ))}
      </div>
      <div className={`a-feedback ${status === 'won' ? 'good' : status === 'lost' ? 'bad' : ''}`}>{note}</div>
      {status === 'playing' ? (
        <div className="kb">
          {KB_ROWS.map((row) => (
            <div className="kb-row" key={row}>
              {row.split('').map((k) => (
                <button key={k} className={`kb-key${'↵⌫'.includes(k) ? ' wide' : ''}${keyState[k] ? ` ${keyState[k]}` : ''}`} onClick={() => key(k)}>
                  {k === '↵' ? 'ENTER' : k === '⌫' ? 'DEL' : k}
                </button>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
          <button className="abtn" style={{ '--bc': '#4ECD7A' }} onClick={again}>New word</button>
          <button className="abtn ghost" onClick={onExit}>← Games</button>
        </div>
      )}
    </div>
  )
}

/* ───────── Word Bloom ───────── */
function Bloom({ onExit, bests, setBests }) {
  const TIME = 75
  const [puz] = useState(() => BLOOM_PUZZLES[Math.floor(Math.random() * BLOOM_PUZZLES.length)])
  const [typed, setTyped] = useState([]) // indices into puz.letters
  const [found, setFound] = useState([])
  const [score, setScore] = useState(0)
  const [left, setLeft] = useState(TIME)
  const [flash, setFlash] = useState(null)
  const doneRef = useRef(false)
  const scoreRef = useRef(0)

  useEffect(() => {
    const id = setInterval(() => setLeft((x) => {
      if (x <= 1) {
        clearInterval(id)
        if (!doneRef.current) {
          doneRef.current = true
          const g = { ...bests }
          if (!g.bloomBest || scoreRef.current > g.bloomBest) g.bloomBest = scoreRef.current
          saveG(g); setBests(g)
        }
        return 0
      }
      return x - 1
    }), 1000)
    return () => clearInterval(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const word = typed.map((i) => puz.letters[i]).join('')

  const submit = () => {
    if (word.length < 3) { setFlash({ t: 'too short', bad: true }); setTyped([]); return }
    if (found.includes(word)) { setFlash({ t: 'already found', bad: true }); setTyped([]); return }
    if (puz.words.includes(word)) {
      const pts = word.length * 5
      scoreRef.current += pts
      setScore(scoreRef.current)
      setFound([...found, word])
      setFlash({ t: `+${pts} · ${word}!`, bad: false })
    } else {
      setFlash({ t: 'not in this bloom', bad: true })
    }
    setTyped([])
    setTimeout(() => setFlash(null), 900)
  }

  if (left <= 0) {
    return (
      <div className="acard glow" style={{ '--gc': 'rgba(255,208,96,.2)', textAlign: 'center' }}>
        <div style={{ fontSize: '2.4rem' }}>🌼</div>
        <div style={{ fontFamily: 'Young Serif', fontSize: '2rem', color: '#FFD060' }}>{score} pts</div>
        <div className="a-sub" style={{ marginBottom: 8 }}>{found.length} words found · best ever {bests.bloomBest || score} pts</div>
        <div className="a-sub" style={{ fontSize: '.8rem', marginBottom: 14 }}>some you missed: {puz.words.filter((w) => !found.includes(w)).slice(0, 6).join(' · ')}</div>
        <button className="abtn ghost" onClick={onExit}>← Games</button>
      </div>
    )
  }

  return (
    <div className="acard glow" style={{ '--gc': 'rgba(255,208,96,.2)', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span className="a-eyebrow" style={{ color: '#FFD060' }}>make words (3+ letters) · {found.length} found</span>
        <span className="a-eyebrow" style={{ color: left <= 10 ? '#FF5F8F' : '#FFD060' }}>⏱ {left}s · {score} pts</span>
      </div>
      <div className="a-timebar"><i style={{ width: `${(left / TIME) * 100}%` }} /></div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '.3em', color: '#fff', minHeight: 36 }}>
        {word || <span style={{ color: 'var(--amut)' }}>tap letters…</span>}
      </div>
      <div className={`a-feedback ${flash ? (flash.bad ? 'bad' : 'good') : ''}`}>{flash?.t || ''}</div>
      <div className="bloom-letters">
        {puz.letters.map((L, i) => (
          <button key={i} className={`bloom-letter${typed.includes(i) ? ' used' : ''}`} onClick={() => setTyped([...typed, i])}>{L}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 9, justifyContent: 'center' }}>
        <button className="abtn ghost sm" onClick={() => setTyped(typed.slice(0, -1))}>⌫ undo</button>
        <button className="abtn ghost sm" onClick={() => setTyped([])}>clear</button>
        <button className="abtn sm" style={{ '--bc': '#FFD060', color: '#12122e' }} onClick={submit} disabled={word.length < 3}>submit ↵</button>
      </div>
      {found.length > 0 && (
        <div className="bloom-found">{found.map((w) => <span key={w}>{w}</span>)}</div>
      )}
    </div>
  )
}

/* ───────── Number Hunt ───────── */
function NumberHunt({ onExit, bests, setBests }) {
  const [target, setTarget] = useState(() => 1 + Math.floor(Math.random() * 100))
  const [val, setVal] = useState('')
  const [tries, setTries] = useState([]) // {n, hint}
  const [won, setWon] = useState(false)

  const guess = () => {
    const n = parseInt(val, 10)
    if (!n || n < 1 || n > 100) return
    if (n === target) {
      const count = tries.length + 1
      const g = { ...bests }
      if (!g.numBest || count < g.numBest) g.numBest = count
      saveG(g); setBests(g)
      setWon(true)
      setTries([...tries, { n, hint: '🎯' }])
    } else {
      setTries([...tries, { n, hint: n < target ? '📈 higher' : '📉 lower' }])
    }
    setVal('')
  }

  const again = () => { setTarget(1 + Math.floor(Math.random() * 100)); setTries([]); setWon(false); setVal('') }

  return (
    <div className="acard glow" style={{ '--gc': 'rgba(123,94,255,.2)', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span className="a-eyebrow" style={{ color: '#7B5EFF' }}>1 – 100 · smart par: 7 guesses</span>
        <span className="a-eyebrow" style={{ color: '#FFD060' }}>{tries.length} guess{tries.length === 1 ? '' : 'es'}{bests.numBest ? ` · best ${bests.numBest}` : ''}</span>
      </div>
      {won ? (
        <div style={{ padding: '14px 0' }}>
          <div style={{ fontSize: '2.4rem' }}>🎯</div>
          <div style={{ fontFamily: 'Young Serif', fontSize: '2rem', color: '#7B5EFF' }}>{target} — got it in {tries.length}!</div>
          <div className="a-sub" style={{ marginBottom: 14 }}>
            {tries.length <= 5 ? 'Better than binary search — brilliant!' : tries.length <= 7 ? 'Right on par. Halving works.' : 'Tip: always guess the middle of what remains.'}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="abtn" style={{ '--bc': '#7B5EFF' }} onClick={again}>New number</button>
            <button className="abtn ghost" onClick={onExit}>← Games</button>
          </div>
        </div>
      ) : (
        <>
          <div className="a-sub" style={{ marginBottom: 12 }}>I&apos;m thinking of a number. Halve the range with every guess.</div>
          <div style={{ display: 'flex', gap: 9, maxWidth: 300, margin: '0 auto' }}>
            <input className="a-input center" style={{ letterSpacing: '.1em' }} inputMode="numeric" placeholder="?" value={val} autoFocus
              onChange={(e) => setVal(e.target.value.replace(/\D/g, '').slice(0, 3))}
              onKeyDown={(e) => e.key === 'Enter' && guess()} />
            <button className="abtn" style={{ '--bc': '#7B5EFF' }} onClick={guess} disabled={!val}>Guess</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 6, marginTop: 16, maxHeight: 200, overflowY: 'auto' }}>
            {tries.map((t, i) => (
              <div key={i} className="a-sub" style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
                <b style={{ color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>{t.n}</b> {t.hint}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ───────── Emoji Riddles ───────── */
function EmojiGame({ onExit, bests, setBests }) {
  const [items] = useState(() => shuffle(EMOJI_RIDDLES).slice(0, 10).map(mix))
  const [i, setI] = useState(0)
  const [sel, setSel] = useState(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const item = items[i]

  const pick = (oi) => {
    if (sel !== null) return
    setSel(oi)
    const ns = score + (oi === item.a ? 10 : 0)
    setScore(ns)
    setTimeout(() => {
      if (i + 1 >= items.length) {
        const g = { ...bests }
        if (!g.emojiBest || ns > g.emojiBest) g.emojiBest = ns
        saveG(g); setBests(g)
        setDone(true)
      } else { setI(i + 1); setSel(null) }
    }, oi === item.a ? 600 : 1300)
  }

  if (done) {
    return (
      <div className="acard glow" style={{ '--gc': 'rgba(255,159,46,.2)', textAlign: 'center' }}>
        <div style={{ fontSize: '2.4rem' }}>🎭</div>
        <div style={{ fontFamily: 'Young Serif', fontSize: '2rem', color: '#FF9F2E' }}>{score}/100</div>
        <div className="a-sub" style={{ marginBottom: 14 }}>
          {score >= 90 ? 'Certified film buff! 🍿' : score >= 60 ? 'Solid movie radar.' : 'More popcorn required. 🍿'}
        </div>
        <button className="abtn ghost" onClick={onExit}>← Games</button>
      </div>
    )
  }

  return (
    <div className="acard glow" style={{ '--gc': 'rgba(255,159,46,.2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span className="a-eyebrow" style={{ color: '#FF9F2E' }}>guess the movie · {i + 1}/10</span>
        <span className="a-eyebrow" style={{ color: '#FFD060' }}>score {score}</span>
      </div>
      <div style={{ textAlign: 'center', fontSize: 'clamp(2.4rem,9vw,3.4rem)', letterSpacing: '.12em', margin: '14px 0 22px' }}>{item.e}</div>
      <div className="a-grid2 keep2">
        {item.o.map((o, oi) => {
          let cls = 'a-opt'
          if (sel !== null) { if (oi === item.a) cls += ' ok'; else if (oi === sel) cls += ' bad'; else cls += ' dim' }
          return <button key={oi} className={cls} disabled={sel !== null} onClick={() => pick(oi)}>{o}</button>
        })}
      </div>
    </div>
  )
}

/* ───────── Trivia Trek ───────── */
const TREK_CATS = [
  { key: 'geo', name: 'Geography', icon: '🗺️', color: '#7EDD62', items: GEO },
  ...Object.entries(TRIVIA).map(([key, c]) => ({ key, name: c.name, icon: c.icon, color: c.color, items: c.items })),
]

function TriviaTrek({ onExit, bests, setBests }) {
  const [cat, setCat] = useState(null)
  const [items, setItems] = useState([])
  const [i, setI] = useState(0)
  const [sel, setSel] = useState(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const start = (c) => {
    setCat(c)
    setItems(shuffle(c.items).slice(0, 10).map(mix))
    setI(0); setSel(null); setScore(0); setDone(false)
  }

  if (!cat) {
    const tb = bests.triviaBest || {}
    return (
      <div>
        <div className="a-sub" style={{ marginBottom: 14 }}>Pick a world. Ten questions. How aware are you really?</div>
        <div className="mod-grid">
          {TREK_CATS.map((c) => (
            <button key={c.key} className="mod-tile" style={{ '--mc': c.color }} onClick={() => start(c)}>
              <span className="m-ico">{c.icon}</span>
              <h3>{c.name}</h3>
              <p>{c.items.length} questions in the pool</p>
              <span className="m-meta"><span style={{ color: c.color }}>{tb[c.key] !== undefined ? `best ${tb[c.key]}/100` : 'unexplored'}</span><span>play ▶</span></span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="acard glow" style={{ '--gc': `${cat.color}33`, textAlign: 'center' }}>
        <div style={{ fontSize: '2.4rem' }}>{cat.icon}</div>
        <div style={{ fontFamily: 'Young Serif', fontSize: '2rem', color: cat.color }}>{score}/100</div>
        <div className="a-sub" style={{ marginBottom: 14 }}>
          {score >= 90 ? `${cat.name} master — take a bow.` : score >= 60 ? 'Well travelled. Push for mastery.' : 'Every wrong answer just taught you something.'}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="abtn" style={{ '--bc': cat.color }} onClick={() => start(cat)}>Replay</button>
          <button className="abtn ghost" onClick={() => setCat(null)}>All worlds</button>
          <button className="abtn ghost" onClick={onExit}>← Games</button>
        </div>
      </div>
    )
  }

  const item = items[i]
  const pick = (oi) => {
    if (sel !== null) return
    setSel(oi)
    const ns = score + (oi === item.a ? 10 : 0)
    setScore(ns)
    setTimeout(() => {
      if (i + 1 >= items.length) {
        const g = { ...bests }
        const tb = { ...(g.triviaBest || {}) }
        if (tb[cat.key] === undefined || ns > tb[cat.key]) tb[cat.key] = ns
        g.triviaBest = tb
        saveG(g); setBests(g)
        setDone(true)
      } else { setI(i + 1); setSel(null) }
    }, oi === item.a ? 550 : 1400)
  }

  return (
    <div className="acard glow" style={{ '--gc': `${cat.color}33` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span className="a-eyebrow" style={{ color: cat.color }}>{cat.icon} {cat.name} · {i + 1}/10</span>
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
    </div>
  )
}

/* ───────── 2048 ───────── */
const TILE_COLORS = {
  2: 'rgba(255,255,255,.22)', 4: 'rgba(255,255,255,.32)', 8: '#FFB44D', 16: '#FF9F2E',
  32: '#FF7FA8', 64: '#FF5F8F', 128: '#DA9BFF', 256: '#9C86FF', 512: '#5AD6FF',
  1024: '#3EE8CC', 2048: '#FFD97A',
}

function slideRow(row) {
  const vals = row.filter(Boolean)
  const out = []
  let gained = 0
  for (let i = 0; i < vals.length; i++) {
    if (vals[i] === vals[i + 1]) { out.push(vals[i] * 2); gained += vals[i] * 2; i++ }
    else out.push(vals[i])
  }
  while (out.length < 4) out.push(0)
  return { out, gained }
}

function moveBoard(board, dir) {
  // board: flat 16. dir: 0 left, 1 right, 2 up, 3 down
  const get = (r, c) => board[r * 4 + c]
  let gained = 0
  const next = Array(16).fill(0)
  for (let i = 0; i < 4; i++) {
    let line
    if (dir === 0) line = [get(i, 0), get(i, 1), get(i, 2), get(i, 3)]
    else if (dir === 1) line = [get(i, 3), get(i, 2), get(i, 1), get(i, 0)]
    else if (dir === 2) line = [get(0, i), get(1, i), get(2, i), get(3, i)]
    else line = [get(3, i), get(2, i), get(1, i), get(0, i)]
    const { out, gained: g } = slideRow(line)
    gained += g
    for (let j = 0; j < 4; j++) {
      if (dir === 0) next[i * 4 + j] = out[j]
      else if (dir === 1) next[i * 4 + (3 - j)] = out[j]
      else if (dir === 2) next[j * 4 + i] = out[j]
      else next[(3 - j) * 4 + i] = out[j]
    }
  }
  return { next, gained, moved: next.some((v, k) => v !== board[k]) }
}

const addTile = (board) => {
  const empty = board.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0)
  if (!empty.length) return board
  const b = [...board]
  b[empty[Math.floor(Math.random() * empty.length)]] = Math.random() < 0.9 ? 2 : 4
  return b
}

const canMove = (b) => b.includes(0) || b.some((v, i) => {
  const r = Math.floor(i / 4), c = i % 4
  return (c < 3 && v === b[i + 1]) || (r < 3 && v === b[i + 4])
})

function Game2048({ onExit, bests, setBests }) {
  const [board, setBoard] = useState(() => addTile(addTile(Array(16).fill(0))))
  const [score, setScore] = useState(0)
  const touch = useRef(null)
  const over = !canMove(board)
  const won = board.includes(2048)

  const doMove = (dir) => {
    if (over) return
    const { next, gained, moved } = moveBoard(board, dir)
    if (!moved) return
    const nb = addTile(next)
    const ns = score + gained
    setBoard(nb)
    setScore(ns)
    const g = { ...bests }
    if (!g.g2048Best || ns > g.g2048Best) { g.g2048Best = ns; saveG(g); setBests(g) }
  }

  useEffect(() => {
    const h = (e) => {
      const dirs = { ArrowLeft: 0, ArrowRight: 1, ArrowUp: 2, ArrowDown: 3 }
      if (dirs[e.key] !== undefined) { e.preventDefault(); doMove(dirs[e.key]) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })

  const onTouchStart = (e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
  const onTouchEnd = (e) => {
    if (!touch.current) return
    const dx = e.changedTouches[0].clientX - touch.current.x
    const dy = e.changedTouches[0].clientY - touch.current.y
    touch.current = null
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return
    if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? 1 : 0)
    else doMove(dy > 0 ? 3 : 2)
  }

  const restart = () => { setBoard(addTile(addTile(Array(16).fill(0)))); setScore(0) }

  return (
    <div className="acard glow" style={{ '--gc': 'rgba(255,180,77,.25)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span className="a-eyebrow" style={{ color: '#FFB44D' }}>swipe or use arrow keys</span>
        <span className="a-eyebrow" style={{ color: '#FFD97A' }}>score {score}{bests.g2048Best ? ` · best ${bests.g2048Best}` : ''}</span>
      </div>
      <div className="g2048-board" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {board.map((v, i) => (
          <div key={i} className={`g2048-cell${v ? ' pop' : ''}`}
            style={v ? { background: TILE_COLORS[v] || '#FFD97A', color: v >= 8 ? '#2A1444' : '#fff' } : {}}>
            {v || ''}
          </div>
        ))}
      </div>
      {(over || won) && (
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <div style={{ fontFamily: 'Young Serif', fontSize: '1.4rem', color: won ? '#FFD97A' : '#FF7FA8' }}>
            {won ? '🏆 2048! You actually did it!' : 'No moves left!'}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 10 }}>
            <button className="abtn" style={{ '--bc': '#FFB44D', color: '#2A1444' }} onClick={restart}>Play again</button>
            <button className="abtn ghost" onClick={onExit}>← Games</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ───────── Would You Rather ───────── */
const pseudoPct = (text) => {
  let h = 0
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) % 997
  return 28 + (h % 45) // 28–72%
}

function WouldYouRather({ onExit }) {
  const [deck] = useState(() => shuffle(WYR))
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState(null)
  const [a, b] = deck[i % deck.length]
  const pctA = pseudoPct(a)

  const next = () => { setI(i + 1); setPicked(null) }

  return (
    <div className="acard glow" style={{ '--gc': 'rgba(90,214,255,.25)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span className="a-eyebrow" style={{ color: '#5AD6FF' }}>round {i + 1} · debate it out loud!</span>
      </div>
      <div className="prompt-big" style={{ margin: '4px 0 14px' }}>Would you rather…</div>
      <div className="wyr-cards">
        <button className={`wyr-card a${picked === 0 ? ' picked' : ''}`} onClick={() => picked === null && setPicked(0)}>
          {a}
          {picked !== null && <div style={{ fontSize: '1.4rem', marginTop: 8 }}>{pctA}% chose this</div>}
        </button>
        <div className="wyr-or">— OR —</div>
        <button className={`wyr-card b${picked === 1 ? ' picked' : ''}`} onClick={() => picked === null && setPicked(1)}>
          {b}
          {picked !== null && <div style={{ fontSize: '1.4rem', marginTop: 8 }}>{100 - pctA}% chose this</div>}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
        {picked !== null && <button className="abtn" style={{ '--bc': '#5AD6FF', color: '#12303E' }} onClick={next}>Next dilemma →</button>}
        <button className="abtn ghost" onClick={onExit}>← Games</button>
      </div>
    </div>
  )
}

/* ───────── Most Likely To ───────── */
function MostLikelyTo({ onExit }) {
  const [phase, setPhase] = useState('setup')
  const [players, setPlayers] = useState(['', ''])
  const [scores, setScores] = useState([])
  const [round, setRound] = useState(0)
  const deck = useRef([])
  const ROUNDS = 10
  const names = players.map((p, j) => p.trim() || `Player ${j + 1}`)

  const start = () => {
    deck.current = shuffle(MLT)
    setScores(players.map(() => 0))
    setRound(0)
    setPhase('play')
  }
  const vote = (pi) => {
    const s = [...scores]; s[pi] += 1
    setScores(s)
    if (round + 1 >= ROUNDS) setPhase('done')
    else setRound(round + 1)
  }

  if (phase === 'setup') {
    return (
      <div className="acard glow" style={{ '--gc': 'rgba(218,155,255,.25)' }}>
        <div className="a-eyebrow" style={{ color: '#DA9BFF', marginBottom: 12 }}>👉 most likely to · who&apos;s playing?</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {players.map((p, j) => (
            <div key={j} style={{ display: 'flex', gap: 8 }}>
              <input className="a-input" placeholder={`Player ${j + 1} name`} value={p}
                onChange={(e) => setPlayers(players.map((x, k) => (k === j ? e.target.value : x)))} />
              {players.length > 2 && <button className="abtn ghost sm" onClick={() => setPlayers(players.filter((_, k) => k !== j))}>✕</button>}
            </div>
          ))}
        </div>
        {players.length < 8 && <button className="abtn ghost sm" style={{ marginTop: 10 }} onClick={() => setPlayers([...players, ''])}>+ Add player</button>}
        <button className="abtn full" style={{ '--bc': '#DA9BFF', color: '#2A1444', marginTop: 14 }} onClick={start}>Start · {ROUNDS} rounds 👉</button>
      </div>
    )
  }

  if (phase === 'done') {
    const ranked = names.map((n, j) => ({ n, s: scores[j] })).sort((x, y) => y.s - x.s)
    return (
      <div className="acard glow" style={{ '--gc': 'rgba(218,155,255,.25)', textAlign: 'center' }}>
        <div style={{ fontSize: '2.4rem' }}>👉</div>
        <div style={{ fontFamily: 'Young Serif', fontSize: '1.5rem', color: '#fff', marginBottom: 12 }}>
          <span style={{ color: '#DA9BFF' }}>{ranked[0].n}</span> is officially "most likely to…" everything!
        </div>
        {ranked.map((p) => <div key={p.n} className="a-sub">{p.n} — {p.s} votes</div>)}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14 }}>
          <button className="abtn" style={{ '--bc': '#DA9BFF', color: '#2A1444' }} onClick={() => setPhase('setup')}>New game</button>
          <button className="abtn ghost" onClick={onExit}>← Games</button>
        </div>
      </div>
    )
  }

  return (
    <div className="acard glow" style={{ '--gc': 'rgba(218,155,255,.25)', textAlign: 'center' }}>
      <div className="a-eyebrow" style={{ color: '#DA9BFF' }}>round {round + 1}/{ROUNDS} · point on 3…2…1 — then tap the winner</div>
      <div className="prompt-big">Who is most likely to<br /><span style={{ color: '#DA9BFF' }}>{deck.current[round % deck.current.length]}?</span></div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {names.map((n, pi) => (
          <button key={pi} className="life-chip" onClick={() => vote(pi)}>
            <b>{n}</b><span style={{ color: '#DA9BFF' }}>{scores[pi]} votes</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ───────── Never Have I Ever ───────── */
function NeverHaveIEver({ onExit }) {
  const LIVES = 5
  const [phase, setPhase] = useState('setup')
  const [players, setPlayers] = useState(['', ''])
  const [lives, setLives] = useState([])
  const [round, setRound] = useState(0)
  const deck = useRef([])
  const names = players.map((p, j) => p.trim() || `Player ${j + 1}`)

  const start = () => {
    deck.current = shuffle(NHIE)
    setLives(players.map(() => LIVES))
    setRound(0)
    setPhase('play')
  }
  const alive = lives.filter((l) => l > 0).length
  const gameOver = phase === 'play' && (round >= deck.current.length || alive <= 1)

  const drop = (pi) => {
    if (lives[pi] <= 0) return
    const l = [...lives]; l[pi] -= 1
    setLives(l)
  }

  if (phase === 'setup') {
    return (
      <div className="acard glow" style={{ '--gc': 'rgba(255,127,168,.25)' }}>
        <div className="a-eyebrow" style={{ color: '#FF7FA8', marginBottom: 12 }}>🖐️ never have I ever · five lives each</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {players.map((p, j) => (
            <div key={j} style={{ display: 'flex', gap: 8 }}>
              <input className="a-input" placeholder={`Player ${j + 1} name`} value={p}
                onChange={(e) => setPlayers(players.map((x, k) => (k === j ? e.target.value : x)))} />
              {players.length > 2 && <button className="abtn ghost sm" onClick={() => setPlayers(players.filter((_, k) => k !== j))}>✕</button>}
            </div>
          ))}
        </div>
        {players.length < 8 && <button className="abtn ghost sm" style={{ marginTop: 10 }} onClick={() => setPlayers([...players, ''])}>+ Add player</button>}
        <button className="abtn full" style={{ '--bc': '#FF7FA8', color: '#3E1220', marginTop: 14 }} onClick={start}>Start confessing 🖐️</button>
      </div>
    )
  }

  if (gameOver) {
    const ranked = names.map((n, j) => ({ n, l: lives[j] })).sort((x, y) => y.l - x.l)
    return (
      <div className="acard glow" style={{ '--gc': 'rgba(255,127,168,.25)', textAlign: 'center' }}>
        <div style={{ fontSize: '2.4rem' }}>😇</div>
        <div style={{ fontFamily: 'Young Serif', fontSize: '1.5rem', color: '#fff', marginBottom: 12 }}>
          <span style={{ color: '#FF7FA8' }}>{ranked[0].n}</span> is the most innocent of all!
        </div>
        {ranked.map((p) => <div key={p.n} className="a-sub">{p.n} — {'❤️'.repeat(p.l) || '💔 out'}</div>)}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14 }}>
          <button className="abtn" style={{ '--bc': '#FF7FA8', color: '#3E1220' }} onClick={() => setPhase('setup')}>Play again</button>
          <button className="abtn ghost" onClick={onExit}>← Games</button>
        </div>
      </div>
    )
  }

  return (
    <div className="acard glow" style={{ '--gc': 'rgba(255,127,168,.25)', textAlign: 'center' }}>
      <div className="a-eyebrow" style={{ color: '#FF7FA8' }}>prompt {round + 1} · tap everyone who HAS done it</div>
      <div className="prompt-big">Never have I ever<br /><span style={{ color: '#FF7FA8' }}>{deck.current[round]}</span></div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
        {names.map((n, pi) => (
          <button key={pi} className={`life-chip${lives[pi] <= 0 ? ' out' : ''}`} onClick={() => drop(pi)}>
            <b>{n}</b><span>{'❤️'.repeat(lives[pi]) || '💔'}</span>
          </button>
        ))}
      </div>
      <button className="abtn" style={{ '--bc': '#FF7FA8', color: '#3E1220' }} onClick={() => setRound(round + 1)}>Next prompt →</button>
    </div>
  )
}

/* ───────── page ───────── */
export default function GamesPage() {
  const [bests, setBests] = useState({})
  const [filter, setFilter] = useState('all')
  const [game, setGame] = useState(null)
  const [playKey, setPlayKey] = useState(0)

  useEffect(() => { setBests(loadG()) }, [])

  const g = game ? GAMES.find((x) => x.id === game) : null
  const open = (id) => { setGame(id); setPlayKey((k) => k + 1); if (typeof window !== 'undefined') window.scrollTo(0, 0) }
  const exit = () => setGame(null)

  return (
    <>
      <Head>
        <title>Games — NEEV</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <SiteNav active="games" />
      <div className="arena">
        <div className="arena-inner">
          {!game ? (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div className="a-eyebrow">the game room · solo, duels &amp; parties</div>
                <h1 className="a-title">Play is how brains <span className="a-grad">stay young</span>.</h1>
                <p className="a-sub" style={{ marginTop: 8, maxWidth: '52ch' }}>
                  Quick games for one, head-to-head duels on a single phone, and party rounds for the whole family.
                </p>
              </div>
              <div className="a-chiprow">
                {MODES.map(([k, l]) => (
                  <button key={k} className={`a-chip${filter === k ? ' on' : ''}`} onClick={() => setFilter(k)}>{l}</button>
                ))}
              </div>
              <div className="mod-grid">
                {GAMES.filter((x) => filter === 'all' || x.mode === filter).map((x) => (
                  <button key={x.id} className="mod-tile" style={{ '--mc': x.color }} onClick={() => open(x.id)}>
                    <span className="m-ico">{x.icon}</span>
                    <h3>{x.name}</h3>
                    <p>{x.desc}</p>
                    <span className="m-meta">
                      <span style={{ color: x.color }}>{MODE_TAG[x.mode]}</span>
                      <span>{x.best(bests) ? `🏅 ${x.best(bests)}` : 'play ▶'}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="a-chip" style={{ cursor: 'default', color: g.color, borderColor: `${g.color}55` }}>{g.icon} {g.name} · {MODE_TAG[g.mode]}</span>
                <button className="abtn ghost sm" onClick={exit}>← All games</button>
              </div>
              {game === 'g2048' && <Game2048 key={playKey} onExit={exit} bests={bests} setBests={setBests} />}
              {game === 'wyr' && <WouldYouRather key={playKey} onExit={exit} />}
              {game === 'mlt' && <MostLikelyTo key={playKey} onExit={exit} />}
              {game === 'nhie' && <NeverHaveIEver key={playKey} onExit={exit} />}
              {game === 'wordle' && <Wordle key={playKey} onExit={exit} bests={bests} setBests={setBests} />}
              {game === 'bloom' && <Bloom key={playKey} onExit={exit} bests={bests} setBests={setBests} />}
              {game === 'trivia' && <TriviaTrek key={playKey} onExit={exit} bests={bests} setBests={setBests} />}
              {game === 'emoji' && <EmojiGame key={playKey} onExit={exit} bests={bests} setBests={setBests} />}
              {game === 'numguess' && <NumberHunt key={playKey} onExit={exit} bests={bests} setBests={setBests} />}
              {game === 'reaction' && <Reaction key={playKey} onExit={exit} bests={bests} setBests={setBests} />}
              {game === 'schulte' && <Schulte key={playKey} onExit={exit} bests={bests} setBests={setBests} />}
              {game === 'pairs' && <Pairs key={playKey} onExit={exit} bests={bests} setBests={setBests} />}
              {game === 'tapduel' && <TapDuel onExit={exit} />}
              {game === 'mathduel' && <MathDuel onExit={exit} />}
              {game === 'ttt' && <TicTacToe onExit={exit} />}
              {game === 'party' && <QuizParty onExit={exit} />}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
