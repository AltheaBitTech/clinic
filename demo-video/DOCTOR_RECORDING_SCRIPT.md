# Doctor — Recording Script

> **⚠️ REFERENCE DOCUMENT — not the recording instructions.** **RECORD FROM `RECORDING_RUNBOOK.md` ONLY.** Where this file differs from the runbook, follow the runbook. Recording day: **Saturday 10 October 2026**.

**Video:** Arogyix for Doctors
**Target length:** 4:50
**Clip prefix:** `DOC`
**Login:** `amit.patil@example.com` / `Demo@12345`
**Demo data:** `DEMO_DATA.md` §2, §4 and §9

---

## The story

| | |
|---|---|
| **Who** | Dr. Amit Patil, consultant cardiologist at Arogyix Multispeciality Hospital |
| **Why** | He has a full clinic. He needs the patient's history and allergies in front of him, and he needs his prescription to reach the patient and the pharmacy without paperwork |
| **Problem** | Missing history, illegible prescriptions, lost lab slips, and no reliable way to make sure the patient comes back for review |
| **Action** | He reviews Rahul's file, records his findings, writes a digital prescription and sends it to Wellness Pharmacy, completes the visit, sets a follow-up, orders lab tests, and messages Rahul |
| **What happens next** | The pharmacy sees the prescription in its queue. The lab sees the test order. Rahul sees the prescription in his portal and gets medicine reminders. If Rahul misses the follow-up, he appears in Missed Follow-ups |

```
Rahul checked in → Dr. Patil opens the visit → sees the penicillin allergy → reviews history
   → saves notes → writes prescription → sends to Wellness Pharmacy → completes the visit
   → follow-up in 2 weeks → orders Lipid Profile + KFT at CarePlus → messages Rahul
```

---

## Video timeline

| Time | Scene | Section |
|---|---|---|
| 00:00–00:10 | 01 | Introduction |
| 00:10–00:22 | 02 | Login |
| 00:22–00:45 | 03 | Doctor dashboard |
| 00:45–01:20 | 04 | Open the appointment |
| 01:20–01:45 | 05 | Patient history |
| 01:45–02:05 | 06 | Consultation notes |
| 02:05–03:15 | 07 | Digital prescription |
| 03:15–03:30 | 08 | Prescription PDF |
| 03:30–03:55 | 09 | Complete visit and follow-up |
| 03:55–04:20 | 10 | Lab order |
| 04:20–04:35 | 11 | Chat with the patient |
| 04:35–04:50 | 12 | Summary |

---

## Pre-recording checklist

| # | Item | Check |
|---|---|---|
| 1 | **Browser** | Google Chrome, the `DrPatil` profile. Extensions off, bookmarks bar hidden, password saving off |
| 2 | **URL** | `<your-app-url>/login` in a single tab |
| 3 | **Login account** | `amit.patil@example.com` / `Demo@12345` |
| 4 | **Demo data** | `DEMO_DATA.md` §4 (notes, prescription table, lab order, chat message) open **off camera** so you can copy and paste |
| 5 | **Browser zoom** | 110% |
| 6 | **Screen resolution** | 1920×1080, browser maximised |
| 7 | **Notifications disabled** | Do Not Disturb on, Chrome notifications off |
| 8 | **Clean browser** | One tab, download bar closed, page reloaded before the take |
| 9 | **No personal information** | Only demo values |
| 10 | **Required demo records** | It is **day D**. Rahul's appointment is **checked in** (Receptionist Scenes 04–06 done). Hospital catalog contains Amlodipine 5mg, Atorvastatin 10mg, Pantoprazole 40mg. **Wellness Pharmacy** appears in Send to Pharmacy (it registered through **Invite Pharmacy**). **CarePlus Diagnostics** link is **Active**, and its catalog has Lipid Profile and KFT |

> **Day rule.** **Complete Appointment** only works on the appointment's own date, and only after a prescription exists. Record this whole video on day D.

---

## Recording sequence

Scene 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12

---

# Scene 01

## Duration
00:00 - 00:10

## Purpose
Introduce the doctor's role.

## User Role
None (title card)

## URL / Route
None. Title card over a blurred still of `/dashboard/doctor`.

## Starting Screen
Title card

## Action
1. No live action.

## Demo Data
None

## Expected Result
The viewer knows this is the doctor's workflow.

## Voiceover
"Rahul is checked in and waiting. Now let's see the consultation from Dr. Amit Patil's side."

## On-Screen Text
**Arogyix for Doctors**
Subtitle: *Review · Prescribe · Follow up*

## Cursor / Highlight
None

## Zoom
None

## Pause
Hold the full 10 seconds.

## Transition
Cross-fade (0.5 s) to the login page.

---

# Scene 02

## Duration
00:10 - 00:22

## Purpose
Show the doctor's sign-in and personal dashboard.

## User Role
Doctor

## URL / Route
`/login` → `/dashboard/doctor`

## Starting Screen
Login page

## Action
1. Type `amit.patil@example.com` in **Email address**.
2. Type the password in **Password**.
3. Click **Sign In**.

## Demo Data
`amit.patil@example.com` / `Demo@12345`

## Expected Result
The doctor dashboard opens with the heading "Dr. Amit's Dashboard".

## Voiceover
"Dr. Patil signs in and lands on his own dashboard, showing only his patients."

## On-Screen Text
Lower-third: **Dr. Amit Patil · Cardiologist**

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
00:22 - 00:45

## Purpose
Show the doctor's day at a glance.

## User Role
Doctor

## URL / Route
`/dashboard/doctor`

## Starting Screen
Doctor dashboard

## Action
1. Hover **Today's Appointments**, **Total Patients** and **Prescriptions Pending**, 1 second each.
2. Move down to **Today's Schedule** and hover Rahul Sharma's row. **Don't click it** (the rows are not links).

## Demo Data
Rahul's 11:30 appointment.

## Expected Result
Rahul Sharma appears in **Today's Schedule** with his reason for visit.

## Voiceover
"His dashboard shows today's appointments, his total patients, and visits that still need a prescription. Today's schedule lists each patient with their reason for visiting. Rahul is next."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around Rahul's row in **Today's Schedule**.

## Zoom
Zoom to 125% on **Today's Schedule**.

## Pause
1.5 seconds on Rahul's row.

## Transition
Click **Appointments** in the sidebar. Hard cut.

---

# Scene 04

## Duration
00:45 - 01:20

## Purpose
Show the key safety and context information before the patient walks in.

## User Role
Doctor

## URL / Route
`/dashboard/appointments` → `/dashboard/appointments/<id>`

## Starting Screen
Appointments list → **Appointment Details**

## Action
1. In the Appointments search, type `Rahul`.
2. Click Rahul Sharma's appointment row.
3. Pause on **Patient Registry Info** (age, gender, blood group, **Allergies: Penicillin**).
4. Move to the visit purpose (**Reason for Visit** and the front-desk notes).
5. Scroll to **Workflow Control** and point at the in-progress status.

## Demo Data
Rahul's appointment (APT-01).

## Expected Result
Appointment Details shows Penicillin under Allergies, the reason for visit, and the checked-in (In Progress) status.

## Voiceover
"Before Rahul walks in, Dr. Patil opens the appointment. His penicillin allergy is shown up front, along with his blood group, his reason for visiting, and the notes from the front desk. He's already checked in, so the visit is in progress."

## On-Screen Text
Feature title (3 s): **Doctor Consultation**

## Cursor / Highlight
**Red** rounded box around **Allergies** (safety item). Cyan box around **Reason for Visit**.

## Zoom
Zoom to 140% on **Patient Registry Info**. Zoom out to 100% before scrolling.

## Pause
2 seconds on the Allergies box.

## Transition
Click **View Full File**. Hard cut.

---

# Scene 05

## Duration
01:20 - 01:45

## Purpose
Show that the patient's full history is one click away.

## User Role
Doctor

## URL / Route
`/dashboard/patients/<id>`

## Starting Screen
Patient file, **Timeline** tab (default)

## Action
1. Scroll the **Clinical History Timeline** slowly.
2. Click the **Records & Care** tab. Pause 1.5 seconds.
3. Use the browser Back button to return to Appointment Details.

## Demo Data
Rahul's file (new today, so the timeline shows registration and today's appointment).

## Expected Result
The timeline lists Rahul's registration and appointment events. Records & Care shows recent prescriptions, appointments and reports.

## Voiceover
"Rahul's full file keeps his history in date order: visits, prescriptions, reports and lab results. Today he's new, so the record starts here, and it will grow with every visit."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around the timeline.

## Zoom
Zoom to 120% on the timeline.

## Pause
1.5 seconds on **Records & Care**.

## Transition
Browser Back to Appointment Details. Hard cut.

---

# Scene 06

## Duration
01:45 - 02:05

## Purpose
Record the examination findings against this visit.

## User Role
Doctor

## URL / Route
`/dashboard/appointments/<id>`

## Starting Screen
Appointment Details → **Clinical / Consultation Notes**

## Action
1. Click into **Clinical / Consultation Notes**.
2. Paste the notes from `DEMO_DATA.md` §4.
3. Click **Save Notes** (it appears once the text changes).

## Demo Data
"BP 152/96 mmHg, pulse 84/min, SpO₂ 98%. Heart sounds normal, no murmur. Resting ECG in clinic: normal sinus rhythm. Start antihypertensive and statin; lifestyle counselling given."

## Expected Result
The "Clinical notes saved successfully" toast appears.

## Voiceover
"After examining Rahul, Dr. Patil records his findings. The notes stay attached to this visit."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around the notes box.

## Zoom
Zoom to 130% on the notes box.

## Pause
1 second after the toast.

## Transition
Click **Write Prescription**. Hard cut.

---

# Scene 07

## Duration
02:05 - 03:15

## Purpose
Write a complete digital prescription and route it to the partner pharmacy.

## User Role
Doctor

## URL / Route
`/dashboard/prescriptions/new?appointmentId=<id>`

## Starting Screen
**Write New Prescription**

## Action
1. Check **Prescribing Doctor** shows the "Prescribing Self" badge.
2. **Select Patient**: type `Rahul`, click **Rahul Sharma**. (The patient is not filled in automatically from the appointment.)
3. **Diagnosis / Assessment**: `Essential Hypertension (Stage 1) with borderline dyslipidemia`.
4. **Prescription Valid Until**: D+30 = 09-11-2026.
5. Click **Add Oral Medicine**. In the name field type `Amlo` and pick **Amlodipine 5mg** from the suggestions. Set Dosage `1 tablet`, Frequency **Once daily (OD)**, Duration `30 days`, Timing **After Food (PC)**, Instructions `Take at the same time every morning`.
6. Add **Atorvastatin 10mg**: `1 tablet`, **Before bed**, `30 days`, **After Food (PC)**.
7. Add **Pantoprazole 40mg**: `1 tablet`, **Once daily (OD)**, `14 days`, **Before Food (AC)**, `30 minutes before breakfast`.
8. On medicine 1, under reminders, type `08:30` in "Custom 24h Time" and click **Set**.
9. **General Notes / Patient Instructions**: paste the advice from `DEMO_DATA.md` §4.
10. **Send to Pharmacy**: choose **Wellness Pharmacy**.
11. Hover the **Prescription Summary**, then click **Generate Prescription**.

## Demo Data
`DEMO_DATA.md` §4, "Prescription". Medicine names must be picked from the suggestions so they match the pharmacy catalog exactly.

## Expected Result
The toast "Prescription created and sent to Wellness Pharmacy!" appears and the app opens the Prescriptions list.

## Voiceover
"Now the prescription. Medicines come up as suggestions from the hospital's own catalog, with the usual dosage and timing filled in, so prescribing is quick and consistent. Arogyix schedules reminder times for Rahul automatically, and the doctor can add his own. Finally, he sends the prescription straight to Wellness Pharmacy, the hospital's partner pharmacy, and generates it."

## On-Screen Text
Feature title (3 s): **Digital Prescription**

## Cursor / Highlight
Cyan box around the medicine suggestion dropdown, then **Medicine Reminders**, then **Send to Pharmacy**.

## Zoom
Zoom to 140% on the suggestion dropdown (first medicine only). Zoom to 130% on **Send to Pharmacy**. Zoom to 120% on **Prescription Summary**.

## Pause
1 second on the pharmacy selection. 1.5 seconds after the success toast.

## Transition
Speed up steps 5–9 to 2× in the edit, keeping medicine 1 and **Send to Pharmacy** at normal speed. Continue directly into Scene 08 (the app lands on the list).

---

# Scene 08

## Duration
03:15 - 03:30

## Purpose
Show the finished prescription and its branded PDF.

## User Role
Doctor

## URL / Route
`/dashboard/prescriptions`

## Starting Screen
Prescriptions list

## Action
1. Hover the "Sent to Wellness Pharmacy" badge on Rahul's prescription.
2. Click **PDF**.
3. Show the PDF for 3 seconds (hospital name and logo, medicines).
4. Close the PDF tab.

## Demo Data
RX-01.

## Expected Result
The PDF opens with the hospital's branding and the three medicines.

## Voiceover
"The prescription is ready as a branded PDF. Rahul can see it in his patient portal, and the pharmacy already has it."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around "Sent to Wellness Pharmacy".

## Zoom
Zoom to 120% on the PDF header.

## Pause
3 seconds on the PDF.

## Transition
Click **Appointments** → Rahul's appointment. Hard cut.

---

# Scene 09

## Duration
03:30 - 03:55

## Purpose
Close the visit and plan the review.

## User Role
Doctor

## URL / Route
`/dashboard/appointments/<id>`

## Starting Screen
Appointment Details → **Workflow Control**

## Action
1. Point at **Prescribed Medications** (the prescription is now attached to the visit).
2. Click **Complete Appointment**.
3. Wait for the "Appointment status updated successfully" toast. The **Schedule Follow-up** form opens by itself.
4. Pick the follow-up date: D+14.
5. Type `Review BP log and lipid report.` in "Follow-up advice/notes".
6. Click **Schedule**.

## Demo Data
Follow-up date D+14 = Sat 24 Oct 2026 (Dr. Patil works Mon–Sat).

## Expected Result
The status shows Completed. **Scheduled Follow-up** shows the D+14 date.

## Voiceover
"Dr. Patil completes the visit. Arogyix only allows this once a prescription is written, so nothing is missed. He sets a follow-up for two weeks. If Rahul doesn't book it, he'll appear on the hospital's missed follow-up list."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around the Completed status, then around **Scheduled Follow-up**.

## Zoom
Zoom to 130% on **Workflow Control**.

## Pause
1.5 seconds on **Scheduled Follow-up**.

## Transition
Click **Lab Orders** in the sidebar. Hard cut.

---

# Scene 10

## Duration
03:55 - 04:20

## Purpose
Order lab tests from the hospital's partner lab.

## User Role
Doctor

## URL / Route
`/dashboard/pathology-orders` → `/dashboard/pathology-orders/new`

## Starting Screen
Lab Orders → **New Lab Order**

## Action
1. Click **New Order**.
2. Choose the lab **CarePlus Diagnostics**.
3. Choose the patient **Rahul Sharma**.
4. Tick **Lipid Profile** and **Kidney Function Test (KFT)**.
5. **Collection Type**: Walk-in.
6. **Referring Doctor (optional)**: Dr. Amit Patil.
7. Notes: `Collect sample today after consultation`.
8. Click **Place Order**.

## Demo Data
LO-01 in `DEMO_DATA.md` §4 and §9.10.

## Expected Result
The "Lab order placed" toast appears and the order is listed.

## Voiceover
"To check his cholesterol and kidney function, Dr. Patil orders two tests from CarePlus Diagnostics, the hospital's partner lab. The lab receives the order straight away."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around the ticked tests and the total.

## Zoom
Zoom to 130% on the test list.

## Pause
1 second after the toast.

## Transition
Click **Chat** in the sidebar. Hard cut.

---

# Scene 11

## Duration
04:20 - 04:35

## Purpose
Show direct, real-time communication with the patient.

## User Role
Doctor

## URL / Route
`/dashboard/chat`

## Starting Screen
Chat

## Action
1. Click **New**, then **Message a Patient**.
2. Search `Rahul` and select Rahul Sharma.
3. Paste the message from `DEMO_DATA.md` §4 and send it.

## Demo Data
"Hello Rahul, please give your blood sample at CarePlus Diagnostics today, and bring your BP log to your follow-up visit."

## Expected Result
The message bubble appears. The status shows **Connected**.

## Voiceover
"And if Rahul needs a reminder or has a question, doctor and patient can message each other directly."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around the sent message.

## Zoom
Zoom to 125% on the conversation.

## Pause
1.5 seconds after sending.

## Transition
Click **Dashboard**. Cross-fade (0.5 s).

---

# Scene 12

## Duration
04:35 - 04:50

## Purpose
Summarise and hand over.

## User Role
Doctor

## URL / Route
`/dashboard/doctor`

## Starting Screen
Doctor dashboard

## Action
1. Wait for the dashboard to load. Park the cursor on the right.

## Demo Data
None

## Expected Result
The dashboard reflects the completed visit.

## Voiceover
"One consultation: history reviewed, prescription sent to the pharmacy, tests ordered and a follow-up planned. The pharmacy and the lab can now take over."

## On-Screen Text
End card: **Next: The Pharmacy**

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

- [ ] No accidental clicks (especially **Cancel Appointment** or **No Show**)
- [ ] No personal information: only demo values
- [ ] No browser errors or red toasts ("Please write a prescription…" means the order of steps was wrong: re-record)
- [ ] No loading screens left in the cut
- [ ] No irrelevant screens
- [ ] No developer tools visible
- [ ] No console errors visible
- [ ] Cursor movement is smooth
- [ ] Narration matches the screen, especially during the 2× speed section
- [ ] Transitions are clean
