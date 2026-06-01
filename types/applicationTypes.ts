// types/applicationTypes.ts
// Application-Led Discovery types — separate file to avoid circular deps
// between types.ts and types/agentTypes.ts.

/** How the application was obtained. `"seed"` from the product brief, `"adapted"` from modifying a seed, `"discovered"` from AI-led research. */
export type ApplicationSourceType = "seed" | "adapted" | "discovered";

/** Categorises what role the product plays in a customer's workflow. */
export type ProductRoleType =
  | "finished system"
  | "machine or equipment"
  | "component"
  | "consumable"
  | "raw material"
  | "spare part"
  | "installation or service"
  | "software-enabled system";

export interface ProductRole {
  role: ProductRoleType;
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
  /** Relevance score 0–1; drives proportional lead budget allocation. */
  priorityScore: number;
  /** AI confidence 0–1 in the correctness of this application entry. */
  confidence: number;
  sourceType: ApplicationSourceType;
  evidence?: string[];
}

export interface CountryApplicationMap {
  productName: string;
  country: string;
  productRole: ProductRole;
  applications: ProductApplication[];
  /** Unix millisecond timestamp when this map was generated. */
  generatedAt: number;
}
