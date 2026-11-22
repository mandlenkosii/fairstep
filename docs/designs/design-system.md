---
name: Warm Legal Clarity
colors:
  surface: '#FFFFFF'
  surface-dim: '#d8dad9'
  surface-bright: '#f8faf8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f3'
  surface-container: '#eceeed'
  surface-container-high: '#e6e9e7'
  surface-container-highest: '#e0e3e2'
  on-surface: '#191c1c'
  on-surface-variant: '#3f4947'
  inverse-surface: '#2e3130'
  inverse-on-surface: '#eff1f0'
  outline: '#6f7978'
  outline-variant: '#bec9c7'
  surface-tint: '#1f6964'
  primary: '#004542'
  on-primary: '#ffffff'
  primary-container: '#0e5e5a'
  on-primary-container: '#90d5cf'
  inverse-primary: '#8ed3cd'
  secondary: '#845400'
  on-secondary: '#ffffff'
  secondary-container: '#fdb246'
  on-secondary-container: '#6f4600'
  tertiary: '#612f18'
  on-tertiary: '#ffffff'
  tertiary-container: '#7d462d'
  on-tertiary-container: '#ffb89b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#aaefe9'
  primary-fixed-dim: '#8ed3cd'
  on-primary-fixed: '#00201e'
  on-primary-fixed-variant: '#00504c'
  secondary-fixed: '#ffddb6'
  secondary-fixed-dim: '#ffb958'
  on-secondary-fixed: '#2a1800'
  on-secondary-fixed-variant: '#643f00'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#6d3921'
  background: '#f8faf8'
  on-background: '#191c1c'
  surface-variant: '#e0e3e2'
  primary-hover: '#0A4744'
  primary-tint: '#E3F0EE'
  ink: '#1C2B2A'
  muted: '#5B6B69'
  paper: '#F7F5F0'
  border: '#E3DED3'
  success: '#2E7D4F'
  success-tint: '#EAF2EC'
  warning: '#B7791F'
  warning-tint: '#F8F2E9'
  danger: '#B3261E'
  danger-tint: '#F8EAE9'
  info: '#2B6CB0'
  info-tint: '#EAF0F7'
typography:
  display:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg:
    fontFamily: Source Serif 4
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Source Serif 4
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Source Serif 4
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

# Design System: FairStep

South African web application helping small business owners run fair, documented disciplinary processes.
Tagline: "Every step fair. Every step on record."
Feel: Trustworthy, calm, professional, warm, not cold, generous whitespace, mobile-first and desktop-responsive legal/HR advisor.

## Palette & Colors
- **Primary / Fair Teal**: `#0E5E5A` (primary buttons, active states, key links)
- **Primary Hover**: `#0A4744`
- **Primary Tint**: `#E3F0EE` (selected rows, subtle table highlights, active background accents)
- **Accent / Ochre**: `#C9861A` (current step ring, key highlights only — used sparingly)
- **Ink**: `#1C2B2A` (headings, body text, primary icons)
- **Muted**: `#5B6B69` (secondary text, supporting metadata, helper copy)
- **Background / Paper**: `#F7F5F0` (warm document-like paper canvas)
- **Surface / Cards**: `#FFFFFF` (elevated white cards, modals, form surfaces)
- **Border**: `#E3DED3` (subtle, warm stone hairline borders)
- **Success**: `#2E7D4F` (Success Badge Tint: `#EAF2EC`)
- **Warning**: `#B7791F` (Warning Badge Tint: `#F8F2E9`)
- **Danger**: `#B3261E` (Danger Badge Tint: `#F8EAE9`)
- **Info**: `#2B6CB0` (Info Badge Tint: `#EAF0F7`)

## Typography
- **Headings Font**: "Source Serif 4", serif, semibold / 600 weight — calm, authoritative, legal document aesthetic.
- **UI & Body Font**: "Inter", sans-serif, 400 regular body, 500 medium UI, 600 semibold CTAs.
- **Type Scale**:
  - H1 / Display: 32px (line-height 1.25)
  - H2 / Section: 24px (line-height 1.3)
  - H3 / Subsection: 20px (line-height 1.35)
  - Body: 16px (line-height 1.5)
  - Secondary / Supporting: 14px (line-height 1.45)
  - Labels / Metadata: 12px uppercase, letter-spacing 0.04em, semibold

## Spacing & Shape
- **Grid**: 4px base increment (8px, 12px, 16px, 24px, 32px, 48px).
- **Corner Radii**:
  - Cards & Containers: 12px (`rounded-xl`)
  - Inputs & Buttons: 8px (`rounded-lg`)
  - Badges & Pills: 9999px (`rounded-full`)
- **Elevation / Shadows**: Very subtle border-driven aesthetic (`box-shadow: 0 1px 2px rgba(28,43,42,0.06)`), favor crisp `#E3DED3` borders over heavy dropshadows.
- **Touch Targets**: Minimum 44px height; mobile horizontal padding 16px.

## Brand Assets & Identity
- **Wordmark**: "FairStep" rendered in Source Serif 4.
- **Icon**: Three ascending geometric steps in Fair Teal (`#0E5E5A`), with a focused ochre dot (`#C9861A`) resting on the top step, symbolizing walking the fair path one step at a time.

## Signature Components
### Fair Steps Stepper
Process flow stages:
1. Incident
2. Investigation
3. Notice
4. Hearing
5. Outcome
6. Appeal (optional)

- **Completed Step**: Filled teal circle (`#0E5E5A`) with white checkmark icon, solid teal connector line.
- **Current Step**: White circle with 3px ochre ring (`#C9861A`) and step numeral in ink, bold step title, ochre accent dot.
- **Blocked Step**: Muted neutral circle with lock icon and warning helper alert detailing prerequisite actions.
- **Upcoming Step**: Outlined stone circle (`#E3DED3`) with muted step index.
- **Desktop**: Horizontal timeline across the case header.
- **Mobile**: Vertical list with dates and status badges.

## Layout & Chrome
- **Desktop**: Left fixed sidebar (248px width) containing brand logo, main navigation routes, and employee/user profile card pinned to bottom; main content column constrained to max-width 1200px on Paper (`#F7F5F0`) background.
- **Mobile**: Sticky top app bar with logo + profile avatar; bottom tab navigation bar with icons and clear labels.
- **Mandatory Footer**: "FairStep guides process and keeps records. It is not legal advice." on all screens.

## Voice, Copy & Localization
- Plain South African English (e.g., "The employee needs at least 2 working days to prepare.", "Tue 24 Nov 2026", "R149").
- Second-person, direct, calm, empathetic, and jargon-free.
