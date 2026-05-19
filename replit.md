# Aegis Health

A personal AI health companion that helps users understand diseases, check symptoms, calculate BMI, and chat with an AI health consultant.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/health-guide run dev` — run the frontend (port 25393)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI via Replit AI Integrations

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (conversations, messages tables)
- AI: OpenAI GPT-5.4 via Replit AI Integrations proxy
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + Tailwind + shadcn/ui + framer-motion + wouter

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for API contracts
- `lib/db/src/schema/` — Drizzle schema (conversations.ts, messages.ts)
- `artifacts/api-server/src/routes/` — Express route handlers
  - `diseases.ts` — disease analysis + popular diseases
  - `symptoms.ts` — symptom checker
  - `bmi.ts` — BMI calculator
  - `openai/index.ts` — AI chat (SSE streaming)
- `artifacts/health-guide/src/` — React frontend
- `lib/integrations-openai-ai-server/` — OpenAI SDK server wrapper

## Architecture decisions

- Contract-first OpenAPI spec gates codegen for both Zod validators (server) and React Query hooks (frontend)
- AI disease analysis uses GPT-5.4 with structured JSON output for consistent schema validation
- SSE streaming for chat responses — Orval can't generate typed hooks for SSE, consumed with raw fetch
- Body limit set to 50MB on Express to support medical image uploads (base64 encoded)
- Conversations stored in PostgreSQL for chat history persistence

## Product

Users can search any disease or upload a photo to get an AI-powered health guide covering: overview, causes, symptoms, food guide, medicines, treatment methods, and early detection. Built-in tools: symptom checker (multi-symptom input → possible conditions with urgency levels), BMI calculator (weight/height → category, personalized diet/exercise tips), and an AI chat consultant on every disease detail page.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After each OpenAPI spec change, re-run codegen before using updated types
- Body schema names in OpenAPI must NOT match Orval's auto-derived names (`<OperationIdPascal>Body`) — use entity-shaped names instead
- The AI integration libs (`integrations-openai-ai-server`, `integrations-openai-ai-react`) need `@types/node` and `@types/react` in their devDependencies respectively

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `ai-integrations-openai` skill for OpenAI integration setup
