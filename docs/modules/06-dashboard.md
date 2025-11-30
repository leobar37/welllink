# Module 06 — Dashboard

## Overview
PRD section 2.6 defines the advisor dashboard as the operational hub for metrics, quick actions, and feature management.

## MVP Scope
- Metrics cards for profile visits (day/week/month), completed surveys, social clicks, and traffic sources (QR vs direct).
- Quick actions: view public profile, copy link, download QR, edit profile.
- Entry point for Feature toggles (Module 04) and Settings (Module 07).

## Key Features
- Data aggregation pipeline for visit/click events.
- Role-based access (advisor vs future admin).
- Widgetized layout for incremental additions.

## Dependencies
- Consumes analytics events emitted by Public Profile (Module 02) and Feature flows (Module 04).
- Integrates with QR assets (Module 05) for download shortcuts.
- Authenticated access ensured by Module 01.

## Metrics & Notes
- Daily active advisors (dashboard logins).
- Accuracy of analytics vs raw event logs.
- Task completion rate via quick actions.
