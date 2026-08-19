import { Phone, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { getContent } from '../data/content';
import { useTranslation } from '../i18n';
import { trackEvent } from '../analytics';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function QuickContactModal({ isOpen, onClose }: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { language, t } = useTranslation();
  const { directContact } = getContent(language);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => closeButtonRef.current?.focus(), 50);

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="bg-primary/55 fixed inset-0 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm sm:p-5"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-contact-title"
        className="relative w-full max-w-[430px] rounded-[24px] bg-white p-5 shadow-2xl sm:p-7"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label={t('Закрити', 'Close')}
          className="bg-soft hover:bg-line absolute top-5 right-5 grid size-9 cursor-pointer place-items-center rounded-full transition sm:top-7 sm:right-7"
        >
          <X size={18} strokeWidth={2.4} />
        </button>

        <div className="flex items-center gap-4 pr-11">
          <div>
            <h2 id="quick-contact-title" className="mt-1 text-xl font-bold tracking-tight">
              {directContact.personName}
            </h2>
            <p className="text-ink-3 mt-0.5 text-sm">{directContact.position}</p>
          </div>
        </div>

        <p className="text-ink-3 mt-6 text-sm leading-5">
          {t("Оберіть зручний спосіб зв'язку — відповімо якнайшвидше.", 'Choose a convenient way to contact us—we will reply as soon as possible.')}
        </p>

        <div className="mt-4 grid gap-2.5">
          <a
            href={directContact.phoneHref}
            onClick={() => trackEvent('contact_click', { method: 'phone' })}
            className="group border-primary/20 flex items-center gap-3 rounded-2xl border bg-white p-3.5 transition hover:bg-[#f4faf7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#085041]"
          >
            <span className="bg-primary grid size-10 place-items-center rounded-xl text-white">
              <Phone size={20} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{t('Мобільний телефон', 'Mobile phone')}</span>
              <span className="text-ink-3 block text-xs">{directContact.phone}</span>
            </span>
          </a>
          {directContact.channels.map((channel) => {
            return (
              <a
                key={channel.name}
                href={channel.href}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackEvent('contact_click', { method: channel.name.toLowerCase() })}
                className="group border-line hover:border-primary/25 flex items-center gap-3 rounded-2xl border p-3.5 transition hover:bg-[#f4faf7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#085041]"
              >
                <img src={channel.icon} alt="" className="size-10 shrink-0 object-contain" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{channel.name}</span>
                  <span className="text-ink-3 block truncate text-xs">{channel.label}</span>
                </span>
              </a>
            );
          })}
        </div>
      </section>
    </div>
  );
}
