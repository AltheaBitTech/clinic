# Hospital Admin — Recording Script

> **⚠️ REFERENCE DOCUMENT — not the recording instructions.** **RECORD FROM `RECORDING_RUNBOOK.md` ONLY.** Where this file differs from the runbook, follow the runbook. Recording day: **Saturday 10 October 2026**.

**Video:** Arogyix for Hospital Administrators
**Target length:** 4:35
**Clip prefix:** `ADM`
**Login:** `admin@Arogyix.health` / `Password123!` (display name Meera Joshi)
**Demo data:** `DEMO_DATA.md` §1, §2 and §9

---

## The story

| | |
|---|---|
| **Who** | Meera Joshi, administrator of Arogyix Multispeciality Hospital |
| **Why** | She is responsible for how the hospital runs: who works there, which doctors can be booked and when, which partners it works with, and how it's performing |
| **Problem** | Staff accounts shared or handed out on paper, doctors' timings kept in a register, no link to outside pharmacies and labs, and no single view of the numbers |
| **Action** | She reviews today's dashboard, adds a new Orthopedics department, invites a new orthopedic surgeon, configures his consulting profile, checks the partner pharmacy and lab, and exports a revenue report |
| **What happens next** | Dr. Rohit Deshpande can now be booked by the front desk and by patients, in his real slots only. Prescriptions and lab orders can flow to the partners. The numbers are ready for management |

```
Morning dashboard → new department (Orthopedics) → invite Dr. Rohit Deshpande → he activates his account
   → Meera configures his fee, slot length, hours and days → he's bookable
   → partner pharmacy and lab connected → analytics and revenue report
```

---

## Video timeline

| Time | Scene | Section |
|---|---|---|
| 00:00–00:12 | 01 | Introduction |
| 00:12–00:25 | 02 | Login |
| 00:25–00:50 | 03 | Hospital dashboard |
| 00:50–01:15 | 04 | Add a department |
| 01:15–01:45 | 05 | Invite a doctor |
| 01:45–02:05 | 06 | The doctor activates his account |
| 02:05–02:50 | 07 | Configure the doctor's profile |
| 02:50–03:05 | 08 | Medicines catalog |
| 03:05–03:35 | 09 | Partner pharmacy and lab |
| 03:35–04:10 | 10 | Analytics and reports |
| 04:10–04:20 | 11 | Hospital branding |
| 04:20–04:35 | 12 | Summary |

---

## Pre-recording checklist

| # | Item | Check |
|---|---|---|
| 1 | **Browser** | Google Chrome, the `Admin` profile. Extensions off, bookmarks bar hidden, password saving off. A **second, clean Chrome profile or incognito window** is ready for Scene 06 |
| 2 | **URL** | `<your-app-url>/login` in a single tab |
| 3 | **Login account** | `admin@Arogyix.health` / `Password123!`. Display name already changed to **Meera Joshi** in Settings → Personal Profile |
| 4 | **Demo data** | `DEMO_DATA.md` §2 (department, Dr. Rohit Deshpande's profile) open off camera |
| 5 | **Browser zoom** | 110% |
| 6 | **Screen resolution** | 1920×1080, browser maximised |
| 7 | **Notifications disabled** | Do Not Disturb on, Chrome notifications off |
| 8 | **Clean browser** | One tab, download bar closed, page reloaded before the take |
| 9 | **No personal information** | Only demo values; invite link tokens will be blurred in the edit |
| 10 | **Required demo records** | Hospital renamed **Arogyix Multispeciality Hospital** with a logo. Departments Cardiology, General Medicine, Pediatrics exist; **Orthopedics does not**. `rohit.deshpande@example.com` has **not** been invited yet. Dr. Amit Patil and Dr. Sneha Kulkarni configured. Wellness Pharmacy and CarePlus Diagnostics connected. Warm-up data exists so charts aren't empty |

> **Best time to record:** Scenes 01–09 in the morning of day D. Scene 10 (Analytics) looks best **at the end of day D**, after Rahul's visit has been billed. Record it separately and join it in the edit.

---

## Recording sequence

Scene 01 → 02 → 03 → 04 → 05 → 06 (second window) → 07 → 08 → 09 → *(later on day D)* 10 → 11 → 12

---

# Scene 01

## Duration
00:00 - 00:12

## Purpose
Introduce the administrator's role.

## User Role
None (title card)

## URL / Route
None. Title card over a blurred still of `/dashboard/hospital`.

## Starting Screen
Title card

## Action
1. No live action.

## Demo Data
None

## Expected Result
The viewer knows this video is about running the hospital.

## Voiceover
"Meera runs Arogyix Multispeciality Hospital. Let's see how she sets it up and keeps track of it."

## On-Screen Text
**Arogyix for Hospital Administrators**
Subtitle: *Set up once. See everything.*

## Cursor / Highlight
None

## Zoom
None

## Pause
Hold the full 12 seconds.

## Transition
Cross-fade (0.5 s) to the login page.

---

# Scene 02

## Duration
00:12 - 00:25

## Purpose
Show the administrator's sign-in.

## User Role
Hospital Admin

## URL / Route
`/login` → `/dashboard/hospital`

## Starting Screen
Login page ("Welcome back")

## Action
1. Type `admin@Arogyix.health` in **Email address**.
2. Type the password.
3. Click **Sign In**.

## Demo Data
`admin@Arogyix.health` / `Password123!`

## Expected Result
The Hospital Dashboard opens and greets Meera.

## Voiceover
"Every member of the hospital signs in on the same page. Arogyix recognises Meera as the administrator and opens her dashboard."

## On-Screen Text
Lower-third: **Meera Joshi · Hospital Administrator**

## Cursor / Highlight
Highlight **Sign In** before the click.

## Zoom
None

## Pause
1 second after load.

## Transition
Hard cut on load.

---

# Scene 03

## Duration
00:25 - 00:50

## Purpose
Show the hospital's day at a glance.

## User Role
Hospital Admin

## URL / Route
`/dashboard/hospital`

## Starting Screen
Hospital Dashboard

## Action
1. Hover the four stat cards, 1 second each: **Today's Appointments**, **Total Patients**, **Active Doctors**, **Today's Revenue**.
2. Scroll slowly (about 300 px) to **Missed Follow-ups** and **Today's Appointment Status**. Pause 2 seconds.
3. Scroll to **Recently Registered Patients**, then back to the top.

## Demo Data
Warm-up data from `DEMO_DATA.md` §3.

## Expected Result
All cards show numbers; no "Couldn't load dashboard data" errors.

## Voiceover
"Her dashboard shows today's appointments, total patients, active doctors and today's revenue. Below, she can see patients who missed a follow-up, today's appointments by status, and the newest registrations."

## On-Screen Text
Feature title (3 s): **Hospital Dashboard**

## Cursor / Highlight
Cyan box around the four stat cards, then **Missed Follow-ups**.

## Zoom
Zoom to 125% on the stat cards; back to 100% before scrolling.

## Pause
2 seconds on **Missed Follow-ups**.

## Transition
Click **Departments** in the sidebar. Hard cut.

---

# Scene 04

## Duration
00:50 - 01:15

## Purpose
Create the new department the orthopedic surgeon will belong to.

## User Role
Hospital Admin

## URL / Route
`/dashboard/departments`

## Starting Screen
Departments

## Action
1. Pause 1 second on the existing departments (Cardiology, General Medicine, Pediatrics).
2. Click **Add Department**.
3. In **Create Department**, type **Department Name** `Orthopedics`.
4. Type **Description** `Bone, joint and spine care, fractures and sports injuries.`
5. Leave **Status** as Active. Click **Save**.

## Demo Data
DEP-04.

## Expected Result
"Department created successfully!" Orthopedics appears in the list as Active.

## Voiceover
"The hospital is adding an orthopedic service. Meera creates an Orthopedics department, so the new surgeon can be listed under it and patients can find him."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around the new Orthopedics card.

## Zoom
Zoom to 130% on the **Create Department** dialog.

## Pause
1.5 seconds after the toast.

## Transition
Click **Staff** in the sidebar. Hard cut.

---

# Scene 05

## Duration
01:15 - 01:45

## Purpose
Invite a new doctor without the admin ever handling his password.

## User Role
Hospital Admin

## URL / Route
`/dashboard/staff`

## Starting Screen
**Staff & Access Control**

## Action
1. Pause 1 second on the staff list and role filters.
2. Click **Invite Staff**.
3. **Email Address**: `rohit.deshpande@example.com`.
4. **Staff Role**: Consulting Doctor.
5. Click **Generate Invite Link**.
6. Wait for **Registration Link Generated**. Pause 2 seconds.
7. Click the copy icon. Toast: "Registration link copied!".
8. Click **Close Portal**.

## Demo Data
U-DOC3, Dr. Rohit Deshpande.

## Expected Result
A registration link is shown and copied.

## Voiceover
"Next, she invites the new surgeon, Dr. Rohit Deshpande. She enters his email and his role, and Arogyix creates a secure registration link, valid for seven days. She sends it to him, and he sets his own password."

## On-Screen Text
Feature title (3 s): **Staff Onboarding**

## Cursor / Highlight
Cyan box around **Staff Role**, then the generated link.

## Zoom
Zoom to 130% on the invite dialog.

## Pause
2 seconds on the generated link.

## Transition
**Blur the token** in the link in the edit. Cut to the second browser window.

> Don't say the link is emailed automatically. The admin copies and sends it.

---

# Scene 06

## Duration
01:45 - 02:05

## Purpose
Show the new staff member's side of the invitation.

## User Role
Doctor (new, not yet active)

## URL / Route
`/register?token=…` ("Activate your account")

## Starting Screen
**Activate your account** — "You were invited to join a hospital team"

## Action
1. In the second window (a clean profile or incognito), paste the copied link and press Enter.
2. **First name** `Rohit`, **Last name** `Deshpande`.
3. **Password** `Demo@12345`.
4. Click **Activate Account**.
5. Wait for the doctor dashboard, pause 1 second, then close the window.

## Demo Data
U-DOC3.

## Expected Result
The account is activated and the new doctor lands on his dashboard.

## Voiceover
"Dr. Deshpande opens the link, enters his name and chooses a password. His role and hospital are already set by the invitation."

## On-Screen Text
Small caption (3 s): *Dr. Rohit Deshpande's screen*

## Cursor / Highlight
Cyan box around "You were invited to join a hospital team".

## Zoom
Zoom to 120% on the form.

## Pause
1 second on the new dashboard.

## Transition
**Crop or blur the address bar** (it contains the token). Cut back to Meera's window, then click **Doctors** in the sidebar.

---

# Scene 07

## Duration
02:05 - 02:50

## Purpose
Configure the doctor's profile so he becomes bookable, with the right fee and hours.

## User Role
Hospital Admin

## URL / Route
`/dashboard/doctors` → `/dashboard/doctors/new`

## Starting Screen
Doctors Directory → **Configure Doctor Profile**

## Action
1. Pause 1 second on Dr. Amit Patil's and Dr. Sneha Kulkarni's cards.
2. Click **Configure Doctor Profile**.
3. Choose **Rohit Deshpande** from the user list.
4. **Specialization** `Orthopedic Surgeon`. **Department** Orthopedics.
5. **Qualifications** `MBBS, MS (Ortho)`. **Medical Reg No.** `MMC-2013-52290`. **Experience (Years)** `12`.
6. **Consultation Fee (INR)** `700`. **Slot Duration (Minutes)** `20`. **Start** `11:00`. **End** `18:00`.
7. **Bio / Details**: `Orthopedic surgeon for joint pain, fractures and sports injuries.`
8. **Weekly Availability** (starts at Mon–Fri): untick Tuesday and Thursday, and tick Saturday, so Mon, Wed, Fri and Sat are ticked.
9. Click **Save Profile**.

## Demo Data
DOC-03 in `DEMO_DATA.md` §2 and §9.4.

## Expected Result
"Doctor profile configured successfully!" Dr. Rohit Deshpande's card appears with his fee, experience and timings.

## Voiceover
"One more step makes him bookable. Meera sets his specialization, department and registration number, then his consultation fee, how long each appointment lasts, his consulting hours and the days he works. From now on, only these real time slots are offered when anyone books him."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around **Consultation & Scheduling**, then **Weekly Availability**.

## Zoom
Zoom to 130% on **Consultation & Scheduling** and **Weekly Availability**.

## Pause
1.5 seconds on the new doctor card.

## Transition
Speed up steps 4–5 and 7 to 2× in the edit. Click **Medicines Catalog** in the sidebar. Hard cut.

---

# Scene 08

## Duration
02:50 - 03:05

## Purpose
Show the hospital's prescribing catalog.

## User Role
Hospital Admin

## URL / Route
`/dashboard/medicines`

## Starting Screen
**Medicines & Ointments Catalog**

## Action
1. Pause on the **Oral Medicines** tab (six prep items).
2. Click **Topical Ointments** for 1 second, then back to **Oral Medicines**.
3. Hover **Add Medicine** without clicking.

## Demo Data
CAT-H.

## Expected Result
The catalog shows default dosage, frequency and timing for each item.

## Voiceover
"The medicines catalog holds what the hospital's doctors prescribe most, with default dosage and timing. It powers the suggestions doctors see when writing prescriptions."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around the default frequency and timing columns.

## Zoom
Zoom to 120% on the table.

## Pause
1 second on the table.

## Transition
Click **Pharmacies** in the sidebar. Hard cut.

---

# Scene 09

## Duration
03:05 - 03:35

## Purpose
Show the hospital's connected partner network.

## User Role
Hospital Admin

## URL / Route
`/dashboard/pharmacies` then `/dashboard/pathology-labs`

## Starting Screen
Pharmacies

## Action
1. Hover the **Wellness Pharmacy** card (with "Home Delivery Available").
2. Hover **Invite Pharmacy** without clicking.
3. Click **Pathology Labs** in the sidebar.
4. Hover the **CarePlus Diagnostics** card and its active link status.
5. Hover **Invite Pathology Lab** without clicking.

## Demo Data
T-02 and T-03.

## Expected Result
Both partners are visible and connected.

## Voiceover
"Arogyix also connects the hospital to its partners. Wellness Pharmacy receives prescriptions directly from the hospital's doctors, and CarePlus Diagnostics receives their test orders. New partners can be invited to join with a link."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around the Wellness Pharmacy card, then the CarePlus card.

## Zoom
Zoom to 125% on each card.

## Pause
1 second on each card.

## Transition
Hard cut to Scene 10 (recorded at the end of day D).

> Don't click **Deactivate** on the pharmacy or **Revoke** on the lab.

---

# Scene 10

## Duration
03:35 - 04:10

## Purpose
Show how management tracks performance and exports reports.

## User Role
Hospital Admin

## URL / Route
`/dashboard/analytics`

## Starting Screen
**Analytics Dashboard**

## Action
1. Pause about 2 seconds on each chart (appointments over the last 7 days, consultations by department, billing over the last 6 months).
2. Scroll to **Reports**.
3. Open the report type list and choose **Revenue Report**.
4. Choose the date preset **Today** (or **This Month** if you want a fuller table).
5. Click **Export**. Show the download for 1 second, then hide the download bar.

## Demo Data
The day's billing, including Rahul's ₹800.

## Expected Result
The Revenue Report table lists today's invoices, including Rahul Sharma's. A CSV downloads.

## Voiceover
"Analytics shows how the hospital is doing: appointments this week, consultations by department, and billing over six months. Detailed reports on revenue, appointments, prescriptions, follow-ups and lab orders can be filtered, printed or exported."

## On-Screen Text
Feature title (3 s): **Analytics & Reports**

## Cursor / Highlight
Cyan box around the report type selector, then **Export**.

## Zoom
Zoom to 125% on the report table and **Export**.

## Pause
1.5 seconds on the report table.

## Transition
Click **Settings** in the sidebar. Hard cut.

---

# Scene 11

## Duration
04:10 - 04:20

## Purpose
Show where the hospital's branding and plan live.

## User Role
Hospital Admin

## URL / Route
`/dashboard/settings`

## Starting Screen
Settings → **Hospital Settings** tab

## Action
1. Click the **Hospital Settings** tab.
2. Scroll slowly past **Current Plan** to **Hospital Branding Details** and the logo.

## Demo Data
Hospital branding from `DEMO_DATA.md` §2.

## Expected Result
The hospital name, logo and contact details are shown.

## Voiceover
"In Settings, the hospital's name, logo and contact details are kept up to date, and they appear on every prescription and invoice."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around the logo.

## Zoom
Zoom to 120% on **Hospital Branding Details**.

## Pause
1 second on the logo.

## Transition
Click **Dashboard**. Cross-fade (0.5 s).

> Don't click **Manage Subscription** unless Razorpay test keys are configured.

---

# Scene 12

## Duration
04:20 - 04:35

## Purpose
Summarise and hand over.

## User Role
Hospital Admin

## URL / Route
`/dashboard/hospital`

## Starting Screen
Hospital Dashboard

## Action
1. Wait for the dashboard. Park the cursor on the right.

## Demo Data
None

## Expected Result
The dashboard loads with today's figures.

## Voiceover
"A new department, a new surgeon ready to be booked, partners connected, and the numbers one click away. Now the front desk and doctors take over."

## On-Screen Text
End card: **Next: The Front Desk**

## Cursor / Highlight
None

## Zoom
None

## Pause
3 seconds on the final frame.

## Transition
Fade to the end card (1 s).

---

## Post-recording checklist

- [ ] No accidental clicks (especially **Deactivate**, **Revoke**, **Delete**, or the staff active toggle)
- [ ] No personal information: invite tokens in the dialog and the address bar are **blurred or cropped**
- [ ] No browser errors or red toasts
- [ ] No loading screens left in the cut
- [ ] No irrelevant screens
- [ ] No developer tools visible
- [ ] No console errors visible
- [ ] Cursor movement is smooth
- [ ] Narration matches the screen; nothing says invites or passwords are emailed automatically
- [ ] Transitions are clean; the jump from Scene 09 (morning) to Scene 10 (end of day) is invisible
