/** @type {import('next').NextConfig} */
// GITHUB_PAGES=true is set by the deploy workflow: it switches on static
// export and the /lifepad base path that GitHub Pages serves the site under.
const isPages = process.env.GITHUB_PAGES === 'true'

const nextConfig = {
  reactStrictMode: true,
  ...(isPages
    ? {
        output: 'export',
        basePath: '/lifepad',
        assetPrefix: '/lifepad/',
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
}

module.exports = nextConfig
