# Permissions

All authorization is enforced server-side after resolving an authenticated session and verified active membership.

| Capability | Owner | Admin | Supervisor | Field worker | Client reviewer | Auditor |
|---|---:|---:|---:|---:|---:|---:|
| Organization settings | Yes | No | No | No | No | No |
| Membership management | Yes | Yes | No | No | No | No |
| Client/site/template management | Yes | Yes | No | No | No | No |
| Work order management | Yes | Yes | Yes | No | No | No |
| Execute assigned work | Yes | No | Yes | Yes | No | No |
| Review submissions | Yes | No | Yes | No | No | No |
| Read shared reports | Yes | Yes | Yes | No | Yes | Yes |
| Read audit trail | Yes | No | No | No | No | Yes |
| Subscription management | Yes | No | No | No | No | No |

Client reviewers and field workers require additional resource scoping beyond role permission. Those scopes are introduced with their owning work-order and client modules.
