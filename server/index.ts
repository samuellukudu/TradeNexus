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
