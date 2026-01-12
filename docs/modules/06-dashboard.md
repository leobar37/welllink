# Module 06 — Dashboard

## Overview
PRD section 2.6 defines the advisor dashboard as the operational hub for metrics, quick actions, and feature management. Extended in Phase 2 to include reservation management, campaign analytics, and client insights.

## MVP Scope
- Metrics cards for profile visits (day/week/month), completed surveys, social clicks, and traffic sources (QR vs direct).
- Quick actions: view public profile, copy link, download QR, edit profile.
- Entry point for Feature toggles (Module 04) and Settings (Module 07).

## Phase 2 Extensions

### Reservation Management Widget
- **Pending Requests**: Count of reservation requests awaiting approval.
- **Quick Actions**: Approve/Reject buttons for pending requests.
- **Today's Appointments**: List of confirmed reservations for the day.
- **Statistics**: Pending, Approved, Rejected, Completed counts.

### Campaign & Messaging Widget
- **Quick Stats**: Total messages sent, delivery rate, campaigns count.
- **Recent Campaigns**: Last 5 campaigns with status and metrics.
- **AI Suggestions**: Smart recommendations for client outreach.
- **Quick Actions**: Create message, View campaigns, Manage clients.

### Client Management Widget
- **Client Stats**: Total clients, by label (consumers/prospects/affiliates).
- **Recent Clients**: Last added clients.
- **Re-engagement**: Clients without contact in X days.
- **Quick Actions**: Add client, View all clients.

## Key Features
- Data aggregation pipeline for visit/click events.
- Role-based access (advisor vs future admin).
- Widgetized layout for incremental additions.
- Unified metrics from multiple modules (reservations, campaigns, clients).

## Dashboard Sections

### Header
- Welcome message with advisor name.
- Quick actions toolbar.
- Notifications indicator.

### Metrics Cards (Top Row)
| Card | Description | Source |
|------|-------------|--------|
| Profile Visits | Visitors today/week/month | Module 02 |
| Surveys Completed | Total completed surveys | Module 04 |
| Social Clicks | Link click-through rate | Module 02 |
| Traffic Sources | QR vs Direct link breakdown | Module 02 |

### Reservation Section (Phase 2)
| Metric | Description |
|--------|-------------|
| Pending Requests | Requests awaiting approval |
| Today's Appointments | Confirmed reservations |
| This Week | Total reservations this week |
| Completion Rate | % of completed vs total |

### Campaign Section (Phase 2)
| Metric | Description |
|--------|-------------|
| Messages Sent | Total messages this month |
| Delivery Rate | % delivered successfully |
| Active Campaigns | Currently sending/scheduled |
| Campaigns Sent | Total completed campaigns |

### Client Section (Phase 2)
| Metric | Description |
|--------|-------------|
| Total Clients | All registered clients |
| Consumers | Label: consumidor |
| Prospects | Label: prospecto |
| Affiliates | Label: afiliado |

### Quick Actions Bar
- [View Public Profile] - Opens profile in new tab
- [Copy Link] - Copies profile URL to clipboard
- [Download QR] - Opens QR download modal
- [Edit Profile] - Opens profile editor
- [Create Campaign] - Opens campaign creator
- [Add Client] - Opens client registration form

### Recent Activity Feed
- New reservation requests
- Campaign completed
- New client registered
- Survey completed

## Dependencies
- Consumes analytics events emitted by Public Profile (Module 02) and Feature flows (Module 04).
- Integrates with QR assets (Module 05) for download shortcuts.
- Authenticated access ensured by Module 01.
- Reservation System (Module 11) for appointment data.
- Campaign System (Module 10) for messaging metrics.
- Client Management (Module 10) for client stats.

## Metrics & Notes
- Daily active advisors (dashboard logins).
- Accuracy of analytics vs raw event logs.
- Task completion rate via quick actions.
- Reservation approval time (avg time from request to approval).
- Campaign delivery rate (messages delivered vs sent).
- Client engagement rate (responses per campaign).
