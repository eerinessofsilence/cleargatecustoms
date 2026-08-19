const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
const CONSENT_KEY = 'cg-analytics-consent';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

let initialized = false;

function isConfigured() {
  return Boolean(MEASUREMENT_ID) && import.meta.env.PROD;
}

export function isAnalyticsConfigured() {
  return isConfigured();
}

export function getConsent(): 'granted' | 'denied' | null {
  const value = localStorage.getItem(CONSENT_KEY);
  return value === 'granted' || value === 'denied' ? value : null;
}

function loadGtag() {
  if (!isConfigured() || initialized) return;
  initialized = true;

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

export function initAnalyticsIfConsented() {
  if (getConsent() === 'granted') loadGtag();
}

export function grantConsent() {
  localStorage.setItem(CONSENT_KEY, 'granted');
  loadGtag();
}

export function denyConsent() {
  localStorage.setItem(CONSENT_KEY, 'denied');
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (!isConfigured() || !initialized) return;
  window.gtag('event', name, params);
}
