# Admin User Guide

This guide explains how to use the admin portal to manage trainings, enrollments, resources, and support content.

## Access and Roles

- Admin access is granted via `users.role = "admin"` in PocketBase.
- Standard users have read-only access and can register for trainings.
- The app typically uses SSO; the `/whoami` endpoint provisions users and returns their role.
- Optional local admin login is available at `/admin-login` when `VITE_ENABLE_ADMIN_LOGIN=true`.

If you see an "Access denied" screen, your account does not have the `admin` role yet.

## Admin Portal Overview

Open `/admin` to access the admin portal. Tabs include:

- Dashboard
- Trainings
- Categories
- Enrollment
- Resources
- Support Page
- Team Roles

## Trainings

Use this tab to create and manage training sessions.

Key actions:

- Create a training with the "Add Training" button.
- Edit or delete existing trainings.
- Toggle featured and recommended flags to control homepage sections.
- Control registration availability via the "Registration Open" toggle.

Important fields and rules:

- Name and category are required.
- Description: max 5000 characters.
- Short description: max 300 characters.
- External registration link must start with `https://`.
- Slots and max registrations must be numeric (max 10,000).
- Hero image file types: JPEG, PNG, GIF, WebP (max 5MB).
- Attachments: PDF/Word/Excel/PowerPoint files (max 5MB each).

Registration behavior:

- If `registrationMethod` is `external`, users are sent to the external link.
- If `registrationMethod` is `internal`, the built-in registration modal is used.
- Registration is blocked when:
  - Status is `Completed`, `Cancelled`, or `On Hold`, or
  - Available slots are `0`, or
  - "Registration Open" is disabled.

## Categories

Create and manage training categories used for filtering and badges.

- Name is required.
- Color must be a valid hex color (for example, `#3b82f6`).

## Enrollment

Manage registrations across trainings.

Features:

- Search by participant name or email.
- Filter by status, attendance, training, or category.
- Bulk actions and status changes for multiple registrations.
- Export to CSV or XLSX.

Enrollment statuses:

- `registered`
- `pending_approval`
- `hr_approval`
- `confirmed`
- `cancelled`
- `on_hold`
- `waitlisted`

Attendance statuses:

- `pending`
- `attended`
- `no_show`

## Resources (Tools & Guidelines)

Manage documents and links shown on the Tools & Guidelines page.

- Resource types: `Guideline`, `User Guide`, `Template`, `FAQ`.
- You can attach a file, an external link, or both.
- File uploads: PDF/Word/Excel/PowerPoint, max 5MB.
- External links must use `https://`.

## Support Page Builder

The Support page is built from content blocks.

- Add blocks: Heading, Paragraph, Link/Button, Row Layout, Divider, Spacer, Icon Card.
- Use "Save Draft" to save without publishing.
- Use "Publish" to make the page live.
- Use "Versions" to restore previous versions.

If the Support page is empty, it will show a placeholder message until content is published.

## Team Roles

Manage roles for users stored in PocketBase.

- Admins can assign `admin` or `user` roles.
- Removing admin access sets the role back to `user`.
- For full user deletion, use the PocketBase admin dashboard.

## Troubleshooting

- Access denied: ensure the user has `role = "admin"` in PocketBase.
- External link errors: links must start with `https://`.
- Upload failures: verify file type and size (5MB max).
- Support page not showing: ensure content is published, not just saved as draft.
