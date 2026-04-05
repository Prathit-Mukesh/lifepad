import dynamic from 'next/dynamic'
import Head from 'next/head'

const LifePadApp = dynamic(() => import('../components/LifePadApp'), {
  ssr: false,
  loading: () => (
    <div style={{
      minHeight: '100vh',
      background: '#07080D',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Outfit, sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '20px',
          background: 'linear-gradient(135deg, #7C6AFF, #5B4AD0, #8B5CF6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', fontSize: '30px',
          boxShadow: '0 6px 24px rgba(124,106,255,0.3)',
        }}>✨</div>
        <div style={{ color: '#EAEAF2', fontSize: '20px', fontWeight: 700 }}>LifePad</div>
        <div style={{ color: '#555570', fontSize: '13px', marginTop: '4px' }}>Loading...</div>
      </div>
    </div>
  ),
})

export default function HomePage() {
  return (
    <>
      <Head>
        <title>LifePad — Your Personal Life Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
      </Head>
      <LifePadApp />
    </>
  )
}
