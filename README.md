# FieldProof

FieldProof is a multi-tenant field operations evidence and verification platform. It connects structured work orders, mobile checklists, contextual evidence, approval workflows, client-ready reports, and append-only audit trails.

The repository is being implemented in gated phases. Phase 0 establishes the production-shaped foundation without introducing mock production flows.

## Architecture

- Next.js App Router, React, strict TypeScript, and Tailwind CSS
- Modular monolith organized by business domain
- PostgreSQL with Drizzle ORM
- Redis and BullMQ for background processing
- S3-compatible private object storage; MinIO locally
- SMTP email adapter; Mailpit locally
- Separate web and worker runtime targets

See [Architecture](docs/architecture.md) and [Technical decisions](docs/decisions.md).

For application URLs, development accounts, role access, and end-to-end operating flows, see the [user and access guide](docs/user-guide.md).

## Requirements

- Node.js 22 LTS
- pnpm 11 via Corepack
- Docker with Docker Compose for local infrastructure

## Quick start with Docker

```bash
cp .env.example .env
docker compose up --build
```

Open:

- Application: http://localhost:3000
- Liveness: http://localhost:3000/api/health
- Readiness: http://localhost:3000/api/ready
- Mailpit: http://localhost:8025
- MinIO console: http://localhost:9001

The values in `docker-compose.yml` are development-only credentials.

## Local development

```bash
corepack enable
pnpm install
cp .env.example .env
docker compose up -d postgres redis minio minio-init mailpit
pnpm dev
```

Run the worker in another terminal:

```bash
pnpm worker:dev
```

## Database

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

Phase 1 migrations include authentication, organizations, memberships, invitations, sessions, reset/verification tokens, and audit logs. The idempotent development seed password is `FieldProofDev123!` for all documented `@fieldproof.local` accounts; it is disabled in production.

Phase 2 extends the seed with Hotel Coral Bay, its main site, and a sample operations team. See [Master data](docs/master-data.md) for tenant and archive rules.

Phase 3 adds the drag-and-drop checklist builder, immutable published versions, previews, and five seeded starter templates. See [Template Builder](docs/template-builder.md).

Phase 4 adds work-order planning, assignment, list/calendar/Kanban views, printable pages, CSV export, recurring generation, and in-app/email notifications. See the [work-order state machine](docs/work-order-state-machine.md) and [background jobs](docs/background-jobs.md).

Phase 5 adds mobile worker execution, IndexedDB recovery, private direct-to-storage evidence uploads, signatures, and immutable submission revisions. See [offline synchronization](docs/offline-sync.md) and [file storage](docs/file-storage.md).

The public Coral & Cream marketing website includes product, features, industry, pricing, interactive demo, and request-demo routes with complete SEO metadata. See [Marketing website](docs/marketing-website.md).

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Run all phase gates with `pnpm check`.

## Production

`Dockerfile` contains independent `web` and `worker` targets. `compose.production.yml` provides a VPS-oriented baseline with Caddy, PostgreSQL, Redis, persistent volumes, restart policies, and HTTPS. Use external S3-compatible storage in production; never store evidence in the application container.

Before deployment, create `.env.production`, replace every development secret, configure database backups and storage lifecycle rules, then follow `docs/deployment.md` as it is expanded in Phase 8.

## Troubleshooting

- `api/health` succeeds but `api/ready` returns 503: PostgreSQL or Redis is unavailable or the connection values are wrong.
- Native package install is blocked: use the committed `pnpm-workspace.yaml` and run `pnpm install` again.
- MinIO bucket is missing: run `docker compose up minio minio-init` and confirm the init container exits successfully.
