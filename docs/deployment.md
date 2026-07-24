# Deployment baseline

Production deployment is Docker-based and VPS-compatible. The baseline stack is `web`, `worker`, PostgreSQL, Redis, Caddy, and external S3-compatible storage.

## Required controls

1. Replace all development credentials with generated secrets.
2. Terminate HTTPS at Caddy and configure the public domain through `DOMAIN`.
3. Keep PostgreSQL and Redis off public interfaces.
4. Configure automated PostgreSQL backups and regularly test restoration.
5. Configure private object storage, lifecycle policies, and signed access only.
6. Run migrations as a controlled release step before starting the new web process.
7. Monitor `/api/health`, `/api/ready`, worker failures, disk usage, and backup recency.
8. Apply container log rotation and host security updates.

The full Ubuntu runbook, rollback process, and zero-downtime migration policy are completed during Phase 8.
