import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe2, Crosshair, Zap, Database, ArrowRight, X, Briefcase, Activity, ShieldCheck } from 'lucide-react';

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

  const openAuthModal = (isLogin: boolean) => {
    setIsLoginMode(isLogin);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-primary-500 selection:text-white overflow-y-auto">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center shadow-inner border border-slate-700">
              <span className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(var(--color-primary-500),_0.5)]"></span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">TradeNexus <span className="text-primary-500">AI</span></span>
          </button>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => openAuthModal(true)}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => openAuthModal(false)}
              className="text-sm font-bold bg-primary-600 hover:bg-primary-500 text-white px-5 py-2 rounded-lg transition-all shadow-lg hover:shadow-primary-500/20"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-900/20 rounded-full blur-[120px] opacity-50 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[100px] opacity-40 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 text-primary-400 text-sm font-medium mb-6 border border-primary-500/20">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
              Autonomous B2B Sales Agents
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight mb-8">
              The AI Engine for <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-400">
                Global Suppliers
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
              Stop manually searching for buyers. TradeNexus AI autonomously scouts global markets, qualifies B2B leads, and builds your pipeline while you sleep.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => openAuthModal(false)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-xl hover:shadow-primary-500/20 hover:-translate-y-1"
              >
                Start Autonomous Scouting
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto bg-slate-800/50 hover:bg-slate-800 text-white font-medium py-4 px-8 rounded-xl border border-slate-700 transition-all hover:-translate-y-1"
              >
                See How It Works
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 bg-slate-900 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Unfair Advantage for Exporters & OEMs</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Equip your sales team with an autonomous intelligence layer that identifies demand before your competitors do.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Globe2 className="w-6 h-6 text-blue-400" />,
                title: "Global Market Discovery",
                description: "Upload your product catalog, and our AI instantly identifies high-potential global markets based on live trade data and economic indicators."
              },
              {
                icon: <Crosshair className="w-6 h-6 text-rose-400" />,
                title: "Targeted B2B Scouting",
                description: "Deploy localized AI agent squads to actively hunt for distributors, wholesalers, and specific business types matching your ICP."
              },
              {
                icon: <Database className="w-6 h-6 text-emerald-400" />,
                title: "Verified Lead Encrichment",
                description: "Say goodbye to empty spreadsheets. Every lead includes verified company descriptions, contact avenues, and intent signals."
              },
              {
                icon: <Zap className="w-6 h-6 text-amber-400" />,
                title: "Auto-Pilot Lead Generation",
                description: "Set your target region and let the engine run continuously, automatically expanding your pipeline with net-new prospects every day."
              },
              {
                icon: <ShieldCheck className="w-6 h-6 text-indigo-400" />,
                title: "Intelligent Deduplication",
                description: "Never contact the same company twice. Built-in deduplication ensures you only see net-new opportunities."
              },
              {
                icon: <Briefcase className="w-6 h-6 text-primary-400" />,
                title: "Centralized Deal Command",
                description: "Manage territories, track outreach status, and visualize your entire global sales offensive from one dashboard."
              }
            ].map((benefit, i) => (
              <div key={i} className="bg-slate-950 border border-slate-800 p-8 rounded-2xl hover:border-slate-700 transition-colors">
                <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center mb-6">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{benefit.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-primary-900/10"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to scale your global reach?</h2>
          <p className="text-xl text-slate-400 mb-10">Join forward-thinking suppliers using TradeNexus AI to dominate international markets.</p>
          <button 
            onClick={() => openAuthModal(false)}
            className="bg-white text-slate-900 hover:bg-slate-100 font-bold py-4 px-10 rounded-xl transition-all shadow-xl hover:-translate-y-1 text-lg"
          >
            Create Your Account
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-500 text-sm border-t border-slate-900 bg-slate-950">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <a href="/privacy" className="hover:text-slate-300 transition-colors underline underline-offset-2">Privacy Policy</a>
          <span className="text-slate-700">|</span>
          <a href="/terms" className="hover:text-slate-300 transition-colors underline underline-offset-2">Terms of Service</a>
          <span className="text-slate-700">|</span>
          <p>&copy; {new Date().getFullYear()} TradeNexus AI. All rights reserved.</p>
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
                  <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-inner border border-slate-700">
                    <span className="w-3 h-3 bg-primary-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(var(--color-primary-500),_0.5)]"></span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {isLoginMode ? 'Welcome back' : 'Create an account'}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {isLoginMode ? 'Sign in to access your autonomous sales agents.' : 'Start scouting global markets today.'}
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
                  Sign in with Google
                </button>

                <div className="w-full flex items-center justify-between mb-6">
                  <div className="h-px bg-slate-800 flex-1"></div>
                  <span className="text-slate-500 text-xs px-4 font-mono">OR</span>
                  <div className="h-px bg-slate-800 flex-1"></div>
                </div>

                <form onSubmit={handleEmailAuth} className="w-full flex flex-col gap-4">
                  {authError && <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">{authError}</div>}
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="you@company.com"
                      className="w-full bg-slate-950 border border-slate-800 text-sm rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 text-sm rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors"
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
                    {isSubmitting ? 'Processing...' : (isLoginMode ? 'Sign In with Email' : 'Create Account')}
                  </button>

                  <div className="text-center mt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsLoginMode(!isLoginMode)}
                      className="text-xs text-slate-400 hover:text-white transition-colors underline underline-offset-2"
                    >
                      {isLoginMode ? "Need an account? Register" : "Already have an account? Sign in"}
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
