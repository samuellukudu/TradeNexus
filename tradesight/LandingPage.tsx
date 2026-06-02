import { Globe2, TrendingUp, Sparkles, MoveRight, ArrowRight } from 'lucide-react';
import { TRANSLATIONS, Language } from './lib/translations';

interface LandingPageProps {
  onEnter: () => void;
  lang: Language;
  onToggleLang: () => void;
}

export function LandingPage({ onEnter, lang, onToggleLang }: LandingPageProps) {
  const t = (key: string) => TRANSLATIONS[lang]?.[key] || key;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 selection:bg-indigo-500/30 selection:text-white font-sans relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <a href="#" className="-m-1.5 p-1.5 flex items-center gap-2">
              <Globe2 className="h-8 w-8 text-indigo-500" />
              <span className="font-bold text-slate-50 text-xl tracking-tight">GeoTrade</span>
            </a>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleLang}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-[#0b0f19] text-xs font-semibold hover:bg-slate-800 hover:text-indigo-400 transition-all text-slate-300 font-sans cursor-pointer focus:outline-none"
            >
              {lang === 'en' ? '中文 (ZH)' : 'English (EN)'}
            </button>
            <button
              onClick={onEnter}
              className="text-sm font-semibold leading-6 text-slate-300 flex items-center gap-1 hover:text-indigo-400 transition-colors cursor-pointer"
            >
              {t('openDashboard')} <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        </nav>
      </header>

      <main className="isolate">
        {/* Hero section */}
        <div className="relative pt-14">
          <div className="py-24 sm:py-32 lg:pb-40">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-2xl text-center">
                <h1 className="text-4xl font-bold tracking-tight text-slate-50 sm:text-6xl text-balance">
                  {t('globalTradeInsights')}
                </h1>
                <p className="mt-6 text-lg leading-8 text-slate-400 text-pretty">
                  {t('heroSub')}
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  <button
                    onClick={onEnter}
                    className="rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    {t('enterApp')}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-16 flow-root sm:mt-24">
                <div className="-m-2 rounded-xl bg-slate-900/40 p-2 ring-1 ring-inset ring-slate-800 lg:-m-4 lg:rounded-2xl lg:p-4">
                  <div className="bg-[#0b0f19] rounded-xl overflow-hidden ring-1 ring-slate-800 flex items-center justify-center h-64 sm:h-96 md:h-[32rem] p-8 border border-slate-800/60 shadow-lg relative bg-[url('https://transparenttextures.com/patterns/cubes.png')] bg-opacity-20">
                    <div className="text-center space-y-4 max-w-md backdrop-blur-3xs p-6 rounded-xl border border-dashed border-slate-800 bg-[#030712]/80">
                      <Globe2 className="w-16 h-16 text-indigo-400 mx-auto opacity-80" />
                      <h3 className="text-xl font-medium text-slate-100">{t('advDashboard')}</h3>
                      <p className="text-slate-400 text-sm">{t('zeroSetup')}</p>
                      <button
                        onClick={onEnter}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 mx-auto pt-2"
                      >
                        {t('launchWorkspace')} <MoveRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features section */}
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32 border-t border-slate-900">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-indigo-400">{t('fasterAnalysis')}</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl text-balance">
              {t('allYouNeedHeading')}
            </p>
            <p className="mt-6 text-lg leading-8 text-slate-400">
              {t('combinesDesc')}
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-slate-200">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/20 border border-indigo-500/30">
                    <TrendingUp className="h-6 w-6 text-indigo-400" aria-hidden="true" />
                  </div>
                  {t('unComtradeTitle')}
                </dt>
                <dd className="mt-2 text-base leading-7 text-slate-400">
                  {t('unComtradeDesc')}
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-slate-200">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/20 border border-indigo-500/30">
                    <Globe2 className="h-6 w-6 text-indigo-400" aria-hidden="true" />
                  </div>
                  {t('wbIndicatorsTitle')}
                </dt>
                <dd className="mt-2 text-base leading-7 text-slate-400">
                  {t('wbIndicatorsDesc')}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </main>
    </div>
  );
}
