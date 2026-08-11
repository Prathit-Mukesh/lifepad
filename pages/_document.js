import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#F9F8F3" />
        <meta name="description" content="NEEV — skills that never expire. A learning home for Class 6–12, college students and adults: foundation chapters, a daily cognitive gym, and the LifePad personal dashboard." />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Young+Serif&family=Public+Sans:wght@400;500;600;700;800&family=Kalam:wght@400;700&family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
