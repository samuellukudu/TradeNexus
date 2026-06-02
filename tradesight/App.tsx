import { useEffect, useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  AreaChart,
  Area
} from 'recharts';
import {
  ArrowRightLeft,
  Search,
  Globe2,
  TrendingUp,
  Package,
  Activity,
  AlertCircle,
  Sparkles,
  Briefcase,
  Store,
  Send,
  HelpCircle,
  CheckCircle,
  FileText,
  Coins,
  Percent,
  Download,
  Terminal,
  X
} from 'lucide-react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { BM25 } from './lib/bm25';
import {
  fetchTradeData,
  fetchReporters,
  fetchPartners,
  fetchHsCodes,
  TradeRecord,
  ReferenceItem
} from './services/comtradeAPI';
import { LandingPage } from './LandingPage';
import { fetchWorldBankData } from './services/worldBankAPI';
import { TRANSLATIONS, Language } from './lib/translations';
import { generateRecommendations, generateAdvisorChat, hasTradesightGeminiKey } from './services/geminiService';

const HS_CODES = [
  { id: 'TOTAL', text: 'All Commodities (TOTAL)' },
  { id: '85', text: '85 - Electrical machinery and equipment' },
  { id: '84', text: '84 - Machinery and mechanical appliances' },
  { id: '87', text: '87 - Vehicles and Automotive' },
  { id: '27', text: '27 - Mineral fuels and oils' },
  { id: '30', text: '30 - Pharmaceutical products' },
  { id: '39', text: '39 - Plastics and articles thereof' },
  { id: '90', text: '90 - Optical and photographic instruments' },
  { id: '10', text: '10 - Cereals' },
];

function formatCommodityText(text: string, id: string = ''): string {
  if (!text) return text;
  let clean = text;
  if (id && clean.startsWith(`${id} - `)) {
    clean = clean.replace(`${id} - `, '');
  }
  clean = clean.replace(/(?:--\s*)?(?:[Oo]f a kind\s*)/i, '');
  clean = clean.replace(/^[- ]+/, ''); // remove any leading dashes or spaces
  if (!clean) return text;
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return '—';
  if (value === 0) return '$0';
  const rounded = Math.round(value);
  if (rounded >= 1_000_000_000) return `$${(rounded / 1_000_000_000).toFixed(2)}B`;
  if (rounded >= 1_000_000) return `$${(rounded / 1_000_000).toFixed(2)}M`;
  return `$${rounded.toLocaleString()}`;
}

const TopCommoditiesChart = ({ data, title, hsCodes, color, lang }: { data: any[], title: string, hsCodes: any[], color: string, lang: Language }) => {
  const chartData = useMemo(() => {
    // Recharts vertical barchart plots array from top to bottom.
    // Since data is already top 10 descending (largest first), the largest will be at the top!
    return data.map(d => {
      const fullText = d.cmdDesc || hsCodes.find((c: any) => c.id === d.cmdCode)?.text || '';
      return {
        ...d,
        name: formatCommodityText(fullText, d.cmdCode),
        shortName: `HS ${d.cmdCode}`
      };
    });
  }, [data, hsCodes]);

  if (!data || data.length === 0) return null;

  return (
    <div className="bg-[#0b0f19] p-4 rounded-xl border border-slate-800/80 shadow-sm h-[360px]">
      <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-slate-200">
        <Package className="w-4 h-4 text-slate-400" />
        {title}
      </h3>
      <div className="h-[275px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#1e293b" />
            <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(value) => `$${value / 1000000000}B`} tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis type="category" dataKey="shortName" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} width={60} />
            <Tooltip 
              cursor={{fill: '#1e293b'}}
              contentStyle={{ borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #1e293b', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)', maxWidth: '300px', whiteSpace: 'normal', color: '#f8fafc' }}
              formatter={(value: number) => [formatCurrency(value), lang === 'en' ? 'Value' : '交易额']}
              labelFormatter={(label, payload) => {
                if (payload && payload.length > 0) return payload[0].payload.name;
                return label;
              }}
            />
            <Bar dataKey="primaryValue" fill={color} radius={[0, 4, 4, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const TopPartnersOverTimeChart = ({ data, title, partners, type = 'area', lang }: { data: any[], title: string, partners: any[], type?: 'line' | 'area', lang: Language }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Group by period
    const years = Array.from(new Set(data.map(d => d.period))).sort();
    const partnersByCode = Array.from(new Set(data.map(d => d.partnerCode)));
    
    return years.map(year => {
      const yearData: any = { year };
      partnersByCode.forEach(pCode => {
        const record = data.find(d => d.period === year && d.partnerCode === pCode);
        const partnerName = partners.find(p => String(p.id) === String(pCode))?.text || (lang === 'en' ? `Partner ${pCode}` : `贸易伙伴 ${pCode}`);
        yearData[partnerName] = record ? record.primaryValue : 0;
      });
      return yearData;
    });
  }, [data, partners, lang]);

  const partnerNames = useMemo(() => {
    if (!data || data.length === 0) return [];
    const partnersByCode = Array.from(new Set(data.map(d => d.partnerCode)));
    
    // Group totals to sort partners descending
    const partnerTotals: { [key: string]: number } = {};
    partnersByCode.forEach(pCode => {
      const partnerName = partners.find(p => String(p.id) === String(pCode))?.text || (lang === 'en' ? `Partner ${pCode}` : `贸易伙伴 ${pCode}`);
      const total = data
        .filter(d => d.partnerCode === pCode)
        .reduce((sum, d) => sum + (d.primaryValue || 0), 0);
      partnerTotals[partnerName] = total;
    });

    // Sort partners by their total value descending
    return Object.keys(partnerTotals).sort((a, b) => partnerTotals[b] - partnerTotals[a]);
  }, [data, partners, lang]);

  const colors = [
    "#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", 
    "#14B8A6", "#F97316", "#06B6D4", "#EC4899", "#84CC16"
  ];

  if (!data || data.length === 0) return null;

  return (
    <div className="bg-[#0b0f19] p-4 rounded-xl border border-slate-800/80 shadow-sm h-[360px]">
      <div className="mb-3">
        <h3 className="text-sm font-bold flex items-center gap-2 text-slate-200">
          <Activity className="w-4 h-4 text-indigo-400" />
          {title}
        </h3>
      </div>
      <div className="h-[275px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
              <YAxis tickFormatter={(val) => `$${val / 1000000000}B`} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={60} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #1e293b', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)', fontSize: '12px', color: '#f8fafc' }}
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                itemSorter={(item) => -Number(item.value || 0)}
              />
              {partnerNames.map((name, i) => (
                <Area key={name} type="monotone" dataKey={name} stackId="1" stroke={colors[i%colors.length]} fill={colors[i%colors.length]} />
              ))}
            </AreaChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
              <YAxis tickFormatter={(val) => `$${val / 1000000000}B`} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={60} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #1e293b', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)', fontSize: '12px', color: '#f8fafc' }}
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                itemSorter={(item) => -Number(item.value || 0)}
              />
              {partnerNames.map((name, i) => (
                <Line key={name} type="monotone" dataKey={name} stroke={colors[i%colors.length]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default function App() {
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('tradesight_lang') as Language) || 'en');
  
  useEffect(() => {
    localStorage.setItem('tradesight_lang', lang);
  }, [lang]);

  const t = (key: string) => TRANSLATIONS[lang]?.[key] || key;

  const [showLanding, setShowLanding] = useState<boolean>(() => {
    const saved = localStorage.getItem('tradesight_showLanding');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [reporters, setReporters] = useState<ReferenceItem[]>([]);
  const [partners, setPartners] = useState<ReferenceItem[]>([]);
  const [hsCodes, setHsCodes] = useState<ReferenceItem[]>([]);
  
  const [importer, setImporter] = useState(() => localStorage.getItem('tradesight_importer') || '842'); // Default: USA
  const [exporter, setExporter] = useState(() => localStorage.getItem('tradesight_exporter') || '156'); // Default: China
  const [cmdCode, setCmdCode] = useState(() => localStorage.getItem('tradesight_cmdCode') || 'TOTAL');
  const [hsSearchTerm, setHsSearchTerm] = useState(() => localStorage.getItem('tradesight_hsSearchTerm') || 'TOTAL');
  const [isHsDropdownOpen, setIsHsDropdownOpen] = useState(false);
  
  useEffect(() => {
    if (cmdCode === 'TOTAL') {
      setHsSearchTerm(lang === 'en' ? 'All Commodities (TOTAL)' : '全部商品分类 (TOTAL)');
    }
  }, [lang, cmdCode]);
  
  const [tradeImports, setTradeImports] = useState<TradeRecord[]>([]);
  const [tradeExports, setTradeExports] = useState<TradeRecord[]>([]);
  const [wbImports, setWbImports] = useState<{ date: string; value: number | null }[]>([]);
  const [wbExports, setWbExports] = useState<{ date: string; value: number | null }[]>([]);
  const [wbFdiInflows, setWbFdiInflows] = useState<{ date: string; value: number | null }[]>([]);
  const [wbFdiOutflows, setWbFdiOutflows] = useState<{ date: string; value: number | null }[]>([]);
  const [wbCapitalFormation, setWbCapitalFormation] = useState<{ date: string; value: number | null }[]>([]);
  const [wbRemittances, setWbRemittances] = useState<{ date: string; value: number | null }[]>([]);
  const [wbGdp, setWbGdp] = useState<{ date: string; value: number | null }[]>([]);
  const [wbReserves, setWbReserves] = useState<{ date: string; value: number | null }[]>([]);
  const [wbGdpCapitaPpp, setWbGdpCapitaPpp] = useState<{ date: string; value: number | null }[]>([]);
  const [wbInflation, setWbInflation] = useState<{ date: string; value: number | null }[]>([]);
  const [topImports, setTopImports] = useState<TradeRecord[]>([]);
  const [topExports, setTopExports] = useState<TradeRecord[]>([]);
  const [topImportPartnersOverTime, setTopImportPartnersOverTime] = useState<TradeRecord[]>([]);
  const [topExportPartnersOverTime, setTopExportPartnersOverTime] = useState<TradeRecord[]>([]);
  
  const [dashboardTab, setDashboardTab] = useState<'comtrade-analytics' | 'worldbank-analytics' | 'strategic-feed'>(() => {
    const saved = localStorage.getItem('tradesight_dashboardTab');
    return (saved === 'comtrade-analytics' || saved === 'worldbank-analytics' || saved === 'strategic-feed') ? saved : 'strategic-feed';
  }); 
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'overview' | 'breakdowns' | 'records'>(() => {
    const saved = localStorage.getItem('tradesight_analyticsSubTab');
    return (saved === 'overview' || saved === 'breakdowns' || saved === 'records') ? saved : 'overview';
  }); 
  const dataSource = (dashboardTab === 'worldbank-analytics') ? 'worldbank' : 'comtrade';
  const [wbCategory, setWbCategory] = useState<'trade' | 'fdi' | 'investment' | 'gdp' | 'consumer'>(() => {
    const saved = localStorage.getItem('tradesight_wbCategory');
    return (saved === 'trade' || saved === 'fdi' || saved === 'investment' || saved === 'gdp' || saved === 'consumer') ? saved : 'trade';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adviceSegment, setAdviceSegment] = useState<'founder' | 'merchant'>(() => {
    const saved = localStorage.getItem('tradesight_adviceSegment');
    return (saved === 'founder' || saved === 'merchant') ? saved : 'founder';
  });
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isAdviceAiGenerated, setIsAdviceAiGenerated] = useState(false);
  const [selectedAdviceCardId, setSelectedAdviceCardId] = useState<string | null>(null);

  // Live Consultation chat states
  const currentYear = new Date().getFullYear();
  const [sliderRange, setSliderRange] = useState<[number, number]>([currentYear - 12, currentYear]);
  const [customPeriod, setCustomPeriod] = useState<string>('');
  const [advisorQuery, setAdvisorQuery] = useState('');
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model', text: string }[]>(() => {
    try {
      const saved = localStorage.getItem('tradesight_chatMessages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [advisorChatError, setAdvisorChatError] = useState<string | null>(null);

  // Persist session parameters to local storage
  useEffect(() => {
    localStorage.setItem('tradesight_showLanding', JSON.stringify(showLanding));
  }, [showLanding]);

  useEffect(() => {
    localStorage.setItem('tradesight_dashboardTab', dashboardTab);
  }, [dashboardTab]);

  useEffect(() => {
    localStorage.setItem('tradesight_analyticsSubTab', analyticsSubTab);
  }, [analyticsSubTab]);

  useEffect(() => {
    localStorage.setItem('tradesight_importer', importer);
  }, [importer]);

  useEffect(() => {
    localStorage.setItem('tradesight_exporter', exporter);
  }, [exporter]);

  useEffect(() => {
    localStorage.setItem('tradesight_cmdCode', cmdCode);
  }, [cmdCode]);

  useEffect(() => {
    localStorage.setItem('tradesight_hsSearchTerm', hsSearchTerm);
  }, [hsSearchTerm]);

  useEffect(() => {
    localStorage.setItem('tradesight_wbCategory', wbCategory);
  }, [wbCategory]);

  useEffect(() => {
    localStorage.setItem('tradesight_adviceSegment', adviceSegment);
  }, [adviceSegment]);

  useEffect(() => {
    localStorage.setItem('tradesight_chatMessages', JSON.stringify(chatMessages));
  }, [chatMessages]);


  const reporterName = useMemo(() => {
    return reporters.find(r => String(r.id) === String(importer))?.text || 'Selected Country';
  }, [reporters, importer]);

  const partnerName = useMemo(() => {
    if (exporter === '0') return 'World (All Partners)';
    return partners.find(p => String(p.id) === String(exporter))?.text || 'Partner Country';
  }, [partners, exporter]);

  const wbLabels = useMemo(() => {
    const isZh = lang === 'zh';
    if (wbCategory === 'fdi') {
      return {
        title: isZh ? "外商直接投资 (FDI) 变动态势" : "Foreign Direct Investment (FDI) Trend",
        importLabel: isZh ? "外国直接投资净流入额 (BoP, 现价美元)" : "FDI Net Inflows (BoP, Current USD)",
        exportLabel: isZh ? "外国直接投资净流出额 (BoP, 现价美元)" : "FDI Net Outflows (BoP, Current USD)",
        latestImportTitle: isZh ? "FDI 净流入额" : "FDI Net Inflows",
        latestExportTitle: isZh ? "FDI 净流出额" : "FDI Net Outflows",
      };
    } else if (wbCategory === 'investment') {
      return {
        title: isZh ? "资产与商业基础投资大趋势" : "Capital & General Investment Trend",
        importLabel: isZh ? "资本形成总额 (投资比例)" : "Gross Capital Formation (Investment)",
        exportLabel: isZh ? "海外侨汇流入总数" : "Personal Remittances Received",
        latestImportTitle: isZh ? "固定资产投资总额" : "Gross Cap. Formation",
        latestExportTitle: isZh ? "侨汇收入额" : "Remittances Received",
      };
    } else if (wbCategory === 'gdp') {
      return {
        title: isZh ? "宏观体量与安全资产储备: GDP 与外汇及黄金储备" : "Economy Size & Assets: GDP & Central Reserves",
        importLabel: isZh ? "国内生产总值 (GDP, 现价美元)" : "Gross Domestic Product (GDP, Current USD)",
        exportLabel: isZh ? "中央官方储备资产总数 (含黄金)" : "Total International Reserves (inc. Gold)",
        latestImportTitle: isZh ? "国内生产总值" : "Gross Domestic Product",
        latestExportTitle: isZh ? "国际储备资产" : "Total Int. Reserves",
      };
    } else if (wbCategory === 'consumer') {
      return {
        title: isZh ? "消费层购买力与宏观市场价格健康走势" : "Market Purchasing Power & Consumer Health Trend",
        importLabel: isZh ? "人均 GDP, 购买力平价 (不变2017国际元)" : "GDP per Capita, PPP (Constant 2017 Int $)",
        exportLabel: isZh ? "CPI 消费者通货膨胀率 (年百分比 %)" : "Inflation, Consumer Prices (Annual %)",
        latestImportTitle: isZh ? "人均 GDP (PPP)" : "GDP per Capita (PPP)",
        latestExportTitle: isZh ? "消费者物价通胀率" : "Consumer Inflation Value",
      };
    } else {
      return {
        title: isZh ? "世界银行汇总商品贸易流向" : "World Bank Total Global Trade",
        importLabel: isZh ? "世行汇总统计进口" : "WB Total Global Imports",
        exportLabel: isZh ? "世行汇总统计出口" : "WB Total Global Exports",
        latestImportTitle: isZh ? "最新世行全局进口" : "Latest WB Global Imports",
        latestExportTitle: isZh ? "最新世行全局出口" : "Latest WB Global Exports",
      };
    }
  }, [wbCategory, lang]);

  const hsCodeSearcher = useMemo(() => {
    return new BM25(hsCodes);
  }, [hsCodes]);

  const filteredCodes = useMemo(() => {
    if (!hsSearchTerm) return hsCodes.slice(0, 100);
    const term = hsSearchTerm.trim();
    if (!term) return hsCodes.slice(0, 100);
    
    const results = hsCodeSearcher.search(term);
    return results.map(r => r.item).slice(0, 100);
  }, [hsSearchTerm, hsCodes, hsCodeSearcher]);

  useEffect(() => {
    Promise.all([fetchReporters(), fetchPartners(), fetchHsCodes()]).then(([reps, parts, codes]) => {
      setReporters(reps);
      setPartners(parts);
      
      // Fallback for HS codes if API fails or returns empty
      if (codes && codes.length > 0) {
        setHsCodes(codes);
      } else {
        setHsCodes(HS_CODES);
      }
    });
  }, []);

  useEffect(() => {
    // Only search if there's a valid selection
    if (!importer || !exporter || !cmdCode) return;
    
    setIsLoading(true);
    setError(null);

    const validYears = [...Array(13)].map((_, i) => (new Date().getFullYear()) - i).join(',');
    const activePeriodRaw = customPeriod.trim() ? customPeriod.trim() : validYears;
    const activePeriod = activePeriodRaw.toLowerCase() === 'all' ? validYears : activePeriodRaw;

    const promises: Promise<any>[] = [];
    
    if (dataSource === 'comtrade') {
      promises.push(fetchTradeData(importer, exporter, 'M', cmdCode, activePeriod).catch(() => []));
      promises.push(fetchTradeData(importer, exporter, 'X', cmdCode, activePeriod).catch(() => []));
    } else {
      promises.push(Promise.resolve([]));
      promises.push(Promise.resolve([]));
    }

    if (dataSource === 'worldbank') {
      const reporterIsoAlpha3 = reporters.find(r => String(r.id) === String(importer))?.reporterCodeIsoAlpha3;
      if (reporterIsoAlpha3) {
        promises.push(fetchWorldBankData(reporterIsoAlpha3, 'TM.VAL.MRCH.WL.CD').catch(() => []));
        promises.push(fetchWorldBankData(reporterIsoAlpha3, 'TX.VAL.MRCH.WL.CD').catch(() => []));
        promises.push(fetchWorldBankData(reporterIsoAlpha3, 'BX.KLT.DINV.CD.WD').catch(() => []));
        promises.push(fetchWorldBankData(reporterIsoAlpha3, 'BM.KLT.DINV.CD.WD').catch(() => []));
        promises.push(fetchWorldBankData(reporterIsoAlpha3, 'NE.GDI.FTOT.CD').catch(() => []));
        promises.push(fetchWorldBankData(reporterIsoAlpha3, 'BX.TRF.PWKR.CD.DT').catch(() => []));
        promises.push(fetchWorldBankData(reporterIsoAlpha3, 'NY.GDP.MKTP.CD').catch(() => []));
        promises.push(fetchWorldBankData(reporterIsoAlpha3, 'FI.RES.TOTL.CD').catch(() => []));
        promises.push(fetchWorldBankData(reporterIsoAlpha3, 'NY.GDP.PCAP.PP.KD').catch(() => []));
        promises.push(fetchWorldBankData(reporterIsoAlpha3, 'FP.CPI.TOTL.ZG').catch(() => []));
      } else {
        for (let i = 0; i < 10; i++) {
          promises.push(Promise.resolve([]));
        }
      }
    } else {
      for (let i = 0; i < 10; i++) {
        promises.push(Promise.resolve([]));
      }
    }

    if (cmdCode === 'TOTAL') {
      const targetExporter = dataSource === 'worldbank' ? '0' : exporter;
      promises.push(fetchTradeData(importer, targetExporter, 'M', 'AG2').catch(() => []));
      promises.push(fetchTradeData(importer, targetExporter, 'X', 'AG2').catch(() => []));
      
      if (dataSource === 'worldbank' || exporter === '0') {
        const fetchTopPartnersOverTime = async (flowCode: string) => {
          try {
            const list = await fetchTradeData(importer, '', flowCode, 'TOTAL', '2023');
            if (!list || list.length === 0) return [];
            const top10 = list.filter((r: any) => r.partnerCode !== 0).sort((a: any, b: any) => b.primaryValue - a.primaryValue).slice(0, 10);
            const top10Codes = top10.map((r: any) => r.partnerCode).join(',');
            if (!top10Codes) return [];
            return await fetchTradeData(importer, top10Codes, flowCode, 'TOTAL');
          } catch (e) {
            return [];
          }
        };
        promises.push(fetchTopPartnersOverTime('M'));
        promises.push(fetchTopPartnersOverTime('X'));
      } else {
        promises.push(Promise.resolve([]));
        promises.push(Promise.resolve([]));
      }
    } else {
      promises.push(Promise.resolve([]));
      promises.push(Promise.resolve([]));
      promises.push(Promise.resolve([]));
      promises.push(Promise.resolve([]));
    }

    Promise.all(promises)
      .then(([
        tradeM, tradeX, 
        wbM, wbX, wbFdiIn, wbFdiOut, wbCap, wbRem, wbG, wbR, wbGpp, wbInf,
        topImportsResult, topExportsResult, 
        topImportPts, topExportPts
      ]) => {
        setTradeImports([...tradeM].sort((a, b) => parseInt(a.period) - parseInt(b.period)));
        setTradeExports([...tradeX].sort((a, b) => parseInt(a.period) - parseInt(b.period)));
        setWbImports(wbM);
        setWbExports(wbX);
        setWbFdiInflows(wbFdiIn);
        setWbFdiOutflows(wbFdiOut);
        setWbCapitalFormation(wbCap);
        setWbRemittances(wbRem);
        setWbGdp(wbG);
        setWbReserves(wbR);
        setWbGdpCapitaPpp(wbGpp);
        setWbInflation(wbInf);
        
        if (topImportPts) setTopImportPartnersOverTime(topImportPts);
        if (topExportPts) setTopExportPartnersOverTime(topExportPts);

        // Process top 10 imports
        if (topImportsResult && topImportsResult.length > 0) {
          const latestYear = Math.max(...topImportsResult.map((d: any) => parseInt(d.period)));
          const latestData = topImportsResult.filter((d: any) => parseInt(d.period) === latestYear);
          
          const uniqueDataMap = new Map();
          latestData.forEach((d: any) => {
            if (!uniqueDataMap.has(d.cmdCode) || uniqueDataMap.get(d.cmdCode).primaryValue < d.primaryValue) {
              uniqueDataMap.set(d.cmdCode, d);
            }
          });
          
          const uniqueData = Array.from(uniqueDataMap.values());
          setTopImports(uniqueData.sort((a: any, b: any) => b.primaryValue - a.primaryValue).slice(0, 10));
        } else {
          setTopImports([]);
        }

        // Process top 10 exports
        if (topExportsResult && topExportsResult.length > 0) {
          const latestYear = Math.max(...topExportsResult.map((d: any) => parseInt(d.period)));
          const latestData = topExportsResult.filter((d: any) => parseInt(d.period) === latestYear);
          
          const uniqueDataMap = new Map();
          latestData.forEach((d: any) => {
            if (!uniqueDataMap.has(d.cmdCode) || uniqueDataMap.get(d.cmdCode).primaryValue < d.primaryValue) {
              uniqueDataMap.set(d.cmdCode, d);
            }
          });
          
          const uniqueData = Array.from(uniqueDataMap.values());
          setTopExports(uniqueData.sort((a: any, b: any) => b.primaryValue - a.primaryValue).slice(0, 10));
        } else {
          setTopExports([]);
        }
      })
      .catch(err => {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [importer, exporter, cmdCode, dataSource, reporters, wbCategory, customPeriod]);

  // Clean chat histories when advisory parameters are changed
  useEffect(() => {
    setChatMessages([]);
    setAdvisorChatError(null);
  }, [importer, adviceSegment, cmdCode]);

  const exportToCSV = () => {
    if (!mergedChartData || mergedChartData.length === 0) return;
    
    let headers = ['Year'];
    if (dataSource !== 'worldbank') {
      headers = [...headers, 'Imports Value (USD)', 'Imports YoY (%)', 'Exports Value (USD)', 'Exports YoY (%)'];
    } else {
      if (wbCategory === 'financial') headers = [...headers, 'Capital Formation (% of GDP)', 'Remittances (% of GDP)'];
      else if (wbCategory === 'general') headers = [...headers, 'GDP (USD)', 'Reserves (USD)'];
      else if (wbCategory === 'macro') headers = [...headers, 'GDP per Capita (PPP)', 'Inflation (%)'];
      else if (wbCategory === 'trade') headers = [...headers, 'Total Imports (% of GDP)', 'Total Exports (% of GDP)'];
      else if (wbCategory === 'fdi') headers = [...headers, 'FDI Net Inflows (% of GDP)', 'FDI Net Outflows (% of GDP)'];
    }

    const csvRows = [headers.join(',')];
    
    mergedChartData.forEach(row => {
      const rowValues = [row.year];
      if (dataSource !== 'worldbank') {
        rowValues.push(row.tradeM || '');
        rowValues.push(row.tradeM_yoy ? String(row.tradeM_yoy) : '');
        rowValues.push(row.tradeX || '');
        rowValues.push(row.tradeX_yoy ? String(row.tradeX_yoy) : '');
      } else {
        if (wbCategory === 'financial') {
          rowValues.push(row.capital || '');
          rowValues.push(row.remittance || '');
        } else if (wbCategory === 'general') {
          rowValues.push(row.gdp || '');
          rowValues.push(row.reserves || '');
        } else if (wbCategory === 'macro') {
          rowValues.push(row.gdpCapitaPpp || '');
          rowValues.push(row.inflation || '');
        } else if (wbCategory === 'trade') {
          rowValues.push(row.tradeM || '');
          rowValues.push(row.tradeX || '');
        } else if (wbCategory === 'fdi') {
          rowValues.push(row.fdiIn || '');
          rowValues.push(row.fdiOut || '');
        }
      }
      csvRows.push(rowValues.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tradesight_data_${dataSource}_${new Date().getTime()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSendAdvisorChat = async (forcedQuery?: string) => {
    const activeQuery = forcedQuery || advisorQuery;
    const queryToSubmit = activeQuery.trim();
    if (!queryToSubmit) return;

    if (!forcedQuery) {
      setAdvisorQuery('');
    }

    // Append user message immediately
    const updatedMessages = [...chatMessages, { role: 'user' as const, text: queryToSubmit }];
    setChatMessages(updatedMessages);
    setIsChatLoading(true);
    setAdvisorChatError(null);

    const countryName = reporters.find(r => String(r.id) === String(importer))?.text || 'Selected Country';
    const commodityText = hsCodes.find(c => c.id === cmdCode)?.text || cmdCode;

    try {
      const data = await generateAdvisorChat(
        countryName,
        adviceSegment,
        queryToSubmit,
        chatMessages,
        wbStats.gdp?.formatted || 'N/A',
        wbStats.fdiIn?.formatted || 'N/A',
        commodityText,
        wbStats.gdpCapitaPpp?.formatted || 'N/A',
        wbStats.inflation?.formatted || 'N/A'
      );

      setChatMessages([...updatedMessages, { role: 'model' as const, text: data.text || 'Advisor is analyzing logs.' }]);
      if (data.error) {
        setAdvisorChatError(data.error);
      }
    } catch (err: any) {
      console.error(err);
      setAdvisorChatError(err.message || 'Connection lost to Gemini advisor.');
    } finally {
      setIsChatLoading(false);
    }
  };

  const mergedChartData = useMemo(() => {
    if (
      !tradeImports.length && 
      !tradeExports.length &&
      !wbImports.length && 
      !wbExports.length &&
      !wbFdiInflows.length && 
      !wbFdiOutflows.length &&
      !wbCapitalFormation.length && 
      !wbRemittances.length &&
      !wbGdp.length && 
      !wbReserves.length &&
      !wbGdpCapitaPpp.length &&
      !wbInflation.length
    ) return [];
    
    // Get unique years
    const years = new Set<string>();
    tradeImports.forEach(d => years.add(d.period));
    tradeExports.forEach(d => years.add(d.period));
    wbImports.forEach(d => years.add(d.date));
    wbExports.forEach(d => years.add(d.date));
    wbFdiInflows.forEach(d => years.add(d.date));
    wbFdiOutflows.forEach(d => years.add(d.date));
    wbCapitalFormation.forEach(d => years.add(d.date));
    wbRemittances.forEach(d => years.add(d.date));
    wbGdp.forEach(d => years.add(d.date));
    wbReserves.forEach(d => years.add(d.date));
    wbGdpCapitaPpp.forEach(d => years.add(d.date));
    wbInflation.forEach(d => years.add(d.date));

    return Array.from(years).sort().filter(year => {
      const activePeriodStr = customPeriod.trim() || [...Array(13)].map((_, i) => (new Date().getFullYear()) - i).join(',');
      const allowedYears = activePeriodStr.split(',').map(s => s.trim());
      // Only apply filter if custom period seems valid or if we have default periods. 
      // If user typed "all" or something, don't filter.
      if (allowedYears.length === 1 && allowedYears[0].toLowerCase() === 'all') return true;
      if (allowedYears.length > 0 && !allowedYears.includes(year)) return false;
      return true;
    }).map(year => {
      const tdM = tradeImports.find(d => d.period === year);
      const tdX = tradeExports.find(d => d.period === year);
      const wbdM = wbImports.find(d => d.date === year);
      const wbdX = wbExports.find(d => d.date === year);
      const fdiIn = wbFdiInflows.find(d => d.date === year);
      const fdiOut = wbFdiOutflows.find(d => d.date === year);
      const cap = wbCapitalFormation.find(d => d.date === year);
      const rem = wbRemittances.find(d => d.date === year);
      const gdp = wbGdp.find(d => d.date === year);
      const res = wbReserves.find(d => d.date === year);
      const gdpCap = wbGdpCapitaPpp.find(d => d.date === year);
      const inf = wbInflation.find(d => d.date === year);
      return {
        period: year,
        comtradeImport: tdM ? tdM.primaryValue : null,
        comtradeExport: tdX ? tdX.primaryValue : null,
        worldBankImport: wbdM ? wbdM.value : null,
        worldBankExport: wbdX ? wbdX.value : null,
        worldBankFdiIn: fdiIn ? fdiIn.value : null,
        worldBankFdiOut: fdiOut ? fdiOut.value : null,
        worldBankCapital: cap ? cap.value : null,
        worldBankRemittances: rem ? rem.value : null,
        worldBankGdp: gdp ? gdp.value : null,
        worldBankReserves: res ? res.value : null,
        worldBankGdpCapitaPpp: gdpCap ? gdpCap.value : null,
        worldBankInflation: inf ? inf.value : null,
      };
    });
  }, [
    tradeImports, tradeExports, 
    wbImports, wbExports, 
    wbFdiInflows, wbFdiOutflows, 
    wbCapitalFormation, wbRemittances, 
    wbGdp, wbReserves,
    wbGdpCapitaPpp, wbInflation
  ]);

  const latestStats = useMemo(() => {
    let focusDataM: any[] = [];
    let focusDataX: any[] = [];
    let valueField = '';
    
    if (dataSource === 'worldbank') {
      valueField = 'value';
      if (wbCategory === 'fdi') {
        focusDataM = wbFdiInflows;
        focusDataX = wbFdiOutflows;
      } else if (wbCategory === 'investment') {
        focusDataM = wbCapitalFormation;
        focusDataX = wbRemittances;
      } else if (wbCategory === 'gdp') {
        focusDataM = wbGdp;
        focusDataX = wbReserves;
      } else if (wbCategory === 'consumer') {
        focusDataM = wbGdpCapitaPpp;
        focusDataX = wbInflation;
      } else {
        focusDataM = wbImports;
        focusDataX = wbExports;
      }
    } else {
      focusDataM = tradeImports;
      focusDataX = tradeExports;
      valueField = 'primaryValue';
    }

    if (!focusDataM || focusDataM.length === 0) return null;
    const latestM = focusDataM[focusDataM.length - 1];
    const previousM = focusDataM.length > 1 ? focusDataM[focusDataM.length - 2] : null;
    const valueM = latestM[valueField] || 0;
    const prevValueM = previousM?.[valueField] || 0;
    const YoY_M = prevValueM ? ((valueM - prevValueM) / prevValueM) * 100 : 0;

    const latestX = focusDataX[focusDataX.length - 1];
    const previousX = focusDataX.length > 1 ? focusDataX[focusDataX.length - 2] : null;
    const valueX = latestX?.[valueField] || 0;
    const prevValueX = previousX?.[valueField] || 0;
    const YoY_X = prevValueX ? ((valueX - prevValueX) / prevValueX) * 100 : 0;
    
    return {
      period: latestM.period || latestM.date,
      value: valueM,
      formattedM: wbCategory === 'consumer' ? `$${Math.round(valueM).toLocaleString()}` : formatCurrency(valueM),
      formattedX: wbCategory === 'consumer' ? `${valueX.toFixed(2)}%` : formatCurrency(valueX),
      YoY_M: YoY_M.toFixed(1),
      YoY_X: YoY_X.toFixed(1),
      isIncreaseM: valueM > prevValueM,
      isIncreaseX: valueX > prevValueX
    };
  }, [
    tradeImports, tradeExports, 
    wbImports, wbExports, 
    wbFdiInflows, wbFdiOutflows, 
    wbCapitalFormation, wbRemittances, 
    wbGdp, wbReserves, 
    wbGdpCapitaPpp, wbInflation,
    dataSource, wbCategory
  ]);

  const getWbLatestVal = (list: { date: string; value: number | null }[], formatType?: 'percent' | 'hours' | 'usd' | 'currency' | 'number' | 'rate' | boolean) => {
    if (!list || list.length === 0) return null;
    const filtered = list.filter(d => d.value !== null && d.value !== undefined);
    if (filtered.length === 0) return null;
    const latest = filtered[filtered.length - 1];
    const prev = filtered.length > 1 ? filtered[filtered.length - 2] : null;
    const val = latest.value || 0;
    const pVal = prev?.value || 0;
    const YoY = pVal ? ((val - pVal) / pVal) * 100 : 0;
    
    let formattedVal = '';
    if (formatType === 'percent' || formatType === true) {
      formattedVal = `${val.toFixed(2)}%`;
    } else if (formatType === 'hours') {
      formattedVal = `${val.toFixed(1)} hrs`;
    } else if (formatType === 'usd') {
      formattedVal = `$${Math.round(val).toLocaleString()}`;
    } else if (formatType === 'rate') {
      formattedVal = `${val.toFixed(4)}`;
    } else {
      formattedVal = list === wbGdpCapitaPpp ? `$${Math.round(val).toLocaleString()}` : formatCurrency(val);
    }

    return {
      period: latest.date,
      value: val,
      formatted: formattedVal,
      YoY: YoY.toFixed(1),
      isIncrease: val > pVal
    };
  };

  const wbStats = useMemo(() => {
    return {
      tradeM: getWbLatestVal(wbImports),
      tradeX: getWbLatestVal(wbExports),
      fdiIn: getWbLatestVal(wbFdiInflows),
      fdiOut: getWbLatestVal(wbFdiOutflows),
      capital: getWbLatestVal(wbCapitalFormation),
      remittance: getWbLatestVal(wbRemittances),
      gdp: getWbLatestVal(wbGdp),
      reserves: getWbLatestVal(wbReserves),
      gdpCapitaPpp: getWbLatestVal(wbGdpCapitaPpp),
      inflation: getWbLatestVal(wbInflation, 'percent'),
    };
  }, [
    wbImports, wbExports, 
    wbFdiInflows, wbFdiOutflows, 
    wbCapitalFormation, wbRemittances, 
    wbGdp, wbReserves,
    wbGdpCapitaPpp, wbInflation
  ]);

  // Fetch bespoke B2B & SMB economic recommendations
  useEffect(() => {
    if (!reporters.length) return;
    
    setIsAdviceLoading(true);
    
    const countryName = reporters.find(r => String(r.id) === String(importer))?.text || 'Selected Country';
    const commodityText = hsCodes.find(c => c.id === cmdCode)?.text || cmdCode;
    
    const gdpVal = wbStats.gdp?.formatted || 'N/A';
    const fdiVal = wbStats.fdiIn?.formatted || 'N/A';
    const gdpCapitaPppVal = wbStats.gdpCapitaPpp?.formatted || 'N/A';
    const inflationVal = wbStats.inflation?.formatted || 'N/A';
    
    const trM = dataSource === 'worldbank' ? (wbStats.tradeM?.formatted || 'N/A') : (latestStats?.formattedM || 'N/A');
    const trX = dataSource === 'worldbank' ? (wbStats.tradeX?.formatted || 'N/A') : (latestStats?.formattedX || 'N/A');

    generateRecommendations({
      countryName,
      segment: adviceSegment,
      gdp: gdpVal,
      tradeM: trM,
      tradeX: trX,
      fdi: fdiVal,
      commodity: commodityText,
      gdpCapitaPpp: gdpCapitaPppVal,
      inflation: inflationVal
    })
    .then(data => {
      if (data && Array.isArray(data.recommendations)) {
        setRecommendations(data.recommendations);
        setIsAdviceAiGenerated(!!data.isAiGenerated);
        if (data.recommendations.length > 0) {
          setSelectedAdviceCardId(data.recommendations[0].id);
        }
      }
    })
    .catch(err => {
      console.error("Failed to load bespoke advice feed:", err);
    })
    .finally(() => {
      setIsAdviceLoading(false);
    });
  }, [importer, cmdCode, adviceSegment, reporters, hsCodes, dataSource, wbStats, latestStats]);

  if (showLanding) {
    return (
      <LandingPage 
        onEnter={() => setShowLanding(false)} 
        lang={lang} 
        onToggleLang={() => setLang(prev => prev === 'en' ? 'zh' : 'en')} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 selection:bg-indigo-500/30 selection:text-white font-sans">
      {/* Header */}
      <header className="bg-[#0b0f19]/90 border-b border-slate-900 sticky top-0 z-10 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2.5 sm:py-0 sm:h-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Globe2 className="w-6 h-6 text-indigo-400" />
            <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-100 font-sans">TradeSight B2B</h1>
          </div>          {/* Navigation Tabs */}
          <div className="bg-slate-950 p-1 rounded-lg flex items-center overflow-x-auto max-w-full border border-slate-850">
            <button
               id="tab-comtrade"
              onClick={() => setDashboardTab('comtrade-analytics')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                dashboardTab === 'comtrade-analytics'
                  ? 'bg-slate-800 text-slate-100 shadow-sm font-bold border border-slate-705 border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">{t('unComtradeDesk')}</span>
              <span className="inline sm:hidden">{t('unComtradeDesk').split(' ')[0]}</span>
            </button>
            <button
               id="tab-worldbank"
              onClick={() => setDashboardTab('worldbank-analytics')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                dashboardTab === 'worldbank-analytics'
                  ? 'bg-slate-800 text-slate-100 shadow-sm font-bold border border-slate-705 border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">{t('worldBankIndicators')}</span>
              <span className="inline sm:hidden">{t('worldBankIndicators').split(' ')[0]}</span>
            </button>
            <button
               id="tab-advisor"
              onClick={() => setDashboardTab('strategic-feed')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                dashboardTab === 'strategic-feed'
                  ? 'bg-slate-800 text-slate-100 shadow-sm font-bold border border-slate-705 border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">{t('b2bSmbAdvisor')}</span>
              <span className="inline sm:hidden">{t('b2bSmbAdvisor').split(' ')[0]}</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <a
              href="/"
              className="text-[11px] text-slate-400 hover:text-indigo-400 transition-colors font-semibold"
              title="Back to TradeNexus Hub"
            >
              ← TradeNexus Hub
            </a>
            <div className="hidden md:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 block animate-pulse"></span>
              {t('activeConsultDesk')}
            </div>
            <button
              onClick={() => setLang(prev => prev === 'en' ? 'zh' : 'en')}
              className="px-2.5 py-1 rounded-lg border border-slate-800 bg-[#030712] text-[11px] font-sans hover:bg-slate-800 hover:text-indigo-400 transition-all font-semibold cursor-pointer text-slate-350"
            >
              {lang === 'en' ? '中文 (ZH)' : 'English (EN)'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 py-3 flex flex-col lg:flex-row gap-3">
        
        {/* Sidebar Controls */}
        <div className="w-full lg:w-72 flex-shrink-0 space-y-3">
          <div className="bg-[#0b0f19] p-3.5 rounded-xl border border-slate-800/80 shadow-sm space-y-3">
            <div>
              <h2 className="text-base font-bold text-slate-100 mb-0.5 font-sans">
                {dataSource === 'worldbank' ? t('macroDesk') : t('tradeDesk')}
              </h2>
              <p className="text-xs text-slate-400">
                {dataSource === 'worldbank' 
                  ? t('macroDesc') 
                  : t('tradeDesc')}
              </p>
            </div>
            
            <div className="space-y-2.5">
              <div className="pt-2 border-t border-slate-800/60">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {t('reportingCountry')}
                </label>
                <select
                  value={importer}
                  onChange={(e) => setImporter(e.target.value)}
                  className="w-full bg-[#030712] border border-slate-800 text-slate-200 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 cursor-pointer"
                >
                  <option value="" disabled>{t('selectCountryPlaceholder')}</option>
                  {reporters.map((r) => (
                    <option key={r.id} value={r.id}>{r.text}</option>
                  ))}
                </select>
              </div>

              {dataSource !== 'worldbank' && (
                <>
                  <div className="flex justify-center -my-2 relative z-10">
                    <button 
                      onClick={() => {
                        const temp = importer;
                        setImporter(exporter);
                        setExporter(temp === '0' ? '842' : temp); // prevent world from becoming importer
                      }}
                      className="bg-slate-900 border hover:bg-slate-850 text-slate-400 border-slate-800 rounded-full p-1.5 shadow-sm transition-colors cursor-pointer"
                      title={t('swapCountries')}
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {t('partnerCountry')}
                    </label>
                    <select
                      value={exporter}
                      onChange={(e) => setExporter(e.target.value)}
                      className="w-full bg-[#030712] border border-slate-800 text-slate-200 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 cursor-pointer"
                    >
                      <option value="" disabled>{t('selectCountryPlaceholder')}</option>
                      <option value="0">{t('worldAllPartners')}</option>
                      {partners.map((p) => (
                        <option key={p.id} value={p.id}>{p.text}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-sans">{t('commodityLabel')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                        <Search className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                      <input
                        type="text"
                        value={hsSearchTerm}
                        onChange={(e) => {
                          setHsSearchTerm(e.target.value);
                          setIsHsDropdownOpen(true);
                          if (!e.target.value) {
                             setCmdCode('');
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                             e.preventDefault();
                             const term = hsSearchTerm.trim().toLowerCase();
                             
                             // Prefer exact match first
                             let match = hsCodes.find(c => c.id.toLowerCase() === term || c.text.toLowerCase() === term);
                             
                             if (!match && filteredCodes.length > 0) {
                               // Fallback to top BM25 result
                               match = filteredCodes[0];
                             }
                             
                             if (match) {
                               setCmdCode(match.id);
                               setHsSearchTerm(match.text);
                             } else {
                               setCmdCode('');
                               setHsSearchTerm('');
                             }
                             setIsHsDropdownOpen(false);
                          }
                        }}
                        onFocus={(e) => {
                           setIsHsDropdownOpen(true);
                           const target = e.target;
                           setTimeout(() => {
                             try {
                               target.select();
                             } catch (err) {}
                           }, 50);
                        }}
                        onBlur={() => {
                            setTimeout(() => {
                               setIsHsDropdownOpen(false);
                               
                               const term = hsSearchTerm.trim().toLowerCase();
                               if (!term) {
                                 // If they cleared the input, default to TOTAL aggregate view
                                 setCmdCode('TOTAL');
                                 setHsSearchTerm('All Commodities (TOTAL)');
                               } else {
                                 // Check if current term matches any HS code text or ID
                                 let match = hsCodes.find(c => c.id.toLowerCase() === term || c.text.toLowerCase() === term);
                                 if (!match && filteredCodes.length > 0) {
                                   // If they typed something and matched some results but clicked away, commit the top result
                                   match = filteredCodes[0];
                                 }
                                 
                                 if (match) {
                                   setCmdCode(match.id);
                                   setHsSearchTerm(match.text);
                                 } else {
                                   // Revert to old selected code if nothing matches
                                   const selectedCode = hsCodes.find(c => c.id === cmdCode);
                                   if (selectedCode) {
                                     setHsSearchTerm(selectedCode.text);
                                   } else {
                                     setCmdCode('TOTAL');
                                     setHsSearchTerm(t('allCommoditiesTotal'));
                                   }
                                 }
                               }
                            }, 250);
                        }}
                        placeholder={t('searchByCodeOrName')}
                        className="w-full bg-[#030712] border border-slate-800 text-slate-100 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 px-3 pl-9 cursor-text"
                      />
                      {isHsDropdownOpen && (
                        <div className="absolute z-20 mt-1 w-full bg-[#0f172a] border border-slate-800 shadow-xl max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-y-auto overflow-x-hidden focus:outline-none sm:text-sm">
                          {filteredCodes.map((c) => (
                            <div
                              key={c.id}
                              className="cursor-pointer select-none relative py-2 px-3 hover:bg-slate-800 text-slate-100 flex items-start"
                              onClick={() => {
                                setHsSearchTerm(c.text);
                                setCmdCode(c.id);
                                setIsHsDropdownOpen(false);
                              }}
                            >
                              <span className="font-medium shrink-0 mr-2 text-indigo-400">{c.id}</span>
                              <span className="text-slate-400 break-words">{formatCommodityText(c.text, c.id)}</span>
                            </div>
                          ))}
                          {hsSearchTerm && filteredCodes.length === 0 && (
                            <div className="cursor-default select-none relative py-2 pl-3 pr-9 text-slate-400">
                              {t('noHsCodesFound')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="mt-1.5 text-[10px] text-slate-400 bg-slate-950/40 p-2 rounded-lg border border-slate-900 leading-normal space-y-1">
                      <div className="flex items-center gap-1 font-medium text-slate-300">
                        <HelpCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{t('hsStructureGuide')}</span>
                      </div>
                      <p className="text-slate-400">
                        {lang === 'en' ? (
                          <>
                            <strong className="text-slate-300">H6</strong> represents the 2022 revision of the Harmonized System. The hierarchy consists of <strong className="text-slate-300">97 chapters</strong> (2-digit), <strong className="text-slate-300">1,200+ headings</strong> (4-digit), and <strong className="text-slate-300">5,600+ subheadings</strong> (6-digit). "TOTAL" represents the sum of all commodities.
                          </>
                        ) : (
                          <>
                            <strong className="text-slate-300">H6</strong> 代表协调制度（Harmonized System） 2022 年修订版。该层级结构包含 <strong className="text-slate-300">97个章节</strong>（2位编码）、<strong className="text-slate-300">1,200+个目分类</strong>（4位编码）以及 <strong className="text-slate-300">5,600+个高精子目</strong>（6位商品编码）。"TOTAL" 代表全部实物商品贸易的汇总。
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Data Periods */}
              <div className="pt-2 border-t border-slate-800/60">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-sans">
                    {lang === 'en' ? 'Years Period' : '分析年份区间'}
                  </label>
                  <span className="text-slate-300 font-medium text-xs">
                    {sliderRange[0]} - {sliderRange[1]}
                  </span>
                </div>
                <div className="px-2 pt-2 pb-4">
                  <Slider 
                    range
                    min={currentYear - 20}
                    max={currentYear}
                    value={sliderRange}
                    onChange={(value) => {
                      setSliderRange(value as [number, number]);
                    }}
                    onChangeComplete={(value) => {
                      const range = value as [number, number];
                      const years = [];
                      for (let i = range[1]; i >= range[0]; i--) {
                        years.push(i);
                      }
                      setCustomPeriod(years.join(','));
                    }}
                    railStyle={{ backgroundColor: '#1e293b', height: 4 }}
                    trackStyle={[{ backgroundColor: '#4F46E5', height: 4 }]}
                    handleStyle={[
                      { borderColor: '#4F46E5', height: 16, width: 16, marginTop: -6, backgroundColor: '#0f172a', opacity: 1, boxShadow: 'none' },
                      { borderColor: '#4F46E5', height: 16, width: 16, marginTop: -6, backgroundColor: '#0f172a', opacity: 1, boxShadow: 'none' }
                    ]}
                  />
                </div>
              </div>

              {dataSource === 'worldbank' && (
                <div className="rounded-lg bg-slate-900 p-3 border border-blue-900/40 flex gap-2 text-sm text-blue-400">
                  <div className="shrink-0 mt-0.5">
                    <Globe2 className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-slate-350 leading-relaxed font-sans">
                    {lang === 'en' 
                      ? 'World Bank provides global macroeconomic totals. Exporter and commodity filters are not applicable.' 
                      : '世界银行数据库提供国家宏观经济总量指标。不适用贸易伙伴（出口国）及特定 HS 商品分类过滤器。'}
                  </p>
                </div>
              )}
            </div>
            {/* Dynamic visual diagram explaining active flow */}
            <div className="pt-3 border-t border-slate-800/80 space-y-3">
              {dataSource === 'comtrade' ? (
                <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-850 space-y-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-450 text-slate-400">
                    {lang === 'en' ? 'Active Trade Interactions' : '当前双边贸易流向分析'}
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded bg-[#4F46E5]" />
                          <span>{lang === 'en' ? 'Imports' : '进口额'}</span>
                        </span>
                        <span className="text-slate-500 text-[10px]">{lang === 'en' ? 'Seller ➔ Buyer' : '卖方 ➔ 买方'}</span>
                      </div>
                      <div className="bg-[#030712] px-2 py-1.5 rounded border border-slate-800/80 flex items-center justify-between text-xs transition-all">
                        <span className="font-semibold text-slate-200 truncate max-w-[100px]" title={reporterName}>{reporterName}</span>
                        <span className="text-[#818cf8] font-bold px-1 text-[10px]">{lang === 'en' ? '◀ imports from ◀' : '◀ 进口自 ◀'}</span>
                        <span className="text-slate-300 truncate max-w-[100px]" title={partnerName}>{partnerName}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded bg-[#10B981]" />
                          <span>{lang === 'en' ? 'Exports' : '出口额'}</span>
                        </span>
                        <span className="text-slate-500 text-[10px]">{lang === 'en' ? 'Seller ➔ Buyer' : '卖方 ➔ 买方'}</span>
                      </div>
                      <div className="bg-[#030712] px-2 py-1.5 rounded border border-slate-800/80 flex items-center justify-between text-xs transition-all">
                        <span className="font-semibold text-slate-200 truncate max-w-[100px]" title={reporterName}>{reporterName}</span>
                        <span className="text-emerald-400 font-bold px-1 text-[10px]">{lang === 'en' ? '▶ exports to ▶' : '▶ 出口至 ▶'}</span>
                        <span className="text-slate-300 truncate max-w-[100px]" title={partnerName}>{partnerName}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-850 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-450 text-slate-400">
                    {lang === 'en' ? 'Global Macroeconomic Flow' : '全球宏观资金流向分析'}
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    {wbCategory === 'fdi' ? (
                      <>
                        <div className="flex flex-col gap-1 bg-[#030712] p-2 rounded border border-slate-800/80">
                          <div className="flex items-center gap-1.5 font-semibold text-red-400">
                            <span className="w-2 h-2 rounded bg-red-400" />
                            <span>{lang === 'en' ? 'Def: FDI Net Inflows' : '定义: 外国直接投资 (FDI) 净流入'}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {lang === 'en' 
                              ? `Net investments made by foreign entities into ${reporterName} (additions to capital).`
                              : `境外企业或投资者对 ${reporterName} 境内实业和资本追加的直接股权投资流入额。`}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 bg-[#030712] p-2 rounded border border-slate-800/80">
                          <div className="flex items-center gap-1.5 font-semibold text-[#fbbf24]">
                            <span className="w-2 h-2 rounded bg-[#fbbf24]" />
                            <span>{lang === 'en' ? 'Def: FDI Net Outflows' : '定义: 外国直接投资 (FDI) 净流出'}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {lang === 'en'
                              ? `Net investments made by ${reporterName} enterprises/individuals in entities abroad.`
                              : `${reporterName} 境内资本和本土企业对境外其他国家和地区直接进行的产业或项目投资额。`}
                          </span>
                        </div>
                      </>
                    ) : wbCategory === 'investment' ? (
                      <>
                        <div className="flex flex-col gap-1 bg-[#030712] p-2 rounded border border-slate-800/80">
                          <div className="flex items-center gap-1.5 font-semibold text-red-400">
                            <span className="w-2 h-2 rounded bg-red-400" />
                            <span>{lang === 'en' ? 'Def: Gross Capital Formation' : '定义: 资本形成总额 (固定资产追加)'}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {lang === 'en'
                              ? `Total outlays on additions to fixed assets plus net changes in inventorial stock in ${reporterName}.`
                              : `${reporterName} 境内在追加新的固定资产和非金融性资产上的支出，加上产成品库存净值变动。`}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 bg-[#030712] p-2 rounded border border-slate-800/80">
                          <div className="flex items-center gap-1.5 font-semibold text-[#fbbf24]">
                            <span className="w-2 h-2 rounded bg-[#fbbf24]" />
                            <span>{lang === 'en' ? 'Def: Personal Remittances' : '定义: 个人侨汇及雇员劳动收入'}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {lang === 'en'
                              ? `Personal transfers and compensation of workers received by residents of ${reporterName} from abroad.`
                              : `${reporterName} 常住居民或工薪人员收到的来自海外工作或亲属汇划的外汇资金数额。`}
                          </span>
                        </div>
                      </>
                    ) : wbCategory === 'consumer' ? (
                      <>
                        <div className="flex flex-col gap-1 bg-[#030712] p-2 rounded border border-slate-800/80">
                          <div className="flex items-center gap-1.5 font-semibold text-red-400">
                            <span className="w-2 h-2 rounded bg-red-400" />
                            <span>{lang === 'en' ? 'Def: GDP per Capita (PPP)' : '定义: 人均国内生产总值 (按购买力平价)'}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {lang === 'en'
                              ? "GDP adjusted for Purchasing Power Parity shows real domestic spending capacity."
                              : "经购买力平价（PPP）折算后的人均 GDP，能更合理且客观地体现出本地居民生活的真实购买力水平。"}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 bg-[#030712] p-2 rounded border border-slate-800/80">
                          <div className="flex items-center gap-1.5 font-semibold text-[#fbbf24]">
                            <span className="w-2 h-2 rounded bg-[#fbbf24]" />
                            <span>{lang === 'en' ? 'Def: Inflation Rate' : '定义: 价格通胀变动率'}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {lang === 'en'
                              ? "Annual consumer price level change, tracking cost increases and currency erosion."
                              : "年度消费者物价指数（CPI）的大众生活花费变动率，用以追踪本地居民生活开销增加与本币贬值趋势。"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 bg-[#030712] p-2 rounded border border-slate-800/80">
                          <span className="w-2 h-2 rounded bg-red-400" />
                          <span>
                            {lang === 'en' ? (
                              <><strong className="text-slate-200 font-sans font-bold">Total Imports:</strong> {reporterName} buys from the Rest of World</>
                            ) : (
                              <><strong className="text-slate-200 font-sans font-bold">进口总值量:</strong> {reporterName} 从全球其他经济体进口的商品及服务总额</>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-[#030712] p-2 rounded border border-slate-800/80">
                          <span className="w-2 h-2 rounded bg-[#fbbf24]" />
                          <span>
                            {lang === 'en' ? (
                              <><strong className="text-slate-205 text-slate-200 font-sans font-bold">Total Exports:</strong> {reporterName} sells to the Rest of World</>
                            ) : (
                              <><strong className="text-slate-200 font-sans font-bold">出口总值量:</strong> {reporterName} 向全球其他经济体出口的商品及服务总额</>
                            )}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="text-[11px] text-slate-400 space-y-2 pt-2 border-t border-slate-800/60 font-sans leading-relaxed">
                <strong className="text-slate-300 font-bold font-sans">
                  {lang === 'en' ? 'Data Insights:' : '数据百科与统计口径说明:'}
                </strong>
                <div>
                  • <strong className="text-slate-300">{lang === 'en' ? 'UN Comtrade' : '联合国 Comtrade 数据库'}</strong>{' '}
                  {lang === 'en' 
                    ? 'shows targeted bilateral transactions between countries.' 
                    : '展示的是明确指定的两个交易伙伴（如申报国与伙伴国）之间精确交互的商品双边进出口方向数据。'}
                </div>
                <div>
                  • <strong className="text-slate-300">{lang === 'en' ? 'World Bank' : '世界银行库 (World Bank)'}</strong>{' '}
                  {lang === 'en' 
                    ? "represents a nation's total aggregate macroeconomic transactions with the entire world." 
                    : '展示的是这个特定经济体作为一个主权整体，同全境全球所有国家和地区产生的宏观经济及总体金融流向合集。'}
                </div>
                <div>
                  • <strong className="text-slate-300">{lang === 'en' ? 'What is "H6"?' : '什么是 "H6" 商品分类？'}</strong>{' '}
                  {lang === 'en' 
                    ? 'H6 refers to the 2022 amendment (6th revision) of the Harmonized System used standardly for international trade.' 
                    : 'H6 指商品名称及编码协调制度（Harmonized System）在 2022 年生效执行的第六期修正版，代表当前全球公认的合规海关标准。'}
                </div>
                <div>
                  • <strong className="text-slate-300">{lang === 'en' ? 'HS Structure:' : '协调编码树层级结构:'}</strong>{' '}
                  {lang === 'en' ? (
                    <>Organized hierarchically into <strong className="text-indigo-400 font-semibold">97 Chapters</strong> (2-digit, broad industries), <strong className="text-indigo-400 font-semibold">1,200+ Headings</strong> (4-digit, detail groups), and <strong className="text-indigo-400 font-semibold">5,600+ Subheadings</strong> (6-digit, specific products). "TOTAL" spans all codes.</>
                  ) : (
                    <>由联合国规范层级化编排：划分为 <strong className="text-indigo-400 font-semibold">97个章大类</strong>（2位数字，如大类产业）、<strong className="text-indigo-400 font-semibold">1,200+个目分类组</strong>（4位数字）以及 <strong className="text-indigo-400 font-semibold">5,600+个具体的细分品类子目</strong>（6位商品代码）。TOTAL 指代全部类别的聚类汇总。差异极为精准。</>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 min-w-0 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-xs">{error}</p>
            </div>
          )}

          {(dashboardTab === 'comtrade-analytics' || dashboardTab === 'worldbank-analytics') ? (
            <>
              {/* Secondary Sub-Tab System for Space Optimization and Scroll Elimination */}
              <div className="flex border border-slate-850 mb-4 bg-slate-950 p-1 rounded-xl shadow-xs flex-wrap gap-1">
                <button
                  id="subtab-overview"
                  onClick={() => setAnalyticsSubTab('overview')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    analyticsSubTab === 'overview'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800'
                  }`}
                >
                  <Activity className="w-3 w-3" />
                  <span>{lang === 'en' ? 'Overview & Trends' : '数据总览与趋势'}</span>
                </button>
                <button
                  id="subtab-breakdowns"
                  onClick={() => setAnalyticsSubTab('breakdowns')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    analyticsSubTab === 'breakdowns'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800'
                  }`}
                >
                  <TrendingUp className="w-3 w-3" />
                  <span>{lang === 'en' ? 'Top Breakdowns' : '指标结构细分'}</span>
                </button>
                <button
                  id="subtab-records"
                  onClick={() => setAnalyticsSubTab('records')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    analyticsSubTab === 'records'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-3 w-3" />
                  <span>{lang === 'en' ? 'Detailed Table' : '明细数据清单'}</span>
                </button>
              </div>

              {/* Sub-tab 1: Overview and Primary Trends */}
              {analyticsSubTab === 'overview' && (
                <div className="space-y-4">
                  {/* Top KPI row */}
                  {dataSource === 'worldbank' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                      {/* GDP Card */}
                      <div 
                        onClick={() => setWbCategory('gdp')}
                        className={`p-3 rounded-xl border transition-all cursor-pointer shadow-sm ${
                          wbCategory === 'gdp' 
                            ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500 text-slate-150' 
                            : 'bg-[#0b0f19] border-slate-800/80 hover:border-indigo-500 hover:bg-slate-900/50 text-slate-350'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5 font-sans">
                          <div className="flex items-center gap-1 text-slate-400">
                            <Globe2 className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[10px] font-bold tracking-wide uppercase">
                              {lang === 'en' ? 'Value (GDP)' : '经济总量 (GDP)'}
                            </span>
                          </div>
                          <span className="text-[9px] px-1 py-0.5 bg-slate-950 font-medium text-slate-400 rounded">
                            {wbStats.gdp?.period || '—'}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-base font-bold tracking-tight text-slate-100 truncate">
                            {wbStats.gdp?.formatted || '—'}
                          </p>
                          <p className={`text-[11px] font-medium flex items-center gap-1 ${
                            wbStats.gdp && parseFloat(wbStats.gdp.YoY) >= 0 ? 'text-emerald-400' : 'text-rose-450 text-rose-400'
                          }`}>
                            {wbStats.gdp && parseFloat(wbStats.gdp.YoY) >= 0 ? '▲' : '▼'} {wbStats.gdp?.YoY || '0'}%
                          </p>
                        </div>
                      </div>

                      {/* Trade Card */}
                      <div 
                        onClick={() => setWbCategory('trade')}
                        className={`p-3 rounded-xl border transition-all cursor-pointer shadow-sm ${
                          wbCategory === 'trade' 
                            ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500 text-slate-150' 
                            : 'bg-[#0b0f19] border-slate-800/80 hover:border-indigo-500 hover:bg-slate-900/50 text-slate-350'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5 font-sans">
                          <div className="flex items-center gap-1 text-slate-400">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[10px] font-bold tracking-wide uppercase">
                              {lang === 'en' ? 'Total Trade' : '进出口进出总额'}
                            </span>
                          </div>
                          <span className="text-[9px] px-1 py-0.5 bg-slate-950 font-medium text-slate-400 rounded">
                            {wbStats.tradeM?.period || '—'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-0.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">{lang === 'en' ? 'Exp:' : '出口:'}</span>
                            <span className="font-bold text-emerald-400 truncate max-w-[80px]">
                              {wbStats.tradeX?.formatted || '—'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">{lang === 'en' ? 'Imp:' : '进口:'}</span>
                            <span className="font-bold text-indigo-400 truncate max-w-[80px]">
                              {wbStats.tradeM?.formatted || '—'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* FDI Card */}
                      <div 
                        onClick={() => setWbCategory('fdi')}
                        className={`p-3 rounded-xl border transition-all cursor-pointer shadow-sm ${
                          wbCategory === 'fdi' 
                            ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500 text-slate-150' 
                            : 'bg-[#0b0f19] border-slate-800/80 hover:border-indigo-500 hover:bg-slate-900/50 text-slate-350'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5 font-sans">
                          <div className="flex items-center gap-1 text-slate-400">
                            <Activity className="w-3.5 h-3.5 text-red-400" />
                            <span className="text-[10px] font-bold tracking-wide uppercase">
                              {lang === 'en' ? 'Net FDI Flow' : '外商直接投资'}
                            </span>
                          </div>
                          <span className="text-[9px] px-1 py-0.5 bg-slate-950 font-medium text-slate-400 rounded">
                            {wbStats.fdiIn?.period || '—'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-0.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">{lang === 'en' ? 'In:' : '流入:'}</span>
                            <span className="font-bold text-red-400 truncate max-w-[80px]">
                              {wbStats.fdiIn?.formatted || '—'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">{lang === 'en' ? 'Out:' : '流出:'}</span>
                            <span className="font-bold text-[#fbbf24] truncate max-w-[80px]">
                              {wbStats.fdiOut?.formatted || '—'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Capital & Reserves Card */}
                      <div 
                        onClick={() => setWbCategory('investment')}
                        className={`p-3 rounded-xl border transition-all cursor-pointer shadow-sm ${
                          wbCategory === 'investment' 
                            ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500 text-slate-150' 
                            : 'bg-[#0b0f19] border-slate-800/80 hover:border-indigo-500 hover:bg-slate-900/50 text-slate-350'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5 font-sans">
                          <div className="flex items-center gap-1 text-slate-400">
                            <Package className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-[10px] font-bold tracking-wide uppercase">
                              {lang === 'en' ? 'Capital/Remit' : '资产投资与侨汇'}
                            </span>
                          </div>
                          <span className="text-[9px] px-1 py-0.5 bg-slate-950 font-medium text-slate-400 rounded">
                            {wbStats.capital?.period || '—'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-0.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">{lang === 'en' ? 'Cap.F:' : '固定资产:'}</span>
                            <span className="font-bold text-purple-400 truncate max-w-[80px]">
                              {wbStats.capital?.formatted || '—'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">{lang === 'en' ? 'Remit:' : '外汇侨汇:'}</span>
                            <span className="font-bold text-pink-400 truncate max-w-[80px]">
                              {wbStats.remittance?.formatted || '—'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Consumer & Power Card */}
                      <div 
                        onClick={() => setWbCategory('consumer')}
                        className={`p-3 rounded-xl border transition-all cursor-pointer shadow-sm ${
                          wbCategory === 'consumer' 
                            ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500 text-slate-150' 
                            : 'bg-[#0b0f19] border-slate-800/80 hover:border-indigo-500 hover:bg-slate-900/50 text-slate-350'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5 font-sans">
                          <div className="flex items-center gap-1 text-slate-400">
                            <Activity className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-[10px] font-bold tracking-wide uppercase">
                              {lang === 'en' ? 'Consumer' : '生活成本与指数'}
                            </span>
                          </div>
                          <span className="text-[9px] px-1 py-0.5 bg-slate-950 font-medium text-slate-400 rounded">
                            {wbStats.gdpCapitaPpp?.period || '—'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-0.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">{lang === 'en' ? 'Capit:' : '购买平价:'}</span>
                            <span className="font-bold text-indigo-400 truncate max-w-[80px]">
                              {wbStats.gdpCapitaPpp?.formatted || '—'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">{lang === 'en' ? 'Inflat:' : '通膨比率:'}</span>
                            <span className="font-bold text-[#fbbf24] truncate max-w-[80px]">
                              {wbStats.inflation?.formatted || '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-[#0b0f19] p-5 rounded-xl border border-slate-800/80 shadow-sm flex flex-col justify-center">
                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                          <Activity className="w-4 h-4 text-indigo-400" />
                          <h3 className="text-sm font-medium text-slate-400 font-sans">Status</h3>
                        </div>
                        <p className="text-lg font-semibold capitalize text-slate-100 font-sans">
                          {isLoading ? <span className="text-slate-500 animate-pulse">Loading data...</span> : 'Live Analytics'}
                        </p>
                      </div>

                      <div className="bg-[#0b0f19] p-5 rounded-xl border border-slate-800/80 shadow-sm col-span-1 md:col-span-2 flex flex-col justify-center">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-slate-400 mb-1 font-sans">
                              <TrendingUp className="w-4 h-4 text-indigo-400" />
                              <h3 className="text-sm font-medium">
                                Latest Imports ({latestStats?.period || '—'})
                              </h3>
                            </div>
                            {latestStats ? (
                              <div className="flex items-end gap-3 font-mono">
                                <p className="text-3xl font-bold tracking-tight text-indigo-400">
                                  {latestStats.formattedM}
                                </p>
                                <span className={`text-sm font-medium mb-1 ${latestStats.isIncreaseM ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {latestStats.isIncreaseM ? '+' : ''}{latestStats.YoY_M}% YoY
                                </span>
                              </div>
                            ) : (
                              <p className="text-3xl font-bold tracking-tight text-slate-600 font-mono">
                                $0.00
                              </p>
                            )}
                          </div>
                          <div className="hidden sm:block h-full w-px bg-slate-800 mx-4"></div>
                          <div className="h-px w-full bg-slate-800 sm:hidden"></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-slate-400 mb-1 font-sans">
                              <TrendingUp className="w-4 h-4 text-emerald-400" />
                              <h3 className="text-sm font-medium">
                                Latest Exports ({latestStats?.period || '—'})
                              </h3>
                            </div>
                            {latestStats ? (
                              <div className="flex items-end gap-3 font-mono">
                                <p className="text-3xl font-bold tracking-tight text-emerald-400">
                                  {latestStats.formattedX}
                                </p>
                                <span className={`text-sm font-medium mb-1 ${latestStats.isIncreaseX ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {latestStats.isIncreaseX ? '+' : ''}{latestStats.YoY_X}% YoY
                                </span>
                              </div>
                            ) : (
                              <p className="text-3xl font-bold tracking-tight text-slate-600 font-mono">
                                $0.00
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Chart Section */}
                  <div className="bg-[#0b0f19] p-4 rounded-xl border border-slate-800/80 shadow-sm h-[390px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <h3 className="text-sm font-bold flex items-center gap-2 text-slate-200">
                        <Package className="w-4 h-4 text-slate-400" />
                        {dataSource === 'worldbank' ? wbLabels.title : "Historical Trade Values"}
                      </h3>
                      {dataSource === 'worldbank' && (
                        <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800/85">
                          <button 
                            onClick={() => setWbCategory('gdp')}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                              wbCategory === 'gdp'
                                ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm'
                                : 'text-slate-400 hover:text-slate-100'
                            }`}
                          >
                            📈 {lang === 'en' ? 'GDP' : '国内生产总值'}
                          </button>
                          <button 
                            onClick={() => setWbCategory('trade')}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                              wbCategory === 'trade'
                                ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm'
                                : 'text-slate-400 hover:text-slate-100'
                            }`}
                          >
                            🚢 {lang === 'en' ? 'Trade' : '商品贸易'}
                          </button>
                          <button 
                            onClick={() => setWbCategory('fdi')}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                              wbCategory === 'fdi'
                                ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm'
                                : 'text-slate-400 hover:text-slate-100'
                            }`}
                          >
                            💼 {lang === 'en' ? 'FDI' : '直接投资'}
                          </button>
                          <button 
                            onClick={() => setWbCategory('investment')}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                              wbCategory === 'investment'
                                ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm'
                                : 'text-slate-400 hover:text-slate-100'
                            }`}
                          >
                            🏦 {lang === 'en' ? 'Capital' : '基础资本'}
                          </button>
                          <button 
                            onClick={() => setWbCategory('consumer')}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                              wbCategory === 'consumer'
                                ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm'
                                : 'text-slate-400 hover:text-slate-100'
                            }`}
                          >
                            🛍️ {lang === 'en' ? 'Consumer' : '消费物价'}
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {isLoading ? (
                       <div className="h-[270px] flex items-center justify-center">
                         <div className="w-6 h-6 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
                       </div>
                    ) : mergedChartData && mergedChartData.length > 0 ? (
                       <div className="h-[270px] min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={mergedChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                            <XAxis 
                              dataKey="period" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: '#94a3b8', fontSize: 13 }} 
                              dy={10} 
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: '#94a3b8', fontSize: 13 }} 
                              tickFormatter={(value) => {
                                if (wbCategory === 'consumer') {
                                  if (value === 0) return '0';
                                  if (value < 100) return `${value.toFixed(1)}%`;
                                  return `$${value.toLocaleString()}`;
                                }
                                if (value === 0) return '0';
                                if (value >= 1000000000 || value <= -1000000000) {
                                  return `$${(value / 1000000000).toFixed(1)}B`;
                                }
                                if (value >= 1000000 || value <= -1000000) {
                                  return `$${(value / 1000000).toFixed(1)}M`;
                                }
                                return `$${value.toLocaleString()}`;
                              }} 
                            />
                            <Tooltip 
                              cursor={{fill: '#1e293b'}}
                              contentStyle={{ borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #1e293b', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)', color: '#f8fafc' }}
                              formatter={(value: number, name: string) => {
                                if (wbCategory === 'consumer') {
                                  if (name.includes("Inflation") || name.toLowerCase().includes("consumer")) {
                                    return [`${value.toFixed(2)}%`, name];
                                  }
                                  return [`$${Math.round(value).toLocaleString()}`, name];
                                }
                                return [formatCurrency(value), name];
                              }}
                              labelStyle={{ color: '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            {dataSource === 'comtrade' && (
                              <>
                                <Bar 
                                   name={`UN Comtrade Imports`} 
                                  dataKey="comtradeImport" 
                                  fill="#4F46E5" 
                                  radius={[4, 4, 0, 0]} 
                                  maxBarSize={40}
                                />
                                <Bar 
                                  name={`UN Comtrade Exports`} 
                                  dataKey="comtradeExport" 
                                  fill="#10B981" 
                                  radius={[4, 4, 0, 0]} 
                                  maxBarSize={40}
                                />
                              </>
                            )}
                            {dataSource === 'worldbank' && (
                              <>
                                <Line 
                                  type="monotone" 
                                  name={wbLabels.importLabel}
                                  dataKey={
                                    wbCategory === 'fdi' ? "worldBankFdiIn" :
                                    wbCategory === 'investment' ? "worldBankCapital" :
                                    wbCategory === 'gdp' ? "worldBankGdp" :
                                    wbCategory === 'consumer' ? "worldBankGdpCapitaPpp" :
                                    "worldBankImport"
                                  } 
                                  stroke="#ef4444" 
                                  strokeWidth={3} 
                                  dot={{ r: 4, strokeWidth: 2 }}
                                  activeDot={{ r: 6 }} 
                                />
                                <Line 
                                  type="monotone" 
                                  name={wbLabels.exportLabel}
                                  dataKey={
                                    wbCategory === 'fdi' ? "worldBankFdiOut" :
                                    wbCategory === 'investment' ? "worldBankRemittances" :
                                    wbCategory === 'gdp' ? "worldBankReserves" :
                                    wbCategory === 'consumer' ? "worldBankInflation" :
                                    "worldBankExport"
                                  } 
                                  stroke="#f59e0b" 
                                  strokeWidth={3} 
                                  dot={{ r: 4, strokeWidth: 2 }}
                                  activeDot={{ r: 6 }} 
                                />
                              </>
                            )}
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-[270px] flex flex-col items-center justify-center text-gray-400">
                        <Search className="w-6 h-6 mb-1.5 opacity-50" />
                        <p className="text-xs">No trade data available for this configuration.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Breakdown of Partners and Commodities */}
              {analyticsSubTab === 'breakdowns' && (
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="bg-[#0b0f19] rounded-xl border border-slate-800/80 p-6 h-[260px] flex flex-col items-center justify-center space-y-3">
                      <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                      <p className="text-xs text-slate-400">Loading breakdown insights...</p>
                    </div>
                  ) : (cmdCode !== 'TOTAL' || (dataSource === 'worldbank' && wbCategory !== 'trade')) ? (
                    <div className="bg-[#0b0f19] rounded-xl border border-slate-800/80 p-6 text-center max-w-md mx-auto my-4 space-y-3 shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-indigo-950/60 text-indigo-400 flex items-center justify-center mx-auto">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-100 font-sans">{t('breakdownUnavailable')}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-sans">
                        {dataSource === 'worldbank' ? (
                          lang === 'en' ? (
                            <>
                              World Bank breakdowns are only available for the <strong>Trade & FDI</strong> macro indicators group.
                              Please set the World Bank indicator category to <strong>Trade</strong> to see these visualizations.
                            </>
                          ) : (
                            <>
                              世界银行宏观细分分析仅在 <strong>商品贸易与直接投资</strong> 宏观指标组下可用。
                              请将世界银行指标类别设置为 <strong>商品贸易</strong> 以查看这些可视化分析。
                            </>
                          )
                        ) : (
                          t('breakdownNotice')
                        )}
                      </p>
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            setCmdCode('TOTAL');
                            setHsSearchTerm(lang === 'en' ? 'All Commodities (TOTAL)' : '全部商品分类 (TOTAL)');
                            if (dataSource === 'worldbank') {
                              setWbCategory('trade');
                            }
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-all font-sans"
                        >
                          {t('resetToTotal')}
                        </button>
                      </div>
                    </div>
                  ) : (topImportPartnersOverTime.length === 0 && topExportPartnersOverTime.length === 0 && topImports.length === 0 && topExports.length === 0) ? (
                    <div className="bg-[#0b0f19] rounded-xl border border-slate-800/80 p-6 text-center max-w-md mx-auto my-4 space-y-2 text-slate-400 shadow-sm">
                      <Package className="w-6 h-6 mx-auto opacity-40 mb-1.5 text-slate-500" />
                      <p className="text-xs font-semibold font-sans">No breakdowns records available for the selected years or country configuration.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Historical Partner Over Time */}
                      {(topImportPartnersOverTime.length > 0 || topExportPartnersOverTime.length > 0) && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {topImportPartnersOverTime.length > 0 && (
                            <TopPartnersOverTimeChart 
                              data={topImportPartnersOverTime} 
                              title={lang === 'en' ? "Top 10 Import Partners (Over Time)" : "前十大进口伙伴国趋势 (历年)"}
                              partners={partners} 
                              type="area"
                              lang={lang}
                            />
                          )}
                          {topExportPartnersOverTime.length > 0 && (
                            <TopPartnersOverTimeChart 
                              data={topExportPartnersOverTime} 
                              title={lang === 'en' ? "Top 10 Export Partners (Over Time)" : "前十大出口伙伴国趋势 (历年)"}
                              partners={partners} 
                              type="area"
                              lang={lang}
                            />
                          )}
                        </div>
                      )}

                      {/* Top 10 Commodities */}
                      {(topImports.length > 0 || topExports.length > 0) && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {topImports.length > 0 && (
                            <TopCommoditiesChart 
                              data={topImports} 
                              title={
                                lang === 'en' 
                                  ? `Top 10 Imports${dataSource === 'worldbank' || exporter === '0' ? ' from World' : ''}` 
                                  : `前十大进口商品类别${dataSource === 'worldbank' || exporter === '0' ? ' (来自全球)' : ''}`
                              }
                              hsCodes={hsCodes} 
                              color="#4F46E5" 
                              lang={lang}
                            />
                          )}
                          {topExports.length > 0 && (
                            <TopCommoditiesChart 
                              data={topExports} 
                              title={
                                lang === 'en' 
                                  ? `Top 10 Exports${dataSource === 'worldbank' || exporter === '0' ? ' to World' : ''}` 
                                  : `前十大出口商品类别${dataSource === 'worldbank' || exporter === '0' ? ' (销往全球)' : ''}`
                              }
                              hsCodes={hsCodes} 
                              color="#10B981" 
                              lang={lang}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 3: Records Data Table */}
              {analyticsSubTab === 'records' && (
                <div className="space-y-4">
                   {/* Data Table */}
                   <div className="bg-[#0b0f19] rounded-xl border border-slate-800/80 shadow-md overflow-hidden flex flex-col">
                    <div className="px-4 py-2.5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <h3 className="text-base font-semibold text-slate-100 font-sans">{t('detailedRecords')}</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={exportToCSV}
                          className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-[#111827] border border-slate-800 rounded-lg hover:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-400" />
                          {t('downloadCsv')}
                        </button>
                        <button
                          onClick={() => setIsApiModalOpen(true)}
                          className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-[#111827] border border-slate-800 rounded-lg hover:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors cursor-pointer"
                        >
                          <Terminal className="w-3.5 h-3.5 text-slate-400" />
                          {lang === 'en' ? 'API Access' : 'API 访问'}
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      {isLoading ? (
                        <div className="h-40 flex items-center justify-center text-sm text-slate-400 font-sans">{t('loadingData')}</div>
                      ) : mergedChartData && mergedChartData.length > 0 ? (
                        <table className="min-w-full divide-y divide-slate-800/60 font-mono">
                          <thead className="bg-[#030712]">
                            <tr>
                              <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider font-sans">{t('tableYear')}</th>
                              {dataSource !== 'worldbank' && (
                                <>
                                  <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider font-sans">{t('tableHsCode')}</th>
                                  <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider font-sans font-sans">{lang === 'en' ? 'Commodity' : '分类名称'}</th>
                                  <th scope="col" className="px-4 py-2 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider font-sans font-sans">{lang === 'en' ? 'Comtrade Imports' : '进口金额 (USD)'}</th>
                                  <th scope="col" className="px-4 py-2 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider font-sans font-sans">{lang === 'en' ? 'Comtrade Exports' : '出口金额 (USD)'}</th>
                                </>
                              )}
                              {dataSource === 'worldbank' && (
                                <>
                                  <th scope="col" className="px-4 py-2 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider font-sans">{wbLabels.importLabel}</th>
                                  <th scope="col" className="px-4 py-2 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider font-sans">{wbLabels.exportLabel}</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody className="bg-[#0b0f19] divide-y divide-slate-800/60">
                            {mergedChartData.map((record, i) => {
                              const commodityText = hsCodes.find(c => c.id === cmdCode)?.text || 'TOTAL';
                              return (
                                <tr key={i} className="hover:bg-slate-850/60 transition-colors bg-[#0b0f19]">
                                  <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-slate-100">{record.period}</td>
                                  {dataSource !== 'worldbank' && (
                                    <>
                                      <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-400">{cmdCode}</td>
                                      <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-400 truncate max-w-xs font-sans" title={commodityText}>
                                        {formatCommodityText(commodityText, cmdCode)}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-xs text-right">
                                        {record.comtradeImport !== null && record.comtradeImport !== undefined ? (
                                          <span className="font-semibold text-slate-205 text-slate-200">{formatCurrency(record.comtradeImport)}</span>
                                        ) : (
                                          <span className="text-slate-500 italic font-normal" title="This specific trade flow was not reported to UN Comtrade by the reporter.">Not reported</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-xs text-right">
                                        {record.comtradeExport !== null && record.comtradeExport !== undefined ? (
                                          <span className="font-semibold text-slate-205 text-slate-200">{formatCurrency(record.comtradeExport)}</span>
                                        ) : (
                                          <span className="text-slate-500 italic font-normal" title="This specific trade flow was not reported to UN Comtrade by the reporter.">Not reported</span>
                                        )}
                                      </td>
                                    </>
                                  )}
                                  {dataSource === 'worldbank' && (
                                    <>
                                      <td className="px-4 py-2 whitespace-nowrap text-xs text-right">
                                        {(() => {
                                          const val = 
                                            wbCategory === 'fdi' ? record.worldBankFdiIn :
                                            wbCategory === 'investment' ? record.worldBankCapital :
                                            wbCategory === 'gdp' ? record.worldBankGdp :
                                            wbCategory === 'consumer' ? record.worldBankGdpCapitaPpp :
                                            record.worldBankImport;
                                          return val !== null && val !== undefined ? (
                                            <span className="font-semibold text-slate-205 text-slate-200">
                                              {wbCategory === 'consumer' ? `$${Math.round(val).toLocaleString()}` : formatCurrency(val)}
                                            </span>
                                          ) : (
                                            <span className="text-slate-500 italic font-normal" title="No World Bank macroeconomic data available for this year.">Not available</span>
                                          );
                                        })()}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-xs text-right">
                                        {(() => {
                                          const val = 
                                            wbCategory === 'fdi' ? record.worldBankFdiOut :
                                            wbCategory === 'investment' ? record.worldBankRemittances :
                                            wbCategory === 'gdp' ? record.worldBankReserves :
                                            wbCategory === 'consumer' ? record.worldBankInflation :
                                            record.worldBankExport;
                                          return val !== null && val !== undefined ? (
                                            <span className="font-semibold text-slate-205 text-slate-200">
                                              {wbCategory === 'consumer' ? `${Number(val).toFixed(2)}%` : formatCurrency(val)}
                                            </span>
                                          ) : (
                                            <span className="text-slate-500 italic font-normal" title="No World Bank macroeconomic data available for this year.">Not available</span>
                                          );
                                        })()}
                                      </td>
                                    </>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <div className="h-40 flex flex-col items-center justify-center text-slate-500 font-sans">
                          <p className="text-sm">No records found.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              {/* Header Context Indicator */}
              <div className="bg-gradient-to-r from-indigo-950/40 to-slate-900/60 p-4 rounded-xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-3xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#030712] text-indigo-400 border border-indigo-950 flex items-center gap-1 leading-none select-none">
                      <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                      {isAdviceAiGenerated 
                        ? (lang === 'en' ? "Gemini Strategic Advisor" : "Gemini 智能商业顾问") 
                        : (lang === 'en' ? "B2B / SMB Consultant" : "B2B与中小企业顾问")}
                    </span>
                    <span className="text-xs text-indigo-400 font-semibold">• {lang === 'en' ? 'Active Country' : '分析主体国'}: {reporterName}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-100 leading-tight">
                    {lang === 'en' ? "B2B and SMB Business Consult Desk" : "B2B与中小企业决策大盘"}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
                    {lang === 'en' ? (
                      <>
                        Bespoke micro-venture concepts and local commercial hedges based on <span className="font-semibold text-indigo-400">{reporterName}</span>'s trade flows of <span className="font-semibold text-indigo-400">{formatCommodityText(hsCodes.find(c => c.id === cmdCode)?.text || cmdCode, cmdCode)}</span>.
                      </>
                    ) : (
                      <>
                        基于 <span className="font-semibold text-indigo-400">{reporterName}</span> 的商品分级 <span className="font-semibold text-indigo-400">{formatCommodityText(hsCodes.find(c => c.id === cmdCode)?.text || cmdCode, cmdCode)}</span> 的双边贸易流动，为您定制中小型创业蓝图和本地商业规避对冲风险提议。
                      </>
                    )}
                  </p>
                </div>
                {!isAdviceAiGenerated && (
                  <div className="shrink-0 flex items-center gap-1.5 bg-amber-950/30 text-amber-400 border border-amber-900/50 px-3 py-1.5 rounded-xl text-xs font-semibold select-none">
                    <span>{lang === 'en' ? "Using Expert Templates" : "使用专家提议系统"}</span>
                    <div className="group relative">
                      <HelpCircle className="w-4 h-4 text-amber-500 cursor-help" />
                      <div className="hidden group-hover:block absolute bottom-full right-0 mb-2 w-56 p-2 bg-[#030712] text-slate-100 font-normal rounded-lg text-[10px] leading-relaxed shadow-xl border border-slate-800 z-30">
                        {t('geminiApiKeyNotice')}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Segment Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Founders */}
                <button
                  onClick={() => setAdviceSegment('founder')}
                  className={`p-5 rounded-2xl border text-left transition-all relative flex gap-4 cursor-pointer overflow-hidden group ${
                    adviceSegment === 'founder'
                      ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500 shadow-md text-slate-100'
                      : 'border-slate-800/80 bg-[#0b0f19] hover:border-indigo-500 text-slate-300 hover:bg-slate-905'
                  }`}
                >
                  <div className={`p-3 rounded-xl shrink-0 ${adviceSegment === 'founder' ? 'bg-indigo-900/55 text-indigo-400' : 'bg-slate-950 text-slate-500 group-hover:text-indigo-400'}`}>
                    <Briefcase className="w-6 h-6 shrink-0" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                      {lang === 'en' ? "Venture Founders & Startups" : "新锐创业者与极客团队"}
                      {adviceSegment === 'founder' && <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0" />}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      {lang === 'en' 
                        ? "Fueling tools that help new founders and economies thrive. Discover specialized sub-SaaS, import substitution manufacture, and custom platforms."
                        : "发掘和扶持助力创业团队、新成立主体在本地和全球生态内健康成长的工具。涵盖专精细分 SaaS 开发建议、进口替代国内制造及功能集成方案。"}
                    </p>
                  </div>
                </button>

                {/* Merchants */}
                <button
                  onClick={() => setAdviceSegment('merchant')}
                  className={`p-5 rounded-2xl border text-left transition-all relative flex gap-4 cursor-pointer overflow-hidden group ${
                    adviceSegment === 'merchant'
                      ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500 shadow-md text-slate-100'
                      : 'border-slate-800/80 bg-[#0b0f19] hover:border-indigo-500 text-slate-300 hover:bg-slate-905'
                  }`}
                >
                  <div className={`p-3 rounded-xl shrink-0 ${adviceSegment === 'merchant' ? 'bg-indigo-900/55 text-indigo-400' : 'bg-slate-950 text-slate-500 group-hover:text-indigo-400'}`}>
                    <Store className="w-6 h-6 shrink-0" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                      {lang === 'en' ? "Small Retailers & Local Merchants" : "中小型实体零售商与地方制造商"}
                      {adviceSegment === 'merchant' && <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0" />}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      {lang === 'en'
                        ? "Powering everyday businesses with tools to compete and win. Unveil local currency shields, e-commerce micro-exports, and regional subcontract partnerships."
                        : "全面武装传统民营零售、本土贸易方、独立经销网点，令其在高竞争环境下获胜。主要提供本币对冲贬值对策、电商跨境直发、分包商联盟组建战略。"}
                    </p>
                  </div>
                </button>
              </div>

              {/* Feed Content Bento */}
              {isAdviceLoading ? (
                <div className="bg-[#0b0f19] rounded-xl border border-slate-800/80 p-6 h-[340px] flex flex-col items-center justify-center space-y-3.5 shadow-3xs">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                  <div className="space-y-1.5 text-center animate-pulse flex flex-col items-center justify-center font-sans">
                    <p className="text-xs font-bold text-slate-100">
                      {lang === 'en' ? "Consulting regional commerce records..." : "正在综合比对区域商品交换账目..."}
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-sm">
                      {lang === 'en' 
                        ? `Cross-referencing ${reporterName}'s Comtrade logs against active trade balances.` 
                        : `正在将 ${reporterName} 的商品贸易进出口流水同对应年度大宗经常余额进行交叉穿透分析。`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Left Column: Recommendations Feed */}
                  <div className="w-full lg:w-[55%] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block font-mono">
                        Actionable Blueprints
                      </span>
                      <span className="text-xs text-indigo-400 font-semibold font-mono bg-indigo-950/45 border border-indigo-900/40 px-2.5 py-0.5 rounded-full select-none font-sans">
                        {recommendations.length} concepts loaded
                      </span>
                    </div>

                    <div className="space-y-4">
                      {recommendations.map((rec) => {
                        const isSelected = selectedAdviceCardId === rec.id;
                        return (
                          <div
                            key={rec.id}
                            onClick={() => setSelectedAdviceCardId(rec.id)}
                            className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                              isSelected
                                ? 'bg-indigo-950/20 border-indigo-500 ring-1 ring-indigo-500 shadow-sm text-slate-100'
                                : 'bg-[#0b0f19] border-slate-800/80 text-slate-350 hover:bg-[#111827] hover:border-indigo-500/50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap font-sans">
                              <span className="px-2 py-0.5 rounded-md bg-indigo-950/70 text-indigo-400 border border-indigo-900/30 text-[10px] font-bold tracking-wide uppercase leading-none">
                                {rec.category}
                              </span>
                              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold leading-none ${
                                  rec.impact === 'High' ? 'bg-[#10b981]/15 text-[#10b981]' : 'bg-[#f59e0b]/15 text-[#f59e0b]'
                                }`}>
                                  {rec.impact} Impact
                                </span>
                                <span>•</span>
                                <span>{rec.timeframe}</span>
                              </div>
                            </div>

                            <h4 className="text-sm font-bold text-slate-100 mb-1.5 font-sans">
                              {rec.title}
                            </h4>
                            <p className="text-xs text-slate-300 leading-relaxed mb-1 font-sans">
                              {rec.description}
                            </p>

                            {/* Active Details */}
                            {isSelected && (
                              <div className="mt-3 pt-3 border-t border-slate-850/60 space-y-3 bg-indigo-950/15 -mx-4 -mb-4 p-4 rounded-b-xl">
                                <div className="space-y-2">
                                  <span className="text-[10px] font-bold tracking-wider text-indigo-400 uppercase block font-mono">
                                    3-Step Launch Checklist
                                  </span>
                                  <ul className="space-y-1.5 font-sans">
                                    {rec.actionSteps?.map((step: string, sIdx: number) => (
                                      <li key={sIdx} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                                        <CheckCircle className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                                        <span>{step}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-950/50 flex items-start gap-2 font-sans">
                                  <TrendingUp className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                                  <span className="text-[10px] text-indigo-300 leading-relaxed">
                                    <strong>Macro Link:</strong> {rec.metricsLink}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Mini Advisor Live Chat Desk */}
                  <div className="w-full lg:w-[45%] flex flex-col">
                    <div className="flex items-center justify-between mb-2 sm:mb-4">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block font-mono">
                        {lang === 'en' ? 'Interactive Advisor Desk' : '交互式贸易智脑工作台'}
                      </span>
                    </div>

                    <div className="bg-[#0b0f19] rounded-xl border border-slate-800/80 shadow-md flex flex-col h-[390px] overflow-hidden">
                      {/* Chat desk header */}
                      <div className="px-3 py-2 border-b border-slate-800/80 bg-slate-950 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
                          <div>
                            <span className="text-[11px] font-bold text-slate-200 block font-sans">
                              {lang === 'en' ? 'Strategic Advisor Desk' : '跨国贸易政策咨询台'}
                            </span>
                            <span className="text-[9px] text-slate-400 block font-mono">
                              {lang === 'en' ? `Structured around ${reporterName}` : `专注于 ${reporterName} 海关与宏观经贸`}
                            </span>
                          </div>
                        </div>
                        {chatMessages.length > 0 && (
                          <button
                            onClick={() => setChatMessages([])}
                            className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-950 px-1.5 py-0.5 rounded cursor-pointer transition-all font-sans"
                          >
                            {lang === 'en' ? 'Reset Chat' : '重置会话'}
                          </button>
                        )}
                      </div>

                      {/* Messages body */}
                      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#030712]/20">
                        {chatMessages.length === 0 ? (
                          <div className="h-full flex flex-col justify-between p-0.5 space-y-3">
                            <div className="text-center py-4 space-y-1.5 max-w-sm mx-auto animate-fade-in">
                              <div className="w-8 h-8 rounded-full bg-indigo-950/60 text-indigo-400 flex items-center justify-center mx-auto mb-1">
                                <HelpCircle className="w-4 h-4" />
                              </div>
                              <h5 className="text-[11px] font-bold text-slate-200 font-sans">
                                {lang === 'en' ? 'Need specific customized plans?' : '需要定制贸易规划方案？'}
                              </h5>
                              <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                                {lang === 'en' 
                                  ? 'Request a localized blueprint, early funding routes, licensing guidance, or competitive logs. Tap a template below to enquire:' 
                                  : '向智脑获取本地化发展、早期资金引入、合规准入、核心壁垒设计及竞争对手等分析，点击下方推荐方向直接发起：'}
                              </p>
                            </div>

                            {/* Prompt Starters */}
                            <div className="grid grid-cols-1 gap-1 font-sans">
                              {(lang === 'en' ? [
                                `How can I secure early funding for this concept inside ${reporterName}?`,
                                "What are the first 3 marketing steps to acquire my niche clients?",
                                "What legal or compliance approvals are needed for this segment?",
                                "Draft a pricing/retention guideline for this business."
                              ] : [
                                `如何在 ${reporterName} 境内为该产业概念引入早期启动资金支持？`,
                                "要获取本行业的首批极高价值客户，最核心的前 3 步营销抓手是什么？",
                                "在此商业赛道开发国际和国内两个市场，需要哪些必要的合规定律审查与生产许可证？",
                                "帮我根据该国当下情势起草一篇富有竞争力的产品定价及客户留存方案指引。"
                              ]).map((starter, ind) => (
                                <button
                                  key={ind}
                                  onClick={() => handleSendAdvisorChat(starter)}
                                  className="px-2 py-1 text-left text-[10px] bg-[#111827] hover:bg-slate-800 hover:text-slate-150 border border-slate-800/60 rounded-lg transition-all cursor-pointer font-medium shadow-3xs text-slate-300 shrink-0 truncate font-sans"
                                >
                                  {starter}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {chatMessages.map((msg, mIdx) => (
                              <div
                                key={mIdx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[85%] rounded-lg px-2.5 py-1 text-[11px] whitespace-pre-line leading-relaxed shadow-3xs ${
                                    msg.role === 'user'
                                      ? 'bg-indigo-600 text-white font-medium rounded-tr-xs font-sans'
                                      : 'bg-[#111827] text-slate-100 border border-slate-800/80 rounded-tl-xs font-sans'
                                  }`}
                                >
                                  {msg.text}
                                </div>
                              </div>
                            ))}

                            {isChatLoading && (
                              <div className="flex justify-start">
                                <div className="bg-[#111827] text-slate-300 border border-slate-800/80 rounded-lg rounded-tl-xs px-2.5 py-1 text-xs flex items-center gap-1 font-sans">
                                  <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce"></span>
                                  <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                  <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                                  <span className="font-mono text-[8px] text-slate-500">
                                    {lang === 'en' ? 'Calibrating commerce logs...' : '正在云端校准多边经贸数据库...'}
                                  </span>
                                </div>
                              </div>
                            )}

                            {advisorChatError && (
                              <div className="p-2 bg-red-950/40 text-red-400 text-[10px] rounded-lg border border-red-900/50 font-sans">
                                {advisorChatError}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Input Footer */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSendAdvisorChat();
                        }}
                        className="p-1.5 bg-slate-950 border-t border-slate-800/80 flex gap-2"
                      >
                        <input
                          type="text"
                          value={advisorQuery}
                          onChange={(e) => setAdvisorQuery(e.target.value)}
                          placeholder={lang === 'en' ? "Ask custom strategy questions..." : "向贸易智脑提问多边商业规划..."}
                          disabled={isChatLoading}
                          className="flex-1 bg-[#0b0f19] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none font-sans"
                        />
                        <button
                          type="submit"
                          disabled={isChatLoading || !advisorQuery.trim()}
                          className="p-1.5 cursor-pointer bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white disabled:text-slate-650 rounded-lg transition-all shrink-0"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* API Modal */}
      {isApiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-[#0b0f19] border border-slate-850/80 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-950 flex items-center justify-center">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    {lang === 'en' ? 'Developer API Access' : '开发者 API 访问接口'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {lang === 'en' ? 'Retrieve this specific data programmatically' : '以编程方式调用和获取当前过滤下的统计源数据'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsApiModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-md hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-200">
                  cURL {lang === 'en' ? 'Example' : '代码示例'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {lang === 'en' 
                    ? 'Use the following command to retrieve the currently selected dataset as JSON. This queries the appropriate underlying data provider directly.' 
                    : '使用以下命令行指令可以按 JSON 格式下载当前选定的数据集。这将直接向相应的数据服务源发起查询。'}
                </p>
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 overflow-x-auto relative group">
                  <pre className="text-xs font-mono text-slate-305 text-slate-300 whitespace-pre-wrap word-break-all">
                    {dataSource === 'worldbank' 
                      ? `curl -X GET "https://api.worldbank.org/v2/country/${importer}/indicator/${
                          wbCategory === 'financial' ? 'NE.GDI.TOTL.ZS' : 
                          wbCategory === 'general' ? 'NY.GDP.MKTP.CD' : 
                          wbCategory === 'macro' ? 'NY.GDP.PCAP.PP.CD' : 
                          wbCategory === 'trade' ? 'NE.IMP.GNFS.ZS' : 
                          'BX.KLT.DINV.WD.GD.ZS'
                        }?format=json&per_page=100" \\
  -H "Accept: application/json"`
                      : `curl -X GET "https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=${importer}&partnerCode=${exporter}&cmdCode=${cmdCode}&flowCode=M,X&period=${customPeriod.trim() && customPeriod.trim().toLowerCase() !== 'all' ? customPeriod.trim() : [...Array(13)].map((_, i) => (new Date().getFullYear()) - i).join(',')}" \\
  -H "Accept: application/json"`
                    }
                  </pre>
                  <button 
                    onClick={() => {
                      const text = dataSource === 'worldbank' 
                      ? `curl -X GET "https://api.worldbank.org/v2/country/${importer}/indicator/${
                          wbCategory === 'financial' ? 'NE.GDI.TOTL.ZS' : 
                          wbCategory === 'general' ? 'NY.GDP.MKTP.CD' : 
                          wbCategory === 'macro' ? 'NY.GDP.PCAP.PP.CD' : 
                          wbCategory === 'trade' ? 'NE.IMP.GNFS.ZS' : 
                          'BX.KLT.DINV.WD.GD.ZS'
                        }?format=json&per_page=100" -H "Accept: application/json"`
                      : `curl -X GET "https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=${importer}&partnerCode=${exporter}&cmdCode=${cmdCode}&flowCode=M,X&period=${customPeriod.trim() && customPeriod.trim().toLowerCase() !== 'all' ? customPeriod.trim() : [...Array(13)].map((_, i) => (new Date().getFullYear()) - i).join(',')}" -H "Accept: application/json"`;
                      navigator.clipboard.writeText(text);
                    }}
                    className="absolute top-3 right-3 p-1.5 bg-slate-800 hover:bg-slate-705 bg-slate-800/80 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    title={lang === 'en' ? 'Copy command' : '复制命令'}
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <div className="bg-indigo-950/25 border border-indigo-900/40 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-indigo-400 mb-2">
                  {lang === 'en' ? 'API Documentation' : '开发者参考文档'}
                </h4>
                <p className="text-xs text-indigo-305 text-indigo-300 leading-relaxed">
                  {dataSource === 'worldbank' ? (
                    lang === 'en' ? (
                      <>This data is served directly by the <strong>World Bank Data API v2</strong>. You can find comprehensive documentation on format options, pagination, and additional parameters at the <a href="https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation" target="_blank" rel="noreferrer" className="underline font-semibold text-indigo-400 hover:text-indigo-350">World Bank Data Help Desk</a>.</>
                    ) : (
                      <>此统计数据直连并服务自 <strong>世界银行统计数据库 (World Bank Data API v2)</strong>。您可在 <a href="https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation" target="_blank" rel="noreferrer" className="underline font-semibold text-indigo-400 hover:text-indigo-350">世界银行帮助中心指标页 (World Bank Data Help Desk)</a> 深度参阅其他分页或返回格式设定参数说明。</>
                    )
                  ) : (
                    lang === 'en' ? (
                      <>This bilateral trade data originates from the <strong>UN Comtrade API v1</strong>. To perform more complex queries involving multiple partners or commodities simultaneously, consult the <a href="https://comtradeapi.un.org/hc/en-us" target="_blank" rel="noreferrer" className="underline font-semibold text-indigo-400 hover:text-indigo-350">UN Comtrade Support portal</a>. Note that production usage may require an API key.</>
                    ) : (
                      <>该商品双边进出口流向数据来源于 <strong>联合国贸易统计库官方服务接口 (UN Comtrade API v1)</strong>。如需处理多国家交错关联、以及包含大量商品分段过滤的高阶请求，请参见 <a href="https://comtradeapi.un.org/hc/en-us" target="_blank" rel="noreferrer" className="underline font-semibold text-indigo-400 hover:text-indigo-350">联合国Comtrade高级支持门户 (UN Comtrade Support portal)</a>。注意，生产环境极速调用通常需要注册定制密钥。</>
                    )
                  )}
                </p>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-950 border-t border-slate-800/80 flex justify-end">
              <button
                onClick={() => setIsApiModalOpen(false)}
                className="px-4 py-2 bg-[#111827] border border-slate-800 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors cursor-pointer"
              >
                {lang === 'en' ? 'Close' : '关闭'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

