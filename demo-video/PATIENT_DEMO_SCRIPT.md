# Video G — Patient Demo

> **⚠️ REFERENCE DOCUMENT — not the recording instructions.** **RECORD FROM `RECORDING_RUNBOOK.md` ONLY.** Where this file differs from the runbook, follow the runbook. Recording day: **Saturday 10 October 2026**.

| | |
|---|---|
| **Duration** | 5:15 |
| **Target audience** | Patients of a hospital that uses Arogyix. Hospitals can share this video with their patients |
| **Objective** | Show how a patient gets an account, then views prescriptions, bills, reports, books appointments and messages their doctor |
| **Starting screen** | `/register` |
| **Ending screen** | Notifications / patient dashboard |
| **Main workflow** | Sign in → My Prescriptions (PDF) → Billing (Pay Now) → Reports |
| **Secondary workflow** | Book a follow-up appointment; chat with the doctor |
| **Must show** | Self-registration with hospital picker and email code, patient dashboard, My Prescriptions + PDF, My Billing, Reports (lab report + upload), Book Appointment (Your Profile), Chat |
| **Can skip** | Settings (except the WhatsApp toggle mention), cancelling an appointment |
| **Narration style** | Friendly, plain language, no jargon. Say "your doctor", "your hospital" |
| **Logins used** | Self-signup: Neha Gupta (real inbox). Main walkthrough: `rahul.sharma@example.com` with the temp password from Video C (or reset it in advance via Forgot password if you didn't note it) |
| **Data** | `DEMO_DATA.md` §3 and §4 |

**Before recording**
- SMTP is working (gap G7).
- Rahul has: the prescription (Video D); the paid ₹800 invoice (Video C); a **pending ₹300 ECG invoice** (prep); a delivered CarePlus lab report (Video H); Dr. Patil's chat message (Video D, Scene 11).
- Razorpay test keys are configured for the optional Pay Now in Scene 07 (gap G8).

---

## Storyboard

### Scene 01 — Introduction
**Time:** 00:00–00:12 · *Story step 1*

- **Screen:** Title card
- **Purpose:** Introduce the role
- **User action:** None
- **On-screen action:** "Your hospital, in your pocket — Arogyix for Patients"
- **Voiceover:** "This video is for patients. You'll see how to use Arogyix to find your prescriptions, pay your bills, see your reports, book appointments and message your doctor."
- **Highlight:** None
- **Transition:** Fade
- **Expected result:** The viewer knows the scope

**Recording checklist**
1. Title card only.

### Scene 02 — Create an account
**Time:** 00:12–01:00 · *Story step 2: Login (path A)*

- **Screen:** Register ("Create your account")
- **Purpose:** Show self-signup
- **User action:** Search for and pick the hospital, fill in details, click **Send verification code**, enter the code, click **Verify and create account**
- **On-screen action:** The "Verification code sent to your email" toast; the code field; "Account created!"; the patient dashboard
- **Voiceover:** "There are two ways to get an account. If you registered at your hospital's front desk, they'll give you a login email and a temporary password. Or you can sign up yourself. Search for your hospital, enter your name, email, phone number and a password, and click Send verification code. Enter the six-digit code from your email, and your account is ready."
- **Highlight:** Zoom on the hospital search results; zoom on the code field
- **Transition:** Log out, then cut to login
- **Expected result:** The viewer can sign up themselves

**Recording checklist**
1. Open `/register` in a logged-out window.
2. **Your hospital**: type `Arogyix` → select Arogyix Multispeciality Hospital.
3. First name `Neha`, Last name `Gupta`, Email *(your real test inbox)*, Phone `9800000221`, Password `Demo@12345`.
4. Click **Send verification code**. Switch to your email off camera and copy the code.
5. Enter it in **Email verification code** → **Verify and create account**.
6. Show the empty Neha dashboard for 1 s, then log out (avatar/menu → logout).

### Scene 03 — Sign in as an existing patient
**Time:** 01:00–01:12 · *Story step 2: Login (path B)*

- **Screen:** Login
- **Purpose:** The front-desk path
- **User action:** Sign in as Rahul
- **On-screen action:** "Hello, Rahul! 👋"
- **Voiceover:** "Rahul was registered at the front desk, so he signs in with the details the receptionist gave him."
- **Highlight:** None
- **Transition:** Cut
- **Expected result:** Logged in

**Recording checklist**
1. `/login` → `rahul.sharma@example.com` → password → **Sign In**. The URL is `/dashboard/patient`.

### Scene 04 — Patient dashboard
**Time:** 01:12–01:45 · *Story step 3*

- **Screen:** Patient dashboard
- **Purpose:** The health overview
- **User action:** Hover each panel
- **On-screen action:** Upcoming Appointments, Medicines Due, Recent Prescriptions, Billing (Amount Due ₹300, Pay Now), Recent Reports
- **Voiceover:** "Your dashboard shows your health at a glance: upcoming appointments, which medicines are due, your latest prescriptions, any amount you owe, and your most recent reports."
- **Highlight:** Zoom on **Medicines Due**, then **Amount Due**
- **Transition:** Hover the sidebar
- **Expected result:** The viewer knows where everything is

**Recording checklist**
1. Hover each card for 1.5 s. If Medicines Due is empty (reminders depend on the external scheduler, gap G14), skip it in the narration.

### Scene 05 — Menu
**Time:** 01:45–01:55 · *Story step 4*

- **Screen:** Sidebar
- **Purpose:** Show scope
- **User action:** Hover the menu
- **On-screen action:** Appointments, Prescriptions, Reports, Chat, Billing, Notifications, Settings
- **Voiceover:** "The menu takes you to your appointments, prescriptions, reports, chat, and billing."
- **Highlight:** Menu glow
- **Transition:** Click **Prescriptions**
- **Expected result:** The viewer sees what they can do

**Recording checklist**
1. Hover from **Appointments** to **Billing**.

### Scene 06 — My Prescriptions
**Time:** 01:55–02:30 · *Story step 5: Primary workflow (1/3)*

- **Screen:** My Prescriptions
- **Purpose:** Digital prescription access
- **User action:** Show Dr. Patil's prescription; click **PDF**
- **On-screen action:** Diagnosis; Prescribed Oral Medicines; "Sent to Wellness Pharmacy"; the PDF opens
- **Voiceover:** "Every prescription your doctor writes appears here, with the diagnosis and each medicine's dosage, frequency, duration and timing. If your doctor sent it to a pharmacy, you'll see which one. Tap PDF to download a copy to keep or show at any chemist."
- **Highlight:** Zoom on the medicine list; the **PDF** button
- **Transition:** Close the PDF → **Billing**
- **Expected result:** The patient never loses a paper prescription

**Recording checklist**
1. Open `/dashboard/prescriptions`.
2. Pause 2 s on the card. Click **PDF**. Show it for 3 s (hospital logo, medicines), then close.

### Scene 07 — My Billing and online payment
**Time:** 02:30–03:15 · *Story step 5: Primary workflow (2/3)*

- **Screen:** My Billing
- **Purpose:** Pay online
- **User action:** Show the paid ₹800 invoice; click **Pay Now** on the ₹300 invoice → choose UPI → complete a Razorpay **test** payment
- **On-screen action:** Amount Due, Total Paid, Total Invoices; "Choose a payment method"; the "Payment successful!" toast
- **Voiceover:** "My Billing shows what you owe, what you've paid, and every invoice from your hospital. Download any invoice as a PDF. To pay online, click Pay Now, choose UPI, card, net banking or a wallet, and complete the payment. The invoice is marked as paid automatically."
- **Highlight:** Zoom on the payment method chooser
- **Transition:** Click **Reports**
- **Expected result:** The viewer can pay without visiting the desk

**Recording checklist**
1. Open `/dashboard/billing` (shows "My Billing").
2. Hover the ₹800 invoice (Paid) and click its download icon for 1 s.
3. *Optional, needs Razorpay test keys:* on the ₹300 invoice, click **Pay Now** → **UPI** → complete it with Razorpay's test flow. Check the status is PAID.
4. Without Razorpay, **stop at the method chooser**, cancel, and change the narration to "…choose how you'd like to pay and complete the payment."

### Scene 08 — Reports
**Time:** 03:15–03:50 · *Story step 5: Primary workflow (3/3)*

- **Screen:** Report Repository
- **Purpose:** One place for medical documents
- **User action:** Show the CarePlus lab report; open it; upload a document
- **On-screen action:** "Lab Report — LAB-2026-000xx"; the "Report uploaded" toast
- **Voiceover:** "Your medical reports are kept together here. When a lab your hospital works with finishes your tests, the report appears automatically, and you get a notification. You can also upload your own documents, such as older reports or scans, so your doctor can see them."
- **Highlight:** The lab report row
- **Transition:** Click **Appointments**
- **Expected result:** The viewer knows lab results come to them

**Recording checklist**
1. Open `/dashboard/reports`. Open the CarePlus lab report (new tab) for 2 s, then close it.
2. Pick the document type (e.g. Other) → **Upload Report** → choose a dummy PDF, `Home BP Log - Sept.pdf`, with no real data.
3. Check for the "Report uploaded" toast.

### Scene 09 — Book a follow-up
**Time:** 03:50–04:30 · *Story step 6: Secondary workflow (1/2)*

- **Screen:** Appointments → Schedule New Appointment
- **Purpose:** Self-booking
- **User action:** Click **New Appointment**; the patient is "Your Profile"; pick Dr. Amit Patil, date D+14, a slot, type Follow Up Visit, a reason; click **Schedule Appointment**
- **On-screen action:** Available Slots; Booking Summary; the "Appointment scheduled successfully!" toast
- **Voiceover:** "You can book your own appointments. Choose your doctor, pick a date, and choose from the times that are actually free. Add a short reason, and confirm. The appointment appears in your list and the hospital sees it straight away. If your plans change, you can cancel it yourself."
- **Highlight:** Zoom on Available Slots
- **Transition:** Click **Chat**
- **Expected result:** The viewer can book a follow-up

**Recording checklist**
1. `/dashboard/appointments` → **New Appointment**.
2. Check that **Your Profile** is selected as the patient.
3. Doctor `Amit` → Dr. Amit Patil. Date D+14. Pick the first slot.
4. **Appointment Type** Follow Up Visit. **Reason** `Two-week BP review`.
5. Click **Schedule Appointment**.

### Scene 10 — Chat with the doctor
**Time:** 04:30–04:55 · *Story step 6: Secondary workflow (2/2)*

- **Screen:** Chat
- **Purpose:** Ask questions after the visit
- **User action:** Open the conversation with Dr. Amit Patil and reply
- **On-screen action:** Dr. Patil's earlier message; the reply bubble
- **Voiceover:** "If you have a question after your visit, message your doctor in Chat. Messages arrive instantly, and your doctor is notified."
- **Highlight:** The conversation
- **Transition:** Click **Notifications**
- **Expected result:** The viewer knows they can reach their doctor

**Recording checklist**
1. Open `/dashboard/chat` → the Dr. Amit Patil conversation.
2. Type: `Thank you, Doctor. Can I take Amlodipine with my morning tea?` → send.
3. Optional split screen: the doctor's window receives it live.

### Scene 11 — Notifications and summary
**Time:** 04:55–05:15 · *Story steps 7–8*

- **Screen:** Notifications
- **Purpose:** Keep informed, wrap up
- **User action:** Show the list and click **Mark all read**
- **On-screen action:** Appointment, prescription, report and lab notifications
- **Voiceover:** "Notifications keep you up to date about new appointments, prescriptions, reports and messages. In Settings, you can also choose to receive reminders on WhatsApp. That's Arogyix for patients: your prescriptions, bills, reports, appointments and doctor, all in one place."
- **Highlight:** The notification list
- **Transition:** End card
- **Expected result:** The viewer understands the whole portal

**Recording checklist**
1. Open `/dashboard/notifications`. Scroll slowly.
2. Click **Mark all read**.
3. Optional: `/dashboard/settings`. Hover **Notify me on WhatsApp** without toggling it.

---

## Voiceover script (continuous)

> **[Intro]** This video is for patients. You'll see how to use Arogyix to find your prescriptions, pay your bills, see your reports, book appointments and message your doctor.
>
> **[Sign up]** There are two ways to get an account. If you registered at your hospital's front desk, they'll give you a login email and a temporary password. Or you can sign up yourself. Search for your hospital, enter your name, email, phone number and a password, and click Send verification code. Enter the six-digit code from your email, and your account is ready.
>
> **[Sign in]** Rahul was registered at the front desk, so he signs in with the details the receptionist gave him.
>
> **[Dashboard]** Your dashboard shows your health at a glance: upcoming appointments, which medicines are due, your latest prescriptions, any amount you owe, and your most recent reports.
>
> **[Menu]** The menu takes you to your appointments, prescriptions, reports, chat, and billing.
>
> **[Prescriptions]** Every prescription your doctor writes appears here, with the diagnosis and each medicine's dosage, frequency, duration and timing. If your doctor sent it to a pharmacy, you'll see which one. Tap PDF to download a copy to keep or show at any chemist.
>
> **[Billing]** My Billing shows what you owe, what you've paid, and every invoice from your hospital. Download any invoice as a PDF. To pay online, click Pay Now, choose UPI, card, net banking or a wallet, and complete the payment. The invoice is marked as paid automatically.
>
> **[Reports]** Your medical reports are kept together here. When a lab your hospital works with finishes your tests, the report appears automatically, and you get a notification. You can also upload your own documents, such as older reports or scans, so your doctor can see them.
>
> **[Book]** You can book your own appointments. Choose your doctor, pick a date, and choose from the times that are actually free. Add a short reason, and confirm. The appointment appears in your list and the hospital sees it straight away. If your plans change, you can cancel it yourself.
>
> **[Chat]** If you have a question after your visit, message your doctor in Chat. Messages arrive instantly, and your doctor is notified.
>
> **[Wrap-up]** Notifications keep you up to date about new appointments, prescriptions, reports and messages. In Settings, you can also choose to receive reminders on WhatsApp. That's Arogyix for patients: your prescriptions, bills, reports, appointments and doctor, all in one place.
