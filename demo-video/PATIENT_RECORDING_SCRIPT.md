# Patient — Recording Script

> **⚠️ REFERENCE DOCUMENT — not the recording instructions.** **RECORD FROM `RECORDING_RUNBOOK.md` ONLY.** Where this file differs from the runbook, follow the runbook. Recording day: **Saturday 10 October 2026**.

**Video:** Arogyix for Patients
**Target length:** 3:00
**Clip prefix:** `PAT`
**Login:** `rahul.sharma@example.com` / the **Temporary Password** noted during Receptionist Scene 04
**Demo data:** `DEMO_DATA.md` §3, §4 and §9

---

## The story

| | |
|---|---|
| **Who** | Rahul Sharma, a patient of Arogyix Multispeciality Hospital, at home after his visit |
| **Why** | He wants his prescription, his lab results and his bills without calling the hospital, and he wants to book his review |
| **Problem** | Lost paper prescriptions, waiting days for lab reports, queuing to pay, and phoning to book |
| **Action** | He signs in, checks his medicines, downloads his prescription, opens his lab report, pays an invoice online, books his follow-up, and messages his doctor |
| **What happens next** | The hospital sees his online payment and new booking immediately. Dr. Patil sees his message |

```
Rahul goes home → signs in → sees medicines due → downloads prescription PDF
   → opens the CarePlus lab report → pays the ECG invoice online → books his 2-week review
   → replies to Dr. Patil in Chat
```

---

## Video timeline

| Time | Scene | Section |
|---|---|---|
| 00:00–00:08 | 01 | Introduction |
| 00:08–00:20 | 02 | Login |
| 00:20–00:45 | 03 | Patient dashboard |
| 00:45–01:10 | 04 | My Prescriptions |
| 01:10–01:35 | 05 | Lab report |
| 01:35–02:05 | 06 | Billing and online payment |
| 02:05–02:35 | 07 | Book the follow-up |
| 02:35–02:50 | 08 | Chat with the doctor |
| 02:50–03:00 | 09 | Summary |

---

## Pre-recording checklist

| # | Item | Check |
|---|---|---|
| 1 | **Browser** | Google Chrome, the `PatientRahul` profile. Extensions off, bookmarks bar hidden, password saving off |
| 2 | **URL** | `<your-app-url>/login` in a single tab |
| 3 | **Login account** | `rahul.sharma@example.com` and the Temporary Password from the "Patient Registered!" modal. If it was lost, use **Forgot password** beforehand (needs SMTP) |
| 4 | **Demo data** | `DEMO_DATA.md` §4 open off camera (chat reply, follow-up reason) |
| 5 | **Browser zoom** | 110% |
| 6 | **Screen resolution** | 1920×1080, browser maximised |
| 7 | **Notifications disabled** | Do Not Disturb on, Chrome notifications off |
| 8 | **Clean browser** | One tab, download bar closed, page reloaded before the take |
| 9 | **No personal information** | Only demo values; no real UPI ID or card number (Razorpay **test** mode only) |
| 10 | **Required demo records** | Rahul has: the prescription (Doctor video); the **paid ₹800** consultation invoice (Receptionist Scene 07); a **pending ₹300 "Resting ECG"** invoice (created off camera via Billing → **Create Invoice**); the **delivered CarePlus lab report** (Pathology video); Dr. Patil's **chat message** (Doctor Scene 11). Razorpay test keys are set if you'll complete Pay Now |

---

## Recording sequence

Scene 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09

---

# Scene 01

## Duration
00:00 - 00:08

## Purpose
Introduce the patient's view.

## User Role
None (title card)

## URL / Route
None. Title card over a blurred still of `/dashboard/patient`.

## Starting Screen
Title card

## Action
1. No live action.

## Demo Data
None

## Expected Result
The viewer knows this is Rahul's side of the story.

## Voiceover
"Rahul is home. Everything from his visit is waiting for him in the patient portal."

## On-Screen Text
**Arogyix for Patients**

## Cursor / Highlight
None

## Zoom
None

## Pause
Hold the full 8 seconds.

## Transition
Cross-fade (0.5 s) to the login page.

---

# Scene 02

## Duration
00:08 - 00:20

## Purpose
Show how a patient registered at the front desk signs in.

## User Role
Patient

## URL / Route
`/login` → `/dashboard/patient`

## Starting Screen
Login page

## Action
1. Type `rahul.sharma@example.com` in **Email address**.
2. Type the temporary password.
3. Click **Sign In**.

## Demo Data
Rahul's login.

## Expected Result
The patient dashboard opens with "Hello, Rahul! 👋".

## Voiceover
"He signs in with the login the front desk gave him. Patients can also sign up themselves by choosing their hospital."

## On-Screen Text
Lower-third: **Rahul Sharma · Patient**

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
00:20 - 00:45

## Purpose
Show the patient's health overview.

## User Role
Patient

## URL / Route
`/dashboard/patient`

## Starting Screen
Patient dashboard

## Action
1. Hover **Upcoming Appointments**.
2. Hover **Medicines Due** (reminder times from the prescription).
3. Hover **Recent Prescriptions**.
4. Hover the billing card showing **Amount Due** (₹300) and **Pay Now**.
5. Hover **Recent Reports**.

## Demo Data
Rahul's records from the day.

## Expected Result
Medicines Due lists his upcoming doses. Amount Due shows ₹300.

## Voiceover
"His dashboard shows the medicines due next, with times, his latest prescription, any amount still to pay, and his most recent reports."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around **Medicines Due**, then **Amount Due**.

## Zoom
Zoom to 130% on **Medicines Due**.

## Pause
1.5 seconds on **Medicines Due**.

## Transition
Click **Prescriptions** in the sidebar. Hard cut.

> If **Medicines Due** shows "No medicines due", the reminder times have already passed today. Drop "the medicines due next" from the voiceover.

---

# Scene 04

## Duration
00:45 - 01:10

## Purpose
Show the digital prescription and PDF.

## User Role
Patient

## URL / Route
`/dashboard/prescriptions`

## Starting Screen
**My Prescriptions**

## Action
1. Pause on Dr. Patil's prescription card (diagnosis, medicines, "Sent to Wellness Pharmacy").
2. Click **PDF**.
3. Show the PDF for 3 seconds, then close it.

## Demo Data
RX-01.

## Expected Result
The prescription PDF opens with the hospital branding and all three medicines.

## Voiceover
"His prescription is here, with each medicine's dose, timing and duration, and the pharmacy it was sent to. He can download it any time. No more lost paper."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around the medicine list, then **PDF**.

## Zoom
Zoom to 125% on the medicine list.

## Pause
3 seconds on the PDF.

## Transition
Click **Reports** in the sidebar. Hard cut.

---

# Scene 05

## Duration
01:10 - 01:35

## Purpose
Show lab results reaching the patient automatically.

## User Role
Patient

## URL / Route
`/dashboard/reports`

## Starting Screen
**Report Repository**

## Action
1. Point at the CarePlus lab report row ("Lab Report — LAB-2026-…").
2. Open it. Show it for 2 seconds, then close it.

## Demo Data
LR-01.

## Expected Result
The lab report opens, showing the results with High flags.

## Voiceover
"His blood test results are already here. The lab delivered them straight into his record, and he was notified. He can also upload older reports so his doctor can see them."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around the lab report row.

## Zoom
Zoom to 120% on the report.

## Pause
2 seconds on the report.

## Transition
Click **Billing** in the sidebar. Hard cut.

---

# Scene 06

## Duration
01:35 - 02:05

## Purpose
Show invoices and online payment.

## User Role
Patient

## URL / Route
`/dashboard/billing`

## Starting Screen
**My Billing**

## Action
1. Hover **Amount Due**, **Total Paid** and **Total Invoices**.
2. Point at the paid ₹800 consultation invoice.
3. On the ₹300 "Resting ECG" invoice, click **Pay Now**.
4. In "Choose a payment method", click **UPI**.
5. **With Razorpay test keys:** click **Proceed to Payment** and complete Razorpay's test flow. Wait for "Payment successful!".
6. **Without Razorpay keys:** stop after step 4, close the dialog, and use the alternative voiceover below.

## Demo Data
INV-H01 (paid ₹800), INV-H02 (pending ₹300).

## Expected Result
With test keys: "Payment successful!" and the ₹300 invoice shows as paid.

## Voiceover
"All his invoices are in one place. The consultation was paid at the desk. For the ECG, he pays online by UPI, card, net banking or wallet, and the invoice is marked paid automatically."

*Alternative (no Razorpay):* "All his invoices are in one place. Anything still due can be paid online by UPI, card, net banking or wallet."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around the payment method options.

## Zoom
Zoom to 130% on "Choose a payment method".

## Pause
1.5 seconds after "Payment successful!".

## Transition
Click **Appointments** in the sidebar. Hard cut.

---

# Scene 07

## Duration
02:05 - 02:35

## Purpose
Show self-service booking of the follow-up.

## User Role
Patient

## URL / Route
`/dashboard/appointments` → `/dashboard/appointments/new`

## Starting Screen
Appointments → **Schedule New Appointment**

## Action
1. Click **New Appointment**.
2. Check the patient shows **Your Profile**.
3. **Doctor / Specialist**: type `Amit`, choose **Dr. Amit Patil**.
4. **Appointment Date**: D+14 = 24-10-2026 (Saturday).
5. **Available Slots**: click the first free slot.
6. **Appointment Type**: Follow Up Visit.
7. **Reason for Visit**: `Two-week BP review`.
8. Click **Schedule Appointment**.

## Demo Data
APT-02.

## Expected Result
"Appointment scheduled successfully!" The new appointment appears in his list.

## Voiceover
"Dr. Patil asked to see him in two weeks. Rahul books the review himself, choosing from the doctor's free times. The hospital sees the booking straight away."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around **Available Slots**.

## Zoom
Zoom to 140% on **Available Slots**.

## Pause
1.5 seconds after the toast.

## Transition
Click **Chat** in the sidebar. Hard cut.

---

# Scene 08

## Duration
02:35 - 02:50

## Purpose
Show direct messaging with the doctor.

## User Role
Patient

## URL / Route
`/dashboard/chat`

## Starting Screen
Chat

## Action
1. Open the conversation with **Dr. Amit Patil**.
2. Point at Dr. Patil's earlier message.
3. Paste the reply from `DEMO_DATA.md` §4 and send it.

## Demo Data
"Thank you, Doctor. Can I take Amlodipine with my morning tea?"

## Expected Result
Rahul's message appears under Dr. Patil's.

## Voiceover
"And if he has a question about his medicines, he can message Dr. Patil directly."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around the conversation.

## Zoom
Zoom to 125% on the conversation.

## Pause
1.5 seconds after sending.

## Transition
Click **Dashboard**. Cross-fade (0.5 s).

---

# Scene 09

## Duration
02:50 - 03:00

## Purpose
Close the patient story.

## User Role
Patient

## URL / Route
`/dashboard/patient`

## Starting Screen
Patient dashboard

## Action
1. Wait for the dashboard. Park the cursor on the right.

## Demo Data
None

## Expected Result
**Upcoming Appointments** now shows the D+14 review.

## Voiceover
"Prescriptions, results, bills and his doctor, all in one place."

## On-Screen Text
End card: **Arogyix — connected care**

## Cursor / Highlight
Cyan box around the new upcoming appointment.

## Zoom
None

## Pause
3 seconds on the final frame.

## Transition
Fade to the end card (1 s).

---

## Post-recording checklist

- [ ] No accidental clicks (especially **Cancel** on an appointment)
- [ ] No personal information: no real card, UPI ID or email inbox visible
- [ ] No browser errors or red toasts (a 503 on Pay Now means Razorpay keys are missing: use the alternative take)
- [ ] No loading screens left in the cut
- [ ] No irrelevant screens
- [ ] No developer tools visible
- [ ] No console errors visible
- [ ] Cursor movement is smooth
- [ ] Narration matches the screen (use the alternative Scene 06 line if payment wasn't completed)
- [ ] Transitions are clean
