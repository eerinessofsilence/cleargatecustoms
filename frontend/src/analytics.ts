const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

function isEnabled() {
  return Boolean(MEASUREMENT_ID) && import.meta.env.PROD;
}

export function initAnalytics() {
  if (!isEnabled()) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID);
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (!isEnabled()) return;
  window.gtag('event', name, params);
}
