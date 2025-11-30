# Module 07 — Account Settings

## Overview
Per PRD section 2.7, this module centralizes profile and account configuration beyond the onboarding wizard.

## MVP Scope
- Update username, email, password, and WhatsApp number.
- Manage notification preferences (email alerts for survey completions).
- Account deletion flow with confirmation.

## Key Features
- Validation for unique usernames and verified email changes.
- Secure password update with re-authentication/whoami checks.
- Notification toggles persisted per user.

## Dependencies
- Uses Auth services from Module 01 for credential changes.
- Updates profile info consumed by Modules 02, 04, and 05.
- Notification preferences integrate with messaging infrastructure.

## Metrics & Notes
- Frequency of profile edits and username changes.
- Opt-in rate for notifications.
- Successful vs failed password update attempts.
