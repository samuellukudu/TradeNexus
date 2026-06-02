import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, X, Play } from 'lucide-react';
import { useLanguage } from '../i18n';
import { LanguageToggle } from './LanguageToggle';
import { useCases, howItWorksStepKeys } from './landingData';

interface LandingPageProps {
  handleEmailAuth: (e: React.FormEvent) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  isLoginMode: boolean;
  setIsLoginMode: (mode: boolean) => void;
  authError: string;
  isSubmitting: boolean;
}

export function LandingPage({
  handleEmailAuth,
  loginWithGoogle,
  email,
  setEmail,
  password,
  setPassword,
  isLoginMode,
  setIsLoginMode,
  authError,
  isSubmitting,
}: LandingPageProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const { t } = useLanguage();

  const openAuthModal = (isLogin: boolean) => {
    setIsLoginMode(isLogin);
    setIsAuthModalOpen(true);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              TradeNexus <span className="text-blue-500">AI</span>
            </span>
          </button>
          <div className="flex items-center gap-6">
            <LanguageToggle />
            <button
              onClick={() => scrollTo('how-it-works')}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:block"
            >
              {t('nav.howItWorks')}
            </button>
            <button
              onClick={() => scrollTo('use-cases')}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:block"
            >
              {t('nav.useCases')}
            </button>
            <button
              onClick={() => openAuthModal(true)}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              {t('nav.signIn')}
            </button>
            <button
              onClick={() => openAuthModal(false)}
              className="text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg transition-all"
            >
              {t('nav.getStarted')}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-6 overflow-hidden">
        <div className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] opacity-40 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Left: Text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-semibold mb-6 border border-blue-500/20 tracking-wide">
                {t('landing.hero.badge')}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.06] mb-6">
                {t('landing.hero.title')}
              </h1>
              <p className="text-base md:text-lg text-slate-400 max-w-lg mb-8 leading-relaxed">
                {t('landing.hero.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => openAuthModal(false)}
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-8 rounded-xl transition-all hover:-translate-y-0.5"
                >
                  {t('landing.hero.cta')}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollTo('demo')}
                  className="inline-flex items-center justify-center gap-2 bg-slate-800/70 hover:bg-slate-800 text-white font-medium py-3.5 px-8 rounded-xl border border-slate-700 transition-all hover:-translate-y-0.5"
                >
                  <Play className="w-4 h-4" />
                  {t('landing.hero.watchDemo')}
                </button>
              </div>
            </div>

            {/* Right: Live Lead Preview */}
            <div className="relative">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('landing.feed.heading')}</span>
                  </div>
                  <span className="text-[10px] text-slate-600 bg-slate-800 px-2 py-0.5 rounded">{t('landing.feed.autoUpdating')}</span>
                </div>
                <div className="space-y-3">
                  {[
                    { icon: "🏗️", name: "Sydney Machinery Hire", cat: "Mini Excavators", score: "95%", detail: "Dry hire fleet, Sydney NSW" },
                    { icon: "☀️", name: "Desert Technologies", cat: "Solar Panels", score: "85%", detail: "PV manufacturer, Jeddah" },
                    { icon: "❄️", name: "Kooline Air Conditioning", cat: "HVAC Systems", score: "85%", detail: "Est. 1975, Suva Fiji" },
                  ].map((lead, i) => (
                    <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5 flex items-center gap-3.5 hover:border-slate-600/50 transition-colors">
                      <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-lg shrink-0">
                        {lead.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{lead.name}</div>
                        <div className="text-xs text-slate-400">{lead.cat} · {lead.detail}</div>
                      </div>
                      <div className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md shrink-0">
                        {lead.score}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>{t('landing.feed.scouting')}</span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    {t('landing.feed.autonomousActive')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 md:py-32 px-6 bg-slate-900 border-y border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
              {t('landing.howItWorks.heading')}
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto text-base">
              {t('landing.howItWorks.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorksStepKeys.map((step, i) => (
              <div key={i} className="text-center group">
                <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-xl font-bold text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                  {step.number}
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{t(step.titleKey)}</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">{t(step.descriptionKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Globe / Use Cases */}
      <section id="use-cases" className="py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
              {t('landing.useCases.heading')}
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto text-base">
              {t('landing.useCases.subtitle')}
            </p>
          </div>

          {/* Region Tag Cloud */}
          <div className="flex flex-wrap gap-3 justify-center max-w-3xl mx-auto mb-12">
            {useCases.map((uc) => (
              <button
                key={uc.country}
                onClick={() => setExpandedRegion(expandedRegion === uc.country ? null : uc.country)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  expandedRegion === uc.country
                    ? 'bg-blue-600/20 border-blue-500/50 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span>{uc.flag}</span>
                <span>{uc.country}</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400 text-xs">{uc.product}</span>
                {uc.isRealData && (
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" title="Real search data"></span>
                )}
              </button>
            ))}
          </div>

          {/* Expanded Region Detail */}
          {expandedRegion && (() => {
            const uc = useCases.find(u => u.country === expandedRegion);
            if (!uc) return null;
            return (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{uc.flag}</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">{uc.country} · {uc.product}</h3>
                    <p className="text-sm text-slate-400">{uc.region}</p>
                  </div>
                  {uc.isRealData && (
                    <span className="ml-auto text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full">
                      {t('landing.useCases.verifiedBadge')}
                    </span>
                  )}
                </div>
                <p className="text-slate-300 mb-6 leading-relaxed">{uc.context}</p>
                <div className="space-y-3">
                  {uc.leads.map((lead, i) => (
                    <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 flex items-center gap-4">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">{lead.companyName}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{lead.detail}</div>
                      </div>
                      <div className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded-md shrink-0">
                        {lead.matchScore}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })()}

          {!expandedRegion && (
            <p className="text-center text-xs text-slate-600">
              {t('landing.useCases.clickHint')}
            </p>
          )}
        </div>
      </section>

      {/* Demo Video */}
      <section id="demo" className="py-24 md:py-32 px-6 bg-slate-900 border-y border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
            {t('landing.demo.heading')}
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto text-base mb-12">
            {t('landing.demo.subtitle')}
          </p>

          <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <video
              src="/demo.mp4"
              className="w-full aspect-[9/16] md:aspect-video object-cover"
              controls
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          </div>

          <p className="text-xs text-slate-600 mt-4">
            {t('landing.demo.caption')}
          </p>
        </div>
      </section>

      {/* Real Results */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
              {t('landing.results.heading')}
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto text-base">
              {t('landing.results.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {useCases.filter(uc => uc.isRealData).map((uc) => (
              <div key={uc.country} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{uc.flag}</span>
                  <div>
                    <h3 className="font-bold text-white">{uc.country}</h3>
                    <p className="text-xs text-slate-500">{uc.product}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-400 mb-5 leading-relaxed">{uc.context}</p>
                <div className="space-y-2.5">
                  {uc.leads.map((lead, i) => (
                    <div key={i} className="bg-slate-800/50 border border-slate-700/30 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate">{lead.companyName}</div>
                        <div className="text-xs text-slate-500 truncate">{lead.detail}</div>
                      </div>
                      <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded shrink-0">
                        {lead.matchScore}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/10 via-blue-900/5 to-indigo-900/10 border border-blue-500/15 p-12 md:p-16 text-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
                {t('landing.cta.heading')}
              </h2>
              <p className="text-slate-400 max-w-md mx-auto text-base mb-8">
                {t('landing.cta.subtitle')}
              </p>
              <button
                onClick={() => openAuthModal(false)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-10 rounded-xl transition-all hover:-translate-y-0.5 text-base"
              >
                {t('landing.cta.button')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-900 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            </div>
            <span className="text-sm font-bold text-white tracking-tight">
              TradeNexus <span className="text-blue-500">AI</span>
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <a href="/privacy" className="hover:text-slate-300 transition-colors">{t('landing.footer.privacy')}</a>
            <a href="/terms" className="hover:text-slate-300 transition-colors">{t('landing.footer.terms')}</a>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-slate-900 text-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-800 relative"
            >
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-8">
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-4 border border-slate-700">
                    <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {isLoginMode ? t('auth.welcomeBack') : t('auth.createAccount')}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {isLoginMode ? t('auth.signInPrompt') : t('auth.registerPrompt')}
                  </p>
                </div>

                <button
                  onClick={loginWithGoogle}
                  className="w-full relative group bg-white text-slate-900 font-bold py-3 px-4 rounded-xl shadow-lg transition-all hover:bg-slate-50 mb-6 flex justify-center items-center gap-3"
                >
                  <svg viewBox="0 0 48 48" className="w-5 h-5">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  {t('auth.googleSignIn')}
                </button>

                <div className="w-full flex items-center justify-between mb-6">
                  <div className="h-px bg-slate-800 flex-1"></div>
                  <span className="text-slate-500 text-xs px-4 font-mono">{t('auth.or')}</span>
                  <div className="h-px bg-slate-800 flex-1"></div>
                </div>

                <form onSubmit={handleEmailAuth} className="w-full flex flex-col gap-4">
                  {authError && <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">{authError}</div>}

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">{t('auth.email')}</label>
                    <input
                      type="email"
                      placeholder={t('auth.emailPlaceholder')}
                      className="w-full bg-slate-950 border border-slate-800 text-sm rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">{t('auth.password')}</label>
                    <input
                      type="password"
                      placeholder={t('auth.passwordPlaceholder')}
                      className="w-full bg-slate-950 border border-slate-800 text-sm rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-white font-medium py-3 px-4 rounded-xl shadow-md transition-all flex justify-center items-center gap-3 disabled:opacity-50 mt-2"
                  >
                    {isSubmitting ? t('auth.processing') : (isLoginMode ? t('auth.signInWithEmail') : t('auth.createAccountBtn'))}
                  </button>

                  <div className="text-center mt-2">
                    <button
                      type="button"
                      onClick={() => setIsLoginMode(!isLoginMode)}
                      className="text-xs text-slate-400 hover:text-white transition-colors underline underline-offset-2"
                    >
                      {isLoginMode ? t('auth.needAccount') : t('auth.alreadyHaveAccount')}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
