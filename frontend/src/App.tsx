import { useEffect, useState } from 'react';
import { Phone } from 'lucide-react';
import { Calculator } from './components/Calculator';
import { ConsentBanner } from './components/ConsentBanner';
import { ContactModal } from './components/ContactModal';
import { QuickContactModal } from './components/QuickContactModal';
import { CoverageMap } from './components/CoverageMap';
import { Faq } from './components/Faq';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { Header } from './components/Header';
import { Intro } from './components/Intro';
import { MissionValues } from './components/MissionValues';
import { Partners } from './components/Partners';
import { Process } from './components/Process';
import { Services } from './components/Services';
import { Testimonials } from './components/Testimonials';
import { useReveal } from './hooks/useReveal';
import type { CalculatorQuote } from './types';
import { useTranslation } from './i18n';

export function App() {
  const { t } = useTranslation();
  const [contactQuote, setContactQuote] = useState<CalculatorQuote | null>(null);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [isQuickContactOpen, setIsQuickContactOpen] = useState(false);
  useReveal();

  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      const hash = link?.getAttribute('href');
      if (!hash || hash === '#') return;

      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (!target) return;

      event.preventDefault();
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      window.history.pushState(null, '', hash);
    };

    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  return (
    <>
      <Header onRequestConsultation={() => setIsConsultationOpen(true)} />
      <Hero onRequestConsultation={() => setIsConsultationOpen(true)} />
      <main>
        <MissionValues />
        <Services onRequestConsultation={() => setIsConsultationOpen(true)} />
        <Intro />
        <Calculator
          onContact={(quote) => {
            setContactQuote(quote);
            setIsConsultationOpen(true);
          }}
        />
        <Process />
        <Testimonials />
        <Partners />
        <CoverageMap />
        <Faq />
      </main>
      <Footer onRequestConsultation={() => setIsConsultationOpen(true)} />
      {!isConsultationOpen && contactQuote === null && !isQuickContactOpen && (
        <button
          type="button"
          aria-label={t('Відкрити контактну форму', 'Open contact form')}
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-[900] grid size-14 cursor-pointer place-items-center rounded-full border border-[#085041]/15 bg-[#1d9e75] text-white shadow-[0_10px_28px_rgba(8,80,65,0.24)] transition hover:-translate-y-0.5 hover:bg-[#085041] hover:shadow-[0_14px_32px_rgba(8,80,65,0.3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#085041] sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))] sm:left-6"
          onClick={() => setIsQuickContactOpen(true)}
        >
          <Phone size={25} strokeWidth={2.4} aria-hidden="true" />
        </button>
      )}
      <ContactModal
        isOpen={contactQuote !== null || isConsultationOpen}
        quote={contactQuote}
        onClose={() => {
          setContactQuote(null);
          setIsConsultationOpen(false);
        }}
      />
      <QuickContactModal isOpen={isQuickContactOpen} onClose={() => setIsQuickContactOpen(false)} />
      <ConsentBanner />
    </>
  );
}
