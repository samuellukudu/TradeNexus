export type Language = 'en' | 'zh';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Brand & Main
    brandName: "TradeSight / GeoTrade",
    openDashboard: "Open Dashboard",
    enterApp: "Enter Application",
    launchWorkspace: "Launch workspace",
    globalTradeInsights: "Global Trade & Macroeconomic Insights",
    heroSub: "Analyze bilateral trade flows via UN Comtrade and macroeconomic indicators via the World Bank in a unified, modern interface.",
    advDashboard: "Advanced Analytics Dashboard",
    zeroSetup: "Dive into years of structured global trade data with zero setup.",
    fasterAnalysis: "Faster Analysis",
    allYouNeedHeading: "Everything you need to understand international trade",
    combinesDesc: "Stop fighting with CSV exports from public databases. GeoTrade combines the world's most trusted data sources into a single analytical workspace.",
    
    // Feature Cards
    unComtradeTitle: "UN Comtrade Integration",
    unComtradeDesc: "Explore millions of rows of bilateral trade records spanning hundreds of HS commodity codes and decades of history simultaneously.",
    wbIndicatorsTitle: "World Bank Indicators",
    wbIndicatorsDesc: "Overlay macro indicators such as GDP Growth, Inflation, Foreign Direct Investment, and trade as a percentage of GDP.",

    // Core Layout
    activeConsultDesk: "Active Consult Desk",
    unComtradeDesk: "UN Comtrade Desk",
    worldBankIndicators: "World Bank Indicators",
    b2bSmbAdvisor: "B2B & SMB Advisor",
    macroDesk: "World Bank Macro Desk",
    tradeDesk: "UN Comtrade Trade Desk",
    macroDesc: "Country macroeconomic health & total aggregate balances.",
    tradeDesc: "Bilateral trade flows & product categories.",

    // Sidebar Filters
    reportingCountry: "Reporting Country",
    partnerCountry: "Partner Country",
    commodityLabel: "Commodity / Product (HS Code)",
    selectCountryPlaceholder: "Select country",
    worldAllPartners: "World (All Partners)",
    allCommoditiesTotal: "All Commodities (TOTAL)",
    swapCountries: "Swap Countries",
    searchByCodeOrName: "Search by code or name...",
    noHsCodesFound: "No HS codes found matching your query",
    timePeriod: "Time Period (Year / Custom Range)",
    timeRangeDesc: "Specify a year (e.g. 2024), a range (e.g. 2018-2024), or comma-separated periods.",
    updateFilters: "Apply Period Filters",
    gdpGrowth: "gdp growth",
    inflation: "inflation",
    fdiInflows: "fdi inflows",
    capitalFormation: "capital formation",
    remittances: "remittances",
    gdpCapitaPpp: "gdp/capita ppp",
    gdpLabel: "gdp (total usd)",
    reserves: "reserves (usd)",

    // Main Panels & Chart
    status: "Status",
    loadingData: "Loading data...",
    liveAnalytics: "Live Analytics",
    latestImports: "Latest Imports",
    latestExports: "Latest Exports",
    historicalTradeValues: "Historical Trade Values",
    top10Imports: "Top 10 Import Commodities (Recent Years)",
    top10Exports: "Top 10 Export Commodities (Recent Years)",
    trendImportPartners: "Trend - Top Import Partners Value",
    trendExportPartners: "Trend - Top Export Partners Value",
    yoy: "YoY",
    
    // World Bank Specific Tabs & Metrics
    macroIndicatorChart: "Macro Indicator Timeline",
    selectedMacroMetric: "Selected Macro Metric",
    gdpMetric: "GDP",
    reservesMetric: "Reserves",
    inflationMetric: "Inflation",
    fdiMetric: "FDI In/Out",
    remittancesMetric: "Remittances",
    capFormMetric: "Capital Formation",
    gdpCapitaPppMetric: "GDP / Capita (PPP)",
    currentInflows: "Current Inflows",
    currentOutflows: "Current Outflows",
    personalInflows: "Personal Inflows",
    ofGdp: "of GDP",
    consumerPrices: "consumer prices",
    currentReserves: "Current Reserves",
    
    // Breakdown Unavailable
    breakdownUnavailable: "Breakdowns Unavailable for Current Filters",
    breakdownNotice: "Please set the Commodity / Product (HS Code) filter to TOTAL in the sidebar to see these visualizations.",
    resetToTotal: "Reset to TOTAL",

    // Detailed Records
    detailedRecords: "Detailed Records",
    downloadCsv: "Download CSV",
    tableYear: "Year",
    tableFlow: "Flow",
    tableReporter: "Reporter",
    tablePartner: "Partner",
    tableHsCode: "HS Code",
    tableValue: "Value (USD)",
    tableYoY: "YoY Change (%)",
    tableImport: "Import",
    tableExport: "Export",

    // AI Advisor & Strategic Feed
    advisorHeader: "B2B Strategic Advisory Feed",
    askAdvisorPlaceholder: "Ask custom strategy questions...",
    advisorDesc: "Bespoke micro-venture concepts and local commercial hedges based on trade flows of",
    geminiApiKeyNotice: "Add a GEMINI_API_KEY environment variable in settings to unlock live, customized AI recommendations from Gemini!",
    customStrategySearch: "Custom Strategy Search",
    activeAdvisorTab: "Active Advisor Segment",
    smbSegment: "SMBAssociates (SMBs)",
    midMarketSegment: "ScaleUps (Mid-Market)",
    enterpriseSegment: "GlobalVentures (Enterprise)",
    aiGeneratedBadge: "AI Generated Insights",
    comtradeCachedBadge: "Comtrade Cached",
    failedToLoadAdvice: "Failed to generate AI advice. Please check your Gemini API key.",

    // Dev API Access
    devApiAccess: "Developer API Access",
    devApiDesc: "Use the following command to retrieve the currently selected dataset as JSON. This queries the appropriate underlying data provider directly.",
    copyCommand: "Copy Command",
    commandCopied: "Copied!",
    apiProvenance: "This bilateral trade data originates from the UN Comtrade API v1. To perform more complex queries involving multiple partners or commodities simultaneously, consult the UN Comtrade Support portal. Note that production usage may require an API key.",

    // Interactive Guidance Info
    hsStructureGuide: "HS \"H6\" Classification Guide",
    hsStructureText: "Organized hierarchically into 97 Chapters (2-digit, broad industries), 1,200+ Headings (4-digit, detail groups), and 5,600+ Subheadings (6-digit, specific products). \"TOTAL\" spans all codes.",
    totalSpans: "\"TOTAL\" spans all codes.",
    
    // Extra
    export: "Export",
    import: "Import"
  },
  zh: {
    // 品牌与主页
    brandName: "贸易透视 / GeoTrade",
    openDashboard: "打开数据仪表盘",
    enterApp: "进入应用",
    launchWorkspace: "启动工作区",
    globalTradeInsights: "全球贸易与宏观经济洞察",
    heroSub: "在一个统一、现代的界面中，分析联合国商品贸易统计数据库（UN Comtrade）的双边贸易流量和世界银行的宏观经济指标。",
    advDashboard: "高级分析仪表盘",
    zeroSetup: "零配置，即可深入探索多年的结构化全球贸易数据。",
    fasterAnalysis: "更高效的分析",
    allYouNeedHeading: "理解国际贸易所需的一切",
    combinesDesc: "无需再与来自公共数据库的繁琐 CSV 导出文件作斗争。GeoTrade 将世界上最值得信赖的数据源整合到了一个统一的分析工作空间中。",
    
    // 要素卡片
    unComtradeTitle: "联合国商品贸易数据库整合",
    unComtradeDesc: "同时探索横跨数百个协调制度（HS）商品编码以及数十载历史的数百万行双边贸易记录。",
    wbIndicatorsTitle: "世界银行宏观指标",
    wbIndicatorsDesc: "叠加宏观指标，如国内生产总值（GDP）增长率、通货膨胀率、外国直接投资（FDI）以及贸易占国内生产总值的百分比。",

    // 核心布局
    activeConsultDesk: "活跃咨询台",
    unComtradeDesk: "联合国贸易台",
    worldBankIndicators: "世界银行指标",
    b2bSmbAdvisor: "B2B 与中小企业顾问",
    macroDesk: "世界银行宏观台",
    tradeDesk: "联合国 Comtrade 贸易台",
    macroDesc: "国家宏观经济健康状况及总体统计余额。",
    tradeDesc: "双边贸易流量与商品类别。",

    // 侧边栏过滤器
    reportingCountry: "申报国",
    partnerCountry: "贸易伙伴国",
    commodityLabel: "商品/产品 (HS 编码)",
    selectCountryPlaceholder: "选择国家/地区",
    worldAllPartners: "世界 (所有贸易伙伴)",
    allCommoditiesTotal: "全部商品分类 (TOTAL)",
    swapCountries: "交换国家",
    searchByCodeOrName: "按编码或名称搜索...",
    noHsCodesFound: "未找到匹配您查询的协调编码 (HS Code)",
    timePeriod: "时间段 (年份 / 自定义范围)",
    timeRangeDesc: "指定年份 (例如 2024)、范围 (例如 2018-2024) 或以逗号分隔的时期。",
    updateFilters: "应用时间段过滤",
    gdpGrowth: "国内生产总值增长",
    inflation: "通货膨胀",
    fdiInflows: "外商直接投资流入",
    capitalFormation: "资本形成总额",
    remittances: "侨汇流入",
    gdpCapitaPpp: "人均国内生产总值 ppp",
    gdpLabel: "国内生产总值 (美元总额)",
    reserves: "储备资产 (美元)",

    // 主要面板与图表
    status: "状态",
    loadingData: "正在加载数据...",
    liveAnalytics: "实时分析",
    latestImports: "最新进口额",
    latestExports: "最新出口额",
    historicalTradeValues: "历史贸易额度趋势",
    top10Imports: "前十大进口商品类别 (近年轻)",
    top10Exports: "前十大出口商品类别 (近年轻)",
    trendImportPartners: "趋势 - 主要进口伙伴国交易额",
    trendExportPartners: "趋势 - 主要出口伙伴国交易额",
    yoy: "同比",

    // 世界银行指标明细 & 标签
    macroIndicatorChart: "宏观经济指标时间轴",
    selectedMacroMetric: "已选宏观指标",
    gdpMetric: "国内生产总值 (GDP)",
    reservesMetric: "储备金 (Reserves)",
    inflationMetric: "通货膨胀率 (Inflation)",
    fdiMetric: "外国直接投资 FDI 进/出",
    remittancesMetric: "侨汇额 (Remittances)",
    capFormMetric: "资本形成 (Capital Formation)",
    gdpCapitaPppMetric: "人均 GDP (购买力平价 PPP)",
    currentInflows: "当前流入",
    currentOutflows: "当前流出",
    personalInflows: "个人侨汇",
    ofGdp: "占 GDP 比重",
    consumerPrices: "消费者价格指数",
    currentReserves: "当前资产储备",

    // 分类明细不可用
    breakdownUnavailable: "当前过滤条件下无法提供分类图表",
    breakdownNotice: "请将侧边栏中的商品/产品 (HS 编码) 过滤器设置为 TOTAL，以查看这些可视化图表分析。",
    resetToTotal: "重置为全部商品 (TOTAL)",

    // 详细记录表格
    detailedRecords: "双边贸易明细记录",
    downloadCsv: "导出 CSV 数据",
    tableYear: "年份",
    tableFlow: "贸易流向",
    tableReporter: "申报国",
    tablePartner: "贸易伙伴",
    tableHsCode: "HS 编码",
    tableValue: "金额 (美元)",
    tableYoY: "同比增长率 (%)",
    tableImport: "进口",
    tableExport: "出口",

    // 智能顾问 & 战略提议
    advisorHeader: "B2B 贸易战略咨询信息流",
    askAdvisorPlaceholder: "向智能顾问咨询定制策略或问题...",
    advisorDesc: "基于双边贸易流及商品数据为您定制的微型创业概念和本地商业套期保值对冲策略:",
    geminiApiKeyNotice: "在设置中添加您的 GEMINI_API_KEY 环境变量，即可解锁来自 Gemini 的实时动态个性化 AI 商业建议！",
    customStrategySearch: "定制化战略咨询搜索",
    activeAdvisorTab: "顾问客户细分定位",
    smbSegment: "SMBAssociates (中小企业方案)",
    midMarketSegment: "ScaleUps (中型市场方案)",
    enterpriseSegment: "GlobalVentures (跨国集团方案)",
    aiGeneratedBadge: "AI 智能生成建议",
    comtradeCachedBadge: "Comtrade 缓存数据",
    failedToLoadAdvice: "生成 AI 建议失败。请检查您的 Gemini API 密钥配置。",

    // 开发者 API
    devApiAccess: "开发者 API 访问接口",
    devApiDesc: "使用以下终端命令，可直接查询并以 JSON 格式回传当前过滤数据集。该指令将直接检索底层的权威数据提供方。",
    copyCommand: "复制 API 命令",
    commandCopied: "已成功复制！",
    apiProvenance: "该双边贸易数据来源于联合国一类商品贸易 API (UN Comtrade API v1)。若要执行涉及多个申报国或多款 HS 商品编码的复杂并行查询，请访问联合国贸易支持门户了解更多。生产环境使用需配置相关密钥。",

    // 提示指导
    hsStructureGuide: "协调制度 HS \"H6\" 品分类指南",
    hsStructureText: "层级化编排：共划分为 97章（2位数字，宽泛行业领域），1200+目（4位数字，细节族群），以及 5600+子目（6位数字，具体的实物商品）。 \"TOTAL\" 代表所有类别的聚类汇总值。",
    totalSpans: "\"TOTAL\" 代表涵盖全部协调分类码的聚合和。",
    
    // 额外项
    export: "出口",
    import: "进口"
  }
};
