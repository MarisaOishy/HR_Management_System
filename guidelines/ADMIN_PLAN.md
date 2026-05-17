# Admin Section — Planning & Roadmap

This document outlines a practical plan to add a full **Admin** section to the HRMS frontend and backend surface. It focuses on scope, UI/UX, routing, authorization, backend service mapping, data model changes, testing, and a phased implementation roadmap. No code is included here — this is a specification and execution plan for development.

## Goals

- Provide an Admin workspace for global system management.
- Enable Admin-only operations (user/role management, system settings, audit logs, reports, approvals).
- Integrate with existing auth/RBAC via Supabase and `AuthContext`.
- Keep UI consistent with existing app styles and component library.

## High-Level Features (Scope)

- Admin Dashboard: system-wide metrics, quick actions, recent activity.
- User & Role Management: create/update/delete users, assign roles, view last login.
- Permissions/RBAC Management: manage roles and their capabilities.
- Organization Management: create/edit departments, teams.
- Leave & Payroll Approvals: central approval queues and audit trails.
- Audit Logs: view system events (logins, CRUD on sensitive resources).
- Reports: generate/export HR reports (headcount, payroll summaries, leave trends).
- Settings: global app settings, feature toggles, integrations.

## UI / UX Design

- Add a dedicated `AdminLayout` (shared header, admin sidebar) and an `Admin` section under `/admin`.
- Sidebar entries: Dashboard, Users, Roles, Departments, Approvals, Audit Logs, Reports, Settings.
- Reuse existing UI primitives (`src/app/components/ui/*`), follow Tailwind + design tokens.
- Accessible forms using current `form.tsx` wrappers and `react-hook-form` patterns.

## Route Structure (Frontend)

- Mount admin routes under `/admin` using the existing router pattern in [src/app/routes.tsx](src/app/routes.tsx#L1).
- Example routes:
  - `/admin` → Admin Dashboard
  - `/admin/users` → User list
  - `/admin/users/new` → Create user
  - `/admin/users/:id` → Edit/view user
  - `/admin/roles` → Roles/permissions
  - `/admin/approvals` → Approvals queue
  - `/admin/audit-logs` → Audit logs
  - `/admin/reports` → Reports

## Components & Pages to Add

- Layouts:
  - `AdminLayout` (new) — wrap admin pages, different sidebar/menu.
- Pages:
  - `AdminDashboardPage`
  - `AdminUserListPage`, `AdminUserEditPage`, `AdminUserAddPage`
  - `AdminRolesPage` (role CRUD)
  - `AdminApprovalsPage`
  - `AdminAuditLogsPage`
  - `AdminReportsPage`
  - `AdminSettingsPage`
- Reusable components:
  - `UserTable`, `RoleEditor`, `PermissionMatrix`, `AuditLogTable`, `ApprovalItem`

## Auth & Permissions

- Leverage existing `AuthContext` and protected-route patterns. See [src/app/App.tsx](src/app/App.tsx#L1) and [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx#L1).
- Add a new role `admin` (if not already present) and ensure RBAC checks across UI and service calls.
- Client-side gating: create an `AdminOnlyRoute` (or extend `ProtectedRoute`) that checks role from context.
- Server-side enforcement: ensure Supabase RLS policies and API checks only allow Admin role for sensitive operations.

## Backend / Services Mapping

- Reuse `lib/services/*` pattern. Add or extend services under `lib/services/`:
  - `adminService.ts` — high-level admin operations (users, roles, reports)
  - Ensure `roleService.ts` and `employeeService.ts` support admin operations needed.
- API calls will typically use Supabase client (`lib/supabase.ts`). Ensure consistent error handling and pagination.

## Database & Supabase Considerations

- Tables impacted: `users`, `roles`, `departments`, `audit_logs`, `leave_requests`, `payroll`.
- Migrations/seed updates:
  - Insert `admin` role in seed data (`supabase/seed.sql`).
  - Add `audit_logs` table if missing; capture actor, action, resource, timestamp.
- RLS Policies:
  - Add policies allowing Admin role to SELECT/INSERT/UPDATE/DELETE where appropriate.
  - Keep least-privilege for HR/Employee roles (e.g., employees can only access own records).

## Audit & Logging

- Capture admin actions for compliance: user changes, role assignments, payroll approvals.
- Store in `audit_logs` and expose read-only UI to Admins.

## Reporting & Exports

- Reuse front-end charts (`chart.tsx`) and reporting components; allow CSV/Excel export for reports.

## Testing & QA

- Unit tests for role checks and service functions.
- Integration tests for protected routes and pages (e.g., ensuring non-admins cannot access `/admin`).
- Manual QA checklist: permissions, UI layout, ensure no elevation of privilege via API.

## Implementation Roadmap (Phased)

Phase 0 — Discovery & Prep (1–2 days)
- Audit current roles and seeds ([supabase/seed.sql](supabase/seed.sql#L1)).
- Identify missing tables/policies.

Phase 1 — Core Admin UI & Routing (2–4 days)
- Add `AdminLayout`, register `/admin` routes in [src/app/routes.tsx](src/app/routes.tsx#L1).
- Build Admin Dashboard skeleton and RBAC checks.

Phase 2 — Users & Roles Management (3–5 days)
- Implement user list, create, edit; role assignment flows.
- Hook services to Supabase; add audit log writes.

Phase 3 — Approvals, Audit Logs, Reports (3–6 days)
- Central approval queues, audit logs UI, report generation/export.

Phase 4 — Settings, Hardening, Tests (2–4 days)
- Global settings page, finalize RLS, add unit/integration tests.

Phase 5 — Polish & Documentation (1–2 days)
- Accessibility review, performance check, update README and developer docs.

## Acceptance Criteria

- Admin routes only accessible to accounts with the `admin` role.
- Admin can manage users and roles without UI errors; changes reflected in DB.
- Audit events are recorded for sensitive admin actions.
- Reports can be generated and exported as CSV/Excel.

## Files to Update / Review

- Router: [src/app/routes.tsx](src/app/routes.tsx#L1)
- App wrapper: [src/app/App.tsx](src/app/App.tsx#L1)
- Auth context: [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx#L1)
- Existing services: [lib/services/roleService.ts](lib/services/roleService.ts#L1), [lib/services/employeeService.ts](lib/services/employeeService.ts#L1)
- Supabase seeds and RLS: `supabase/seed.sql`, `supabase/rls_policies.sql`

## Next Steps (recommended immediate tasks)

1. Update `supabase/seed.sql` to ensure an `admin` role exists.
2. Add `AdminLayout` and register `/admin` routes in `routes.tsx` behind an `AdminOnlyRoute` guard.
3. Implement minimal `adminService` methods to list users and roles for the UI.
4. Create an `audit_logs` table and add writes from admin actions.
5. Run manual tests to validate RBAC and route protection.

---

## Credentials for Testing

To test the system locally, create the following users in your Supabase Auth dashboard (Authentication -> Add User), or sign up via the `/auth/register` page:

**Admin User (Full Access to `/admin`)**
- **Email:** `admin@banglahr.com.bd`
- **Password:** `AdminPassword123!`
- *(Note: Ensure this user has the role `Admin` in the `user_metadata`. If left blank during signup, the system currently defaults to `Admin`.)*

**HR Manager User (Standard HRMS Access)**
- **Email:** `hr@banglahr.com.bd`
- **Password:** `HrPassword123!`
- *(Note: Set `{"role": "HR Manager"}` in `user_metadata` for this user if creating via Supabase dashboard to test restrictions on the `/admin` route.)*
