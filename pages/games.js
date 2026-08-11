import Head from 'next/head'
import { useEffect, useRef, useState } from 'react'
import SiteNav from '../components/SiteNav'
import { makeRng } from '../lib/rng'
import { generate } from '../lib/generators'
import { PARTY_POOL, PAIR_EMOJI } from '../lib/brainbank'

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
  { id: 'reaction', icon: '🫲', name: 'Reaction Flash', mode: 'solo', color: '#2EC9B0', desc: 'Wait for green. Tap. How fast are your reflexes?', best: (g) => (g.reactionBest ? `${g.reactionBest} ms avg` : null) },
  { id: 'schulte', icon: '🔢', name: 'Number Rush', mode: 'solo', color: '#38C6F4', desc: 'Tap 1→25 in order. The classic Schulte attention table.', best: (g) => (g.schulteBest ? `${g.schulteBest}s` : null) },
  { id: 'pairs', icon: '🎴', name: 'Memory Pairs', mode: 'solo', color: '#C77DFF', desc: 'Flip and match all 8 pairs in as few moves as possible.', best: (g) => (g.pairsBest ? `${g.pairsBest} moves` : null) },
  { id: 'tapduel', icon: '⚔️', name: 'Tap Duel', mode: 'duo', color: '#FF5F8F', desc: 'Two players, one screen. First to tap on GO wins. Best of 5.', best: () => null },
  { id: 'mathduel', icon: '🥊', name: 'Math Duel', mode: 'duo', color: '#FF9F2E', desc: 'Face-to-face mental math. First correct answer takes the point.', best: () => null },
  { id: 'ttt', icon: '⭕', name: 'Tic-Tac-Toe', mode: 'duo', color: '#7B5EFF', desc: 'The eternal strategy classic — with a running score.', best: () => null },
  { id: 'party', icon: '🎉', name: 'Quiz Party', mode: 'group', color: '#FFD060', desc: 'Pass the phone. 2–8 players, rapid questions, podium finish.', best: () => null },
]
const MODES = [['all', 'All'], ['solo', '🧍 Solo'], ['duo', '🧑‍🤝‍🧑 2 Players'], ['group', '👨‍👩‍👧‍👦 Group']]
const MODE_TAG = { solo: '1 player', duo: '2 players', group: '2–8 players' }

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
    pool.current = shuffle(PARTY_POOL).slice(0, totalQs + 5).map(mix)
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
