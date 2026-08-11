import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import SiteNav from '../components/SiteNav'

/* ───────── store ───────── */
const KEY = 'neev_lifepad_v4'
const blank = () => ({ name: '', tasks: [], expenses: [], notes: [], habits: [], moods: {}, reminders: [], collections: [], inbox: [], holidays: [], gratitude: {} })
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

const COLL_ICONS = ['📋', '🎬', '📚', '✈️', '🎁', '🛍️', '🍽️', '💡', '🎯', '🧳', '🎵', '🌱']
const REM_TYPES = { general: '🔔', birthday: '🎂', bill: '📃', deadline: '⏰', health: '💊' }

// Indian gazetted holidays 2026 (from the original LifePad)
const GOV_HOLIDAYS = [
  { name: 'Republic Day', date: '2026-01-26' }, { name: 'Holi', date: '2026-03-04' },
  { name: 'Id-ul-Fitr', date: '2026-03-21' }, { name: 'Ram Navami', date: '2026-03-26' },
  { name: 'Mahavir Jayanti', date: '2026-03-31' }, { name: 'Good Friday', date: '2026-04-03' },
  { name: 'Buddha Purnima', date: '2026-05-01' }, { name: 'Id-ul-Zuha (Bakrid)', date: '2026-05-27' },
  { name: 'Muharram', date: '2026-06-26' }, { name: 'Independence Day', date: '2026-08-15' },
  { name: 'Milad-un-Nabi', date: '2026-08-26' }, { name: 'Mahatma Gandhi Jayanti', date: '2026-10-02' },
  { name: 'Dussehra', date: '2026-10-20' }, { name: 'Diwali', date: '2026-11-08' },
  { name: 'Guru Nanak Jayanti', date: '2026-11-24' }, { name: 'Christmas', date: '2026-12-25' },
]
const weekday = (iso) => new Date(iso + 'T00:00:00').getDay() // 0 Sun … 6 Sat
const longWeekend = (iso) => {
  const d = weekday(iso)
  if (d === 1 || d === 5) return true            // Mon or Fri → 3-day
  if (d === 2 || d === 4) return 'bridge'        // Tue/Thu → bridge day makes 4
  return false
}

/* ───────── recovery of old LifePad (v3) data ─────────
   The previous LifePad stored everything under localStorage key
   "lifepad_v3". Switching to the new app never deleted it — this reads
   that key and converts it into the current format. The old copy is
   left untouched as a safety net. */
const V3_KEY = 'lifepad_v3'
// Scan ALL localStorage keys for anything that looks like old LifePad data
// (covers lifepad_v3, older variants, renamed keys) and return the richest one.
const readV3 = () => {
  try {
    const direct = JSON.parse(localStorage.getItem(V3_KEY))
    if (direct && typeof direct === 'object') return direct
  } catch { /* fall through to scan */ }
  try {
    let best = null
    let bestScore = 0
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k || k === KEY || !/lifepad|life_pad/i.test(k)) continue
      try {
        const v = JSON.parse(localStorage.getItem(k))
        if (!v || typeof v !== 'object') continue
        const score = (v.tasks?.length || 0) + (v.expenses?.length || 0) + (v.notes?.length || 0)
          + (v.habits?.length || 0) + (v.moodLog?.length || 0) + (v.gratitude?.length || 0)
        if (score > bestScore) { best = v; bestScore = score }
      } catch { /* not JSON */ }
    }
    return best
  } catch { return null }
}

const v3Summary = (v3) => {
  if (!v3) return null
  const counts = {
    tasks: (v3.tasks || []).length,
    expenses: (v3.expenses || []).length,
    notes: (v3.notes || []).length,
    habits: (v3.habits || []).length,
    moods: (v3.moodLog || []).length,
    reminders: (v3.reminders || []).length,
    collections: (v3.collections || []).length,
    inbox: (v3.misc || []).length,
    gratitude: (v3.gratitude || []).length,
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
  ]
  const haveRem = new Set((cur.reminders || []).map((r) => r.id))
  next.reminders = [
    ...(cur.reminders || []),
    ...(v3.reminders || []).filter((r) => r && !haveRem.has(r.id)).map((r) => ({
      id: r.id || uid(),
      title: r.title || 'Reminder',
      date: r.date || dkey(),
      time: r.time || '',
      repeat: r.repeat || 'none',
      type: REM_TYPES[r.type] ? r.type : 'general',
      done: !!r.done,
    })),
  ]
  const haveColl = new Set((cur.collections || []).map((c) => c.id))
  next.collections = [
    ...(cur.collections || []),
    ...(v3.collections || []).filter((c) => c && !haveColl.has(c.id)).map((c) => ({
      id: c.id || uid(),
      name: c.name || 'List',
      icon: c.icon || '📋',
      items: (c.items || []).map((it) => ({
        id: it.id || uid(),
        text: [it.text, it.thoughts].filter(Boolean).join(' — '),
        done: !!it.done,
      })),
    })),
  ]
  const haveInbox = new Set((cur.inbox || []).map((m) => m.id))
  next.inbox = [
    ...(cur.inbox || []),
    ...(v3.misc || []).filter((m) => m && !haveInbox.has(m.id)).map((m) => ({
      id: m.id || uid(),
      text: m.content || '',
      at: Date.parse(m.createdAt) || Date.now(),
    })).filter((m) => m.text),
  ]
  // only import the user's own days off — gazetted holidays are built in
  const haveHol = new Set((cur.holidays || []).map((h) => h.date + h.name))
  next.holidays = [
    ...(cur.holidays || []),
    ...(v3.holidays || [])
      .filter((h) => h && h.type !== 'gazetted' && h.date && !haveHol.has(h.date + h.name))
      .map((h) => ({ id: h.id || uid(), name: h.name || 'Day off', date: h.date })),
  ]
  next.gratitude = {
    ...Object.fromEntries((v3.gratitude || []).filter((g) => g && g.date).map((g) => [g.date, g.text || ''])),
    ...(cur.gratitude || {}),
  }
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

// Merge another v4-shaped dataset into the current one (dedupe by id)
const mergeV4 = (cur, inc) => {
  const merge = (a = [], b = []) => {
    const have = new Set(a.map((x) => x.id))
    return [...a, ...b.filter((x) => x && !have.has(x.id))]
  }
  return {
    ...cur,
    name: cur.name || inc.name || '',
    tasks: merge(cur.tasks, inc.tasks),
    expenses: merge(cur.expenses, inc.expenses),
    notes: merge(cur.notes, inc.notes),
    habits: merge(cur.habits, inc.habits),
    reminders: merge(cur.reminders, inc.reminders),
    collections: merge(cur.collections, inc.collections),
    inbox: merge(cur.inbox, inc.inbox),
    holidays: merge(cur.holidays, inc.holidays),
    moods: { ...(inc.moods || {}), ...cur.moods },
    gratitude: { ...(inc.gratitude || {}), ...(cur.gratitude || {}) },
  }
}

const looksV3 = (o) => o && (Array.isArray(o.moodLog) || 'userName' in o || (o.tasks || []).some((t) => t && 'name' in t && !('title' in t)))
const looksV4 = (o) => o && (o.moods !== undefined || (o.tasks || []).some((t) => t && 'title' in t) || 'name' in o)

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
  const [rTitle, setRTitle] = useState('')
  const [rDate, setRDate] = useState('')
  const [rTime, setRTime] = useState('')
  const [rType, setRType] = useState('general')
  const [cName, setCName] = useState('')
  const [cIcon, setCIcon] = useState('📋')
  const [collInput, setCollInput] = useState({})
  const [iText, setIText] = useState('')
  const [holName, setHolName] = useState('')
  const [holDate, setHolDate] = useState('')
  const [gratText, setGratText] = useState('')

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

  const [importMsg, setImportMsg] = useState(null)
  const importFile = (file) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const raw = JSON.parse(reader.result)
        let cur = load()
        let did = []
        // our backup wrapper
        const v4 = raw.lifepad && looksV4(raw.lifepad) ? raw.lifepad : looksV4(raw) && !looksV3(raw) ? raw : null
        const v3 = raw.oldLifepadV3 || (looksV3(raw) ? raw : null)
        if (v4) { cur = mergeV4(cur, v4); did.push('current-format data') }
        if (v3 && v3Summary(v3)) { cur = migrateV3(v3, cur); did.push('old LifePad data') }
        if (!did.length) { setImportMsg({ ok: false, t: 'That file does not look like a LifePad backup.' }); return }
        cur.v3Imported = true
        commit(cur)
        setOldData(null)
        setImportMsg({ ok: true, t: `Imported ${did.join(' + ')} — everything is back! ✅` })
      } catch {
        setImportMsg({ ok: false, t: 'Could not read that file — is it the .json backup?' })
      }
    }
    reader.readAsText(file)
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

  /* reminders */
  const addReminder = () => {
    if (!rTitle.trim()) return
    commit({ ...d, reminders: [...d.reminders, { id: uid(), title: rTitle.trim(), date: rDate || today, time: rTime, repeat: 'none', type: rType, done: false }] })
    setRTitle(''); setRDate(''); setRTime('')
  }
  const togRem = (id) => commit({ ...d, reminders: d.reminders.map((r) => (r.id === id ? { ...r, done: !r.done } : r)) })
  const delRem = (id) => commit({ ...d, reminders: d.reminders.filter((r) => r.id !== id) })
  const remSorted = d ? [...d.reminders].sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || ''))) : []
  const remOverdue = remSorted.filter((r) => !r.done && r.date < today)
  const remUpcoming = remSorted.filter((r) => !r.done && r.date >= today)
  const remDone = remSorted.filter((r) => r.done)

  /* collections */
  const addColl = () => {
    if (!cName.trim()) return
    commit({ ...d, collections: [...d.collections, { id: uid(), name: cName.trim(), icon: cIcon, items: [] }] })
    setCName('')
  }
  const delColl = (id) => commit({ ...d, collections: d.collections.filter((c) => c.id !== id) })
  const addCollItem = (cid) => {
    const text = (collInput[cid] || '').trim()
    if (!text) return
    commit({ ...d, collections: d.collections.map((c) => (c.id === cid ? { ...c, items: [...c.items, { id: uid(), text, done: false }] } : c)) })
    setCollInput({ ...collInput, [cid]: '' })
  }
  const togCollItem = (cid, iid) => commit({ ...d, collections: d.collections.map((c) => (c.id === cid ? { ...c, items: c.items.map((it) => (it.id === iid ? { ...it, done: !it.done } : it)) } : c)) })
  const delCollItem = (cid, iid) => commit({ ...d, collections: d.collections.map((c) => (c.id === cid ? { ...c, items: c.items.filter((it) => it.id !== iid) } : c)) })

  /* inbox */
  const addInbox = () => {
    if (!iText.trim()) return
    commit({ ...d, inbox: [{ id: uid(), text: iText.trim(), at: Date.now() }, ...d.inbox] })
    setIText('')
  }
  const delInbox = (id) => commit({ ...d, inbox: d.inbox.filter((m) => m.id !== id) })
  const inboxToTask = (m) => commit({
    ...d,
    inbox: d.inbox.filter((x) => x.id !== m.id),
    tasks: [{ id: uid(), title: m.text, pri: 'med', due: null, done: false, at: Date.now() }, ...d.tasks],
  })
  const inboxToNote = (m) => commit({
    ...d,
    inbox: d.inbox.filter((x) => x.id !== m.id),
    notes: [{ id: uid(), text: m.text, color: NOTE_COLORS[d.notes.length % NOTE_COLORS.length], tilt: 0 }, ...d.notes],
  })

  /* holidays */
  const allHolidays = d
    ? [...GOV_HOLIDAYS.map((h) => ({ ...h, id: 'gov-' + h.date, gov: true })), ...d.holidays.map((h) => ({ ...h, gov: false }))]
      .sort((a, b) => a.date.localeCompare(b.date))
    : []
  const addHoliday = () => {
    if (!holName.trim() || !holDate) return
    commit({ ...d, holidays: [...d.holidays, { id: uid(), name: holName.trim(), date: holDate }] })
    setHolName(''); setHolDate('')
  }
  const delHoliday = (id) => commit({ ...d, holidays: d.holidays.filter((h) => h.id !== id) })
  const nextHoliday = allHolidays.find((h) => h.date >= today)

  /* gratitude */
  const saveGrat = () => {
    if (!gratText.trim()) return
    commit({ ...d, gratitude: { ...d.gratitude, [today]: gratText.trim() } })
    setGratText('')
  }
  const gratPast = d ? Object.entries(d.gratitude).filter(([k]) => k !== today).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 3) : []

  if (!d) {
    return (<><Head><title>LifePad · NEEV</title></Head><SiteNav active="lifepad" /><div className="lp-wrap"><div className="lp-empty">opening your pad…</div></div></>)
  }

  const TABS = [
    ['today', '☀️ Today'],
    ['tasks', `✅ Tasks${openTasks.length ? ` (${openTasks.length})` : ''}`],
    ['money', '💰 Money'],
    ['notes', '📝 Notes'],
    ['habits', '🌱 Habits'],
    ['reminders', `🔔 Reminders${remOverdue.length ? ` (${remOverdue.length}!)` : ''}`],
    ['lists', '📋 Lists'],
    ['holidays', '🌴 Holidays'],
    ['inbox', `📎 Inbox${d.inbox.length ? ` (${d.inbox.length})` : ''}`],
  ]

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
              Recoverable here: <b>
                {[
                  oldData.tasks && `${oldData.tasks} tasks`,
                  oldData.expenses && `${oldData.expenses} expenses`,
                  oldData.notes && `${oldData.notes} notes`,
                  oldData.reminders && `${oldData.reminders} reminders`,
                  oldData.collections && `${oldData.collections} collections`,
                  oldData.inbox && `${oldData.inbox} inbox items`,
                  oldData.habits && `${oldData.habits} habits`,
                  oldData.moods && `${oldData.moods} moods`,
                  oldData.gratitude && `${oldData.gratitude} gratitude entries`,
                ].filter(Boolean).join(' · ')}
              </b>.
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
              <h3>🙏 One good thing about today</h3>
              {d.gratitude[today] ? (
                <p style={{ fontFamily: 'Kalam, cursive', fontSize: '1rem', color: 'var(--ink)' }}>{d.gratitude[today]}</p>
              ) : (
                <div className="lp-row">
                  <input className="lp-input" placeholder="what are you grateful for?" value={gratText}
                    onChange={(e) => setGratText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveGrat()} />
                  <button className="lp-add" onClick={saveGrat}>Save</button>
                </div>
              )}
              {gratPast.length > 0 && gratPast.map(([day, text]) => (
                <p key={day} style={{ fontSize: '.82rem', color: 'var(--ink-soft)', marginTop: 6 }}>· {fmtDay(day)}: {text}</p>
              ))}
            </div>

            {nextHoliday && (
              <div className="lp-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.6rem' }}>🌴</span>
                <div style={{ flex: 1 }}>
                  <b>{nextHoliday.name}</b>
                  <div className="t-meta">next holiday · {fmtDay(nextHoliday.date)}{longWeekend(nextHoliday.date) === true ? ' · long weekend! 🎉' : ''}</div>
                </div>
              </div>
            )}

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

        {/* ─── REMINDERS ─── */}
        {tab === 'reminders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="lp-card">
              <h3>New reminder</h3>
              <div className="lp-row" style={{ flexWrap: 'wrap' }}>
                <input className="lp-input" style={{ flex: '2 1 180px' }} placeholder="pay electricity bill…" value={rTitle}
                  onChange={(e) => setRTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addReminder()} />
                <input type="date" className="lp-select" value={rDate} onChange={(e) => setRDate(e.target.value)} />
                <input type="time" className="lp-select" value={rTime} onChange={(e) => setRTime(e.target.value)} />
                <select className="lp-select" value={rType} onChange={(e) => setRType(e.target.value)}>
                  {Object.entries(REM_TYPES).map(([k, ico]) => <option key={k} value={k}>{ico} {k}</option>)}
                </select>
                <button className="lp-add" onClick={addReminder}>Set</button>
              </div>
            </div>
            {remOverdue.length > 0 && (
              <div className="lp-card" style={{ borderColor: 'var(--bad)' }}>
                <h3 style={{ color: 'var(--bad)' }}>Overdue</h3>
                {remOverdue.map((r) => (
                  <div key={r.id} className="task-row" style={{ marginBottom: 8 }}>
                    <button className="t-check" onClick={() => togRem(r.id)} />
                    <span>{REM_TYPES[r.type] || '🔔'}</span>
                    <span className="t-title">{r.title}</span>
                    <span className="t-meta" style={{ color: 'var(--bad)' }}>{fmtDay(r.date)}{r.time ? ` · ${r.time}` : ''}</span>
                    <button className="t-del" onClick={() => delRem(r.id)}>🗑</button>
                  </div>
                ))}
              </div>
            )}
            <div className="lp-card">
              <h3>Upcoming</h3>
              {remUpcoming.length === 0 && <div className="lp-empty">nothing scheduled — peace 🕊️</div>}
              {remUpcoming.map((r) => (
                <div key={r.id} className="task-row" style={{ marginBottom: 8 }}>
                  <button className="t-check" onClick={() => togRem(r.id)} />
                  <span>{REM_TYPES[r.type] || '🔔'}</span>
                  <span className="t-title">{r.title}</span>
                  {r.repeat && r.repeat !== 'none' && <span className="t-meta">↻ {r.repeat}</span>}
                  <span className="t-meta">{fmtDay(r.date)}{r.time ? ` · ${r.time}` : ''}</span>
                  <button className="t-del" onClick={() => delRem(r.id)}>🗑</button>
                </div>
              ))}
            </div>
            {remDone.length > 0 && (
              <div className="lp-card">
                <h3>Done</h3>
                {remDone.slice(0, 8).map((r) => (
                  <div key={r.id} className="task-row done-t" style={{ marginBottom: 8 }}>
                    <button className="t-check on" onClick={() => togRem(r.id)}>✓</button>
                    <span className="t-title">{r.title}</span>
                    <span className="t-meta">{fmtDay(r.date)}</span>
                    <button className="t-del" onClick={() => delRem(r.id)}>🗑</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── LISTS (collections) ─── */}
        {tab === 'lists' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="lp-card">
              <h3>New list</h3>
              <div className="lp-row" style={{ flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {COLL_ICONS.map((ic) => (
                    <button key={ic} onClick={() => setCIcon(ic)}
                      style={{ fontSize: '1.1rem', padding: '6px 8px', borderRadius: 8, border: cIcon === ic ? '2px solid var(--ink)' : '1.5px solid var(--line)', background: 'var(--paper)', cursor: 'pointer' }}>{ic}</button>
                  ))}
                </div>
                <input className="lp-input" style={{ flex: '1 1 160px' }} placeholder="e.g. Movies to watch" value={cName}
                  onChange={(e) => setCName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addColl()} />
                <button className="lp-add" onClick={addColl}>Create</button>
              </div>
            </div>
            {d.collections.length === 0 && <div className="lp-empty">movies, books, bucket list — start any list 📋</div>}
            {d.collections.map((c) => (
              <div key={c.id} className="lp-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: '1.3rem' }}>{c.icon}</span>
                  <b style={{ flex: 1 }}>{c.name}</b>
                  <span className="t-meta">{c.items.filter((i) => i.done).length}/{c.items.length}</span>
                  <button className="t-del" onClick={() => delColl(c.id)}>🗑</button>
                </div>
                {c.items.map((it) => (
                  <div key={it.id} className={`task-row${it.done ? ' done-t' : ''}`} style={{ marginBottom: 6, padding: '9px 12px' }}>
                    <button className={`t-check${it.done ? ' on' : ''}`} onClick={() => togCollItem(c.id, it.id)}>{it.done ? '✓' : ''}</button>
                    <span className="t-title" style={{ fontSize: '.9rem' }}>{it.text}</span>
                    <button className="t-del" onClick={() => delCollItem(c.id, it.id)}>✕</button>
                  </div>
                ))}
                <div className="lp-row" style={{ marginTop: 8 }}>
                  <input className="lp-input" placeholder={`add to ${c.name}…`} value={collInput[c.id] || ''}
                    onChange={(e) => setCollInput({ ...collInput, [c.id]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && addCollItem(c.id)} />
                  <button className="lp-add" onClick={() => addCollItem(c.id)}>Add</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── HOLIDAYS ─── */}
        {tab === 'holidays' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="lp-card">
              <h3>Add your own day off</h3>
              <div className="lp-row" style={{ flexWrap: 'wrap' }}>
                <input className="lp-input" style={{ flex: '2 1 160px' }} placeholder="e.g. Personal leave, Trip to Goa" value={holName}
                  onChange={(e) => setHolName(e.target.value)} />
                <input type="date" className="lp-select" value={holDate} onChange={(e) => setHolDate(e.target.value)} />
                <button className="lp-add" onClick={addHoliday}>Add</button>
              </div>
            </div>
            <div className="lp-card">
              <h3>2026 calendar · {allHolidays.filter((h) => h.date >= today).length} to go</h3>
              {allHolidays.map((h) => {
                const past = h.date < today
                const lw = longWeekend(h.date)
                return (
                  <div key={h.id} className="task-row" style={{ marginBottom: 6, opacity: past ? 0.45 : 1 }}>
                    <span>{h.gov ? '🇮🇳' : '🏖️'}</span>
                    <span className="t-title">{h.name}</span>
                    {lw === true && !past && <span className="t-meta" style={{ color: 'var(--good)', fontWeight: 800 }}>🌴 long weekend</span>}
                    {lw === 'bridge' && !past && <span className="t-meta" style={{ color: 'var(--marigold)' }}>+1 leave = 4 days</span>}
                    <span className="t-meta">{new Date(h.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    {!h.gov && <button className="t-del" onClick={() => delHoliday(h.id)}>🗑</button>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── INBOX ─── */}
        {tab === 'inbox' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="lp-card">
              <h3>Quick dump zone</h3>
              <p style={{ fontSize: '.82rem', color: 'var(--ink-soft)', marginBottom: 8 }}>Capture anything in two seconds — sort it into tasks or notes later.</p>
              <div className="lp-row">
                <input className="lp-input" placeholder="brain dump here…" value={iText}
                  onChange={(e) => setIText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addInbox()} />
                <button className="lp-add" onClick={addInbox}>Drop</button>
              </div>
            </div>
            {d.inbox.length === 0 && <div className="lp-empty">inbox zero — beautiful 📎</div>}
            {d.inbox.map((m) => (
              <div key={m.id} className="task-row">
                <span>📎</span>
                <span className="t-title">{m.text}</span>
                <button className="lp-add" style={{ padding: '6px 10px', fontSize: '.72rem' }} onClick={() => inboxToTask(m)}>→ Task</button>
                <button className="lp-add" style={{ padding: '6px 10px', fontSize: '.72rem', background: 'var(--card)', color: 'var(--ink)', border: '1.5px solid var(--line)' }} onClick={() => inboxToNote(m)}>→ Note</button>
                <button className="t-del" onClick={() => delInbox(m.id)}>🗑</button>
              </div>
            ))}
          </div>
        )}

        <div className="lp-card" style={{ marginTop: 26 }}>
          <h3>💾 Data &amp; backup</h3>
          <p style={{ fontSize: '.85rem', color: 'var(--ink-soft)', marginBottom: 10 }}>
            Everything lives only in this browser. Download a backup file any time, or import one to bring data back.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="lp-add" onClick={backupAll}>Download backup 💾</button>
            <label className="lp-add" style={{ background: 'var(--card)', color: 'var(--ink)', border: '1.5px solid var(--line)', cursor: 'pointer' }}>
              Import backup file 📂
              <input type="file" accept=".json,application/json" style={{ display: 'none' }}
                onChange={(e) => { if (e.target.files?.[0]) importFile(e.target.files[0]); e.target.value = '' }} />
            </label>
            {v3Summary(typeof window !== 'undefined' ? readV3() : null) && !d.v3Imported && (
              <button className="lp-add" style={{ background: 'var(--card)', color: 'var(--ink)', border: '1.5px solid var(--line)' }} onClick={restoreOld}>
                Import old LifePad data ↻
              </button>
            )}
          </div>
          {importMsg && (
            <p style={{ fontSize: '.85rem', fontWeight: 700, marginTop: 10, color: importMsg.ok ? 'var(--good)' : 'var(--bad)' }}>{importMsg.t}</p>
          )}
          <p style={{ fontSize: '.78rem', color: 'var(--ink-soft)', marginTop: 12, lineHeight: 1.7 }}>
            🔎 <b>Looking for older data?</b> Browser data stays with the exact <b>link + browser + device</b> where it was saved.
            Open the same link you used before, in the same browser — a &quot;Found your old LifePad data&quot; banner will appear there automatically.
            Then tap <i>Download backup</i> on that page and <i>Import backup file</i> here to carry everything over.
          </p>
        </div>
        <div className="hero-note" style={{ marginTop: 20 }}>everything stays on this device — private by design ↷</div>
      </div>
    </>
  )
}
