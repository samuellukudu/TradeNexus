// Real lead data extracted from TradeNexus AI CSV exports.
// Three datasets are from actual search sessions; four are representative examples.

import type { Translations } from '../i18n/en';

export interface ShowcaseLead {
  companyName: string;
  matchScore: string;
  detail: string;
}

export interface UseCase {
  flag: string;
  country: string;
  region: string;
  product: string;
  context: string;
  isRealData: boolean;
  leads: ShowcaseLead[];
}

export const useCases: UseCase[] = [
  {
    flag: "🇦🇺",
    country: "Australia",
    region: "Oceania",
    product: "Mini Excavators",
    context: "Chinese OEM targeting equipment hire companies across Sydney, Melbourne, Brisbane.",
    isRealData: true,
    leads: [
      { companyName: "Sydney Machinery Hire", matchScore: "95%", detail: "Dry hire fleet serving construction projects across Sydney and regional NSW" },
      { companyName: "Cornfoot Bros Earthmoving", matchScore: "95%", detail: "Fleet of 100+ machines for civil construction across Victoria" },
      { companyName: "ACE Rental", matchScore: "95%", detail: "200+ machine fleet serving civil construction and infrastructure in SE Queensland" },
    ],
  },
  {
    flag: "🇸🇦",
    country: "Saudi Arabia",
    region: "Middle East",
    product: "Solar Panels",
    context: "Chinese manufacturer targeting Vision 2030 solar EPC contractors and distributors.",
    isRealData: true,
    leads: [
      { companyName: "Desert Technologies", matchScore: "85%", detail: "PV manufacturer, developer, EPC and O&M contractor in Jeddah" },
      { companyName: "National Solar Systems", matchScore: "85%", detail: "Leading solar EPC contractor designing and installing PV systems in Dammam" },
      { companyName: "Ishraq Solar Energy", matchScore: "85%", detail: "Imports, supplies and wholesales global solar products in Majmaah" },
    ],
  },
  {
    flag: "🇫🇯",
    country: "Fiji",
    region: "Oceania",
    product: "HVAC Systems",
    context: "Chinese manufacturer targeting Fijian contractors and resort developers.",
    isRealData: true,
    leads: [
      { companyName: "Kooline Air Conditioning", matchScore: "85%", detail: "Primary HVAC contractor since 1975, branches in Suva and Nadi" },
      { companyName: "Mechanical Services Ltd", matchScore: "85%", detail: "Leading Daikin VRF distributor with 180-200 personnel" },
      { companyName: "Rainbow Cool Tech Fiji", matchScore: "85%", detail: "Large-scale HVAC for hotels, supermarkets, and resort environments" },
    ],
  },
  {
    flag: "🇰🇪",
    country: "Kenya",
    region: "Africa",
    product: "Agricultural Machinery",
    context: "Chinese tractor OEM targeting Kenyan agri-importers and large-scale farming operations.",
    isRealData: false,
    leads: [
      { companyName: "Nairobi Farm Machinery Ltd", matchScore: "90%", detail: "Major importer and distributor serving Rift Valley and Central Province" },
      { companyName: "Agri-Solutions East Africa", matchScore: "88%", detail: "Supply chain partner for 200+ cooperatives across Kenya and Tanzania" },
      { companyName: "Mombasa Trading Group", matchScore: "85%", detail: "Port-city logistics hub distributing machinery to inland agricultural zones" },
    ],
  },
  {
    flag: "🇩🇪",
    country: "Germany",
    region: "Europe",
    product: "EV Battery Components",
    context: "Chinese battery component maker targeting German automotive Tier-1 suppliers.",
    isRealData: false,
    leads: [
      { companyName: "Bavarian Auto Components GmbH", matchScore: "92%", detail: "Tier-1 supplier specializing in EV power systems for major German OEMs" },
      { companyName: "Stuttgart Powertrain AG", matchScore: "89%", detail: "Develops and procures battery subcomponents for European EV platforms" },
      { companyName: "E-Mobility Parts Deutschland", matchScore: "87%", detail: "Mid-tier supplier focused on battery cooling systems and interconnects" },
    ],
  },
  {
    flag: "🇲🇽",
    country: "Mexico",
    region: "North America",
    product: "Industrial Packaging",
    context: "Chinese packaging machinery maker targeting Mexican food and beverage manufacturers.",
    isRealData: false,
    leads: [
      { companyName: "Empaques Industriales Monterrey", matchScore: "91%", detail: "Leading packaging solutions provider for food and beverage processors in Nuevo Leon" },
      { companyName: "Guadalajara Packaging Systems", matchScore: "88%", detail: "Equipment importer and systems integrator for Jalisco's manufacturing corridor" },
      { companyName: "Alimentos y Empaques del Bajio", matchScore: "86%", detail: "Regional co-packer expanding automated packaging lines across central Mexico" },
    ],
  },
  {
    flag: "🇧🇷",
    country: "Brazil",
    region: "South America",
    product: "Mining Equipment Parts",
    context: "Chinese foundry targeting Brazilian mining operators and equipment maintenance firms.",
    isRealData: false,
    leads: [
      { companyName: "Mineracao Minas Gerais Ltda", matchScore: "93%", detail: "Major mining operator maintaining fleet of 300+ heavy machines in Iron Quadrangle" },
      { companyName: "Para Equipmentos de Mineracao", matchScore: "90%", detail: "Equipment maintenance and parts sourcing for Carajas region mining operations" },
      { companyName: "Belo Horizonte Industrial Supply", matchScore: "87%", detail: "Industrial parts distributor specializing in mining wear components and castings" },
    ],
  },
];

interface HowItWorksStepKey {
  number: number;
  titleKey: keyof Translations;
  descriptionKey: keyof Translations;
}

export const howItWorksStepKeys: HowItWorksStepKey[] = [
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
