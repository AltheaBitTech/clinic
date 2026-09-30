# Video B — Hospital Admin Demo

> **⚠️ REFERENCE DOCUMENT — not the recording instructions.** **RECORD FROM `RECORDING_RUNBOOK.md` ONLY.** Where this file differs from the runbook, follow the runbook. Recording day: **Saturday 10 October 2026**.

| | |
|---|---|
| **Duration** | 6:50 |
| **Target audience** | A hospital owner or administrator whose hospital has just been approved on Arogyix |
| **Objective** | Show how to set up the hospital (branding, departments, staff, doctor profiles, catalog, partner pharmacy and lab) and how to monitor it (dashboard, analytics, reports) |
| **Starting screen** | `/login` |
| **Ending screen** | Analytics → Reports panel after **Export** |
| **Main workflow** | Add department → Invite Staff → staff activates → Configure Doctor Profile |
| **Must show** | Hospital Dashboard, Departments, Staff (Invite Staff + link), Configure Doctor Profile, Medicines Catalog, Pharmacies (Invite), Analytics + Reports panel, Settings → Hospital Settings |
| **Can skip** | Patients, Appointments, Billing and Prescriptions (covered in Videos C and D), Lab Orders, Notifications, Follow-ups, subscription checkout |
| **Narration style** | Instructional and calm, "set it up once". Second person ("you") |
| **Login used** | `admin@Arogyix.health` / `Password123!` (renamed to Meera Joshi) |
| **Data** | `DEMO_DATA.md` §1, §2 |

**Before recording**
- Departments Cardiology, General Medicine and Pediatrics exist. **Orthopedics does not.**
- Dr. Amit Patil and Dr. Sneha Kulkarni are configured. Priya Deshmukh is active.
- Wellness Pharmacy and CarePlus Diagnostics are registered through invite links.
- Have an incognito window ready for Scene 07.

---

## Storyboard

### Scene 01 — Introduction
**Time:** 00:00–00:15 · *Story step 1: Introduction*

- **Screen:** Title card over a blurred Hospital Dashboard
- **Purpose:** Introduce the role
- **User action:** None
- **On-screen action:** Title "Arogyix for Hospital Administrators", subtitle "Set up your hospital in minutes"
- **Voiceover:** "This video is for hospital administrators. You'll see how to set up your hospital on Arogyix: your departments, your staff, your doctors, and your partner pharmacies and labs. Then you'll see how to keep track of everything from one place."
- **Highlight:** None
- **Transition:** Fade to the login page
- **Expected result:** The viewer knows who this video is for

**Recording checklist**
1. Take a still of `/dashboard/hospital` with the data loaded, to blur in the edit.
2. Add the title in post. No live recording is needed.

### Scene 02 — Login
**Time:** 00:15–00:35 · *Story step 2: Login*

- **Screen:** Login ("Welcome back")
- **Purpose:** Show that everyone signs in on the same page
- **User action:** Type the email and password, then click **Sign In**
- **On-screen action:** The "Welcome back!" toast appears and the Hospital Dashboard loads
- **Voiceover:** "Every user signs in on the same page. When your hospital was approved, the Arogyix team sent you a temporary password. Enter your email and password, and click Sign In. Arogyix recognises that you're an administrator and opens your hospital dashboard."
- **Highlight:** The **Sign In** button
- **Transition:** Cut on the page load
- **Expected result:** The viewer knows where to log in and that each role lands on its own dashboard

**Recording checklist**
1. Open `http://localhost:3000/login` (or your staging URL). Close all other tabs.
2. Click **Email address** and type `admin@Arogyix.health` at a steady pace.
3. Click **Password** and type the password. Don't click the show-password eye.
4. Hover **Sign In** for 0.5 s, then click.
5. Check that the URL is `/dashboard/hospital` and the greeting shows "Meera".
6. Avoid: browser password-save popups (turn them off in browser settings first).

### Scene 03 — Dashboard
**Time:** 00:35–01:05 · *Story step 3: Dashboard*

- **Screen:** Hospital Dashboard (`/dashboard/hospital`)
- **Purpose:** Explain the day-at-a-glance view
- **User action:** Hover each stat card, then scroll to the charts
- **On-screen action:** Today's Appointments, Total Patients, Active Doctors, Today's Revenue; Missed Follow-ups; Today's Appointment Status; Recently Registered Patients
- **Voiceover:** "Your dashboard shows what's happening today. At the top: today's appointments, total patients, active doctors, and today's revenue with pending payments. Below, you can see patients whose follow-up date has passed, today's appointments by status, and the most recently registered patients."
- **Highlight:** Zoom 120% on the four stat cards, then pan to Missed Follow-ups
- **Transition:** Move the mouse to the sidebar
- **Expected result:** The viewer knows where to look each morning

**Recording checklist**
1. Stay on `/dashboard/hospital`.
2. Move the mouse left to right across the four stat cards, about 1 s each.
3. Scroll slowly (about 300 px) to **Missed Follow-ups** and **Today's Appointment Status**. Pause 2 s.
4. Scroll back to the top.
5. Make sure no error cards ("Couldn't load dashboard data") are visible.

### Scene 04 — Sidebar tour
**Time:** 01:05–01:25 · *Story step 4: Main responsibilities*

- **Screen:** Sidebar
- **Purpose:** Show the scope of the admin role
- **User action:** Hover down the menu without clicking
- **On-screen action:** Appointments, Follow-ups, Patients, Doctors, Departments, Prescriptions, Medicines Catalog, Pharmacies, Pathology Labs, Lab Orders, Reports, Billing, Staff, Analytics, Notifications, Settings
- **Voiceover:** "The menu on the left gives you access to everything in your hospital: patients and appointments, doctors and departments, prescriptions, pharmacies and labs, billing, staff, and analytics. Let's start by setting up the hospital."
- **Highlight:** A soft glow that follows the hovered item
- **Transition:** Click **Departments**
- **Expected result:** The viewer sees that the admin has full access within the hospital

**Recording checklist**
1. Hover each item from Appointments to Settings, about 0.8 s each.
2. Stop on **Departments**.

### Scene 05 — Create a department
**Time:** 01:25–02:00 · *Story step 5: Primary workflow (1/3)*

- **Screen:** Departments
- **Purpose:** Show how to organise doctors by speciality
- **User action:** Click **Add Department**, fill in the form, click **Save**
- **On-screen action:** The "Department created successfully!" toast; Orthopedics appears in the list as Active
- **Voiceover:** "Departments organise your doctors and make booking easier. Click Add Department, enter a name such as Orthopedics and a short description, and save. The department is now available when you set up doctor profiles."
- **Highlight:** Zoom on the modal while typing
- **Transition:** Click **Staff** in the sidebar
- **Expected result:** The viewer can create a department

**Recording checklist**
1. Open `/dashboard/departments`. Show that Cardiology, General Medicine and Pediatrics are listed.
2. Click **Add Department**.
3. Type **Department Name**: `Orthopedics`.
4. Type **Description**: `Bone, joint and spine care, fractures and sports injuries.`
5. Leave **Status** as Active. Click **Save**.
6. Check that the toast appears and the Orthopedics card is visible. Pause 1.5 s.

### Scene 06 — Invite a staff member
**Time:** 02:00–02:45 · *Story step 5: Primary workflow (2/3)*

- **Screen:** Staff & Access Control
- **Purpose:** Show how staff get access without the admin handling their passwords
- **User action:** Click **Invite Staff**, enter an email, pick **Consulting Doctor**, click **Generate Invite Link**, then copy the link
- **On-screen action:** "Registration Link Generated", then the "Registration link copied!" toast
- **Voiceover:** "Next, add your team. On the Staff page, click Invite Staff. Enter the person's email and choose their role: Receptionist, Consulting Doctor, or Administrator. Click Generate Invite Link. Arogyix creates a registration link that's valid for seven days. Copy it and send it to your staff member by email or message. They'll set their own password, so you never have to handle it."
- **Highlight:** Zoom on the role dropdown, then on the generated link
- **Transition:** Cut to the incognito window
- **Expected result:** The viewer knows that staff join through an invite link

**Recording checklist**
1. Open `/dashboard/staff`. Briefly show the role filters (All Roles, Administrators, Doctors, Receptionists) and the existing staff.
2. Click **Invite Staff**.
3. **Email Address**: `rohit.deshpande@example.com`.
4. **Staff Role**: select **Consulting Doctor**.
5. Click **Generate Invite Link**. Pause 2 s on the link.
6. Click the copy icon. Check for the "Registration link copied!" toast.
7. Click **Close Portal**.
8. Don't say the link is emailed automatically (see gap G13).

### Scene 07 — Staff member activates the account
**Time:** 02:45–03:10 · *Story step 5: Primary workflow (what happens next)*

- **Screen:** `/register?token=…` ("Activate your account")
- **Purpose:** Close the loop from the new staff member's side
- **User action:** Paste the link, fill in first name, last name and password, click **Activate Account**
- **On-screen action:** The "Account activated!" toast, then the new doctor's dashboard
- **Voiceover:** "When your staff member opens the link, they see this page. They enter their name and choose a password. Their role and hospital are already set by the invite."
- **Highlight:** "You were invited to join a hospital team"
- **Transition:** Cut back to the admin window, Doctors page
- **Expected result:** The viewer understands the staff side of onboarding

**Recording checklist**
1. In the incognito window, paste the link.
2. **First name** `Rohit`, **Last name** `Deshpande`, **Password** `Demo@12345`.
3. Click **Activate Account**. Wait for the doctor dashboard, then pause 1 s.
4. Close the incognito window before cutting back.

### Scene 08 — Configure the doctor's profile
**Time:** 03:10–04:10 · *Story step 5: Primary workflow (3/3)*

- **Screen:** Doctors Directory → Configure Doctor Profile
- **Purpose:** Show the step that makes a doctor bookable
- **User action:** Click **Configure Doctor Profile**, select Rohit Deshpande, fill in the form, click **Save Profile**
- **On-screen action:** The "Doctor profile configured successfully!" toast; the doctor card shows fee, experience, registration number, timing and availability
- **Voiceover:** "Doctors need one more step before patients can book them. On the Doctors page, click Configure Doctor Profile and choose the doctor's account. Add their specialization, department, qualifications and registration number. Then set the consultation fee, how long each appointment slot is, their consulting hours, and which days they're available. Save the profile. Arogyix uses these settings to show only valid time slots when someone books an appointment."
- **Highlight:** Zoom on **Consultation & Scheduling** and **Weekly Availability**
- **Transition:** Click **Medicines Catalog**
- **Expected result:** The viewer knows that the fee and availability drive booking and billing

**Recording checklist**
1. Open `/dashboard/doctors`. Show Dr. Amit Patil's and Dr. Sneha Kulkarni's cards for 2 s.
2. Click **Configure Doctor Profile**.
3. **Select Doctor User Account**: Rohit Deshpande.
4. **Specialization** `Orthopedic Surgeon`. **Department** `Orthopedics`.
5. **Qualifications** `MBBS, MS (Ortho)`. **Medical Reg No.** `MMC-2013-52290`. **Experience** `12`.
6. **Consultation Fee (INR)** `700`. **Slot Duration** `20`. **Start** `11:00`. **End** `18:00`.
7. **Bio / Details**: `Orthopedic surgeon for joint pain, fractures and sports injuries.`
8. **Weekly Availability** (starts at Mon–Fri): untick Tuesday and Thursday, and tick Saturday, so Mon, Wed, Fri and Sat are ticked.
9. Click **Save Profile**. Check that the new card is in the directory. Pause 1.5 s.
10. If the fields are long, speed this part up to 1.5× in the edit, but keep the voiceover at normal speed.

### Scene 09 — Medicines & Ointments Catalog
**Time:** 04:10–04:40 · *Story step 6: Secondary workflow*

- **Screen:** Medicines & Ointments Catalog
- **Purpose:** Show how the hospital speeds up prescription writing
- **User action:** Show the Oral Medicines tab, then click **Add Medicine** and add one item
- **On-screen action:** The catalog table with Default Dosage, Frequency and Timing columns
- **Voiceover:** "The medicines catalog holds the medicines and ointments your doctors prescribe most often, with default dosage, frequency and timing. When a doctor writes a prescription, these appear as suggestions, which saves time and keeps prescriptions consistent."
- **Highlight:** The Default Frequency column
- **Transition:** Click **Pharmacies**
- **Expected result:** The viewer understands what the catalog is for

**Recording checklist**
1. Open `/dashboard/medicines`. Show the six prep items.
2. Click the **Topical Ointments** tab, then **Oral Medicines** (1 s each).
3. Optional: click **Add Medicine**, enter **Item Name** `Diclofenac 50mg`, dosage `1 tablet`, frequency Twice daily (BD), timing After Food, then **Add to Catalog**.

### Scene 10 — Partner pharmacies and labs
**Time:** 04:40–05:25 · *Story step 7: Important features*

- **Screen:** Pharmacies, then Pathology Labs
- **Purpose:** Show the connected network
- **User action:** Show Wellness Pharmacy; click **Invite Pharmacy** → Generate Link, then close. Open Pathology Labs and show CarePlus as linked
- **On-screen action:** "Self-Registration Link Generated"; the lab card with its link status
- **Voiceover:** "Arogyix connects your hospital to pharmacies and diagnostic labs. On the Pharmacies page, you can add a pharmacy's details, or invite the pharmacy to register itself. Once an invited pharmacy registers, your doctors can send prescriptions to it directly. On Pathology Labs, you can browse labs, invite a lab, or request a link with one. Once the lab approves the link, your staff can place test orders with that lab, and results come back into the patient's record."
- **Highlight:** The Wellness Pharmacy card; the **Request Link** button or the lab's link status
- **Transition:** Click **Analytics**
- **Expected result:** The viewer sees that prescriptions and lab orders flow to partners

**Recording checklist**
1. Open `/dashboard/pharmacies`. Wellness Pharmacy is visible with a "Home Delivery Available" badge.
2. Click **Invite Pharmacy**. Wait for "Self-Registration Link Generated", then pause 1.5 s and click **Close**. This creates an extra invite, which is harmless.
3. Open `/dashboard/pathology-labs`. Hover the CarePlus Diagnostics card.
4. Avoid: **Deactivate** on the pharmacy card, and **Revoke** on the lab.

### Scene 11 — Analytics and reports
**Time:** 05:25–06:15 · *Story step 7: Important features*

- **Screen:** Analytics Dashboard → Reports panel
- **Purpose:** Show performance tracking and exporting
- **User action:** Scroll the charts; in Reports choose **Revenue Report** and **This Month**; click **Export**
- **On-screen action:** Charts, the report table, and a CSV download
- **Voiceover:** "Analytics shows how your hospital is doing: appointments over the last seven days, consultations by department, and billing over the last six months. Below the charts, the Reports section gives you detailed reports for appointments, patients, doctor activity, revenue, invoices, payments, prescriptions, follow-ups, cancellations and lab orders. Filter by date, doctor or department, then print the report or export it."
- **Highlight:** Zoom on the report type selector, then the **Export** button
- **Transition:** Click **Settings**
- **Expected result:** The viewer can find and export a report

**Recording checklist**
1. Open `/dashboard/analytics`. Pause on each chart for about 2 s.
2. Scroll to **Reports**. Open **Report type** and hover the list slowly, then pick **Revenue Report**.
3. Choose the date preset **This Month**.
4. Click **Export**. Show the download bar for 1 s, then hide it.
5. If the charts are empty (no warm-up data), shorten this scene and say "as your hospital sees patients, these charts fill in".

### Scene 12 — Hospital settings and subscription
**Time:** 06:15–06:35 · *Story step 7: Important features*

- **Screen:** Settings → Hospital Settings tab
- **Purpose:** Branding and plan
- **User action:** Click the **Hospital Settings** tab and scroll
- **On-screen action:** Current Plan, Manage Subscription, Hospital Branding Details, logo
- **Voiceover:** "In Settings, the Hospital Settings tab holds your hospital's name, logo, contact details and address, which Arogyix uses on documents like prescriptions and invoices. You can also see your current plan and manage your subscription here."
- **Highlight:** The logo and **Current Plan**
- **Transition:** Fade to the dashboard
- **Expected result:** The viewer knows where branding and billing plan live

**Recording checklist**
1. Open `/dashboard/settings` and click **Hospital Settings**.
2. Scroll slowly past **Current Plan** to **Hospital Branding Details**.
3. Don't click **Manage Subscription** unless Razorpay test keys are set (gap G8).

### Scene 13 — Summary
**Time:** 06:35–06:50 · *Story step 8: Summary*

- **Screen:** Hospital Dashboard
- **Purpose:** Wrap up and hand off
- **User action:** None
- **On-screen action:** The dashboard, with end card "Next: the Receptionist workflow"
- **Voiceover:** "Your hospital is now set up. Departments are in place, your staff have their own accounts, your doctors can be booked, and your pharmacy and lab partners are connected. From here, your receptionists and doctors take over the day-to-day work, which is covered in the next videos."
- **Highlight:** None
- **Transition:** End card
- **Expected result:** The viewer knows what they've set up and what happens next

**Recording checklist**
1. Click **Dashboard**, wait for the page to load, and hold 3 s.

---

## Voiceover script (continuous)

> **[Intro]** This video is for hospital administrators. You'll see how to set up your hospital on Arogyix: your departments, your staff, your doctors, and your partner pharmacies and labs. Then you'll see how to keep track of everything from one place.
>
> **[Login]** Every user signs in on the same page. When your hospital was approved, the Arogyix team sent you a temporary password. Enter your email and password, and click Sign In. Arogyix recognises that you're an administrator and opens your hospital dashboard.
>
> **[Dashboard]** Your dashboard shows what's happening today. At the top: today's appointments, total patients, active doctors, and today's revenue with pending payments. Below, you can see patients whose follow-up date has passed, today's appointments by status, and the most recently registered patients.
>
> **[Menu]** The menu on the left gives you access to everything in your hospital: patients and appointments, doctors and departments, prescriptions, pharmacies and labs, billing, staff, and analytics. Let's start by setting up the hospital.
>
> **[Departments]** Departments organise your doctors and make booking easier. Click Add Department, enter a name such as Orthopedics and a short description, and save. The department is now available when you set up doctor profiles.
>
> **[Staff]** Next, add your team. On the Staff page, click Invite Staff. Enter the person's email and choose their role: Receptionist, Consulting Doctor, or Administrator. Click Generate Invite Link. Arogyix creates a registration link that's valid for seven days. Copy it and send it to your staff member by email or message. They'll set their own password, so you never have to handle it.
>
> **[Activation]** When your staff member opens the link, they see this page. They enter their name and choose a password. Their role and hospital are already set by the invite.
>
> **[Doctor profile]** Doctors need one more step before patients can book them. On the Doctors page, click Configure Doctor Profile and choose the doctor's account. Add their specialization, department, qualifications and registration number. Then set the consultation fee, how long each appointment slot is, their consulting hours, and which days they're available. Save the profile. Arogyix uses these settings to show only valid time slots when someone books an appointment.
>
> **[Catalog]** The medicines catalog holds the medicines and ointments your doctors prescribe most often, with default dosage, frequency and timing. When a doctor writes a prescription, these appear as suggestions, which saves time and keeps prescriptions consistent.
>
> **[Partners]** Arogyix connects your hospital to pharmacies and diagnostic labs. On the Pharmacies page, you can add a pharmacy's details, or invite the pharmacy to register itself. Once an invited pharmacy registers, your doctors can send prescriptions to it directly. On Pathology Labs, you can browse labs, invite a lab, or request a link with one. Once the lab approves the link, your staff can place test orders with that lab, and results come back into the patient's record.
>
> **[Analytics]** Analytics shows how your hospital is doing: appointments over the last seven days, consultations by department, and billing over the last six months. Below the charts, the Reports section gives you detailed reports for appointments, patients, doctor activity, revenue, invoices, payments, prescriptions, follow-ups, cancellations and lab orders. Filter by date, doctor or department, then print the report or export it.
>
> **[Settings]** In Settings, the Hospital Settings tab holds your hospital's name, logo, contact details and address, which Arogyix uses on documents like prescriptions and invoices. You can also see your current plan and manage your subscription here.
>
> **[Summary]** Your hospital is now set up. Departments are in place, your staff have their own accounts, your doctors can be booked, and your pharmacy and lab partners are connected. From here, your receptionists and doctors take over the day-to-day work, which is covered in the next videos.
