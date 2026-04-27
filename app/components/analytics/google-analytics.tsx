import Script from "next/script";

/**
 * GA4 loader. No-op unless NEXT_PUBLIC_GA_ID is set, so dev runs and
 * preview deploys stay clean. Strategy "afterInteractive" keeps the
 * script off the critical path.
 */
const GoogleAnalytics = () => {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  if (!id) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
};

export { GoogleAnalytics };
