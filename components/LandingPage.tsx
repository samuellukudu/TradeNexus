import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, X, Play, Search, Activity, Globe as GlobeIcon, Zap, Award } from 'lucide-react';
import { useLanguage } from '../i18n';
import { LanguageToggle } from './LanguageToggle';
import { useCases, howItWorksStepKeys } from './landingData';
import { Globe, Hotspot } from './Globe';

interface LandingPageProps {
  handleEmailAuth: (e: React.FormEvent) => Promise<void>;
  loginWithGoogle: () => Promise<any>;
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
  const { t, language } = useLanguage();

  // --- NEW INTERACTIVE STATES FOR HIGH ENERGY REDESIGN ---
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [buyersCount, setBuyersCount] = useState(4500);
  const [scanCompleted, setScanCompleted] = useState(false);

  // Hotspots definitions with actual spherical coordinates (latitude, longitude)
  const hotspots: Hotspot[] = [
    { id: 'syd', name: 'Sydney, Australia', lat: -33.8688, lon: 151.2093, flag: '🇦🇺', demand: '220+ Active Buyers', topProduct: 'Mini Excavators', match: '96%', details: 'Dry hire fleets, civil construction, and heavy infrastructure projects.', intensity: 'high' },
    { id: 'jed', name: 'Jeddah, Saudi Arabia', lat: 21.5433, lon: 39.1728, flag: '🇸🇦', demand: '210+ Active Buyers', topProduct: 'Solar Panels', match: '89%', details: 'Solar EPC contractors, PV developers, and green energy projects.', intensity: 'high' },
    { id: 'suv', name: 'Suva, Fiji', lat: -18.1248, lon: 178.4501, flag: '🇫🇯', demand: '95+ Active Buyers', topProduct: 'HVAC Systems', match: '92%', details: 'Resort developers, large hotel retrofits, and HVAC installation firms.', intensity: 'medium' },
    { id: 'nbo', name: 'Nairobi, Kenya', lat: -1.2921, lon: 36.8219, flag: '🇰🇪', demand: '150+ Active Buyers', topProduct: 'Agricultural Machinery', match: '91%', details: 'Agricultural cooperatives, tractor importers, and farm equipment dealers.', intensity: 'medium' },
    { id: 'nur', name: 'Nuremberg, Germany', lat: 49.4521, lon: 11.0767, flag: '🇩🇪', demand: '180+ Active Buyers', topProduct: 'EV Battery Components', match: '93%', details: 'Automotive tier-1 suppliers, battery subcomponents, cooling system assemblers.', intensity: 'medium' },
    { id: 'mty', name: 'Monterrey, Mexico', lat: 25.6866, lon: -100.3161, flag: '🇲🇽', demand: '130+ Active Buyers', topProduct: 'Industrial Packaging', match: '95%', details: 'Food and beverage processors, automated packaging system integrators.', intensity: 'medium' },
    { id: 'sao', name: 'Sao Paulo, Brazil', lat: -23.5505, lon: -46.6333, flag: '🇧🇷', demand: '195+ Active Buyers', topProduct: 'Mining Equipment Parts', match: '94%', details: 'Heavy wear component distributors, fleet maintenance operators in Minas Gerais.', intensity: 'high' },
    { id: 'dxb', name: 'Dubai, UAE', lat: 25.2048, lon: 55.2708, flag: '🇦🇪', demand: '320+ Active Buyers', topProduct: 'PPE & Medical Supplies', match: '98%', details: 'Healthcare groups, PPE wholesale distribution centers in GCC region.', intensity: 'high' }
  ];

  const [activeHotspot, setActiveHotspot] = useState<Hotspot>(hotspots[7]); // Dubai default

  const openAuthModal = (isLogin: boolean) => {
    setIsLoginMode(isLogin);
    setIsAuthModalOpen(true);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Simulated AI scanner animation
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setIsScanning(true);
    setScanCompleted(false);
    setBuyersCount(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 4;
      setBuyersCount(Math.floor((progress / 100) * 4500));
      if (progress >= 100) {
        clearInterval(interval);
        setIsScanning(false);
        setScanCompleted(true);
        setBuyersCount(Math.floor(4500 + Math.random() * 200));
      }
    }, 40);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">
      
      {/* Navigation Layer */}
      <nav className="fixed top-0 w-full z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-900">
        
        {/* Market Pulse Scrolling Ticker */}
        <div className="w-full bg-slate-950/95 border-b border-slate-900/80 py-1.5 overflow-hidden relative z-50">
          <div className="flex animate-marquee gap-8 items-center text-[10px] font-bold tracking-wider uppercase text-slate-400 font-heading">
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Dubai: <span className="text-white">Hospital Sourcing PPE</span> · <span className="text-emerald-400 font-bold">98% Match</span>
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Sydney: <span className="text-white">Civil Fleet Sourcing Excavators</span> · <span className="text-emerald-400 font-bold">96% Match</span>
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Jeddah: <span className="text-white">EPC Sourcing Solar Panels</span> · <span className="text-emerald-400 font-bold">89% Match</span>
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Nuremberg: <span className="text-white">Tier-1 Sourcing EV Cells</span> · <span className="text-emerald-400 font-bold">93% Match</span>
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Fiji: <span className="text-white">Developer Sourcing VRF Systems</span> · <span className="text-emerald-400 font-bold">92% Match</span>
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Sao Paulo: <span className="text-white">Mining Operator Sourcing Castings</span> · <span className="text-emerald-400 font-bold">94% Match</span>
            </span>
            <span className="text-slate-700">|</span>
            
            {/* Loop duplication */}
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Dubai: <span className="text-white">Hospital Sourcing PPE</span> · <span className="text-emerald-400 font-bold">98% Match</span>
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Sydney: <span className="text-white">Civil Fleet Sourcing Excavators</span> · <span className="text-emerald-400 font-bold">96% Match</span>
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Jeddah: <span className="text-white">EPC Sourcing Solar Panels</span> · <span className="text-emerald-400 font-bold">89% Match</span>
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Nuremberg: <span className="text-white">Tier-1 Sourcing EV Cells</span> · <span className="text-emerald-400 font-bold">93% Match</span>
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Fiji: <span className="text-white">Developer Sourcing VRF Systems</span> · <span className="text-emerald-400 font-bold">92% Match</span>
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Sao Paulo: <span className="text-white">Mining Operator Sourcing Castings</span> · <span className="text-emerald-400 font-bold">94% Match</span>
            </span>
            <span className="text-slate-700">|</span>
          </div>
        </div>

        {/* Main Navbar Contents */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
              <svg width="20" height="20" viewBox="0 0 52 52" fill="none" aria-hidden="true">
                <circle cx="26" cy="26" r="20" stroke="white" strokeWidth="2.5" fill="none" opacity="0.7"/>
                <path d="M14 26 A12 12 0 0 1 38 26" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
                <path d="M14 26 A12 12 0 0 0 38 26" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7"/>
                <circle cx="14" cy="26" r="3.5" fill="white" opacity="0.9"/>
                <circle cx="38" cy="26" r="3.5" fill="white" opacity="0.7"/>
                <circle cx="26" cy="26" r="4.5" fill="white"/>
                <circle cx="26" cy="26" r="2.2" fill="#2563eb"/>
              </svg>
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white font-heading">
              TradeNexus <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 font-heading">AI</span>
            </span>
          </button>
          
          <div className="flex items-center gap-2 sm:gap-6">
            <LanguageToggle />
            <button
              onClick={() => scrollTo('how-it-works')}
              className="text-xs font-semibold text-slate-400 hover:text-white transition-colors hidden sm:block tracking-wide uppercase"
            >
              {t('nav.howItWorks')}
            </button>
            <button
              onClick={() => scrollTo('use-cases')}
              className="text-xs font-semibold text-slate-400 hover:text-white transition-colors hidden sm:block tracking-wide uppercase"
            >
              {t('nav.useCases')}
            </button>
            <button
              onClick={() => openAuthModal(true)}
              className="text-xs font-semibold text-slate-300 hover:text-white transition-colors hidden sm:block tracking-wide uppercase"
            >
              {t('nav.signIn')}
            </button>
            <button
              onClick={() => openAuthModal(false)}
              className="text-xs font-extrabold bg-blue-600 hover:bg-blue-500 text-white px-4.5 py-2.5 rounded-xl transition-all hover:scale-[0.98] whitespace-nowrap tracking-wide uppercase shadow-lg shadow-blue-600/15"
            >
              {t('nav.getStarted')}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 md:pt-48 md:pb-32 px-4 sm:px-6 overflow-hidden bg-grid-pattern">
        {/* Futuristic glowing overlays */}
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] opacity-40 pointer-events-none radial-mask-center"></div>
        <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-[100px] opacity-30 pointer-events-none radial-mask-center"></div>
        <div className="absolute top-0 left-0 right-0 h-full pointer-events-none radial-mask-hero"></div>

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center">
            
            {/* Left Col: Headings & CTA */}
            <div className="md:col-span-6 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-bold mb-6 border border-blue-500/20 tracking-wider font-heading uppercase">
                <Zap className="w-3.5 h-3.5" />
                {t('landing.hero.badge')}
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] mb-5 font-heading text-white">
                {language === 'en' ? (
                  <>
                    Global Demand Meets Your Supply. <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 neon-text-cyan">Instantly.</span>
                  </>
                ) : (
                  <>
                    全球采购需求，秒级匹配您的供应。<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 neon-text-cyan">即刻成交。</span>
                  </>
                )}
              </h1>
              
              <p className="text-sm md:text-base lg:text-lg text-slate-400 max-w-lg mb-8 leading-relaxed">
                {t('landing.hero.subtitle')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => openAuthModal(false)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-extrabold py-3.5 px-8 rounded-xl transition-all hover:scale-98 shadow-lg shadow-blue-500/15"
                >
                  {t('landing.hero.cta')}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollTo('demo')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900/50 hover:bg-slate-900 text-slate-200 font-semibold py-3.5 px-8 rounded-xl border border-slate-800 transition-all hover:scale-98"
                >
                  <Play className="w-4 h-4" />
                  {t('landing.hero.watchDemo')}
                </button>
              </div>
            </div>

            {/* Right Col: Supply & Demand Matching Engine Mockup */}
            <div className="md:col-span-6 relative min-w-0">
              <div className="relative min-w-0 glass-panel rounded-2xl p-5 glow-blue bg-grid-pattern/50 overflow-hidden bg-slate-950/20">
                {isScanning && <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none z-10"><div className="scan-line"></div></div>}
                
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse glow-cyan"></span>
                    <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-widest font-heading">
                      {language === 'en' ? 'AI Matching Engine' : 'AI 匹配引擎'}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/20">
                    {isScanning ? (language === 'en' ? 'SCANNING...' : '扫描中...') : (language === 'en' ? 'ACTIVE' : '运行中')}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 relative items-center mb-5">
                  
                  {/* SUPPLY CONTAINER */}
                  <div className="glass-panel p-3.5 rounded-xl text-center flex flex-col items-center justify-center relative z-10 border border-slate-800 hover:border-cyan-500/30 transition-colors duration-300">
                    <span className="text-[9px] text-cyan-400 font-extrabold uppercase tracking-wider block mb-2 font-heading">{language === 'en' ? 'Supply' : '供应'}</span>
                    <div className="grid grid-cols-2 gap-1 mb-2">
                      <span className="w-7 h-7 bg-slate-950 rounded flex items-center justify-center text-sm" title="Machinery">🏗️</span>
                      <span className="w-7 h-7 bg-slate-950 rounded flex items-center justify-center text-sm" title="Solar">☀️</span>
                      <span className="w-7 h-7 bg-slate-950 rounded flex items-center justify-center text-sm" title="HVAC">❄️</span>
                      <span className="w-7 h-7 bg-slate-950 rounded flex items-center justify-center text-sm" title="Batteries">🔋</span>
                    </div>
                    <div className="text-[9px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded truncate w-full font-mono border border-slate-900">
                      {searchQuery ? searchQuery : (language === 'en' ? 'Your Product' : '您的产品')}
                    </div>
                  </div>

                  {/* AI CORE NODE */}
                  <div className="flex flex-col items-center justify-center relative h-full">
                    <svg className="w-18 h-18 absolute animate-spin-slow text-slate-800" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="1" strokeDasharray="6 4" fill="none" />
                    </svg>
                    <svg className="w-14 h-14 absolute animate-spin-reverse-slow text-cyan-500/30" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="1.2" strokeDasharray="10 5" fill="none" />
                    </svg>
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xs shadow-lg transition-all duration-300 ${isScanning ? 'scale-110 rotate-45 glow-cyan shadow-cyan-500/20' : ''}`}>
                      AI
                    </div>
                    <span className="absolute w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                  </div>

                  {/* DEMAND CONTAINER */}
                  <div className="glass-panel p-3.5 rounded-xl text-center flex flex-col items-center justify-center relative z-10 border border-slate-800 hover:border-emerald-500/30 transition-colors duration-300">
                    <span className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-wider block mb-2 font-heading">{language === 'en' ? 'Demand' : '需求'}</span>
                    <div className="grid grid-cols-2 gap-1 mb-2">
                      <div className="w-7 h-7 bg-slate-950 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white relative border border-slate-900 font-heading">
                        US<span className="w-1.5 h-1.5 bg-emerald-500 rounded-full absolute -top-0.5 -right-0.5 border border-slate-950"></span>
                      </div>
                      <div className="w-7 h-7 bg-slate-950 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white relative border border-slate-900 font-heading">
                        DE<span className="w-1.5 h-1.5 bg-emerald-500 rounded-full absolute -top-0.5 -right-0.5 border border-slate-950"></span>
                      </div>
                      <div className="w-7 h-7 bg-slate-950 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white relative border border-slate-900 font-heading">
                        SA<span className="w-1.5 h-1.5 bg-emerald-500 rounded-full absolute -top-0.5 -right-0.5 border border-slate-950"></span>
                      </div>
                      <div className="w-7 h-7 bg-slate-950 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white relative border border-slate-900 font-heading">
                        AU<span className="w-1.5 h-1.5 bg-emerald-500 rounded-full absolute -top-0.5 -right-0.5 border border-slate-950"></span>
                      </div>
                    </div>
                    <div className="text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded w-full font-bold border border-emerald-500/20 font-heading">
                      {language === 'en' ? 'Verified Buyers' : '核验买家'}
                    </div>
                  </div>

                  {/* SVG Paths for connector lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 120" style={{ zIndex: 0 }}>
                    <path d="M 80 60 H 130" stroke={isScanning ? "#06b6d4" : "rgba(148, 163, 184, 0.15)"} strokeWidth="1.5" className={isScanning ? "energy-line" : ""} fill="none" />
                    <path d="M 170 60 H 220" stroke={isScanning ? "#10b981" : "rgba(148, 163, 184, 0.15)"} strokeWidth="1.5" className={isScanning ? "energy-line" : ""} fill="none" />
                  </svg>
                </div>

                {/* Form Scanner */}
                <form onSubmit={handleSearchSubmit} className="space-y-4 pt-4 border-t border-slate-900">
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 font-heading">
                      {language === 'en' ? 'Scan Global Demand Databases' : '全球采购需求实时检索'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={language === 'en' ? 'Type a product (e.g. Solar Panels)' : '输入您的产品 (例如: 太阳能板)'}
                        className="w-full bg-slate-950/80 border border-slate-800 text-xs rounded-xl pl-9 pr-24 py-3 text-white focus:outline-none focus:border-cyan-500/40 transition-colors"
                        disabled={isScanning}
                      />
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                      <button
                        type="submit"
                        className="absolute right-1.5 top-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-extrabold px-4.5 py-1.5 rounded-lg text-[10px] transition-all hover:scale-95 flex items-center gap-1 font-heading uppercase tracking-wide disabled:opacity-50"
                        disabled={isScanning || !searchQuery}
                      >
                        {isScanning ? (language === 'en' ? 'SCANNIG...' : '检索中...') : (language === 'en' ? 'Match' : '需求匹配')}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs font-mono bg-slate-950/60 rounded-xl p-3 border border-slate-900">
                    <span className="text-slate-500">{language === 'en' ? 'Active Buyers Found:' : '已核验活跃采购商数量:'}</span>
                    <span className={`font-bold transition-all duration-300 font-heading ${scanCompleted ? 'text-emerald-400 text-sm neon-text-cyan' : 'text-cyan-400 text-sm'}`}>
                      {buyersCount.toLocaleString()}+ {language === 'en' ? 'Instantly' : '家'}
                    </span>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Live Demand Heatmap Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 bg-slate-950 border-t border-slate-900 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-900/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-900/5 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold mb-4 border border-cyan-500/20 tracking-wider font-heading uppercase">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              {language === 'en' ? 'REAL-TIME GLOBAL MATCHMAKING' : '全球实时贸易匹配'}
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4 font-heading">
              {language === 'en' ? 'Live Demand Heatmap' : '实时需求热力图'}
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto text-sm">
              {language === 'en' ? 'TradeNexus agents monitor global B2B procurement queries in real time. Select a hotspot to inspect active buyer profiles.' : 'TradeNexus 代理实时监控全球 B2B 采购需求。选择热点以查看活跃买家画像及产品缺口。'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* 3D Rotating Globe (Takes 8 cols on large desktop) */}
            <div className="lg:col-span-8 glass-panel p-6 rounded-2xl border border-slate-900 relative bg-slate-900/20 flex items-center justify-center min-h-[400px] md:min-h-[500px]">
              <Globe 
                hotspots={hotspots} 
                activeHotspot={activeHotspot} 
                onSelectHotspot={setActiveHotspot} 
                language={language} 
              />
            </div>

            {/* Side Dossier Panel (Takes 4 cols) */}
            <div className="lg:col-span-4 glass-panel-heavy rounded-2xl p-6 border border-slate-900 relative shadow-2xl h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{activeHotspot.flag}</span>
                    <div>
                      <h4 className="text-sm font-bold text-white font-heading">{activeHotspot.name}</h4>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">{language === 'en' ? 'Verified Hub' : '已校验出口节点'}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full font-heading border ${
                    activeHotspot.intensity === 'high' 
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
                      : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                  }`}>
                    {activeHotspot.intensity === 'high' ? (language === 'en' ? 'HIGH INTENSITY' : '采购高频') : (language === 'en' ? 'STABLE POTENTIAL' : '中频大户')}
                  </span>
                </div>

                <div className="space-y-3.5">
                  <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-3">
                    <span className="text-[9px] text-slate-500 block mb-1 font-heading uppercase tracking-wider">{language === 'en' ? 'Active Sourcing Buyers' : '近期活跃买家数量'}</span>
                    <span className="text-sm font-bold text-white font-heading">{activeHotspot.demand}</span>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-3">
                    <span className="text-[9px] text-slate-500 block mb-1 font-heading uppercase tracking-wider">{language === 'en' ? 'Top Demanded Category' : '需求最大产品品类'}</span>
                    <span className="text-sm font-bold text-cyan-400 font-heading">{activeHotspot.topProduct}</span>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-3">
                    <span className="text-[9px] text-slate-500 block mb-1 font-heading uppercase tracking-wider">{language === 'en' ? 'Average Match Confidence' : '平均匹置信度'}</span>
                    <span className="text-sm font-bold text-emerald-400 font-heading">{activeHotspot.match} Match Score</span>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-500 block mb-1 font-heading uppercase tracking-wider">{language === 'en' ? 'Strategic Insight' : '战略情报简述'}</span>
                    <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/40 border border-slate-900 rounded-xl p-3.5">
                      {activeHotspot.details}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  const countryUc = useCases.find(uc => activeHotspot.name.includes(uc.country));
                  if (countryUc) {
                    setExpandedRegion(countryUc.country);
                    scrollTo('use-cases');
                  } else {
                    openAuthModal(false);
                  }
                }}
                className="mt-6 w-full py-2.5 rounded-xl border border-blue-500/20 bg-blue-600/10 hover:bg-blue-600 text-white font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-1.5 font-heading uppercase"
              >
                {language === 'en' ? 'Examine Leads in This Region' : '查看该地区线索详情'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Closed Deals Ticker */}
      <section className="py-12 bg-slate-900/60 border-y border-slate-900 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 mb-4 flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            <span className="font-bold text-slate-400 font-heading">{language === 'en' ? 'Closed Deals Ticker' : '实时匹配与成交简报'}</span>
          </div>
          <span>{language === 'en' ? 'Verified Matches' : '系统实时自动校验'}</span>
        </div>

        <div className="w-full overflow-hidden relative">
          <div className="flex animate-marquee gap-6">
            {[
              { matched: "Sydney Machinery Hire", buyer: "Chinese Loader OEM", product: "Mini Excavators", value: "$450k Closed", match: "95%" },
              { matched: "Desert Technologies", buyer: "Tier-1 PV Exporter", product: "Solar Panels", value: "$1.2M Closed", match: "89%" },
              { matched: "Kooline Air Conditioning", buyer: "VRF Valve Distributor", product: "HVAC Systems", value: "$280k Closed", match: "92%" },
              { matched: "Bavarian Components Gmbh", buyer: "Lithium Cell Foundry", product: "EV Battery Components", value: "$3.1M Closed", match: "93%" },
              { matched: "Empaques Monterrey", buyer: "Automated Packaging OEM", product: "Industrial Packaging", value: "$520k Closed", match: "91%" },
              { matched: "Mineracao Minas Gerais", buyer: "Heavy Sinter Castings", product: "Mining Parts", value: "$780k Closed", match: "94%" },
              { matched: "Nairobi Farm Machinery", buyer: "Harvester OEM Shandong", product: "Tractors", value: "$310k Closed", match: "90%" },
              
              // Duplication for loop
              { matched: "Sydney Machinery Hire", buyer: "Chinese Loader OEM", product: "Mini Excavators", value: "$450k Closed", match: "95%" },
              { matched: "Desert Technologies", buyer: "Tier-1 PV Exporter", product: "Solar Panels", value: "$1.2M Closed", match: "89%" },
              { matched: "Kooline Air Conditioning", buyer: "VRF Valve Distributor", product: "HVAC Systems", value: "$280k Closed", match: "92%" },
              { matched: "Bavarian Components Gmbh", buyer: "Lithium Cell Foundry", product: "EV Battery Components", value: "$3.1M Closed", match: "93%" },
              { matched: "Empaques Monterrey", buyer: "Automated Packaging OEM", product: "Industrial Packaging", value: "$520k Closed", match: "91%" },
              { matched: "Mineracao Minas Gerais", buyer: "Heavy Sinter Castings", product: "Mining Parts", value: "$780k Closed", match: "94%" },
              { matched: "Nairobi Farm Machinery", buyer: "Harvester OEM Shandong", product: "Tractors", value: "$310k Closed", match: "90%" }
            ].map((deal, idx) => (
              <div key={idx} className="glass-panel shrink-0 w-80 rounded-xl p-4 border border-slate-900 bg-slate-950/40 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-bold border border-emerald-500/20 font-heading uppercase">Matched</span>
                    <span className="text-[9px] text-slate-500 font-mono">Score: {deal.match}</span>
                  </div>
                  <p className="text-xs font-bold text-white truncate font-heading">{deal.matched}</p>
                  <p className="text-[10px] text-slate-400 truncate">{deal.product} · {deal.buyer}</p>
                </div>
                <div className="text-right shrink-0 border-l border-slate-800/60 pl-4">
                  <span className="text-[8px] text-slate-500 block uppercase">Value</span>
                  <span className="text-xs font-black text-cyan-400 font-heading">{deal.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 md:py-32 px-4 sm:px-6 bg-slate-950 border-b border-slate-900 bg-grid-pattern relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/40 to-slate-950 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold mb-4 border border-blue-500/20 tracking-wider font-heading uppercase">
              <Zap className="w-3.5 h-3.5" />
              {language === 'en' ? 'HIGH-EFFICIENCY PIPELINE' : '高效率线索开发流程'}
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4 font-heading">
              {t('landing.howItWorks.heading')}
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto text-sm">
              {t('landing.howItWorks.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorksStepKeys.map((step, i) => (
              <div key={i} className="glass-panel rounded-2xl p-8 hover:-translate-y-1 transition-all duration-300 group border border-slate-900 bg-slate-950/20 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all duration-300"></div>
                <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-center mb-6 text-base font-extrabold text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 font-heading">
                  {step.number}
                </div>
                <h3 className="text-lg font-bold text-white mb-3 font-heading">{t(step.titleKey)}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{t(step.descriptionKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Coverage / Use Cases */}
      <section id="use-cases" className="py-16 md:py-32 px-4 sm:px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold mb-4 border border-emerald-500/20 tracking-wider font-heading uppercase">
              <GlobeIcon className="w-3.5 h-3.5" />
              {language === 'en' ? 'TERRITORY SCANS' : '全球版图扫描'}
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4 font-heading">
              {t('landing.useCases.heading')}
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto text-sm">
              {t('landing.useCases.subtitle')}
            </p>
          </div>

          {/* Region Tag Cloud */}
          <div className="flex flex-wrap gap-2.5 justify-center max-w-4xl mx-auto mb-12">
            {useCases.map((uc) => (
              <button
                key={uc.country}
                onClick={() => setExpandedRegion(expandedRegion === uc.country ? null : uc.country)}
                className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  expandedRegion === uc.country
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20 scale-95'
                    : 'bg-slate-900/60 border-slate-900 text-slate-300 hover:border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span>{uc.flag}</span>
                <span className="font-heading">{uc.country}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400 font-mono text-[9px]">{uc.product}</span>
                {uc.isRealData && (
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" title="Real search data"></span>
                )}
              </button>
            ))}
          </div>

          {/* Expanded Region Detail */}
          <AnimatePresence>
            {expandedRegion && (() => {
              const uc = useCases.find(u => u.country === expandedRegion);
              if (!uc) return null;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="max-w-3xl mx-auto glass-panel-heavy rounded-2xl p-6 md:p-8 border border-slate-900 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl"></div>
                  
                  <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-900">
                    <span className="text-3xl">{uc.flag}</span>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-white font-heading">{uc.country} · {uc.product}</h3>
                      <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">{uc.region}</p>
                    </div>
                    {uc.isRealData && (
                      <span className="ml-auto text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                        {t('landing.useCases.verifiedBadge')}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-xs md:text-sm mb-6 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-900">{uc.context}</p>
                  
                  <div className="space-y-3">
                    <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-heading">{language === 'en' ? 'Discovered Verified Leads' : '已核验线索详情'}</h4>
                    {uc.leads.map((lead, i) => (
                      <div key={i} className="glass-panel rounded-xl p-4 flex items-center justify-between gap-4 border border-slate-900 bg-slate-950/20 hover:border-slate-800 transition-colors duration-200">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-white font-heading">{lead.companyName}</div>
                          <div className="text-[10px] text-slate-400 mt-1 truncate">{lead.detail}</div>
                        </div>
                        <div className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20 shrink-0 font-heading">
                          {lead.matchScore} Match
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>

          {!expandedRegion && (
            <p className="text-center text-[10px] font-mono text-slate-500">
              {t('landing.useCases.clickHint')}
            </p>
          )}
        </div>
      </section>

      {/* Demo Video Section */}
      <section id="demo" className="py-16 md:py-28 px-4 sm:px-6 bg-slate-900/20 border-y border-slate-900 bg-grid-pattern relative">
        <div className="absolute inset-0 bg-slate-950/60 pointer-events-none"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4 font-heading">
            {t('landing.demo.heading')}
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto text-xs md:text-sm mb-12">
            {t('landing.demo.subtitle')}
          </p>

          <div className="relative bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden shadow-2xl max-w-3xl mx-auto glow-blue">
            <video
              src="/demo.mp4"
              className="w-full aspect-video object-cover"
              controls
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          </div>

          <p className="text-[10px] text-slate-500 mt-4 font-mono">
            {t('landing.demo.caption')}
          </p>
        </div>
      </section>

      {/* Real Results Section */}
      <section className="py-16 md:py-28 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold mb-4 border border-cyan-500/20 tracking-wider font-heading uppercase">
              <Award className="w-3.5 h-3.5" />
              {language === 'en' ? 'VERIFIED MATCH HISTORIES' : '权威搜索实绩'}
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4 font-heading">
              {t('landing.results.heading')}
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto text-xs md:text-sm">
              {t('landing.results.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {useCases.filter(uc => uc.isRealData).map((uc) => (
              <div key={uc.country} className="glass-panel rounded-2xl p-5 sm:p-6 border border-slate-900 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-900">
                    <span className="text-2xl">{uc.flag}</span>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white font-heading leading-tight truncate">{uc.country}</h3>
                      <p className="text-[10px] text-slate-500 font-mono truncate">{uc.product}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mb-5 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-900">{uc.context}</p>
                  <div className="space-y-2.5">
                    {uc.leads.map((lead, i) => (
                      <div key={i} className="bg-slate-950/60 border border-slate-900 rounded-xl p-3.5 sm:px-4 sm:py-3 flex items-center justify-between gap-3 min-w-0">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-white truncate font-heading">{lead.companyName}</div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">{lead.detail}</div>
                        </div>
                        <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20 shrink-0 font-heading">
                          {lead.matchScore}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call To Action (CTA) */}
      <section className="py-16 md:py-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900/10 via-slate-900/10 to-indigo-900/15 border border-blue-500/20 p-8 sm:p-12 md:p-16 text-center glow-blue bg-slate-950/20">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4 font-heading">
                {t('landing.cta.heading')}
              </h2>
              <p className="text-slate-400 max-w-md mx-auto text-sm mb-8">
                {t('landing.cta.subtitle')}
              </p>
              <button
                onClick={() => openAuthModal(false)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold py-3.5 px-10 rounded-xl transition-all hover:scale-[0.98] text-sm md:text-base shadow-lg shadow-blue-600/25"
              >
                {t('landing.cta.button')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 border-t border-slate-900 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            </div>
            <span className="text-sm font-bold text-white tracking-tight font-heading">
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
                  <h2 className="text-2xl font-bold text-white mb-2 font-heading">
                    {isLoginMode ? t('auth.welcomeBack') : t('auth.createAccount')}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {isLoginMode ? t('auth.signInPrompt') : t('auth.registerPrompt')}
                  </p>
                </div>

                <button
                  onClick={loginWithGoogle}
                  className="w-full relative group bg-white text-slate-900 font-bold py-3 px-4 rounded-xl shadow-lg transition-all hover:bg-slate-50 mb-6 flex justify-center items-center gap-3 font-heading uppercase text-xs tracking-wider"
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
                    <label className="block text-xs font-semibold text-slate-400 mb-1 font-heading uppercase tracking-wider">{t('auth.email')}</label>
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
                    <label className="block text-xs font-semibold text-slate-400 mb-1 font-heading uppercase tracking-wider">{t('auth.password')}</label>
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
                    className="w-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex justify-center items-center gap-3 disabled:opacity-50 mt-2 font-heading uppercase text-xs tracking-wider"
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
