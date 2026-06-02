# i18n Language Toggle (English / Chinese) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add English ↔ Chinese language switching to the TradeNexus UI shell, landing page, and dashboard using React Context + flat TS dictionaries + a segmented pill toggle.

**Architecture:** A `LanguageProvider` wraps the app root in `index.tsx`. Two TS dictionary files (`en.ts`, `zh.ts`) export flat key-value objects typed against a shared `Translations` type. A `useLanguage()` hook exposes `{ t, language, setLanguage }` to any component. A reusable `<LanguageToggle />` pill component is placed in both the landing page nav and the authenticated app nav. Language persists to localStorage.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, no new dependencies.

---

### Task 1: Create translation dictionary files (`en.ts` + `zh.ts`)

**Files:**
- Create: `i18n/en.ts`
- Create: `i18n/zh.ts`

- [ ] **Step 1: Create `i18n/en.ts` with all English translation keys**

```ts
// i18n/en.ts

const en = {
  // ── Nav & Global ──
  'nav.howItWorks': 'How It Works',
  'nav.useCases': 'Use Cases',
  'nav.signIn': 'Sign In',
  'nav.getStarted': 'Get Started',
  'nav.operations': 'Operations',
  'nav.dashboard': 'Dashboard',
  'nav.profile': 'Supplier profile',
  'nav.newCampaign': 'Start new campaign',
  'nav.logout': 'Logout',

  // ── Landing: Hero ──
  'landing.hero.badge': 'AUTONOMOUS B2B SALES AGENTS',
  'landing.hero.title': 'AI Agents That Find Your Next Buyer. 24/7.',
  'landing.hero.subtitle':
    'TradeNexus AI autonomously scouts 190+ countries, verifies companies with real data, and fills your pipeline while you sleep.',
  'landing.hero.cta': 'Start Scouting Free',
  'landing.hero.watchDemo': 'Watch Demo',

  // ── Landing: Live Feed ──
  'landing.feed.heading': 'Live Lead Feed',
  'landing.feed.autoUpdating': 'Auto-updating',
  'landing.feed.scouting': 'Scouting 190+ countries',
  'landing.feed.autonomousActive': 'Autonomous mode active',

  // ── Landing: How It Works ──
  'landing.howItWorks.heading': 'How It Works',
  'landing.howItWorks.subtitle':
    'Three steps from product to pipeline. No manual research required.',
  'landing.steps.1.title': 'Describe Your Product',
  'landing.steps.1.description':
    'Upload a spec sheet or write a description. Our AI extracts everything it needs to know.',
  'landing.steps.2.title': 'AI Scouts Global Markets',
  'landing.steps.2.description':
    'Autonomous agents search 190+ countries, find buyers matching your ideal profile, and verify their details.',
  'landing.steps.3.title': 'Contact and Close',
  'landing.steps.3.description':
    'Get verified emails, phone numbers, and AI-generated outreach messages. Start selling immediately.',

  // ── Landing: Use Cases ──
  'landing.useCases.heading': 'Global Coverage, One Platform',
  'landing.useCases.subtitle':
    'AI agents discover verified buyers across every continent. Click a region to see what they find.',
  'landing.useCases.verifiedBadge': 'Verified Search Data',
  'landing.useCases.clickHint': 'Click any region tag to expand with real lead data',

  // ── Landing: Demo ──
  'landing.demo.heading': 'See TradeNexus in Action',
  'landing.demo.subtitle':
    'Watch AI agents discover and verify B2B leads in real time.',
  'landing.demo.caption':
    'TradeNexus AI autonomously scouting and verifying leads across global markets',

  // ── Landing: Real Results ──
  'landing.results.heading': 'Real Results From Real Searches',
  'landing.results.subtitle':
    'Every lead shown was discovered by TradeNexus AI. Verified companies, real contact data.',

  // ── Landing: CTA ──
  'landing.cta.heading': 'Ready to find your next buyer?',
  'landing.cta.subtitle':
    'Join exporters using TradeNexus AI to discover verified B2B leads in 190+ countries.',
  'landing.cta.button': 'Start Scouting Free',

  // ── Landing: Footer ──
  'landing.footer.privacy': 'Privacy Policy',
  'landing.footer.terms': 'Terms of Service',

  // ── Auth Modal ──
  'auth.welcomeBack': 'Welcome back',
  'auth.createAccount': 'Create an account',
  'auth.signInPrompt': 'Sign in to access your autonomous sales agents.',
  'auth.registerPrompt': 'Start scouting global markets today.',
  'auth.googleSignIn': 'Sign in with Google',
  'auth.or': 'OR',
  'auth.email': 'Email',
  'auth.emailPlaceholder': 'you@company.com',
  'auth.password': 'Password',
  'auth.passwordPlaceholder': '········',
  'auth.processing': 'Processing...',
  'auth.signInWithEmail': 'Sign In with Email',
  'auth.createAccountBtn': 'Create Account',
  'auth.needAccount': 'Need an account? Register',
  'auth.alreadyHaveAccount': 'Already have an account? Sign in',

  // ── App Shell ──
  'app.currentCampaignConfig': 'Current Campaign Config',
  'app.newCampaignSetup': 'New Campaign Setup',
  'app.productName': 'Product Name',
  'app.productNamePlaceholder': 'e.g. Lithium Ion Batteries',
  'app.descriptionSpecs': 'Description / Specifications',
  'app.descriptionPlaceholder':
    'Paste detailed product specs, brand names, or catalog text here...',
  'app.productAssets': 'Product Assets (PDF/Image)',
  'app.uploadDocs': 'Upload Product Docs (PDF/Image)',
  'app.supplierCountry': 'Supplier Country of Origin',
  'app.targetAudience': 'Target Audience Strategy',
  'app.continent': 'Continent',
  'app.countries': 'Countries',
  'app.companySize': 'Company Size',
  'app.leadCount': 'Lead Count',
  'app.deployScout': 'Deploy Scout',
  'app.startSearch': 'Start Search',
  'app.analyzeMarkets': 'Analyze Markets',
  'app.noLeadsYet': 'No leads discovered yet. Deploy a scout to start finding buyers.',
  'app.selectLead': 'Select a lead to view details',

  // ── Dashboard ──
  'dashboard.heading': 'Agency Delivery Hub',
  'dashboard.subtitle': 'Manage client projects and export verified lead lists.',
  'dashboard.allProjects': 'All Client Projects',
  'dashboard.allRegions': 'All Regions',
  'dashboard.autoPilot': 'Auto-Pilot',
  'dashboard.deleteCampaign': 'Delete Campaign',
  'dashboard.copyToExcel': 'Copy to Excel',
  'dashboard.downloadCSV': 'Download CSV',
  'dashboard.totalLeads': 'Total Leads',
  'dashboard.inNegotiation': 'In Negotiation',
  'dashboard.closedWon': 'Closed Won',
  'dashboard.conversionRate': 'Conversion Rate',
  'dashboard.recentActivity': 'Recent System Activity',
  'dashboard.noActivity': 'No recent activity found.',
  'dashboard.enableAutoPilotTitle': 'Enable Auto-Pilot?',
  'dashboard.enableAutoPilotDesc':
    'Auto-Pilot will automatically re-scout this campaign every few minutes. It runs in the background and discovers fresh leads while you work.',
  'dashboard.confirmEnable': 'Confirm & Enable',
  'dashboard.cancel': 'Cancel',
  'dashboard.deleteCampaignTitle': 'Delete Campaign?',
  'dashboard.deleteCampaignDesc':
    'This action cannot be undone. All leads and data for this campaign will be permanently deleted.',
  'dashboard.deletePermanently': 'Delete Permanently',

  // ── LeadCard ──
  'lead.noSummary': 'No summary available.',
  'lead.social': 'Social',
  'lead.confidence': 'AI Match Confidence',

  // ── InteractionViewer ──
  'viewer.tab.aiChat': 'AI Chat',
  'viewer.tab.activityLog': 'Activity Log',
  'viewer.tab.companyDossier': 'Company Dossier',
  'viewer.confidenceMatch': 'Confidence Match',
  'viewer.verifiedSource': 'Verified Source',
  'viewer.status': 'Status',
  'viewer.nextSteps': 'Next Steps',
  'viewer.nextStepsPlaceholder': 'Add internal notes about this lead...',
  'viewer.chatPlaceholder': 'Type a message to draft outreach...',
  'viewer.send': 'Send',
  'viewer.none': 'None',
  'viewer.discoverSocial': 'Discover Social',
  'viewer.verifyLead': 'Verify Lead',
  'viewer.scoreLead': 'Score Lead',
  'viewer.getRecommendations': 'Get Recommendations',
  'viewer.generateStrategy': 'Generate Strategy',
  'viewer.generateDraft': 'Generate Draft',
  'viewer.moveTo': 'Move to',

  // ── MarketReportModal ──
  'report.title': 'Market Intelligence Report',
  'report.hsCode': 'HS Code Strategy',
  'report.importDuty': 'Import Duty',
  'report.shippingTime': 'Shipping Time',
  'report.marketOverview': 'Market Overview',
  'report.priceStructure': 'Price Structure',
  'report.compliance': 'Compliance & Regulations',
  'report.localization': 'Localization Requirements',
  'report.exportPDF': 'Export PDF',
  'report.close': 'Close',
  'report.noData': 'No data available',
  'report.generatedBy': 'Generated by TradeNexus AI',
  'report.competitorShare': 'Competitor Market Share',
  'report.growthTrend': 'Growth Trend',
  'report.userSegments': 'User Segments',

  // ── SupplierProfileView ──
  'profile.title': 'Supplier Profile',
  'profile.optional': '(Optional)',
  'profile.subtitle':
    'This information helps our AI personalize outreach messages on your behalf.',
  'profile.companyName': 'Company Name',
  'profile.website': 'Website',
  'profile.contactName': 'Contact Name',
  'profile.contactEmail': 'Contact Email',
  'profile.contactPhone': 'Contact Phone',
  'profile.companyDescription': 'Company Description',
  'profile.valueProposition': 'Value Proposition',
  'profile.save': 'Save Profile',
  'profile.saved': 'Saved!',

  // ── Terminal ──
  'terminal.init.0': 'TradeNexus AI Agent System v1.0.0 initialized...',
  'terminal.init.1': 'Mode: Deep Discovery & Analysis',
  'terminal.init.2': 'Connect to Database: SUCCESS',
  'terminal.init.3': 'Awaiting product specification...',

  // ── Privacy Policy ──
  'privacy.title': 'Privacy Policy',
  'privacy.lastUpdated': 'Last Updated',
  'privacy.content': `Privacy Policy content...`,

  // ── Terms of Service ──
  'terms.title': 'Terms of Service',
  'terms.lastUpdated': 'Last Updated',
  'terms.content': `Terms of Service content...`,
} as const;

export type Translations = typeof en;
export default en;
```

- [ ] **Step 2: Create `i18n/zh.ts` with Chinese translations**

```ts
// i18n/zh.ts
import type { Translations } from './en';

const zh: Record<keyof Translations, string> = {
  // ── Nav & Global ──
  'nav.howItWorks': '使用流程',
  'nav.useCases': '应用案例',
  'nav.signIn': '登录',
  'nav.getStarted': '立即开始',
  'nav.operations': '操作面板',
  'nav.dashboard': '数据中心',
  'nav.profile': '供应商信息',
  'nav.newCampaign': '新建营销活动',
  'nav.logout': '退出登录',

  // ── Landing: Hero ──
  'landing.hero.badge': '自主化B2B销售代理',
  'landing.hero.title': 'AI代理全天候为您寻找下一个买家。',
  'landing.hero.subtitle':
    'TradeNexus AI 自主搜索190多个国家，验证真实公司数据，在您休息时为您填充销售管道。',
  'landing.hero.cta': '免费开始搜索',
  'landing.hero.watchDemo': '观看演示',

  // ── Landing: Live Feed ──
  'landing.feed.heading': '实时线索流',
  'landing.feed.autoUpdating': '自动更新',
  'landing.feed.scouting': '搜索190+个国家',
  'landing.feed.autonomousActive': '自主模式运行中',

  // ── Landing: How It Works ──
  'landing.howItWorks.heading': '使用流程',
  'landing.howItWorks.subtitle': '从产品到销售管道，只需三步。无需手动调研。',
  'landing.steps.1.title': '描述您的产品',
  'landing.steps.1.description':
    '上传规格表或写下描述。我们的AI会提取所有需要的信息。',
  'landing.steps.2.title': 'AI搜索全球市场',
  'landing.steps.2.description':
    '自主代理搜索190多个国家，找到符合您理想客户画像的买家，并验证其详细信息。',
  'landing.steps.3.title': '联系并成交',
  'landing.steps.3.description':
    '获取经过验证的邮箱、电话号码和AI生成的外联消息。立即开始销售。',

  // ── Landing: Use Cases ──
  'landing.useCases.heading': '全球覆盖，一个平台',
  'landing.useCases.subtitle':
    'AI代理在每个大洲发现经过验证的买家。点击区域查看搜索结果。',
  'landing.useCases.verifiedBadge': '已验证搜索数据',
  'landing.useCases.clickHint': '点击任意区域标签展开真实线索数据',

  // ── Landing: Demo ──
  'landing.demo.heading': '观看TradeNexus实际操作',
  'landing.demo.subtitle': '观看AI代理实时发现和验证B2B线索。',
  'landing.demo.caption': 'TradeNexus AI 自主搜索并验证全球市场线索',

  // ── Landing: Real Results ──
  'landing.results.heading': '真实搜索，真实结果',
  'landing.results.subtitle':
    '每条线索均由TradeNexus AI发现。经过验证的公司，真实的联系数据。',

  // ── Landing: CTA ──
  'landing.cta.heading': '准备好找到下一个买家了吗？',
  'landing.cta.subtitle':
    '加入使用TradeNexus AI在190多个国家发现经过验证的B2B线索的出口商行列。',
  'landing.cta.button': '免费开始搜索',

  // ── Landing: Footer ──
  'landing.footer.privacy': '隐私政策',
  'landing.footer.terms': '服务条款',

  // ── Auth Modal ──
  'auth.welcomeBack': '欢迎回来',
  'auth.createAccount': '创建账户',
  'auth.signInPrompt': '登录以访问您的自主销售代理。',
  'auth.registerPrompt': '立即开始全球市场搜索。',
  'auth.googleSignIn': '使用Google登录',
  'auth.or': '或',
  'auth.email': '邮箱',
  'auth.emailPlaceholder': 'you@company.com',
  'auth.password': '密码',
  'auth.passwordPlaceholder': '········',
  'auth.processing': '处理中...',
  'auth.signInWithEmail': '邮箱登录',
  'auth.createAccountBtn': '创建账户',
  'auth.needAccount': '没有账户？立即注册',
  'auth.alreadyHaveAccount': '已有账户？立即登录',

  // ── App Shell ──
  'app.currentCampaignConfig': '当前营销活动配置',
  'app.newCampaignSetup': '新建营销活动',
  'app.productName': '产品名称',
  'app.productNamePlaceholder': '例如：锂离子电池',
  'app.descriptionSpecs': '产品描述 / 规格',
  'app.descriptionPlaceholder': '在此粘贴详细的产品规格、品牌名称或产品目录...',
  'app.productAssets': '产品资料 (PDF/图片)',
  'app.uploadDocs': '上传产品文档 (PDF/图片)',
  'app.supplierCountry': '供应商所在国家',
  'app.targetAudience': '目标客户策略',
  'app.continent': '大洲',
  'app.countries': '国家',
  'app.companySize': '公司规模',
  'app.leadCount': '线索数量',
  'app.deployScout': '部署搜索',
  'app.startSearch': '开始搜索',
  'app.analyzeMarkets': '分析市场',
  'app.noLeadsYet': '尚未发现线索。部署搜索开始寻找买家。',
  'app.selectLead': '选择一个线索查看详情',

  // ── Dashboard ──
  'dashboard.heading': '项目交付中心',
  'dashboard.subtitle': '管理客户项目并导出已验证的线索列表。',
  'dashboard.allProjects': '所有客户项目',
  'dashboard.allRegions': '所有地区',
  'dashboard.autoPilot': '自动巡航',
  'dashboard.deleteCampaign': '删除营销活动',
  'dashboard.copyToExcel': '复制到Excel',
  'dashboard.downloadCSV': '下载CSV',
  'dashboard.totalLeads': '线索总数',
  'dashboard.inNegotiation': '洽谈中',
  'dashboard.closedWon': '已成交',
  'dashboard.conversionRate': '转化率',
  'dashboard.recentActivity': '近期系统活动',
  'dashboard.noActivity': '暂无活动记录。',
  'dashboard.enableAutoPilotTitle': '启用自动巡航？',
  'dashboard.enableAutoPilotDesc':
    '自动巡航将每隔几分钟自动重新搜索此营销活动。它在后台运行，在您工作时发现新线索。',
  'dashboard.confirmEnable': '确认启用',
  'dashboard.cancel': '取消',
  'dashboard.deleteCampaignTitle': '删除营销活动？',
  'dashboard.deleteCampaignDesc':
    '此操作不可撤销。此营销活动的所有线索和数据将被永久删除。',
  'dashboard.deletePermanently': '永久删除',

  // ── LeadCard ──
  'lead.noSummary': '暂无摘要。',
  'lead.social': '社媒',
  'lead.confidence': 'AI匹配置信度',

  // ── InteractionViewer ──
  'viewer.tab.aiChat': 'AI对话',
  'viewer.tab.activityLog': '活动日志',
  'viewer.tab.companyDossier': '公司档案',
  'viewer.confidenceMatch': '匹配置信度',
  'viewer.verifiedSource': '已验证来源',
  'viewer.status': '状态',
  'viewer.nextSteps': '下一步',
  'viewer.nextStepsPlaceholder': '添加关于此线索的内部备注...',
  'viewer.chatPlaceholder': '输入消息以草拟外联内容...',
  'viewer.send': '发送',
  'viewer.none': '无',
  'viewer.discoverSocial': '发现社媒',
  'viewer.verifyLead': '验证线索',
  'viewer.scoreLead': '评分线索',
  'viewer.getRecommendations': '获取建议',
  'viewer.generateStrategy': '生成策略',
  'viewer.generateDraft': '生成草稿',
  'viewer.moveTo': '移至',

  // ── MarketReportModal ──
  'report.title': '市场情报报告',
  'report.hsCode': 'HS编码策略',
  'report.importDuty': '进口关税',
  'report.shippingTime': '运输时间',
  'report.marketOverview': '市场概述',
  'report.priceStructure': '价格结构',
  'report.compliance': '合规与法规',
  'report.localization': '本地化要求',
  'report.exportPDF': '导出PDF',
  'report.close': '关闭',
  'report.noData': '暂无数据',
  'report.generatedBy': '由 TradeNexus AI 生成',
  'report.competitorShare': '竞争对手市场份额',
  'report.growthTrend': '增长趋势',
  'report.userSegments': '用户细分',

  // ── SupplierProfileView ──
  'profile.title': '供应商资料',
  'profile.optional': '（选填）',
  'profile.subtitle': '这些信息帮助我们的AI为您个性化外联消息。',
  'profile.companyName': '公司名称',
  'profile.website': '网站',
  'profile.contactName': '联系人姓名',
  'profile.contactEmail': '联系人邮箱',
  'profile.contactPhone': '联系人电话',
  'profile.companyDescription': '公司描述',
  'profile.valueProposition': '价值主张',
  'profile.save': '保存资料',
  'profile.saved': '已保存！',

  // ── Terminal ──
  'terminal.init.0': 'TradeNexus AI 代理系统 v1.0.0 初始化...',
  'terminal.init.1': '模式：深度发现与分析',
  'terminal.init.2': '数据库连接：成功',
  'terminal.init.3': '等待产品规格...',

  // ── Privacy Policy ──
  'privacy.title': '隐私政策',
  'privacy.lastUpdated': '最后更新',
  'privacy.content': `隐私政策内容...`,

  // ── Terms of Service ──
  'terms.title': '服务条款',
  'terms.lastUpdated': '最后更新',
  'terms.content': `服务条款内容...`,
};

export default zh;
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors. If `zh.ts` is missing any key from `en.ts`, TypeScript will fail.

- [ ] **Step 4: Commit**

```bash
git add i18n/en.ts i18n/zh.ts
git commit -m "feat: add English and Chinese translation dictionaries"
```

---

### Task 2: Create LanguageProvider, useLanguage hook, and types

**Files:**
- Create: `i18n/index.tsx`

- [ ] **Step 1: Create `i18n/index.tsx`**

```tsx
// i18n/index.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import en from './en';
import zh from './zh';

export type Language = 'en' | 'zh';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = 'tradenexus-lang';

function detectInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'zh') return stored;
  } catch {}
  if (typeof navigator !== 'undefined' && navigator.language?.startsWith('zh')) {
    return 'zh';
  }
  return 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectInitialLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
    document.documentElement.lang = lang;
  }, []);

  // Sync html lang attribute on first render
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback(
    (key: string): string => {
      const dict = language === 'en' ? en : zh;
      return (dict as Record<string, string>)[key] ?? key;
    },
    [language],
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add i18n/index.tsx
git commit -m "feat: add LanguageProvider context and useLanguage hook"
```

---

### Task 3: Create LanguageToggle component

**Files:**
- Create: `components/LanguageToggle.tsx`

- [ ] **Step 1: Create `components/LanguageToggle.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/LanguageToggle.tsx
git commit -m "feat: add LanguageToggle pill component"
```

---

### Task 4: Wire Provider into root and App.tsx shell

**Files:**
- Modify: `index.tsx`
- Modify: `App.tsx`

- [ ] **Step 1: Wrap app with LanguageProvider in `index.tsx`**

Read `index.tsx` first, then replace its content:

```tsx
// index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './i18n';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>
);
```

- [ ] **Step 2: Add LanguageToggle and translate nav in App.tsx**

**2a.** Add the import at the top of `App.tsx` (after existing imports, around line 21):

```tsx
import { LanguageToggle } from './components/LanguageToggle';
import { useLanguage } from './i18n';
```

**2b.** Inside the `App` function, add the hook call after the existing state declarations (around line 122):

```tsx
const { t } = useLanguage();
```

**2c.** Replace the INITIAL_LOGS constant (around lines 23-28) to use translation keys at render time:

Keep the `INITIAL_LOGS` as keys:
```tsx
const INITIAL_LOG_KEYS = [
  'terminal.init.0',
  'terminal.init.1',
  'terminal.init.2',
  'terminal.init.3',
];
```

Then when setting initial logs in state (line 163), use:
```tsx
const [agentLogs, setAgentLogs] = useState<string[]>(INITIAL_LOG_KEYS.map(k => t(k)));
```

But since `t()` depends on language and we need it at init, handle this differently — initialize logs in a `useEffect` or use a lazy initializer. The simplest approach: initialize as empty and set in a useEffect that runs when language changes (for existing sessions). Actually, the cleanest approach: keep the INITIAL_LOGS constant in English for initial state, and only translate the 4 boot messages when they're displayed in the Terminal. We'll handle this in Task 8 when we wire up Terminal.

For now, keep the INITIAL_LOGS constant as-is and don't change the agentLogs state initialization. The terminal boot messages are pre-set in state and will be handled when displayed.

**2d.** Find the top nav bar section. The nav is the left-side vertical icon bar. Replace the `title` and `aria-label` attributes on the nav buttons (around lines 1255-1294):

Replace the four nav buttons with translated titles:

```tsx
{/* Operations button (line 1244-1259) */}
<button
  onClick={() => {
    setView('OPERATIONS');
    setSelectedLeadId(null);
    setIsSidebarOpen(true);
  }}
  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
    view === 'OPERATIONS' || view === 'DASHBOARD'
      ? 'bg-slate-800 text-slate-200'
      : 'text-slate-500 hover:text-slate-200 hover:bg-slate-900'
  }`}
  aria-label={t('nav.operations')}
  title={t('nav.operations')}
>
  <Home className="w-6 h-6" strokeWidth={2.2} />
</button>

{/* Profile button (line 1260-1276) */}
<button
  onClick={() => {
    setView('PROFILE');
    setSelectedLeadId(null);
    setIsSidebarOpen(false);
    setIsLeadsPanelOpen(false);
  }}
  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
    view === 'PROFILE'
      ? 'bg-slate-800 text-slate-200'
      : 'text-slate-500 hover:text-slate-200 hover:bg-slate-900'
  }`}
  aria-label={t('nav.profile')}
  title={t('nav.profile')}
>
  <UserRound className="w-6 h-6" strokeWidth={2.2} />
</button>

{/* New campaign button (line 1277-1284) */}
<button
  onClick={startNewCampaign}
  className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-slate-900 transition-colors"
  aria-label={t('nav.newCampaign')}
  title={t('nav.newCampaign')}
>
  <Plus className="w-6 h-6" strokeWidth={2.2} />
</button>

{/* Logout button (line 1287-1294) */}
<button
  onClick={logout}
  className="mt-auto w-12 h-12 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-slate-900 transition-colors"
  aria-label={t('nav.logout')}
  title={t('nav.logout')}
>
  <LogOut className="w-6 h-6" strokeWidth={2.2} />
</button>
```

**2e.** Add LanguageToggle to the nav bar. After the `</nav>` closing tag of the left sidebar (around line 1295), we need to also add it to the top header. Find the top header area. Let's locate the Dashboard/Operations toggle text in the top bar.

Search for where "Dashboard" and "Operations" view toggle text appears. Looking at the grep output, there's no obvious top bar with these text labels — the nav is the left icon sidebar. Let me find the top header bar:

The app layout has a left sidebar (nav with icons) and a main content area. The top of the main content area has the view context. Let's add the LanguageToggle to the left sidebar, between the nav icons and the logout button, or at the bottom of the sidebar.

Actually, the spec says "top nav bar" for the authenticated app. But this app uses a left vertical icon sidebar, not a top nav bar. The LanguageToggle should go in a visible, consistent location. Best place: just above the logout button at the bottom of the left sidebar.

Add before the logout button (before line 1287):

```tsx
{/* Language Toggle */}
<div className="flex justify-center">
  <LanguageToggle />
</div>
```

**2f.** Translate the campaign config header (around line 1380-1381):

Replace:
```tsx
<h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
    {activeSessionId ? 'Current Campaign Config' : 'New Campaign Setup'}
</h2>
```

With:
```tsx
<h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
    {activeSessionId ? t('app.currentCampaignConfig') : t('app.newCampaignSetup')}
</h2>
```

**2g.** Translate form labels in the config panel (lines 1386-1454):

Replace each label:
- `'Product Name'` → `t('app.productName')` (line 1386)
- `'Description / Specifications'` → `t('app.descriptionSpecs')` (line 1394)
- `'Product Assets (PDF/Image)'` → `t('app.productAssets')` (line 1405)
- `'Upload Product Docs (PDF/Image)'` → `t('app.uploadDocs')` (line 1408)
- `'Supplier Country of Origin'` → `t('app.supplierCountry')` (line 1434)
- `'Target Audience Strategy'` → `t('app.targetAudience')` (line 1446)

Also translate placeholders:
- `"e.g. Lithium Ion Batteries"` → `t('app.productNamePlaceholder')` (line 1391)
- `"Paste detailed product specs..."` → `t('app.descriptionPlaceholder')` (line 1398)

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add index.tsx App.tsx
git commit -m "feat: wire LanguageProvider into root and translate App shell nav + config form"
```

---

### Task 5: Wire into LandingPage and landingData

**Files:**
- Modify: `components/LandingPage.tsx`
- Modify: `components/landingData.ts`

- [ ] **Step 1: Add useLanguage hook and LanguageToggle to LandingPage**

**1a.** Add imports at the top of `LandingPage.tsx` (after line 4):

```tsx
import { useLanguage } from '../i18n';
import { LanguageToggle } from './LanguageToggle';
```

**1b.** Add the hook inside the `LandingPage` function (after line 31):

```tsx
const { t } = useLanguage();
```

**1c.** Add LanguageToggle to the nav bar. In the nav's right-side div (around line 59), add it before the "Sign In" button:

```tsx
<div className="flex items-center gap-6">
  <LanguageToggle />
  <button
    onClick={() => scrollTo('how-it-works')}
    className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:block"
  >
    {t('nav.howItWorks')}
  </button>
  {/* ... rest of nav buttons */}
```

**1d.** Translate the remaining nav buttons:
- `'Use Cases'` → `{t('nav.useCases')}` (line 70)
- `'Sign In'` → `{t('nav.signIn')}` (line 76)
- `'Get Started'` → `{t('nav.getStarted')}` (line 82)

**1e.** Translate hero section (lines 96-121):
- Badge: `'AUTONOMOUS B2B SALES AGENTS'` → `{t('landing.hero.badge')}` (line 97)
- Title: `'AI Agents That Find Your Next Buyer. 24/7.'` → `{t('landing.hero.title')}` (line 100)
- Subtitle → `{t('landing.hero.subtitle')}` (line 103)
- CTA: `'Start Scouting Free'` → `{t('landing.hero.cta')}` (line 110)
- Secondary: `'Watch Demo'` → `{t('landing.hero.watchDemo')}` (line 118)

**1f.** Translate live feed section (lines 126-158):
- `'Live Lead Feed'` → `{t('landing.feed.heading')}` (line 129)
- `'Auto-updating'` → `{t('landing.feed.autoUpdating')}` (line 131)
- `'Scouting 190+ countries'` → `{t('landing.feed.scouting')}` (line 154)
- `'Autonomous mode active'` → `{t('landing.feed.autonomousActive')}` (line 158)

**1g.** Translate How It Works section (lines 167-190):
- Heading: `'How It Works'` → `{t('landing.howItWorks.heading')}` (line 171)
- Subtitle → `{t('landing.howItWorks.subtitle')}` (line 174)

For the `howItWorksSteps.map()` (line 179), the step titles and descriptions come from `landingData.ts`. We'll update those in Step 2 of this task. For now, leave the map as-is — we'll update the data source.

**1h.** Translate Use Cases section (lines 193-272):
- Heading: `'Global Coverage, One Platform'` → `{t('landing.useCases.heading')}` (line 197)
- Subtitle → `{t('landing.useCases.subtitle')}` (line 200)
- `'Verified Search Data'` badge → `{t('landing.useCases.verifiedBadge')}` (line 245)
- Click hint → `{t('landing.useCases.clickHint')}` (line 269)

**1i.** Translate Demo section (lines 276-300):
- Heading: `'See TradeNexus in Action'` → `{t('landing.demo.heading')}` (line 279)
- Subtitle → `{t('landing.demo.subtitle')}` (line 282)
- Caption → `{t('landing.demo.caption')}` (line 297)

**1j.** Translate Real Results section (lines 303-341):
- Heading: `'Real Results From Real Searches'` → `{t('landing.results.heading')}` (line 307)
- Subtitle → `{t('landing.results.subtitle')}` (line 310)

**1k.** Translate CTA section (lines 345-365):
- Heading: `'Ready to find your next buyer?'` → `{t('landing.cta.heading')}` (line 351)
- Subtitle → `{t('landing.cta.subtitle')}` (line 354)
- Button: `'Start Scouting Free'` → `{t('landing.cta.button')}` (line 361)

**1l.** Translate footer (lines 369-384):
- `'Privacy Policy'` → `{t('landing.footer.privacy')}` (line 380)
- `'Terms of Service'` → `{t('landing.footer.terms')}` (line 381)

**1m.** Translate auth modal (lines 387-489):
- Title: `'Welcome back'` / `'Create an account'` → `{isLoginMode ? t('auth.welcomeBack') : t('auth.createAccount')}` (line 414)
- Prompt: `'Sign in to access...'` / `'Start scouting...'` → `{isLoginMode ? t('auth.signInPrompt') : t('auth.registerPrompt')}` (line 417)
- Google button: `'Sign in with Google'` → `{t('auth.googleSignIn')}` (line 431)
- OR divider: `'OR'` → `{t('auth.or')}` (line 436)
- Email label: `'Email'` → `{t('auth.email')}` (line 444)
- Email placeholder: `'you@company.com'` → `{t('auth.emailPlaceholder')}` (line 447)
- Password label: `'Password'` → `{t('auth.password')}` (line 456)
- Password placeholder: `'········'` → `{t('auth.passwordPlaceholder')}` (line 459)
- Submit: Processing/Login/Register → `{isSubmitting ? t('auth.processing') : (isLoginMode ? t('auth.signInWithEmail') : t('auth.createAccountBtn'))}` (line 472)
- Toggle link: `'Need an account? Register'` / `'Already have an account? Sign in'` → `{isLoginMode ? t('auth.needAccount') : t('auth.alreadyHaveAccount')}` (line 481)

- [ ] **Step 2: Update `landingData.ts` to use translation keys at render time**

The `howItWorksSteps` array needs to be translated at render time. The cleanest approach: convert the static data to use translation keys instead of hardcoded English, then resolve them via `t()` in the component.

In `landingData.ts`, change the steps to use keys:

```ts
// components/landingData.ts
// ... keep useCases as-is (real data, not translated)

export const howItWorksStepKeys = [
  {
    number: 1,
    titleKey: 'landing.steps.1.title',
    descriptionKey: 'landing.steps.1.description',
  },
  {
    number: 2,
    titleKey: 'landing.steps.2.title',
    descriptionKey: 'landing.steps.2.description',
  },
  {
    number: 3,
    titleKey: 'landing.steps.3.title',
    descriptionKey: 'landing.steps.3.description',
  },
];
```

Wait — this means we need to add these 6 keys to en.ts and zh.ts. Let's add them.

In `en.ts`, add:
```ts
'landing.steps.1.title': 'Describe Your Product',
'landing.steps.1.description':
  'Upload a spec sheet or write a description. Our AI extracts everything it needs to know.',
'landing.steps.2.title': 'AI Scouts Global Markets',
'landing.steps.2.description':
  'Autonomous agents search 190+ countries, find buyers matching your ideal profile, and verify their details.',
'landing.steps.3.title': 'Contact and Close',
'landing.steps.3.description':
  'Get verified emails, phone numbers, and AI-generated outreach messages. Start selling immediately.',
```

In `zh.ts`, add:
```ts
'landing.steps.1.title': '描述您的产品',
'landing.steps.1.description':
  '上传规格表或写下描述。我们的AI会提取所有需要的信息。',
'landing.steps.2.title': 'AI搜索全球市场',
'landing.steps.2.description':
  '自主代理搜索190多个国家，找到符合您理想客户画像的买家，并验证其详细信息。',
'landing.steps.3.title': '联系并成交',
'landing.steps.3.description':
  '获取经过验证的邮箱、电话号码和AI生成的外联消息。立即开始销售。',
```

Then in `LandingPage.tsx`, update the howItWorks section to use the keys. Replace:
```tsx
{howItWorksSteps.map((step, i) => (
  <div key={i} className="text-center group">
    <div className="...">{step.number}</div>
    <h3 className="...">{step.title}</h3>
    <p className="...">{step.description}</p>
  </div>
))}
```

With:
```tsx
{howItWorksStepKeys.map((step, i) => (
  <div key={i} className="text-center group">
    <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-xl font-bold text-blue-400 group-hover:bg-blue-500/20 transition-colors">
      {step.number}
    </div>
    <h3 className="text-lg font-bold text-white mb-3">{t(step.titleKey)}</h3>
    <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">{t(step.descriptionKey)}</p>
  </div>
))}
```

Update the import in `LandingPage.tsx` from `{ useCases, howItWorksSteps }` to `{ useCases, howItWorksStepKeys }`.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add components/LandingPage.tsx components/landingData.ts i18n/en.ts i18n/zh.ts
git commit -m "feat: translate LandingPage and landingData steps"
```

---

### Task 6: Wire into Dashboard

**Files:**
- Modify: `components/Dashboard.tsx`

- [ ] **Step 1: Add useLanguage hook to Dashboard**

**1a.** Add import at top of `Dashboard.tsx` (after line 2):

```tsx
import { useLanguage } from '../i18n';
```

**1b.** Add hook inside the component (after line 10):

```tsx
const { t } = useLanguage();
```

- [ ] **Step 2: Translate all Dashboard UI strings**

Replace each hardcoded string with `t()` calls:

**Heading section (lines 280-285):**
- `'Agency Delivery Hub'` → `{t('dashboard.heading')}`
- `'Manage client projects and export verified lead lists.'` → `{t('dashboard.subtitle')}`

**Session filter (line 298):**
- `` `All Client Projects (${sessions.length})` `` → `` `${t('dashboard.allProjects')} (${sessions.length})` ``

**Region filter (line 312):**
- `'All Regions'` → `{t('dashboard.allRegions')}`

**Auto-Pilot label (line 323):**
- `'Auto-Pilot'` → `{t('dashboard.autoPilot')}`

**Delete button title (line 336):**
- `'Delete Campaign'` → `{t('dashboard.deleteCampaign')}`

**Action buttons (lines 355, 365):**
- `'Copy to Excel'` → `{t('dashboard.copyToExcel')}`
- `'Download CSV'` → `{t('dashboard.downloadCSV')}`

**Metrics (lines 374, 378, 382, 386):**
- `'Total Leads'` → `{t('dashboard.totalLeads')}`
- `'In Negotiation'` → `{t('dashboard.inNegotiation')}`
- `'Closed Won'` → `{t('dashboard.closedWon')}`
- `'Conversion Rate'` → `{t('dashboard.conversionRate')}`

**Activity section (lines 394, 398):**
- `'Recent System Activity'` → `{t('dashboard.recentActivity')}`
- `'No recent activity found.'` → `{t('dashboard.noActivity')}`

**Auto-Pilot confirmation modal (around lines 224-242):**
- `'Enable Auto-Pilot?'` → `{t('dashboard.enableAutoPilotTitle')}`
- Description text → `{t('dashboard.enableAutoPilotDesc')}`
- `'Confirm & Enable'` → `{t('dashboard.confirmEnable')}`
- `'Cancel'` → `{t('dashboard.cancel')}`

**Delete confirmation modal (around lines 250-271):**
- `'Delete Campaign?'` → `{t('dashboard.deleteCampaignTitle')}`
- Description text → `{t('dashboard.deleteCampaignDesc')}`
- `'Cancel'` → `{t('dashboard.cancel')}`
- `'Delete Permanently'` → `{t('dashboard.deletePermanently')}`

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add components/Dashboard.tsx
git commit -m "feat: translate Dashboard UI strings"
```

---

### Task 7: Wire into LeadCard, InteractionViewer, and MarketReportModal

**Files:**
- Modify: `components/LeadCard.tsx`
- Modify: `components/InteractionViewer.tsx`
- Modify: `components/MarketReportModal.tsx`

- [ ] **Step 1: Translate LeadCard.tsx**

**1a.** Add imports:
```tsx
import { useLanguage } from '../i18n';
```

**1b.** Add hook inside `LeadCard`:
```tsx
const { t } = useLanguage();
```

**1c.** Replace strings:
- `'Social'` (line 60) → `{t('lead.social')}`
- `'No summary available.'` (line 98) → `{t('lead.noSummary')}`
- Status text `lead.status.replace('_', ' ')` (line 83) — keep as-is for now. Status enum values like `DISCOVERED` → `'DISCOVERED'` are displayed as-is. We can add a formatting helper later if needed.

**1d.** For the confidence tooltip (line 106): `'AI Match Confidence'` → `{t('lead.confidence')}`

- [ ] **Step 2: Translate InteractionViewer.tsx**

**2a.** Add imports at top:
```tsx
import { useLanguage } from '../i18n';
```

**2b.** Add hook:
```tsx
const { t } = useLanguage();
```

**2c.** The InteractionViewer is large (72K). Focus on the key UI strings:

Tab bar: Find the tab buttons and replace labels:
- `'chat'` tab → display as `{t('viewer.tab.aiChat')}`
- `'logs'` tab → display as `{t('viewer.tab.activityLog')}`
- `'dossier'` tab → display as `{t('viewer.tab.companyDossier')}`

Look for where tabs are rendered (search for `setActiveTab` or `activeTab ===`). The tab rendering should map the internal value to a display label:

```tsx
const TAB_LABELS: Record<string, string> = {
  'chat': t('viewer.tab.aiChat'),
  'logs': t('viewer.tab.activityLog'),
  'dossier': t('viewer.tab.companyDossier'),
};
```

**2d.** Replace other UI strings visible in the component:
- `'Confidence Match:'` (line 129) → `{t('viewer.confidenceMatch')}:`
- `'Verified Source'` (line 136) → `{t('viewer.verifiedSource')}`
- Chat input placeholder → `{t('viewer.chatPlaceholder')}`
- `'Send'` button → `{t('viewer.send')}`
- `'Status'` → `{t('viewer.status')}`
- `'Next Steps'` → `{t('viewer.nextSteps')}`
- `'None'` → `{t('viewer.none')}`
- Social discovery button text → `{t('viewer.discoverSocial')}`
- Verify button text → `{t('viewer.verifyLead')}`
- Score button text → `{t('viewer.scoreLead')}`
- Recommendations button → `{t('viewer.getRecommendations')}`
- Strategy button → `{t('viewer.generateStrategy')}`
- Draft button → `{t('viewer.generateDraft')}`
- `'Move to'` → `{t('viewer.moveTo')}`
- Next steps placeholder → `{t('viewer.nextStepsPlaceholder')}`

Since InteractionViewer is 72K, search for these exact strings and replace them with `t()` calls.

- [ ] **Step 3: Translate MarketReportModal.tsx**

**3a.** Add imports:
```tsx
import { useLanguage } from '../i18n';
```

**3b.** Add hook:
```tsx
const { t } = useLanguage();
```

**3c.** Replace section header strings:
- `'HS Code Strategy'` → `{t('report.hsCode')}`
- `'Import Duty'` → `{t('report.importDuty')}`
- `'Shipping Time'` → `{t('report.shippingTime')}`
- `'Market Overview'` → `{t('report.marketOverview')}`
- `'Price Structure'` → `{t('report.priceStructure')}`
- `'Compliance & Regulations'` → `{t('report.compliance')}`
- `'Localization Requirements'` → `{t('report.localization')}`
- `'No data available'` → `{t('report.noData')}`

**3d.** Replace the export button text and close button:
- Export PDF button text → `{t('report.exportPDF')}`
- Close button text → `{t('report.close')}`

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add components/LeadCard.tsx components/InteractionViewer.tsx components/MarketReportModal.tsx
git commit -m "feat: translate LeadCard, InteractionViewer, and MarketReportModal"
```

---

### Task 8: Wire into Terminal, SupplierProfileView, PrivacyPolicy, and TermsOfService

**Files:**
- Modify: `components/Terminal.tsx`
- Modify: `components/SupplierProfileView.tsx`
- Modify: `components/PrivacyPolicy.tsx`
- Modify: `components/TermsOfService.tsx`

- [ ] **Step 1: Translate Terminal.tsx**

The Terminal component is simple — it just displays logs passed as props. The initial boot messages are set in `App.tsx` as `INITIAL_LOGS`. Since the Terminal receives logs as strings, we need the translation to happen when the logs are set, not when they're displayed.

In `App.tsx`, the `INITIAL_LOGS` are set at component init (line 23-28). We need the translation to react to language changes. The best approach: store log keys separately and resolve them to translated strings when displayed.

Actually, the simplest approach: In `App.tsx`, useEffect that updates agentLogs when language changes:

```tsx
// In App.tsx, add a useEffect that resets the boot messages when language changes
useEffect(() => {
  setAgentLogs(prev => {
    // Only update if the first 4 logs are the boot messages (or their translations)
    const bootKeys = ['terminal.init.0', 'terminal.init.1', 'terminal.init.2', 'terminal.init.3'];
    const translatedBoots = bootKeys.map(k => t(k));
    // Replace the first 4 items with translated versions, keep the rest
    return [...translatedBoots, ...prev.slice(4)];
  });
}, [language]); // re-run when language changes
```

But this is fragile. A cleaner approach: just translate the INITIAL_LOGS in App.tsx by making them derive from `t()`:

Replace line 23-28 in App.tsx:
```tsx
// Before:
const INITIAL_LOGS = [
  "TradeNexus AI Agent System v1.0.0 initialized...",
  "Mode: Deep Discovery & Analysis",
  "Connect to Database: SUCCESS",
  "Awaiting product specification...",
];

// After: remove the constant, and in the useState (line 163) use a lazy init:
const getInitialLogs = () => [
  "TradeNexus AI Agent System v1.0.0 initialized...",
  "Mode: Deep Discovery & Analysis", 
  "Connect to Database: SUCCESS",
  "Awaiting product specification...",
];
```

Wait, we want these to be translated. But `t()` isn't available outside the component. The cleanest solution: use a `useEffect` that initializes logs once on mount:

In App.tsx, change line 163 from:
```tsx
const [agentLogs, setAgentLogs] = useState<string[]>(INITIAL_LOGS);
```
To:
```tsx
const [agentLogs, setAgentLogs] = useState<string[]>([]);
```

And add this useEffect after the other effects:
```tsx
// Initialize terminal boot logs (translated)
useEffect(() => {
  if (agentLogs.length === 0) {
    setAgentLogs([
      t('terminal.init.0'),
      t('terminal.init.1'),
      t('terminal.init.2'),
      t('terminal.init.3'),
    ]);
  }
}, [t, language]);
```

Actually, even simpler: still use INITIAL_LOGS for the initial state (they'll show in English briefly), and then have a useEffect that translates them when language changes. But that causes a flicker.

Simplest correct approach: just initialize with translated values once on mount. The English fallback works because `t()` falls back to the key which... wait, the keys are not the English strings. The keys are like `'terminal.init.0'`.

OK, let me reconsider. The simplest approach that works correctly:

1. Define INITIAL_LOG_KEYS as an array of translation keys
2. Initialize agentLogs by mapping through t() — but we need t() which requires the component to be rendered...

Actually, let's just initialize with hardcoded English and add a useEffect to update:

```tsx
const DEFAULT_BOOT_LOGS = [
  "TradeNexus AI Agent System v1.0.0 initialized...",
  "Mode: Deep Discovery & Analysis",
  "Connect to Database: SUCCESS",
  "Awaiting product specification...",
];

// In component:
const [agentLogs, setAgentLogs] = useState<string[]>(DEFAULT_BOOT_LOGS);

// Translate boot logs when language changes (but only if still showing boot logs)
useEffect(() => {
  const bootKeys = ['terminal.init.0', 'terminal.init.1', 'terminal.init.2', 'terminal.init.3'];
  setAgentLogs(prev => {
    // Only replace the prefix if it looks like boot logs (first 4 elements)
    if (prev.length >= 4 && prev[0]?.includes('TradeNexus') || prev[0]?.includes('TradeNexus')) {
      // Check if they match the English or Chinese boot messages
      const isBootSegment = DEFAULT_BOOT_LOGS.some((en, i) => prev[i] === en) ||
        bootKeys.some((_, i) => prev[i] === t(bootKeys[i]));
      if (isBootSegment) {
        return [...bootKeys.map(k => t(k)), ...prev.slice(4)];
      }
    }
    return prev;
  });
}, [language, t]);
```

This is getting overly complex for the plan. Let me simplify: just have the boot logs always be in English initially (set via INITIAL_LOGS constant), and when language changes, translate them. The simplest way:

```tsx
// Keep INITIAL_LOGS as-is for initial state
const [agentLogs, setAgentLogs] = useState<string[]>(INITIAL_LOGS);
```

And in a useEffect:
```tsx
useEffect(() => {
  setAgentLogs(prev => {
    const bootKeys = ['terminal.init.0', 'terminal.init.1', 'terminal.init.2', 'terminal.init.3'];
    return [...bootKeys.map(k => t(k)), ...prev.slice(4)];
  });
}, [language]);
```

This translates the first 4 logs whenever language changes. The rest of the logs (AI-generated runtime output) pass through untouched since we slice from index 4. This is clean and correct.

Let me put this in the plan.

- [ ] **Step 2: Translate SupplierProfileView.tsx**

**2a.** Add imports:
```tsx
import { useLanguage } from '../i18n';
```

**2b.** Add hook:
```tsx
const { t } = useLanguage();
```

**2c.** Replace strings (from the file at lines 50-200 approximately):
- Title: `'Supplier Profile (Optional)'` → `{t('profile.title')} {t('profile.optional')}`
- Subtitle: description text → `{t('profile.subtitle')}`
- Form labels: company name, website, contact name, email, phone, description, value proposition → use `t('profile.*')` keys
- Save button → `{t('profile.save')}`
- "Saved!" feedback → `{t('profile.saved')}`

- [ ] **Step 3: Translate PrivacyPolicy.tsx and TermsOfService.tsx**

These are static legal pages. Replace all visible text with `t()` calls using `'privacy.*'` and `'terms.*'` keys. Since the full legal text is lengthy, translate section headings and keep the body in English for now (legal text should be precise; a full translation of legal documents is out of scope).

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Start dev server and manually verify**

Run: `npm run dev`
Open `http://localhost:3000` and:
1. Verify toggle appears on landing page nav
2. Click toggle to Chinese — verify landing page text switches
3. Sign in — verify toggle appears in app sidebar
4. Toggle between languages — verify app shell, dashboard, and component labels switch
5. Verify AI-generated content (chat messages, terminal logs beyond boot) stays in English

- [ ] **Step 6: Commit**

```bash
git add components/Terminal.tsx components/SupplierProfileView.tsx components/PrivacyPolicy.tsx components/TermsOfService.tsx App.tsx
git commit -m "feat: translate Terminal, SupplierProfileView, PrivacyPolicy, and TermsOfService"
```
