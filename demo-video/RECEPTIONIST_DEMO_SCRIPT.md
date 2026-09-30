# Video C — Receptionist Demo

> **⚠️ REFERENCE DOCUMENT — not the recording instructions.** **RECORD FROM `RECORDING_RUNBOOK.md` ONLY.** Where this file differs from the runbook, follow the runbook. Recording day: **Saturday 10 October 2026**.

| | |
|---|---|
| **Duration** | 7:05 |
| **Target audience** | Front-desk staff who are new to Arogyix |
| **Objective** | Handle a walk-in patient from start to finish: register, book, check in, bill, collect payment, check out. Then find records, follow-ups and reports |
| **Starting screen** | `/login` |
| **Ending screen** | Front Desk Dashboard showing Rahul Sharma as Completed and Paid |
| **Main workflow** | Register Patient → Book Appointment → Check In → Generate Bill → (doctor consults) → Check Out → Collect |
| **Must show** | Front Desk Dashboard, Register New Patient + credentials modal, Schedule New Appointment (live slots), Patient Queue actions, Billing & Invoices |
| **Can skip** | Pharmacies, Pathology Labs, Lab Orders, Notifications, Settings, patient Timeline tab |
| **Narration style** | Practical, step-by-step, one action per sentence |
| **Login used** | `priya.deshmukh@example.com` / `Demo@12345` |
| **Data** | `DEMO_DATA.md` §3 and §4 |

**Before recording**
- Record on **day D** (gap G1).
- Rahul Sharma does **not** exist yet.
- Dr. Amit Patil's availability includes today, and 11:30 (or a later slot) is free.
- Scene 10 needs Video D (Scenes 05–08) to be recorded **between** Scene 09 and Scene 10, so that Dr. Patil has written Rahul's prescription and completed the visit.
- ⚠️ **Never click "Check Out" on Rahul Sharma's row.** It completes his visit from the desk and bypasses the doctor's follow-up workflow. The runbook (the only recording source) doesn't use Check Out at all. In this extended cut it's shown **only** on Arjun Mehta's row.
- Scene 10 also needs a second open visit to show **Check Out**. Before recording, book **Arjun Mehta** with Dr. Sneha Kulkarni for an earlier slot on D, check him in, and have Dr. Kulkarni write a short prescription (Paracetamol 500mg, 3 days, "Viral fever") **without** completing it. See `DEMO_DATA.md` §4.

---

## Storyboard

### Scene 01 — Introduction
**Time:** 00:00–00:15 · *Story step 1*

- **Screen:** Title card over a blurred Front Desk Dashboard
- **Purpose:** Introduce the role
- **User action:** None
- **On-screen action:** Title "Arogyix for the Front Desk"
- **Voiceover:** "This video is for receptionists. You'll follow one patient from the moment they walk in to the moment they've paid and checked out."
- **Highlight:** None
- **Transition:** Fade to the login page
- **Expected result:** The viewer knows the scope

**Recording checklist**
1. Take a still of `/dashboard/receptionist` for the background.

### Scene 02 — Login
**Time:** 00:15–00:30 · *Story step 2*

- **Screen:** Login
- **Purpose:** Show entry
- **User action:** Enter the email and password, click **Sign In**
- **On-screen action:** Redirect to the Front Desk Dashboard
- **Voiceover:** "Sign in with the email and password you created from your invite link. Arogyix opens the Front Desk Dashboard."
- **Highlight:** The **Sign In** button
- **Transition:** Cut on load
- **Expected result:** Logged in

**Recording checklist**
1. `/login` → type `priya.deshmukh@example.com` → password → **Sign In**.
2. Check that the URL is `/dashboard/receptionist`.

### Scene 03 — Front Desk Dashboard
**Time:** 00:30–01:05 · *Story step 3*

- **Screen:** Front Desk Dashboard
- **Purpose:** Orient the viewer
- **User action:** Hover the stat cards, the quick actions, then the queue
- **On-screen action:** Today's Appointments, Checked-In / Waiting, Payments Pending, Today's Revenue; Reception Quick Actions; Patient Queue & Schedule
- **Voiceover:** "At the top, you can see today's bookings, who's checked in and waiting, which payments are still pending, and today's revenue. The quick actions let you register a patient, book an appointment, open billing, see missed follow-ups, or run reports. Below that is today's patient queue, where most of your day happens."
- **Highlight:** Zoom on the four stat cards, then box the **Reception Quick Actions**
- **Transition:** Move to the sidebar
- **Expected result:** The viewer understands the layout

**Recording checklist**
1. Hover each stat card for 1 s.
2. Hover each quick action button: **Register Patient**, **Book Appointment**, **Billing Center**, **Missed Follow-ups**, **Reports**.
3. Scroll down 300 px to show the **Patient Queue & Schedule** header and filters, then scroll back up.

### Scene 04 — Menu
**Time:** 01:05–01:20 · *Story step 4*

- **Screen:** Sidebar
- **Purpose:** Show responsibilities
- **User action:** Hover the menu
- **On-screen action:** Appointments, Follow-ups, Reports, Patients, Pharmacies, Pathology Labs, Lab Orders, Billing
- **Voiceover:** "Your menu covers appointments, follow-ups, patients, billing and reports, as well as your hospital's partner pharmacies and labs."
- **Highlight:** Menu glow
- **Transition:** Click **Register Patient** in the quick actions
- **Expected result:** The viewer sees the scope of the role

**Recording checklist**
1. Hover from **Appointments** to **Billing**, about 0.6 s each.

### Scene 05 — Register a new patient
**Time:** 01:20–02:35 · *Story step 5: Primary workflow (1/5)*

- **Screen:** Register New Patient
- **Purpose:** The main front-desk task
- **User action:** Fill in each section and click **Register Patient**
- **On-screen action:** A "Patient Registered!" modal showing the Login Email and Temporary Password
- **Voiceover:** "To register a new patient, click Register Patient. Enter their name, email and phone number. Then add their date of birth, gender, blood group, address and an emergency contact. If the patient has allergies or long-term conditions, type each one and press Enter. The doctor will see these during the consultation. Click Register Patient. Arogyix creates the patient record with a unique patient code, and also creates a login for the patient portal. Copy the temporary password and give it to the patient so they can sign in later."
- **Highlight:** Zoom on **Clinical History & Notes** while typing the allergy; box the credentials in the modal
- **Transition:** Click **Done & Close**
- **Expected result:** The patient is registered and their login is ready

**Recording checklist**
1. Click **Register Patient** (quick action). The URL is `/dashboard/patients/new`.
2. **Account Information**: First Name `Rahul`, Last Name `Sharma`, Email `rahul.sharma@example.com`, Phone `9800000201`. Leave the WhatsApp toggle off.
3. **Demographics & Address**: Date of Birth `12-03-1978`, Gender **Male**, Blood Group **B+**, Residential Address `Flat 12, Sai Residency, Aundh`, City `Pune`.
4. **Emergency Contact**: `Anjali Sharma`, `Spouse`, `9800000202`.
5. **Allergies**: type `Penicillin` + Enter. **Chronic Conditions**: `Hypertension` + Enter.
6. **Clinical Notes**: `Home BP readings around 150/95 over the last two weeks. Non-smoker.`
7. Click **Register Patient**. Pause 2 s on the modal.
8. Blur the temporary password in the edit (gap G13).
9. Click **Done & Close**.

### Scene 06 — Patient file and family member
**Time:** 02:35–03:05 · *Story step 7: Important features*

- **Screen:** Patients → Rahul Sharma's file
- **Purpose:** Show search and the patient file
- **User action:** Search "Rahul", click **View**, open the **Family Members** tab, click **Link Member**, save
- **On-screen action:** The personal summary with Penicillin under allergies; the "Family member added successfully!" toast
- **Voiceover:** "Every patient can be found by name, phone number or patient code. The patient file shows their personal details, allergies, conditions and emergency contact. You can also link family members, so relatives are kept together under one record."
- **Highlight:** Zoom on the patient code and the Allergies box
- **Transition:** Click **Dashboard**, then **Book Appointment**
- **Expected result:** The viewer can find a patient and knows what the file contains

**Recording checklist**
1. Sidebar **Patients** → type `Rahul` in "Search by name, phone, patient code...".
2. Click **View** on Rahul Sharma.
3. Click the **Family Members** tab (skip **Timeline**, which appears empty for receptionists).
4. Click **Link Member**: `Anjali Sharma`, Relation `Spouse`, Phone `9800000202`, Gender Female, Blood Group O+ → save.
5. Check that the toast appears and the member card is visible.

### Scene 07 — Book an appointment
**Time:** 03:05–04:20 · *Story step 5: Primary workflow (2/5)*

- **Screen:** Schedule New Appointment
- **Purpose:** Show slot-based booking
- **User action:** Select the patient, doctor and date, pick a slot, fill in visit details, click **Schedule Appointment**
- **On-screen action:** The **Booking Summary** updates live; the "Appointment scheduled successfully!" toast
- **Voiceover:** "Next, book the appointment. Search for the patient and select them. Then search for the doctor by name, department or specialization. Arogyix shows the doctor's specialization, department and consultation fee. Choose the date, and the available time slots for that day appear. Slots that are already booked, or outside the doctor's hours, aren't shown. Pick a slot, choose the appointment type, and enter the reason for the visit. The booking summary on the right shows the patient, doctor, time and fee. Click Schedule Appointment. The patient receives a notification about the booking."
- **Highlight:** Zoom on **Available Slots**, then on **Booking Summary**
- **Transition:** Return to the dashboard
- **Expected result:** The appointment is booked in a real, available slot

**Recording checklist**
1. Dashboard → **Book Appointment**.
2. **Select Registered Patient**: type `Rahul` → click Rahul Sharma.
3. **Doctor / Specialist**: type `Amit` → click Dr. Amit Patil. Pause 1 s on **Selected Doctor Info** (Cardiology, ₹800).
4. **Appointment Date**: today (D). Wait for "Fetching doctor availability slots..." to finish.
5. **Available Slots**: click **11:30 AM** (or the first free slot). Pause.
6. **Appointment Type**: Regular Consultation.
7. **Reason for Visit**: `Chest discomfort on exertion and high BP readings at home for 2 weeks`.
8. **Additional Notes**: `Brings home BP log. Known Penicillin allergy.`
9. Hover the **Booking Summary** → click **Schedule Appointment**.
10. If you see "Cannot book an appointment in the past", you picked a slot that has already passed. Pick a later one.

### Scene 08 — Check the patient in
**Time:** 04:20–04:45 · *Story step 5: Primary workflow (3/5)*

- **Screen:** Front Desk Dashboard → Patient Queue & Schedule
- **Purpose:** Arrival
- **User action:** Search "Rahul" in the queue, click **Check In**
- **On-screen action:** The status changes to Checked-In / In-Progress; the Checked-In / Waiting count goes up
- **Voiceover:** "When the patient arrives, find them in today's queue and click Check In. Their status changes to checked in, and they appear on the doctor's schedule as ready to be seen."
- **Highlight:** The status badge before and after
- **Transition:** Stay on the row
- **Expected result:** The patient is in the doctor's queue

**Recording checklist**
1. Dashboard → queue search "Search patient/doctor..." → `Rahul`.
2. Click **Check In**. Check for the "Appointment status updated successfully" toast.
3. Hover the new status badge for 1 s.

### Scene 09 — Generate the bill
**Time:** 04:45–05:10 · *Story step 5: Primary workflow (4/5)*

- **Screen:** Queue → Invoice / Billing column
- **Purpose:** Show that billing is a deliberate step
- **User action:** Click **Generate Bill**
- **On-screen action:** The "Invoice generated successfully!" toast; **Collect** appears
- **Voiceover:** "Once the patient is checked in, you can create their bill. Click Generate Bill. Arogyix creates an invoice using the doctor's consultation fee. The invoice shows as pending until it's paid."
- **Highlight:** The **Generate Bill** button, then the **Collect** button
- **Transition:** Title card "After the consultation…" (see Video D)
- **Expected result:** The invoice exists and is pending

**Recording checklist**
1. On Rahul's row, click **Generate Bill**.
2. Check that **Collect** now appears on the row.
3. **Stop recording.** Record Video D, Scenes 05–08, as Dr. Amit Patil: the prescription and **Complete Appointment**. Then come back here.

### Scene 10 — Check out and collect payment
**Time:** 05:10–05:45 · *Story step 5: Primary workflow (5/5)*

- **Screen:** Queue
- **Purpose:** Close the visit
- **User action:** On Arjun Mehta's row click **Check Out**, then on Rahul Sharma's row click **Collect**
- **On-screen action:** Arjun's status becomes Completed; Rahul's invoice becomes Paid; Today's Revenue increases by ₹800
- **Voiceover:** "When the consultation is over, the visit shows as completed in your queue. If a doctor hasn't closed the visit themselves, click Check Out to complete it. A visit can only be completed once a prescription has been written. When the patient pays, click Collect to record the payment. The invoice is marked as paid, and today's revenue updates straight away."
- **Highlight:** Zoom on the **Today's Revenue** card after Collect
- **Transition:** Click **Billing Center**
- **Expected result:** The visit is closed and paid

**Recording checklist**
1. Click the dashboard **Refresh** button. Clear the queue search so both Arjun and Rahul are visible.
2. Point at Rahul's **Completed** badge (completed by the doctor in Video D).
3. On Arjun Mehta's row, click **Check Out**. If you see "Please write a prescription…", Dr. Kulkarni's prep prescription is missing.
4. On Rahul Sharma's row, click **Collect**. Check for the "Payment recorded successfully" toast.
5. Scroll up and hover **Today's Revenue**.
6. Don't narrate choosing cash, card or UPI. **Collect** doesn't ask for a method (gap G10).

### Scene 11 — Billing & Invoices
**Time:** 05:45–06:20 · *Story step 6: Secondary workflow*

- **Screen:** Billing & Invoices
- **Purpose:** Show the billing ledger
- **User action:** Show the summary cards, filter **Paid Only**, set a date range, download the invoice PDF, click **Export**
- **On-screen action:** The invoice list, PDF opening, CSV download
- **Voiceover:** "The billing page lists every invoice. Filter by status or date to find unpaid bills or a day's collections. Download any invoice as a PDF to print or give to the patient, or export the list for your accounts team. You can also click Create Invoice to bill a patient for other services."
- **Highlight:** The status filter and the download icon
- **Transition:** Click **Missed Follow-ups** from the dashboard
- **Expected result:** The viewer can find and print invoices

**Recording checklist**
1. **Billing Center** → `/dashboard/billing`.
2. Hover **Total Invoices Issued** and **Unpaid Bills Pending**.
3. Status filter → **Paid Only**. From/To → today.
4. Click the download icon on Rahul's invoice. Show the PDF for 2 s, then close it.
5. Click **Export**.
6. Hover **Create Invoice** without clicking.
7. Avoid: the email and WhatsApp icons, which only show "available soon" (gap G9).

### Scene 12 — Follow-ups and reports
**Time:** 06:20–06:50 · *Story step 7*

- **Screen:** Missed Follow-ups, then Reports
- **Purpose:** Patient retention and daily reporting
- **User action:** Show a missed follow-up and click the reminder button; open Reports and choose **Appointment Report** → **Today**
- **On-screen action:** "Reminder sent" status; the report table
- **Voiceover:** "Missed Follow-ups lists patients whose follow-up date has passed without a new booking. You can call them, send a reminder through Arogyix, or book their next visit straight away. Under Reports, you can run appointment, patient, billing and other reports for any date range, and print or export them."
- **Highlight:** The bell or reminder icon; the **Export** and **Print** buttons
- **Transition:** Fade to the dashboard
- **Expected result:** The viewer knows these tools exist

**Recording checklist**
1. Dashboard → **Missed Follow-ups**. This needs warm-up data (Sunita Rao). If the list is empty, show the empty state and say "when a follow-up is missed, it appears here".
2. Click the reminder button (tooltip "Send the patient a reminder to book their follow-up"). Check for the "Follow-up reminder sent to patient" toast.
3. Sidebar **Reports** → Report type **Appointment Report** → preset **Today**.

### Scene 13 — Summary
**Time:** 06:50–07:05 · *Story step 8*

- **Screen:** Front Desk Dashboard
- **Purpose:** Wrap up
- **User action:** None
- **On-screen action:** Rahul Sharma's row shows Completed and Paid
- **Voiceover:** "That's the full front-desk workflow: register the patient, book them into a real available slot, check them in, bill them, and record payment when they check out. Everything you entered is now available to the doctor, the patient, and the hospital's reports."
- **Highlight:** Rahul's row
- **Transition:** End card "Next: the Doctor workflow"
- **Expected result:** The viewer understands the handoffs

**Recording checklist**
1. Search `Rahul` in the queue and hold 3 s.

---

## Voiceover script (continuous)

> **[Intro]** This video is for receptionists. You'll follow one patient from the moment they walk in to the moment they've paid and checked out.
>
> **[Login]** Sign in with the email and password you created from your invite link. Arogyix opens the Front Desk Dashboard.
>
> **[Dashboard]** At the top, you can see today's bookings, who's checked in and waiting, which payments are still pending, and today's revenue. The quick actions let you register a patient, book an appointment, open billing, see missed follow-ups, or run reports. Below that is today's patient queue, where most of your day happens.
>
> **[Menu]** Your menu covers appointments, follow-ups, patients, billing and reports, as well as your hospital's partner pharmacies and labs.
>
> **[Register]** To register a new patient, click Register Patient. Enter their name, email and phone number. Then add their date of birth, gender, blood group, address and an emergency contact. If the patient has allergies or long-term conditions, type each one and press Enter. The doctor will see these during the consultation. Click Register Patient. Arogyix creates the patient record with a unique patient code, and also creates a login for the patient portal. Copy the temporary password and give it to the patient so they can sign in later.
>
> **[Patient file]** Every patient can be found by name, phone number or patient code. The patient file shows their personal details, allergies, conditions and emergency contact. You can also link family members, so relatives are kept together under one record.
>
> **[Book]** Next, book the appointment. Search for the patient and select them. Then search for the doctor by name, department or specialization. Arogyix shows the doctor's specialization, department and consultation fee. Choose the date, and the available time slots for that day appear. Slots that are already booked, or outside the doctor's hours, aren't shown. Pick a slot, choose the appointment type, and enter the reason for the visit. The booking summary on the right shows the patient, doctor, time and fee. Click Schedule Appointment. The patient receives a notification about the booking.
>
> **[Check in]** When the patient arrives, find them in today's queue and click Check In. Their status changes to checked in, and they appear on the doctor's schedule as ready to be seen.
>
> **[Bill]** Once the patient is checked in, you can create their bill. Click Generate Bill. Arogyix creates an invoice using the doctor's consultation fee. The invoice shows as pending until it's paid.
>
> **[Check out and collect]** When the consultation is over, the visit shows as completed in your queue. If a doctor hasn't closed the visit themselves, click Check Out to complete it. A visit can only be completed once a prescription has been written. When the patient pays, click Collect to record the payment. The invoice is marked as paid, and today's revenue updates straight away.
>
> **[Billing]** The billing page lists every invoice. Filter by status or date to find unpaid bills or a day's collections. Download any invoice as a PDF to print or give to the patient, or export the list for your accounts team. You can also click Create Invoice to bill a patient for other services.
>
> **[Follow-ups and reports]** Missed Follow-ups lists patients whose follow-up date has passed without a new booking. You can call them, send a reminder through Arogyix, or book their next visit straight away. Under Reports, you can run appointment, patient, billing and other reports for any date range, and print or export them.
>
> **[Summary]** That's the full front-desk workflow: register the patient, book them into a real available slot, check them in, bill them, and record payment when they check out. Everything you entered is now available to the doctor, the patient, and the hospital's reports.
