# Module 04 — Feature System

## Overview
Grounded in PRD sections 2.4 and 3, this module provides a modular toggle system so advisors can activate specialized tools (e.g., health survey) that appear as CTAs on their public profile.

## MVP Scope
- Feature registry with metadata (button label, description, config form schema).
- Toggle UI in dashboard to activate/deactivate each feature per advisor.
- Feature 1 implementation: "Health Survey" that sends WhatsApp results (see `docs/feature-1-evaluation.md`).
- Button label customization with safe defaults.

## Key Features
- Server-side guards ensuring only enabled features render publicly.
- Webhook or messaging integration for feature outputs (WhatsApp delivery).
- Audit log for toggle changes.

## Dependencies
- Dashboard (Module 06) hosts configuration forms.
- Public Profile (Module 02) consumes active feature list.
- WhatsApp/messaging services owned by backend (Module 05 for QR re-use, Module 01 user data).

## Metrics & Notes
- Feature adoption percentage per advisor.
- Conversion tracking per CTA (views vs completions).
- Error rate for downstream actions (e.g., WhatsApp send failures).
