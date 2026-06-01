// types/applicationTypes.ts
// Application-Led Discovery types — separate file to avoid circular deps
// between types.ts and types/agentTypes.ts.

export type ApplicationSourceType = "seed" | "adapted" | "discovered";

export interface ProductRole {
  role: string; // finished system | machine or equipment | component | consumable | raw material | spare part | installation or service | software-enabled system
  resellerTypes: string[];
  installerTypes: string[];
  operatorTypes: string[];
  maintainerTypes: string[];
  financierTypes: string[];
}

export interface ProductApplication {
  id: string;
  name: string;
  country: string;
  buyerTypes: string[];
  whyRelevant: string;
  procurementTriggers: string[];
  searchTerms: string[];
  qualificationSignals: string[];
  badFitSignals: string[];
  decisionMakers: string[];
  priorityScore: number;
  confidence: number;
  sourceType: ApplicationSourceType;
  evidence?: string[];
}

export interface CountryApplicationMap {
  productName: string;
  country: string;
  productRole: ProductRole;
  applications: ProductApplication[];
  generatedAt: number;
}
