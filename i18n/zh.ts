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

  // ── Terms of Service ──
  'terms.title': '服务条款',
  'terms.lastUpdated': '最后更新',
};

export default zh;
