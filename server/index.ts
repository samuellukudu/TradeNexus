import express, { Request, Response, NextFunction } from "express";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const isProduction = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || 3000);

const app = express();
const httpServer = createServer(app);

app.use(express.json({ limit: "25mb" }));

const asyncRoute = (
  handler: (req: Request, res: Response) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res).catch(next);
  };
};

const ai = await import("./geminiService");

// Agent module imports (Phase 1+ — stubs throw until their phase is implemented)
const agentSocialDiscovery = await import("./agent/discovery/socialDiscovery.js");
const agentSocialToLead = await import("./agent/discovery/socialToLead.js");
const agentVerification = await import("./agent/verification/leadVerification.js");
const agentScoring = await import("./agent/scoring/leadScoring.js");

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/ai/prospecting-message", asyncRoute(async (req, res) => {
  const { history, lead, productContext } = req.body;
  const text = await ai.generateProspectingMessage(history, lead, productContext);
  res.json({ text });
}));

app.post("/api/ai/extract-search-strategy", asyncRoute(async (req, res) => {
  const context = await ai.extractSearchStrategyFromAssets(req.body.product);
  res.json({ context });
}));

app.post("/api/ai/analyze-markets", asyncRoute(async (req, res) => {
  const {
    productName,
    productDescription,
    continent,
    countries,
    productAssets,
    preComputedContext,
    supplierCountry
  } = req.body;

  const suggestions = await ai.analyzeMarkets(
    productName,
    productDescription,
    continent,
    countries,
    productAssets,
    preComputedContext,
    supplierCountry
  );
  res.json({ suggestions });
}));

app.post("/api/ai/market-report", asyncRoute(async (req, res) => {
  const report = await ai.generateMarketReport(req.body.product, req.body.region);
  res.json({ report });
}));

app.post("/api/ai/search-leads", asyncRoute(async (req, res) => {
  const leads = await ai.searchForLeads(req.body.product);
  res.json({ leads });
}));

app.post("/api/ai/verify-lead", asyncRoute(async (req, res) => {
  const result = await ai.verifyLead(req.body.lead, req.body.product);
  res.json({ result });
}));

// --- Agent Pipeline Routes (Phase 1+) ---

// Phase 2: Social discovery for a known company
app.post("/api/agent/social-discovery/company", asyncRoute(async (req, res) => {
  const { companyName, region, website, productContext } = req.body;
  const profiles = await agentSocialDiscovery.discoverSocialForCompany(
    companyName,
    region,
    website,
    productContext
  );
  res.json({ profiles });
}));

// Phase 3: Social-first lead discovery by region
app.post("/api/agent/social-discovery/region", asyncRoute(async (req, res) => {
  const { productName, region, productContext } = req.body;
  const profiles = await agentSocialDiscovery.discoverLeadsFromSocial(
    productName,
    region,
    productContext
  );
  const leads = agentSocialToLead.socialProfilesToLeads(profiles, region || "Unknown");
  res.json({ profiles, leads });
}));

// Phase 4: Structured lead verification
app.post("/api/agent/verify-lead", asyncRoute(async (req, res) => {
  const { lead, product } = req.body;
  const verification = await agentVerification.verifyLead(lead, product);
  res.json({ verification });
}));

// Phase 4: Lead scoring with breakdown
app.post("/api/agent/score-lead", asyncRoute(async (req, res) => {
  const { lead, product } = req.body;
  const score = await agentScoring.scoreLead(lead, product);
  res.json({ score });
}));

// Phase 5: Next best action recommendation
app.post("/api/agent/next-best-action", asyncRoute(async (_req, res) => {
  res.status(501).json({ error: "Next best action not yet implemented (Phase 5)" });
}));

// Phase 6: Outreach draft generation
app.post("/api/agent/outreach-draft", asyncRoute(async (_req, res) => {
  res.status(501).json({ error: "Outreach drafting not yet implemented (Phase 6)" });
}));

if (isProduction) {
  const distPath = path.join(root, "dist");
  app.use(express.static(distPath));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    root,
    server: {
      middlewareMode: true,
      hmr: { server: httpServer }
    },
    appType: "spa"
  });
  app.use(vite.middlewares);
}

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Express] Request failed:", error);
  const message = error instanceof Error ? error.message : "Unknown server error";
  res.status(500).json({ error: message });
});

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`TradeNexus server listening on http://localhost:${port}`);
});
