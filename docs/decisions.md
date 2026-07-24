# Technical decisions

## ADR-001 — Modular monolith

**Status:** Accepted  
**Decision:** Use one Next.js codebase plus a dedicated worker process.  
**Reason:** The MVP needs strong transactional consistency and a broad domain surface, but does not benefit from network boundaries or independent microservice ownership.

## ADR-002 — Node.js 22 LTS in containers

**Status:** Accepted  
**Decision:** Pin container runtimes to Node.js 22 LTS.  
**Reason:** Production uses an LTS line even if a developer has a newer local runtime.

## ADR-003 — Tailwind CSS v4 tokens

**Status:** Accepted  
**Decision:** Express the Coral & Cream design system as CSS custom properties surfaced through Tailwind theme tokens.  
**Reason:** This preserves brand consistency, enables accessible state colors, and avoids scattering raw color values through components.

## ADR-004 — Separate liveness and readiness

**Status:** Accepted  
**Decision:** `/api/health` checks the web process only; `/api/ready` checks PostgreSQL and Redis.  
**Reason:** Orchestrators should distinguish a dead process from a temporarily unavailable dependency.

## ADR-005 — Sites starter not used

**Status:** Accepted  
**Decision:** Retain the user-mandated Next.js architecture instead of replacing it with a hosting-specific starter.  
**Reason:** The product requires Auth.js, PostgreSQL, Redis/BullMQ, S3-compatible uploads, Docker, and a dedicated worker. Changing the application runtime would violate the approved architecture.
