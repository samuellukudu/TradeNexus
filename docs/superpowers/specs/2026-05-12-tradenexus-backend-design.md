# TradeNexus Python Backend — Design Spec

## Goal

Create a separate Python/FastAPI backend that hosts all AI business logic, replacing the client-side Gemini calls with server-side equivalents. The existing React frontend becomes a thin UI layer that calls the backend API.

## Architecture

```
React Frontend (existing)          Python Backend (new)
─────────────────────────         ────────────────────────
                                  ┌──────────────────────┐
  Firebase Auth ─── ID token ──→  │  POST /api/v1/...    │
                                  │  verify_token() dep   │
  fetch('/api/v1/...') ───────→  │  Router → Service     │
                                  │  Service → Gemini SDK │
                                  │  Service → Firestore   │
                                  └──────────────────────┘
```

- **Auth:** Frontend keeps Firebase Auth. Backend verifies the ID token on every request via `firebase-admin` `auth.verify_id_token()`.
- **Data:** Firestore via `firebase-admin`. Same collections, same field names. Admin SDK bypasses rules; the backend enforces `userId` ownership in code.
- **AI:** Google Gemini Python SDK (`google-genai`) with Google Search grounding and Maps support — direct equivalent of the TypeScript SDK.

## Project Location

`/home/samu2505/SAAS/tradenexus-backend/` — separate directory from the frontend.

## Project Structure

```
tradenexus-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app factory, CORS, router registration
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py                # verify_token() dependency
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── sessions.py        # CRUD: GET/POST/DELETE /sessions
│   │       ├── markets.py         # POST /markets/analyze, /markets/{region}/report
│   │       ├── leads.py           # POST /leads/search, /leads/{id}/verify, PATCH /leads/{id}/status
│   │       └── prospecting.py     # POST /prospecting/message
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py              # Pydantic Settings from env vars
│   │   ├── firebase.py            # Firebase Admin init, Firestore helpers
│   │   └── gemini.py              # Gemini client factory, thinking config, JSON extraction
│   ├── services/                   # Pure Python business logic — NO HTTP
│   │   ├── __init__.py
│   │   ├── strategy.py            # extract_search_strategy_from_assets
│   │   ├── market_analysis.py     # analyze_markets, generate_market_report
│   │   ├── lead_discovery.py      # search_for_leads + internal helpers
│   │   ├── lead_verification.py   # verify_lead
│   │   └── prospecting.py         # generate_prospecting_message
│   └── models/
│       ├── __init__.py
│       └── schemas.py             # Pydantic models (mirrors types.ts)
├── tests/
│   ├── __init__.py
│   ├── conftest.py                # Mock Gemini client, test Firestore fixtures
│   ├── test_strategy.py
│   ├── test_market_analysis.py
│   ├── test_lead_discovery.py
│   └── test_lead_verification.py
├── pyproject.toml
├── .env.example
└── .gitignore
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `fastapi` | API framework |
| `uvicorn[standard]` | ASGI server |
| `google-genai` | Gemini SDK (search + maps grounding) |
| `firebase-admin` | Firestore CRUD + token verification |
| `pydantic-settings` | Env var management |
| `pytest` + `pytest-asyncio` | Testing |
| `httpx` | Test client for router tests |

## Data Models (`models/schemas.py`)

Pydantic models mapping 1:1 from `types.ts`. All field names preserved for frontend compatibility.

Key enums:
- `TargetAudienceType` — `Distributors/Importers | OEMs/Manufacturers | End Users | All`
- `LeadStatus` — `DISCOVERED | CONTACTING | NEGOTIATING | CLOSED_WON | CLOSED_LOST`

Key models: `ProductAsset`, `StrategicContext`, `ProductDetails`, `MarketReport`, `MarketStats`, `StatPoint`, `RegionSuggestion`, `Lead`, `ChatMessage`, `InteractionLog`, `MatchDetails`, `SocialProfile`, `Competitor`, `SearchSession`

## Service Layer

All functions are async, take plain data, return plain data. No FastAPI imports.

### `core/gemini.py`
- `build_thinking_config(model: str) -> dict` — mirrors TS logic: Gemma 4 uses `thinkingLevel`, Gemini 2.5 uses `thinkingBudget`
- `extract_json_from_text(text: str) -> Any` — same fallback chain when `response_mime_type` is incompatible with tools
- `get_gemini_client() -> Client` — reads `GOOGLE_API_KEY` from env

### `services/strategy.py`
- `extract_search_strategy_from_assets(product_name: str, assets: list[ProductAsset]) -> StrategicContext`
- Returns structured memory from document analysis. Falls back to `FALLBACK_CONTEXT` on failure.

### `services/market_analysis.py`
- `analyze_markets(...) -> list[RegionSuggestion]` — 9 region suggestions with demand levels
- `generate_market_report(product: ProductDetails, region: str) -> MarketReport` — uses Google Search grounding for HS codes, duties, trade shows, competitor stats

### `services/lead_discovery.py`
- `search_for_leads(product: ProductDetails, target_count: int = 20) -> list[Lead]`
- Internal: `_identify_strategic_hubs()` → 12 hubs → 4 squads of 3 → parallel `asyncio.gather()`
- Each squad batches into chunks of 8 leads (token limit avoidance)
- Google Maps URL verification filter + geographic sanity checks
- Returns leads with UUID, DISCOVERED status, attached sources

### `services/lead_verification.py`
- `verify_lead(lead: Lead, product: ProductDetails) -> Partial[Lead]` — Google Search + Maps confirmation

### `services/prospecting.py`
- `generate_prospecting_message(history: list[ChatMessage], lead: Lead, context: StrategicContext) -> str` — chat assistant with grounding sources

## API Endpoints

All under `/api/v1`. All require `Authorization: Bearer <firebase-id-token>`.

### Sessions
- `GET /sessions` → `list[SearchSession]`
- `POST /sessions` → `SearchSession` (create/update)
- `DELETE /sessions/{id}` → `204`

### Markets
- `POST /markets/analyze` → `list[RegionSuggestion]`
- `POST /markets/{region}/report` → `MarketReport`

### Leads
- `POST /leads/search` → `list[Lead]`
- `POST /leads/{id}/verify` → `Lead` (partial update)
- `PATCH /leads/{id}/status` → `Lead`

### Prospecting
- `POST /prospecting/message` → `str` (AI-generated outreach message with sources)

## Error Handling

| Error type | HTTP status |
|-----------|-------------|
| Missing/invalid auth token | 401 |
| User doesn't own resource | 403 |
| Bad request / validation error | 400 (Pydantic) |
| Gemini API failure | 502 |
| Unexpected error | 500 |

Services catch transient Gemini failures and return fallback data (same pattern as TS catch blocks). A single batch failure doesn't kill the entire search.

## Firebase Admin Setup

- Service account JSON downloaded from Firebase Console
- Path set as `GOOGLE_APPLICATION_CREDENTIALS` in `.env`
- Firestore uses same `users/{userId}/sessions/{sessionId}` structure
- Auth enforcement: `verify_token()` extracts `uid`, all Firestore operations scoped to that `uid`

## Testing Strategy

- **Service tests:** `pytest` calls service functions directly with mock Gemini client (returns canned JSON fixtures). No network.
- **Router tests:** FastAPI `TestClient` + mocked services. Verify request parsing, auth, response shapes.
- **Firestore tests:** Optional — test with Firestore emulator if available, otherwise mock the Firestore client.

## Frontend Changes Required

Minimal — the frontend replaces direct `geminiService.ts` calls with `fetch()` to the backend:

```typescript
// Before: client-side Gemini call
const leads = await searchForLeads(product);

// After: API call
const token = await auth.currentUser?.getIdToken();
const res = await fetch('http://localhost:8000/api/v1/leads/search', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(product)
});
const leads = await res.json();
```

`storageService.ts` can either keep calling Firestore directly (client-side) or switch to the `/sessions` API endpoints — both work during the transition.

## Out of Scope

- Deployment / containerization
- Rate limiting / API key management
- Streaming responses (SSE)
- Background task queue (autopilot re-scout timer stays client-side for now)
- Frontend rewrite
