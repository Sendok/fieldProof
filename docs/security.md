# Security

## Authentication

- Passwords are hashed with Argon2id and never logged.
- Credentials are verified by FieldProof, then an opaque Auth.js-compatible database session is issued in a secure HTTP-only, same-site cookie.
- Database lookup occurs on every authenticated request, so revoking a session takes effect immediately.
- Email verification, password reset, and invitation links use random 256-bit tokens. Only SHA-256 hashes are stored.
- Login, registration, and reset requests are rate limited through Redis.

## Tenant isolation

Tenant context is resolved only from the authenticated database session and its `active_organization_id`. The membership and organization must both remain active. Resource repositories add an organization predicate to business queries; caller-provided organization identifiers never establish tenant scope.

## Authorization

Role permissions are enforced in server actions and services. UI visibility is only a convenience and is not treated as an authorization boundary. Membership changes and invitation lifecycle events create append-only audit records.

## Session operations

Users can inspect active sessions, revoke an individual session without exposing its secret token, or revoke every session. Session metadata contains only the user agent, IP address when available, and timestamps.

Production must use HTTPS, a generated `AUTH_SECRET`, production database credentials, private network access for PostgreSQL and Redis, and external secret management.
