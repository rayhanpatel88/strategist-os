# StrategistOS — AI Leverage Command Centre

## Overview
A premium full-stack dark-mode SaaS web application built for Rayhan Patel (MSc Data Science, AI strategist). Operates as a strategic intelligence command centre with 7 core feature modules backed by AI.

## Architecture

### Monorepo structure (pnpm workspaces)
- `artifacts/strategist-os` — React + Vite frontend (port via `PORT` env var)
- `artifacts/api-server` — Express 5 + Drizzle ORM backend (port 8080, paths: `/api`)
- `lib/api-spec` — OpenAPI spec + Orval codegen config
- `lib/api-client-react` — Generated TanStack Query hooks
- `lib/api-zod` — Generated Zod validation schemas
- `lib/db` — Drizzle ORM schema + PostgreSQL client

### Tech stack
- **Frontend**: React 18, Vite, wouter, TanStack Query, shadcn/ui, recharts, framer-motion, Tailwind v4
- **Backend**: Express 5, Drizzle ORM, node-postgres, pino logging
- **Auth**: Clerk (Replit-managed) — `@clerk/react` on frontend, `@clerk/express` on server
- **Database**: PostgreSQL (Replit-provisioned, via `DATABASE_URL`)
- **AI**: Mock AI with fallback to Anthropic Claude (`ANTHROPIC_API_KEY`) or OpenAI GPT-4o (`OPENAI_API_KEY`)

## Authentication (Clerk)
- Replit-managed Clerk tenant provisioned via `setupClerkWhitelabelAuth()`
- `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` auto-set as secrets
- Server: `clerkMiddleware` + `clerkProxyMiddleware` in `app.ts`; `requireAuth` in `routes/index.ts` (protects all routes except `/api/healthz`)
- Client: `ClerkProvider` wraps the entire app in `App.tsx`; `useAuth` guards every app route
- Routes: `/` = landing/redirect, `/sign-in/*?` = Clerk SignIn, `/sign-up/*?` = Clerk SignUp, `/dashboard` = Command Centre (protected)
- Custom dark appearance: Space Grotesk font, emerald `#72fe88` primary, `#1e1f23` card bg
- Proxy path: `/api/__clerk` (production-only; dev uses standard Clerk CDN)

## Feature Modules

| Route | Module | Description |
|-------|---------|-------------|
| `/` | Landing / redirect | Public landing page; auto-redirects signed-in users to `/dashboard` |
| `/dashboard` | Command Centre | Dashboard with session stats, quick actions, recent sessions |
| `/diagnosis` | Strategic Diagnosis Engine | 7-field form → AI leverage analysis + ROI actions |
| `/scorecard` | Optimisation Scorecard | 8-dimension scoring with RadarChart visualisation |
| `/prompts` | Prompt Arsenal | 9-category prompt generator + save/manage library |
| `/opportunity` | Opportunity Stack Builder | Skills → positioning angle + 30-day roadmap |
| `/workflows` | AI Agent Workflow Designer | 8 pre-seeded templates + custom workflow creation |
| `/planner` | Elite Execution Planner | Goal → 7-day sprint + 30-day roadmap + success metrics |
| `/portfolio` | Public Portfolio Mode | Pre-populated showcase for Rayhan Patel |

## Database Tables
- `sessions` — strategy sessions with diagnosis results and leverage scores
- `saved_prompts` — saved prompt arsenal entries
- `saved_plans` — saved execution plans (JSON)
- `workflows` — custom and template AI workflows
- `portfolio` — single-row portfolio configuration

## API Routes (all under `/api`)
- `GET/POST /sessions`, `GET/DELETE /sessions/:id`, `GET /sessions/summary`
- `POST /diagnosis` — runs AI strategic diagnosis
- `POST /scorecard` — runs 8-dimension scorecard
- `POST /prompts/generate`, `GET/POST /prompts/saved`, `DELETE /prompts/saved/:id`
- `POST /opportunity` — builds opportunity stack
- `GET/POST /workflows`, `GET /workflows/templates`, `DELETE /workflows/:id`
- `POST /planner`, `GET/POST /planner/saved`
- `GET/PUT /portfolio`

## Key Files
- `artifacts/strategist-os/src/App.tsx` — router, Clerk auth, sidebar layout, ThemeProvider
- `artifacts/strategist-os/src/pages/landing.tsx` — public landing page
- `artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts` — Clerk proxy (prod only)
- `artifacts/api-server/src/middlewares/requireAuth.ts` — `getAuth` middleware for protected routes
- `artifacts/strategist-os/src/index.css` — dark theme (midnight navy palette, Inter font)
- `artifacts/api-server/src/lib/mock-ai.ts` — AI caller with rich mock fallbacks
- `artifacts/api-server/src/lib/ai-prompts.ts` — prompt builders for each module
- `lib/db/src/schema/` — individual schema files per table

## Codegen
After editing `lib/api-spec/openapi.yaml`, run:
```
pnpm --filter @workspace/api-spec run codegen
```
Then manually ensure `lib/api-zod/src/index.ts` only exports `./generated/api`.

## AI Integration
- Checks `ANTHROPIC_API_KEY` first, then `OPENAI_API_KEY`
- Falls back to richly detailed mock responses for every module
- All prompts are in `artifacts/api-server/src/lib/ai-prompts.ts`

## Design — Intelligence Dark Mode
- Dark mode forced via ThemeProvider (`defaultTheme="dark"`)
- **Palette**: `#121317` background, `#1e1f23` surface-container, `#0d0e12` surface-lowest
- **Accents**: `#ffffff` primary, `#72fe88` emerald (success/high), `#4b8eff` blue-accent (secondary), `#ffb4ab` error
- **Typography**: Inter (body), Space Grotesk (data values, monospace, navigation labels)
- **Shape language**: 0px radius everywhere — all edges are sharp
- **Label caps**: 11px, uppercase, `letter-spacing: 0.1em` for all labels
- **Borders**: `rgba(255,255,255,0.07)` hairline borders — no shadows, depth via tonal layers
- **Inputs**: Bottom-border only (`border-bottom: 1px solid rgba(255,255,255,0.12)`), no box
- **Sidebar**: `#0d0e12` bg, active nav = `border-left: 2px solid #ffffff` + `bg-white/5`
- **Nav labels**: `COMMAND_CENTRE`, `DIAGNOSIS`, `ARSENAL`, `OPPORTUNITIES`, `SCORECARD`, `WORKFLOWS`, `PLANNER`, `PORTFOLIO`
- **Icons**: Google Material Symbols Outlined (loaded via CDN in `index.html`)
- No emojis anywhere in the UI
