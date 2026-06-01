# Social-Media-First Discovery — Brick-and-Mortar Lead Finding

**Date:** 2026-06-01
**Status:** Draft
**Product:** TradeNexus AI Sales Agent

## Overview

Social-media-first discovery treats social profiles, pages, posts, and marketplace-style activity as primary lead sources. This is especially important for brick-and-mortar companies that may have little or no website presence but actively operate through Facebook, Instagram, LinkedIn, TikTok, WhatsApp, Google Maps, and local directories.

The goal is to discover companies through their social presence, convert strong profiles into lead candidates, and verify them through secondary evidence.

## Problem

Many real-world buyers do not maintain polished websites. They may instead use:

- Facebook business pages
- Instagram shops or product showcases
- WhatsApp contact links
- LinkedIn company pages
- TikTok product demos
- Google Maps listings
- local marketplace posts
- industry group posts

Traditional website-first discovery misses these businesses or treats social profiles only as enrichment after a company is already found. For many local distributors, retailers, installers, contractors, workshops, and service providers, the social profile is the best available lead source.

## Core Principle

Social profiles can be source leads, not only supporting evidence.

The agent should search social surfaces directly, extract business and contact signals, classify relevance, then verify with maps, directories, websites, and cross-platform matches.

## Desired Workflow

### 1. Social Search Planning

For each product, country, and application lane, the agent generates social-first search queries. Queries should combine:

- product/application terms
- buyer-type terms
- country/city terms
- platform filters
- local vocabulary
- intent or business-operation terms

Examples:

```text
site:facebook.com "solar installer" "Kenya" "battery"
site:instagram.com "restaurant equipment supplier" "Dubai"
site:linkedin.com/company "industrial distributor" "Mexico"
site:tiktok.com "hardware store" "Nigeria"
"WhatsApp" "water treatment" "Ghana"
"solar pumping" "Kenya" "Facebook"
```

### 2. Profile Candidate Extraction

The agent extracts candidate profiles and pages from grounded search results. For each candidate, it should capture:

- company or page name
- platform
- profile URL
- country, city, or service area
- profile summary/snippet
- product/category fit
- visible contact hints
- activity signals
- whether the profile appears official
- source query

### 3. Business Signal Analysis

The agent should look for signals such as:

- recent posts
- product photos
- service descriptions
- address or showroom location
- WhatsApp, phone, email, Messenger, or contact form
- distributor/importer language
- installer/contractor language
- retail/stock availability language
- comments, reviews, or engagement
- cross-links to website, maps, or other social platforms

### 4. Verification

After a profile looks promising, the agent verifies it with secondary sources:

- Google Maps listing
- LinkedIn company profile
- official website, if any
- business directories
- repeated phone, address, or company-name matches
- other social profiles
- industry association or marketplace listings

This helps avoid fake, abandoned, irrelevant, or impersonated profiles.

### 5. Lead Creation

A social-first lead can be created when the profile has enough evidence to indicate an operating business. A website should not be required if other evidence is strong.

Minimum recommended evidence:

- clear company/page identity
- country or service area
- category/application fit
- at least one contact or location signal
- reasonable activity or verification signal

### 6. Scoring

Social-first leads should be scored differently from website-first leads.

Positive signals:

- recent posts or visible activity
- visible phone, WhatsApp, email, or address
- product photos or service examples
- clear business category
- multiple social platforms
- Google Maps match
- active comments/reviews
- importer, distributor, installer, contractor, or retailer language

Negative signals:

- personal profile with unclear business identity
- inactive or abandoned page
- meme/blog/news page with no procurement relevance
- no country/location signal
- no contact path
- weak product/application match
- duplicate or suspicious profile

## Data Model Ideas

```ts
type SocialPlatform =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "tiktok"
  | "x"
  | "youtube"
  | "whatsapp"
  | "maps"
  | "other";

interface SocialLeadEvidence {
  id: string;
  platform: SocialPlatform;
  url: string;
  title: string;
  snippet?: string;
  companyName?: string;
  country?: string;
  city?: string;
  profileType: "company" | "employee" | "founder" | "reseller" | "community" | "unknown";
  activityLevel: "high" | "medium" | "low" | "unknown";
  contactHints: string[];
  productFitSignals: string[];
  verificationSignals: string[];
  badFitSignals: string[];
  confidence: number;
  sourceQuery: string;
}
```

Lead records should be able to store social evidence as the primary origin:

```ts
interface LeadSocialOrigin {
  originType: "social-first";
  primaryProfileUrl: string;
  primaryPlatform: SocialPlatform;
  evidence: SocialLeadEvidence[];
  verificationStatus: "unverified" | "partially_verified" | "verified" | "rejected";
}
```

## Integration With Application-Led Discovery

Social-media-first discovery should work best after application decomposition.

Example flow:

1. Product: solar irrigation pump
2. Country: Kenya
3. Application: commercial irrigation farms
4. Buyer types: greenhouse operators, flower farms, horticulture exporters
5. Social queries:

```text
site:facebook.com "greenhouse farm" "Kenya" "irrigation"
site:instagram.com "flower farm" "Naivasha"
"Kenya horticulture farm" "WhatsApp"
```

The application context makes social search more precise.

## Prompting Guidelines

The agent should be instructed to:

- treat social profiles as possible source leads
- avoid fabricating profiles
- distinguish official company pages from employees, groups, resellers, and community pages
- prefer profiles with recent activity and contact/location signals
- verify promising profiles with at least one secondary source when possible
- preserve the query and source that produced each profile
- explain why each profile is relevant to the product/application

## Success Criteria

- The agent can discover leads with no official website when strong social evidence exists.
- Each social-first lead includes platform, URL, profile type, contact hints, and verification signals.
- Social leads are deduplicated against website-first and maps-first leads.
- Leads are scored using social-specific signals rather than website-heavy assumptions.
- The agent can explain the application and buyer-type fit for each social lead.

## Risks

- Search snippets may be incomplete or stale.
- Social platforms may limit crawlability.
- Profiles may be abandoned, fake, or unrelated.
- Personal profiles and community groups can be mistaken for companies.
- Social-first discovery may find small businesses that are not import-ready.

## Open Questions

- Which platforms should be prioritized by country and product family?
- How much evidence is enough to create a lead without a website?
- Should WhatsApp-only businesses be allowed as leads?
- Should users be able to filter by social activity level?
- Should social profiles be refreshed periodically for activity changes?
