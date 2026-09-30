# Video D — Doctor Demo

> **⚠️ REFERENCE DOCUMENT — not the recording instructions.** **RECORD FROM `RECORDING_RUNBOOK.md` ONLY.** Where this file differs from the runbook, follow the runbook. Recording day: **Saturday 10 October 2026**.

| | |
|---|---|
| **Duration** | 6:00 |
| **Target audience** | Consulting doctors joining a hospital on Arogyix |
| **Objective** | Show a consultation from queue to completed visit: review the patient, take notes, write a digital prescription (sent to the pharmacy), complete, schedule follow-up, order lab tests, and message the patient |
| **Starting screen** | `/login` |
| **Ending screen** | Chat with Rahul Sharma |
| **Main workflow** | Appointment Details → notes → Write Prescription → Complete Appointment → Schedule Follow-up |
| **Must show** | Doctor dashboard, Appointment Details (allergies, reason, Workflow Control), patient file Timeline, Write New Prescription (catalog autocomplete, reminders, Send to Pharmacy), Prescriptions list + PDF, Complete + Follow-up |
| **Can skip** | Medicines Catalog editing, Pharmacies page, Pathology Labs browsing, Reports upload, Notifications, Settings |
| **Narration style** | Concise and clinical. Doctors are busy, so keep each point short and say why it saves time |
| **Login used** | `amit.patil@example.com` / `Demo@12345` |
| **Data** | `DEMO_DATA.md` §4 |

**Before recording**
- Day **D**. Rahul Sharma's 11:30 appointment is booked and **checked in** (Video C, Scenes 07–09).
- The hospital catalog contains Amlodipine 5mg, Atorvastatin 10mg and Pantoprazole 40mg.
- Wellness Pharmacy is registered by invite. CarePlus Diagnostics has an **ACTIVE** link.

---

## Storyboard

### Scene 01 — Introduction
**Time:** 00:00–00:12 · *Story step 1*

- **Screen:** Title card
- **Purpose:** Introduce the role
- **User action:** None
- **On-screen action:** "Arogyix for Doctors"
- **Voiceover:** "This video is for doctors. You'll see how to run a consultation in Arogyix, from opening the patient's record to issuing a digital prescription."
- **Highlight:** None
- **Transition:** Fade
- **Expected result:** The viewer knows the scope

**Recording checklist**
1. Title card only.

### Scene 02 — Login
**Time:** 00:12–00:27 · *Story step 2*

- **Screen:** Login
- **Purpose:** Show entry
- **User action:** Type the credentials, click **Sign In**
- **On-screen action:** "Dr. Amit's Dashboard"
- **Voiceover:** "Sign in with your email and password. Arogyix opens your personal dashboard."
- **Highlight:** None
- **Transition:** Cut
- **Expected result:** Logged in

**Recording checklist**
1. `/login` → `amit.patil@example.com` → password → **Sign In**. The URL is `/dashboard/doctor`.

### Scene 03 — Doctor dashboard
**Time:** 00:27–00:55 · *Story step 3*

- **Screen:** Doctor dashboard
- **Purpose:** The daily overview
- **User action:** Hover the stat cards, Missed Follow-ups, and Today's Schedule
- **On-screen action:** Today's Appointments, Total Patients, Prescriptions Pending; Rahul Sharma listed at 11:30
- **Voiceover:** "Your dashboard shows only your own patients: how many appointments you have today, your total patients, and visits that still need a prescription. Below that are your patients who missed a follow-up, and today's schedule with each patient's reason for visiting."
- **Highlight:** Zoom on Today's Schedule and Rahul's row
- **Transition:** Click **Appointments** in the sidebar
- **Expected result:** The viewer sees their day at a glance

**Recording checklist**
1. Hover the three stat cards.
2. Hover Rahul Sharma's row in **Today's Schedule**. Don't click it; the rows aren't links.

### Scene 04 — Menu
**Time:** 00:55–01:08 · *Story step 4*

- **Screen:** Sidebar
- **Purpose:** Show scope
- **User action:** Hover the menu
- **On-screen action:** Appointments, Follow-ups, Patients, Prescriptions, Medicines Catalog, Pharmacies, Pathology Labs, Lab Orders, Reports, Chat
- **Voiceover:** "From the menu, you can reach your appointments, patient records, prescriptions, lab orders, medical reports, and chat with your patients."
- **Highlight:** Glow on **Prescriptions**, **Lab Orders** and **Chat**
- **Transition:** Click **Appointments**
- **Expected result:** The viewer sees the scope of the role

**Recording checklist**
1. Hover from **Appointments** to **Chat**.

### Scene 05 — Open the appointment
**Time:** 01:08–01:45 · *Story step 5: Primary workflow (1/5)*

- **Screen:** Appointments → Appointment Details
- **Purpose:** Pre-consultation review
- **User action:** Search "Rahul", open the appointment
- **On-screen action:** Scheduled time; Patient Registry Info (age, gender, blood group, **Allergies: Penicillin**); Visit Purpose; Workflow Control
- **Voiceover:** "Open the appointment from your list. Before the patient walks in, you can see their age, blood group and allergies. Here, a penicillin allergy is clearly flagged. You can also see why the patient is visiting and any notes from the front desk. The patient is already checked in, so the visit is in progress. For patients who haven't been checked in, you can use Check In and Start Visit here."
- **Highlight:** Red box around **Allergies**; zoom on **Reason for Visit**
- **Transition:** Click **View Full File**
- **Expected result:** The doctor sees the key safety information first

**Recording checklist**
1. `/dashboard/appointments` → search `Rahul` → click the row.
2. Pause 2 s on **Patient Registry Info**.
3. Scroll to **Workflow Control** and point at the status.

### Scene 06 — Patient history
**Time:** 01:45–02:10 · *Story step 7: Important features*

- **Screen:** Patient file → Timeline / Records & Care
- **Purpose:** Show the history view
- **User action:** Click **View Full File**, scroll the **Clinical History Timeline**, open **Records & Care**
- **On-screen action:** Timeline events (Patient Registered, Appointment); Recent Prescriptions, Recent Appointments, Lab & Medical Reports
- **Voiceover:** "The patient's full file shows their history in date order: registrations, appointments, prescriptions, reports, lab results and follow-ups. Records and Care groups their recent prescriptions, appointments and uploaded reports in one place."
- **Highlight:** Zoom on the timeline
- **Transition:** Browser back to the appointment
- **Expected result:** The doctor knows where history lives

**Recording checklist**
1. Click **View Full File**. The **Timeline** tab is the default.
2. Scroll the timeline slowly.
3. Click **Records & Care**, pause 1.5 s, then go back.

### Scene 07 — Clinical notes
**Time:** 02:10–02:30 · *Story step 5: Primary workflow (2/5)*

- **Screen:** Appointment Details → Clinical / Consultation Notes
- **Purpose:** Record the examination
- **User action:** Type the notes, click **Save Notes**
- **On-screen action:** The "Clinical notes saved successfully" toast
- **Voiceover:** "Record your examination findings in the consultation notes and save them. They stay attached to this visit."
- **Highlight:** The notes box
- **Transition:** Click **Write Prescription**
- **Expected result:** The notes are saved

**Recording checklist**
1. Click into **Clinical / Consultation Notes**.
2. Paste the notes from `DEMO_DATA.md` §4. Pasting is fine; say "type your notes".
3. Click **Save Notes** (it appears once the text changes). Check for the toast.

### Scene 08 — Write the prescription
**Time:** 02:30–04:00 · *Story step 5: Primary workflow (3/5)*

- **Screen:** Write New Prescription
- **Purpose:** The core doctor task
- **User action:** Select the patient, enter the diagnosis and validity, add three medicines using autocomplete, check the reminders, add notes, choose the pharmacy, click **Generate Prescription**
- **On-screen action:** The Prescription Summary fills in live. After saving, the Prescriptions list shows "Sent to Wellness Pharmacy" and a **PDF** button
- **Voiceover:** "Click Write Prescription. You're already set as the prescribing doctor. Select the patient and enter the diagnosis. Add each medicine. As you type, suggestions come from your hospital's medicines catalog, with the usual dosage, frequency and timing already filled in. Set how long the patient should take it, and add any specific instructions. Based on the frequency, Arogyix schedules reminder times for the patient automatically, and you can adjust them if needed. Topical ointments have their own section. Add general advice for the patient. Finally, choose a pharmacy to send this prescription to. The pharmacy receives it straight away for verification and dispensing. Check the summary, and click Generate Prescription. Arogyix creates a professional PDF prescription with your hospital's branding, and the patient can see it in their portal."
- **Highlight:** Zoom on the autocomplete dropdown; box **Medicine Reminders**; box **Send to Pharmacy**; zoom on the "Sent to Wellness Pharmacy" badge
- **Transition:** Click **PDF**, show it, return to the appointment
- **Expected result:** The prescription exists, is routed to the pharmacy, and the PDF is ready

**Recording checklist**
1. On Appointment Details, click **Write Prescription**. The URL contains `?appointmentId=`.
2. **Select Patient**: type `Rahul` → click Rahul Sharma. The patient isn't pre-filled, so select the same patient as the appointment.
3. Check that **Prescribing Doctor** shows "Prescribing Self" / Dr. Amit Patil.
4. **Diagnosis / Assessment**: `Essential Hypertension (Stage 1) with borderline dyslipidemia`.
5. **Prescription Valid Until**: D+30.
6. **Add Oral Medicine** ×3, for each: type the first 4 letters, pick from the dropdown, then fill Dosage, Frequency, Duration, Timing and Instructions exactly as in `DEMO_DATA.md` §4. Medicine names must match the pharmacy catalog exactly.
7. On medicine 1, add a custom reminder time `08:30` and click **Set**.
8. **General Notes / Patient Instructions**: paste the advice.
9. **Send to Pharmacy**: select **Wellness Pharmacy**. Pause on the helper text.
10. Hover the **Prescription Summary**, then click **Generate Prescription**.
11. On `/dashboard/prescriptions`, hover the "Sent to Wellness Pharmacy" badge. Click **PDF** and show it for 3 s.
12. Speed up steps 6–8 to 1.5–2× in the edit if needed.

### Scene 09 — Complete the visit and schedule a follow-up
**Time:** 04:00–04:35 · *Story step 5: Primary workflow (4/5, 5/5)*

- **Screen:** Appointment Details → Workflow Control
- **Purpose:** Close the consultation
- **User action:** Click **Complete Appointment**; the **Schedule Follow-up** form opens automatically; pick D+14 (24-10-2026), add notes, click **Schedule**
- **On-screen action:** Status Completed; "Scheduled Follow-up" shows the date; the prescription is listed under Prescribed Medications
- **Voiceover:** "Back on the appointment, the prescription is now attached to this visit. Click Complete Appointment. Arogyix only lets you complete a visit once a prescription has been written, so nothing is missed. Then schedule the follow-up date. If the patient doesn't book by that date, they'll appear in the Missed Follow-ups list for you and the front desk."
- **Highlight:** Zoom on **Prescribed Medications**, then the Completed badge, then the follow-up date
- **Transition:** Click **Lab Orders**
- **Expected result:** The visit is closed with a follow-up planned

**Recording checklist**
1. Open the appointment again (Appointments → Rahul).
2. Show **Prescribed Medications** with the diagnosis and medicines.
3. Click **Complete Appointment**. Check for the toast. This must happen on day D (gap G1).
4. The **Schedule Follow-up** form opens automatically → date D+14 (24-10-2026) → notes `Review BP log and lipid report.` → **Schedule**.

### Scene 10 — Order lab tests
**Time:** 04:35–05:05 · *Story step 6: Secondary workflow*

- **Screen:** Lab Orders → New Lab Order
- **Purpose:** Diagnostics
- **User action:** Select the lab and patient, tick the tests, choose Walk-in, place the order
- **On-screen action:** The "Lab order placed" toast; the order in the list with status Ordered
- **Voiceover:** "To order tests, open Lab Orders and click New Order. Choose one of your hospital's linked labs, select the patient, and pick tests from the lab's own catalog with prices. Choose walk-in or home collection, and place the order. The lab receives it immediately. When the report is ready, it's added to the patient's record automatically, and you're notified."
- **Highlight:** The test checkboxes and the total
- **Transition:** Click **Chat**
- **Expected result:** The doctor can order tests without paperwork

**Recording checklist**
1. `/dashboard/pathology-orders` → **New Order**.
2. **Lab**: CarePlus Diagnostics. **Patient**: Rahul Sharma.
3. Tick **Lipid Profile** and **Kidney Function Test (KFT)**.
4. **Collection Type**: Walk-in. **Referring Doctor**: Dr. Amit Patil. **Notes**: `Collect sample today after consultation`.
5. Place the order. Check that it's listed.

### Scene 11 — Message the patient
**Time:** 05:05–05:40 · *Story step 7: Important features*

- **Screen:** Chat
- **Purpose:** Follow-up communication
- **User action:** Click **New** → "Message a Patient" → Rahul Sharma → type and send
- **On-screen action:** The message bubble; the "Connected" indicator
- **Voiceover:** "Chat lets you and your patients message each other securely in real time, for questions after the visit. Start a conversation with any of your patients, and they'll see the message and a notification straight away."
- **Highlight:** The "Connected" status and the sent bubble
- **Transition:** Fade to summary
- **Expected result:** The viewer knows chat exists and is real time

**Recording checklist**
1. `/dashboard/chat` → **New** → search `Rahul` → select.
2. Type: `Hello Rahul, please fast for 10–12 hours before your lipid test tomorrow morning and bring your BP log to the follow-up.`
3. Send. Pause 2 s.
4. Optional: show Rahul's reply in a split screen (Video G, Scene 09).

### Scene 12 — Summary
**Time:** 05:40–06:00 · *Story step 8*

- **Screen:** Doctor dashboard
- **Purpose:** Wrap up
- **User action:** None
- **On-screen action:** The dashboard with the completed visit
- **Voiceover:** "In one consultation, you reviewed the patient's history and allergies, recorded your findings, issued a digital prescription that went straight to the pharmacy, closed the visit, planned the follow-up and ordered lab tests. The front desk can now bill the visit, the pharmacy can prepare the medicines, and the patient can see everything in their portal."
- **Highlight:** None
- **Transition:** End card "Next: the Pharmacy workflow"
- **Expected result:** The viewer understands the handoffs

**Recording checklist**
1. Click **Dashboard** and hold 3 s.

---

## Voiceover script (continuous)

> **[Intro]** This video is for doctors. You'll see how to run a consultation in Arogyix, from opening the patient's record to issuing a digital prescription.
>
> **[Login]** Sign in with your email and password. Arogyix opens your personal dashboard.
>
> **[Dashboard]** Your dashboard shows only your own patients: how many appointments you have today, your total patients, and visits that still need a prescription. Below that are your patients who missed a follow-up, and today's schedule with each patient's reason for visiting.
>
> **[Menu]** From the menu, you can reach your appointments, patient records, prescriptions, lab orders, medical reports, and chat with your patients.
>
> **[Appointment]** Open the appointment from your list. Before the patient walks in, you can see their age, blood group and allergies. Here, a penicillin allergy is clearly flagged. You can also see why the patient is visiting and any notes from the front desk. The patient is already checked in, so the visit is in progress. For patients who haven't been checked in, you can use Check In and Start Visit here.
>
> **[History]** The patient's full file shows their history in date order: registrations, appointments, prescriptions, reports, lab results and follow-ups. Records and Care groups their recent prescriptions, appointments and uploaded reports in one place.
>
> **[Notes]** Record your examination findings in the consultation notes and save them. They stay attached to this visit.
>
> **[Prescription]** Click Write Prescription. You're already set as the prescribing doctor. Select the patient and enter the diagnosis. Add each medicine. As you type, suggestions come from your hospital's medicines catalog, with the usual dosage, frequency and timing already filled in. Set how long the patient should take it, and add any specific instructions. Based on the frequency, Arogyix schedules reminder times for the patient automatically, and you can adjust them if needed. Topical ointments have their own section. Add general advice for the patient. Finally, choose a pharmacy to send this prescription to. The pharmacy receives it straight away for verification and dispensing. Check the summary, and click Generate Prescription. Arogyix creates a professional PDF prescription with your hospital's branding, and the patient can see it in their portal.
>
> **[Complete]** Back on the appointment, the prescription is now attached to this visit. Click Complete Appointment. Arogyix only lets you complete a visit once a prescription has been written, so nothing is missed. Then schedule the follow-up date. If the patient doesn't book by that date, they'll appear in the Missed Follow-ups list for you and the front desk.
>
> **[Lab]** To order tests, open Lab Orders and click New Order. Choose one of your hospital's linked labs, select the patient, and pick tests from the lab's own catalog with prices. Choose walk-in or home collection, and place the order. The lab receives it immediately. When the report is ready, it's added to the patient's record automatically, and you're notified.
>
> **[Chat]** Chat lets you and your patients message each other securely in real time, for questions after the visit. Start a conversation with any of your patients, and they'll see the message and a notification straight away.
>
> **[Summary]** In one consultation, you reviewed the patient's history and allergies, recorded your findings, issued a digital prescription that went straight to the pharmacy, closed the visit, planned the follow-up and ordered lab tests. The front desk can now bill the visit, the pharmacy can prepare the medicines, and the patient can see everything in their portal.
