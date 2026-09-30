# Master Product Demo — Recording Script

> **⚠️ REFERENCE DOCUMENT — not the recording instructions.** **RECORD FROM `RECORDING_RUNBOOK.md` ONLY.** Where this file differs from the runbook, follow the runbook. Recording day: **Saturday 10 October 2026**.

**Video:** Arogyix — One Patient, One Connected Hospital
**Target length:** 6:30
**Clip prefix:** `MST` (new footage only; everything else re-uses role clips, see below)
**Audience:** Hospital owners, clinic directors and decision makers seeing Arogyix for the first time
**Demo data:** `DEMO_DATA.md` §9 (the single cast and record register)

---

## The story

One patient, **Rahul Sharma**, walks into **Arogyix Multispeciality Hospital** with chest discomfort and high blood pressure. We follow him through every person who touches his care, and every screen we show is a real step in the app.

| Role | Person on screen | What they do in this story |
|---|---|---|
| Hospital Admin | **Meera Joshi** | Opens the day on the hospital dashboard; closes it with the revenue report |
| Receptionist | **Priya Deshmukh** | Registers Rahul, books him with Dr. Patil, checks him in, bills him, collects payment |
| Doctor | **Dr. Amit Patil** (Cardiology) | Reviews Rahul's allergy and history, records findings, prescribes, sends to the pharmacy, orders lab tests, sets a follow-up |
| Pharmacy | **Suresh Kale**, Wellness Pharmacy | Receives, verifies and dispenses the prescription; stock updates |
| Pathology Lab | **Dr. Anita Menon**, CarePlus Diagnostics | Tracks the sample, enters results, verifies and delivers the report |
| Patient | **Rahul Sharma** | Sees his prescription, lab report and bills at home; pays online |

```
Rahul arrives
  ↓  Priya registers him (allergy: Penicillin; condition: Hypertension)
  ↓  Priya books Dr. Amit Patil, 11:30 AM, from real free slots
  ↓  Rahul is checked in; bill generated (₹800, pending)
  ↓  Dr. Patil opens the visit, sees the allergy and history, records findings
  ↓  Dr. Patil writes the prescription → sends it to Wellness Pharmacy
  ↓  Dr. Patil completes the visit, sets a 2-week follow-up, orders Lipid Profile + KFT
  ↓  Wellness Pharmacy verifies and dispenses → stock and ledger update
  ↓  CarePlus tracks the sample, enters results, verifies and delivers the report
  ↓  Priya collects Rahul's payment → today's revenue updates
  ↓  Rahul sees his prescription, lab report and bills at home, pays the ECG bill online
  ↓  Meera sees the day in analytics and exports the revenue report
```

**Steps that do not exist, so the video never shows or says them:** an invoice created automatically when the visit ends; choosing cash/card/UPI when the receptionist collects; the pharmacy's dispensing creating a bill; credentials emailed automatically; lab High/Low flags set automatically (only Critical is automatic).

---

## How this video is produced: record once, use twice

Rahul can only be registered once, and his visit can only be completed once. So the master demo is **edited from the role-video takes** recorded on day D, plus four short new clips. Every scene below lists its footage source. The Action steps are the same steps performed in those role takes, repeated here so the whole story can be checked in one place.

| Scene | Footage source |
|---|---|
| 01 | **New clip MST-01** (landing page) |
| 02 | **New clip MST-02** (admin dashboard, morning of D) or `ADM-03` |
| 03 | `REC-04` |
| 04 | `REC-05`, `REC-06` |
| 05 | `DOC-04`, `DOC-05`, `DOC-06` |
| 06 | `DOC-07`, `DOC-08`, `DOC-09` |
| 07 | `PHA-04`, `PHA-05`, `PHA-06` (ledger only) |
| 08 | `DOC-10`, `LAB-04` … `LAB-08` |
| 09 | `REC-07`, `PAT-06` |
| 10 | `PAT-03`, `PAT-04`, `PAT-05`, **new clip MST-10** (admin analytics at end of D) or `ADM-10` |
| 11 | **New clip MST-11** (end slide built in the editor) |

---

## Video timeline

| Time | Scene | Section |
|---|---|---|
| 00:00–00:20 | 01 | Arogyix introduction |
| 00:20–00:40 | 02 | Hospital dashboard |
| 00:40–01:20 | 03 | Patient registration |
| 01:20–01:55 | 04 | Appointment and check-in |
| 01:55–02:35 | 05 | Doctor consultation |
| 02:35–03:25 | 06 | Digital prescription |
| 03:25–04:05 | 07 | Pharmacy |
| 04:05–04:50 | 08 | Pathology |
| 04:50–05:15 | 09 | Billing |
| 05:15–06:05 | 10 | Patient records and hospital reports |
| 06:05–06:30 | 11 | Closing |

---

## Pre-recording checklist

| # | Item | Check |
|---|---|---|
| 1 | **Browser** | Google Chrome, one profile per role (`Admin`, `Reception`, `DrPatil`, `Pharmacy`, `Lab`, `PatientRahul`) plus a clean logged-out profile for MST-01. Extensions off, bookmarks bar hidden, password saving off |
| 2 | **URL** | `<your-app-url>/` for MST-01; `<your-app-url>/login` for everything else |
| 3 | **Login accounts** | As listed in `DEMO_DATA.md` §1 and §9.5 |
| 4 | **Demo data** | `DEMO_DATA.md` §9 register printed or on a second screen, off camera |
| 5 | **Browser zoom** | 110% in every profile |
| 6 | **Screen resolution** | 1920×1080 for every clip, so role clips cut together cleanly |
| 7 | **Notifications disabled** | Do Not Disturb on, Chrome notifications off |
| 8 | **Clean browser** | One tab, download bar closed, reload before each take |
| 9 | **No personal information** | Only `DEMO_DATA.md` values; temporary passwords and invite tokens blurred |
| 10 | **Required demo records** | Everything in `DEMO_DATA.md` §9.2–§9.5 exists. **Rahul Sharma does not exist** at the start of day D. Warm-up data exists so the dashboard and analytics have history. All role takes listed above are recorded and labelled by clip ID before editing |

---

## Recording sequence (day D)

| Time (example) | What to record | Clips produced |
|---|---|---|
| 09:00 | **MST-02** admin dashboard (morning numbers), then the Admin video | MST-02, ADM-* |
| 10:00 | Receptionist Scenes 01–06 (Rahul booked for 11:30, checked in, billed) | REC-01…06 |
| 10:30 | Doctor video, all scenes | DOC-01…12 |
| 11:15 | Receptionist Scenes 07–09 (collect payment) | REC-07…09 |
| 11:30 | Off camera: Billing → **Create Invoice** ₹300 "Resting ECG" for Rahul | — |
| 11:45 | Pharmacy video | PHA-01…09 |
| 12:30 | Pathology video | LAB-01…09 |
| 13:15 | Patient video | PAT-01…09 |
| 14:00 | **MST-10** admin analytics and Revenue Report (now includes Rahul) | MST-10 |
| 14:15 | **MST-01** landing page (logged out) | MST-01 |
| Editing | **MST-11** end slide | MST-11 |

---

# Scene 01

## Duration
00:00 - 00:20

## Purpose
Introduce Arogyix and set up the one-patient story.

## User Role
None (public landing page)

## URL / Route
`/`

## Starting Screen
Landing page hero

## Action
1. Open `/` in a clean, logged-out profile.
2. Hold on the hero for 3 seconds.
3. Scroll slowly (about 600 px over 8 seconds) to **Built for every role**.
4. Stop and hold.

## Demo Data
None

## Expected Result
The hero ("Healthcare management made simple.") and **Built for every role** are visible, with no pop-ups.

## Voiceover
"Arogyix is a hospital management platform that connects everyone involved in a patient's care: the front desk, the doctor, the pharmacy, the lab, and the patient. Let's follow one patient, Rahul Sharma, through a single hospital visit."

## On-Screen Text
**Arogyix** — *Connected hospital management*
Disclaimer (bottom, small, 4 s): *All names and data in this video are fictitious.*

## Cursor / Highlight
Hide the cursor, or park it off the content.

## Zoom
Slow push-in from 100% to 105% over the whole scene (optional).

## Pause
2 seconds on **Built for every role**.

## Transition
Cross-fade (0.8 s) to Scene 02.

---

# Scene 02

## Duration
00:20 - 00:40

## Purpose
Show the hospital at the start of the day, from the administrator's view.

## User Role
Hospital Admin — Meera Joshi

## URL / Route
`/dashboard/hospital`

## Starting Screen
Hospital Dashboard

## Action
1. (Signed in as the admin.) Hover **Today's Appointments**, **Total Patients**, **Active Doctors**, **Today's Revenue**.
2. Scroll slightly to **Today's Appointment Status**.

## Demo Data
Warm-up data; morning of D.

## Expected Result
All stat cards show numbers.

## Voiceover
"It's morning at Arogyix Multispeciality Hospital. The administrator, Meera, can see today's appointments, patients, doctors on duty and revenue in one place."

## On-Screen Text
Lower-third: **Meera Joshi · Hospital Administrator**
Feature title (3 s): **Hospital Dashboard**

## Cursor / Highlight
Cyan box around the four stat cards.

## Zoom
Zoom to 120% on the stat cards.

## Pause
1 second on the stat cards.

## Transition
Hard cut to Scene 03 with the lower-third changing to the receptionist.

---

# Scene 03

## Duration
00:40 - 01:20

## Purpose
Register the patient, capturing the safety information the doctor needs.

## User Role
Receptionist — Priya Deshmukh

## URL / Route
`/dashboard/patients/new`

## Starting Screen
Front Desk Dashboard → **Register New Patient**

## Action
1. Click **Register Patient** (Reception Quick Actions).
2. Enter Rahul's details from `DEMO_DATA.md` §3: Rahul Sharma, `rahul.sharma@example.com`, `9800000201`, DOB `12-03-1978`, Male, B+, address in Aundh, Pune, emergency contact Anjali Sharma (Spouse).
3. **Allergies**: `Penicillin` + Enter. **Chronic Conditions**: `Hypertension` + Enter.
4. Click **Register Patient**.
5. Pause on **Patient Registered!** (Login Email, Temporary Password). Click **Done & Close**.

## Demo Data
PAT-01, Rahul Sharma.

## Expected Result
The patient is registered and his patient-portal login is created.

## Voiceover
"Rahul arrives at the front desk. Priya, the receptionist, registers him, including his penicillin allergy and high blood pressure. Arogyix creates his patient record and his own login for the patient portal."

## On-Screen Text
Lower-third: **Priya Deshmukh · Receptionist**
Feature title (3 s): **Patient Registration**

## Cursor / Highlight
**Red** box around the Penicillin allergy chip. Cyan box around the credentials.

## Zoom
Zoom to 130% on **Allergies**; 120% on the modal.

## Pause
1.5 seconds on the modal.

## Transition
Typing sped up to 3×. Temporary Password **blurred**. Hard cut.

---

# Scene 04

## Duration
01:20 - 01:55

## Purpose
Book a real, free slot with the right doctor, then check the patient in and raise the bill.

## User Role
Receptionist — Priya Deshmukh

## URL / Route
`/dashboard/appointments/new`, then `/dashboard/receptionist`

## Starting Screen
**Schedule New Appointment**

## Action
1. **Book Appointment** → patient **Rahul Sharma** → doctor **Dr. Amit Patil** → date D.
2. Click the **11:30 AM** slot in **Available Slots**. Type Regular Consultation. Reason: `Chest discomfort on exertion and high BP readings at home for 2 weeks`.
3. Click **Schedule Appointment**.
4. On the dashboard queue, search `Rahul`, click **Check In**, then **Generate Bill**.

## Demo Data
APT-01; INV-H01 (₹800).

## Expected Result
"Appointment scheduled successfully!", then Rahul is checked in and **Collect** appears on his row.

## Voiceover
"She books him with the cardiologist, Dr. Amit Patil. Only genuinely free times are offered, so there's no double-booking. When Rahul is ready, he's checked in, and his bill is raised from the doctor's consultation fee."

## On-Screen Text
Feature title (3 s): **Appointment Management**

## Cursor / Highlight
Cyan box around **Available Slots**, then Rahul's queue row.

## Zoom
Zoom to 140% on **Available Slots**; 130% on the queue row.

## Pause
1 second after each toast.

## Transition
Lower-third changes to the doctor. Hard cut.

---

# Scene 05

## Duration
01:55 - 02:35

## Purpose
Show an informed consultation: allergy up front, history one click away, notes saved.

## User Role
Doctor — Dr. Amit Patil

## URL / Route
`/dashboard/appointments/<id>` and `/dashboard/patients/<id>`

## Starting Screen
**Appointment Details**

## Action
1. Open Rahul's appointment from **Appointments**.
2. Pause on **Patient Registry Info** with **Allergies: Penicillin**.
3. Click **View Full File**, scroll the timeline briefly, go back.
4. Paste the consultation notes into **Clinical / Consultation Notes** and click **Save Notes**.

## Demo Data
Notes from `DEMO_DATA.md` §4.

## Expected Result
"Clinical notes saved successfully".

## Voiceover
"Dr. Patil opens Rahul's visit. The penicillin allergy is right there, along with the reason for the visit and his full history. After examining him, the doctor records his findings."

## On-Screen Text
Lower-third: **Dr. Amit Patil · Cardiologist**
Feature title (3 s): **Doctor Consultation**

## Cursor / Highlight
**Red** box around **Allergies**.

## Zoom
Zoom to 140% on **Patient Registry Info**.

## Pause
2 seconds on the allergy.

## Transition
Hard cut to the prescription form.

---

# Scene 06

## Duration
02:35 - 03:25

## Purpose
Show the digital prescription reaching the pharmacy, and the visit being closed with a follow-up.

## User Role
Doctor — Dr. Amit Patil

## URL / Route
`/dashboard/prescriptions/new?appointmentId=<id>`, `/dashboard/prescriptions`, `/dashboard/appointments/<id>`

## Starting Screen
**Write New Prescription**

## Action
1. Select patient **Rahul Sharma**. Diagnosis: `Essential Hypertension (Stage 1) with borderline dyslipidemia`.
2. Add Amlodipine 5mg, Atorvastatin 10mg, Pantoprazole 40mg from the suggestions (values in `DEMO_DATA.md` §4).
3. **Send to Pharmacy**: Wellness Pharmacy. Click **Generate Prescription**.
4. On the Prescriptions list, point at "Sent to Wellness Pharmacy"; open the **PDF** for 2 seconds.
5. Back on the appointment, click **Complete Appointment**, set the follow-up date D+14 = 24-10-2026, click **Schedule**.

## Demo Data
RX-01; follow-up D+14.

## Expected Result
"Prescription created and sent to Wellness Pharmacy!"; the visit is Completed with a **Scheduled Follow-up**.

## Voiceover
"He writes the prescription with suggestions from the hospital's own medicine catalog, and reminder times are scheduled for Rahul automatically. With one choice, the prescription goes straight to Wellness Pharmacy. Arogyix produces a branded PDF, and the visit can only be completed once the prescription exists. A follow-up is set for two weeks."

## On-Screen Text
Feature title (3 s): **Digital Prescription**

## Cursor / Highlight
Cyan box around the suggestion dropdown, then **Send to Pharmacy**, then **Scheduled Follow-up**.

## Zoom
Zoom to 140% on the suggestion dropdown; 130% on **Send to Pharmacy**.

## Pause
2 seconds on the PDF.

## Transition
Medicine entry sped up to 2×. Lower-third changes to the pharmacy. Hard cut.

---

# Scene 07

## Duration
03:25 - 04:05

## Purpose
Show the hospital-to-pharmacy handoff and stock control.

## User Role
Pharmacy — Suresh Kale, Wellness Pharmacy

## URL / Route
`/dashboard/pharmacy-portal/prescriptions/<id>`, then `/dashboard/pharmacy-portal/inventory`

## Starting Screen
Rx Queue, **Pending** tab

## Action
1. Open Rahul Sharma's prescription from the **Pending** tab.
2. Click **Verify Prescription**.
3. Enter **Dispense Qty** `1` for each medicine (Amlodipine 1, Atorvastatin 1, Pantoprazole 1) and click **Dispense Selected Items**. Never 30 / 30 / 14.
4. Open **Inventory** → **Stock Ledger** and point at the dispense rows.

## Demo Data
RX-01; INV-01…03.

## Expected Result
"Prescription verified", then "Prescription dispensed". The ledger shows the movements.

## Voiceover
"At Wellness Pharmacy, Rahul's prescription is already waiting, matched to the pharmacy's own catalog. The pharmacist verifies it and dispenses the medicines. Stock is taken from the batch that expires first, and every movement is recorded."

## On-Screen Text
Lower-third: **Suresh Kale · Wellness Pharmacy**
Feature title (3 s): **Pharmacy Management**

## Cursor / Highlight
Cyan box around the Items table, then the ledger rows.

## Zoom
Zoom to 130% on the Items table.

## Pause
1 second after each toast.

## Transition
Hard cut to the lab order (the doctor's side).

---

# Scene 08

## Duration
04:05 - 04:50

## Purpose
Show the lab loop: order in, sample tracked, results verified, report delivered.

## User Role
Doctor (order), then Pathology Lab — Dr. Anita Menon, CarePlus Diagnostics

## URL / Route
`/dashboard/pathology-orders/new`, then `/dashboard/pathology-portal/orders/<id>`

## Starting Screen
**New Lab Order** (doctor), then the lab's order detail

## Action
1. (Doctor) **Lab Orders** → **New Order** → CarePlus Diagnostics → Rahul Sharma → tick **Lipid Profile** and **Kidney Function Test (KFT)** → **Place Order**.
2. (Lab) Open Rahul's order. **Mark Collected — Assign Sample ID** → **Receive at Lab** → **Accept Sample** → **Start Processing**.
3. **Enter Results** for Lipid Profile with Flags set to **High** where shown in `DEMO_DATA.md` §4. **Save Results**.
4. **Submit for Verification** → **Review & Verify** → tick "I have reviewed the results" → **Confirm & Verify**.
5. **Deliver Report**.

## Demo Data
LO-01; result values from `DEMO_DATA.md` §4.

## Expected Result
"Lab order placed" … "Report delivered".

## Voiceover
"Dr. Patil also orders blood tests from CarePlus Diagnostics, the hospital's partner lab. The lab tracks Rahul's sample with its own ID from collection to processing. Results are entered and high values are clearly flagged. Once the pathologist verifies the report, it's delivered straight into Rahul's hospital record, and both Rahul and his doctor are notified."

## On-Screen Text
Lower-third (at the lab cut): **Dr. Anita Menon · CarePlus Diagnostics**
Feature title (3 s): **Lab Workflow**

## Cursor / Highlight
Cyan box around the Sample ID, the **Flag** column, then **Deliver Report**.

## Zoom
Zoom to 130% on the Flag column.

## Pause
1 second on the flags.

## Transition
Sample steps shown as a 3× montage. Lower-third changes back to the receptionist. Hard cut.

---

# Scene 09

## Duration
04:50 - 05:15

## Purpose
Close the billing loop at the desk, and show online payment.

## User Role
Receptionist — Priya Deshmukh; then Patient — Rahul Sharma

## URL / Route
`/dashboard/receptionist`, then `/dashboard/billing` (patient)

## Starting Screen
Front Desk Dashboard

## Action
1. (Receptionist) On Rahul's row, click **Collect**. Point at **Today's Revenue**.
2. (Patient) On **My Billing**, click **Pay Now** on the ₹300 "Resting ECG" invoice → **UPI** → complete the Razorpay test payment. *(Skip step 2 if Razorpay test keys aren't set.)*

## Demo Data
INV-H01 (₹800); INV-H02 (₹300).

## Expected Result
"Payment recorded successfully"; today's revenue updates. With test keys: "Payment successful!".

## Voiceover
"Back at the desk, Rahul pays for his consultation and the receptionist records it. Today's revenue updates instantly. Bills can also be paid online from the patient portal, by UPI, card, net banking or wallet."

## On-Screen Text
Feature title (3 s): **Billing**

## Cursor / Highlight
Cyan box around **Today's Revenue**, then the payment methods.

## Zoom
Zoom to 130% on **Today's Revenue**.

## Pause
1 second on **Today's Revenue**.

## Transition
Lower-third changes to the patient. Hard cut.

---

# Scene 10

## Duration
05:15 - 06:05

## Purpose
Show the patient's own records, then the hospital's reports at the end of the day.

## User Role
Patient — Rahul Sharma; then Hospital Admin — Meera Joshi

## URL / Route
`/dashboard/patient`, `/dashboard/prescriptions`, `/dashboard/reports`, then `/dashboard/analytics`

## Starting Screen
Patient dashboard

## Action
1. (Patient) Hover **Medicines Due** on the dashboard.
2. (Patient) **Prescriptions** → open the **PDF** for 2 seconds.
3. (Patient) **Reports** → point at the CarePlus lab report.
4. (Admin, MST-10) **Analytics** → pause on the charts → Reports → **Revenue Report** → **Today** → **Export**.

## Demo Data
RX-01, LR-01; RPT-OPS.

## Expected Result
The patient sees his medicines, prescription and lab report. The admin's Revenue Report lists today's invoices including Rahul's.

## Voiceover
"At home, Rahul sees which medicines are due, downloads his prescription, and opens his lab report the moment it's delivered. And at the end of the day, everything that happened feeds the administrator's analytics and reports, ready to print or export."

## On-Screen Text
Lower-third: **Rahul Sharma · Patient**, then **Meera Joshi · Hospital Administrator**
Feature title (3 s): **Records & Reports**

## Cursor / Highlight
Cyan box around **Medicines Due**, the lab report row, then **Export**.

## Zoom
Zoom to 125% on each highlighted element.

## Pause
1 second on each screen.

## Transition
Cross-fade (0.8 s) to the end slide.

---

# Scene 11

## Duration
06:05 - 06:30

## Purpose
Recap the connected journey and close.

## User Role
None (end slide)

## URL / Route
None. Built in the editor.

## Starting Screen
End slide

## Action
1. Show the journey as six role icons joined by arrows: Front desk → Doctor → Pharmacy → Lab → Patient → Administrator. Animate each icon in on the matching words of the voiceover.
2. Fade to the Arogyix logo and end card.

## Demo Data
None

## Expected Result
The viewer sees the whole journey in one frame.

## Voiceover
"One patient visit: registration, booking, consultation, digital prescription, pharmacy, lab, payment and follow-up. Every person connected, in one system. That's Arogyix."

## On-Screen Text
**Arogyix** — *One patient. One connected hospital.*
Below: your website or contact line.

## Cursor / Highlight
None

## Zoom
None

## Pause
3 seconds on the logo at the end.

## Transition
Fade to black (1 s).

---

## Post-recording checklist

- [ ] No accidental clicks in any source clip
- [ ] No personal information: temporary passwords, invite tokens and inbox windows are blurred or cropped
- [ ] No browser errors or red toasts
- [ ] No loading screens (trim every skeleton and spinner)
- [ ] No irrelevant screens
- [ ] No developer tools visible
- [ ] No console errors visible
- [ ] Cursor movement is smooth across cuts (cursor position roughly matches at each cut, or is hidden)
- [ ] Narration matches the screen, and nothing in the "steps that do not exist" list above is said or shown
- [ ] Transitions are clean: hard cuts inside the story, cross-fades only at the start and end
- [ ] Rahul's details are identical in every scene (name, allergy, doctor, time, medicines, amounts)
