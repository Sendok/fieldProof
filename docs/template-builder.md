# Template Builder and versioning

Phase 3 adds organization-scoped checklist templates. A template has editable metadata and a `draft_schema` JSON document validated by Zod. Section and field IDs are stable so responses can continue to reference the same logical question after fields are reordered.

## Builder

- Sections and fields can be reordered with drag and drop.
- Fields can move between sections, be duplicated, or removed.
- The palette includes all 17 supported field types, including photo, signature, GPS, and barcode/QR evidence.
- Draft saves use `row_version` optimistic locking to reject stale writes.
- Mobile-worker and report previews use the same schema renderer contract.

## Publishing

Publishing validates the complete draft and inserts a new row in `checklist_template_versions`. The `(template_id, version)` unique constraint prevents duplicate version numbers. Published snapshots are read-only in the service layer; future changes remain in `draft_schema` and the next publish creates a new version. Work orders introduced in Phase 4 must reference a version row, never the mutable draft.

Every create, save, publish, duplicate, and archive flow is organization-scoped. Publishing and lifecycle actions append audit events.

## Built-in templates

Every newly created organization receives five published, organization-owned starter templates: Cleaning Service Daily Checklist, Property Inspection, Maintenance Visit, Contractor Daily Progress, and Sales Visit Report. The development seed applies the same set idempotently. They can be duplicated before customization.
