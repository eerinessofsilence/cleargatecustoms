import { Camera, ChevronLeft, ChevronRight, Phone, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ApiError, calculateQuote, getUsdExchangeRate } from '../api/client';
import { trackEvent } from '../analytics';
import { getContent } from '../data/content';
import { useTranslation } from '../i18n';
import type { CalculatorQuote, ExchangeRateResult, QuoteResult } from '../types';
import { Button } from './ui/Button';
import { PricePicker } from './ui/PricePicker';
import { ProductCodeFinderModal } from './ProductCodeFinderModal';

type Props = {
  onContact: (quote: CalculatorQuote | null) => void;
};

type RateStatus = 'loading' | 'success' | 'error';

const productCodePattern = /^\d{10}$/;

const formatMoney = (value: number | undefined, language: string) =>
  value === undefined ? '—' : `${Math.round(value).toLocaleString(language === 'en' ? 'en-US' : 'uk-UA')} ₴`;

const formatRateDate = (value: string) => {
  const [year, month, day] = value.split('-');
  return `${day}.${month}.${year}`;
};

const formatRate = (value: number, language: string) =>
  value.toLocaleString(language === 'en' ? 'en-US' : 'uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function ProductCategories() {
  const { language, t } = useTranslation();
  const { productCategories } = getContent(language);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canMoveBack, setCanMoveBack] = useState(false);
  const [canMoveForward, setCanMoveForward] = useState(true);

  const updateControls = () => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    setCanMoveBack(carousel.scrollLeft > 4);
    setCanMoveForward(carousel.scrollLeft + carousel.clientWidth < carousel.scrollWidth - 4);
  };

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    updateControls();
    carousel.addEventListener('scroll', updateControls, { passive: true });
    window.addEventListener('resize', updateControls);

    return () => {
      carousel.removeEventListener('scroll', updateControls);
      window.removeEventListener('resize', updateControls);
    };
  }, []);

  const moveCarousel = (direction: -1 | 1) => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    carousel.scrollBy({ left: direction * carousel.clientWidth * 0.82, behavior: 'smooth' });
  };

  return (
    <section id="categories" className="bg-soft scroll-mt-28 py-20 md:scroll-mt-32 md:py-24">
      <div className="page-wrap">
        <div className="mx-auto max-w-3xl text-center" data-reveal>
          <span className="section-tag">
            <span className="section-index">06 /</span>&nbsp; {t('Категорії товарів', 'Product categories')}
          </span>
          <h2 className="mt-4 text-2xl leading-tight font-bold tracking-tight sm:text-3xl">
            {t('Основні товарні групи, з якими ми працюємо', 'Core product groups we work with')}
          </h2>
          <p className="text-ink-3 mt-3 text-base leading-6 text-balance sm:text-lg sm:leading-7">
            {t('Оформлюємо регулярні та разові поставки цих категорій з Китаю та Європи.', 'We clear recurring and one-off shipments in these categories from China and Europe.')}
          </p>
        </div>
        <div className="mt-10 flex items-center justify-end gap-2 sm:mt-12" data-reveal>
          <button
            type="button"
            className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-[#085041]/20 bg-white text-[#085041] transition hover:border-[#085041] hover:bg-[#085041] hover:text-white disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-[#085041]/20 disabled:hover:bg-white disabled:hover:text-[#085041]"
            aria-label={t('Попередні категорії', 'Previous categories')}
            disabled={!canMoveBack}
            onClick={() => moveCarousel(-1)}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-[#085041]/20 bg-white text-[#085041] transition hover:border-[#085041] hover:bg-[#085041] hover:text-white disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-[#085041]/20 disabled:hover:bg-white disabled:hover:text-[#085041]"
            aria-label={t('Наступні категорії', 'Next categories')}
            disabled={!canMoveForward}
            onClick={() => moveCarousel(1)}
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>
        <div
          ref={carouselRef}
          className="-mx-5 mt-4 flex snap-x snap-mandatory [scrollbar-width:none] gap-4 overflow-x-auto px-5 pb-3 sm:-mx-7 sm:px-7 md:-mx-10 md:px-10 lg:-mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
          data-reveal
        >
          {productCategories.map(({ image, label }) => (
            <article
              key={label}
              className="group bg-primary relative flex aspect-[4/3] min-h-52 w-[82vw] shrink-0 snap-start overflow-hidden rounded-2xl border border-[#9fe1cb]/60 p-5 shadow-[0_10px_24px_rgba(22,34,30,0.1)] sm:w-[min(52vw,25rem)] lg:w-[calc((100%-2rem)/3)]"
            >
              <img
                src={image}
                alt=""
                loading="lazy"
                className="absolute inset-0 size-full object-cover transition duration-500 ease-out group-hover:scale-[1.04]"
              />
              <span
                className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,21,18,0.12)_0%,rgba(12,21,18,0.9)_100%)]"
                aria-hidden="true"
              />
              <div className="relative z-10 mt-auto flex w-full flex-col items-start gap-3">
                <span className="max-w-[24ch] text-lg leading-6 font-bold text-white">{label}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Calculator({ onContact }: Props) {
  const { language, t } = useTranslation();
  const [productCode, setProductCode] = useState('');
  const [weightKg, setWeightKg] = useState(100);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRateResult | null>(null);
  const [rateStatus, setRateStatus] = useState<RateStatus>('loading');
  const [rateRequestId, setRateRequestId] = useState(0);
  const [isCodeFinderOpen, setIsCodeFinderOpen] = useState(false);
  const [remoteResult, setRemoteResult] = useState<{ key: string; value: QuoteResult } | null>(
    null,
  );
  const [remoteError, setRemoteError] = useState<{ key: string; message: string } | null>(null);
  const hasValidCode = productCodePattern.test(productCode);
  const calculationKey = `${productCode}:${weightKg}:${exchangeRate?.rate ?? ''}`;
  const result = remoteResult?.key === calculationKey ? remoteResult.value : null;
  const quoteError = remoteError?.key === calculationKey ? remoteError.message : '';

  useEffect(() => {
    let isActive = true;

    getUsdExchangeRate()
      .then((value) => {
        if (!isActive) return;
        setExchangeRate(value);
        setRateStatus('success');
      })
      .catch(() => {
        if (!isActive) return;
        setExchangeRate(null);
        setRateStatus('error');
      });

    return () => {
      isActive = false;
    };
  }, [rateRequestId]);

  useEffect(() => {
    if (!hasValidCode || weightKg <= 0 || exchangeRate === null) {
      return;
    }

    let isActive = true;
    const requestKey = `${productCode}:${weightKg}:${exchangeRate.rate}`;
    const timer = window.setTimeout(() => {
      calculateQuote({ productCode, weightKg, currencyRate: exchangeRate.rate })
        .then((value) => {
          if (!isActive) return;
          setRemoteResult({ key: requestKey, value });
          setRemoteError(null);
          trackEvent('calculate_quote', { product_code: productCode, weight_kg: weightKg });
        })
        .catch((error: unknown) => {
          if (!isActive) return;
          setRemoteError({
            key: requestKey,
            message:
              error instanceof ApiError
                ? error.message
                : t('Не вдалося виконати розрахунок. Перевірте з’єднання і спробуйте ще раз.', 'Could not calculate the estimate. Check your connection and try again.'),
          });
        });
    }, 300);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [exchangeRate, hasValidCode, productCode, t, weightKg]);

  return (
    <>
      <section
        id="calc"
        className="customs-surface scroll-mt-28 bg-white py-14 md:scroll-mt-32 md:py-24"
      >
        <div className="page-wrap">
          <div
            className="customs-document-shell grid overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_rgba(22,34,30,0.1)] lg:grid-cols-[1.05fr_0.95fr]"
            data-reveal
          >
            <div className="customs-document-page min-w-0 p-5 sm:p-7 md:p-11">
              <div className="mb-6 box-content flex min-h-8 flex-wrap items-center justify-between gap-3 pb-4 sm:mb-7">
                <span className="section-tag">
                  <span className="section-index">05 /</span>&nbsp; {t('Розрахунок', 'Estimate')}
                </span>
                <span className="technical-label hidden text-[#085041]/50 sm:inline">
                  CGC-CALC / UA-2026
                </span>
              </div>
              <h2 className="mt-4 text-3xl leading-[1.05] font-bold tracking-tight">
                {t('Калькулятор митних платежів', 'Customs charges calculator')}
              </h2>
              <p className="text-ink-3 mt-2 text-base leading-6 text-balance sm:text-lg sm:leading-7">
                {t('Вкажіть код УКТ ЗЕД і вагу вантажу.', 'Enter the UKT ZED code and cargo weight.')}
              </p>
              <div className="mt-6 sm:mt-7">
                <label className="field-label" htmlFor="productCode">
                  <span className="field-index" aria-hidden="true">
                    01
                  </span>
                  {t('Код УКТ ЗЕД', 'UKT ZED code')}
                </label>
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-stretch">
                  <input
                    id="productCode"
                    value={productCode}
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={10}
                    className="field-control min-w-0 flex-1"
                    placeholder={t('Наприклад, 0202309000', 'For example, 0202309000')}
                    onChange={(event) =>
                      setProductCode(event.target.value.replace(/\D/g, '').slice(0, 10))
                    }
                  />
                  <Button
                    type="button"
                    icon={Camera}
                    variant="outline"
                    size="compact"
                    className="action-pill-flat w-full shrink-0 self-stretch sm:w-auto"
                    onClick={() => setIsCodeFinderOpen(true)}
                  >
                    <span className="sm:hidden">{t('За фото', 'By photo')}</span>
                    <span className="hidden sm:inline">{t('Визначити за фото', 'Identify by photo')}</span>
                  </Button>
                </div>
                <p
                  className={`mt-2 text-xs leading-5 ${
                    productCode.length > 0 && !hasValidCode ? 'text-[#9a3412]' : 'text-ink-3'
                  }`}
                >
                  {productCode.length > 0 && !hasValidCode
                    ? t('Введіть 10 цифр коду УКТ ЗЕД.', 'Enter all 10 digits of the UKT ZED code.')
                    : t('Розрахунок доступний для кодів із одиницею виміру «кг».', 'The calculator is available for codes measured in kg.')}
                </p>
              </div>
              <div className="mt-5">
                <label className="field-label" htmlFor="weightKg">
                  <span className="field-index" aria-hidden="true">
                    02
                  </span>
                  {t('Вага вантажу, кг', 'Cargo weight, kg')}
                </label>
                <PricePicker
                  id="weightKg"
                  value={weightKg}
                  min={0}
                  step={1}
                  onChange={setWeightKg}
                />
              </div>
              <div className="mt-2">
                <div className="min-h-5 text-xs leading-5" aria-live="polite">
                  {rateStatus === 'loading' && (
                    <p className="text-ink-3 flex items-center gap-2" role="status">
                      <RefreshCw className="animate-spin" size={13} aria-hidden="true" />
                      {t('Отримуємо актуальний курс НБУ…', 'Fetching the current NBU exchange rate…')}
                    </p>
                  )}
                  {rateStatus === 'error' && (
                    <p className="text-[#9a3412]" role="alert">
                      {t('Курс НБУ тимчасово недоступний. ', 'The NBU exchange rate is temporarily unavailable. ')}
                      <button
                        type="button"
                        className="cursor-pointer font-semibold underline underline-offset-2"
                        onClick={() => {
                          setRateStatus('loading');
                          setRateRequestId((current) => current + 1);
                        }}
                      >
                        {t('Спробувати ще раз', 'Try again')}
                      </button>
                    </p>
                  )}
                  {rateStatus === 'success' && exchangeRate && (
                    <p className="technical-label text-[#085041]/60" role="status">
                      USD: {formatRate(exchangeRate.rate, language)} ₴ · {t('курс USD НБУ на', 'NBU USD rate for')}{' '}
                      {formatRateDate(exchangeRate.exchangeDate)}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-ink-3/80 mt-5 text-xs leading-5">
                {t('Для кодів із кількісною одиницею виміру потрібен окремий розрахунок. Ставка ввізного мита визначається за кодом УКТ ЗЕД; ПДВ — 20%.', 'Codes with another quantity unit require a separate calculation. The import duty rate is determined by the UKT ZED code; VAT is 20%.')}
              </p>
              {quoteError && (
                <p className="mt-3 rounded-lg border border-[#d85a30]/30 bg-[#faece7] px-3 py-2 text-xs leading-5 text-[#712b13]">
                  {quoteError}
                </p>
              )}
            </div>
            <div
              className="bg-primary relative flex min-w-0 flex-col overflow-hidden border-t border-white/10 p-5 text-white sm:p-7 md:p-11 lg:border-t-0"
              aria-busy={hasValidCode && exchangeRate !== null && result === null && !quoteError}
            >
              <div className="relative z-10 mb-4 box-content flex min-h-8 flex-col items-start gap-1 border-b border-white/10 pb-4 sm:mb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-x-3">
                <span className="technical-label whitespace-nowrap text-white/45">
                  {t('Попередній розрахунок', 'Preliminary estimate')}
                </span>
                <span className="technical-label whitespace-nowrap text-[#9fe1cb]/70">
                  {t('Статус / орієнтовний', 'Status / estimated')}
                </span>
              </div>
              <div className="relative z-10 flex flex-1 flex-col justify-center py-8 sm:py-12">
                <span className="technical-label text-[#9fe1cb]/70">{t('Митні платежі', 'Customs charges')}</span>
                <h3 className="mt-3 max-w-[20ch] text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
                  {t('Орієнтовна сума платежів', 'Estimated total charges')}
                </h3>
                <strong className="text-mint font-accent mt-5 text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
                  {formatMoney(result?.total, language)}
                </strong>
              </div>
              <Button
                icon={Phone}
                variant="primary"
                className="relative z-10 mt-2 w-full gap-3 self-stretch py-2.5 pr-2.5 pl-4 text-left sm:w-auto sm:gap-8 sm:self-start sm:pl-6 [&>span:first-child]:leading-5 [&>span:first-child]:whitespace-normal sm:[&>span:first-child]:whitespace-nowrap"
                onClick={() => {
                  onContact(
                    result
                      ? {
                          productCode: result.productCode,
                          weightKg: result.weightKg,
                          criticalPriceUsdPerKg: result.criticalPriceUsdPerKg,
                          customsValueUsd: result.customsValueUsd,
                          total: result.total,
                        }
                      : null,
                  );
                }}
              >
                {t('Запросити точний розрахунок', 'Request an exact estimate')}
              </Button>
            </div>
          </div>
          <p className="text-ink-3 mx-auto mt-6 max-w-2xl text-center text-xs leading-5 text-balance">
            {t('У розрахунку використовується пільгова ставка з Митного тарифу України. Странова преференція, зокрема 0%, не застосовується без підтвердженої країни походження та належного документа. Розрахунок має інформативний характер.', 'The estimate uses the preferential rate from Ukraine’s Customs Tariff. A country preference, including 0%, is not applied without confirmed origin and the relevant document. This calculation is for information only.')}
          </p>
        </div>
      </section>
      <ProductCategories />
      <ProductCodeFinderModal
        isOpen={isCodeFinderOpen}
        onClose={() => setIsCodeFinderOpen(false)}
        onSelect={setProductCode}
      />
    </>
  );
}
