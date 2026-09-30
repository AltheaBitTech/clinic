# Staff (Platform Administrator) — Recording Script

> **⚠️ REFERENCE DOCUMENT — not the recording instructions.** **RECORD FROM `RECORDING_RUNBOOK.md` ONLY.** Where this file differs from the runbook, follow the runbook. Recording day: **Saturday 10 October 2026**.

**Video:** Arogyix Platform Administration
**Target length:** 3:15
**Clip prefix:** `STF`
**Login:** `superadmin@Arogyix.health` / `Password123!` (display name Sameer Khan)
**Demo data:** `DEMO_DATA.md` §7 and §9

> **Which "staff" is this?** Arogyix has no role called "Staff". Hospital staff are Receptionists, Doctors and Hospital Admins, and each already has its own video. This video covers the remaining staff role: the **Super Admin**, the Arogyix platform operations team who approve and oversee every hospital, pharmacy and lab. This matches the choice made in `STAFF_DEMO_SCRIPT.md`. It's mainly for internal training and for showing prospects how onboarding works.

---

## The story

| | |
|---|---|
| **Who** | Sameer Khan, platform operations at Arogyix |
| **Why** | New hospitals apply to join Arogyix. Someone has to check each request, create the hospital's workspace, and keep an eye on the whole platform |
| **Problem** | Without a review step, duplicate or fake sign-ups would get straight in. Without a platform view, nobody can answer "how many hospitals do we have, and who is this user?" |
| **Action** | A new clinic, Sahyadri Care Clinic, applies from the Arogyix website. Sameer approves it, rejects a duplicate, and checks the tenant list, users and subscription revenue |
| **What happens next** | Sahyadri Care Clinic has its own workspace and an administrator login. Its admin, Kiran Pawar, can sign in and set up the hospital (that's the Admin video) |

```
Clinic applies on the website → request lands in the Super Admin queue → Sameer approves
   → hospital workspace + admin account created → temporary password handed over
   → duplicate request rejected → platform overview (hospitals, users, revenue)
```

---

## Video timeline

| Time | Scene | Section |
|---|---|---|
| 00:00–00:10 | 01 | Introduction |
| 00:10–00:55 | 02 | A clinic applies |
| 00:55–01:05 | 03 | Login |
| 01:05–01:25 | 04 | Super Admin Portal |
| 01:25–02:10 | 05 | Approve and reject |
| 02:10–02:35 | 06 | Hospitals |
| 02:35–02:50 | 07 | Platform Users |
| 02:50–03:05 | 08 | Revenue Analytics |
| 03:05–03:15 | 09 | Summary |

---

## Pre-recording checklist

| # | Item | Check |
|---|---|---|
| 1 | **Browser** | Google Chrome, two profiles: a **clean logged-out profile** for Scene 02 and the `SA` profile for Scenes 03–09. Extensions off, bookmarks bar hidden, password saving off |
| 2 | **URL** | Scene 02: `<your-app-url>/` (landing page). Scene 03: `<your-app-url>/login` |
| 3 | **Login account** | `superadmin@Arogyix.health` / `Password123!`. Display name changed to **Sameer Khan** in Settings → Personal Profile |
| 4 | **Demo data** | `DEMO_DATA.md` §7 open off camera |
| 5 | **Browser zoom** | 110% |
| 6 | **Screen resolution** | 1920×1080, browser maximised |
| 7 | **Notifications disabled** | Do Not Disturb on, Chrome notifications off |
| 8 | **Clean browser** | One tab per profile, download bar closed, page reloaded before the take |
| 9 | **No personal information** | Only demo values; the temporary password will be blurred |
| 10 | **Required demo records** | **Sahyadri Care Clinic does not exist** (no request, no tenant). A pending request **"Test Clinic Duplicate"** exists (submit it beforehand from the landing page with admin `duplicate.test@example.com`). Decide whether Scene 08 is shown: it needs at least one active Razorpay test subscription, otherwise it shows "No active subscriptions yet" |

---

## Recording sequence

Scene 01 → 02 (logged-out profile) → 03 → 04 → 05 → 06 → 07 → 08 → 09

---

# Scene 01

## Duration
00:00 - 00:10

## Purpose
Introduce the platform team's role.

## User Role
None (title card)

## URL / Route
None. Title card over a blurred still of `/dashboard/super-admin`.

## Starting Screen
Title card

## Action
1. No live action.

## Demo Data
None

## Expected Result
The viewer knows this is about how organisations join Arogyix.

## Voiceover
"Before a hospital can use Arogyix, it's reviewed and approved by the Arogyix platform team. Here's how that works."

## On-Screen Text
**Arogyix Platform Administration**

## Cursor / Highlight
None

## Zoom
None

## Pause
Hold the full 10 seconds.

## Transition
Cross-fade (0.5 s) to the landing page.

---

# Scene 02

## Duration
00:10 - 00:55

## Purpose
Show where registration requests come from.

## User Role
Public visitor (clinic applicant)

## URL / Route
`/` (landing page)

## Starting Screen
Landing page → **Simple, transparent pricing** → **Register Your Clinic / Hospital**

## Action
1. Scroll slowly to the pricing section.
2. On the **Professional** card, click **Get Started**.
3. Check the form shows "Selected plan: Professional".
4. **1. Clinic Details**: clinic name `Sahyadri Care Clinic`.
5. **2. Administrator Information**: first name `Kiran`, last name `Pawar`, email `kiran.pawar@example.com`, phone `9800000701`.
6. **Street Address** `18 College Road`, **City** `Nashik`, **State / Province** `Maharashtra`. Leave the referral code empty.
7. Click **Submit Registration Request**.

## Demo Data
`DEMO_DATA.md` §7, "New hospital request".

## Expected Result
The form shows **Request Received!**

## Voiceover
"A new clinic, Sahyadri Care Clinic, applies from the Arogyix website. They pick a plan and give their clinic and administrator details. The request goes to the platform team for review."

## On-Screen Text
Lower-third: **Kiran Pawar · Clinic applicant**

## Cursor / Highlight
Cyan box around "Selected plan: Professional".

## Zoom
Zoom to 125% on the form while typing.

## Pause
2 seconds on **Request Received!**

## Transition
Speed up typing (steps 4–6) to 2–3× in the edit. Hard cut to the login page in the `SA` profile.

---

# Scene 03

## Duration
00:55 - 01:05

## Purpose
Show the platform team's sign-in.

## User Role
Super Admin

## URL / Route
`/login` → `/dashboard/super-admin`

## Starting Screen
Login page

## Action
1. Type `superadmin@Arogyix.health` in **Email address**.
2. Type the password.
3. Click **Sign In**.

## Demo Data
`superadmin@Arogyix.health` / `Password123!`

## Expected Result
The **Super Admin Portal** opens.

## Voiceover
"Sameer, from the Arogyix operations team, signs in to the Super Admin Portal."

## On-Screen Text
Lower-third: **Sameer Khan · Arogyix Platform Team**

## Cursor / Highlight
Highlight **Sign In** before the click.

## Zoom
None

## Pause
1 second after load.

## Transition
Hard cut on load.

---

# Scene 04

## Duration
01:05 - 01:25

## Purpose
Show the size of the platform at a glance.

## User Role
Super Admin

## URL / Route
`/dashboard/super-admin`

## Starting Screen
**Super Admin Portal**

## Action
1. Hover **Total Hospitals**, **Total Pharmacies**, **Total Labs**, **Platform Users** and **Pending Referrals**, left to right.
2. Scroll down to **Hospital Registration Requests**.

## Demo Data
None

## Expected Result
The stat cards show platform totals. The requests table is visible on the **Pending** tab.

## Voiceover
"The portal shows every hospital, pharmacy and lab on the platform, and the total number of users. Below are the registration requests waiting for review."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around the stat row.

## Zoom
Zoom to 120% on the stat row.

## Pause
1 second on the requests table.

## Transition
Stay on the page. Continue into Scene 05.

> Don't hover or click **Total Patients** or **Total Appointments**.

---

# Scene 05

## Duration
01:25 - 02:10

## Purpose
Approve a genuine request, and reject a duplicate.

## User Role
Super Admin

## URL / Route
`/dashboard/super-admin`

## Starting Screen
**Hospital Registration Requests**, **Pending** tab

## Action
1. Hover the Sahyadri Care Clinic row: **Type**, **Plan**, **Admin details**, **Location**, **Submitted On**.
2. Click **Approve**.
3. The **Hospital Approved!** dialog opens ("Tenant & Admin Account Created"). Pause on **Hospital Name**, **Admin Login Email** and **Temporary Password**.
4. Click the copy icon next to **Temporary Password**. Toast: "Password copied to clipboard!".
5. Click **Done & Close**.
6. On **Test Clinic Duplicate**, click the reject button (tooltip "Reject Request"). Toast: "Registration request rejected".
7. Click the **Approved** tab to show Sahyadri Care Clinic there.

## Demo Data
Sahyadri Care Clinic (approve); Test Clinic Duplicate (reject).

## Expected Result
Sahyadri Care Clinic moves to **Approved**. Its workspace and admin account exist. The duplicate moves to **Rejected**.

## Voiceover
"Sameer checks the request and approves it. Arogyix creates the clinic's own workspace and an administrator account in one step. The temporary password is shown only once, so he copies it and passes it to the clinic's administrator. A duplicate request is simply rejected."

## On-Screen Text
Feature title (3 s): **Onboarding Approval**

## Cursor / Highlight
**Red** box around "the temporary password will not be shown again". Cyan box around the **Approved** tab at the end.

## Zoom
Zoom to 130% on the **Hospital Approved!** dialog.

## Pause
3 seconds on the dialog.

## Transition
**Blur the Temporary Password** in the edit. Click **Hospitals** in the sidebar. Hard cut.

> Don't say the password is emailed. It's shown once and handed over manually.

---

# Scene 06

## Duration
02:10 - 02:35

## Purpose
Show every organisation on the platform in one list.

## User Role
Super Admin

## URL / Route
`/dashboard/hospitals`

## Starting Screen
Hospitals

## Action
1. Point at **Sahyadri Care Clinic** in the list.
2. Hover the **Type**, **Sub-records** and **Subscription** columns.
3. Hover the **Status** toggle on Sahyadri Care Clinic **without clicking it**.

## Demo Data
Tenants T-01, T-02, T-03 and Sahyadri Care Clinic.

## Expected Result
The new clinic is listed as active alongside the hospital, pharmacy and lab.

## Voiceover
"Every hospital, pharmacy and lab is listed here, with its contacts, size, subscription and status. An organisation can be deactivated from here if needed."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around the Sahyadri Care Clinic row.

## Zoom
Zoom to 120% on the row.

## Pause
1.5 seconds on the row.

## Transition
Click **Dashboard**, then the **Platform Users** card. Hard cut.

---

# Scene 07

## Duration
02:35 - 02:50

## Purpose
Find any user across the platform.

## User Role
Super Admin

## URL / Route
`/dashboard/super-admin/users`

## Starting Screen
**Platform Users**

## Action
1. Type `kiran` in "Search users by name or email...".
2. Point at Kiran Pawar's **Role** and **Tenant**.

## Demo Data
U-APP, Kiran Pawar.

## Expected Result
Kiran Pawar appears as a Hospital Admin of Sahyadri Care Clinic.

## Voiceover
"Platform Users finds any account across all organisations, with its role and organisation. Kiran is now Sahyadri Care Clinic's administrator."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around the **Role** and **Tenant** cells.

## Zoom
Zoom to 125% on the result row.

## Pause
1.5 seconds on the row.

## Transition
Click **Revenue Analytics** in the sidebar. Hard cut.

---

# Scene 08

## Duration
02:50 - 03:05

## Purpose
Show the subscription business view.

## User Role
Super Admin

## URL / Route
`/dashboard/super-admin/analytics`

## Starting Screen
Revenue Analytics

## Action
1. Hover **Current MRR**, **Active Subscriptions** and **Plan Tiers in Use**.
2. Scroll slowly past the MRR charts.

## Demo Data
Any active test-mode subscriptions.

## Expected Result
The cards and charts show data. If the page says "No active subscriptions yet", use the alternative voiceover and keep the scene to 8 seconds.

## Voiceover
"Revenue Analytics tracks monthly recurring revenue, active subscriptions and which plans are in use."

*Alternative (no subscriptions yet):* "As organisations subscribe, Revenue Analytics tracks monthly recurring revenue and plan usage."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around **Current MRR**.

## Zoom
Zoom to 120% on the summary cards.

## Pause
1 second on the charts.

## Transition
Click **Dashboard**. Cross-fade (0.5 s).

---

# Scene 09

## Duration
03:05 - 03:15

## Purpose
Close and hand over to the hospital admin story.

## User Role
Super Admin

## URL / Route
`/dashboard/super-admin`

## Starting Screen
**Super Admin Portal**

## Action
1. Wait for the portal. Park the cursor on **Total Hospitals**.

## Demo Data
None

## Expected Result
**Total Hospitals** has increased by one.

## Voiceover
"Sahyadri Care Clinic is live. Its administrator can now sign in and set up the hospital."

## On-Screen Text
End card: **Next: Setting up the hospital**

## Cursor / Highlight
Cyan box around **Total Hospitals**.

## Zoom
None

## Pause
3 seconds on the final frame.

## Transition
Fade to the end card (1 s).

---

## Post-recording checklist

- [ ] No accidental clicks (especially the **Status** toggle on any tenant)
- [ ] No personal information: the Temporary Password is **blurred**
- [ ] No browser errors or red toasts
- [ ] No loading screens left in the cut ("Loading platform users…" trimmed)
- [ ] No irrelevant screens (no Total Patients / Total Appointments drill-downs)
- [ ] No developer tools visible
- [ ] No console errors visible
- [ ] Cursor movement is smooth
- [ ] Narration matches the screen; nothing says credentials are emailed
- [ ] Transitions are clean
