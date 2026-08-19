import { useState } from 'react';
import { denyConsent, getConsent, grantConsent, isAnalyticsConfigured } from '../analytics';
import { useTranslation } from '../i18n';

export function ConsentBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(() => isAnalyticsConfigured() && getConsent() === null);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t('Згода на використання cookies', 'Cookie consent')}
      className="fixed inset-x-4 bottom-4 z-[1200] mx-auto flex max-w-xl flex-col gap-3 rounded-2xl border border-[#085041]/15 bg-white p-4 shadow-2xl sm:flex-row sm:items-center sm:gap-4 sm:p-5"
    >
      <p className="text-ink-3 flex-1 text-sm leading-5">
        {t(
          'Ми використовуємо cookies для аналітики відвідувань сайту (Google Analytics). Це допомагає нам розуміти, які розділи корисні, а які варто покращити.',
          'We use cookies for site analytics (Google Analytics). This helps us understand which sections are useful and which need improvement.',
        )}
      </p>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => {
            denyConsent();
            setVisible(false);
          }}
          className="border-line hover:bg-soft cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap text-ink transition"
        >
          {t('Відхилити', 'Decline')}
        </button>
        <button
          type="button"
          onClick={() => {
            grantConsent();
            setVisible(false);
          }}
          className="bg-primary cursor-pointer rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap text-white transition hover:opacity-90"
        >
          {t('Погоджуюсь', 'Accept')}
        </button>
      </div>
    </div>
  );
}
