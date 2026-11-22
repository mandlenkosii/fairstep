# FairStep: Google Stitch Prompts

How to use these:
1. Start a new Stitch project called **FairStep**.
2. Paste the **Design system** block as your first message (or at the top of every screen prompt if Stitch loses context).
3. Generate each screen **twice**: once with "Mobile (390px)" and once with "Desktop (1440px)". Each prompt describes both layouts.
4. Export each screen to `docs/designs/` named like `03-owner-dashboard-mobile.png` / `03-owner-dashboard-desktop.png`.

All names, businesses and cases are fictional.

---

## Design system (paste first)

```
Design system for "FairStep", a South African web app that helps small business owners run fair, documented disciplinary processes. Tagline: "Every step fair. Every step on record."

Feel: trustworthy, calm, professional — a legal/HR tool that feels like a helpful advisor, not a corporate form. Warm, not cold. Lots of white space. Mobile-first.

Colours:
- Primary "Fair Teal" #0E5E5A (primary buttons, active states, links); hover #0A4744
- Primary tint #E3F0EE (selected rows, subtle highlights)
- Accent "Ochre" #C9861A (current step ring, key highlights only — use sparingly)
- Ink #1C2B2A (headings/body text), Muted #5B6B69 (secondary text)
- Background "Paper" #F7F5F0, Surface/cards #FFFFFF, Border #E3DED3
- Success #2E7D4F, Warning #B7791F, Danger #B3261E, Info #2B6CB0 (each with a 10% tint background for badges)

Typography:
- Headings: "Source Serif 4", semibold — gives a calm, document-like legal feel
- UI and body: "Inter", regular 16px body, 14px secondary, 12px labels in uppercase with letter-spacing 0.04em
- Scale: 32 / 24 / 20 / 16 / 14 / 12

Spacing and shape:
- 4px base grid; common spacing 8, 12, 16, 24, 32, 48
- Card radius 12px, inputs and buttons radius 8px, badges fully rounded
- Shadows very soft (0 1px 2px rgba(28,43,42,0.06)); prefer borders over shadows
- Touch targets at least 44px tall; mobile side padding 16px

Logo: wordmark "FairStep" in Source Serif 4, preceded by a simple icon of three ascending steps in Fair Teal, with a small ochre dot on the top step (a path you walk, one step at a time).

Signature component — the "Fair Steps" progress stepper:
- Steps: Incident → Investigation → Notice → Hearing → Outcome → Appeal (optional)
- Completed: filled teal circle with white check, teal connector line
- Current: white circle with 3px ochre ring and step number, label bold
- Blocked: grey circle with a small lock icon, plus a short warning text explaining why
- Upcoming: outlined grey circle
- Desktop: horizontal across the top of the case. Mobile: vertical list on the left with labels and dates.

Navigation:
- Mobile: top bar with logo + avatar; bottom tab bar (icons + labels).
- Desktop: left sidebar 248px with logo, nav items, and user card at the bottom; content max-width 1200px.

Tone of copy: plain South African English, second person, short sentences, no legal jargon. Example: "The employee needs at least 2 working days to prepare." Dates like "Tue 24 Nov 2026", currency like "R149".

Every app screen has a small footer line: "FairStep guides process and keeps records. It is not legal advice."
```

---

## 01 · Landing page

```
Using the FairStep design system, design the public marketing landing page. Generate a mobile (390px) and a desktop (1440px) version.

Sections, top to bottom:
1. Header: logo, links (How it works, Pricing, For consultants), "Log in" text button, "Start free trial" primary button. On mobile collapse links into a menu icon.
2. Hero: headline "Every step fair. Every step on record." Subheadline: "FairStep helps small business owners run fair, fully documented disciplinary processes — so you stop losing CCMA cases on procedure." Primary button "Start your 14-day free trial", secondary "See how it works". On the right (below on mobile) a phone mockup showing the Fair Steps stepper with Incident and Investigation done, Notice current.
3. Proof strip with 3 stat cards: "193,069 CCMA referrals in 2024/25", "51% were unfair dismissal disputes", "~60% of CCMA cases come from small businesses". Small source captions under each.
4. "How it works" — 4 numbered steps with simple line icons: Log the incident · Follow the fair steps · Generate the letters · Export a CCMA-ready bundle.
5. "We stop unfair steps before they happen" — a card showing a blocked step example: lock icon, "Hearing can't be scheduled yet", "The employee must get at least 2 working days' notice. Earliest fair date: Thu 26 Nov 2026."
6. "Built with your labour consultant" — short text + illustration of a review badge "Approved by Naledi Dlamini, Dlamini Labour Consulting".
7. Pricing: 3 cards — Starter R149/month (up to 10 employees), Growth R299/month (up to 50 employees, highlighted "Most popular"), Consultant R799/month (up to 15 client businesses). "14-day free trial. No card needed."
8. Lead magnet band in Fair Teal: "Is your disciplinary process CCMA-ready? Get the free checklist" with email input and button.
9. Footer: logo, tagline, links, and "FairStep provides process guidance and record-keeping. It is not legal advice."
```

## 02 · Sign up / Log in

```
Using the FairStep design system, design the authentication screens: Log in and Sign up. Generate a mobile (390px) and a desktop (1440px) version of each.

Desktop: split layout. Left half Fair Teal background with the logo in white, the tagline "Every step fair. Every step on record." and a vertical mini stepper illustration in white/ochre. Right half a white card centred with the form.
Mobile: logo and tagline on top, form card below, full width.

Log in form: heading "Welcome back", email, password (show/hide toggle), "Forgot password?" link, primary button "Log in", link "New to FairStep? Start your free trial".

Sign up form: heading "Start your 14-day free trial", full name, business name, number of employees (select: 1–10, 11–50), email, password with strength hint, checkbox "I understand FairStep guides process and is not legal advice", primary button "Create account", link "Already have an account? Log in". Small note: "Labour consultant? Ask us about the Consultant plan."

Show one field in an error state: email "That email is already registered. Log in instead?" in Danger red.
```

## 03 · Owner dashboard

```
Using the FairStep design system, design the business owner dashboard. Generate a mobile (390px) and a desktop (1440px) version.

Logged-in user: Thabo Mokoena, owner of "Kasi Kitchen" (restaurant, Khayelitsha, 14 employees).
Navigation: Dashboard (active), Employees, Incidents, Cases, Documents. Mobile bottom tabs: Home, Employees, New (big centre "+" button), Cases, More.

Content:
- Greeting: "Good morning, Thabo" with today's date "Mon 23 Nov 2026".
- Primary action button: "Log an incident".
- 4 stat cards: Open cases 3 · Awaiting consultant review 1 · Hearings this week 1 · Cases fully documented 92%.
- "Needs your attention" list with action rows:
  - "Hearing for Sipho Ndlovu — Thu 26 Nov, 10:00" — badge Warning "Upcoming"
  - "Naledi Dlamini requested changes on FS-2026-0014" — badge Info "Review"
  - "Investigation for Lerato Khumalo has no findings yet" — badge Danger "Blocked"
- "Active cases" list: each row shows employee name, case reference, misconduct category, a compact horizontal mini-stepper (6 dots) showing progress, and review status badge. Rows: Sipho Ndlovu · FS-2026-0012 · Late coming (repeat) · at Hearing; Lerato Khumalo · FS-2026-0014 · Cash shortage · at Investigation; Ayanda Mthembu · FS-2026-0009 · Insubordination · Outcome, Approved.
- "Recent incidents" (3 rows) with date and category.
On mobile, stack the stat cards in a 2×2 grid and turn the lists into cards.
```

## 04 · Employees list

```
Using the FairStep design system, design the Employees list for Kasi Kitchen. Generate a mobile (390px) and a desktop (1440px) version.

Header: title "Employees" with count "14 active", search field "Search by name or job title", filter chips (All, Active, Archived), primary button "Add employee".
Desktop: table with columns Name (avatar initials + name), Employee no., Job title, Start date, Open cases, Status badge, row chevron. Rows (fictional): Sipho Ndlovu · KK-004 · Waiter · 3 Mar 2023 · 1 open; Lerato Khumalo · KK-007 · Cashier · 15 Jan 2024 · 1 open; Ayanda Mthembu · KK-002 · Chef · 1 Jun 2021 · 0; Johan van Wyk · KK-010 · Kitchen assistant · 9 Sep 2024; Fatima Ebrahim · KK-011 · Waitron · 2 Feb 2025; Kagiso Molefe · KK-012 · Dishwasher · 20 Apr 2025; Nomvula Zulu · KK-005 · Supervisor · 11 Nov 2022.
Mobile: cards per employee with name, job title, open-case badge, chevron; sticky "Add employee" floating button.
Also show the "Add employee" form as a right-side drawer (desktop) / full-screen sheet (mobile): first name, last name, employee number (optional), job title, start date, work phone (optional). Helper text: "We only ask for what a case needs (POPIA)."
```

## 05 · Employee detail

```
Using the FairStep design system, design the Employee detail page for Sipho Ndlovu (Waiter, KK-004, started 3 Mar 2023, Kasi Kitchen). Generate a mobile (390px) and a desktop (1440px) version.

Header card: initials avatar, name, job title, employee no., start date, status badge "Active", buttons "Log incident" (primary) and "Edit" (secondary), overflow menu with "Archive".
Tabs: Overview · Incidents (3) · Cases (1) · Documents (2).
Overview content:
- "Warning record" card: "Written warning — Late coming — issued 12 Aug 2026 — valid until 12 Feb 2027" with green "Valid" badge; an expired one greyed out "Verbal warning — 4 Feb 2026 — expired".
- "Incidents" timeline list: 18 Nov 2026 Late coming (45 min) · 2 Nov 2026 Late coming (30 min) · 10 Aug 2026 Late coming.
- "Open case" card with mini stepper: FS-2026-0012, at Hearing step, hearing Thu 26 Nov 2026 10:00.
Desktop: two columns (details left, timeline right). Mobile: single column with tabs as a horizontal scroll.
```

## 06 · New incident

```
Using the FairStep design system, design the "Log an incident" form. Generate a mobile (390px) and a desktop (1440px) version.

Title "Log an incident", helper text "Write it down today, while it's fresh. Stick to facts — what happened, when and who saw it."
Fields:
- Employee (searchable select, selected: Lerato Khumalo — Cashier)
- Date and time of incident (19 Nov 2026, 17:40)
- Location (text: "Front till")
- Category of misconduct (select with chips: Late coming / absence, Dishonesty / theft, Insubordination, Negligence, Workplace violence or threats, Substance abuse, Other) — "Dishonesty / theft" selected
- What happened (textarea, filled with: "At cash-up the till was R850 short. Lerato was the only cashier on the till from 14:00 to 17:30. The till slip and cash-up sheet are attached.")
- Witnesses (tag input: "Nomvula Zulu (Supervisor)")
- Evidence upload: drag-and-drop zone on desktop / "Add photos or files" button on mobile, with two uploaded file chips "cash-up-sheet-19-nov.jpg 1.2 MB" and "till-slip.pdf 240 KB" with remove icons. Note: "Files are private to your business and your consultant."
- Checkbox: "Start a disciplinary case from this incident"
Buttons: "Save incident" (primary), "Cancel".
Mobile: single column, sticky bottom action bar. Desktop: form in a centred 720px card with a right-side tip panel "What makes a good incident record?" listing 3 short tips.
```

## 07 · Case workflow (stepper view) — signature screen

```
Using the FairStep design system, design the Case workflow screen — the most important screen in the product. Generate a mobile (390px) and a desktop (1440px) version.

Case: FS-2026-0012 · Sipho Ndlovu (Waiter) · Late coming (repeat) · Kasi Kitchen. Review status badge "Not yet reviewed".

Top: case header with employee name, reference, category, and buttons "Send for review" (secondary) and "Export CCMA bundle" (secondary, with download icon).

The Fair Steps stepper (signature element):
- Desktop: large horizontal stepper across the top: Incident (done, 18 Nov) → Investigation (done, 19 Nov) → Notice (done, 20 Nov) → Hearing (current, ochre ring) → Outcome (upcoming) → Appeal (optional, upcoming, dashed outline).
- Mobile: vertical stepper with the same states, each step showing its date; current step expanded.

Current step panel "Hearing":
- Summary: "Hearing scheduled Thu 26 Nov 2026, 10:00, back office. Notice delivered Fri 20 Nov — 4 working days' notice ✓"
- Checklist with ticks: Allegations stated ✓ · Employee told of right to a representative ✓ · Interpreter offered ✓ · Chairperson is impartial ✓
- Fields: Chairperson (Nomvula Zulu, Supervisor), Employee attended? (Yes/No), Employee's response (textarea), Witnesses heard, Representative present.
- Primary button "Record hearing and continue".

Show one BLOCKED example clearly: a warning callout in Danger tint with a lock icon: "You can't record an outcome yet. The employee's side of the story hasn't been recorded. Everyone has the right to respond before a decision is made." with a link "Why this matters".

Side panel (desktop right column; mobile below as tabs "Timeline · Documents · Comments"):
- Timeline: 20 Nov 09:12 Thabo Mokoena generated Notice of hearing · 20 Nov 09:30 Thabo Mokoena marked notice delivered · 19 Nov 16:05 Thabo Mokoena recorded investigation findings · 18 Nov 08:50 Thabo Mokoena logged incident.
- Documents: "Notice of hearing — FS-2026-0012.pdf".
Footer disclaimer line.
```

## 08 · Hearing notice preview

```
Using the FairStep design system, design the "Notice of hearing" document preview screen. Generate a mobile (390px) and a desktop (1440px) version.

Desktop: left 60% shows an A4 document preview on a grey canvas; right 40% shows a panel "Check before you send" with a checklist (all green ticks): Allegations are specific · At least 2 working days' notice · Employee's rights listed · Chairperson is impartial. Buttons: "Download PDF" (primary), "Mark as delivered" (secondary), "Edit details" (text).
Mobile: document preview scaled to width with pinch hint; actions in a sticky bottom bar.

The A4 document content (serif, formal but plain):
- Letterhead: "Kasi Kitchen (Pty) Ltd · 12 Lansdowne Road, Khayelitsha, Cape Town"
- Title: "NOTICE TO ATTEND A DISCIPLINARY HEARING"
- To: Sipho Ndlovu, Waiter (KK-004) · Date: 20 November 2026 · Ref: FS-2026-0012
- "You are required to attend a disciplinary hearing on Thursday 26 November 2026 at 10:00 in the back office."
- Allegation: "Late coming: on 2 November 2026 and 18 November 2026 you arrived for your shift 30 and 45 minutes late without permission, after a valid written warning issued on 12 August 2026."
- Your rights: to be represented by a fellow employee or shop steward; to an interpreter; to call witnesses and present evidence; to cross-examine witnesses.
- "If you do not attend without a good reason, the hearing may continue in your absence."
- Signature lines: Issued by Thabo Mokoena (Owner) · Received by employee, date.
- Small footer: "Generated by FairStep on 20 Nov 2026 09:12 SAST. FairStep is not legal advice."
```

## 09 · Consultant review queue

```
Using the FairStep design system, design the consultant's Review queue. Generate a mobile (390px) and a desktop (1440px) version.

Logged-in user: Naledi Dlamini, Dlamini Labour Consulting (consultant). Navigation: Review queue (active, badge 4), Clients, All cases.

Header: "Review queue" with subtitle "4 cases waiting for you". Filter chips: All · Pending review · Changes requested · Approved. Client filter select.
Summary cards: Pending 4 · Changes requested 2 · Approved this month 11 · Average turnaround 1.4 days.
Desktop: table with columns Client business, Employee, Case ref, Category, Current step (mini stepper), Sent for review (relative time), Status badge. Rows:
- Kasi Kitchen · Lerato Khumalo · FS-2026-0014 · Dishonesty · Investigation · 2 hours ago · Pending
- Ubuntu Guard Security (Durban) · Mpho Sithole · FS-2026-0021 · Sleeping on duty · Outcome · yesterday · Pending
- Ezulwini Spaza & Groceries (Soweto) · Thandeka Nkosi · FS-2026-0018 · Absence (3 days) · Notice · 2 days ago · Pending
- Bakwena Build Contractors (Rustenburg) · Pieter Botha · FS-2026-0016 · Safety violation · Hearing · 3 days ago · Overdue (warning)
Mobile: cards stacked, each with client name, employee, mini stepper and status.
Clients sidebar list (desktop) with business names and open case counts.
```

## 10 · Consultant case review

```
Using the FairStep design system, design the consultant's Case review screen. Generate a mobile (390px) and a desktop (1440px) version.

Case: FS-2026-0021 · Mpho Sithole (Security officer) · Sleeping on duty · Ubuntu Guard Security. Sent for review by owner Grace Naidoo yesterday 15:20.

Layout desktop: left 65% read-only case (stepper at top showing all steps done up to Outcome; collapsible sections: Incident with evidence thumbnails (2 photos), Investigation findings, Notice of hearing (PDF chip), Hearing record including employee's response, Proposed outcome: "Final written warning, valid 12 months"). Right 35% sticky review panel.
Review panel: procedural checklist auto-filled with ticks (all steps completed in order ✓, 3 working days' notice ✓, impartial chairperson ✓, employee response recorded ✓); comment thread (Grace Naidoo: "Please check the outcome wording before I issue it." · yesterday); comment box; two buttons: "Request changes" (secondary, warning style) and "Approve and sign off" (primary). Note under buttons: "Your decision is recorded on the case timeline."
Mobile: case content first, review panel becomes a sticky bottom sheet with "Review" button that expands.
Consultants cannot edit or delete case facts — show fields as read-only with no edit icons.
```

## 11 · Admin overview

```
Using the FairStep design system, design the platform Admin overview. Generate a mobile (390px) and a desktop (1440px) version.

Logged-in user: FairStep Admin. Navigation: Overview (active), Businesses, Users, Consultant assignments.
Stat cards: Businesses 24 · Active users 61 · Open cases 37 · Cases awaiting review 9 · Avg. review turnaround 1.6 days.
A simple bar chart "Cases by step" (Incident 6, Investigation 9, Notice 7, Hearing 8, Outcome 5, Appeal 2) in teal tones.
Table "Businesses": Name, Sector, Province, Plan badge, Employees, Assigned consultant, Open cases. Rows: Kasi Kitchen · Restaurant · Western Cape · Growth · 14 · Naledi Dlamini · 3; Ubuntu Guard Security · Security · KwaZulu-Natal · Growth · 38 · Naledi Dlamini · 4; Ezulwini Spaza & Groceries · Retail · Gauteng · Starter · 6 · Naledi Dlamini · 1; Bakwena Build Contractors · Construction · North West · Growth · 27 · Unassigned (warning badge) · 2.
"Assign consultant" modal example: select business, select consultant, confirm button.
Note: admins see counts, not employee personal details (POPIA).
Mobile: stat cards 2-column grid, table becomes cards.
```
