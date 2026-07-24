# Master data

Phase 2 adds tenant-scoped operational master data for clients, sites, teams, memberships, organization settings, and audit history.

## Clients

Client codes are unique inside an organization. Records that have operational history are archived instead of hard-deleted. Client reviewer membership can be assigned only when both the client and membership belong to the active organization and the membership has the `CLIENT_REVIEWER` role.

## Sites

Every site belongs to one client and repeats `organization_id` for fast, explicit tenant filtering. The service verifies the selected client belongs to the same tenant before every create or update. GPS coordinates are optional, range-validated, and governed by the organization privacy setting.

## Teams and members

Team supervisors and members are verified against active memberships in the same organization. Role changes, suspension/reactivation, invitation lifecycle, and ownership transfer run through domain services and create audit events. Ownership transfer is transactional.

## Audit log

The application exposes no update or delete operation for audit records. Reads are scoped to the active organization, paginated on the server, and restricted to owners and auditors.
