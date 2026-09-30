# Video F — Platform Administrator (Super Admin) Demo

> **⚠️ REFERENCE DOCUMENT — not the recording instructions.** **RECORD FROM `RECORDING_RUNBOOK.md` ONLY.** Where this file differs from the runbook, follow the runbook. Recording day: **Saturday 10 October 2026**.

> **Why this is the "Staff / Administrator" video.** Arogyix has no general "Staff" role. Hospital staff are Receptionists, Doctors and extra Hospital Admins, and each has its own video (B, C, D). The remaining administrator role is the **Super Admin**, the Arogyix platform team, so this video covers that role. An appendix covers the **Referral Partner** role, which only the Super Admin manages.

| | |
|---|---|
| **Duration** | 4:40 (plus an optional 2:00 appendix) |
| **Target audience** | Arogyix internal operations and onboarding staff (internal training) |
| **Objective** | Take a new hospital from application to live tenant, then monitor tenants, users and subscription revenue |
| **Starting screen** | Landing page `/` → Register Your Clinic / Hospital form |
| **Ending screen** | Revenue Analytics |
| **Main workflow** | Applicant submits request → Super Admin approves → temporary password handed over |
| **Must show** | Landing page request form, Super Admin Portal (stats and requests), the Approve modal, Hospitals, Platform Users, Revenue Analytics |
| **Can skip** | Settings, Notifications, the Patients and Appointments stat-card links |
| **Narration style** | Internal and matter-of-fact. Name each step exactly |
| **Login used** | `superadmin@Arogyix.health` / `Password123!` |
| **Data** | `DEMO_DATA.md` §7 |

**Before recording**
- The request "Test Clinic Duplicate" is pending (to show **Reject**).
- Sahyadri Care Clinic does **not** exist yet.
- Revenue Analytics only has data if at least one tenant has an active Razorpay subscription (test mode). Otherwise the charts show "No active subscriptions yet". Decide in advance whether to show or skip Scene 08.

---

## Storyboard

### Scene 01 — Introduction
**Time:** 00:00–00:15 · *Story step 1*

- **Screen:** Title card
- **Purpose:** Introduce the role
- **User action:** None
- **On-screen action:** "Arogyix Platform Administration"
- **Voiceover:** "This video is for the Arogyix platform team. You'll see how a new hospital joins the platform, how you approve it, and how you monitor every hospital, pharmacy and lab on Arogyix."
- **Highlight:** None
- **Transition:** Fade to the landing page
- **Expected result:** The viewer knows this is internal

**Recording checklist**
1. Title card only.

### Scene 02 — A hospital applies
**Time:** 00:15–01:05 · *Story step 5: Primary workflow (1/3)*

- **Screen:** Landing page → pricing → Register Your Clinic / Hospital
- **Purpose:** Show where requests come from
- **User action:** Click the **Professional** plan card, fill in the form, click **Submit Registration Request**
- **On-screen action:** "Selected plan: Professional"; "Request Received!"
- **Voiceover:** "Hospitals apply from the Arogyix website. They choose a plan, then fill in the registration form with the clinic name, the administrator's name and email, and optionally their location and a referral code. When they submit, the request arrives in the platform team's queue. Pharmacies and labs have similar registration pages of their own."
- **Highlight:** Zoom on "Selected plan: Professional"
- **Transition:** Cut to login
- **Expected result:** The viewer understands where requests come from

**Recording checklist**
1. Open `/` in a clean, logged-out window. Scroll slowly to **Simple, transparent pricing**.
2. Click the **Professional** card's button. Check for "Selected plan: Professional".
3. Scroll to **Register Your Clinic / Hospital**.
4. Clinic Name `Sahyadri Care Clinic`; Admin First/Last `Kiran` / `Pawar`; Admin Email `kiran.pawar@example.com`; Phone `9800000701`; Street `18 College Road`; City `Nashik`; State `Maharashtra`.
5. Click **Submit Registration Request**. Pause 2 s on "Request Received!".

### Scene 03 — Login
**Time:** 01:05–01:15 · *Story step 2*

- **Screen:** Login
- **Purpose:** Show entry
- **User action:** Sign in as Super Admin
- **On-screen action:** Super Admin Portal
- **Voiceover:** "Platform administrators sign in on the same login page and land on the Super Admin Portal."
- **Highlight:** None
- **Transition:** Cut
- **Expected result:** Logged in

**Recording checklist**
1. `/login` → `superadmin@Arogyix.health` → **Sign In**. The URL is `/dashboard/super-admin`.

### Scene 04 — Super Admin Portal
**Time:** 01:15–01:40 · *Story step 3*

- **Screen:** Super Admin Portal
- **Purpose:** The platform overview
- **User action:** Hover the stat cards
- **On-screen action:** Total Hospitals, Total Pharmacies, Total Labs, Total Patients, Platform Users, Total Appointments, Pending Referrals
- **Voiceover:** "The portal shows the size of the platform: hospitals, pharmacies, labs, patients, users, appointments, and referral partners waiting for review. Below that are the registration requests."
- **Highlight:** Zoom on the stat row
- **Transition:** Scroll to the requests
- **Expected result:** The viewer sees platform scale

**Recording checklist**
1. Hover each card, left to right. Don't click Total Patients or Total Appointments.

### Scene 05 — Approve or reject requests
**Time:** 01:40–02:35 · *Story step 5: Primary workflow (2/3, 3/3)*

- **Screen:** Hospital Registration Requests (Pending tab) → approval modal
- **Purpose:** Onboard the tenant
- **User action:** Review Sahyadri Care Clinic, click **Approve**, copy the credentials, click **Done & Close**. Then **Reject** the duplicate
- **On-screen action:** Modal "Hospital Approved! Tenant & Admin Account Created" with Hospital Name, Admin Login Email and Temporary Password; the row moves to the Approved tab
- **Voiceover:** "Each request shows the organisation type, the plan they chose, the admin's details and location. Click Approve. Arogyix creates the hospital's workspace and its administrator account, then shows the login email and a temporary password. This is the only time the password is shown, so copy it and send it to the hospital administrator. If a request isn't genuine, or is a duplicate, click Reject."
- **Highlight:** A red box around "the temporary password will not be shown again"; blur the password value
- **Transition:** Click **Hospitals** in the sidebar
- **Expected result:** A new tenant is live, and the viewer knows to hand over the credentials manually

**Recording checklist**
1. On the **Pending** tab, hover the Sahyadri Care Clinic row: Type, Plan, Admin details, Location, Submitted On.
2. Click **Approve** (tooltip "Approve Hospital Node").
3. Click the copy icon next to **Temporary Password**. Check for the "Password copied to clipboard!" toast.
4. Pause 3 s on the modal, then click **Done & Close**.
5. On "Test Clinic Duplicate", click **Reject**. Check for the "Registration request rejected" toast.
6. Click the **Approved** tab to show Sahyadri Care Clinic there.
7. Blur the password in the edit. Don't say it's emailed (gap G13).

### Scene 06 — Hospitals (all tenants)
**Time:** 02:35–03:05 · *Story step 7: Important features*

- **Screen:** Hospitals
- **Purpose:** Tenant management
- **User action:** Scroll the table and hover the status toggle
- **On-screen action:** Hospital Info, Type, Slug / Domain, Contacts, Sub-records, Subscription, Status, Registered On
- **Voiceover:** "Hospitals lists every organisation on the platform (hospitals, pharmacies and labs) with their contacts, how many staff, patients and appointments they have, their subscription, and whether they're active. You can deactivate an organisation from here if needed."
- **Highlight:** The Sub-records and Subscription columns; the Status toggle
- **Transition:** Back to the portal → **Platform Users** card
- **Expected result:** The viewer can find and control any tenant

**Recording checklist**
1. Open `/dashboard/hospitals`. Point at Sahyadri Care Clinic.
2. Hover the Status toggle for Test Clinic or another demo tenant. **Don't click it** on Arogyix Multispeciality Hospital.
3. Optional: open `/dashboard/hospitals?type=PHARMACY` from the Total Pharmacies card.

### Scene 07 — Platform Users
**Time:** 03:05–03:25 · *Story step 7*

- **Screen:** Platform Users
- **Purpose:** Find users across tenants
- **User action:** Search "kiran"
- **On-screen action:** Kiran Pawar · HOSPITAL_ADMIN · Sahyadri Care Clinic
- **Voiceover:** "Platform Users lists every account across all organisations, with their role and which organisation they belong to. Use it to answer support questions quickly."
- **Highlight:** The Role and Tenant columns
- **Transition:** Click **Revenue Analytics**
- **Expected result:** The viewer can look up any user

**Recording checklist**
1. Super Admin Portal → **Platform Users** card.
2. Type `kiran` in "Search users by name or email...". Pause 2 s.

### Scene 08 — Revenue Analytics
**Time:** 03:25–04:00 · *Story step 7*

- **Screen:** Revenue Analytics
- **Purpose:** Subscription business health
- **User action:** Scroll the charts
- **On-screen action:** Current MRR, Active Subscriptions, Plan Tiers in Use; MRR by Month; MRR by Plan Tier; Subscription Status Breakdown
- **Voiceover:** "Revenue Analytics tracks the subscription business: current monthly recurring revenue, active subscriptions, revenue by month and by plan, and the status of every subscription."
- **Highlight:** Zoom on Current MRR
- **Transition:** Click **Referral Signups** (or go to the summary)
- **Expected result:** The viewer knows where business metrics are

**Recording checklist**
1. Open `/dashboard/super-admin/analytics`.
2. If you see "No active subscriptions yet", keep this scene to 10 s and say "as hospitals subscribe, this fills in".

### Scene 09 — Referral partners (short)
**Time:** 04:00–04:25 · *Story step 6: Secondary workflow*

- **Screen:** Referral Signups
- **Purpose:** Partner programme overview
- **User action:** Show a pending partner; hover **Approve**, **KYC** and **Record Payout**
- **On-screen action:** Applicant, Referral Code, Commission, KYC, Payout columns
- **Voiceover:** "Referral partners bring new hospitals, pharmacies and labs to Arogyix. Here you approve partners, review their ID documents, set their commission rate, and record payouts."
- **Highlight:** The KYC column
- **Transition:** Fade to summary
- **Expected result:** The viewer knows the programme exists

**Recording checklist**
1. Open `/dashboard/super-admin/referrals`. Pause 2 s. Only click if the appendix is being recorded.

### Scene 10 — Summary
**Time:** 04:25–04:40 · *Story step 8*

- **Screen:** Super Admin Portal
- **Purpose:** Wrap up
- **User action:** None
- **On-screen action:** The portal with Total Hospitals up by one
- **Voiceover:** "A new hospital is now live on Arogyix. Its administrator can sign in, set up the hospital, and invite their team. That's covered in the Hospital Admin video."
- **Highlight:** The Total Hospitals card
- **Transition:** End card
- **Expected result:** The viewer sees the handoff

**Recording checklist**
1. Click **Dashboard**. Hold 3 s.

---

## Appendix — Referral Partner (optional, about 2:00)

| Time | Screen | Action | Voiceover |
|---|---|---|---|
| 00:00–00:30 | `/register/referral` | Fill in Your Details, Contact, Password → send code → enter **Verification Code** → submit → "Signup submitted!" | "Referral partners sign up on their own page and verify their email with a one-time code." |
| 00:30–00:50 | Super Admin → Referral Signups | Click **Approve** on Rohan Kulkarni. The toast shows the referral code | "The platform team approves the partner, and a referral code is created for them." |
| 00:50–01:25 | Log in as the partner → Referral Dashboard | Show "Your referral code is issued but can't be shared yet"; upload the dummy ID under **KYC Verification**; fill in **Payout Details** | "Before the code can be shared, the partner uploads a photo ID and adds their payout details." |
| 01:25–01:40 | Super Admin → Referral Signups | Click **Approve KYC** → toast "KYC approved — referral code is now active" | "Once the ID is approved, the code becomes active." |
| 01:40–02:00 | Referral Dashboard | Show Total Earned, Total Paid, Pending Balance, Payout History, Hospitals Referred, and the copy-code button | "Hospitals, pharmacies and labs enter this code when they register. Commission builds up automatically each time a referred organisation's subscription is charged, and payouts show up in the partner's history." |

Needs SMTP for the code (gap G7). Upload only a **fake** sample ID.

---

## Voiceover script (continuous)

> **[Intro]** This video is for the Arogyix platform team. You'll see how a new hospital joins the platform, how you approve it, and how you monitor every hospital, pharmacy and lab on Arogyix.
>
> **[Application]** Hospitals apply from the Arogyix website. They choose a plan, then fill in the registration form with the clinic name, the administrator's name and email, and optionally their location and a referral code. When they submit, the request arrives in the platform team's queue. Pharmacies and labs have similar registration pages of their own.
>
> **[Login]** Platform administrators sign in on the same login page and land on the Super Admin Portal.
>
> **[Portal]** The portal shows the size of the platform: hospitals, pharmacies, labs, patients, users, appointments, and referral partners waiting for review. Below that are the registration requests.
>
> **[Approve]** Each request shows the organisation type, the plan they chose, the admin's details and location. Click Approve. Arogyix creates the hospital's workspace and its administrator account, then shows the login email and a temporary password. This is the only time the password is shown, so copy it and send it to the hospital administrator. If a request isn't genuine, or is a duplicate, click Reject.
>
> **[Hospitals]** Hospitals lists every organisation on the platform (hospitals, pharmacies and labs) with their contacts, how many staff, patients and appointments they have, their subscription, and whether they're active. You can deactivate an organisation from here if needed.
>
> **[Users]** Platform Users lists every account across all organisations, with their role and which organisation they belong to. Use it to answer support questions quickly.
>
> **[Revenue]** Revenue Analytics tracks the subscription business: current monthly recurring revenue, active subscriptions, revenue by month and by plan, and the status of every subscription.
>
> **[Referrals]** Referral partners bring new hospitals, pharmacies and labs to Arogyix. Here you approve partners, review their ID documents, set their commission rate, and record payouts.
>
> **[Summary]** A new hospital is now live on Arogyix. Its administrator can sign in, set up the hospital, and invite their team. That's covered in the Hospital Admin video.
