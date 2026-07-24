# Work order state machine

Work order status changes are domain operations, not generic database updates. `src/modules/work-orders/state-machine.ts` is the authoritative transition graph, and `transitionWorkOrderStatus` records both `work_order_status_history` and an audit event in the same transaction.

```text
DRAFT ──> SCHEDULED ──> ASSIGNED ──> IN_PROGRESS ──> SUBMITTED
  │            │            │                              │
  └────────────┴────────────┴──> CANCELLED                 v
                                                     UNDER_REVIEW
                                                      /          \
                                      REVISION_REQUIRED          APPROVED
                                               │                     │
                                               └──> IN_PROGRESS      v
                                                                 COMPLETED
```

Planning edits are allowed only in `DRAFT`, `SCHEDULED`, and `ASSIGNED`. Assignment takes precedence over scheduling when deriving planning status. Cancellation requires a reason. `COMPLETED` and `CANCELLED` are terminal.

Every work order references a specific immutable checklist template version. Tenant-scoped reference validation verifies the client, site, template version, team, supervisor, and assignees before writes.

## Recurrence

`DAILY`, `WEEKLY`, and `MONTHLY` rules create the next work-order instance through BullMQ. Job IDs include the recurrence series and occurrence timestamp. PostgreSQL additionally enforces uniqueness on organization, recurrence series, and occurrence time. Retries therefore cannot create a duplicate. Monthly dates clamp to the last valid day of shorter months.
