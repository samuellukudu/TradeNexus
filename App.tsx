
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from './i18n';
import { searchForLeads, analyzeMarkets, generateMarketReport, extractSearchStrategyFromAssets, classifyProductRole, generateApplicationMap, searchApplicationLane, allocateLeadBudget, qualifyLeadsForApplication } from './services/geminiService';
import { discoverLeadsFromSocial } from './services/agent/socialDiscoveryService';
import { getSessions, saveSession, deleteSession, getSupplierProfile, saveSupplierProfile } from './services/storageService';
import { Lead, ProductDetails, AgentAction, RegionSuggestion, LeadStatus, ProductAsset, SearchSession, MarketReport, TargetAudienceType, StrategicContext, SupplierProfile } from './types';
import { ProductRole, LanePerformanceRecord } from './types/applicationTypes';
import { CampaignMemory } from './types/agentTypes';
import { Terminal } from './components/Terminal';
import { LeadCard } from './components/LeadCard';
import { InteractionViewer } from './components/InteractionViewer';
import { Dashboard } from './components/Dashboard';
import { MarketReportModal } from './components/MarketReportModal';
import { SupplierProfileView } from './components/SupplierProfileView';
import { LanguageToggle } from './components/LanguageToggle';
import { v4 as uuidv4 } from 'uuid';
import { auth, loginWithGoogle, logout, loginWithEmail, registerWithEmail } from './services/firebase';
import { LandingPage } from './components/LandingPage';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Home, LogOut, Plus, UserRound } from 'lucide-react';

const INITIAL_LOGS = [
  "TradeNexus AI Agent System v1.0.0 initialized...",
  "Mode: Deep Discovery & Analysis",
  "Connect to Database: SUCCESS",
  "Awaiting product specification...",
];

// Expanded Country Database (Truncated for brevity in re-print, assumes same data as before)
const REGION_DATA: Record<string, string[]> = {
  'Asia': [
    'Afghanistan', 'Armenia', 'Azerbaijan', 'Bahrain', 'Bangladesh', 'Bhutan', 'Brunei', 'Cambodia', 
    'China', 'Cyprus', 'Georgia', 'India', 'Indonesia', 'Iran', 'Iraq', 'Israel', 'Japan', 'Jordan', 
    'Kazakhstan', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Lebanon', 'Malaysia', 'Maldives', 'Mongolia', 
    'Myanmar', 'Nepal', 'North Korea', 'Oman', 'Pakistan', 'Palestine', 'Philippines', 'Qatar', 
    'Saudi Arabia', 'Singapore', 'South Korea', 'Sri Lanka', 'Syria', 'Taiwan', 'Tajikistan', 
    'Thailand', 'Timor-Leste', 'Turkey', 'Turkmenistan', 'UAE', 'Uzbekistan', 'Vietnam', 'Yemen'
  ],
  'Europe': [
    'Albania', 'Andorra', 'Austria', 'Belarus', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria', 
    'Croatia', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 
    'Hungary', 'Iceland', 'Ireland', 'Italy', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg', 
    'Malta', 'Moldova', 'Monaco', 'Montenegro', 'Netherlands', 'North Macedonia', 'Norway', 'Poland', 
    'Portugal', 'Romania', 'Russia', 'San Marino', 'Serbia', 'Slovakia', 'Slovenia', 'Spain', 
    'Sweden', 'Switzerland', 'Ukraine', 'United Kingdom', 'Vatican City'
  ],
  'North America': [
    'Antigua and Barbuda', 'Bahamas', 'Barbados', 'Belize', 'Canada', 'Costa Rica', 'Cuba', 'Dominica', 
    'Dominican Republic', 'El Salvador', 'Grenada', 'Guatemala', 'Haiti', 'Honduras', 'Jamaica', 
    'Mexico', 'Nicaragua', 'Panama', 'Saint Kitts and Nevis', 'Saint Lucia', 
    'Saint Vincent and the Grenadines', 'Trinidad and Tobago', 'United States'
  ],
  'South America': [
    'Argentina', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Ecuador', 'Guyana', 'Paraguay', 'Peru', 
    'Suriname', 'Uruguay', 'Venezuela'
  ],
  'Africa': [
    'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cameroon', 
    'Central African Republic', 'Chad', 'Comoros', 'DR Congo', 'Djibouti', 'Egypt', 'Equatorial Guinea', 
    'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana', 'Guinea', 'Guinea-Bissau', 
    'Ivory Coast', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi', 'Mali', 
    'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria', 'Rwanda', 
    'Sao Tome and Principe', 'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia', 'South Africa', 
    'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
  ],
  'Oceania': [
    'Australia', 'Fiji', 'Kiribati', 'Marshall Islands', 'Micronesia', 'Nauru', 'New Zealand', 
    'Palau', 'Papua New Guinea', 'Samoa', 'Solomon Islands', 'Tonga', 'Tuvalu', 'Vanuatu'
  ],
  'Middle East': [
    'Bahrain', 'Cyprus', 'Egypt', 'Iran', 'Iraq', 'Israel', 'Jordan', 'Kuwait', 'Lebanon', 'Oman', 
    'Palestine', 'Qatar', 'Saudi Arabia', 'Syria', 'Turkey', 'UAE', 'Yemen'
  ]
};

// Generate 'All' dynamically
const ALL_COUNTRIES = Array.from(new Set(Object.values(REGION_DATA).flat())).sort();
REGION_DATA['All'] = ALL_COUNTRIES;

const CONTINENTS = Object.keys(REGION_DATA).filter(k => k !== 'All');
CONTINENTS.unshift('All');

const COMPANY_SIZES = [
  "Any Size",
  "Micro (< 10 Employees)",
  "Small (10 - 50 Employees)",
  "Medium (50 - 500 Employees)",
  "Large (500 - 5000 Employees)",
  "Enterprise (5000+ Employees)"
];

const AUDIENCE_TYPES: TargetAudienceType[] = [
    'Distributors/Importers',
    'OEMs/Manufacturers',
    'End Users',
    'All'
];

// UPDATED: Increased max lead volume to 100
const LEAD_COUNT_OPTIONS = [5, 10, 20, 50, 100];

const getDefaultLeadCountForDemand = (demandLevel: RegionSuggestion['demandLevel']) => {
  if (demandLevel === 'High') return 20;
  if (demandLevel === 'Medium') return 10;
  return 5;
};

const withDefaultScoutTargets = (items: RegionSuggestion[]) => {
  return items.map(item => ({
    ...item,
    targetLeadCount: item.targetLeadCount || getDefaultLeadCountForDemand(item.demandLevel)
  }));
};

type ViewMode = 'OPERATIONS' | 'DASHBOARD' | 'PROFILE';

// Auto-Pilot Constants
const SCOUT_INTERVAL_MS = 60000; // Check every 60 seconds (Demo speed)
const MIN_TIME_BETWEEN_SCOUTS = 120000; // Minimum 2 minutes between searches for same session

export default function App() {
  // --- STATE ---
  const [view, setView] = useState<ViewMode>('OPERATIONS');
  
  // Panel States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLeadsPanelOpen, setIsLeadsPanelOpen] = useState(true);
  const [isTerminalMinimized, setIsTerminalMinimized] = useState(false);

  // Database / Session State
  const [sessions, setSessions] = useState<SearchSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Input Form State (For creating new sessions)
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productAssets, setProductAssets] = useState<ProductAsset[]>([]);
  // CHANGED: searchContext now holds a structured object
  const [searchContext, setSearchContext] = useState<StrategicContext | null>(null); 
  
  const [continent, setContinent] = useState<string>('All');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [targetCompanySize, setTargetCompanySize] = useState<string>(COMPANY_SIZES[0]);
  const [targetLeadCount, setTargetLeadCount] = useState<number>(20);
  const [targetAudience, setTargetAudience] = useState<TargetAudienceType>('All');
  const [supplierCountry, setSupplierCountry] = useState<string>('China');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  
  // Operational State (Active Session Data)
  const [suggestions, setSuggestions] = useState<RegionSuggestion[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deployedRegions, setDeployedRegions] = useState<Set<string>>(new Set());
  
  // Report Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState<MarketReport | null>(null);
  const [reportRegion, setReportRegion] = useState('');

  // UI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [agentLogs, setAgentLogs] = useState<string[]>(INITIAL_LOGS);
  const [agentAction, setAgentAction] = useState<AgentAction>({ type: 'IDLE', details: '' });

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [supplierProfile, setSupplierProfile] = useState<SupplierProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { t, language } = useLanguage();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    try {
      if (isLoginMode) {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Refs for State Safety (Prevents stale closures in async operations)
  const sessionsRef = useRef(sessions);
  const leadsRef = useRef(leads);
  const isAutoPilotRunningRef = useRef(false);

  // --- EFFECTS ---
  
  // Initialize responsive state
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
      setIsLeadsPanelOpen(false);
    }
  }, []);

  // Load sessions when user arrives
  useEffect(() => {
    if (user) {
      getSessions(user.uid).then((savedSessions) => {
        setSessions(savedSessions);
        sessionsRef.current = savedSessions;
      });
      getSupplierProfile(user.uid).then(setSupplierProfile);
    } else {
      setSessions([]);
      sessionsRef.current = [];
      setActiveSessionId(null);
      setLeads([]);
      setSuggestions([]);
      setSearchContext(null);
      setSupplierProfile(null);
      setProductAssets([]);
      setProductName('');
      setProductDescription('');
    }
  }, [user]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync Refs
  useEffect(() => {
      sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
      leadsRef.current = leads;
  }, [leads]);

  // Translate terminal boot logs when language changes
  useEffect(() => {
    const bootKeys = ['terminal.init.0', 'terminal.init.1', 'terminal.init.2', 'terminal.init.3'] as const;
    setAgentLogs(prev => [...bootKeys.map(k => t(k)), ...prev.slice(4)]);
  }, [language, t]);

  // Sync Active Session to Database whenever critical data changes
  const updateActiveSession = (newLeads: Lead[], newSuggestions?: RegionSuggestion[]) => {
     if (!activeSessionId || !user) return;

     setSessions(prev => {
         const updated = prev.map(s => {
             if (s.id === activeSessionId) {
                 const updatedSession = {
                     ...s,
                     leads: newLeads,
                     suggestions: newSuggestions || s.suggestions
                 };
                 saveSession(user.uid, updatedSession); // Persist
                 return updatedSession;
             }
             return s;
         });
         return updated;
     });
  };

  // --- UTILS ---

  // Deduplication Engine
  const deduplicateLeads = (existingLeads: Lead[], newLeads: Lead[]): { unique: Lead[], duplicates: number } => {
    const existingWebsites = new Set(existingLeads.map(l => l.website?.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')));
    const existingNames = new Set(existingLeads.map(l => l.companyName.toLowerCase().trim()));
    
    const unique: Lead[] = [];
    let duplicates = 0;

    for (const lead of newLeads) {
        const cleanWebsite = lead.website?.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
        const cleanName = lead.companyName.toLowerCase().trim();

        const hasWebsiteMatch = cleanWebsite && existingWebsites.has(cleanWebsite);
        const hasNameMatch = existingNames.has(cleanName);

        if (!hasWebsiteMatch && !hasNameMatch) {
            unique.push(lead);
            // Add to temp sets to prevent duplicates within the new batch itself
            if (cleanWebsite) existingWebsites.add(cleanWebsite);
            existingNames.add(cleanName);
        } else {
            duplicates++;
        }
    }

    return { unique, duplicates };
  };

  // --- AUTO-PILOT ENGINE ---
  useEffect(() => {
      const intervalId = setInterval(async () => {
          if (isAutoPilotRunningRef.current) return;

          const now = Date.now();
          const sessionsToScout = sessionsRef.current.filter(
              s => s.isAutoPilotEnabled && 
              (!s.lastScoutTime || (now - s.lastScoutTime > MIN_TIME_BETWEEN_SCOUTS))
          );

          if (sessionsToScout.length === 0) return;

          isAutoPilotRunningRef.current = true;
          const session = sessionsToScout[0]; // Process one at a time to avoid rate limits

          try {
              // SMART TARGETING STRATEGY for AUTO-PILOT
              
              let scoutRegion = session.config.continent;
              let strategySource = "Broad Search";
              let scoutLeadCount = session.config.targetLeadCount || 20;

              const explicitCountries = session.config.countries || [];

              // STRATEGY 1: STRICT USER OBEDIENCE
              if (explicitCountries.length > 0) {
                   scoutRegion = explicitCountries[Math.floor(Math.random() * explicitCountries.length)];
                   strategySource = "Strict User Selection";
              }
              // STRATEGY 2: AI INTELLIGENCE (Fallback for Broad Searches)
              else if (session.suggestions && session.suggestions.length > 0) {
                  const highPotential = session.suggestions.filter(s => s.demandLevel === 'High');
                  const pool = highPotential.length > 0 ? highPotential : session.suggestions;
                  const target = pool[Math.floor(Math.random() * pool.length)];
                  scoutRegion = target.region;
                  scoutLeadCount = target.targetLeadCount || getDefaultLeadCountForDemand(target.demandLevel);
                  strategySource = `AI Strategic Target (${target.demandLevel} Demand)`;
              }

              addAgentLog(`[Auto-Pilot] 🤖 Waking up for "${session.name}"...`);
              addAgentLog(`[Auto-Pilot] Target: ${scoutRegion} [${strategySource}]`);
              
              const productContext: ProductDetails = {
                  name: session.name,
                  description: session.productDescription,
                  targetRegion: scoutRegion,
                  targetCompanySize: session.config.targetCompanySize,
                  targetLeadCount: scoutLeadCount,
                  targetAudience: session.config.targetAudience, // Use stored audience preference
                  supplierCountry: session.config.supplierCountry,
                  strategicContext: session.strategicContext // Use structured memory
              };

              // --- APPLICATION-LED DISCOVERY (Autopilot) ---
              const currentSessionFull = sessionsRef.current.find(s => s.id === session.id);
              const sessionMemory = currentSessionFull?.memory;

              // Resolve product role — reuse session, or extract from cached app map
              let productRole = currentSessionFull?.productRole;

              let appMap = sessionMemory?.applicationMapHistory?.find(
                m => m.country === scoutRegion
              );

              if (appMap) {
                if (!productRole) {
                  productRole = appMap.productRole;
                }
              } else {
                if (productRole) {
                  addAgentLog(`[Auto-Pilot] Reusing session product role: ${productRole.role}`);
                } else {
                  addAgentLog(`[Auto-Pilot] Classifying product role for ${session.name}...`);
                  productRole = await classifyProductRole(productContext, session.strategicContext);
                }

                addAgentLog(`[Auto-Pilot] Generating application map for ${scoutRegion}...`);
                appMap = await generateApplicationMap(
                  productContext, scoutRegion, productRole,
                  session.strategicContext, sessionMemory?.applicationMapHistory || [],
                  session.config.supplierCountry
                );

                addAgentLog(`[Auto-Pilot] ${appMap.applications.length} applications identified in ${scoutRegion}`);

                // Save map to memory and persist product role on session
                const updatedMemory: CampaignMemory = {
                  ...(sessionMemory || {
                    events: [],
                    preferredLeadPatterns: [],
                    rejectedLeadPatterns: [],
                    strongRegions: [],
                    weakRegions: [],
                    platformUsefulness: {},
                    buyerTypePerformance: {},
                    updatedAt: Date.now()
                  }),
                  applicationMapHistory: [
                    ...(sessionMemory?.applicationMapHistory || []).slice(-19),
                    appMap
                  ],
                  updatedAt: Date.now()
                };

                const updatedSessionWithMem = { ...session, memory: updatedMemory, productRole };
                setSessions(prev => prev.map(s => s.id === session.id ? updatedSessionWithMem : s));
                if (user) saveSession(user.uid, updatedSessionWithMem);
              }

              // Attach product role to context so searchApplicationLane can target correctly
              productContext.productRole = productRole;

              const budget = allocateLeadBudget(appMap.applications, scoutLeadCount);

              // Refine budget based on past lane performance
              const pastPerf = sessionMemory?.lanePerformance || {};
              for (const [appId, perf] of Object.entries(pastPerf)) {
                if (budget[appId] && perf.totalRuns >= 2 && perf.qualifiedRate < 0.3 && budget[appId] > 1) {
                  const reduction = Math.min(budget[appId] - 1, Math.floor(budget[appId] * 0.5));
                  budget[appId] -= reduction;
                  const bestEntry = Object.entries(pastPerf)
                    .filter(([id]) => id !== appId && budget[id])
                    .sort(([, a], [, b]) => b.qualifiedRate - a.qualifiedRate)[0];
                  if (bestEntry && budget[bestEntry[0]]) {
                    budget[bestEntry[0]] += reduction;
                  }
                }
              }

              const allFoundLeads: Lead[] = [];
              const lanePerformanceRecords: Record<string, LanePerformanceRecord> = { ...(sessionMemory?.lanePerformance || {}) };
              for (const application of appMap.applications) {
                const laneBudget = budget[application.id] || 0;
                if (laneBudget === 0) continue;

                try {
                  const laneLeads = await searchApplicationLane(productContext, application, laneBudget);
                  const socialNeeded = Math.max(0, laneBudget - laneLeads.length);
                  if (socialNeeded > 0) {
                    const socialResult = await discoverLeadsFromSocial(
                      productContext.name,
                      scoutRegion,
                      session.strategicContext,
                      {
                        application: application.name,
                        buyerTypes: application.buyerTypes,
                        searchTerms: application.socialSearchTerms || application.searchTerms,
                        qualificationSignals: application.qualificationSignals,
                        badFitSignals: application.badFitSignals,
                      }
                    );
                    const socialLeads = socialResult.leads.slice(0, socialNeeded).map(lead => ({
                      ...lead,
                      applicationId: application.id,
                      application: application.name,
                      buyerType: application.buyerTypes[0] || lead.buyerType,
                      searchLane: lead.searchLane || application.socialSearchTerms?.[0] || application.searchTerms[0],
                    }));
                    laneLeads.push(...socialLeads);
                  }

                  if (laneLeads.length === 0) continue;

                  // Post-discovery qualification
                  const qualification = await qualifyLeadsForApplication(laneLeads, application, session.name);

                  const qualifiedLeads = laneLeads.filter((_, i) =>
                    qualification.qualifications[i]?.result === "qualified" || qualification.qualifications[i]?.result === "uncertain"
                  );

                  for (const lead of qualifiedLeads) {
                    const q = qualification.qualifications.find(ql => ql.leadId === lead.id);
                    lead.applicationId = application.id;
                    lead.application = application.name;
                    lead.buyerType = lead.buyerType || application.buyerTypes[0];
                    lead.searchLane = lead.searchLane || application.searchTerms[0];
                    if (q) {
                      lead.verificationNotes = `Qualified via application signals: ${q.matchedSignals.join("; ") || "passed screening"}`;
                    }
                  }

                  allFoundLeads.push(...qualifiedLeads);

                  // Track lane performance
                  const qualifiedRate = laneLeads.length > 0 ? qualifiedLeads.length / laneLeads.length : 0;
                  const avgConf = qualifiedLeads.length > 0
                    ? qualifiedLeads.reduce((s, l) => s + l.confidenceScore, 0) / qualifiedLeads.length
                    : 0;
                  const existingPerf = lanePerformanceRecords[application.id];
                  lanePerformanceRecords[application.id] = {
                    applicationId: application.id,
                    applicationName: application.name,
                    country: scoutRegion,
                    qualifiedRate: existingPerf
                      ? (existingPerf.qualifiedRate * existingPerf.totalRuns + qualifiedRate) / (existingPerf.totalRuns + 1)
                      : qualifiedRate,
                    avgConfidence: existingPerf
                      ? (existingPerf.avgConfidence * existingPerf.totalRuns + avgConf) / (existingPerf.totalRuns + 1)
                      : avgConf,
                    lastRunAt: Date.now(),
                    totalRuns: (existingPerf?.totalRuns || 0) + 1,
                  };
                } catch (laneErr) {
                  // Single lane failure — continue with others
                }
              }

              // Apply Deduplication Engine
              const { unique: uniqueNewLeads } = deduplicateLeads(session.leads, allFoundLeads);

              // Always persist lane performance to memory
              const updatedMemoryWithPerf: CampaignMemory = {
                ...(sessionMemory || {
                  events: [],
                  preferredLeadPatterns: [],
                  rejectedLeadPatterns: [],
                  strongRegions: [],
                  weakRegions: [],
                  platformUsefulness: {},
                  buyerTypePerformance: {},
                  updatedAt: Date.now()
                }),
                lanePerformance: lanePerformanceRecords,
                updatedAt: Date.now()
              };

              if (uniqueNewLeads.length > 0) {
                   const flaggedNewLeads = uniqueNewLeads.map(l => ({ ...l, isNew: true }));
                   const updatedLeads = [...session.leads, ...flaggedNewLeads];

                   const updatedSession: SearchSession = {
                       ...session,
                       leads: updatedLeads,
                       memory: updatedMemoryWithPerf,
                       lastScoutTime: now
                   };

                   // Update State
                   setSessions(prev => prev.map(s => s.id === session.id ? updatedSession : s));
                   if (user) saveSession(user.uid, updatedSession);

                   // Update active view if viewing this session
                   if (activeSessionId === session.id) {
                       setLeads(updatedLeads);
                   }

                   addAgentLog(`[Auto-Pilot] ✅ Success! Found ${uniqueNewLeads.length} verified leads in ${scoutRegion} across ${appMap.applications.length} application lanes.`);
              } else {
                   // Update time only, but persist lane performance
                   const updatedSession = { ...session, memory: updatedMemoryWithPerf, lastScoutTime: now };
                   setSessions(prev => prev.map(s => s.id === session.id ? updatedSession : s));
                   if (user) saveSession(user.uid, updatedSession);
                   addAgentLog(`[Auto-Pilot] Territory saturated. No new verified leads found in ${scoutRegion}.`);
              }

          } catch (e) {
              console.error("Auto-pilot error", e);
              addAgentLog(`[Auto-Pilot] Error during scout cycle: ${e}`);
          } finally {
              isAutoPilotRunningRef.current = false;
          }

      }, SCOUT_INTERVAL_MS);

      return () => clearInterval(intervalId);
  }, [activeSessionId]); 

  // --- HANDLERS ---

  const addAgentLog = (msg: string) => {
    setAgentLogs(prev => [...prev, msg]);
  };

  const startNewCampaign = () => {
      setActiveSessionId(null);
      setProductName('');
      setProductDescription('');
      setSearchContext(null);
      setProductAssets([]);
      setLeads([]);
      setSuggestions([]);
      setSelectedLeadId(null);
      setDeployedRegions(new Set());
      setView('OPERATIONS');
      if (window.innerWidth < 768) {
        setIsSidebarOpen(true);
        setIsLeadsPanelOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
      addAgentLog(`Started new campaign setup.`);
  };

  // TRIGGERED ON FILE UPLOAD
  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files);
      const newAssets: ProductAsset[] = [];

      // Process files
      for (const file of files) {
          const base64Data = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                  const result = reader.result as string;
                  resolve(result.split(',')[1]);
              };
              reader.readAsDataURL(file);
          });
          newAssets.push({ data: base64Data, mimeType: file.type, fileName: file.name });
      }

      const updatedAssets = [...productAssets, ...newAssets];
      setProductAssets(updatedAssets);
      addAgentLog(`${newAssets.length} asset(s) attached. Ready for analysis.`);
    }
  };

  const removeAsset = (indexToRemove: number) => {
    setProductAssets(prev => prev.filter((_, index) => index !== indexToRemove));
    // Note: We intentionally DO NOT clear the searchContext here, 
    // as the user might want to keep the insights even if they remove the large file.
  };

  const handleContinentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setContinent(e.target.value);
    setSelectedCountries([]);
    setIsCountryDropdownOpen(false);
  };

  const toggleCountry = (country: string) => {
    setSelectedCountries(prev => prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]);
  };

  const selectAllVisible = () => {
    setSelectedCountries(REGION_DATA[continent]);
  }

  const loadSession = (sessionId: string) => {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return;

      setActiveSessionId(sessionId);
      setProductName(session.name);
      setProductDescription(session.productDescription || '');
      setContinent(session.config.continent);
      setSelectedCountries(session.config.countries);
      setTargetCompanySize(session.config.targetCompanySize || COMPANY_SIZES[0]);
      setTargetLeadCount(session.config.targetLeadCount || 20);
      setTargetAudience(session.config.targetAudience || 'All');
      setSupplierCountry(session.config.supplierCountry || 'China');
      setSuggestions(withDefaultScoutTargets(session.suggestions));
      setLeads(session.leads);
      setProductAssets([]); // Clear assets as they are not persisted in session
      // CHANGED: Load the structured memory object
      setSearchContext(session.strategicContext || null);
      setDeployedRegions(new Set()); 
      setView('OPERATIONS');
      addAgentLog(`Loaded campaign: ${session.name}`);
  };

  const createNewSession = (analysisResults: RegionSuggestion[], activeContext: StrategicContext | null, productRole?: ProductRole) => {
      const newSession: SearchSession = {
          id: uuidv4(),
          createdAt: Date.now(),
          name: productName || "Untitled Campaign",
          productDescription: productDescription,
          config: {
              continent,
              countries: selectedCountries,
              targetCompanySize,
              targetLeadCount, // Legacy fallback for saved campaigns and auto-pilot broad searches
              targetAudience,
              supplierCountry
          },
          suggestions: analysisResults,
          leads: [],
          isAutoPilotEnabled: false,
          // SAVE STRUCTURED MEMORY TO SESSION
          strategicContext: activeContext || undefined,
          // Persist product role so scout/autopilot can reuse it
          productRole
      };
      
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      if (user) saveSession(user.uid, newSession);
      return newSession;
  };

  const handleAnalyzeMarkets = async () => {
    if (!productName) return;
    setIsAnalyzing(true);
    setSuggestions([]);
    setDeployedRegions(new Set());
    setSelectedLeadId(null);
    setLeads([]); // Clear current view
    setView('OPERATIONS');
    
    // Auto-close sidebar on mobile when action starts
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }

    setAgentAction({ type: 'ANALYZING', details: 'Analyzing trade data & product assets...' });
    addAgentLog(`Starting new analysis for: ${productName}`);

    try {
      // 1. LAZY EXTRACTION: If assets exist but no context, extract now.
      let activeContext: StrategicContext | null = searchContext;

      if (!activeContext && productAssets.length > 0) {
          addAgentLog(`Deep scanning ${productAssets.length} document(s) for structured memory extraction...`);
          setAgentAction({ type: 'ANALYZING', details: 'Extracting strategic memory from documents...' });

          activeContext = await extractSearchStrategyFromAssets({
              name: productName,
              assets: productAssets
          });

          setSearchContext(activeContext); // Save to state for future use
          addAgentLog(`Strategic memory extracted.`);
      }

      // 2. CLASSIFY PRODUCT ROLE — understand the product's supply-chain position before analyzing markets
      setAgentAction({ type: 'ANALYZING', details: 'Classifying product role and supply chain position...' });
      addAgentLog(`Classifying product role for "${productName}"...`);
      const productRole = await classifyProductRole(
        { name: productName, description: productDescription, assets: productAssets, supplierCountry },
        activeContext || undefined
      );
      addAgentLog(`Product role: ${productRole.role} (resold by ${productRole.resellerTypes.join(", ") || "various"}, operated by ${productRole.operatorTypes.join(", ") || "various"})`);

      setAgentAction({ type: 'ANALYZING', details: 'Analyzing global trade data with product role context...' });

      // 3. ANALYZE MARKETS — informed by product role classification
      const results = withDefaultScoutTargets(await analyzeMarkets(
        productName, productDescription, continent, selectedCountries,
        productAssets, activeContext || undefined, supplierCountry, productRole
      ));
      setSuggestions(results);
      addAgentLog(`Analysis complete. ${results.length} regions identified.`);

      // 4. CREATE NEW SESSION (Save the context and product role)
      createNewSession(results, activeContext, productRole);
      addAgentLog(`Campaign saved to database.`);

    } catch (e) {
      addAgentLog(`Analysis failed: ${e}`);
    } finally {
      setIsAnalyzing(false);
      setAgentAction({ type: 'IDLE', details: '' });
    }
  };

  const handleDeepDive = async (region: string) => {
      // Background Processing Logic
      
      // 1. Update status to LOADING immediately
      setSuggestions(prev => {
          const updated = prev.map(s => s.region === region ? { ...s, reportStatus: 'LOADING' as const } : s);
          updateActiveSession(leads, updated);
          return updated;
      });
      addAgentLog(`[Intel] Deep Dive initiated for ${region}. Running in background...`);

      const productContext: ProductDetails = {
          name: productName,
          description: productDescription,
          strategicContext: searchContext || undefined, // Pass the AI Context
          supplierCountry: supplierCountry
      };

      try {
          // 2. Run generation async
          const report = await generateMarketReport(productContext, region);
          
          // 3. Update status to READY and save report
          setSuggestions(prev => {
              const updated = prev.map(s => s.region === region ? { ...s, reportStatus: 'READY' as const, report } : s);
              updateActiveSession(leads, updated);
              return updated;
          });
          addAgentLog(`[Intel] Report ready for ${region}.`);

      } catch (e) {
          console.error(e);
          setSuggestions(prev => {
              const updated = prev.map(s => s.region === region ? { ...s, reportStatus: 'ERROR' as const } : s);
              updateActiveSession(leads, updated);
              return updated;
          });
          addAgentLog(`[Intel] Report generation failed for ${region}.`);
      }
  };

  const openReport = (region: string) => {
      const suggestion = suggestions.find(s => s.region === region);
      if (suggestion && suggestion.report) {
          setReportRegion(region);
          setCurrentReport(suggestion.report);
          setReportModalOpen(true);
      }
  };

  const handleRegionLeadCountChange = (region: string, count: number) => {
      setSuggestions(prev => {
          const updated = prev.map(s => s.region === region ? { ...s, targetLeadCount: count } : s);
          updateActiveSession(leadsRef.current, updated);
          return updated;
      });
  };

  const deployScout = async (region: string, scoutLeadCount: number) => {
    if (deployedRegions.has(region)) return;

    setDeployedRegions(prev => new Set(prev).add(region));
    const scoutId = `Scout-${region.substring(0,3).toUpperCase()}`;
    addAgentLog(`[${scoutId}] Deploying to ${region}...`);

    if (window.innerWidth < 768) {
      setIsLeadsPanelOpen(true);
    }

    const productContext: ProductDetails = {
        name: productName,
        description: productDescription,
        targetRegion: region,
        targetCompanySize: targetCompanySize,
        targetLeadCount: scoutLeadCount,
        targetAudience: targetAudience,
        supplierCountry: supplierCountry,
        strategicContext: searchContext || undefined
    };

    try {
        // --- APPLICATION-LED DISCOVERY PIPELINE ---

        const currentSession = sessions.find(s => s.id === activeSessionId);
        const sessionMemory = currentSession?.memory;

        // 1. Resolve product role — reuse from session, or extract from cached app map, or classify
        let productRole = currentSession?.productRole;

        // 2. Check for existing application map in campaign memory
        let appMap = sessionMemory?.applicationMapHistory?.find(
          m => m.country === region
        );

        if (appMap) {
          addAgentLog(`[App Map] Using cached application map for ${region} (${appMap.applications.length} lanes)`);
          // Extract product role from cached map if session doesn't have it
          if (!productRole) {
            productRole = appMap.productRole;
          }
        } else {
          if (productRole) {
            addAgentLog(`[App Map] Reusing session product role: ${productRole.role}`);
          } else {
            setAgentAction({ type: 'SEARCHING', details: `Classifying product role for ${region}...` });
            addAgentLog(`[App Map] Classifying product role for ${productName}...`);
            productRole = await classifyProductRole(productContext, searchContext || undefined);
            addAgentLog(`[App Map] Product role: ${productRole.role}`);

            // Persist on session so subsequent scouts and autopilot reuse it
            setSessions(prev => {
              const updated = prev.map(s =>
                s.id === activeSessionId ? { ...s, productRole } : s
              );
              if (user && activeSessionId) {
                const session = updated.find(s => s.id === activeSessionId);
                if (session) saveSession(user.uid, session);
              }
              return updated;
            });
          }

          // 2b. Generate application map
          setAgentAction({ type: 'SEARCHING', details: `Decomposing applications for ${region}...` });
          addAgentLog(`[App Map] Generating application map for ${region}...`);
          const pastMaps = sessionMemory?.applicationMapHistory || [];
          appMap = await generateApplicationMap(
            productContext, region, productRole,
            searchContext || undefined, pastMaps, supplierCountry
          );

          // 2c. Log the applications found
          addAgentLog(`[App Map] ${appMap.applications.length} applications identified:`);
          const totalScore = appMap.applications.reduce((s, a) => s + a.priorityScore, 0) || 1;
          for (const app of appMap.applications) {
            const laneBudget = Math.max(1, Math.floor((scoutLeadCount * app.priorityScore) / totalScore));
            addAgentLog(`[App Map]   ${appMap.applications.indexOf(app) + 1}. ${app.name} (score: ${app.priorityScore.toFixed(2)}) → ~${laneBudget} leads`);
          }

          // 2d. Save application map to campaign memory
          const updatedMemory: CampaignMemory = {
            ...(sessionMemory || {
              events: [],
              preferredLeadPatterns: [],
              rejectedLeadPatterns: [],
              strongRegions: [],
              weakRegions: [],
              platformUsefulness: {},
              buyerTypePerformance: {},
              updatedAt: Date.now()
            }),
            applicationMapHistory: [
              ...(sessionMemory?.applicationMapHistory || []).slice(-19),
              appMap
            ],
            updatedAt: Date.now()
          };

          setSessions(prev => {
            const updated = prev.map(s =>
              s.id === activeSessionId ? { ...s, memory: updatedMemory } : s
            );
            if (user && activeSessionId) {
              const session = updated.find(s => s.id === activeSessionId);
              if (session) saveSession(user.uid, session);
            }
            return updated;
          });
        }

        // 3. Attach product role to context so searchApplicationLane can target correctly
        productContext.productRole = productRole;

        // 4. Allocate budget across applications, refined by past performance
        const budget = allocateLeadBudget(appMap.applications, scoutLeadCount);

        // 4a. Refine budget: reduce for lanes with consistently poor past performance
        const pastPerf = sessionMemory?.lanePerformance || {};
        for (const [appId, perf] of Object.entries(pastPerf)) {
          if (budget[appId] && perf.totalRuns >= 2 && perf.qualifiedRate < 0.3 && budget[appId] > 1) {
            const reduction = Math.min(budget[appId] - 1, Math.floor(budget[appId] * 0.5));
            budget[appId] -= reduction;
            // Redistribute to best-performing lane
            const bestEntry = Object.entries(pastPerf)
              .filter(([id]) => id !== appId && budget[id])
              .sort(([, a], [, b]) => b.qualifiedRate - a.qualifiedRate)[0];
            if (bestEntry && budget[bestEntry[0]]) {
              budget[bestEntry[0]] += reduction;
              addAgentLog(`[App Map] Refined budget: "${perf.applicationName}" reduced by ${reduction} (qual rate: ${(perf.qualifiedRate * 100).toFixed(0)}%) → redistributed to "${bestEntry[1].applicationName}"`);
            }
          }
        }

        // 5. Search each application lane with post-discovery qualification
        setAgentAction({ type: 'SEARCHING', details: `Searching ${appMap.applications.length} application lanes in ${region}...` });

        const allFoundLeads: Lead[] = [];
        const lanePerformanceRecords: Record<string, LanePerformanceRecord> = { ...(sessionMemory?.lanePerformance || {}) };
        let totalQualified = 0;
        let totalRejected = 0;

        for (const application of appMap.applications) {
          const laneBudget = budget[application.id] || 0;
          if (laneBudget === 0) continue;

          const laneLabel = application.searchTerms[0] || application.name;
          addAgentLog(`[${scoutId}] Searching lane: "${laneLabel}" (${laneBudget} leads)...`);

          try {
            // 5a. Discover leads in this lane
            const laneLeads = await searchApplicationLane(productContext, application, laneBudget);
            const socialNeeded = Math.max(0, laneBudget - laneLeads.length);
            let socialLeadCount = 0;
            if (socialNeeded > 0) {
              const socialResult = await discoverLeadsFromSocial(
                productContext.name,
                region,
                searchContext || undefined,
                {
                  application: application.name,
                  buyerTypes: application.buyerTypes,
                  searchTerms: application.socialSearchTerms || application.searchTerms,
                  qualificationSignals: application.qualificationSignals,
                  badFitSignals: application.badFitSignals,
                }
              );
              const contextualSocialLeads = socialResult.leads.slice(0, socialNeeded).map(lead => ({
                ...lead,
                applicationId: application.id,
                application: application.name,
                buyerType: application.buyerTypes[0] || lead.buyerType,
                searchLane: lead.searchLane || application.socialSearchTerms?.[0] || application.searchTerms[0],
              }));
              socialLeadCount = contextualSocialLeads.length;
              laneLeads.push(...contextualSocialLeads);
            }

            if (laneLeads.length === 0) {
              addAgentLog(`[${scoutId}] Lane empty — no leads found.`);
              continue;
            }

            // 5b. Post-discovery qualification — cross-check against application signals
            addAgentLog(`[${scoutId}] Qualifying ${laneLeads.length} leads against "${application.name}" signals...`);
            const qualification = await qualifyLeadsForApplication(laneLeads, application, productName);

            const qualifiedLeads = laneLeads.filter((_, i) =>
              qualification.qualifications[i]?.result === "qualified" || qualification.qualifications[i]?.result === "uncertain"
            );
            const rejectedCount = qualification.rejected;

            // Tag qualified leads with application context
            for (const lead of qualifiedLeads) {
              const q = qualification.qualifications.find(ql => ql.leadId === lead.id);
              lead.applicationId = application.id;
              lead.application = application.name;
              lead.buyerType = lead.buyerType || application.buyerTypes[0];
              lead.searchLane = lead.searchLane || application.searchTerms[0];
              if (q) {
                lead.verificationNotes = `Qualified via application signals: ${q.matchedSignals.join("; ") || "passed screening"}`;
              }
            }

            allFoundLeads.push(...qualifiedLeads);
            totalQualified += qualifiedLeads.length;
            totalRejected += rejectedCount;

            // 5c. Track lane performance for future refinement
            const qualifiedRate = laneLeads.length > 0 ? qualifiedLeads.length / laneLeads.length : 0;
            const avgConf = qualifiedLeads.length > 0
              ? qualifiedLeads.reduce((s, l) => s + l.confidenceScore, 0) / qualifiedLeads.length
              : 0;

            const existingPerf = lanePerformanceRecords[application.id];
            lanePerformanceRecords[application.id] = {
              applicationId: application.id,
              applicationName: application.name,
              country: region,
              qualifiedRate: existingPerf
                ? (existingPerf.qualifiedRate * existingPerf.totalRuns + qualifiedRate) / (existingPerf.totalRuns + 1)
                : qualifiedRate,
              avgConfidence: existingPerf
                ? (existingPerf.avgConfidence * existingPerf.totalRuns + avgConf) / (existingPerf.totalRuns + 1)
                : avgConf,
              lastRunAt: Date.now(),
              totalRuns: (existingPerf?.totalRuns || 0) + 1,
            };

            const rejectedNote = rejectedCount > 0 ? ` (${rejectedCount} rejected by qualification)` : "";
            addAgentLog(`[${scoutId}] Lane complete: ${qualifiedLeads.length} qualified${rejectedNote}, ${socialLeadCount} social-first leads found`);
          } catch (laneErr) {
            addAgentLog(`[${scoutId}] Lane failed: ${laneErr}. Continuing with remaining lanes.`);
          }
        }

        // 5d. Log qualification summary
        addAgentLog(`[${scoutId}] Qualification complete: ${totalQualified} qualified, ${totalRejected} rejected across ${appMap.applications.length} lanes`);

        // 5e. Deduplicate across all lanes
        const currentLeads = leadsRef.current;
        const { unique: newLeads, duplicates } = deduplicateLeads(currentLeads, allFoundLeads);

        const leadsWithContext = [...currentLeads, ...newLeads];
        setLeads(leadsWithContext);
        updateActiveSession(leadsWithContext);

        // 5f. Save lane performance to campaign memory for future refinement
        const performanceMemory: CampaignMemory = {
          ...(sessionMemory || {
            events: [],
            preferredLeadPatterns: [],
            rejectedLeadPatterns: [],
            strongRegions: [],
            weakRegions: [],
            platformUsefulness: {},
            buyerTypePerformance: {},
            updatedAt: Date.now()
          }),
          lanePerformance: lanePerformanceRecords,
          updatedAt: Date.now()
        };
        setSessions(prev => {
          const updated = prev.map(s =>
            s.id === activeSessionId ? { ...s, memory: performanceMemory } : s
          );
          if (user && activeSessionId) {
            const session = updated.find(s => s.id === activeSessionId);
            if (session) saveSession(user.uid, session);
          }
          return updated;
        });

        addAgentLog(`[${scoutId}] Discovery complete. ${newLeads.length} new leads across ${appMap.applications.length} application lanes${duplicates > 0 ? ` (${duplicates} duplicates skipped)` : ''}.`);

        if (newLeads.length === 0) {
            setAgentAction({ type: 'IDLE', details: 'No new leads found.' });
            return;
        }

    } catch (e) {
        addAgentLog(`[${scoutId}] Application-led discovery failed: ${e}. Falling back to direct search...`);
        // Fall back to existing direct search
        try {
          setAgentAction({ type: 'SEARCHING', details: `Scouting ${region} via direct search...` });
          const foundLeads = await searchForLeads(productContext);
          const currentLeads = leadsRef.current;
          const { unique: newLeads, duplicates } = deduplicateLeads(currentLeads, foundLeads);
          const leadsWithContext = [...currentLeads, ...newLeads];
          setLeads(leadsWithContext);
          updateActiveSession(leadsWithContext);
          addAgentLog(`[${scoutId}] Fallback search complete: ${newLeads.length} leads found${duplicates > 0 ? ` (${duplicates} duplicates)` : ''}.`);
        } catch (fallbackErr) {
          addAgentLog(`[${scoutId}] Fallback search also failed: ${fallbackErr}`);
        }
    } finally {
        setAgentAction({ type: 'IDLE', details: 'Awaiting orders.' });
    }
  };

  const toggleAutoPilot = (sessionId: string, enabled: boolean) => {
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
          const updated = { ...session, isAutoPilotEnabled: enabled };
          setSessions(prev => prev.map(s => s.id === sessionId ? updated : s));
          if (user) saveSession(user.uid, updated);
          addAgentLog(`[System] Auto-Pilot ${enabled ? 'ENABLED' : 'DISABLED'} for ${session.name}`);
      }
  };

  const handleDeleteSession = (sessionId: string) => {
      if (user) deleteSession(user.uid, sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeSessionId === sessionId) {
          setActiveSessionId(null);
          setLeads([]);
          setSuggestions([]);
          setProductName('');
          setProductDescription('');
          setSearchContext(null);
          setProductAssets([]);
      }
      addAgentLog(`[System] Session deleted.`);
  };

  const handleSaveSupplierProfile = (profile: SupplierProfile) => {
      setSupplierProfile(profile);
      if (user) saveSupplierProfile(user.uid, profile);
      addAgentLog(`[System] Supplier profile updated.`);
  };

  const handleLeadClick = (leadId: string) => {
      // Clear 'New' flag when clicking
      setLeads(prev => {
          const updated = prev.map(l => l.id === leadId ? { ...l, isNew: false } : l);
          updateActiveSession(updated);
          return updated;
      });
      setSelectedLeadId(leadId); 
      setView('OPERATIONS');
      
      // Auto-close panels on mobile for better view
      if (window.innerWidth < 768) {
        setIsLeadsPanelOpen(false);
        setIsSidebarOpen(false);
      }
  };

  const handleLeadUpdate = (updatedLead: Lead) => {
      setLeads(prev => {
          const newLeads = prev.map(l => l.id === updatedLead.id ? updatedLead : l);
          updateActiveSession(newLeads);
          return newLeads;
      });
  };

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  const isPrivacyPage = window.location.pathname === '/privacy';
  const isTermsPage = window.location.pathname === '/terms';

  if (isPrivacyPage) {
    return <PrivacyPolicy />;
  }

  if (isTermsPage) {
    return <TermsOfService />;
  }

  if (authLoading) {
    return (
      <div className="flex h-screen bg-slate-950 items-center justify-center text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium animate-pulse">Initializing System...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LandingPage 
        handleEmailAuth={handleEmailAuth}
        loginWithGoogle={loginWithGoogle}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        isLoginMode={isLoginMode}
        setIsLoginMode={setIsLoginMode}
        authError={authError}
        isSubmitting={isSubmitting}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans selection:bg-primary-500 selection:text-white overflow-hidden relative">
      
      {/* Modals */}
      <MarketReportModal 
         isOpen={reportModalOpen} 
         onClose={() => setReportModalOpen(false)}
         report={currentReport}
         region={reportRegion}
      />

      {/* MOBILE BACKDROP OVERLAY */}
      {(isSidebarOpen || (isLeadsPanelOpen && view === 'OPERATIONS')) && (
        <div 
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => { setIsSidebarOpen(false); setIsLeadsPanelOpen(false); }}
        />
      )}

      {/* PRIMARY NAV RAIL */}
      <nav className={`${isSidebarOpen ? 'flex' : 'hidden'} md:flex fixed inset-y-0 left-0 z-50 md:relative md:z-auto w-16 shrink-0 bg-slate-950 border-r border-slate-800 flex-col items-center py-8 gap-8`}>
        <button
          onClick={() => {
            setView('OPERATIONS');
            setSelectedLeadId(null);
            setIsSidebarOpen(true);
          }}
          className="w-9 h-9 rounded-full bg-primary-500/90 shadow-lg shadow-primary-500/20"
          aria-label="TradeNexus home"
          title="TradeNexus"
        />

        <div className="flex flex-col items-center gap-8">
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
          <button
            onClick={startNewCampaign}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-slate-900 transition-colors"
            aria-label={t('nav.newCampaign')}
            title={t('nav.newCampaign')}
          >
            <Plus className="w-6 h-6" strokeWidth={2.2} />
          </button>
        </div>

        <button
          onClick={logout}
          className="mt-auto w-12 h-12 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-slate-900 transition-colors"
          aria-label={t('nav.logout')}
          title={t('nav.logout')}
        >
          <LogOut className="w-6 h-6" strokeWidth={2.2} />
        </button>
      </nav>

      {/* COLUMN 1: STRATEGY & CONFIGURATION */}
      {view !== 'PROFILE' && (
      <div 
        className={`fixed inset-y-0 left-16 z-50 h-full bg-slate-900 flex flex-col transition-all duration-300 shadow-2xl md:left-auto md:relative md:z-30 ${isSidebarOpen ? 'translate-x-0 w-[calc(100vw-4rem)] sm:w-[36rem] md:w-80 border-r border-slate-800' : '-translate-x-full w-0 border-r-0 md:translate-x-0 md:w-12 md:border-r md:border-slate-800'}`}
      >
        {/* Toggle Button (Desktop Only or Inside Drawer on Mobile) */}
        <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute -right-3 top-6 z-50 bg-slate-800 border border-slate-600 rounded-full p-1 text-slate-400 hover:text-white hover:border-slate-400 transition-colors shadow-lg hidden md:block"
        >
            <svg className={`w-3 h-3 transition-transform ${isSidebarOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
        </button>

        {isSidebarOpen ? (
            // OPEN STATE CONTENT
            <>
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                        <span className="w-3 h-3 bg-primary-500 rounded-full animate-pulse"></span>
                        TradeNexus
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Autonomous B2B Sales System</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <LanguageToggle />
                    {/* Mobile Close Button */}
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>

                {/* View Switcher */}
                <div className="flex border-b border-slate-800 shrink-0">
                    <button 
                        onClick={() => { setView('OPERATIONS'); setSelectedLeadId(null); setIsSidebarOpen(false); }} // Close on mobile nav
                        className={`flex-1 py-3 text-xs font-medium tracking-wide transition-colors ${view === 'OPERATIONS' ? 'bg-slate-800 text-white border-b-2 border-primary-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        OPERATIONS
                    </button>
                    <button 
                        onClick={() => { setView('DASHBOARD'); setIsSidebarOpen(false); }} // Close on mobile nav
                        className={`flex-1 py-3 text-xs font-medium tracking-wide transition-colors ${view === 'DASHBOARD' ? 'bg-slate-800 text-white border-b-2 border-primary-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        DASHBOARD
                    </button>
                </div>

                {/* Strategy Setup Form */}
                <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar min-w-[20rem]">
                    {sessions.length > 0 && (
                        <div className="mb-4">
                            <label className="block text-[10px] text-slate-500 mb-2 font-bold uppercase tracking-wider">Campaign History</label>
                            <select 
                                value={activeSessionId || ''}
                                onChange={(e) => {
                                    if (e.target.value === 'new') {
                                        setActiveSessionId(null);
                                        setProductName('');
                                        setProductDescription('');
                                        setSearchContext(null);
                                        setLeads([]);
                                        setSuggestions([]);
                                    } else {
                                        loadSession(e.target.value);
                                        if (window.innerWidth < 768) setIsSidebarOpen(false); // Close on selection mobile
                                    }
                                }}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-2 text-xs focus:outline-none focus:border-primary-500 text-white"
                            >
                                <option value="new">+ Start New Campaign</option>
                                {sessions.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({new Date(s.createdAt).toLocaleDateString()})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="border-t border-slate-800 pt-4">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                            {activeSessionId ? t('app.currentCampaignConfig') : t('app.newCampaignSetup')}
                        </h2>
                        
                        {/* Product Name */}
                        <div className="mb-4">
                          <label className="block text-[10px] text-slate-500 mb-1 font-bold">{t('app.productName')}</label>
                          <input 
                            type="text" 
                            value={productName}
                            onChange={e => setProductName(e.target.value)}
                            placeholder={t('app.productNamePlaceholder')}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary-500 text-white placeholder-slate-600 mb-2"
                          />
                          <label className="block text-[10px] text-slate-500 mb-1 font-bold mt-2">{t('app.descriptionSpecs')}</label>
                          <textarea 
                            value={productDescription}
                            onChange={e => setProductDescription(e.target.value)}
                            placeholder={t('app.descriptionPlaceholder')}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs focus:outline-none focus:border-primary-500 text-white placeholder-slate-600 min-h-[100px] align-top"
                          />
                        </div>

                        {/* Product Assets Upload */}
                        <div className="mb-4">
                           <label className="block text-[10px] text-slate-500 mb-1 font-bold">{t('app.productAssets')}</label>
                           <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer bg-slate-800/50 hover:bg-slate-800 hover:border-primary-500/50 transition-all mb-2 relative">
                                <div className="flex flex-col items-center justify-center pt-1 pb-1">
                                    <span className="text-[9px] text-slate-500">{t('app.uploadDocs')}</span>
                                </div>
                                <input type="file" className="hidden" accept="image/*,.pdf" multiple onChange={handleAssetUpload} />
                            </label>

                           {productAssets.length > 0 && (
                               <div className="grid grid-cols-3 gap-2">
                                   {productAssets.map((asset, idx) => (
                                       <div key={idx} className="relative group aspect-square rounded-md bg-slate-800 overflow-hidden border border-slate-700 flex items-center justify-center">
                                            {asset.mimeType.startsWith('image/') ? (
                                                <img src={`data:${asset.mimeType};base64,${asset.data}`} alt="Thumb" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center p-2 text-center h-full w-full bg-slate-900">
                                                    <span className="text-xl">📄</span>
                                                    <span className="text-[7px] text-slate-400 mt-1 break-all leading-tight px-1 line-clamp-3">{asset.fileName}</span>
                                                </div>
                                            )}
                                            <button onClick={() => removeAsset(idx)} className="absolute top-0 right-0 p-1 bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">×</button>
                                       </div>
                                   ))}
                               </div>
                           )}
                        </div>

                        {/* SUPPLIER COUNTRY (NEW) */}
                        <div className="mb-4">
                          <label className="block text-[10px] text-slate-500 mb-1 font-bold uppercase tracking-wider">{t('app.supplierCountry')}</label>
                          <select 
                            value={supplierCountry}
                            onChange={e => setSupplierCountry(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm text-white focus:border-primary-500"
                          >
                            {ALL_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>

                        {/* TARGET AUDIENCE (NEW) */}
                        <div className="mb-4">
                          <label className="block text-[10px] text-primary-400 mb-1 font-bold uppercase tracking-wider">{t('app.targetAudience')}</label>
                          <select 
                            value={targetAudience}
                            onChange={e => setTargetAudience(e.target.value as TargetAudienceType)}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm mb-2 text-white focus:border-primary-500"
                          >
                            {AUDIENCE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <p className="text-[9px] text-slate-500 leading-tight">
                             {targetAudience === 'Distributors/Importers' && "Finds local companies that buy bulk to resell."}
                             {targetAudience === 'OEMs/Manufacturers' && "Finds factories that use your product as a component."}
                             {targetAudience === 'End Users' && "Finds large companies that consume the product directly."}
                             {targetAudience === 'All' && "Finds any viable business partner (Distributors, Factories, or End Users)."}
                          </p>
                        </div>
                        
                        {/* Target Company Size */}
                        <div className="mb-4">
                          <label className="block text-[10px] text-slate-500 mb-1 font-bold">{t('app.companySize')}</label>
                          <select 
                            value={targetCompanySize}
                            onChange={e => setTargetCompanySize(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm mb-2 text-white"
                          >
                            {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        
                        {/* Region & Countries */}
                        <div className="mb-4">
                          <label className="block text-[10px] text-slate-500 mb-1 font-bold">{t('app.continent')}</label>
                          <select 
                            value={continent}
                            onChange={handleContinentChange}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm text-white mb-2"
                          >
                            {CONTINENTS.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          
                          <div className="relative">
                              <button 
                                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white text-left truncate"
                              >
                                 {selectedCountries.length === 0 ? "Select Countries..." : `${selectedCountries.length} selected`}
                              </button>
                              {isCountryDropdownOpen && (
                                  <div className="absolute top-full left-0 w-full mt-1 bg-slate-900 border border-slate-700 rounded-md shadow-2xl max-h-40 overflow-y-auto z-50 p-1">
                                       <button onClick={selectAllVisible} className="w-full text-left text-[10px] text-primary-400 p-1">Select All</button>
                                       {REGION_DATA[continent].sort().map(c => (
                                           <div key={c} onClick={() => toggleCountry(c)} className={`cursor-pointer p-1 text-xs ${selectedCountries.includes(c) ? 'text-primary-400 font-bold' : 'text-slate-400'}`}>
                                               {c} {selectedCountries.includes(c) && '✓'}
                                           </div>
                                       ))}
                                  </div>
                              )}
                          </div>
                        </div>
                        
                        <button 
                            onClick={handleAnalyzeMarkets}
                            disabled={!productName || isAnalyzing}
                            className={`w-full py-2 rounded font-medium transition-colors text-sm ${
                                !productName || isAnalyzing 
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                                : 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-900/20'
                            }`}
                        >
                            {isAnalyzing ? 'Analyzing...' : (activeSessionId ? 'Run New Analysis' : 'Analyze Markets')}
                        </button>
                    </div>
                </div>
            </>
        ) : (
            // CLOSED STATE CONTENT (Desktop Icon View)
            <div className="h-full flex flex-col items-center py-4 hidden md:flex">
                <span className="w-3 h-3 bg-primary-500 rounded-full mb-6"></span>
                <div className="flex-1 flex items-center justify-center">
                    <span className="-rotate-90 text-slate-500 font-bold tracking-[0.2em] whitespace-nowrap text-xs">CONFIGURATION</span>
                </div>
            </div>
        )}
      </div>
      )}

      {/* COLUMN 2: ACTIVE LEADS */}
      {view === 'OPERATIONS' && (
        <div 
            className={`fixed inset-y-0 left-0 z-40 h-full bg-slate-900/95 backdrop-blur-md flex flex-col transition-all duration-300 md:relative md:z-20 md:bg-slate-900/50 ${isLeadsPanelOpen ? 'translate-x-0 w-[85vw] sm:w-80 border-r border-slate-800' : '-translate-x-full w-0 border-r-0 md:translate-x-0 md:w-12 md:border-r md:border-slate-800'}`}
        >
            {/* Toggle Button */}
            <button 
                onClick={() => setIsLeadsPanelOpen(!isLeadsPanelOpen)}
                className="absolute -right-3 top-16 z-50 bg-slate-800 border border-slate-600 rounded-full p-1 text-slate-400 hover:text-white hover:border-slate-400 transition-colors shadow-lg hidden md:block"
            >
                <svg className={`w-3 h-3 transition-transform ${isLeadsPanelOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            {isLeadsPanelOpen ? (
                <>
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Leads</h3>
                        <div className="flex items-center gap-2">
                            <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full border border-slate-700">{leads.length}</span>
                            <button onClick={() => setIsLeadsPanelOpen(false)} className="md:hidden text-slate-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar min-w-[20rem]">
                        {leads.length === 0 && (
                            <div className="text-center text-slate-600 text-xs py-12 px-4 border-2 border-dashed border-slate-800 rounded bg-slate-900/30">
                                <div className="mb-2">⚠️</div>
                                No active leads. <br/> 
                                <span className="opacity-70">Deploy scouts from the Map view to find clients.</span>
                            </div>
                        )}
                        {leads.map(lead => (
                            <LeadCard 
                                key={lead.id} 
                                lead={lead} 
                                isActive={selectedLeadId === lead.id}
                                onClick={() => handleLeadClick(lead.id)}
                            />
                        ))}
                    </div>
                </>
            ) : (
                <div className="h-full flex flex-col items-center py-4 hidden md:flex">
                    <div className="flex-1 flex items-center justify-center">
                        <span className="-rotate-90 text-slate-500 font-bold tracking-[0.2em] whitespace-nowrap text-xs">ACTIVE LEADS</span>
                    </div>
                    <span className="bg-slate-800 text-slate-400 text-[10px] w-6 h-6 flex items-center justify-center rounded-full border border-slate-700 mt-4">{leads.length}</span>
                </div>
            )}
        </div>
      )}

      {/* COLUMN 3: MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative z-10 transition-all duration-300">
        
        {/* MOBILE HEADER */}
        <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 shrink-0">
             <button onClick={() => setIsSidebarOpen(true)} className="text-slate-300 flex items-center gap-2 text-sm font-bold">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                Menu
             </button>
             <span className="text-white font-bold tracking-tight">TradeNexus</span>
             {view === 'OPERATIONS' && (
                 <button onClick={() => setIsLeadsPanelOpen(true)} className="text-slate-300 flex items-center gap-2 text-sm font-bold relative">
                    Leads
                    <span className="bg-primary-600 text-white text-[10px] px-1.5 rounded-full">{leads.length}</span>
                 </button>
             )}
        </div>

        {view === 'DASHBOARD' ? (
            <Dashboard sessions={sessions} onToggleAutoPilot={toggleAutoPilot} onDeleteSession={handleDeleteSession} />
        ) : view === 'PROFILE' ? (
            <SupplierProfileView profile={supplierProfile} onSave={handleSaveSupplierProfile} />
        ) : (
            <>
                <div className={`flex-1 ${selectedLead ? 'overflow-hidden' : 'overflow-y-auto p-4 md:p-6'} flex flex-col`}>
                  {selectedLead ? (
                     <InteractionViewer 
                        lead={selectedLead} 
                        productContext={searchContext || undefined}
                        onUpdateLead={handleLeadUpdate}
                     />
                  ) : suggestions.length > 0 ? (
                    <div className="flex-1">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-2">
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Market Intelligence</h2>
                                <p className="text-slate-400 text-xs md:text-sm mt-1">
                                    Strategic Analysis for <span className="text-primary-400 font-semibold">{productName}</span>
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {suggestions.map((sug, idx) => {
                                const isDeployed = deployedRegions.has(sug.region);
                                const isReportLoading = sug.reportStatus === 'LOADING';
                                const isReportReady = sug.reportStatus === 'READY';
                                const scoutLeadCount = sug.targetLeadCount || getDefaultLeadCountForDemand(sug.demandLevel);

                                return (
                                    <div key={idx} className={`relative p-5 rounded-lg border flex flex-col transition-all duration-300 ${isDeployed ? 'bg-slate-900/80 border-primary-900/50' : 'bg-slate-900 border-slate-800 hover:border-slate-600 hover:shadow-xl'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="font-bold text-base md:text-lg text-white">{sug.region}</span>
                                            <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wide border ${sug.demandLevel === 'High' ? 'bg-green-950 border-green-900 text-green-400' : 'bg-yellow-950 border-yellow-900 text-yellow-400'}`}>{sug.demandLevel} Demand</span>
                                        </div>
                                        <p className="text-sm text-slate-400 mb-6 flex-1 leading-relaxed">{sug.reason}</p>

                                        <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-3 mb-4">
                                            <label htmlFor={`lead-target-${idx}`} className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                                                Scout Target (Leads):
                                            </label>
                                            <select
                                                id={`lead-target-${idx}`}
                                                value={scoutLeadCount}
                                                disabled={isDeployed}
                                                onChange={(e) => handleRegionLeadCountChange(sug.region, Number(e.target.value))}
                                                className="w-24 shrink-0 bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {LEAD_COUNT_OPTIONS.map(num => <option key={num} value={num}>{num}</option>)}
                                            </select>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-2 mt-auto">
                                            <button 
                                                onClick={() => isReportReady ? openReport(sug.region) : handleDeepDive(sug.region)}
                                                disabled={isReportLoading}
                                                className={`py-3 rounded text-sm font-semibold border transition-colors flex items-center justify-center gap-2 ${
                                                    isReportReady 
                                                    ? 'bg-emerald-900/50 hover:bg-emerald-900 border-emerald-700 text-emerald-400' 
                                                    : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-600'
                                                }`}
                                            >
                                                {isReportLoading ? (
                                                    <><div className="w-3 h-3 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div> Intel...</>
                                                ) : isReportReady ? (
                                                    'View Report'
                                                ) : (
                                                    'Deep Dive'
                                                )}
                                            </button>
                                            <button 
                                                onClick={() => deployScout(sug.region, scoutLeadCount)} 
                                                disabled={isDeployed} 
                                                className={`py-3 rounded text-sm font-semibold transition-all ${isDeployed ? 'bg-slate-950 border border-slate-800 text-primary-500 cursor-default' : 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg'}`}
                                            >
                                                {isDeployed ? 'Active' : 'Deploy Scout'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                      {isAnalyzing ? (
                          <div className="flex flex-col items-center animate-pulse">
                              <div className="w-16 h-16 rounded-full border-4 border-primary-500/20 border-t-primary-500 animate-spin mb-4"></div>
                              <h3 className="text-xl font-light text-primary-400">Scanning Global Markets...</h3>
                          </div>
                      ) : (
                          <div className="border border-dashed border-slate-800 rounded-2xl p-8 md:p-12 bg-slate-900/20 max-w-lg text-center mx-4">
                             <h3 className="text-xl font-medium text-slate-400 mb-2">Ready to Trade</h3>
                             <p className="text-slate-500 text-sm">Configure your strategy in the sidebar to begin.</p>
                          </div>
                      )}
                    </div>
                  )}
                </div>
                <div className={`${isTerminalMinimized ? 'h-10' : 'h-32 md:h-48'} border-t border-slate-800 bg-black p-2 md:p-4 flex-shrink-0 transition-all duration-300`}>
                  <Terminal 
                    logs={agentLogs} 
                    currentAction={agentAction} 
                    isMinimized={isTerminalMinimized}
                    onToggleMinimize={() => setIsTerminalMinimized(!isTerminalMinimized)}
                  />
                </div>
            </>
        )}
      </div>
    </div>
  );
}
