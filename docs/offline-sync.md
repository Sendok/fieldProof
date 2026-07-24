# Offline-lite execution and synchronization

The mobile execution page treats PostgreSQL as the durable source of truth and IndexedDB as a recoverable device-local working copy.

## Local stores

- `drafts` stores answers, optional location, the server version last observed, and `DIRTY`, `SYNCED`, or `CONFLICT` state.
- `evidenceQueue` stores client-generated evidence IDs, upload metadata, and the image Blob required for retry.

The application shell and worker task pages that have been opened are cached by the service worker. Administrative pages are not intentionally cached for offline operation. Logging out clears private service-worker caches and warns when IndexedDB still contains unsynchronized work.

## Synchronization order

1. Save the draft with its expected server version.
2. Request a private presigned upload URL for each queued evidence file.
3. Upload directly to S3-compatible storage.
4. Ask the server to verify object size/type and mark metadata ready.
5. Submit only after server-side checklist and evidence validation succeeds.

Uploads and drafts use client-generated UUIDs, making retries idempotent. A stale draft version, reassignment, cancellation, approval, or completion returns a recoverable conflict. The local copy is retained and is never silently overwritten.
