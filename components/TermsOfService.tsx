import React from 'react';
import { useLanguage } from '../i18n';

export function TermsOfService() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans overflow-y-auto">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center shadow-inner border border-slate-700">
              <span className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(var(--color-primary-500),_0.5)]"></span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">TradeNexus <span className="text-primary-500">AI</span></span>
          </a>
        </div>
      </nav>

      {/* Terms of Service Content */}
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{t('terms.title')}</h1>
          <p className="text-slate-400 text-sm mb-8">{t('terms.lastUpdated')}: May 26, 2026</p>

          <div className="space-y-8 text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using TradeNexus AI ("the Service"), you agree to be bound by these Terms of Service.
                If you do not agree, do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">2. Service Description</h2>
              <p>
                TradeNexus AI is an autonomous B2B sales agent platform that uses artificial intelligence
                to discover global trade leads, analyze markets, and generate prospecting content.
                The Service is provided on an "as is" and "as available" basis.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">3. User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials.
                You agree to provide accurate information during registration and to keep your account
                information up to date. You are solely responsible for all activity under your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">4. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
                <li>Attempt to gain unauthorized access to any part of the Service</li>
                <li>Use the Service to send unsolicited commercial messages (spam)</li>
                <li>Resell, redistribute, or sublicense the Service without explicit permission</li>
                <li>Upload malicious code or attempt to disrupt the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">5. AI-Generated Content</h2>
              <p>
                TradeNexus AI uses Google Gemini to generate market intelligence, lead data, and prospecting
                messages. While we strive for accuracy, AI-generated content may contain errors, hallucinations,
                or outdated information. You are responsible for verifying any AI-generated content before
                relying on it for business decisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">6. Intellectual Property</h2>
              <p>
                The TradeNexus AI platform, including its code, design, and branding, is owned by TradeNexus AI.
                You retain ownership of your product data, documents, and generated lead lists. By using the Service,
                you grant us a limited license to process your data solely for the purpose of providing the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">7. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, TradeNexus AI shall not be liable for any indirect,
                incidental, special, consequential, or punitive damages arising from your use of the Service.
                Our total liability is limited to the amount you paid us in the preceding 12 months, or $100
                if you are using the free tier.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">8. Service Modifications</h2>
              <p>
                We reserve the right to modify, suspend, or discontinue the Service at any time, with or without
                notice. We will make reasonable efforts to notify users of significant changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">9. Termination</h2>
              <p>
                We may terminate or suspend your account at any time for violation of these terms.
                You may stop using the Service at any time and request deletion of your data by contacting us.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">10. Contact</h2>
              <p>
                For questions about these Terms, contact us at{' '}
                <a href="mailto:samuellukudu.sl20@gmail.com" className="text-primary-400 hover:text-primary-300 underline">
                  samuellukudu.sl20@gmail.com
                </a>.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-500 text-sm border-t border-slate-900 bg-slate-950">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <a href="/" className="hover:text-slate-300 transition-colors">Home</a>
          <span className="text-slate-700">|</span>
          <a href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400">Terms of Service</span>
          <span className="text-slate-700">|</span>
          <span>&copy; {new Date().getFullYear()} TradeNexus AI. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
