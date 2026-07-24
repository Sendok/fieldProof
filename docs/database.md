# Database

Phase 1 introduces authentication and tenancy tables through Drizzle migrations:

- `users`, `auth_accounts`, `sessions`, `verification_tokens`, `password_reset_tokens`
- `organizations`, `organization_settings`, `memberships`, `invitations`
- append-only `audit_logs`

Phase 2 adds `clients`, `sites`, `teams`, `team_members`, and `client_reviewers`. Client and site codes use organization-scoped unique indexes; all primary list queries use organization-first compound indexes.

Phase 3 adds `checklist_templates` for mutable working drafts and `checklist_template_versions` for immutable published snapshots. Version numbers are unique per template, and both tables carry `organization_id` for tenant-first queries.

Phase 4 adds `work_orders`, `work_order_assignments`, `work_order_status_history`, `work_order_attachments`, `notifications`, and `notification_preferences`. Work-order numbers are unique per organization. Recurring occurrences have a compound unique index that serves as the final idempotency boundary.

Phase 5 adds `work_order_drafts`, `evidence_files`, `signatures`, `submissions`, and append-only `submission_revisions`. Drafts are unique per work-order member and use optimistic versions. Submission revision numbers are unique per submission.

Identifiers use UUIDs, timestamps are timezone-aware UTC values, and membership uniqueness is enforced per organization/user pair. Session records reference their active organization, while server code revalidates an active membership before creating tenant context.

Run migrations with `pnpm db:migrate`. The development seed is idempotent and disabled in production.
