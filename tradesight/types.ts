export interface TradeRecord {
  period: string;
  reporterCode: number;
  reporterDesc: string;
  partnerCode: number;
  partnerDesc: string;
  partner2Code?: number;
  flowCode: string;
  flowDesc: string;
  cmdCode: string;
  cmdDesc: string;
  primaryValue: number;
  netWgt?: number;
  qty?: number;
}

export interface TradeDataResponse {
  data: TradeRecord[];
}

export interface ReferenceItem {
  id: string;
  text: string;
  reporterCodeIsoAlpha3?: string;
  reporterCodeIsoAlpha2?: string;
}

export interface ReferenceResponse {
  results: ReferenceItem[];
}

export interface Recommendation {
  id: string;
  title: string;
  category: string;
  impact: string;
  timeframe: string;
  description: string;
  actionSteps: string[];
  metricsLink: string;
}
