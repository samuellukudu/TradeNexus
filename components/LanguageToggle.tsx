// components/LanguageToggle.tsx
import React from 'react';
import { useLanguage } from '../i18n';

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex border border-slate-600 rounded-full overflow-hidden text-xs font-medium shrink-0">
      <button
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 transition-colors ${
          language === 'en'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('zh')}
        className={`px-2.5 py-1 transition-colors ${
          language === 'zh'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
        }`}
        aria-label="切换到中文"
      >
        中文
      </button>
    </div>
  );
};
