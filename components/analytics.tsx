"use client"

import Script from "next/script"

// NEXT_PUBLIC_ vars are inlined into the JS bundle at `next build` time (this
// is a static export - there's no server to read env vars at request time),
// so this ID only takes effect once it's set as a GitHub Actions secret and
// the site is rebuilt/redeployed - see .github/workflows/deploy.yml.
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export function Analytics() {
  if (!GA_MEASUREMENT_ID) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  )
}
