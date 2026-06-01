# Application-Led Discovery — Dynamic Market Decomposition

**Date:** 2026-06-01
**Status:** Draft
**Product:** TradeNexus AI Sales Agent

## Overview

Application-led discovery shifts TradeNexus from searching directly for companies that mention a product to first understanding where that product is used in the target country. The agent should decompose a supplier's exact product into country-specific applications, buyer types, procurement triggers, and search lanes, then find companies inside those lanes.

This avoids shallow searches such as "buyers of water filtration in Kenya" and instead asks "which commercial, institutional, industrial, agricultural, or infrastructure applications in Kenya need water filtration, and who operates them?"

## Problem

Direct product-name search misses many real buyers because companies rarely advertise procurement intent directly. A quarry operator may not say it buys excavators, a flower farm may not say it buys solar irrigation pumps, and a hotel may not say it buys water filtration systems. However, their operations reveal demand.

Static product templates are also risky. Every supplier's product differs by capacity, certification, price band, use case, component role, and buyer maturity. A generic "solar" template could incorrectly mix residential kits, industrial battery systems, solar pumps, panels, mounting structures, and EPC services.

## Core Principle

Reusable templates should be reasoning scaffolds, not fixed product lists.

The agent should generate a fresh application map for each supplier product and target country. Reusable knowledge can provide schema, examples, search patterns, buyer-type hints, and scoring rubrics, but it must not constrain discovery to a static list.

## Desired Workflow

### 1. Product Intake

The agent reads the supplier's exact product context:

- product name
- description and specifications
- uploaded catalog text or images
- certifications
- capacity, size, grade, or model range
- supplier country
- MOQ or price level when available
- target audience preference
- existing customer examples when available

### 2. Product Role Classification

Before searching, the agent classifies what the product is:

- finished system
- machine or equipment
- component
- consumable
- raw material
- spare part
- installation/service offering
- software-enabled system

It should also identify who resells it, installs it, operates it, maintains it, and finances it.

### 3. Dynamic Application Map

The agent generates a product-specific application map. Each application should include:

- application name
- buyer types
- why the product is relevant
- procurement triggers
- likely decision makers
- search terms
- qualification signals
- bad-fit signals
- expected company types
- confidence level
- source type: seed, adapted, or discovered

Example:

```json
{
  "product": "50HP solar irrigation pump system",
  "country": "Kenya",
  "applications": [
    {
      "application": "commercial irrigation farms",
      "buyerTypes": ["flower farms", "horticulture farms", "greenhouse operators"],
      "whyRelevant": "High water pumping demand and incentive to reduce diesel costs.",
      "procurementTriggers": ["borehole expansion", "diesel cost pressure", "greenhouse irrigation upgrades"],
      "searchTerms": [
        "Kenya greenhouse farms irrigation",
        "Naivasha flower farms irrigation",
        "Kenya horticulture exporters irrigation systems"
      ],
      "qualificationSignals": ["operates farms or greenhouses", "uses boreholes", "exports horticulture products"],
      "badFitSignals": ["small household garden", "solar blog with no operations"],
      "sourceType": "discovered"
    }
  ]
}
```

### 4. Country Adaptation

The agent adapts the application map to the target country using grounded research. It should account for:

- climate and geography
- dominant industries
- infrastructure gaps
- import dependency
- local terminology
- regulations and tenders
- energy, water, construction, mining, logistics, or agricultural conditions
- regional clusters and industrial zones

The country-specific evidence should override generic assumptions.

### 5. Application Prioritization

Before company discovery, applications should be ranked by:

- demand likelihood
- urgency
- purchasing power
- import dependency
- ease of finding companies
- ease of reaching decision makers
- fit with supplier capability
- likely sales cycle
- competition intensity

### 6. Company Discovery Per Application

Each high-priority application becomes a search lane. The agent should search using web, maps, directories, business registries, and social media.

Examples:

- "Kenya flower farms irrigation"
- "Ghana quarry operators excavators"
- "UAE hotels water treatment suppliers"
- "Nigeria cold room solar backup power"
- "South Africa mining contractors water filtration"

### 7. Lead Classification

Every discovered lead should keep its application context:

```json
{
  "companyName": "Example Farms Ltd",
  "application": "commercial irrigation farms",
  "buyerType": "horticulture exporter",
  "whyRelevant": "Operates greenhouse farms in a water-intensive region.",
  "searchLane": "Kenya greenhouse farms irrigation",
  "confidence": 0.82
}
```

### 8. Outreach Angle

The application context should shape outreach. A solar pump message to a farm should differ from a solar backup power message to a telecom operator. The agent should generate application-specific pain points, value propositions, and suggested first messages.

## Reusable Scaffolding

Reusable assets should include:

- application-map schema
- product-role taxonomy
- buyer-type taxonomy
- search-query patterns
- qualification-signal checklist
- bad-fit-signal checklist
- scoring rubric
- few-shot examples

Reusable assets should not include hard product-to-application gates.

Instruction principle:

> Use reusable examples only as inspiration. Generate the application map from the exact product and target country. Add, modify, or discard applications when local evidence or product details justify it.

## Example Product Families

### Water Filtration

Potential applications:

- bottled water producers
- hotels and resorts
- hospitals and schools
- food and beverage factories
- farms and greenhouses
- car washes and laundries
- municipal contractors
- mining and industrial sites
- real estate developers
- NGOs and public health projects

### Solar

Potential applications:

- residential rooftop solar
- commercial rooftop solar
- solar irrigation pumping
- telecom tower backup power
- cold storage
- hospitals and schools
- mini-grid developers
- industrial backup power
- hotels and resorts
- battery and inverter distributors

### Excavators

Potential applications:

- construction contractors
- road builders
- mining companies
- quarry operators
- demolition contractors
- rental fleets
- agriculture and land clearing
- municipal/public works contractors
- oil, gas, and infrastructure projects

These examples are illustrative only. The actual application map must be generated from the supplier's exact product and country context.

## Data Model Ideas

Potential new entities:

```ts
type ApplicationSourceType = "seed" | "adapted" | "discovered";

interface ProductApplication {
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
```

Lead records should reference the application that produced them.

## Success Criteria

- The agent produces a country-specific application map before company discovery.
- Application maps are based on the exact supplier product, not static product templates.
- Each company lead includes application context and buyer-type classification.
- Search lanes are traceable from application to query to lead.
- Outreach recommendations adapt to the lead's application.
- The agent can add country-specific applications that were not present in reusable examples.

## Risks

- The generated application map may be too broad and waste search budget.
- The agent may hallucinate applications without evidence.
- Static examples may bias the agent too strongly if prompts are not explicit.
- Some applications may identify companies that use a product but are not likely to import or purchase directly.

## Open Questions

- Should the application map be editable by users before discovery starts?
- Should the agent run discovery on all applications or only top-ranked lanes?
- Should each application lane have a lead target count?
- Should supplier profile memory influence application ranking?
- Should the system store successful application maps for future supplier campaigns?
