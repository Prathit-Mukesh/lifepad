import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import SiteNav from '../components/SiteNav'

/* ───────── store ───────── */
const KEY = 'neev_lifepad_v4'
const blank = () => ({ name: '', tasks: [], expenses: [], notes: [], habits: [], moods: {} })
const load = () => { try { return { ...blank(), ...(JSON.parse(localStorage.getItem(KEY)) || {}) } } catch { return blank() } }
const save = (d) => { try { localStorage.setItem(KEY, JSON.stringify(d)) } catch { /* full */ } }

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
const dkey = (d = new Date()) => d.toISOString().split('T')[0]
const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
const fmtDay = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

const PRIS = [
  { id: 'high', l: 'High', c: '#C0392B' },
  { id: 'med', l: 'Medium', c: '#F4B217' },
  { id: 'low', l: 'Low', c: '#2E7D46' },
]
const ECATS = [
  { id: 'food', l: '🍽️ Food', c: '#E1595C' },
  { id: 'travel', l: '🚗 Travel', c: '#2C4FA3' },
  { id: 'shopping', l: '🛍️ Shopping', c: '#7A3E8F' },
  { id: 'bills', l: '📃 Bills', c: '#B4530A' },
  { id: 'health', l: '💊 Health', c: '#2E7D46' },
  { id: 'fun', l: '🎬 Fun', c: '#1E5F8E' },
  { id: 'other', l: '📌 Other', c: '#43506B' },
]
const NOTE_COLORS = ['#FFF3B8', '#FFE0E6', '#DFF2E1', '#E0EDFF', '#F3E4FF', '#FFEAD2']
const MOODS = [
  { id: 'great', e: '😄', l: 'Great' }, { id: 'good', e: '🙂', l: 'Good' },
  { id: 'okay', e: '😐', l: 'Okay' }, { id: 'low', e: '😔', l: 'Low' },
  { id: 'rough', e: '😩', l: 'Rough' },
]

const greet = () => { const h = new Date().getHours(); return h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Good night' }

/* ───────── recovery of old LifePad (v3) data ─────────
   The previous LifePad stored everything under localStorage key
   "lifepad_v3". Switching to the new app never deleted it — this reads
   that key and converts it into the current format. The old copy is
   left untouched as a safety net. */
const V3_KEY = 'lifepad_v3'
const readV3 = () => { try { return JSON.parse(localStorage.getItem(V3_KEY)) } catch { return null } }

const v3Summary = (v3) => {
  if (!v3) return null
  const counts = {
    tasks: (v3.tasks || []).length,
    expenses: (v3.expenses || []).length,
    notes: (v3.notes || []).length + (v3.gratitude || []).length,
    habits: (v3.habits || []).length,
    moods: (v3.moodLog || []).length,
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  return total > 0 ? { ...counts, total } : null
}

const migrateV3 = (v3, cur) => {
  const priMap = { urgent: 'high', high: 'high', medium: 'med', low: 'low' }
  const catMap = { food: 'food', travel: 'travel', shopping: 'shopping', bills: 'bills', health: 'health', fun: 'fun' }
  const moodMap = { great: 'great', good: 'good', okay: 'okay', bad: 'low', awful: 'rough' }
  const next = { ...cur }
  const haveTask = new Set(cur.tasks.map((t) => t.id))
  const haveExp = new Set(cur.expenses.map((e) => e.id))
  const haveNote = new Set(cur.notes.map((n) => n.id))
  const haveHabit = new Set(cur.habits.map((h) => h.id))

  next.name = cur.name || v3.userName || ''
  next.tasks = [
    ...cur.tasks,
    ...(v3.tasks || []).filter((t) => t && !haveTask.has(t.id)).map((t) => ({
      id: t.id || uid(),
      title: [t.name, t.note].filter(Boolean).join(' — ') || 'Untitled task',
      pri: priMap[t.priority] || 'med',
      due: t.dueDate || null,
      done: t.status === 'done',
      at: Date.parse(t.createdAt) || Date.now(),
    })),
  ]
  next.expenses = [
    ...cur.expenses,
    ...(v3.expenses || []).filter((e) => e && !haveExp.has(e.id)).map((e) => ({
      id: e.id || uid(),
      amt: Number(e.amount) || 0,
      cat: catMap[e.category] || 'other',
      note: e.note || '',
      date: e.date || dkey(),
    })).filter((e) => e.amt > 0),
  ]
  next.notes = [
    ...cur.notes,
    ...(v3.notes || []).filter((n) => n && !haveNote.has(n.id)).map((n, i) => ({
      id: n.id || uid(),
      text: [n.title, n.content].filter(Boolean).join('\n') || '(empty note)',
      color: NOTE_COLORS[i % NOTE_COLORS.length],
      tilt: ((i % 5) - 2) * 0.7,
    })),
    ...(v3.gratitude || []).map((g, i) => ({
      id: uid(),
      text: `🙏 ${g.text}\n(${g.date})`,
      color: NOTE_COLORS[(i + 3) % NOTE_COLORS.length],
      tilt: ((i % 5) - 2) * 0.7,
    })),
  ]
  next.habits = [
    ...cur.habits,
    ...(v3.habits || []).filter((h) => h && !haveHabit.has(h.id)).map((h) => ({
      id: h.id || uid(),
      name: [h.icon, h.name].filter(Boolean).join(' '),
      log: Object.fromEntries((h.completions || []).map((day) => [day, true])),
    })),
  ]
  next.moods = {
    ...Object.fromEntries((v3.moodLog || []).map((m) => [m.date, moodMap[m.mood] || 'okay'])),
    ...cur.moods, // current entries win on conflict
  }
  return next
}

const downloadJson = (obj, filename) => {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function LifePadPage() {
  const [d, setD] = useState(null)
  const [tab, setTab] = useState('today')
  const [oldData, setOldData] = useState(null) // v3 summary if recoverable
  const [restored, setRestored] = useState(false)

  // form state
  const [tTitle, setTTitle] = useState('')
  const [tPri, setTPri] = useState('med')
  const [tDue, setTDue] = useState('')
  const [tFilter, setTFilter] = useState('active')
  const [eAmt, setEAmt] = useState('')
  const [eCat, setECat] = useState('food')
  const [eNote, setENote] = useState('')
  const [nText, setNText] = useState('')
  const [nColor, setNColor] = useState(NOTE_COLORS[0])
  const [hName, setHName] = useState('')

  useEffect(() => {
    const cur = load()
    setD(cur)
    if (!cur.v3Imported && !cur.v3Dismissed) {
      const sum = v3Summary(readV3())
      if (sum) setOldData(sum)
    }
  }, [])
  const commit = (next) => { save(next); setD(next) }

  const restoreOld = () => {
    const v3 = readV3()
    if (!v3) { setOldData(null); return }
    const merged = migrateV3(v3, load())
    merged.v3Imported = true
    commit(merged)
    setOldData(null)
    setRestored(true)
    setTimeout(() => setRestored(false), 6000)
  }
  const dismissOld = () => {
    commit({ ...load(), v3Dismissed: true })
    setOldData(null)
  }
  const backupAll = () => {
    downloadJson(
      { exportedAt: new Date().toISOString(), lifepad: load(), oldLifepadV3: readV3() || undefined },
      `lifepad-backup-${dkey()}.json`
    )
  }

  const today = dkey()
  const monthKey = today.slice(0, 7)

  /* task helpers */
  const addTask = () => {
    if (!tTitle.trim()) return
    commit({ ...d, tasks: [{ id: uid(), title: tTitle.trim(), pri: tPri, due: tDue || null, done: false, at: Date.now() }, ...d.tasks] })
    setTTitle(''); setTDue('')
  }
  const toggleTask = (id) => commit({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })
  const delTask = (id) => commit({ ...d, tasks: d.tasks.filter((t) => t.id !== id) })
  const priOrder = { high: 0, med: 1, low: 2 }
  const sortedTasks = useMemo(() => {
    if (!d) return []
    return [...d.tasks].sort((a, b) => (a.done - b.done) || (priOrder[a.pri] - priOrder[b.pri]) || ((a.due || '9999') < (b.due || '9999') ? -1 : 1))
  }, [d]) // eslint-disable-line react-hooks/exhaustive-deps
  const openTasks = d ? d.tasks.filter((t) => !t.done) : []
  const dueToday = openTasks.filter((t) => t.due && t.due <= today)

  /* money helpers */
  const addExp = () => {
    const amt = parseFloat(eAmt)
    if (!amt || amt <= 0) return
    commit({ ...d, expenses: [{ id: uid(), amt, cat: eCat, note: eNote.trim(), date: today }, ...d.expenses] })
    setEAmt(''); setENote('')
  }
  const delExp = (id) => commit({ ...d, expenses: d.expenses.filter((e) => e.id !== id) })
  const monthExp = d ? d.expenses.filter((e) => e.date.startsWith(monthKey)) : []
  const monthTotal = monthExp.reduce((a, e) => a + e.amt, 0)
  const byCat = ECATS.map((c) => ({ ...c, total: monthExp.filter((e) => e.cat === c.id).reduce((a, e) => a + e.amt, 0) })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total)
  const todaySpend = monthExp.filter((e) => e.date === today).reduce((a, e) => a + e.amt, 0)

  /* notes */
  const addNote = () => {
    if (!nText.trim()) return
    commit({ ...d, notes: [{ id: uid(), text: nText.trim(), color: nColor, tilt: (Math.random() * 3 - 1.5).toFixed(1) }, ...d.notes] })
    setNText('')
  }
  const delNote = (id) => commit({ ...d, notes: d.notes.filter((n) => n.id !== id) })

  /* habits */
  const last7 = useMemo(() => {
    const out = []
    for (let i = 6; i >= 0; i--) { const dt = new Date(); dt.setDate(dt.getDate() - i); out.push(dkey(dt)) }
    return out
  }, [])
  const addHabit = () => {
    if (!hName.trim()) return
    commit({ ...d, habits: [...d.habits, { id: uid(), name: hName.trim(), log: {} }] })
    setHName('')
  }
  const toggleHabit = (id, day) => {
    if (day > today) return
    commit({
      ...d,
      habits: d.habits.map((h) => (h.id === id ? { ...h, log: { ...h.log, [day]: !h.log[day] } } : h)),
    })
  }
  const delHabit = (id) => commit({ ...d, habits: d.habits.filter((h) => h.id !== id) })
  const habitStreak = (h) => {
    let s = 0
    const dt = new Date()
    if (!h.log[dkey(dt)]) dt.setDate(dt.getDate() - 1) // today not done yet doesn't break the streak
    while (h.log[dkey(dt)]) { s++; dt.setDate(dt.getDate() - 1) }
    return s
  }
  const habitsDoneToday = d ? d.habits.filter((h) => h.log[today]).length : 0

  /* mood */
  const setMood = (id) => commit({ ...d, moods: { ...d.moods, [today]: id } })
  const todayMood = d ? d.moods[today] : null

  if (!d) {
    return (<><Head><title>LifePad · NEEV</title></Head><SiteNav active="lifepad" /><div className="lp-wrap"><div className="lp-empty">opening your pad…</div></div></>)
  }

  const TABS = [['today', '☀️ Today'], ['tasks', `✅ Tasks${openTasks.length ? ` (${openTasks.length})` : ''}`], ['money', '💰 Money'], ['notes', '📝 Notes'], ['habits', '🌱 Habits']]

  return (
    <>
      <Head>
        <title>LifePad — Your Life, Organised · NEEV</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <SiteNav active="lifepad" />
      <div className="lp-wrap fade-in">

        <div className="eyebrow">LifePad <span style={{ color: 'var(--margin-red)' }}>·</span> {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <h1 className="lesson-title">
          {greet()}{d.name ? `, ${d.name}` : ''}.{' '}
          {!d.name && (
            <span style={{ fontSize: '1rem', fontFamily: 'Kalam, cursive', color: 'var(--margin-red)' }}>
              <input className="lp-input" placeholder="what's your name?" style={{ width: 180, display: 'inline-block', marginLeft: 6 }}
                onKeyDown={(e) => { if (e.key === 'Enter' && e.target.value.trim()) commit({ ...d, name: e.target.value.trim() }) }} />
            </span>
          )}
        </h1>

        {oldData && (
          <div className="lp-card fade-in" style={{ border: '2px dashed var(--marigold)', background: 'var(--card)', marginBottom: 14 }}>
            <h3>🎉 Found your old LifePad data on this device!</h3>
            <p style={{ fontSize: '.92rem', color: 'var(--ink-soft)', margin: '4px 0 12px' }}>
              Your earlier data was never deleted — the new LifePad just stores things under a new name.
              Recoverable here: <b>{oldData.tasks} tasks · {oldData.expenses} expenses · {oldData.notes} notes · {oldData.habits} habits · {oldData.moods} mood entries</b>.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="lp-add" onClick={restoreOld}>Restore everything ↻</button>
              <button className="lp-add" style={{ background: 'var(--card)', color: 'var(--ink)', border: '1.5px solid var(--line)' }} onClick={backupAll}>Download backup first 💾</button>
              <button className="t-del" style={{ fontSize: '.8rem' }} onClick={dismissOld}>hide</button>
            </div>
          </div>
        )}
        {restored && (
          <div className="lp-card fade-in" style={{ borderColor: 'var(--good)', background: 'var(--good-bg)', marginBottom: 14 }}>
            ✅ <b>Everything restored!</b> Old tasks, expenses, notes, habits and moods are back — and the original copy is still kept safe as a backup.
          </div>
        )}

        <div className="lp-tabs">
          {TABS.map(([k, l]) => (
            <button key={k} className={`lp-tab${tab === k ? ' on' : ''}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {/* ─── TODAY ─── */}
        {tab === 'today' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="lp-grid">
              <div className="lp-card"><div className="lp-stat-v">{openTasks.length}</div><div className="lp-stat-l">open tasks{dueToday.length ? ` · ${dueToday.length} due` : ''}</div></div>
              <div className="lp-card"><div className="lp-stat-v">{inr(todaySpend)}</div><div className="lp-stat-l">spent today</div></div>
              <div className="lp-card"><div className="lp-stat-v">{habitsDoneToday}/{d.habits.length || 0}</div><div className="lp-stat-l">habits done</div></div>
              <div className="lp-card"><div className="lp-stat-v">{todayMood ? MOODS.find((m) => m.id === todayMood).e : '—'}</div><div className="lp-stat-l">today&apos;s mood</div></div>
            </div>

            <div className="lp-card">
              <h3>How are you feeling?</h3>
              <div className="mood-row">
                {MOODS.map((m) => (
                  <button key={m.id} className={`mood-btn${todayMood === m.id ? ' on' : ''}`} onClick={() => setMood(m.id)} title={m.l}>{m.e}</button>
                ))}
              </div>
            </div>

            <div className="lp-card">
              <h3>Quick add a task</h3>
              <div className="lp-row">
                <input className="lp-input" placeholder="what needs doing?" value={tTitle}
                  onChange={(e) => setTTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} />
                <button className="lp-add" onClick={addTask}>Add</button>
              </div>
            </div>

            <div className="lp-card">
              <h3>On today&apos;s plate</h3>
              {dueToday.length === 0 && openTasks.length === 0 && <div className="lp-empty">nothing pending — enjoy the calm ☕</div>}
              {(dueToday.length ? dueToday : openTasks.slice(0, 5)).map((t) => (
                <div key={t.id} className="task-row" style={{ marginBottom: 8 }}>
                  <button className={`t-check${t.done ? ' on' : ''}`} onClick={() => toggleTask(t.id)}>{t.done ? '✓' : ''}</button>
                  <span className="pri-dot" style={{ background: PRIS.find((p) => p.id === t.pri).c }} />
                  <span className="t-title">{t.title}</span>
                  {t.due && <span className="t-meta" style={t.due < today ? { color: 'var(--bad)' } : {}}>{t.due < today ? 'overdue · ' : ''}{fmtDay(t.due)}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TASKS ─── */}
        {tab === 'tasks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="lp-card">
              <h3>New task</h3>
              <div className="lp-row" style={{ flexWrap: 'wrap' }}>
                <input className="lp-input" style={{ flex: '2 1 200px' }} placeholder="task title" value={tTitle}
                  onChange={(e) => setTTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} />
                <select className="lp-select" value={tPri} onChange={(e) => setTPri(e.target.value)}>
                  {PRIS.map((p) => <option key={p.id} value={p.id}>{p.l}</option>)}
                </select>
                <input type="date" className="lp-select" value={tDue} onChange={(e) => setTDue(e.target.value)} />
                <button className="lp-add" onClick={addTask}>Add task</button>
              </div>
            </div>
            <div className="group-tabs" style={{ marginBottom: 0 }}>
              {[['active', 'Active'], ['done', 'Done'], ['all', 'All']].map(([k, l]) => (
                <button key={k} className={`group-tab${tFilter === k ? ' active' : ''}`} onClick={() => setTFilter(k)}>{l}</button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sortedTasks.filter((t) => tFilter === 'all' || (tFilter === 'done' ? t.done : !t.done)).map((t) => (
                <div key={t.id} className={`task-row${t.done ? ' done-t' : ''}`}>
                  <button className={`t-check${t.done ? ' on' : ''}`} onClick={() => toggleTask(t.id)}>{t.done ? '✓' : ''}</button>
                  <span className="pri-dot" style={{ background: PRIS.find((p) => p.id === t.pri).c }} />
                  <span className="t-title">{t.title}</span>
                  {t.due && <span className="t-meta" style={!t.done && t.due < today ? { color: 'var(--bad)' } : {}}>{fmtDay(t.due)}</span>}
                  <button className="t-del" onClick={() => delTask(t.id)}>🗑</button>
                </div>
              ))}
              {sortedTasks.filter((t) => tFilter === 'all' || (tFilter === 'done' ? t.done : !t.done)).length === 0 && (
                <div className="lp-empty">no tasks here — add one above ✍️</div>
              )}
            </div>
          </div>
        )}

        {/* ─── MONEY ─── */}
        {tab === 'money' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="lp-grid">
              <div className="lp-card"><div className="lp-stat-v">{inr(monthTotal)}</div><div className="lp-stat-l">this month</div></div>
              <div className="lp-card"><div className="lp-stat-v">{inr(todaySpend)}</div><div className="lp-stat-l">today</div></div>
              <div className="lp-card"><div className="lp-stat-v">{monthExp.length}</div><div className="lp-stat-l">entries</div></div>
            </div>
            <div className="lp-card">
              <h3>Add expense</h3>
              <div className="lp-row" style={{ flexWrap: 'wrap' }}>
                <input className="lp-input" style={{ flex: '1 1 90px' }} inputMode="decimal" placeholder="₹ amount" value={eAmt}
                  onChange={(e) => setEAmt(e.target.value.replace(/[^\d.]/g, ''))} onKeyDown={(e) => e.key === 'Enter' && addExp()} />
                <select className="lp-select" value={eCat} onChange={(e) => setECat(e.target.value)}>
                  {ECATS.map((c) => <option key={c.id} value={c.id}>{c.l}</option>)}
                </select>
                <input className="lp-input" style={{ flex: '2 1 140px' }} placeholder="note (optional)" value={eNote}
                  onChange={(e) => setENote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addExp()} />
                <button className="lp-add" onClick={addExp}>Add</button>
              </div>
            </div>
            {byCat.length > 0 && (
              <div className="lp-card">
                <h3>Where it went · {new Date().toLocaleDateString('en-IN', { month: 'long' })}</h3>
                {byCat.map((c) => (
                  <div key={c.id} className="exp-bar-row">
                    <span className="eb-label">{c.l}</span>
                    <span className="eb-track"><i style={{ width: `${(c.total / byCat[0].total) * 100}%`, background: c.c }} /></span>
                    <span className="eb-amt">{inr(c.total)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="lp-card">
              <h3>Recent</h3>
              {d.expenses.slice(0, 12).map((e) => {
                const c = ECATS.find((x) => x.id === e.cat) || ECATS[6]
                return (
                  <div key={e.id} className="task-row" style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: '1.1rem' }}>{c.l.split(' ')[0]}</span>
                    <span className="t-title">{e.note || c.l.split(' ').slice(1).join(' ')}</span>
                    <span className="t-meta">{fmtDay(e.date)}</span>
                    <b style={{ fontSize: '.92rem' }}>{inr(e.amt)}</b>
                    <button className="t-del" onClick={() => delExp(e.id)}>🗑</button>
                  </div>
                )
              })}
              {d.expenses.length === 0 && <div className="lp-empty">no expenses logged yet — track a week and find the leaks 💧</div>}
            </div>
          </div>
        )}

        {/* ─── NOTES ─── */}
        {tab === 'notes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="lp-card">
              <h3>New sticky note</h3>
              <textarea className="lp-input" rows={3} placeholder="capture the thought before it flies…" value={nText} onChange={(e) => setNText(e.target.value)} />
              <div className="lp-row" style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                  {NOTE_COLORS.map((c) => (
                    <button key={c} onClick={() => setNColor(c)}
                      style={{ width: 26, height: 26, borderRadius: 8, background: c, border: nColor === c ? '2.5px solid var(--ink)' : '1.5px solid var(--line)', cursor: 'pointer' }} />
                  ))}
                </div>
                <button className="lp-add" onClick={addNote}>Stick it</button>
              </div>
            </div>
            <div className="note-grid">
              {d.notes.map((n) => (
                <div key={n.id} className="note-card" style={{ background: n.color, '--tilt': `${n.tilt}deg` }}>
                  <button className="n-del" onClick={() => delNote(n.id)}>✕</button>
                  {n.text}
                </div>
              ))}
            </div>
            {d.notes.length === 0 && <div className="lp-empty">an empty corkboard — stick your first note 📌</div>}
          </div>
        )}

        {/* ─── HABITS ─── */}
        {tab === 'habits' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="lp-card">
              <h3>New habit</h3>
              <div className="lp-row">
                <input className="lp-input" placeholder="e.g. 20 minutes of reading" value={hName}
                  onChange={(e) => setHName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addHabit()} />
                <button className="lp-add" onClick={addHabit}>Start</button>
              </div>
            </div>
            {d.habits.map((h) => (
              <div key={h.id} className="habit-row">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b>{h.name}</b>
                  <span className="t-meta">🔥 {habitStreak(h)}-day streak <button className="t-del" onClick={() => delHabit(h.id)}>🗑</button></span>
                </div>
                <div className="habit-days">
                  {last7.map((day) => (
                    <button key={day} className={`habit-day${h.log[day] ? ' hit' : ''}`} onClick={() => toggleHabit(h.id, day)}>
                      <span>{new Date(day + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2)}</span>
                      <span>{day === today ? '●' : day.slice(-2)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {d.habits.length === 0 && <div className="lp-empty">habits compound like money — plant the first seed 🌱</div>}
          </div>
        )}

        <div className="lp-card" style={{ marginTop: 26 }}>
          <h3>💾 Data &amp; backup</h3>
          <p style={{ fontSize: '.85rem', color: 'var(--ink-soft)', marginBottom: 10 }}>
            Everything lives only in this browser. Download a backup file any time — and if you ever used the older LifePad on this device, you can re-import it here.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="lp-add" onClick={backupAll}>Download backup 💾</button>
            {v3Summary(typeof window !== 'undefined' ? readV3() : null) && !d.v3Imported && (
              <button className="lp-add" style={{ background: 'var(--card)', color: 'var(--ink)', border: '1.5px solid var(--line)' }} onClick={restoreOld}>
                Import old LifePad data ↻
              </button>
            )}
          </div>
        </div>
        <div className="hero-note" style={{ marginTop: 20 }}>everything stays on this device — private by design ↷</div>
      </div>
    </>
  )
}
