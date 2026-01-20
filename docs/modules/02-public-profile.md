# Module 02 — Public Profile (Bio Link)

## Overview

Based on PRD section 2.2 and visitor flow 6.2, this module renders the advisor-facing public card at `mediapp.app/{username}` with actionable links and share tools.

## MVP Scope

- Display avatar, name, professional title, 160-character bio, social links, and CTA buttons for active features.
- Floating action bar with “Share link” and “Show QR” options.
- Mobile-first responsive layout with fast loading and SEO-friendly metadata.

## Key Features

- Server-side resolution of profile by username with caching.
- Dynamic CTA list sourced from Feature toggles (Module 04).
- QR modal render with downloadable asset integration (Module 05).
- Share sheet support for mobile browsers (navigator.share).

## Dependencies

- Relies on data collected during Onboarding (Module 01) and updated via Settings (Module 07).
- Consumes Feature definitions (Module 04) and QR assets (Module 05).

## Metrics & Notes

- Profile views broken down by day/week/month (feeds Dashboard module).
- CTA click-through rates per button.
- Share action counts vs QR scans.
