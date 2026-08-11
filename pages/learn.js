import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import SiteNav from '../components/SiteNav'
import {
  GROUPS, getGroup, buildChapterQuestions, chapterTopicNotes, QUESTIONS_PER_CHAPTER,
} from '../lib/curriculum'
import { loadLearn, saveLearn } from '../lib/store'

export default function LearnPage() {
  const [progress, setProgress] = useState({})
  const [groupId, setGroupId] = useState('class6')
  const [chapterIdx, setChapterIdx] = useState(null) // null = group view
  const [variant, setVariant] = useState(0)
  const [answers, setAnswers] = useState([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const p = loadLearn()
    setProgress(p)
    if (p.lastGroup && getGroup(p.lastGroup)) setGroupId(p.lastGroup)
    setReady(true)
  }, [])

  const group = getGroup(groupId)
  const chapter = chapterIdx !== null ? group.chapters[chapterIdx] : null
  const questions = useMemo(
    () => (chapter ? buildChapterQuestions(groupId, chapterIdx, variant) : []),
    [groupId, chapterIdx, variant, chapter]
  )

  const groupProgress = progress[groupId] || {}
  const doneCount = (gid) => {
    const gp = progress[gid] || {}
    return Object.keys(gp).filter((k) => gp[k] && gp[k].total).length
  }

  const pickGroup = (gid) => {
    setGroupId(gid)
    setChapterIdx(null)
    const next = { ...progress, lastGroup: gid }
    setProgress(next)
    saveLearn(next)
  }

  const openChapter = (idx) => {
    setChapterIdx(idx)
    setVariant(0)
    setAnswers(new Array(QUESTIONS_PER_CHAPTER).fill(null))
    if (typeof window !== 'undefined') window.scrollTo(0, 0)
  }

  const answer = (qi, oi) => {
    if (answers[qi] !== null) return
    const next = answers.slice()
    next[qi] = oi
    setAnswers(next)
    if (next.every((a) => a !== null)) {
      const score = questions.reduce((n, q, i) => n + (next[i] === q.c ? 1 : 0), 0)
      const gp = { ...(progress[groupId] || {}) }
      const prev = gp[chapterIdx]
      if (!prev || score > prev.score) gp[chapterIdx] = { score, total: questions.length, at: Date.now() }
      const nextP = { ...progress, [groupId]: gp, lastGroup: groupId }
      setProgress(nextP)
      saveLearn(nextP)
    }
  }

  const practiceAgain = (fresh) => {
    if (fresh) setVariant((v) => v + 1)
    setAnswers(new Array(QUESTIONS_PER_CHAPTER).fill(null))
    if (typeof window !== 'undefined') window.scrollTo(0, 0)
  }

  const answeredCount = answers.filter((a) => a !== null).length
  const allAnswered = questions.length > 0 && answeredCount === questions.length
  const score = allAnswered ? questions.reduce((n, q, i) => n + (answers[i] === q.c ? 1 : 0), 0) : 0

  return (
    <>
      <Head>
        <title>Learn — NEEV</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <SiteNav active="learn" />

      {chapterIdx === null ? (
        <>
          <section className="hero">
            <div className="hero-inner compact fade-in">
              <div className="eyebrow">The Foundation Curriculum <span className="dot">·</span> pick your stage of life</div>
              <h1 className="hero-title">Learn the things that <mark>never expire</mark>.</h1>
              <p className="hero-sub">
                Ten paths, one idea: train the thinking that survives every new tool.
                Each chapter is {QUESTIONS_PER_CHAPTER} questions with full reasoning — no marks, no pressure, mistakes are data.
              </p>
            </div>
          </section>

          <section className="section tight">
            <div className="group-tabs" role="tablist" aria-label="Learning paths">
              {GROUPS.map((g) => (
                <button
                  key={g.id}
                  role="tab"
                  aria-selected={g.id === groupId}
                  className={`group-tab${g.id === groupId ? ' active' : ''}`}
                  onClick={() => pickGroup(g.id)}
                >
                  {g.kind === 'school' ? `Class ${g.short}` : g.name}
                </button>
              ))}
            </div>

            <p className="group-tagline">{group.tagline} ↷</p>
            <div className="section-head" style={{ marginBottom: 18 }}>
              <h2>{group.name}</h2>
              <span className="count">
                {ready ? `${doneCount(groupId)}/${group.chapters.length} chapters done` : `${group.chapters.length} chapters`}
                {' · '}{group.chapters.length * QUESTIONS_PER_CHAPTER} questions
              </span>
            </div>

            <div className="track-grid">
              {group.chapters.map((c, i) => {
                const p = groupProgress[i]
                const pct = p ? Math.round((p.score / p.total) * 100) : 0
                return (
                  <button key={i} className="track-card fade-in" onClick={() => openChapter(i)}>
                    <span className="chip" style={{ background: group.color }}>{i + 1}</span>
                    <h3>{c.title}</h3>
                    <p className="tag">{c.blurb}</p>
                    <div className="track-meta">
                      <span className="mini-bar"><i style={{ width: `${pct}%`, background: group.color }} /></span>
                      {p
                        ? <span className="done-badge">✓ {p.score}/{p.total}</span>
                        : <span>{QUESTIONS_PER_CHAPTER} Qs · Start →</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        </>
      ) : (
        <div className="lesson-wrap fade-in">
          <button className="back-link" onClick={() => setChapterIdx(null)}>← {group.name} · all chapters</button>
          <div>
            <span className="lesson-track-chip" style={{ background: group.color }}>
              {group.name} · Chapter {chapterIdx + 1} of {group.chapters.length}
            </span>
            <h2 className="lesson-title">{chapter.title}</h2>
            <div className="lesson-mins">⏱ {QUESTIONS_PER_CHAPTER} questions · answer at your pace · every answer explains itself</div>
          </div>

          <div className="trains">
            <h4>✏️ what this chapter trains</h4>
            {chapterTopicNotes(chapter).map((note, i) => <p key={i}>{note}</p>)}
          </div>

          <div className="quiz">
            <div className="quiz-progress">
              <span>{answeredCount}/{questions.length}</span>
              <span className="bar"><i style={{ width: `${(answeredCount / Math.max(1, questions.length)) * 100}%` }} /></span>
              {groupProgress[chapterIdx] && (
                <span style={{ color: 'var(--good)' }}>best {groupProgress[chapterIdx].score}/{groupProgress[chapterIdx].total}</span>
              )}
            </div>

            {questions.map((Q, qi) => {
              const chosen = answers[qi]
              return (
                <div className="q-card" key={`${variant}-${qi}`}>
                  <div className="q-text"><span className="q-num">{qi + 1}.</span>{Q.q}</div>
                  <div className="opts">
                    {Q.o.map((o, oi) => {
                      let cls = 'opt'
                      if (chosen !== null) {
                        if (oi === Q.c) cls += ' correct'
                        else if (oi === chosen) cls += ' wrong'
                        else cls += ' faded'
                      }
                      return (
                        <button key={oi} className={cls} disabled={chosen !== null} onClick={() => answer(qi, oi)}>
                          {o}
                        </button>
                      )
                    })}
                  </div>
                  {chosen !== null && <div className="q-why">{Q.why}</div>}
                </div>
              )
            })}

            {allAnswered && (
              <div className="quiz-result">
                <div>
                  <div className="score">Chapter complete · {score}/{questions.length}</div>
                  <div className="sub">
                    {score === questions.length ? 'Perfect. This one is yours now.'
                      : score >= Math.ceil(questions.length * 0.7) ? 'Solid. Revisit the marked answers once.'
                      : 'Good attempt — read the explanations, then try a fresh set.'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="next-btn ghost" onClick={() => practiceAgain(true)}>Fresh set ↻</button>
                  {chapterIdx < group.chapters.length - 1 ? (
                    <button className="next-btn" onClick={() => openChapter(chapterIdx + 1)}>Next chapter →</button>
                  ) : (
                    <button className="next-btn" onClick={() => setChapterIdx(null)}>Back to {group.name} →</button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="site-footer">
        <div className="fm">NEEV · The Foundation Curriculum</div>
        <div>Ten paths · {GROUPS.reduce((n, g) => n + g.chapters.length, 0)} chapters · every answer explained</div>
      </footer>
    </>
  )
}
