# Master Operational SOP: Generative Engine Optimization (GEO) & AI Visibility Audit System
**Standard Operating Procedure, Mathematical Protocols, Presentation Standards & New Client Onboarding Runbook**  
*System Level: Agency Production Standard · Uprise Digital*  
*Version: 3.0 · Fully Grounded, Dynamically Scaled, Dual-PIN Protected*  
*Authoritative Scope: Universal (Applicable to Any Commercial Entity, Niche, or Geographic Market)*

---

## 1. System Overview & Executive Principles

This document serves as the **definitive operational guide and standard operating procedure** for conducting empirical Generative Engine Optimization (GEO) and Answer Engine Optimization (AEO) visibility audits for any corporate client or prospective agency account.

Every audit delivered by this platform must satisfy **four core non-negotiable invariants**:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                          THE 4 PRODUCTION INVARIANTS                                           │
├────────────────────────────┬────────────────────────────┬──────────────────────────────┬───────────────────────┤
│ 1. ZERO SIMULATION         │ 2. STRATEGIC RESTRAINT     │ 3. DUAL-KEYED ACCESS         │ 4. REPO & DEPLOY ISOLATION
│ • No fake/mocked answers   │ • Mirror Ned's style       │ • Clean white gatekeeper     │ • NEW GitHub repo per client
│ • Dynamic sample size      │ • High-level authority     │ • Client PIN: Tier 1 only    │ • Never merge client code
│   N = M × Q × E            │ • Zero recipe giveaways    │ • Internal PIN: Tier 1 & 2   │ • Same Railway project OK
│ • Live authenticated APIs  │ • Deep math in Tier 2 only │ • Server-side HttpOnly token │ • Distinct service & domain
└────────────────────────────┴────────────────────────────┴──────────────────────────────┴───────────────────────┘
```

---

## 2. Scientific Rigor & Mathematical Foundations

### 2.1 Dynamic Sample Size Formulation ($N = M \times Q \times E$)
The audit universe must strictly reflect the verified, live-authenticated AI engines available:
$$N = M \times Q \times E$$
- **$M$ (Markets):** Number of target geographic regions or commercial segments (Standard: $M = 8$).
- **$Q$ (Queries):** Standardized commercial buying intent prompt battery (Standard: $Q = 7$ per market).
- **$E$ (Active Engines):** Count of active, authenticated AI answer engines with verified live API keys ($E \in \{2, 3, 5\}$).

| Engine Count ($E$) | Active Authenticated Services | Sample Size ($N$) | Market Denominator ($M_d$) | Production Behavior |
| :---: | :--- | :---: | :---: | :--- |
| **$E = 5$** | Gemini 3.8, Google AI Mode, Claude 4.6, ChatGPT Search, Perplexity | **$N = 280$** | **35 per market** | Full cross-engine consensus matrix |
| **$E = 3$** | Google AI Mode, Gemini 3.8, Claude 4.6 | **$N = 168$** | **21 per market** | Grounded local + general LLM evaluation |
| **$E = 2$** | Google AI Mode, Gemini 3.8 | **$N = 112$** | **14 per market** | Search indexation + SERP grounding audit |

> [!IMPORTANT]
> **The Zero-Simulation Mandate:** Under no circumstances are missing engines to be simulated, synthesized, or hallucinated. The platform dynamically scales its denominator $N$, adjusts all chart axes, and renders only columns corresponding to authenticated engines.

### 2.2 Unified Multi-Engine Ingestion Architecture (DataForSEO AI Suite)

To achieve the full $E = 5$ ($N = 280$) multi-engine consensus matrix without maintaining individual enterprise subscriptions across OpenAI, Perplexity, Anthropic, and Google Cloud, the pipeline utilizes **DataForSEO's AI Optimization API Suite** (`/v3/ai_optimization/`).

DataForSEO acts as a unified programmatic gateway that executes live prompts across commercial AI engines using a single API credential (`DATAFORSEO_AUTH`):

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        DATAFORSEO UNIFIED AI GATEWAY ARCHITECTURE                      │
├──────────────────────────┬────────────────────────────────────────┬────────────────────┤
│ Engine Target            │ DataForSEO API Endpoint                │ Authentication     │
├──────────────────────────┼────────────────────────────────────────┼────────────────────┤
│ 1. ChatGPT Search / 4o   │ /v3/ai_optimization/chat_gpt/llm_responses/live │ Basic DATAFORSEO   │
│ 2. Perplexity Sonar      │ /v3/ai_optimization/perplexity/llm_responses/live │ Basic DATAFORSEO   │
│ 3. Google AI Mode / AIO  │ /v3/serp/google/ai_mode/live/advanced  │ Basic DATAFORSEO   │
│ 4. Google Local 3-Pack   │ /v3/serp/google/organic/live/advanced  │ Basic DATAFORSEO   │
│ 5. Claude Sonnet         │ /v3/ai_optimization/claude/llm_responses/live   │ Basic DATAFORSEO   │
│ 6. Google Gemini Grounded│ Direct Google GenAI API or DataForSEO  │ GEMINI_API_KEY     │
└──────────────────────────┴────────────────────────────────────────┴────────────────────┘
```

#### Key Capabilities of the Unified Gateway:
1. **Zero Provider Account Sprawl:** Eliminates the operational requirement to manage individual OpenAI Plus/API, Perplexity Pro, or multi-vendor credit cards. All queries are metered pay-per-task against the agency DataForSEO balance.
2. **Deterministic Australian Geo-Targeting:** Passing `location_name: "Melbourne,Victoria,Australia"` forces DataForSEO to execute prompts through localized Australian residential proxies, guaranteeing that ChatGPT and Perplexity return authentic Australian agency recommendations rather than US-skewed results.
3. **Structured Citation Extraction:** Responses automatically include raw generative prose, web source URLs, domain citation metadata, and token execution latency.
4. **Token Compression (`.ai` Suffix):** Appending `.ai` to endpoints (e.g. `/v3/ai_optimization/chat_gpt/llm_responses/live.ai`) compresses payloads by stripping null/empty structures, dramatically reducing processing memory.

### 2.3 Core Metric Formulations

#### 1. Share of Model Voice ($\widehat{\text{SoMV}}$)
The unweighted probability that the target commercial entity $E$ is explicitly named in an unprompted natural language recommendation response:
$$\widehat{\text{SoMV}}(E) = \left( \frac{1}{N} \sum_{i=1}^{N} \mathbb{I}(E \in \text{Entities}(R_i)) \right) \times 100\%$$
*(Where $\mathbb{I}$ is the indicator function: $1$ if entity is present, $0$ otherwise).*

#### 2. Weighted Visibility Index ($\text{WVI}$)
Accounts for steep consumer attention drop-off by applying a logarithmic rank decay factor weighted by sentiment stance polarity $S_{ik} \in \{+1.0, +0.5, -0.5\}$:
$$\text{WVI}(E) = \frac{1}{N} \sum_{i=1}^{N} \left( \sum_{k=1}^{K_i} \frac{S_{ik}}{\log_2(r_{ik} + 1)} \cdot \mathbb{I}(E = \text{Entity}_{ik}) \right)$$

#### 3. Exact 95% Confidence Bounds (Wilson Score Interval)
Prevents sample-size distortion when proportions are close to $0\%$ or $100\%$:
$$w = \frac{\hat{p} + \frac{z^2}{2N} \pm z\sqrt{\frac{\hat{p}(1-\hat{p})}{N} + \frac{z^2}{4N^2}}}{1 + \frac{z^2}{N}} \quad (\text{where } z = 1.960)$$

#### 4. Logistic Odds Ratio & Upstream Attribution
Estimates the causal probability of generative recommendation based on directory presence, local map pack rankings, and review volume:
$$\text{logit}\left(P(E \in \text{Rec})\right) = \beta_0 + \beta_1 X_{\text{Directory}} + \beta_2 X_{\text{MapPack}} + \beta_3 \ln(X_{\text{Reviews}} + 1)$$

---

## 3. Dual-Deck Presentation Architecture

Every client engagement is compiled into a synchronized two-tiered architecture:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      TWO-TIER DECK ARCHITECTURE                        │
├──────────────────────────────────┬─────────────────────────────────────┤
│ TIER 1: Executive Pitch Deck     │ TIER 2: Technical Dossier           │
│ Route: / or index.html           │ Route: /technical or technical.html │
│ Audience: C-Suite, Founder, CMO  │ Audience: Data Scientists, CTO, Eng │
│ Tone: Consultative, Commercial   │ Tone: Econometric, Mathematical     │
│ Style: Mirrors Ned's LHD Deck    │ Style: Full Academic Telemetry      │
│ Access: Client PIN (2026)        │ Access: Internal PIN (9418) only    │
│ Leaks: ZERO proprietary recipes  │ Content: Cosine thresholds, DDL     │
└──────────────────────────────────┴─────────────────────────────────────┘
```

### 3.1 The Ned Presentation Standard (Strategic Restraint)
For client-facing pitch decks (Tier 1):
1. **Never Give Away the Execution Blueprint:** Do not hand prospects a directory checklist or granular code tutorial.
2. **Slide 23 (Workstream 01) Grouping:** Replace specific third-party domain names (`clutch.co`, `shopify.com`, `goodfirms.co`) with high-level strategic authority tiers:
   - *Verified Agency Directories & Industry Portals*
   - *Official Platform Partner Ecosystems*
   - *Digital Trade Press & Agency Award Databases*
   - *Independent Peer Review & Rating Aggregators*
3. **Action Headers:** Standardize execution bullet points under clean consultative headers: `"What we will do"`.
4. **Link Isolation:** Never embed public buttons or hyperlinks to `technical.html` on the client deck.

### 3.2 The 1:1 Claim-to-Proof Law & Proof Verification Matrix

> [!IMPORTANT]
> **The 1:1 Claim-to-Proof Mandate:** Every single empirical claim, statistic, competitor benchmark, algorithmic diagnostic, or operational deliverable presented to prospective clients in the Tier 1 Presentation (`/`) **MUST have a direct, verifiable, attached empirical proof** in the Tier 2 Technical Dossier (`/technical`). Zero claims may exist without empirical grounding.

#### Master Claim-to-Proof Verification Matrix

Every audit deliverable must satisfy this cross-tier mapping before client delivery:

| # | Tier 1 Client Deck Claim Category | Client Slide Example | Tier 2 Empirical Proof & Attachment Standard | Required Technical Dossier Evidence |
| :---: | :--- | :--- | :--- | :--- |
| **01** | **Sample Size Cardinality ($N$)** | Cover / Slide 5: *"N = 8 × 7 × E answers"* | Matrix cardinality breakdown ($M \times Q \times E$), authenticated API list, and live query execution timestamps. | `2.0 Problem Formulation`: Formal parameter table with exact $M$, $Q$, $E$, and $N$. |
| **02** | **Share of Model Voice ($\widehat{\text{SoMV}}$)** | Slide 3 & 6: *"Client captured X% of answers"* | Exact mathematical derivation, mention indicator sum, and asymmetric Wilson Score 95% Confidence Interval bounds ($[w^-, w^+]$). | `3.0 / 5.0 Share of Model Voice`: Formula + derivation table with $p$-values and Wilson CIs. |
| **03** | **Rank Decay Prominence ($\text{WVI}$)** | Slide 3 & 11: *"Client visibility index is 0.013 vs 0.518"* | Discounted Cumulative Gain formulation, ordinal position decay weights ($1/\log_2(r+1)$), and stance polarity coefficients ($S \in \{+1.0, +0.5, -0.5\}$). | `4.0 / 6.0 Weighted Visibility Index`: DCG decay table + competitor score benchmark. |
| **04** | **Power-Law Leaderboard & Moats** | Slide 11: *"Megaphone & Sparro capture 60%–70% of mentions"* | Empirical frequency counts across all $N$ cells, competitor rank distributions, and Pareto concentration curves. | `8.0 National Leaderboard`: Full cohort rank, mention count, SoMV, WVI, and moat analysis. |
| **05** | **Interstate Zero & Local Strongholds** | Slide 6 & 20: *"Client scores 0.0% in interstate capital cities"* | 8-Market Scorecard table showing $n/M_d$ counts, $p$-values, and non-overlapping regional confidence bounds. | `9.0 Geographic Scorecard`: Complete market-by-market scorecard table. |
| **06** | **Engine Retrieval Disconnect** | Slide 14: *"Google AI Mode cites client; Claude & ChatGPT omit"* | Platform retrieval bias matrix comparing grounded RAG engines vs directory-dependent parametric LLMs. | `11.0 Engine Retrieval Bias`: Architecture comparison + citation source decomposition. |
| **07** | **Workstream 01: Directory Citation Moat** | Slide 22 & 23: *"Verified B2B portals drive 74%–78% of citations"* | Upstream Citation Topology table detailing total source distribution across B2B Portals, Google Maps, Partner Ecosystems, and Media. | `8.0 / 15.0 Upstream Citation Ledger`: Numerical citation counts and percentage share proving 74%–78%. |
| **08** | **Workstream 02: Review Count & Map Pack Deficit** | Slide 22 & 24: *"Client has 12/18 reviews vs Megaphone 184; Maps OR = 4.89×–5.21×"* | Google Places API review & rating audit table plus Multivariate Logit Regression parameter estimates and Odds Ratios ($e^{\beta}$). | `13.0 Regression Results & Review Audit`: Review benchmark table (Client vs Leaders) + logit $\beta$ & $OR$. |
| **09** | **Workstream 03: Crawl Ingestion Bottleneck** | Slide 22 & 25: *"Client site was crawled, but lacks structured outcome figures"* | Live Search Grounding Telemetry Log citing exact query strings, response latency (ms), Vertex AI / SERP URLs, and extraction failure root cause. | `6.0 Empirical Grounding & Web Crawl Log`: Table of exact crawl events with queries, latencies, and root cause. |
| **10** | **Workstream 04: Schema & Entity Graph Gaps** | Slide 22 & 26: *"Founder authority detached; client success pages lack CaseStudy schema"* | Live On-Page JSON-LD Schema Extraction snippet, missing RDF triple audit, and target production Schema.org specification. | `7.0 / 16.0 Knowledge Graph & Schema Audit`: Discovered schema code + missing triple defect table. |
| **11** | **Workstream 05: Longitudinal Drift & Re-Audit** | Slide 22 & 27: *"Bi-weekly algorithmic drift; monthly automated testing panel"* | PostgreSQL / DuckDB DDL schema, multi-epoch cron resampling protocol, and Wilcoxon Signed-Rank hypothesis test ($p < 0.05$). | `9.0 / 21.0 Longitudinal Telemetry & DDL`: DDL tables + Wilcoxon signed-rank formula & cron protocol. |
| **12** | **12-Month Commercial Projections** | Slide 28: *"Path from baseline to 85% #1 recommended agency"* | 12-month econometric transition model, milestone bounds, and required covariate deltas ($\Delta X$). | `20.0 Predictive Trajectory Modeling`: Milestone table with SoMV targets and covariate transition roadmap. |

---

## 4. Keyed Access & Security Gateway

### 4.1 Minimalist White Gatekeeper Design
The entry barrier must match the clean, simple white aesthetic:
- **Title:** `Private page`
- **Subtitle:** `This page is shared privately by Uprise Digital. Enter the access code you were sent.`
- **Form:** Clean `Access code` input field + dark `Continue` button.
- **Footer:** `Uprise Digital · Confidential`.
- **Zero Role Disclosures:** Never mention "Client vs Internal PIN" on the public login UI.

### 4.2 Server-Side Access Control Logic
- **Client Code (`CLIENT_PIN`, default `2026`):**
  - Unlocks Tier 1 Executive Presentation (`/`).
  - Requesting `/technical` returns **403 Forbidden** with a clean message: *"This section is restricted to internal team members."*
- **Internal Code (`INTERNAL_PIN`, default `9418`):**
  - Unlocks both Tier 1 Presentation and Tier 2 Technical Dossier (`/technical`).
  - Injects a discrete floating `Technical Dossier →` switcher button when viewing the client deck.
- **Session Cookie:** Signed HMAC token (`pulp_auth`) with `HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000` (30 days).

---

## 5. New Client Onboarding Runbook (New Chat Protocol)

When starting a fresh chat to audit a brand-new company, follow this sequential 7-step runbook:

### Step 1: Collect Client Profile Parameters
Gather the following inputs from the intake questionnaire:
```json
{
  "clientName": "Acme Digital",
  "clientDomain": "acmedigital.com.au",
  "homeCity": "sydney",
  "categoryName": "Performance Growth Marketing Agency",
  "primaryAccent": "#2563EB",
  "darkBg": "#0B0F17",
  "paperBg": "#F8FAFC",
  "competitors": [
    { "name": "Megaphone Marketing", "domain": "megaphonemarketing.com.au" },
    { "name": "Sparro", "domain": "sparro.com.au" },
    { "name": "Impressive", "domain": "impressive.com.au" }
  ]
}
```

### Step 2: Establish the 7 Commercial Buying Intent Prompts
Adapt the standardized prompt battery to the client's industry:
1. `general`: *"Best [service category] in [city] for high-growth brands"*
2. `meta`: *"Top Meta / Facebook Ads agency in [city] with proven case studies"*
3. `google`: *"Best Google Ads and Performance Max agency for [niche] in [city]"*
4. `scaling`: *"Which agencies specialize in scaling brands from $1M to $10M in [country]?"*
5. `creative`: *"Top performance creative and UGC advertising agency in [city]"*
6. `platform`: *"Leading [platform, e.g. Shopify / TikTok / B2B] performance agency in [city]"*
7. `retention`: *"Best paid media agency offering full-funnel CRO and retention strategy"*

### Step 3: Configure Environment Variables (Unified DataForSEO Pipeline)
A single DataForSEO API credential powers live querying across ChatGPT, Perplexity, Google AI Mode, and Google Local 3-Pack SERPs. Direct Gemini or Anthropic keys can be added for native SDK redundancy:

```bash
# Primary Unified AI Engine Gateway (Powers ChatGPT, Perplexity, AI Mode, SERPs)
DATAFORSEO_AUTH="your-login:your-password-base64"

# Optional Direct Native SDK Keys (for Vertex / Claude direct calls)
GEMINI_API_KEY="your-gemini-key"
ANTHROPIC_API_KEY="your-anthropic-key"

# Access Gateway & Session Security
CLIENT_PIN="2026"
INTERNAL_PIN="9418"
SESSION_SECRET="your-secure-salt"
```

### Step 4: Run Live Ingestion via DataForSEO AI Gateway
Execute data collection across all 5 engines using the unified DataForSEO AI Optimization pipeline:

```bash
node run_comprehensive_research.mjs
```

#### Production DataForSEO AI API Integration Logic:
```javascript
// Example: Live ChatGPT & Perplexity Ingestion via DataForSEO
async function queryAiModel(platform, prompt, location = 'Melbourne,Victoria,Australia') {
  const auth = 'Basic ' + process.env.DATAFORSEO_AUTH;
  const endpoint = platform === 'perplexity' 
    ? 'https://api.dataforseo.com/v3/ai_optimization/perplexity/llm_responses/live'
    : 'https://api.dataforseo.com/v3/ai_optimization/chat_gpt/llm_responses/live';

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Authorization': auth, 'Content-Type': 'application/json' },
    body: JSON.stringify([{
      prompt: prompt,
      location_name: location,
      language_name: 'English'
    }])
  });

  const json = await res.json();
  const task = json.tasks?.[0]?.result?.[0];
  return {
    raw_response: task?.items?.[0]?.description || task?.text || '',
    sources: task?.items?.[0]?.sources || [],
    latency_ms: task?.time_to_first_token_ms || 1200
  };
}
```

- Ingestion checks `.env` for `DATAFORSEO_AUTH`.
- Fires live search-grounded API calls across $M$ markets $\times$ $Q$ prompts $\times$ $E=5$ authenticated engines (ChatGPT, Perplexity, AI Mode, Gemini, Claude).
- Stores immutable JSON responses in `pipeline/raw/`.
- Resolves entity aliases via canonical mapping.

### Step 5: Calculate Dynamic Metrics
Compile normalized statistics:
```bash
node pipeline/metrics.mjs
```
- Automatically extracts `activePlatforms = [...new Set(ans.map(a => a.platform))]`.
- Calculates SoMV, WVI, rank distributions, and matrix heatmaps.
- Emits `metrics.json`.

### Step 6: Compile Dual-Deck HTML Deliverables
Compile Tier 1 and Tier 2 HTML presentations:
```bash
node pipeline/build.mjs
node pipeline/build_technical.mjs
cp pipeline/out/*.html site/
```
- Generates `site/index.html` (Tier 1 pitch deck with dynamic scaling and zero leaks).
- Generates `site/technical.html` (Tier 2 mathematical dossier).

### Step 7: Repository Isolation, Verification & Multi-Service Railway Deployment

1. **Dedicated GitHub Repository Creation (MANDATORY):**
   - Every client engagement MUST have its OWN isolated directory and dedicated GitHub repository:
   ```bash
   cd <client-slug>-ai-visibility
   git init
   git branch -M master
   git add .
   git commit -m "feat: initial commit for <Client Name> GEO audit"
   gh repo create seyone22/<client-slug>-ai-visibility --public --source=. --remote=origin --push
   ```
   - **CRITICAL:** NEVER merge client codebases or commit one client's audit into another client's repository!

2. **Automated QA, Leak & DOM Verification:**
   - Execute verification suite:
   ```bash
   node test_verification.js
   ```
   - Verify unauthenticated visitor receives only the clean white "Private page".
   - Verify Client PIN (`2026`) cannot access `/technical` (returns 403 Forbidden).
   - Verify Internal PIN (`9418`) accesses `/technical` (returns 200 OK).
   - Verify zero occurrences of proprietary directory checklists on `index.html`.
   - Verify `#stage`, `#bar`, `#count`, and `#controls` DOM elements are present in compiled HTML to prevent black-screen rendering bugs.

3. **Railway Multi-Service Deployment (Same Project, Dedicated Deploy):**
   - You can reuse the existing Railway organization/project (e.g. `pulp-ai-visibility` or agency project).
   - **MANDATORY:** Add a **new, dedicated service** for the client—NEVER overwrite an existing client service!
   ```bash
   # Link to project
   railway link -p <project-id> -e <environment-id>

   # Add dedicated service for this client linked to their own GitHub repo
   railway add --service <client-slug>-ai-visibility --repo seyone22/<client-slug>-ai-visibility --branch master

   # Generate dedicated service public domain
   railway domain --service <client-slug>-ai-visibility

   # Deploy code to dedicated service
   cd site && railway up -s <client-slug>-ai-visibility -d -y
   ```
   - Confirm via `railway service list` that both services remain online on separate URLs.

---

## 6. Pre-Flight Quality Assurance Checklist

Before sending any deliverable to an executive or client prospect, verify every item:

- [ ] **Isolated GitHub Repository:** Client audit has its own separate GitHub repo (`seyone22/<client-slug>-ai-visibility`); zero code merged into other client repos.
- [ ] **Dedicated Railway Service & Domain:** Deployed as a distinct service on Railway with its own URL (`<client-slug>-ai-visibility-production.up.railway.app`); never overwriting another client's service.
- [ ] **DOM Architecture Integrity:** `#stage`, `#bar`, `#count`, and `#controls` elements are present to ensure `deck.js` mounts without black screen regression.
- [ ] **Zero API Keys in Git:** All secrets stored in `.env`; `.gitignore` includes `.env`, `test_*.js`, and `*.log`.
- [ ] **Zero Hallucination:** Dataset contains only live authenticated queries; no fake/simulated proxy rows.
- [ ] **Dynamic Denominators:** Sample size formula $N = M \times Q \times E$ matches actual ingested records.
- [ ] **1:1 Claim-to-Proof Standard (MANDATORY):** Every factual claim in Tier 1 (reviews, citations %, crawl telemetry, schema deficits, logit odds, 12-month projections) has an attached empirical table, derivation, or extract in Tier 2 (`/technical`).
- [ ] **Slide 23 Strategic Restraint:** No specific directory checklists on Slide 23; categorized into authority tiers.
- [ ] **No Public Dossier Link:** Client HTML has zero anchor tags linking to `technical.html`.
- [ ] **Clean White Gatekeeper:** Gatekeeper uses pure white minimalist UI matching agency confidential standard.
- [ ] **Separate PIN Verification:** Client PIN cannot access `/technical`; Internal PIN unlocks both views.
- [ ] **Cross-Device Fluidity:** 16:9 stage scaling (`--k`) operates smoothly across desktop, laptop, and mobile.
