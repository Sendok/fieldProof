# Private evidence storage

Evidence bytes are uploaded directly to S3-compatible private storage with a 15-minute signed PUT URL. PostgreSQL stores ownership, random storage key, original filename, MIME type, byte size, dimensions, SHA-256 checksum, category, caption, optional GPS, uploader, and timestamps.

- Allowed MVP image types: JPEG, PNG, and WebP.
- Maximum file size: 15 MB.
- Maximum active evidence files: 20 per work order.
- Object keys use server-generated UUIDs and never use the original filename.
- Downloads use five-minute signed GET URLs after tenant/resource authorization.
- Evidence can be deleted only before submission.
- Signatures are PNG evidence with explicit consent metadata.

The metadata supports auditability but FieldProof does not describe photos as impossible to manipulate.
