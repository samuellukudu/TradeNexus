import React from 'react';

export function PrivacyPolicy() {
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

      {/* Privacy Policy Content */}
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-slate-400 text-sm mb-8">Last updated: May 26, 2026</p>

          <div className="prose prose-invert prose-slate max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-bold text-white mb-3">1. Information We Collect</h2>
              <p className="text-slate-300 leading-relaxed">
                When you use TradeNexus AI, we collect the following information:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 mt-2">
                <li><strong>Account Information:</strong> Your email address and authentication credentials when you sign up via Google OAuth or email/password.</li>
                <li><strong>Usage Data:</strong> Product descriptions, uploaded documents, search preferences, and lead data you generate through the platform.</li>
                <li><strong>Technical Data:</strong> Standard server logs including IP address, browser type, and timestamps for security and debugging purposes.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">2. How We Use Your Information</h2>
              <p className="text-slate-300 leading-relaxed">
                Your data is used exclusively to provide and improve the TradeNexus AI service:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 mt-2">
                <li>To authenticate you and maintain your account</li>
                <li>To generate AI-powered market analysis, lead discovery, and prospecting content based on your inputs</li>
                <li>To store your campaigns, leads, and pipeline data so you can access them across sessions</li>
                <li>To debug issues and improve the quality of our AI agent outputs</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">3. Third-Party Services</h2>
              <p className="text-slate-300 leading-relaxed">
                TradeNexus AI relies on the following third-party services:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 mt-2">
                <li><strong>Google Firebase:</strong> Provides authentication, database (Firestore), and hosting. Your account credentials and application data are stored on Google Cloud infrastructure.</li>
                <li><strong>Google Gemini AI:</strong> Your product descriptions and search queries are sent to Google's Gemini API to generate market intelligence and discover leads. Data is processed per Google's AI API data governance policies.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">4. Data Storage and Security</h2>
              <p className="text-slate-300 leading-relaxed">
                Your data is stored on Google Cloud (Firebase/Firestore) with encryption at rest and in transit.
                Access to your data is restricted through Firebase Authentication — you can only access data
                associated with your own user account. We do not sell, rent, or share your data with any
                other third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">5. Your Rights</h2>
              <p className="text-slate-300 leading-relaxed">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 mt-2">
                <li>Access and export your data at any time</li>
                <li>Delete your account and all associated data (you can delete individual sessions from the Dashboard, or contact us for full account deletion)</li>
                <li>Withdraw consent for future data processing by discontinuing use of the platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">6. Cookies</h2>
              <p className="text-slate-300 leading-relaxed">
                TradeNexus AI uses essential authentication tokens managed by Firebase to maintain your login session.
                We do not use marketing or tracking cookies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">7. Contact</h2>
              <p className="text-slate-300 leading-relaxed">
                For privacy-related inquiries, please contact us at{' '}
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
          <span className="text-slate-400">Privacy Policy</span>
          <span className="text-slate-700">|</span>
          <a href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</a>
          <span className="text-slate-700">|</span>
          <span>&copy; {new Date().getFullYear()} TradeNexus AI. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
