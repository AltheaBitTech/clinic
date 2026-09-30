# Receptionist — Recording Script

> **⚠️ REFERENCE DOCUMENT — not the recording instructions.** **RECORD FROM `RECORDING_RUNBOOK.md` ONLY.** Where this file differs from the runbook, follow the runbook. Recording day: **Saturday 10 October 2026**.

**Video:** Arogyix for the Front Desk
**Target length:** 3:50
**Clip prefix:** `REC` (name each take `REC-04-take1.mov` and so on)
**Login:** `priya.deshmukh@example.com` / `Demo@12345`
**Demo data:** `DEMO_DATA.md` §3, §4 and §9

---

## The story

| | |
|---|---|
| **Who** | Priya Deshmukh, receptionist at Arogyix Multispeciality Hospital |
| **Why** | She is the first person a patient meets. Her job is to get the patient into the system, in front of the right doctor, and billed correctly |
| **Problem** | Paper registers, double-booked doctors, and bills that are forgotten or written by hand |
| **Action** | She registers Rahul Sharma, books him into a real free slot with Dr. Amit Patil, checks him in, raises his bill, and records his payment after the consultation |
| **What happens next** | Rahul appears on Dr. Patil's schedule. His allergy is visible to the doctor. His bill feeds the hospital's revenue reports. Rahul gets his own patient login |

```
Rahul arrives → Priya registers him → books Dr. Patil → checks him in → generates the bill
      → (Dr. Patil consults and prescribes — Doctor video) → Priya collects payment
```

---

## Video timeline

| Time | Scene | Section |
|---|---|---|
| 00:00–00:12 | 01 | Introduction |
| 00:12–00:25 | 02 | Login |
| 00:25–00:50 | 03 | Front Desk Dashboard |
| 00:50–01:40 | 04 | Patient registration |
| 01:40–02:25 | 05 | Appointment booking |
| 02:25–02:50 | 06 | Check-in and bill |
| 02:50–03:10 | 07 | Payment after consultation |
| 03:10–03:35 | 08 | Billing & Invoices |
| 03:35–03:50 | 09 | Summary |

---

## Pre-recording checklist

| # | Item | Check |
|---|---|---|
| 1 | **Browser** | Google Chrome, the `Reception` profile (one Chrome profile per role, because logins are shared across tabs of the same profile). Extensions off, bookmarks bar hidden, "Offer to save passwords" off |
| 2 | **URL** | `<your-app-url>/login` open in a single tab (for example `http://localhost:3000/login` or your staging address) |
| 3 | **Login account** | `priya.deshmukh@example.com` / `Demo@12345`. Priya's account is active in **Staff** |
| 4 | **Demo data** | `DEMO_DATA.md` §3 (Rahul's registration values) and §4 (appointment values) printed or on a second screen, **off camera** |
| 5 | **Browser zoom** | 110% |
| 6 | **Screen resolution** | 1920×1080. Browser window maximised to exactly that size |
| 7 | **Notifications disabled** | macOS Do Not Disturb on. Chrome site notifications off |
| 8 | **Clean browser** | No other tabs. Download bar closed. Reload the page once before recording to clear old toasts |
| 9 | **No personal information** | Only `example.com` emails and `98000 00xxx` phone numbers from `DEMO_DATA.md` |
| 10 | **Required demo records** | It is **day D** (the recording day). **Rahul Sharma does not exist yet** (search Patients for "Rahul"). Dr. Amit Patil is configured and today is one of his available days. The chosen slot (for example 11:30 AM) is at least 60 minutes in the future. Background patients exist so lists aren't empty |

> **Order rule.** Scenes 01–06 are recorded first. Then stop and record the Doctor video (Scenes 04–08 at least). Then come back and record Scenes 07–09. The app only lets a visit be completed on its scheduled day, after a prescription exists.

---

## Recording sequence

Scene 01 → Scene 02 → Scene 03 → Scene 04 → Scene 05 → Scene 06 → **(pause: Doctor video)** → Scene 07 → Scene 08 → Scene 09

---

# Scene 01

## Duration
00:00 - 00:12

## Purpose
Introduce the front-desk role and the patient we'll follow.

## User Role
None (title card)

## URL / Route
None. Title card built in the editor over a blurred still of `/dashboard/receptionist`.

## Starting Screen
Title card

## Action
1. No live action. Before recording day, take a screenshot of `/dashboard/receptionist` to use as the blurred background.

## Demo Data
None

## Expected Result
The viewer knows the video is about the front desk and follows one patient.

## Voiceover
"Every hospital visit starts at the front desk. Let's follow Priya, the receptionist, as she welcomes a new patient, Rahul Sharma."

## On-Screen Text
**Arogyix for the Front Desk**
Subtitle: *Register · Book · Check in · Bill*

## Cursor / Highlight
None

## Zoom
None

## Pause
Hold the title for the full 12 seconds.

## Transition
Cross-fade (0.5 s) to the login page.

---

# Scene 02

## Duration
00:12 - 00:25

## Purpose
Show that the receptionist signs in on the shared login page and lands on her own dashboard.

## User Role
Receptionist

## URL / Route
`/login` → redirects to `/dashboard/receptionist`

## Starting Screen
Login page ("Welcome back")

## Action
1. Click the **Email address** field.
2. Type `priya.deshmukh@example.com`.
3. Click the **Password** field and type the password. Do not click the eye icon.
4. Hover **Sign In** for half a second, then click it.
5. Wait until the Front Desk Dashboard has fully loaded.

## Demo Data
`priya.deshmukh@example.com` / `Demo@12345`

## Expected Result
A "Welcome back!" toast appears and the **Front Desk Dashboard** opens at `/dashboard/receptionist`.

## Voiceover
"Priya signs in with her own account. Arogyix knows she's a receptionist and opens the front-desk view."

## On-Screen Text
Lower-third: **Priya Deshmukh · Receptionist**

## Cursor / Highlight
Soft highlight on the **Sign In** button just before the click.

## Zoom
None

## Pause
1 second after the dashboard loads.

## Transition
Hard cut on page load.

---

# Scene 03

## Duration
00:25 - 00:50

## Purpose
Show what the front desk sees at the start of the day.

## User Role
Receptionist

## URL / Route
`/dashboard/receptionist`

## Starting Screen
Front Desk Dashboard

## Action
1. Hover each of the four stat cards for about 1 second, left to right: **Today's Appointments**, **Checked-In / Waiting**, **Payments Pending**, **Today's Revenue**.
2. Move down to **Reception Quick Actions** and hover along the buttons (**Register Patient**, **Book Appointment**, **Billing Center**, **Missed Follow-ups**, **Reports**).
3. Scroll down about 300 px to show the **Patient Queue & Schedule** table.
4. Scroll back to the top.

## Demo Data
Existing background appointments for day D (if any).

## Expected Result
All four cards show numbers (no error cards). The queue shows today's appointments.

## Voiceover
"Her dashboard shows the day at a glance: today's appointments, who is waiting, which bills are still unpaid, and today's collections. Below is the live patient queue, where most of her day happens."

## On-Screen Text
None

## Cursor / Highlight
Rounded box around the four stat cards, then around **Patient Queue & Schedule**.

## Zoom
Zoom to 125% on the stat cards for 5 seconds, then back to 100% before scrolling.

## Pause
2 seconds on the queue before scrolling back up.

## Transition
Cursor moves to **Register Patient** in Reception Quick Actions. Continue straight into Scene 04 (no visual transition).

---

# Scene 04

## Duration
00:50 - 01:40

## Purpose
Register a new patient, including the safety information the doctor will need.

## User Role
Receptionist

## URL / Route
`/dashboard/patients/new`

## Starting Screen
Front Desk Dashboard → **Register New Patient**

## Action
1. Click **Register Patient** in Reception Quick Actions.
2. **First Name**: `Rahul`. **Last Name**: `Sharma`.
3. **Email Address**: `rahul.sharma@example.com`. **Phone Number**: `9800000201`. Leave the WhatsApp toggle off.
4. **Date of Birth**: `12-03-1978`. **Gender**: Male. **Blood Group**: B+.
5. **Residential Address**: `Flat 12, Sai Residency, Aundh`. **City**: `Pune`.
6. Emergency contact: **Contact Name** `Anjali Sharma`, **Relation** `Spouse`, **Phone Number** `9800000202`.
7. **Allergies**: type `Penicillin` and press Enter.
8. **Chronic Conditions**: type `Hypertension` and press Enter.
9. **Clinical Notes**: paste `Home BP readings around 150/95 over the last two weeks. Non-smoker.`
10. Click **Register Patient** at the bottom of the form.
11. Wait for the **Patient Registered!** modal.
12. **Off camera or in the edit:** write down the **Temporary Password** shown in the modal. You need it for the Patient video.
13. Click **Done & Close**.

## Demo Data
`DEMO_DATA.md` §3, "Main patient, registered live".

## Expected Result
The **Patient Registered!** modal appears with "Patient Login Account Created", the **Login Email** and a **Temporary Password**. After **Done & Close**, Rahul exists as a patient with a patient code.

## Voiceover
"Rahul is visiting for the first time. Priya registers him with his contact details, date of birth, blood group and an emergency contact. She also records his penicillin allergy and his high blood pressure, so the doctor sees them before the consultation. Arogyix creates Rahul's patient record and his own patient login, ready to hand to him at the desk."

## On-Screen Text
Feature title (top-left, 3 s): **Patient Registration**

## Cursor / Highlight
Red rounded box around the **Allergies** chip "Penicillin" (safety item). Cyan box around the Login Email in the modal.

## Zoom
Zoom to 130% on the **Allergies** and **Chronic Conditions** fields while typing. Zoom to 120% on the modal. Return to 100% before **Done & Close**.

## Pause
2 seconds on the **Patient Registered!** modal.

## Transition
In the edit, speed up typing in steps 2–6 to 2–3×. **Blur the Temporary Password** in the modal. Hard cut to Scene 05.

---

# Scene 05

## Duration
01:40 - 02:25

## Purpose
Book Rahul into a real, free time slot with the right specialist.

## User Role
Receptionist

## URL / Route
`/dashboard/appointments/new`

## Starting Screen
Front Desk Dashboard → **Schedule New Appointment**

## Action
1. On the dashboard, click **Book Appointment** in Reception Quick Actions.
2. **Select Registered Patient**: type `Rahul`, then click **Rahul Sharma**.
3. **Doctor / Specialist**: type `Amit`, then click **Dr. Amit Patil**.
4. Pause on **Selected Doctor Info** (Cardiology, ₹800).
5. **Appointment Date**: pick today (day D). Wait until "Fetching doctor availability slots..." disappears.
6. **Available Slots**: click **11:30 AM** (or the first free slot at least 60 minutes from now).
7. **Appointment Type**: Regular Consultation.
8. **Reason for Visit**: `Chest discomfort on exertion and high BP readings at home for 2 weeks`.
9. **Additional Notes**: `Brings home BP log. Known Penicillin allergy.`
10. Hover the **Booking Summary**, then click **Schedule Appointment**.

## Demo Data
`DEMO_DATA.md` §4, "Main appointment and consultation".

## Expected Result
The "Appointment scheduled successfully!" toast appears. If you see "Cannot book an appointment in the past", the slot has already passed: pick a later one and re-record.

## Voiceover
"Next, Priya books Rahul with the cardiologist, Dr. Amit Patil. Arogyix shows only the times the doctor is actually free, based on his working hours and existing bookings, so double-booking can't happen. The summary confirms the doctor, the time and the consultation fee before the booking is saved."

## On-Screen Text
Feature title (3 s): **Appointment Booking**

## Cursor / Highlight
Cyan box around **Available Slots**, then around **Booking Summary**.

## Zoom
Zoom to 140% on **Available Slots** when they appear. Zoom to 125% on **Booking Summary** before clicking **Schedule Appointment**.

## Pause
1.5 seconds after the success toast.

## Transition
Click **Dashboard** in the sidebar. Hard cut on page load.

---

# Scene 06

## Duration
02:25 - 02:50

## Purpose
Check Rahul in when he's ready to be seen, and prepare his bill.

## User Role
Receptionist

## URL / Route
`/dashboard/receptionist`

## Starting Screen
Front Desk Dashboard → **Patient Queue & Schedule**

## Action
1. Scroll to **Patient Queue & Schedule**.
2. Click the search box ("Search patient/doctor...") and type `Rahul`.
3. On Rahul Sharma's row, click **Check In**.
4. Wait for the "Appointment status updated successfully" toast.
5. On the same row, click **Generate Bill**.
6. Wait for the "Invoice generated successfully!" toast. The **Collect** button now appears on the row.

> ⚠️ **DO NOT CLICK "Check Out".** It appears next to **Collect** after Check In. Clicking it completes Rahul's visit from the desk and can bypass the doctor's Complete Appointment and follow-up workflow. Only the doctor completes Rahul's visit.

## Demo Data
Rahul's appointment from Scene 05.

## Expected Result
Rahul's status changes to checked in (In Progress). An invoice for ₹800 exists and is pending. **Collect** is visible on the row.

## Voiceover
"When Rahul is ready to be seen, Priya checks him in. He now appears on Dr. Patil's list as waiting. With one more click she raises his bill, using the doctor's consultation fee. It stays pending until Rahul pays."

## On-Screen Text
Feature title (3 s): **Check-in & Billing**

## Cursor / Highlight
Cyan box around Rahul's status badge (before and after), then around **Collect**.

## Zoom
Zoom to 130% on Rahul's row for the whole scene.

## Pause
1.5 seconds after each toast. **Then stop recording.** Record the Doctor video before Scene 07.

## Transition
In the edit: a 1-second title card "After the consultation…" before Scene 07.

---

# Scene 07

## Duration
02:50 - 03:10

## Purpose
Show that the visit is closed by the doctor and record Rahul's payment.

## User Role
Receptionist

## URL / Route
`/dashboard/receptionist`

## Starting Screen
Front Desk Dashboard

## Action
1. **Prerequisite (off camera):** Dr. Patil has written Rahul's prescription and clicked **Complete Appointment** (Doctor video).
2. Click **Refresh** at the top right of the dashboard.
3. In the queue search, type `Rahul`. Point at the **Completed** status.
4. Click **Collect** on Rahul's row.
5. Wait for the "Payment recorded successfully" toast.
6. Scroll up and hover **Today's Revenue**.

## Demo Data
Invoice INV-H01, ₹800.

## Expected Result
Rahul's invoice is marked paid. The **Collect** button disappears. **Today's Revenue** increases by ₹800.

## Voiceover
"After his consultation, Rahul's visit shows as completed. He pays at the desk, and Priya records the payment. Today's revenue updates immediately, and the invoice is marked as paid."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around **Today's Revenue** after collection.

## Zoom
Zoom to 130% on Rahul's row, then zoom to 130% on **Today's Revenue**.

## Pause
1.5 seconds on **Today's Revenue**.

## Transition
Click **Billing Center** in Reception Quick Actions. Hard cut on load.

> Don't mention cash, card or UPI here. **Collect** records the payment without asking for a method.

---

# Scene 08

## Duration
03:10 - 03:35

## Purpose
Show where every invoice lives and how to give the patient a copy.

## User Role
Receptionist

## URL / Route
`/dashboard/billing`

## Starting Screen
**Billing & Invoices**

## Action
1. Hover **Total Invoices Issued** and **Unpaid Bills Pending**.
2. Open the status filter and choose **Paid Only**.
3. Find Rahul Sharma's invoice.
4. Click the download icon on Rahul's invoice. Show the PDF for 2 seconds, then close it.
5. Hover **Export** (you can click it; it downloads a CSV).

## Demo Data
Rahul's paid ₹800 invoice.

## Expected Result
Rahul's invoice appears under **Paid Only**. The invoice PDF opens with the hospital's details.

## Voiceover
"Every invoice is kept in Billing. Priya can filter by status or date, download a PDF receipt for the patient, or export the list for the accounts team."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around the status filter, then the download icon.

## Zoom
Zoom to 120% on the PDF while it's open.

## Pause
2 seconds on the PDF.

## Transition
Click **Dashboard** in the sidebar. Cross-fade (0.5 s).

> Avoid the email and WhatsApp icons on invoice rows. They only show "available soon".

---

# Scene 09

## Duration
03:35 - 03:50

## Purpose
Summarise the front-desk workflow and hand over to the next role.

## User Role
Receptionist

## URL / Route
`/dashboard/receptionist`

## Starting Screen
Front Desk Dashboard

## Action
1. Type `Rahul` in the queue search so his completed, paid row is visible.
2. Park the cursor in empty space on the right.

## Demo Data
None

## Expected Result
Rahul's row shows the visit completed and the bill paid.

## Voiceover
"In a few minutes, Rahul was registered, booked, checked in and billed. Everything Priya entered is now available to the doctor, the pharmacy, and Rahul himself."

## On-Screen Text
End card: **Next: The Doctor's Consultation**

## Cursor / Highlight
Cyan box around Rahul's row.

## Zoom
None

## Pause
3 seconds on the final frame.

## Transition
Fade to the end card (1 s).

---

## Post-recording checklist

- [ ] No accidental clicks (especially **Cancel** on a queue row)
- [ ] No personal information: the Temporary Password is **blurred**; only `DEMO_DATA.md` values appear
- [ ] No browser errors or red error toasts
- [ ] No loading skeletons left in the final cut (trim them)
- [ ] No irrelevant screens (no Timeline tab, no other patients' files opened)
- [ ] No developer tools visible
- [ ] No console errors visible
- [ ] Cursor movement is smooth, with no zig-zags
- [ ] Narration matches what's on screen at each moment
- [ ] Transitions are clean: hard cuts between actions, fades only at the start and end
