# Background jobs

The dedicated worker consumes the `fieldproof` BullMQ queue.

- `recurring-work-order` creates the next scheduled instance and copies assignments. It verifies the source schedule is still current before writing.
- `notification-email` sends an SMTP email when the recipient preference permits it. The notification row remains the durable in-app record.
- `work-order-due-reminders` scans hourly for active work orders due within 24 hours. Existing resource/recipient reminders are checked before insertion.

Jobs use exponential retry and deterministic IDs where idempotency matters. If web-side enqueueing is temporarily unavailable, the application logs the failure without rolling back the already-committed work order or notification.
