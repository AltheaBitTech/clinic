# Arogyix — Master Demo Flow and Video A (Full Product Demo)

> **⚠️ REFERENCE DOCUMENT — not the recording instructions.** **RECORD FROM `RECORDING_RUNBOOK.md` ONLY.** Where this file differs from the runbook, follow the runbook. Recording day: **Saturday 10 October 2026**.

## 1. The complete application journey

Every step below exists in the current code. Screen names and button labels are shown exactly as they appear in the app.

```
 PUBLIC VISITOR (landing page /)
   │  Pricing card → "Register Your Clinic / Hospital" → Submit Registration Request
   ▼
 SUPER ADMIN  (/dashboard/super-admin)
   │  Hospital Registration Requests → Approve → temporary password shown once
   ▼
 HOSPITAL ADMIN  (/dashboard/hospital)
   │  Settings → Hospital Settings (name, logo)
   │  Departments → Add Department
   │  Staff → Invite Staff → link ─────────► staff opens /register?token → Activate Account
   │  Doctors → Configure Doctor Profile (fee, slot length, hours, weekly availability)
   │  Medicines Catalog → Add Medicine / Add Ointment
   │  Pharmacies → Invite Pharmacy ────────► pharmacy completes "Register your pharmacy"
   │  Pathology Labs → Invite Pathology Lab ► lab completes registration (auto-linked)
   ▼
 RECEPTIONIST  (/dashboard/receptionist)
   │  PATIENT REGISTRATION: Register Patient → patient code + patient login (temp password)
   │     (or the patient self-registers at /register: picks hospital, email code)
   ▼
 APPOINTMENT
   │  Book Appointment → patient → doctor → date → Available Slots → Schedule Appointment
   │  Patient Queue → Check In            (status: In Progress)
   │  Generate Bill (optional here)       (invoice: Pending)
   ▼
 DOCTOR CONSULTATION  (/dashboard/doctor → Appointments → Appointment Details)
   │  Review allergies, reason, full file / Timeline → Save Notes
   ▼
 PRESCRIPTION
   │  Write Prescription → medicines (catalog autocomplete) → reminder times
   │  → Send to Pharmacy → Generate Prescription → PDF (hospital branding)
   │  Complete Appointment (needs prescription, same day) → Schedule Follow Up
   │  (optional) Lab Orders → New Order → linked lab + tests
   ▼
 ┌──────────────── runs in parallel ───────────────────────────────────┐
 │ PHARMACY (/dashboard/pharmacy-portal)   LAB (/dashboard/pathology-portal)│
 │  Rx Queue → Verify Prescription          Orders → Mark Collected →        │
 │  → Dispense Selected Items               Receive → Accept → Start         │
 │  (stock taken expiry-first; no bill)     Processing → Save Results →      │
 │  Counter billing is separate: New Sale   Submit → Confirm & Verify →      │
 │                                          Deliver Report ──► patient       │
 │                                          Reports + Timeline + notification│
 └─────────────────────────────────────────────────────────────────────┘
   ▼
 BILLING
   │  Receptionist: Collect / Billing → Mark Paid     (no payment method captured)
   │  or Patient: My Billing → Pay Now (UPI / card / net banking / wallet, Razorpay)
   │  Invoice PDF download; Export
   ▼
 REPORTS / FOLLOW-UP
   │  Patient portal: My Prescriptions (PDF), Reports (lab report), Billing, Chat with doctor
   │  Follow-up date passes without a booking → Missed Follow-ups → send reminder / Schedule Follow-up
   │  Admin: Analytics charts + Reports panel (12 types) → Export / Print
   │  Pharmacy Reports · Lab Reports · Super Admin Revenue Analytics
   ▼
 (Loop) Patient books the next visit themselves from the portal
```

### Journey steps that don't exist (don't show or narrate them)

- Automatic invoice on consultation completion (it's manual: Generate Bill or Generate Invoice).
- Choosing Cash, Card or UPI when the receptionist records payment.
- Pharmacy dispensing creating a bill for the patient.
- Automatic welcome or invite emails with credentials.
- Receptionist writing prescriptions, or receptionist and admin using chat.
- Live reminder delivery in the UI (it depends on an external scheduler).

---

## 2. Video A — Full Product Demo

| | |
|---|---|
| **Duration** | 11:20 |
| **Target audience** | Hospital owners, clinic directors and decision makers evaluating Arogyix. Also useful as investor or partner overview |
| **Objective** | Follow one patient, Rahul Sharma, through every role and show how the hospital, pharmacy, lab and patient are connected |
| **Starting screen** | Landing page `/` |
| **Ending screen** | Hospital Admin → Analytics → Reports panel, then the end card |
| **Main workflow** | The journey in §1 |
| **Must show** | Approval, admin setup, patient registration, slot booking, check-in, consultation, prescription with Send to Pharmacy, pharmacy dispense, lab report delivery, payment, patient portal, missed follow-ups, analytics |
| **Can skip** | Settings details, catalog creation, suppliers and POs, POS, collectors, referral programme, subscription checkout, departments CRUD |
| **Narration style** | Story-led and calm. Name the role at the start of each chapter with a lower-third ("Receptionist · Priya") |
| **Production approach** | **Edit it from the role-video takes** (B, C, D, E, F, G, H). Only Scenes 01, 15 and 17 need new footage. Each scene below lists its source |

### Scene 01 — Introduction
**Time:** 00:00–00:25 · *Story step 1*

- **Screen:** Landing page hero ("Healthcare management made simple.")
- **Purpose:** Frame the story
- **User action:** Slow scroll through the hero and "Built for every role"
- **On-screen action:** Hero, role cards
- **Voiceover:** "Arogyix is a hospital management platform that connects the people involved in a patient's care: the front desk, doctors, the pharmacy, the diagnostic lab, and the patient. In this demo, we'll follow one patient, Rahul Sharma, from registration to follow-up, and see what each person does along the way."
- **Highlight:** None
- **Transition:** Cross-fade to the registration form
- **Expected result:** The viewer knows the story they're about to see

**Recording checklist (new footage)**
1. Open `/` logged out, 1920×1080. Scroll 600 px over 8 s, then pause on **Built for every role**.

### Scene 02 — A hospital joins Arogyix
**Time:** 00:25–01:05 · *Super Admin*

- **Screen:** Register Your Clinic / Hospital → Super Admin Portal → Approve modal
- **Purpose:** Show onboarding
- **User action:** Submit the request; Approve
- **On-screen action:** "Request Received!"; "Hospital Approved!" with the password blurred
- **Voiceover:** "A hospital starts by applying on the Arogyix website and choosing a plan. The Arogyix team reviews the request and approves it. This creates the hospital's own workspace and an administrator account, with a temporary password that's passed on to the hospital."
- **Highlight:** The Plan column; the modal
- **Transition:** Wipe to the Hospital Dashboard
- **Expected result:** Hospitals are onboarded after review

**Recording checklist:** Reuse Video F, Scene 02 (trim to 15 s, sped up 2×) and Scene 05 (the approve click and modal, 15 s).

### Scene 03 — The administrator sets up the hospital
**Time:** 01:05–01:55 · *Hospital Admin*

- **Screen:** Hospital Dashboard → Staff (Invite) → Doctors (Dr. Patil's card) → Pharmacies / Pathology Labs
- **Purpose:** Setup in one montage
- **User action:** As in Video B
- **On-screen action:** Stat cards; invite link; doctor cards with fee and timing; Wellness Pharmacy; CarePlus
- **Voiceover:** "The hospital administrator sets up the hospital. They invite staff with a secure registration link. Each person sets their own password, and their role is already assigned. They set up each doctor's profile, including consultation fee, appointment length, consulting hours and available days, which controls when patients can be booked. And they connect a partner pharmacy and a diagnostic lab, so prescriptions and test orders can be sent electronically."
- **Highlight:** Doctor card fee and timing; the "Registration Link Generated" box
- **Transition:** Lower-third "Receptionist · Priya"
- **Expected result:** Setup is quick and the network is connected

**Recording checklist:** Reuse Video B Scenes 03 (5 s), 06 (10 s), 08 (final card only, 8 s), 10 (15 s).

### Scene 04 — Patient registration
**Time:** 01:55–02:45 · *Receptionist*

- **Screen:** Front Desk Dashboard → Register New Patient → credentials modal
- **Purpose:** First contact
- **User action:** As in Video C, Scene 05
- **On-screen action:** Form sections; allergies chip "Penicillin"; the "Patient Registered!" modal
- **Voiceover:** "Rahul arrives at the front desk. The receptionist registers him with his contact details, date of birth, blood group and emergency contact, and records his penicillin allergy and high blood pressure. Arogyix gives Rahul a unique patient code and creates his own patient login, so he can see his records from home."
- **Highlight:** The allergy chip; the credentials (blurred)
- **Transition:** Cut to Book Appointment
- **Expected result:** The patient exists with safety info captured

**Recording checklist:** Reuse Video C, Scene 05. Speed up the typing to 2–3×.

### Scene 05 — Appointment booking
**Time:** 02:45–03:30 · *Receptionist*

- **Screen:** Schedule New Appointment
- **Purpose:** Slot-based scheduling
- **User action:** As in Video C, Scene 07
- **On-screen action:** Selected Doctor Info; Available Slots; Booking Summary
- **Voiceover:** "Next, she books Rahul with the cardiologist, Dr. Amit Patil. Only the times that are actually free are offered, based on the doctor's schedule and existing bookings. The summary confirms the doctor, time and consultation fee, and Rahul is notified of the booking."
- **Highlight:** Available Slots
- **Transition:** Cut to the queue
- **Expected result:** No double-booking

**Recording checklist:** Reuse Video C, Scene 07.

### Scene 06 — Check-in and bill
**Time:** 03:30–03:55 · *Receptionist*

- **Screen:** Patient Queue & Schedule
- **Purpose:** Arrival
- **User action:** **Check In**, then **Generate Bill**
- **On-screen action:** Status change; **Collect** appears
- **Voiceover:** "When it's time, Rahul is checked in, which puts him on the doctor's schedule. The receptionist also creates his bill from the doctor's consultation fee, ready for payment later."
- **Highlight:** The status badge
- **Transition:** Lower-third "Doctor · Dr. Amit Patil"
- **Expected result:** The patient is in the queue and the bill is ready

**Recording checklist:** Reuse Video C, Scenes 08–09.

### Scene 07 — Consultation
**Time:** 03:55–04:35 · *Doctor*

- **Screen:** Appointment Details → patient Timeline → Save Notes
- **Purpose:** Informed consultation
- **User action:** As in Video D, Scenes 05–07
- **On-screen action:** The Allergies box; the timeline; the notes toast
- **Voiceover:** "Dr. Patil opens Rahul's appointment. His allergy is shown up front, along with the reason for the visit and his full history on a timeline. After examining him, the doctor records the findings in the consultation notes."
- **Highlight:** The red box on Allergies
- **Transition:** Click **Write Prescription**
- **Expected result:** Safety info is visible at the point of care

**Recording checklist:** Reuse Video D, Scenes 05 (15 s), 06 (10 s), 07 (10 s).

### Scene 08 — Digital prescription
**Time:** 04:35–05:45 · *Doctor*

- **Screen:** Write New Prescription → Prescriptions list → PDF
- **Purpose:** The core value
- **User action:** As in Video D, Scene 08
- **On-screen action:** Autocomplete; reminders; Send to Pharmacy = Wellness Pharmacy; "Sent to Wellness Pharmacy"; PDF
- **Voiceover:** "The doctor writes the prescription. Medicines come up as suggestions from the hospital's catalog, with the usual dosage and timing already filled in. Reminder times are set for Rahul automatically. The doctor chooses to send the prescription to Wellness Pharmacy, and generates it. Arogyix produces a branded PDF, Rahul can see it in his portal, and the pharmacy receives it straight away."
- **Highlight:** Autocomplete dropdown; **Send to Pharmacy**; PDF header
- **Transition:** Back to the appointment
- **Expected result:** Prescribing is digital from start to finish

**Recording checklist:** Reuse Video D, Scene 08. Speed up the field entry to 2×, and keep the Send to Pharmacy and PDF moments at normal speed.

### Scene 09 — Complete, follow-up, lab order
**Time:** 05:45–06:30 · *Doctor*

- **Screen:** Appointment Details → Lab Orders → New Lab Order
- **Purpose:** Close the loop
- **User action:** **Complete Appointment** → **Schedule Follow Up** (D+14) → New Order (Lipid Profile, KFT)
- **On-screen action:** Completed badge; follow-up date; "Lab order placed"
- **Voiceover:** "The visit is marked complete. Arogyix only allows this once a prescription exists. The doctor sets a follow-up in two weeks, and orders a lipid profile and kidney test from the hospital's partner lab."
- **Highlight:** The follow-up date; the test checkboxes
- **Transition:** Lower-third "Pharmacy · Wellness Pharmacy"
- **Expected result:** The next steps are all set up

**Recording checklist:** Reuse Video D, Scenes 09 and 10.

### Scene 10 — Pharmacy fulfils the prescription
**Time:** 06:30–07:20 · *Pharmacy*

- **Screen:** Rx Queue → detail → Inventory Stock Ledger
- **Purpose:** Hospital-to-pharmacy handoff
- **User action:** As in Video E, Scenes 05–07
- **On-screen action:** Pending Rx; Verify; Dispense; DISPENSE rows in the ledger
- **Voiceover:** "At Wellness Pharmacy, Rahul's prescription is already waiting in the queue, with each medicine matched to the pharmacy's own catalog. The pharmacist verifies it and dispenses the medicines. Stock is taken from the batch that expires soonest, and every movement is recorded in the stock ledger."
- **Highlight:** The Pending Rx card; the ledger rows
- **Transition:** Lower-third "Lab · CarePlus Diagnostics"
- **Expected result:** No handwritten prescription handoff is needed

**Recording checklist:** Reuse Video E, Scenes 03 (5 s), 05, 06, 07 (ledger only, 8 s).

### Scene 11 — Lab processes the tests
**Time:** 07:20–08:10 · *Pathology Lab*

- **Screen:** Order detail → results → preview → Deliver
- **Purpose:** Diagnostics loop
- **User action:** As in Video H, Scenes 06–08
- **On-screen action:** Sample ID; High flags; "Report delivered"
- **Voiceover:** "At CarePlus Diagnostics, the order from Dr. Patil is waiting. The sample is collected and given a tracking ID, then received and processed. Results are entered, with values outside the normal range clearly flagged. After the pathologist verifies the report, it's delivered, and it goes straight into Rahul's hospital record. Both Rahul and Dr. Patil are notified."
- **Highlight:** The Flag column; **Deliver Report**
- **Transition:** Lower-third "Receptionist"
- **Expected result:** Results reach the patient automatically

**Recording checklist:** Reuse Video H, Scenes 06–08. Show the sample steps as a 3× speed montage.

### Scene 12 — Payment
**Time:** 08:10–08:35 · *Receptionist*

- **Screen:** Patient Queue
- **Purpose:** Billing closure
- **User action:** **Collect** on Rahul's row
- **On-screen action:** Paid; Today's Revenue updates
- **Voiceover:** "Back at the front desk, Rahul pays and the receptionist records the payment. Today's revenue updates immediately. Patients can also pay online from their own portal."
- **Highlight:** The Today's Revenue card
- **Transition:** Lower-third "Patient · Rahul"
- **Expected result:** Billing is complete

**Recording checklist:** Reuse Video C, Scene 10 (the Rahul **Collect** part only).

### Scene 13 — The patient's view
**Time:** 08:35–09:35 · *Patient*

- **Screen:** Patient dashboard → My Prescriptions (PDF) → Reports (lab report) → My Billing → Chat
- **Purpose:** Patient engagement
- **User action:** As in Video G, Scenes 04, 06, 07, 08, 10
- **On-screen action:** Dashboard panels; prescription PDF; "Lab Report — LAB-2026-…"; paid invoice; the chat exchange
- **Voiceover:** "At home, Rahul signs in to his patient portal. He can see upcoming appointments and medicines due, download his prescription, and open his lab report as soon as the lab delivers it. His invoices are here too. And if he has a question about his medicines, he can message Dr. Patil directly."
- **Highlight:** The lab report row; the chat bubble
- **Transition:** Lower-third "Follow-up"
- **Expected result:** The patient has everything in one place

**Recording checklist:** Reuse Video G. Keep each screen to 8–12 s.

### Scene 14 — Follow-up
**Time:** 09:35–10:05 · *Receptionist / Doctor*

- **Screen:** Missed Follow-ups
- **Purpose:** Retention
- **User action:** Show a missed follow-up (warm-up data); click the reminder button
- **On-screen action:** "Reminder sent"
- **Voiceover:** "If a patient's follow-up date passes without a new booking, they appear in Missed Follow-ups for the doctor and the front desk. With one click, the patient gets a reminder to book, or staff can book the visit for them straight away."
- **Highlight:** The reminder button
- **Transition:** Lower-third "Hospital Admin"
- **Expected result:** Patients don't fall through the cracks

**Recording checklist:** Reuse Video C, Scene 12, first half. This needs the Sunita Rao warm-up data (`DEMO_DATA.md` §3).

### Scene 15 — Management view
**Time:** 10:05–10:50 · *Hospital Admin*

- **Screen:** Hospital Dashboard → Analytics → Reports panel
- **Purpose:** Oversight
- **User action:** Scroll the charts; pick **Revenue Report**; **Export**
- **On-screen action:** Charts; the report table
- **Voiceover:** "Everything that happened today feeds into the administrator's view: today's appointments and revenue on the dashboard, trends in analytics, and detailed reports on appointments, revenue, prescriptions, follow-ups and lab orders, all ready to print or export."
- **Highlight:** The Export button
- **Transition:** Fade to the end slide
- **Expected result:** Leadership has visibility

**Recording checklist (new footage, after everything above is done on D)**
1. Log in as the admin. `/dashboard/hospital`: hover Today's Revenue (now including Rahul).
2. `/dashboard/analytics` → Reports → **Revenue Report** → **Today** → **Export**.

### Scene 16 — Summary
**Time:** 10:50–11:20 · *Story step 8*

- **Screen:** End slide (the short matrix from `ROLE_FEATURE_MATRIX.md` §8), then the logo
- **Purpose:** Recap
- **User action:** None
- **On-screen action:** Role icons joined by arrows: Front desk → Doctor → Pharmacy / Lab → Patient → Admin
- **Voiceover:** "One patient visit, and everyone involved stayed connected: registration, booking, consultation, digital prescription, pharmacy, lab, payment and follow-up, in one system. Each role has its own short video if you'd like to see more detail."
- **Highlight:** None
- **Transition:** Logo, then the end card
- **Expected result:** The viewer understands the product end to end

**Recording checklist:** Build the slide in the editor. No app footage is needed.

---

## 3. Video A — Voiceover script (continuous)

> **[Intro]** Arogyix is a hospital management platform that connects the people involved in a patient's care: the front desk, doctors, the pharmacy, the diagnostic lab, and the patient. In this demo, we'll follow one patient, Rahul Sharma, from registration to follow-up, and see what each person does along the way.
>
> **[Onboarding]** A hospital starts by applying on the Arogyix website and choosing a plan. The Arogyix team reviews the request and approves it. This creates the hospital's own workspace and an administrator account, with a temporary password that's passed on to the hospital.
>
> **[Setup]** The hospital administrator sets up the hospital. They invite staff with a secure registration link. Each person sets their own password, and their role is already assigned. They set up each doctor's profile, including consultation fee, appointment length, consulting hours and available days, which controls when patients can be booked. And they connect a partner pharmacy and a diagnostic lab, so prescriptions and test orders can be sent electronically.
>
> **[Registration]** Rahul arrives at the front desk. The receptionist registers him with his contact details, date of birth, blood group and emergency contact, and records his penicillin allergy and high blood pressure. Arogyix gives Rahul a unique patient code and creates his own patient login, so he can see his records from home.
>
> **[Booking]** Next, she books Rahul with the cardiologist, Dr. Amit Patil. Only the times that are actually free are offered, based on the doctor's schedule and existing bookings. The summary confirms the doctor, time and consultation fee, and Rahul is notified of the booking.
>
> **[Check-in]** When it's time, Rahul is checked in, which puts him on the doctor's schedule. The receptionist also creates his bill from the doctor's consultation fee, ready for payment later.
>
> **[Consultation]** Dr. Patil opens Rahul's appointment. His allergy is shown up front, along with the reason for the visit and his full history on a timeline. After examining him, the doctor records the findings in the consultation notes.
>
> **[Prescription]** The doctor writes the prescription. Medicines come up as suggestions from the hospital's catalog, with the usual dosage and timing already filled in. Reminder times are set for Rahul automatically. The doctor chooses to send the prescription to Wellness Pharmacy, and generates it. Arogyix produces a branded PDF, Rahul can see it in his portal, and the pharmacy receives it straight away.
>
> **[Close]** The visit is marked complete. Arogyix only allows this once a prescription exists. The doctor sets a follow-up in two weeks, and orders a lipid profile and kidney test from the hospital's partner lab.
>
> **[Pharmacy]** At Wellness Pharmacy, Rahul's prescription is already waiting in the queue, with each medicine matched to the pharmacy's own catalog. The pharmacist verifies it and dispenses the medicines. Stock is taken from the batch that expires soonest, and every movement is recorded in the stock ledger.
>
> **[Lab]** At CarePlus Diagnostics, the order from Dr. Patil is waiting. The sample is collected and given a tracking ID, then received and processed. Results are entered, with values outside the normal range clearly flagged. After the pathologist verifies the report, it's delivered, and it goes straight into Rahul's hospital record. Both Rahul and Dr. Patil are notified.
>
> **[Payment]** Back at the front desk, Rahul pays and the receptionist records the payment. Today's revenue updates immediately. Patients can also pay online from their own portal.
>
> **[Patient]** At home, Rahul signs in to his patient portal. He can see upcoming appointments and medicines due, download his prescription, and open his lab report as soon as the lab delivers it. His invoices are here too. And if he has a question about his medicines, he can message Dr. Patil directly.
>
> **[Follow-up]** If a patient's follow-up date passes without a new booking, they appear in Missed Follow-ups for the doctor and the front desk. With one click, the patient gets a reminder to book, or staff can book the visit for them straight away.
>
> **[Management]** Everything that happened today feeds into the administrator's view: today's appointments and revenue on the dashboard, trends in analytics, and detailed reports on appointments, revenue, prescriptions, follow-ups and lab orders, all ready to print or export.
>
> **[Summary]** One patient visit, and everyone involved stayed connected: registration, booking, consultation, digital prescription, pharmacy, lab, payment and follow-up, in one system. Each role has its own short video if you'd like to see more detail.

---

## 4. Recording-day timeline (day D)

| Time (example) | Role / window | Action | Feeds video |
|---|---|---|---|
| 08:30 | All | Pre-flight (`SCREEN_RECORDING_CHECKLIST.md`) | — |
| 09:00 | Super Admin | Video F | F, A-02 |
| 09:30 | Hospital Admin | Video B (without the Analytics scene) | B, A-03 |
| 10:00 | Receptionist + Dr. Kulkarni | Prep: Arjun Mehta's open visit | C-10 |
| 10:15 | Receptionist | Video C, Scenes 01–09 (Rahul booked for 11:30, checked in, billed) | C, A-04…06 |
| 10:45 | Doctor | Video D, Scenes 01–12 | D, A-07…09 |
| 11:30 | Receptionist | Video C, Scenes 10–13 | C, A-12, A-14 |
| 11:45 | Pharmacy | Video E | E, A-10 |
| 12:30 | Lab | Video H | H, A-11 |
| 13:15 | Receptionist | Prep: the ₹300 ECG invoice for Rahul | G-07 |
| 13:30 | Patient | Video G | G, A-13 |
| 14:15 | Hospital Admin | Video B, Scene 11, plus A-15 new footage | B, A-15 |
| 14:30 | — | Video A-01 new footage | A |
