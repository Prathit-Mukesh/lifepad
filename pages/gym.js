import Head from 'next/head'
import SiteNav from '../components/SiteNav'

// Tab 2 — Prajnify: the full cognitive-training app, kept intact as a
// self-contained page (public/prajnify.html) and mounted inside the site shell.
// It manages its own accounts, currencies, streaks and daily session limits
// in localStorage; question pools are drawn fresh every session, every day.
export default function GymPage() {
  return (
    <>
      <Head>
        <title>Prajnify — Brain Training · NEEV</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>
      <SiteNav active="gym" />
      <iframe
        src="/prajnify.html"
        title="Prajnify — Ancient Wisdom · Modern Cognition"
        style={{
          display: 'block',
          width: '100%',
          height: 'calc(100vh - 58px)',
          border: 'none',
          background: '#07071a',
        }}
      />
    </>
  )
}
