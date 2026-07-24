import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const organizationRole = pgEnum("organization_role", [
  "OWNER",
  "ADMIN",
  "SUPERVISOR",
  "FIELD_WORKER",
  "CLIENT_REVIEWER",
  "AUDITOR",
]);

export const membershipStatus = pgEnum("membership_status", ["ACTIVE", "SUSPENDED"]);
export const invitationStatus = pgEnum("invitation_status", ["PENDING", "ACCEPTED", "CANCELLED", "EXPIRED"]);
export const organizationStatus = pgEnum("organization_status", ["ACTIVE", "SUSPENDED", "DELETION_PENDING"]);
export const recordStatus = pgEnum("record_status", ["ACTIVE", "INACTIVE"]);
export const templateStatus = pgEnum("template_status", ["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const workOrderStatus = pgEnum("work_order_status", ["DRAFT", "SCHEDULED", "ASSIGNED", "IN_PROGRESS", "SUBMITTED", "UNDER_REVIEW", "REVISION_REQUIRED", "APPROVED", "COMPLETED", "CANCELLED"]);
export const workOrderPriority = pgEnum("work_order_priority", ["LOW", "NORMAL", "HIGH", "URGENT"]);
export const recurrenceFrequency = pgEnum("recurrence_frequency", ["DAILY", "WEEKLY", "MONTHLY"]);
export const draftStatus = pgEnum("draft_status", ["ACTIVE", "CONFLICTED"]);
export const evidenceCategory = pgEnum("evidence_category", ["BEFORE", "DURING", "AFTER", "ISSUE", "DOCUMENT", "SIGNATURE", "OTHER"]);
export const evidenceUploadStatus = pgEnum("evidence_upload_status", ["PENDING", "READY", "FAILED"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    emailVerified: timestamp("email_verified", { withTimezone: true }),
    image: text("image"),
    passwordHash: text("password_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 180 }).notNull(),
    slug: varchar("slug", { length: 80 }).notNull(),
    status: organizationStatus("status").default("ACTIVE").notNull(),
    industry: varchar("industry", { length: 100 }),
    country: varchar("country", { length: 2 }).default("ID").notNull(),
    timezone: varchar("timezone", { length: 64 }).default("Asia/Jakarta").notNull(),
    locale: varchar("locale", { length: 10 }).default("id-ID").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("organizations_slug_unique").on(table.slug), index("organizations_status_idx").on(table.status)],
);

export const authAccounts = pgTable(
  "auth_accounts",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 32 }).notNull(),
    provider: varchar("provider", { length: 64 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [primaryKey({ columns: [table.provider, table.providerAccountId] })],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().notNull().unique(),
    sessionToken: varchar("session_token", { length: 255 }).primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
    activeOrganizationId: uuid("active_organization_id").references(() => organizations.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 64 }),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: varchar("identifier", { length: 320 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("password_reset_token_hash_unique").on(table.tokenHash)],
);

export const organizationSettings = pgTable("organization_settings", {
  organizationId: uuid("organization_id").primaryKey().references(() => organizations.id, { onDelete: "cascade" }),
  gpsEnabled: boolean("gps_enabled").default(false).notNull(),
  clientApprovalEnabled: boolean("client_approval_enabled").default(false).notNull(),
  dataRetentionDays: text("data_retention_days").default("365").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: organizationRole("role").notNull(),
    status: membershipStatus("status").default("ACTIVE").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("memberships_org_user_unique").on(table.organizationId, table.userId),
    index("memberships_user_status_idx").on(table.userId, table.status),
    index("memberships_org_role_idx").on(table.organizationId, table.role),
  ],
);

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 320 }).notNull(),
    role: organizationRole("role").notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    status: invitationStatus("status").default("PENDING").notNull(),
    invitedById: uuid("invited_by_id").notNull().references(() => users.id),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("invitations_token_hash_unique").on(table.tokenHash), index("invitations_org_status_idx").on(table.organizationId, table.status)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").references(() => organizations.id),
    actorId: uuid("actor_id").references(() => users.id),
    actorType: varchar("actor_type", { length: 32 }).default("USER").notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    resourceType: varchar("resource_type", { length: 100 }).notNull(),
    resourceId: varchar("resource_id", { length: 255 }),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: text("user_agent"),
    beforeSummary: jsonb("before_summary"),
    afterSummary: jsonb("after_summary"),
    metadata: jsonb("metadata").default({}).notNull(),
    correlationId: uuid("correlation_id").defaultRandom().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("audit_logs_org_created_idx").on(table.organizationId, table.createdAt)],
);

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 40 }).notNull(),
    name: varchar("name", { length: 180 }).notNull(),
    contactPerson: varchar("contact_person", { length: 160 }),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 40 }),
    billingAddress: text("billing_address"),
    notes: text("notes"),
    logoStorageKey: text("logo_storage_key"),
    status: recordStatus("status").default("ACTIVE").notNull(),
    createdById: uuid("created_by_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("clients_org_code_unique").on(table.organizationId, table.code),
    index("clients_org_status_name_idx").on(table.organizationId, table.status, table.name),
    index("clients_org_created_idx").on(table.organizationId, table.createdAt),
  ],
);

export const sites = pgTable(
  "sites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").notNull().references(() => clients.id),
    code: varchar("code", { length: 40 }).notNull(),
    name: varchar("name", { length: 180 }).notNull(),
    address: text("address").notNull(),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 100 }),
    country: varchar("country", { length: 2 }).default("ID").notNull(),
    postalCode: varchar("postal_code", { length: 20 }),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    contactPerson: varchar("contact_person", { length: 160 }),
    phone: varchar("phone", { length: 40 }),
    operatingHours: jsonb("operating_hours"),
    accessInstructions: text("access_instructions"),
    safetyNotes: text("safety_notes"),
    qrCode: uuid("qr_code").defaultRandom().notNull(),
    status: recordStatus("status").default("ACTIVE").notNull(),
    createdById: uuid("created_by_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("sites_org_code_unique").on(table.organizationId, table.code),
    uniqueIndex("sites_qr_code_unique").on(table.qrCode),
    index("sites_org_client_status_idx").on(table.organizationId, table.clientId, table.status),
    index("sites_org_name_idx").on(table.organizationId, table.name),
  ],
);

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    supervisorMembershipId: uuid("supervisor_membership_id").references(() => memberships.id),
    area: varchar("area", { length: 160 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("teams_org_name_unique").on(table.organizationId, table.name), index("teams_org_idx").on(table.organizationId)],
);

export const teamMembers = pgTable(
  "team_members",
  {
    teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
    membershipId: uuid("membership_id").notNull().references(() => memberships.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.teamId, table.membershipId] }), index("team_members_membership_idx").on(table.membershipId)],
);

export const clientReviewers = pgTable(
  "client_reviewers",
  {
    clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
    membershipId: uuid("membership_id").notNull().references(() => memberships.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.clientId, table.membershipId] })],
);

export const checklistTemplates = pgTable(
  "checklist_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 180 }).notNull(),
    description: text("description"),
    industry: varchar("industry", { length: 100 }),
    category: varchar("category", { length: 100 }),
    status: templateStatus("status").default("DRAFT").notNull(),
    currentVersion: integer("current_version").default(0).notNull(),
    rowVersion: integer("row_version").default(1).notNull(),
    estimatedMinutes: integer("estimated_minutes"),
    coverStorageKey: text("cover_storage_key"),
    isBuiltIn: boolean("is_built_in").default(false).notNull(),
    draftSchema: jsonb("draft_schema").notNull(),
    createdById: uuid("created_by_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    index("checklist_templates_org_status_name_idx").on(table.organizationId, table.status, table.name),
    index("checklist_templates_org_created_idx").on(table.organizationId, table.createdAt),
  ],
);

export const checklistTemplateVersions = pgTable(
  "checklist_template_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    templateId: uuid("template_id").notNull().references(() => checklistTemplates.id, { onDelete: "restrict" }),
    version: integer("version").notNull(),
    schemaSnapshot: jsonb("schema_snapshot").notNull(),
    createdById: uuid("created_by_id").notNull().references(() => users.id),
    publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("checklist_template_versions_template_version_unique").on(table.templateId, table.version),
    index("checklist_template_versions_org_template_idx").on(table.organizationId, table.templateId, table.version),
  ],
);

export const workOrders = pgTable(
  "work_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    number: varchar("number", { length: 40 }).notNull(),
    title: varchar("title", { length: 240 }).notNull(),
    description: text("description"),
    clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "restrict" }),
    siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "restrict" }),
    templateVersionId: uuid("template_version_id").notNull().references(() => checklistTemplateVersions.id, { onDelete: "restrict" }),
    priority: workOrderPriority("priority").default("NORMAL").notNull(),
    scheduleStart: timestamp("schedule_start", { withTimezone: true }),
    scheduleEnd: timestamp("schedule_end", { withTimezone: true }),
    dueDate: timestamp("due_date", { withTimezone: true }),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
    supervisorMembershipId: uuid("supervisor_membership_id").references(() => memberships.id, { onDelete: "set null" }),
    internalNotes: text("internal_notes"),
    instructions: text("instructions"),
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    clientVisibility: boolean("client_visibility").default(false).notNull(),
    clientApprovalRequired: boolean("client_approval_required").default(false).notNull(),
    status: workOrderStatus("status").default("DRAFT").notNull(),
    cancellationReason: text("cancellation_reason"),
    recurrenceFrequency: recurrenceFrequency("recurrence_frequency"),
    recurrenceInterval: integer("recurrence_interval").default(1),
    recurrenceEndAt: timestamp("recurrence_end_at", { withTimezone: true }),
    recurrenceSeriesId: uuid("recurrence_series_id"),
    recurrenceOccurrenceAt: timestamp("recurrence_occurrence_at", { withTimezone: true }),
    actualStartedAt: timestamp("actual_started_at", { withTimezone: true }),
    actualFinishedAt: timestamp("actual_finished_at", { withTimezone: true }),
    rowVersion: integer("row_version").default(1).notNull(),
    createdById: uuid("created_by_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("work_orders_org_number_unique").on(table.organizationId, table.number),
    uniqueIndex("work_orders_recurrence_occurrence_unique").on(table.organizationId, table.recurrenceSeriesId, table.recurrenceOccurrenceAt),
    index("work_orders_org_status_schedule_idx").on(table.organizationId, table.status, table.scheduleStart),
    index("work_orders_org_client_site_idx").on(table.organizationId, table.clientId, table.siteId),
    index("work_orders_org_due_idx").on(table.organizationId, table.dueDate),
  ],
);

export const workOrderAssignments = pgTable(
  "work_order_assignments",
  {
    workOrderId: uuid("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
    membershipId: uuid("membership_id").notNull().references(() => memberships.id, { onDelete: "restrict" }),
    assignedById: uuid("assigned_by_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.workOrderId, table.membershipId] }), index("work_order_assignments_membership_idx").on(table.membershipId, table.workOrderId)],
);

export const workOrderStatusHistory = pgTable(
  "work_order_status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    workOrderId: uuid("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
    fromStatus: workOrderStatus("from_status"),
    toStatus: workOrderStatus("to_status").notNull(),
    reason: text("reason"),
    actorId: uuid("actor_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("work_order_status_history_org_work_order_idx").on(table.organizationId, table.workOrderId, table.createdAt)],
);

export const workOrderAttachments = pgTable(
  "work_order_attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    workOrderId: uuid("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull(),
    originalFilename: text("original_filename").notNull(),
    mimeType: varchar("mime_type", { length: 160 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    uploadedById: uuid("uploaded_by_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("work_order_attachments_org_work_order_idx").on(table.organizationId, table.workOrderId)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    recipientMembershipId: uuid("recipient_membership_id").notNull().references(() => memberships.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 64 }).notNull(),
    title: varchar("title", { length: 240 }).notNull(),
    body: text("body").notNull(),
    resourceType: varchar("resource_type", { length: 100 }),
    resourceId: uuid("resource_id"),
    href: text("href"),
    readAt: timestamp("read_at", { withTimezone: true }),
    emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("notifications_recipient_read_created_idx").on(table.recipientMembershipId, table.readAt, table.createdAt), index("notifications_org_resource_idx").on(table.organizationId, table.resourceType, table.resourceId)],
);

export const notificationPreferences = pgTable("notification_preferences", {
  membershipId: uuid("membership_id").primaryKey().references(() => memberships.id, { onDelete: "cascade" }),
  inAppEnabled: boolean("in_app_enabled").default(true).notNull(),
  emailAssignments: boolean("email_assignments").default(true).notNull(),
  emailScheduleChanges: boolean("email_schedule_changes").default(true).notNull(),
  emailDueReminders: boolean("email_due_reminders").default(true).notNull(),
  emailWorkflowUpdates: boolean("email_workflow_updates").default(true).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const workOrderDrafts = pgTable(
  "work_order_drafts",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    workOrderId: uuid("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
    membershipId: uuid("membership_id").notNull().references(() => memberships.id, { onDelete: "cascade" }),
    answers: jsonb("answers").$type<Record<string, unknown>>().default({}).notNull(),
    location: jsonb("location").$type<{ latitude: number; longitude: number; accuracy?: number } | null>(),
    version: integer("version").default(1).notNull(),
    status: draftStatus("status").default("ACTIVE").notNull(),
    clientUpdatedAt: timestamp("client_updated_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("work_order_drafts_work_order_membership_unique").on(table.workOrderId, table.membershipId), index("work_order_drafts_org_membership_idx").on(table.organizationId, table.membershipId, table.updatedAt)],
);

export const evidenceFiles = pgTable(
  "evidence_files",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    workOrderId: uuid("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
    draftId: uuid("draft_id").references(() => workOrderDrafts.id, { onDelete: "set null" }),
    fieldId: varchar("field_id", { length: 100 }),
    category: evidenceCategory("category").default("OTHER").notNull(),
    uploadStatus: evidenceUploadStatus("upload_status").default("PENDING").notNull(),
    originalFilename: text("original_filename").notNull(),
    storageKey: text("storage_key").notNull(),
    mimeType: varchar("mime_type", { length: 160 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    checksumSha256: varchar("checksum_sha256", { length: 64 }),
    caption: text("caption"),
    capturedAt: timestamp("captured_at", { withTimezone: true }),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    uploadedByMembershipId: uuid("uploaded_by_membership_id").notNull().references(() => memberships.id, { onDelete: "restrict" }),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("evidence_files_storage_key_unique").on(table.storageKey), index("evidence_files_org_work_order_status_idx").on(table.organizationId, table.workOrderId, table.uploadStatus), index("evidence_files_draft_idx").on(table.draftId)],
);

export const signatures = pgTable(
  "signatures",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    workOrderId: uuid("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
    evidenceFileId: uuid("evidence_file_id").notNull().references(() => evidenceFiles.id, { onDelete: "restrict" }),
    fieldId: varchar("field_id", { length: 100 }).notNull(),
    signerMembershipId: uuid("signer_membership_id").notNull().references(() => memberships.id, { onDelete: "restrict" }),
    consentText: text("consent_text").notNull(),
    signedAt: timestamp("signed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("signatures_evidence_file_unique").on(table.evidenceFileId), index("signatures_org_work_order_idx").on(table.organizationId, table.workOrderId)],
);

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    workOrderId: uuid("work_order_id").notNull().references(() => workOrders.id, { onDelete: "restrict" }),
    currentRevision: integer("current_revision").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("submissions_work_order_unique").on(table.workOrderId), index("submissions_org_created_idx").on(table.organizationId, table.createdAt)],
);

export const submissionRevisions = pgTable(
  "submission_revisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    submissionId: uuid("submission_id").notNull().references(() => submissions.id, { onDelete: "restrict" }),
    workOrderId: uuid("work_order_id").notNull().references(() => workOrders.id, { onDelete: "restrict" }),
    revision: integer("revision").notNull(),
    templateSnapshot: jsonb("template_snapshot").notNull(),
    answersSnapshot: jsonb("answers_snapshot").$type<Record<string, unknown>>().notNull(),
    evidenceSnapshot: jsonb("evidence_snapshot").notNull(),
    submittedByMembershipId: uuid("submitted_by_membership_id").notNull().references(() => memberships.id, { onDelete: "restrict" }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
    appVersion: varchar("app_version", { length: 80 }).notNull(),
    location: jsonb("location").$type<{ latitude: number; longitude: number; accuracy?: number } | null>(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("submission_revisions_submission_revision_unique").on(table.submissionId, table.revision), index("submission_revisions_org_work_order_idx").on(table.organizationId, table.workOrderId, table.submittedAt)],
);
