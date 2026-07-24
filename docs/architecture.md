# Architecture

## Shape

FieldProof is a modular monolith. A single Next.js application owns public pages, authenticated web interfaces, server actions, and HTTP route handlers. A separately scalable Node.js worker consumes BullMQ jobs. Both share domain modules and infrastructure adapters.

This shape keeps transactions and tenant-bound business rules in one deployable codebase while allowing expensive asynchronous work—PDF generation, email, recurrence, and storage accounting—to scale independently.

## Boundaries

```text
Browser / PWA
      |
Next.js web runtime
      |
Domain services -> repositories -> PostgreSQL
      |                    |
      +-> BullMQ/Redis      +-> audit events
             |
       Worker runtime -> S3 / SMTP / PDF renderer
```

- React components render UI and collect intent; they do not own business rules.
- Route handlers and server actions validate input, establish the authenticated tenant context, then call domain services.
- Domain services enforce permissions, state transitions, idempotency, and transactions.
- Repositories are the only business-data access layer and always require verified organization scope.
- Infrastructure adapters isolate storage, queue, email, authentication, and observability providers.

## Tenant isolation

The active organization will be derived from an authenticated database-backed session and verified membership. Client-provided organization identifiers are never trusted. Repository APIs require a tenant context, and cross-tenant integration tests are a release gate beginning in Phase 1.

Phase 1 implements that contract: the opaque session record stores the active organization, tenant resolution rechecks active membership and organization status, and repository predicates bind requested resources to that verified organization.

## Runtime services

- `app`: Next.js web runtime
- `worker`: BullMQ background processor
- `postgres`: authoritative relational store; UTC timestamps and UUID keys
- `redis`: queue and short-lived coordination data
- `minio`: private S3-compatible local object storage
- `mailpit`: local SMTP capture

## Reliability baseline

The application exposes dependency-free liveness at `/api/health` and dependency-aware readiness at `/api/ready`. JSON logs are timestamped and worker shutdown is graceful. Container images use separate development, build, web, and worker stages.
