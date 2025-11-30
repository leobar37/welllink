# Module 01 — Authentication & Onboarding

## Overview
Derived from PRD section 2.1, this module handles account creation, secure sign-in, and the guided onboarding flow that captures initial profile data for wellness advisors.

## MVP Scope
- Email/password registration and login.
- Google OAuth option (single-click where available).
- Email verification step before accessing the dashboard.
- Password recovery via email reset links.
- Guided onboarding wizard (3–5 steps) to collect name, username, avatar, bio, social links, and WhatsApp number as defined in section 6.1.

## Key Features
- Validation for unique usernames and verified emails.
- Progress tracking through onboarding steps with the ability to resume.
- Server-side rate limiting for auth endpoints.
- Basic notification hooks (email confirmation, onboarding completion reminder).

## Dependencies
- Shared user profile schema consumed by Public Profile (Module 02), Dashboard (Module 06), and Settings (Module 07).
- Needs messaging integration for email verification and password reset.
- Seeds Feature toggles (Module 04) once onboarding finishes.

## Metrics & Notes
- Activation rate = verified users / registered users.
- Onboarding completion rate and average time per step.
- Error rate of login attempts and password resets.
