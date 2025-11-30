# Module 05 — QR & Virtual Card

## Overview
Based on PRD section 2.5 and visitor flow 6.3, this module enables advisors to share their profile offline via QR codes and downloadable virtual business cards.

## MVP Scope
- Generate QR codes pointing to `wellnesslink.com/{username}` in PNG/SVG formats.
- Allow download from dashboard and quick access from public profile modal.
- Provide a static virtual card design with advisor details ready for print.

## Key Features
- On-demand QR generation plus cached assets for fast retrieval.
- Download tracking for analytics.
- Preview modal before download.

## Dependencies
- Requires user profile data from Modules 01/02.
- Dashboard (Module 06) hosts download actions; Public Profile consumes modal display.
- Optional integration with Feature metrics for offline attribution.

## Metrics & Notes
- Number of QR downloads vs live scans.
- Virtual card downloads per advisor.
- Ratio of traffic from QR vs direct link (feeds Dashboard reports).
