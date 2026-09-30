# Arogyix — Recording Runbook

> ## ▶ RECORD FROM RECORDING_RUNBOOK.md ONLY.
> This runbook is the **only authoritative** set of recording instructions. The per-video files (`*_RECORDING_SCRIPT.md`, `*_DEMO_SCRIPT.md`, `MASTER_DEMO_FLOW.md`) are **reference documents only**. Where they differ from this runbook, follow the runbook.

Keep this open beside the app while recording. One section per video, one block per scene.
Record in the order in `QUICK_RECORDING_ORDER.md`. Tick progress in `RECORDING_PROGRESS.md`. Tick every box in `FINAL_RECORDING_PREPARATION_CHECKLIST.md` before the first take.

- Values to type: `DEMO_DATA.md` (§ numbers are given in each scene).
- Full narration: `MASTER_VOICEOVER_SCRIPT.md`. Editing: `VIDEO_EDITING_GUIDE.md`.
- `<id>` in a route = the app's own record ID. You reach it by clicking, never by typing.
- **EDIT ONLY** = nothing to record; the scene is built in the editor.

---

## 📅 Recording day: Saturday 10 October 2026 (= D)

| Token | Date | Weekday | Where it's used |
|---|---|---|---|
| D | **10-10-2026** | Saturday | Every hospital-side take. **Dr. Amit Patil and Dr. Sneha Kulkarni must both work Monday–Saturday** (Saturday ticked) |
| D-7 … D-1 | 03-10-2026 … 09-10-2026 | Sat … Fri | Warm-up week (`DEMO_DATA.md` §3) |
| D-6 | 04-10-2026 | **Sunday** | **Skip it.** No doctor works Sundays, so there are no slots |
| D+14 | **24-10-2026** | Saturday | Follow-up date (Doctor 09, Master 06) and Rahul's self-booking (Patient 07). Dr. Patil must be available that Saturday |
| D+30 | **09-11-2026** | Monday | Prescription Valid Until (Doctor 07) |
| Cetirizine CTZ-2511-E expiry | **25-10-2026** | Sunday | D+15, inside the 30-day Expiring Soon window (Pharmacy 03, 06) |

### ⚠️ Three rules for every take

1. **Pharmacy Dispense Qty = `1` for each medicine** (Pharmacy 05, Master 07): Amlodipine `1`, Atorvastatin `1`, Pantoprazole `1`. **Never** 30 / 30 / 14. The pharmacy receives each item with Qty 1, so 1 leaves Remaining 0. A larger number leaves a negative Remaining and can't be undone without a reset.
2. ⚠️ **DO NOT CLICK "Check Out" during the receptionist workflow.** After **Check In**, Rahul's queue row shows **Check Out** next to **Collect**. Check Out completes Rahul's visit from the front desk. Clicked before the prescription exists, it shows a red error toast on camera. Clicked after the prescription, it completes the visit **without** the doctor's **Complete Appointment** step, so the **Schedule Follow-up** form never opens and the doctor's follow-up (Doctor 09, Master 06) can't be recorded. Only the doctor completes Rahul's visit. At the desk, use **Check In**, **Generate Bill** and **Collect** only.
3. **PDF buttons download a file; they don't open a viewer.** Chrome downloads must be configured and tested in every profile before recording (see Global setup). Open a downloaded PDF only where a scene step says so, and only in a Chrome tab from the download bubble. Never open a PDF externally (Preview, Finder or another app).

---

## ⚠️ Read first: findings from the code check (30 Sep 2026)

Every route, sidebar item, button, field and toast in the recording scripts was searched for in `frontend/` and `backend/`. Everything exists except the items below. **All items are now resolved or handled** (final validation, 30 Sep 2026; see `FINAL_DEMO_VALIDATION_REPORT.md`). No replacement feature has been invented for any of them.

| # | Video / Scene | What the script says | What the code shows | Status |
|---|---|---|---|---|
| 1 | Pharmacy 05 | Dispense Qty `30 / 30 / 14`; "Remaining drops to 0" | Every item forwarded to the pharmacy is created with **Qty 1** (`pharmacy-prescriptions.service.ts`, `quantity: 1`). **Remaining** = 1. No over-dispense cap was found in the frontend or backend, so entering 30 may leave **Remaining −29** and deduct 30 from stock | ✅ RESOLVED: dispense **`1` per item** → Remaining 0. Pharmacy 05 and Master 07 corrected below |
| 2 | Pharmacy 04 | Pause on the **Catalog Medicine** column | That column only renders when at least one item is **not** matched to the catalog. In the intended state (all matched) it doesn't appear | ✅ EXPECTED: the column won't appear. Pharmacy 04 no longer pauses on it |
| 3 | Doctor 08, Patient 04, Master 06/10 | Click **PDF**, "show the PDF" | The **PDF** button **downloads** `prescription-<id>.pdf`. It doesn't open a viewer | ✅ RESOLVED: Chrome downloads configured and tested per profile (Global setup). Scenes open the file from the download bubble in a Chrome tab |
| 4 | Receptionist 08 | Click the download icon, "show the PDF" | The icon **downloads** `<invoiceNo>.pdf`. It doesn't open a viewer | ✅ RESOLVED (same as #3) |
| 5 | Admin 07 | "Untick Tuesday and Thursday so Mon, Wed, Fri and Sat stay ticked" | **Weekly Availability defaults to Mon–Fri.** Saturday starts unticked | Corrected below: untick Tue + Thu **and tick Sat** |
| 6 | Pharmacy 03 | Fourth card "**Today**" | Card label is **Today's Sales** | Corrected below |
| 7 | Staff 05 | Toast "Temporary Password copied to clipboard!" | Toast is **"Password copied to clipboard!"** | Corrected below |
| 8 | Patient 05 | Report row "Lab Report — LAB-2026-…" | Title is `Lab Report — <order no.>`; order numbers are `LAB-<year>-<5 digits>` | Consistent |
| 9 | Pathology 05 | Container `SST (gold top)` | **Container** is a free-text box (placeholder "e.g. EDTA tube"). The value is demo data | OK |
| 10 | Receptionist 06–07 | (not mentioned) | After Check In, **Check Out** appears next to **Collect** and completes the visit | ✅ HANDLED: never click Check Out (rule 2 above) |
| 11 | Pharmacy 03, 06 | Cetirizine shows as "Expiring Soon" | Only batches expiring **within 30 days** count | ✅ HANDLED: CTZ-2511-E expiry is **25-10-2026** (D+15), `DEMO_DATA.md` §5 |
| 12 | Receptionist 05, Patient 07 | Slots on D and D+14 | Weekly Availability defaults to Mon–Fri; D and D+14 are both Saturdays | ✅ HANDLED: Dr. Patil and Dr. Kulkarni set to Mon–Sat, checked in `DEMO_DATA_RESET.md` post-reset checks |

Conditional items that depend on your environment, not the code (already in the scripts):
- **Razorpay test keys**: Patient 06 and Master 09 step 2. Without keys, **Pay Now** returns 503; use the alternative line.
- **Active subscriptions**: Staff 08 shows "No active subscriptions yet" without them; use the alternative line.
- **Medicines Due**: Patient 03 shows "No medicines due" if today's reminder times have passed.
- **Chat "Connected"**: needs `NEXT_PUBLIC_SOCKET_URL` pointing at the running backend.

---

## Global setup (every video)

- Chrome, **one profile per role**: `Admin`, `Reception`, `DrPatil`, `Pharmacy`, `Lab`, `PatientRahul`, `SA`, plus a **clean logged-out** profile (landing page, invite activation). Logins are shared across tabs of one profile, so never sign in to two roles in the same profile.
- 1920×1080, window maximised, zoom **110%**, light mode, one tab, bookmarks bar hidden, extensions off, password saving off.
- macOS Do Not Disturb on; Chrome notifications off; Dock hidden.
- Reload the page before every take (clears old toasts).
- **Backend:** record against the **local** backend on this Mac, set to **India Standard Time**. Don't point the frontend at a cloud backend: slot weekdays and booked-slot hiding use the server's timezone.
- **Chrome downloads (pre-recording requirement)**, in every profile that downloads a file: `DrPatil`, `Reception`, `PatientRahul`, `Admin`, `Lab`:
  1. `chrome://settings/downloads` → **"Ask where to save each file before downloading" = off**, so no Save dialog appears on camera.
  2. `chrome://settings/content/pdfDocuments` → **"Open PDFs in Chrome"**, so a downloaded PDF opens in a Chrome tab, not in Preview.
  3. **Test each PDF download once, off camera**, in each profile: prescription **PDF** (`DrPatil`, `PatientRahul`), invoice download icon (`Reception`), lab report **Download** (`Lab`, `PatientRahul`), CSV **Export** (`Admin`). Confirm the file saves without a dialog and doesn't cover the app.
  4. Before each take, clear the list at `chrome://downloads` (**Clear all**) so old files don't appear in the download bubble.
  5. Don't open a PDF externally. Open one only where a scene step says so, from the download bubble, in a Chrome tab, then close that tab.
- `DEMO_DATA.md` open on a **second screen**, never in shot.
- Name files `<CLIP>-take<N>.mov` (e.g. `REC-04-take2.mov`).

---
---

# VIDEO 1 — STAFF (Super Admin / Platform Administration)

| | |
|---|---|
| **1. Video name** | Arogyix Platform Administration (clip prefix `STF`) |
| **2. Target duration** | 3:15 |
| **3. Login role** | Super Admin — `superadmin@Arogyix.health` / `Password123!` (display name **Sameer Khan**). Scene 02 uses the clean logged-out profile |
| **4. Starting URL** | Scene 02: `/`. Scene 03 onwards: `/login` |
| **5. Required demo data** | `DEMO_DATA.md` §7. Pending request **Test Clinic Duplicate** (`duplicate.test@example.com`) exists. **No** Sahyadri Care Clinic request or tenant |
| **6. Pre-recording setup** | Submit "Test Clinic Duplicate" from the landing page off camera. Rename the SA to Sameer Khan (Settings → Personal Profile). Decide whether Scene 08 is shown (needs an active test subscription) |
| **7. Scene order** | 01 (edit) → 02 (logged-out profile) → 03 → 04 → 05 → 06 → 07 → 08 → 09 |
| **10. Voiceover reference** | `MASTER_VOICEOVER_SCRIPT.md` → "Platform Administration (3:15)" |

--------------------------------
SCENE 01
--------------------------------

Screen: Title card — **EDIT ONLY**
Route: none (blurred still of `/dashboard/super-admin`)
Role: none

Before recording:
- Take a screenshot of `/dashboard/super-admin` for the background.

Actions:
1. Nothing to record.

Expected result:
Title "Arogyix Platform Administration".

Narration:
[00:00–00:10] "Before a hospital can use Arogyix, it's reviewed and approved by the Arogyix platform team. Here's how that works."

Highlight:
None.

Pause:
Hold 10 s.

Next scene:
Cross-fade to the landing page (logged-out profile).

--------------------------------
SCENE 02
--------------------------------

Screen: Landing page → pricing → **Register Your Clinic / Hospital**
Route: `/`
Role: public visitor (clinic applicant)

Before recording:
- Clean logged-out profile, `/` loaded, scrolled to the top.

Actions:
1. Scroll slowly to **Simple, transparent pricing**.
2. On the **Professional** card, click **Get Started**.
3. Confirm the form shows "Selected plan: Professional".
4. **1. Clinic Details**: `Sahyadri Care Clinic`.
5. **2. Administrator Information**: `Kiran` / `Pawar` / `kiran.pawar@example.com` / `9800000701`.
6. **Street Address** `18 College Road`, **City** `Nashik`, **State / Province** `Maharashtra`. Referral Code empty.
7. Click **Submit Registration Request**.

Expected result:
**Request Received!**

Narration:
[00:10–00:55] "A new clinic, Sahyadri Care Clinic, applies from the Arogyix website. They pick a plan and give their clinic and administrator details. The request goes to the platform team for review."

Highlight:
Cyan on "Selected plan: Professional". Lower-third **Kiran Pawar · Clinic applicant**.

Pause:
2 s on Request Received!

Next scene:
Switch to the `SA` profile, `/login`.

--------------------------------
SCENE 03
--------------------------------

Screen: Login
Route: `/login` → `/dashboard/super-admin`
Role: Super Admin

Before recording:
- `SA` profile signed out, `/login` loaded.

Actions:
1. **Email address**: `superadmin@Arogyix.health`.
2. **Password**: type it (don't click the eye icon).
3. Click **Sign In**.

Expected result:
**Super Admin Portal** opens.

Narration:
[00:55–01:05] "Sameer, from the Arogyix operations team, signs in to the Super Admin Portal."

Highlight:
Soft highlight on **Sign In**. Lower-third **Sameer Khan · Arogyix Platform Team**.

Pause:
1 s after load.

Next scene:
Stay on the portal.

--------------------------------
SCENE 04
--------------------------------

Screen: Super Admin Portal
Route: `/dashboard/super-admin`
Role: Super Admin

Before recording:
- Page fully loaded.

Actions:
1. Hover **Total Hospitals**, **Total Pharmacies**, **Total Labs**, **Platform Users**, **Pending Referrals**.
2. Scroll to **Hospital Registration Requests** (Pending tab).

Expected result:
Stat cards show totals; Sahyadri and Test Clinic Duplicate are pending.

Narration:
[01:05–01:25] "The portal shows every hospital, pharmacy and lab on the platform, and the total number of users. Below are the registration requests waiting for review."

Highlight:
Cyan on the stat row.

Pause:
1 s on the requests table.

Next scene:
Stay on the page.

--------------------------------
SCENE 05
--------------------------------

Screen: Hospital Registration Requests
Route: `/dashboard/super-admin`
Role: Super Admin

Before recording:
- Pending tab visible with both requests.

Actions:
1. Hover the Sahyadri row: Type, Plan, Admin details, Location, Submitted On.
2. Click **Approve**.
3. **Hospital Approved!** ("Tenant & Admin Account Created"): pause on Hospital Name, Admin Login Email, Temporary Password.
4. Click the copy icon next to the password → toast **"Password copied to clipboard!"**.
5. Click **Done & Close**.
6. On **Test Clinic Duplicate**, click the reject button (tooltip **Reject Request**) → "Registration request rejected".
7. Click the **Approved** tab.

Expected result:
Sahyadri in Approved; duplicate in Rejected.

Narration:
[01:25–02:10] "Sameer checks the request and approves it. Arogyix creates the clinic's own workspace and an administrator account in one step. The temporary password is shown only once, so he copies it and passes it to the clinic's administrator. A duplicate request is simply rejected."

Highlight:
**Red** on "the temporary password will not be shown again". Cyan on the Approved tab. Feature title **Onboarding Approval**. **Blur the password in the edit.**

Pause:
3 s on the dialog.

Next scene:
Sidebar **Hospitals**.

--------------------------------
SCENE 06
--------------------------------

Screen: Hospitals
Route: `/dashboard/hospitals`
Role: Super Admin

Before recording:
- None.

Actions:
1. Point at **Sahyadri Care Clinic**.
2. Hover the **Type**, **Sub-records** and **Subscription** columns.
3. Hover the **Status** toggle. **Do not click.**

Expected result:
New clinic listed as active beside the hospital, pharmacy and lab.

Narration:
[02:10–02:35] "Every hospital, pharmacy and lab is listed here, with its contacts, size, subscription and status. An organisation can be deactivated from here if needed."

Highlight:
Cyan on the Sahyadri row.

Pause:
1.5 s on the row.

Next scene:
Sidebar **Dashboard** → click the **Platform Users** card (there's no Platform Users sidebar item).

--------------------------------
SCENE 07
--------------------------------

Screen: Platform Users
Route: `/dashboard/super-admin/users`
Role: Super Admin

Before recording:
- Trim "Loading platform users…" in the edit.

Actions:
1. Type `kiran` in "Search users by name or email...".
2. Point at Kiran Pawar's **Role** and **Tenant**.

Expected result:
Kiran Pawar · Hospital Admin · Sahyadri Care Clinic.

Narration:
[02:35–02:50] "Platform Users finds any account across all organisations, with its role and organisation. Kiran is now Sahyadri Care Clinic's administrator."

Highlight:
Cyan on Role + Tenant.

Pause:
1.5 s.

Next scene:
Sidebar **Revenue Analytics**.

--------------------------------
SCENE 08
--------------------------------

Screen: Revenue Analytics
Route: `/dashboard/super-admin/analytics`
Role: Super Admin

Before recording:
- Know whether there's an active test subscription.

Actions:
1. Hover **Current MRR**, **Active Subscriptions**, **Plan Tiers in Use**.
2. Scroll slowly past the charts.

Expected result:
Cards and charts show data, or "No active subscriptions yet" (then keep the scene to 8 s).

Narration:
[02:50–03:05] "Revenue Analytics tracks monthly recurring revenue, active subscriptions and which plans are in use."
Alt (no subscriptions): "As organisations subscribe, Revenue Analytics tracks monthly recurring revenue and plan usage."

Highlight:
Cyan on Current MRR.

Pause:
1 s on the charts.

Next scene:
Sidebar **Dashboard**.

--------------------------------
SCENE 09
--------------------------------

Screen: Super Admin Portal
Route: `/dashboard/super-admin`
Role: Super Admin

Before recording:
- None.

Actions:
1. Wait for load. Park the cursor on **Total Hospitals**.

Expected result:
Total Hospitals is up by one.

Narration:
[03:05–03:15] "Sahyadri Care Clinic is live. Its administrator can now sign in and set up the hospital."

Highlight:
Cyan on Total Hospitals. End card **Next: Setting up the hospital**.

Pause:
3 s.

Next scene:
End of video.

**11. Screen recording notes:** two profiles (logged-out for 02, `SA` for 03–09). Speed up typing in 02 to 2–3×.
**12. What to avoid:** the **Status** toggle on any tenant; hovering or clicking **Total Patients** / **Total Appointments**; saying credentials are emailed.
**13. Completion check:** Sahyadri approved and in Hospitals · Kiran found in Platform Users · duplicate rejected · password blurred · no red toasts.

---
---

# VIDEO 2 — HOSPITAL ADMIN

| | |
|---|---|
| **1. Video name** | Arogyix for Hospital Administrators (clip prefix `ADM`) |
| **2. Target duration** | 4:35 |
| **3. Login role** | Hospital Admin — `admin@Arogyix.health` / `Password123!` (display name **Meera Joshi**). Scene 06 uses the clean logged-out profile |
| **4. Starting URL** | `/login` |
| **5. Required demo data** | `DEMO_DATA.md` §2, §9. Hospital renamed with logo. Cardiology, General Medicine, Pediatrics exist; **no Orthopedics**. `rohit.deshpande@example.com` **not invited**. Dr. Patil and Dr. Kulkarni configured. Wellness Pharmacy and CarePlus (Active) connected. Warm-up data for charts |
| **6. Pre-recording setup** | Scenes 01–09 in the **morning** of D. Scenes 10–12 at the **end** of D (after Rahul is billed and paid). Clean logged-out profile ready for Scene 06 |
| **7. Scene order** | 01 (edit) → 02 → 03 → 04 → 05 → 06 (logged-out profile) → 07 → 08 → 09 · *(end of day)* → 10 → 11 → 12 |
| **10. Voiceover reference** | `MASTER_VOICEOVER_SCRIPT.md` → "Hospital Administrator (4:35)" |

--------------------------------
SCENE 01
--------------------------------

Screen: Title card — **EDIT ONLY**
Route: none (blurred still of `/dashboard/hospital`)
Role: none

Before recording:
- Screenshot `/dashboard/hospital`.

Actions:
1. Nothing to record.

Expected result:
Title "Arogyix for Hospital Administrators" · *Set up once. See everything.*

Narration:
[00:00–00:12] "Meera runs Arogyix Multispeciality Hospital. Let's see how she sets it up and keeps track of it."

Highlight:
None.

Pause:
Hold 12 s.

Next scene:
Cross-fade to login.

--------------------------------
SCENE 02
--------------------------------

Screen: Login ("Welcome back")
Route: `/login` → `/dashboard/hospital`
Role: Hospital Admin

Before recording:
- `Admin` profile signed out.

Actions:
1. **Email address** `admin@Arogyix.health`.
2. Type the password.
3. Click **Sign In**.

Expected result:
Hospital Dashboard opens.

Narration:
[00:12–00:25] "Every member of the hospital signs in on the same page. Arogyix recognises Meera as the administrator and opens her dashboard."

Highlight:
**Sign In**. Lower-third **Meera Joshi · Hospital Administrator**.

Pause:
1 s after load.

Next scene:
Stay on the dashboard.

--------------------------------
SCENE 03
--------------------------------

Screen: Hospital Dashboard
Route: `/dashboard/hospital`
Role: Hospital Admin

Before recording:
- Confirm there's no "Couldn't load dashboard data" card.
- **Missed Follow-ups** shows **Sunita Rao** (warm-up visit on Mon 05-10-2026 with Dr. Kulkarni, follow-up date 09-10-2026). If it's empty, use the shorter 1 s pause.

Actions:
1. Hover **Today's Appointments**, **Total Patients**, **Active Doctors**, **Today's Revenue** (1 s each).
2. Scroll ~300 px to **Missed Follow-ups** and **Today's Appointment Status**. Pause 2 s.
3. Scroll to **Recently Registered Patients**, then back to the top.

Expected result:
All cards show numbers.

Narration:
[00:25–00:50] "Her dashboard shows today's appointments, total patients, active doctors and today's revenue. Below, she can see patients who missed a follow-up, today's appointments by status, and the newest registrations."

Highlight:
Cyan on the 4 cards, then Missed Follow-ups. Feature title **Hospital Dashboard**.

Pause:
2 s on Missed Follow-ups.

Next scene:
Sidebar **Departments**.

--------------------------------
SCENE 04
--------------------------------

Screen: Departments
Route: `/dashboard/departments`
Role: Hospital Admin

Before recording:
- Orthopedics must **not** exist.

Actions:
1. Pause 1 s on the existing three departments.
2. Click **Add Department**.
3. **Department Name** `Orthopedics`.
4. **Description** `Bone, joint and spine care, fractures and sports injuries.`
5. Leave **Status** Active. Click **Save**.

Expected result:
"Department created successfully!"; Orthopedics listed as Active.

Narration:
[00:50–01:15] "The hospital is adding an orthopedic service. Meera creates an Orthopedics department, so the new surgeon can be listed under it and patients can find him."

Highlight:
Cyan on the new Orthopedics card.

Pause:
1.5 s after the toast.

Next scene:
Sidebar **Staff**.

--------------------------------
SCENE 05
--------------------------------

Screen: Staff & Access Control → Invite Staff
Route: `/dashboard/staff`
Role: Hospital Admin

Before recording:
- Rohit Deshpande not in the list.

Actions:
1. Pause 1 s on the staff list.
2. Click **Invite Staff**.
3. **Email Address** `rohit.deshpande@example.com`.
4. **Staff Role**: Consulting Doctor.
5. Click **Generate Invite Link**.
6. Wait for **Registration Link Generated**. Pause 2 s.
7. Click the copy icon → "Registration link copied!".
8. Click **Close Portal**.

Expected result:
Link generated and copied (valid 7 days, confirmed in the backend).

Narration:
[01:15–01:45] "Next, she invites the new surgeon, Dr. Rohit Deshpande. She enters his email and his role, and Arogyix creates a secure registration link, valid for seven days. She sends it to him, and he sets his own password."

Highlight:
Cyan on Staff Role, then the link. Feature title **Staff Onboarding**. **Blur the token in the edit.**

Pause:
2 s on the link.

Next scene:
Switch to the clean logged-out profile.

--------------------------------
SCENE 06
--------------------------------

Screen: Activate your account
Route: `/register?token=…`
Role: new Doctor

Before recording:
- Clean logged-out profile. **Not the Admin profile**: activating there would sign Meera out.

Actions:
1. Paste the copied link, press Enter.
2. **First name** `Rohit`, **Last name** `Deshpande`.
3. **Password** `Demo@12345`.
4. Click **Activate Account**.
5. Wait for the doctor dashboard, pause 1 s, close the window.

Expected result:
Account activated; lands on the doctor dashboard.

Narration:
[01:45–02:05] "Dr. Deshpande opens the link, enters his name and chooses a password. His role and hospital are already set by the invitation."

Highlight:
Cyan on "You were invited to join a hospital team". Caption *Dr. Rohit Deshpande's screen*. **Crop or blur the address bar.**

Pause:
1 s on the new dashboard.

Next scene:
Back to the `Admin` profile → sidebar **Doctors**.

--------------------------------
SCENE 07
--------------------------------

Screen: Doctors Directory → Configure Doctor Profile
Route: `/dashboard/doctors` → `/dashboard/doctors/new`
Role: Hospital Admin

Before recording:
- Scene 06 done (Rohit is an active user).

Actions:
1. Pause 1 s on the Dr. Patil and Dr. Kulkarni cards.
2. Click **Configure Doctor Profile**.
3. Choose **Rohit Deshpande** from the user list.
4. **Specialization** `Orthopedic Surgeon` · **Department** Orthopedics.
5. **Qualifications** `MBBS, MS (Ortho)` · **Medical Reg No.** `MMC-2013-52290` · **Experience (Years)** `12`.
6. **Consultation Fee (INR)** `700` · **Slot Duration (Minutes)** `20` · Start `11:00` · End `18:00`.
7. **Bio / Details** `Orthopedic surgeon for joint pain, fractures and sports injuries.`
8. **Weekly Availability** (defaults to Mon–Fri): untick **Tuesday** and **Thursday**, and **tick Saturday**. Result: Mon, Wed, Fri, Sat.
9. Click **Save Profile**.

Expected result:
"Doctor profile configured successfully!"; Rohit's card shows fee, experience and hours.

Narration:
[02:05–02:50] "One more step makes him bookable. Meera sets his specialization, department and registration number, then his consultation fee, how long each appointment lasts, his consulting hours and the days he works. From now on, only these real time slots are offered when anyone books him."

Highlight:
Cyan on **Consultation & Scheduling**, then **Weekly Availability**.

Pause:
1.5 s on the new card.

Next scene:
Sidebar **Medicines Catalog**.

--------------------------------
SCENE 08
--------------------------------

Screen: Medicines & Ointments Catalog
Route: `/dashboard/medicines`
Role: Hospital Admin

Before recording:
- Six catalog items exist (`DEMO_DATA.md` §2).

Actions:
1. Pause on **Oral Medicines**.
2. Click **Topical Ointments** (1 s), then back to **Oral Medicines**.
3. Hover **Add Medicine**. Don't click.

Expected result:
Default dosage, frequency and timing visible.

Narration:
[02:50–03:05] "The medicines catalog holds what the hospital's doctors prescribe most, with default dosage and timing. It powers the suggestions doctors see when writing prescriptions."

Highlight:
Cyan on the frequency and timing columns.

Pause:
1 s.

Next scene:
Sidebar **Pharmacies**.

--------------------------------
SCENE 09
--------------------------------

Screen: Pharmacies, then Pathology Labs
Route: `/dashboard/pharmacies` → `/dashboard/pathology-labs`
Role: Hospital Admin

Before recording:
- CarePlus link status is ACTIVE.

Actions:
1. Hover the **Wellness Pharmacy** card ("Home Delivery Available").
2. Hover **Invite Pharmacy**. Don't click.
3. Sidebar **Pathology Labs**.
4. Hover the **CarePlus Diagnostics** card and its ACTIVE badge.
5. Hover **Invite Pathology Lab**. Don't click.

Expected result:
Both partners visible and connected.

Narration:
[03:05–03:35] "Arogyix also connects the hospital to its partners. Wellness Pharmacy receives prescriptions directly from the hospital's doctors, and CarePlus Diagnostics receives their test orders. New partners can be invited to join with a link."

Highlight:
Cyan on each card.

Pause:
1 s on each card.

Next scene:
**STOP.** Scenes 10–12 are recorded at the end of day D.

--------------------------------
SCENE 10
--------------------------------

Screen: Analytics Dashboard → Reports panel
Route: `/dashboard/analytics`
Role: Hospital Admin

Before recording:
- End of D: Rahul's ₹800 has been collected.
- Download bar/bubble cleared.

Actions:
1. Pause ~2 s on each chart: **Appointment Distribution (Last 7 Days)**, department share, billing (last 6 months).
2. Scroll to **Reports**.
3. Open the report type list → **Revenue Report**.
4. Date preset **Today** (or **This Month** for a fuller table).
5. Click **Export**. Show the download 1 s, then hide it.

Expected result:
Revenue Report lists today's invoices incl. Rahul Sharma; a CSV downloads.

Narration:
[03:35–04:10] "Analytics shows how the hospital is doing: appointments this week, consultations by department, and billing over six months. Detailed reports on revenue, appointments, prescriptions, follow-ups and lab orders can be filtered, printed or exported."

Highlight:
Cyan on the report selector, then **Export**. Feature title **Analytics & Reports**.

Pause:
1.5 s on the table.

Next scene:
Sidebar **Settings**.

--------------------------------
SCENE 11
--------------------------------

Screen: Settings → Hospital Settings
Route: `/dashboard/settings`
Role: Hospital Admin

Before recording:
- Logo uploaded.

Actions:
1. Click the **Hospital Settings** tab.
2. Scroll slowly past **Current Plan** to **Hospital Branding Details** and the logo.

Expected result:
Name, logo and contact details visible.

Narration:
[04:10–04:20] "In Settings, the hospital's name, logo and contact details are kept up to date, and they appear on every prescription and invoice."

Highlight:
Cyan on the logo.

Pause:
1 s on the logo.

Next scene:
Sidebar **Dashboard**.

--------------------------------
SCENE 12
--------------------------------

Screen: Hospital Dashboard
Route: `/dashboard/hospital`
Role: Hospital Admin

Before recording:
- None.

Actions:
1. Wait for load. Park the cursor on the right.

Expected result:
Today's figures, including Rahul's visit.

Narration:
[04:20–04:35] "A new department, a new surgeon ready to be booked, partners connected, and the numbers one click away. Now the front desk and doctors take over."

Highlight:
None. End card **Next: The Front Desk**.

Pause:
3 s.

Next scene:
End of video.

**11. Screen recording notes:** the cut from 09 (morning) to 10 (end of day) must be invisible, so use the same zoom and window size. Speed up 07 steps 4–5 and 7 to 2×.
**12. What to avoid:** **Deactivate** (pharmacy), **Revoke** (lab), **Delete**, the staff active toggle, **Manage Subscription** (unless Razorpay test keys are set). Never say invites or passwords are emailed automatically.
**13. Completion check:** Orthopedics exists · Rohit active and configured with Mon/Wed/Fri/Sat · Revenue CSV exported with Rahul's invoice · tokens blurred.

---
---

# VIDEO 3 — RECEPTIONIST

| | |
|---|---|
| **1. Video name** | Arogyix for the Front Desk (clip prefix `REC`) |
| **2. Target duration** | 3:50 |
| **3. Login role** | Receptionist — `priya.deshmukh@example.com` / `Demo@12345` |
| **4. Starting URL** | `/login` |
| **5. Required demo data** | `DEMO_DATA.md` §3, §4. It is **day D**. **Rahul Sharma does not exist** (search Patients for "Rahul"). Dr. Patil works today's weekday. The 11:30 slot is ≥ 60 min in the future |
| **6. Pre-recording setup** | Screenshot `/dashboard/receptionist` for the title card. Paper and pen ready for the **Temporary Password** (needed for the Patient video). It is **Sat 10-10-2026**; Dr. Patil has **Saturday** ticked. ⚠️ **DO NOT CLICK "Check Out"** in any scene (rule 2) |
| **7. Scene order** | 01 (edit) → 02 → 03 → 04 → 05 → 06 → **STOP (record Doctor video)** → 07 → 08 → 09 |
| **10. Voiceover reference** | `MASTER_VOICEOVER_SCRIPT.md` → "Front Desk (3:50)" |

--------------------------------
SCENE 01
--------------------------------

Screen: Title card — **EDIT ONLY**
Route: none (blurred still of `/dashboard/receptionist`)
Role: none

Before recording:
- Screenshot taken.

Actions:
1. Nothing to record.

Expected result:
"Arogyix for the Front Desk" · *Register · Book · Check in · Bill*.

Narration:
[00:00–00:12] "Every hospital visit starts at the front desk. Let's follow Priya, the receptionist, as she welcomes a new patient, Rahul Sharma."

Highlight:
None.

Pause:
Hold 12 s.

Next scene:
Cross-fade to login.

--------------------------------
SCENE 02
--------------------------------

Screen: Login
Route: `/login` → `/dashboard/receptionist`
Role: Receptionist

Before recording:
- `Reception` profile signed out.

Actions:
1. **Email address** `priya.deshmukh@example.com`.
2. Type the password. No eye icon.
3. Hover **Sign In** ½ s, click.

Expected result:
"Welcome back!" toast; Front Desk Dashboard.

Narration:
[00:12–00:25] "Priya signs in with her own account. Arogyix knows she's a receptionist and opens the front-desk view."

Highlight:
**Sign In**. Lower-third **Priya Deshmukh · Receptionist**.

Pause:
1 s after load.

Next scene:
Stay on the dashboard.

--------------------------------
SCENE 03
--------------------------------

Screen: Front Desk Dashboard
Route: `/dashboard/receptionist`
Role: Receptionist

Before recording:
- None.

Actions:
1. Hover **Today's Appointments**, **Checked-In / Waiting**, **Payments Pending**, **Today's Revenue**.
2. Hover along **Reception Quick Actions**: Register Patient, Book Appointment, Billing Center, Missed Follow-ups, Reports.
3. Scroll ~300 px to **Patient Queue & Schedule**.
4. Scroll back up.

Expected result:
4 cards with numbers; queue shows today.

Narration:
[00:25–00:50] "Her dashboard shows the day at a glance: today's appointments, who is waiting, which bills are still unpaid, and today's collections. Below is the live patient queue, where most of her day happens."

Highlight:
Box on the 4 cards, then the queue.

Pause:
2 s on the queue.

Next scene:
Cursor to **Register Patient**, then continue.

--------------------------------
SCENE 04
--------------------------------

Screen: Register New Patient
Route: `/dashboard/patients/new`
Role: Receptionist

Before recording:
- Rahul must not exist. **This step can't be repeated** (see `DEMO_DATA_RESET.md`).

Actions:
1. Click **Register Patient** (Quick Actions).
2. **First Name** `Rahul` · **Last Name** `Sharma`.
3. **Email Address** `rahul.sharma@example.com` · **Phone Number** `9800000201` · WhatsApp toggle off.
4. **Date of Birth** `12-03-1978` · **Gender** Male · **Blood Group** B+.
5. **Residential Address** `Flat 12, Sai Residency, Aundh` · **City** `Pune`.
6. Emergency: **Contact Name** `Anjali Sharma` · **Relation** `Spouse` · **Phone Number** `9800000202`.
7. **Allergies** `Penicillin` + Enter.
8. **Chronic Conditions** `Hypertension` + Enter.
9. **Clinical Notes** `Home BP readings around 150/95 over the last two weeks. Non-smoker.`
10. Click **Register Patient**.
11. On **Patient Registered!**, **write down the Temporary Password**.
12. Click **Done & Close**.

Expected result:
Modal "Patient Login Account Created" with Login Email and Temporary Password.

Narration:
[00:50–01:40] "Rahul is visiting for the first time. Priya registers him with his contact details, date of birth, blood group and an emergency contact. She also records his penicillin allergy and his high blood pressure, so the doctor sees them before the consultation. Arogyix creates Rahul's patient record and his own patient login, ready to hand to him at the desk."

Highlight:
**Red** on the Penicillin chip; cyan on Login Email. Feature title **Patient Registration**. **Blur the password.**

Pause:
2 s on the modal.

Next scene:
Dashboard → **Book Appointment**.

--------------------------------
SCENE 05
--------------------------------

Screen: Schedule New Appointment
Route: `/dashboard/appointments/new`
Role: Receptionist

Before recording:
- Check the clock: 11:30 must still be in the future.

Actions:
1. Click **Book Appointment** (Quick Actions).
2. **Select Registered Patient**: `Rahul` → **Rahul Sharma**.
3. **Doctor / Specialist**: `Amit` → **Dr. Amit Patil**.
4. Pause on **Selected Doctor Info** (Cardiology, ₹800).
5. **Appointment Date**: today. Wait until "Fetching doctor availability slots..." clears.
6. **Available Slots**: **11:30 AM** (or the first free slot ≥ 60 min away).
7. **Appointment Type**: Regular Consultation.
8. **Reason for Visit**: `Chest discomfort on exertion and high BP readings at home for 2 weeks`.
9. **Additional Notes**: `Brings home BP log. Known Penicillin allergy.`
10. Hover **Booking Summary** → click **Schedule Appointment**.

Expected result:
"Appointment scheduled successfully!" ("Cannot book an appointment in the past" → pick a later slot and re-take).

Narration:
[01:40–02:25] "Next, Priya books Rahul with the cardiologist, Dr. Amit Patil. Arogyix shows only the times the doctor is actually free, based on his working hours and existing bookings, so double-booking can't happen. The summary confirms the doctor, the time and the consultation fee before the booking is saved."

Highlight:
Cyan on Available Slots, then Booking Summary.

Pause:
1.5 s after the toast.

Next scene:
Sidebar **Dashboard**.

--------------------------------
SCENE 06
--------------------------------

Screen: Front Desk Dashboard → Patient Queue
Route: `/dashboard/receptionist`
Role: Receptionist

Before recording:
- ⚠️ **DO NOT CLICK "Check Out".** After Check In, **Check Out** appears next to **Collect** on Rahul's row. It would complete Rahul's visit from the desk and bypass the doctor's Complete Appointment and follow-up (rule 2). Keep the cursor away from it.

Actions:
1. Scroll to **Patient Queue & Schedule**.
2. Search box ("Search patient/doctor...") → `Rahul`.
3. Click **Check In** → "Appointment status updated successfully".
4. Click **Generate Bill** → "Invoice generated successfully!".
5. **Collect** appears on the row. **Don't click Check Out.**

Expected result:
Status In Progress; ₹800 invoice pending; Collect visible.

Narration:
[02:25–02:50] "When Rahul is ready to be seen, Priya checks him in. He now appears on Dr. Patil's list as waiting. With one more click she raises his bill, using the doctor's consultation fee. It stays pending until Rahul pays."

Highlight:
Cyan on the status badge (before/after), then Collect. Feature title **Check-in & Billing**.

Pause:
1.5 s after each toast.

Next scene:
**STOP. Record the Doctor video**, then return for Scene 07.

--------------------------------
SCENE 07
--------------------------------

Screen: Front Desk Dashboard
Route: `/dashboard/receptionist`
Role: Receptionist

Before recording:
- The Doctor video is done: prescription written **and** Complete Appointment clicked **by the doctor**.
- ⚠️ **DO NOT CLICK "Check Out".** Rahul's visit is already completed by the doctor. Click **Collect** only.

Actions:
1. Click **Refresh** (top right).
2. Search `Rahul`; point at **Completed**.
3. Click **Collect** → "Payment recorded successfully".
4. Scroll up; hover **Today's Revenue**.

Expected result:
Collect disappears; Today's Revenue +₹800.

Narration:
[02:50–03:10] "After his consultation, Rahul's visit shows as completed. He pays at the desk, and Priya records the payment. Today's revenue updates immediately, and the invoice is marked as paid."

Highlight:
Cyan on Today's Revenue.

Pause:
1.5 s on Today's Revenue.

Next scene:
Quick Actions **Billing Center**.

--------------------------------
SCENE 08
--------------------------------

Screen: Billing & Invoices
Route: `/dashboard/billing`
Role: Receptionist

Before recording:
- The download icon **saves** `<invoiceNo>.pdf`; it doesn't open a viewer. Downloads configured and tested in the `Reception` profile (Global setup). Download list cleared.

Actions:
1. Hover **Total Invoices Issued** and **Unpaid Bills Pending**.
2. Status filter → **Paid Only**.
3. Find Rahul Sharma's invoice.
4. Click the download icon on Rahul's invoice → click the file in the download bubble (it opens in a new Chrome tab) → show 2 s → close the tab.
5. Hover **Export** (clicking downloads a CSV).

Expected result:
Rahul's invoice under Paid Only; the PDF has the hospital's details.

Narration:
[03:10–03:35] "Every invoice is kept in Billing. Priya can filter by status or date, download a PDF receipt for the patient, or export the list for the accounts team."

Highlight:
Cyan on the status filter, then the download icon.

Pause:
2 s on the PDF.

Next scene:
Sidebar **Dashboard**.

--------------------------------
SCENE 09
--------------------------------

Screen: Front Desk Dashboard
Route: `/dashboard/receptionist`
Role: Receptionist

Before recording:
- None.

Actions:
1. Queue search `Rahul`.
2. Park the cursor on the right.

Expected result:
Rahul: Completed, paid.

Narration:
[03:35–03:50] "In a few minutes, Rahul was registered, booked, checked in and billed. Everything Priya entered is now available to the doctor, the pharmacy, and Rahul himself."

Highlight:
Cyan on Rahul's row. End card **Next: The Doctor's Consultation**.

Pause:
3 s.

Next scene:
End of video.

**11. Screen recording notes:** speed up 04 typing 2–3×. A 1 s "After the consultation…" card goes between 06 and 07.
**12. What to avoid:** ⚠️ **Check Out** on Rahul's row (never click it; the doctor completes the visit); **Cancel** on a queue row; the email/WhatsApp icons on invoices ("available soon"); mentioning cash/card/UPI at **Collect** (it asks for no method); opening the Timeline or other patients.
**13. Completion check:** Rahul registered · Temporary Password **written down** · APT-01 booked 11:30 · checked in · ₹800 invoice collected · password blurred.

---
---

# VIDEO 4 — DOCTOR

| | |
|---|---|
| **1. Video name** | Arogyix for Doctors (clip prefix `DOC`) |
| **2. Target duration** | 4:50 |
| **3. Login role** | Doctor — `amit.patil@example.com` / `Demo@12345` (first name must be **Amit**: heading reads "Dr. Amit's Dashboard") |
| **4. Starting URL** | `/login` |
| **5. Required demo data** | `DEMO_DATA.md` §4. It is **day D**. Rahul **checked in** (Receptionist 04–06). Catalog has Amlodipine 5mg, Atorvastatin 10mg, Pantoprazole 40mg. Wellness Pharmacy selectable. CarePlus link **Active** with Lipid Profile + KFT |
| **6. Pre-recording setup** | `DEMO_DATA.md` §4 open on screen 2 for copy-paste (notes, advice, lab note, chat). D+30 = **09-11-2026**, D+14 = **24-10-2026** (Saturday; Dr. Patil works Mon–Sat) |
| **7. Scene order** | 01 (edit) → 02 → … → 12, in one session on day D |
| **10. Voiceover reference** | `MASTER_VOICEOVER_SCRIPT.md` → "Doctor (4:50)" |

--------------------------------
SCENE 01
--------------------------------

Screen: Title card — **EDIT ONLY**
Route: none (blurred still of `/dashboard/doctor`)
Role: none

Before recording:
- Screenshot `/dashboard/doctor`.

Actions:
1. Nothing to record.

Expected result:
"Arogyix for Doctors" · *Review · Prescribe · Follow up*.

Narration:
[00:00–00:10] "Rahul is checked in and waiting. Now let's see the consultation from Dr. Amit Patil's side."

Highlight:
None.

Pause:
Hold 10 s.

Next scene:
Cross-fade to login.

--------------------------------
SCENE 02
--------------------------------

Screen: Login
Route: `/login` → `/dashboard/doctor`
Role: Doctor

Before recording:
- `DrPatil` profile signed out.

Actions:
1. **Email address** `amit.patil@example.com`.
2. Type the password.
3. Click **Sign In**.

Expected result:
"Dr. Amit's Dashboard".

Narration:
[00:10–00:22] "Dr. Patil signs in and lands on his own dashboard, showing only his patients."

Highlight:
**Sign In**. Lower-third **Dr. Amit Patil · Cardiologist**.

Pause:
1 s.

Next scene:
Stay on the dashboard.

--------------------------------
SCENE 03
--------------------------------

Screen: Doctor dashboard
Route: `/dashboard/doctor`
Role: Doctor

Before recording:
- None.

Actions:
1. Hover **Today's Appointments**, **Total Patients**, **Prescriptions Pending** (1 s each).
2. Hover Rahul's row in **Today's Schedule**. **Don't click** (the rows aren't links).

Expected result:
Rahul listed with his reason for visit.

Narration:
[00:22–00:45] "His dashboard shows today's appointments, his total patients, and visits that still need a prescription. Today's schedule lists each patient with their reason for visiting. Rahul is next."

Highlight:
Cyan on Rahul's row.

Pause:
1.5 s.

Next scene:
Sidebar **Appointments**.

--------------------------------
SCENE 04
--------------------------------

Screen: Appointments → Appointment Details
Route: `/dashboard/appointments` → `/dashboard/appointments/<id>`
Role: Doctor

Before recording:
- None.

Actions:
1. Search `Rahul`.
2. Click Rahul's row.
3. Pause on **Patient Registry Info** (**Allergies: Penicillin**).
4. Move to **Reason for Visit** and the front-desk notes.
5. Scroll to **Workflow Control**; point at the in-progress status.

Expected result:
Penicillin, reason, and In Progress visible.

Narration:
[00:45–01:20] "Before Rahul walks in, Dr. Patil opens the appointment. His penicillin allergy is shown up front, along with his blood group, his reason for visiting, and the notes from the front desk. He's already checked in, so the visit is in progress."

Highlight:
**Red** on Allergies; cyan on Reason for Visit. Feature title **Doctor Consultation**.

Pause:
2 s on Allergies.

Next scene:
Click **View Full File**.

--------------------------------
SCENE 05
--------------------------------

Screen: Patient file (Timeline tab is the default)
Route: `/dashboard/patients/<id>`
Role: Doctor

Before recording:
- None.

Actions:
1. Scroll the **Clinical History Timeline** slowly.
2. Click **Records & Care**. Pause 1.5 s.
3. Browser **Back** to Appointment Details.

Expected result:
Registration and appointment events on the timeline.

Narration:
[01:20–01:45] "Rahul's full file keeps his history in date order: visits, prescriptions, reports and lab results. Today he's new, so the record starts here, and it will grow with every visit."

Highlight:
Cyan on the timeline.

Pause:
1.5 s on Records & Care.

Next scene:
Back on Appointment Details.

--------------------------------
SCENE 06
--------------------------------

Screen: Appointment Details → notes
Route: `/dashboard/appointments/<id>`
Role: Doctor

Before recording:
- Notes text copied (`DEMO_DATA.md` §4).

Actions:
1. Click into **Clinical / Consultation Notes**.
2. Paste: `BP 152/96 mmHg, pulse 84/min, SpO₂ 98%. Heart sounds normal, no murmur. Resting ECG in clinic: normal sinus rhythm. Start antihypertensive and statin; lifestyle counselling given.`
3. Click **Save Notes** (it appears after the text changes).

Expected result:
"Clinical notes saved successfully".

Narration:
[01:45–02:05] "After examining Rahul, Dr. Patil records his findings. The notes stay attached to this visit."

Highlight:
Cyan on the notes box.

Pause:
1 s.

Next scene:
Click **Write Prescription**.

--------------------------------
SCENE 07
--------------------------------

Screen: Write New Prescription
Route: `/dashboard/prescriptions/new?appointmentId=<id>`
Role: Doctor

Before recording:
- None.

Actions:
1. Check **Prescribing Doctor** shows "Prescribing Self".
2. **Select Patient**: `Rahul` → **Rahul Sharma** (it isn't pre-filled from the appointment).
3. **Diagnosis / Assessment**: `Essential Hypertension (Stage 1) with borderline dyslipidemia`.
4. **Prescription Valid Until**: D+30 = **09-11-2026**.
5. **Add Oral Medicine** → type `Amlo` → pick **Amlodipine 5mg** from the suggestions. `1 tablet` · Once daily (OD) · `30 days` · After Food (PC) · `Take at the same time every morning`.
6. Add **Atorvastatin 10mg**: `1 tablet` · Before bed · `30 days` · After Food (PC).
7. Add **Pantoprazole 40mg**: `1 tablet` · Once daily (OD) · `14 days` · Before Food (AC) · `30 minutes before breakfast`.
8. Medicine 1 reminders: "Custom 24h Time" `08:30` → **Set**.
9. **General Notes / Patient Instructions**: paste the advice from §4.
10. **Send to Pharmacy**: **Wellness Pharmacy**.
11. Hover **Prescription Summary** → **Generate Prescription**.

Expected result:
"Prescription created and sent to Wellness Pharmacy!"; lands on the Prescriptions list.

Narration:
[02:05–03:15] "Now the prescription. Medicines come up as suggestions from the hospital's own catalog, with the usual dosage and timing filled in, so prescribing is quick and consistent. Arogyix schedules reminder times for Rahul automatically, and the doctor can add his own. Finally, he sends the prescription straight to Wellness Pharmacy, the hospital's partner pharmacy, and generates it."

Highlight:
Cyan on the suggestion dropdown → Medicine Reminders → Send to Pharmacy. Feature title **Digital Prescription**.

Pause:
1 s on the pharmacy choice; 1.5 s after the toast.

Next scene:
Already on `/dashboard/prescriptions`.

--------------------------------
SCENE 08
--------------------------------

Screen: Prescriptions list
Route: `/dashboard/prescriptions`
Role: Doctor

Before recording:
- **PDF** **downloads** `prescription-<id>.pdf`; it doesn't open a viewer. Downloads configured and tested in the `DrPatil` profile (Global setup). Download list cleared.

Actions:
1. Hover "Sent to Wellness Pharmacy" on Rahul's card.
2. Click **PDF**.
3. Click the file in the download bubble (it opens in a new Chrome tab) → show 3 s → close the tab.

Expected result:
PDF with the hospital branding and the three medicines.

Narration:
[03:15–03:30] "The prescription is ready as a branded PDF. Rahul can see it in his patient portal, and the pharmacy already has it."

Highlight:
Cyan on "Sent to Wellness Pharmacy".

Pause:
3 s on the PDF.

Next scene:
Sidebar **Appointments** → Rahul's appointment.

--------------------------------
SCENE 09
--------------------------------

Screen: Appointment Details → Workflow Control
Route: `/dashboard/appointments/<id>`
Role: Doctor

Before recording:
- The prescription exists (Scene 07). Completion works **only on day D** and **only once**.

Actions:
1. Point at **Prescribed Medications**.
2. Click **Complete Appointment** → "Appointment status updated successfully".
3. The **Schedule Follow-up** form opens by itself.
4. Pick date **D+14 = 24-10-2026** (Saturday).
5. "Follow-up advice/notes": `Review BP log and lipid report.`
6. Click **Schedule**.

Expected result:
Status Completed; **Scheduled Follow-up** shows 24-10-2026.

Narration:
[03:30–03:55] "Dr. Patil completes the visit. Arogyix only allows this once a prescription is written, so nothing is missed. He sets a follow-up for two weeks. If Rahul doesn't book it, he'll appear on the hospital's missed follow-up list."

Highlight:
Cyan on Completed, then Scheduled Follow-up.

Pause:
1.5 s on Scheduled Follow-up.

Next scene:
Sidebar **Lab Orders**.

--------------------------------
SCENE 10
--------------------------------

Screen: Lab Orders → New Lab Order
Route: `/dashboard/pathology-orders` → `/dashboard/pathology-orders/new`
Role: Doctor

Before recording:
- None.

Actions:
1. Click **New Order**.
2. Lab **CarePlus Diagnostics**.
3. Patient **Rahul Sharma**.
4. Tick **Lipid Profile** and **Kidney Function Test (KFT)**.
5. **Collection Type**: Walk-in.
6. **Referring Doctor**: Dr. Amit Patil.
7. Notes: `Collect sample today after consultation`.
8. Click **Place Order**.

Expected result:
"Lab order placed"; order listed.

Narration:
[03:55–04:20] "To check his cholesterol and kidney function, Dr. Patil orders two tests from CarePlus Diagnostics, the hospital's partner lab. The lab receives the order straight away."

Highlight:
Cyan on the ticked tests and the total.

Pause:
1 s.

Next scene:
Sidebar **Chat**.

--------------------------------
SCENE 11
--------------------------------

Screen: Chat
Route: `/dashboard/chat`
Role: Doctor

Before recording:
- Status shows **Connected** (not "Connecting…").

Actions:
1. Click **New** → **Message a Patient**.
2. Search `Rahul` → Rahul Sharma.
3. Paste and send: `Hello Rahul, please give your blood sample at CarePlus Diagnostics today, and bring your BP log to your follow-up visit.`

Expected result:
Message bubble appears.

Narration:
[04:20–04:35] "And if Rahul needs a reminder or has a question, doctor and patient can message each other directly."

Highlight:
Cyan on the sent message.

Pause:
1.5 s.

Next scene:
Sidebar **Dashboard**.

--------------------------------
SCENE 12
--------------------------------

Screen: Doctor dashboard
Route: `/dashboard/doctor`
Role: Doctor

Before recording:
- None.

Actions:
1. Wait for load. Park the cursor.

Expected result:
Dashboard reflects the completed visit.

Narration:
[04:35–04:50] "One consultation: history reviewed, prescription sent to the pharmacy, tests ordered and a follow-up planned. The pharmacy and the lab can now take over."

Highlight:
None. End card **Next: The Pharmacy**.

Pause:
3 s.

Next scene:
End of video. **Now go back to Receptionist Scene 07.**

**11. Screen recording notes:** speed up 07 steps 5–9 to 2×, but keep medicine 1 and Send to Pharmacy at normal speed. Pick medicines **from the suggestions** so names match the pharmacy catalog exactly.
**12. What to avoid:** **Cancel Appointment**, **No Show**. "Please write a prescription…" toast = steps done out of order.
**13. Completion check:** notes saved · RX-01 sent to Wellness · visit Completed · follow-up 24-10-2026 · lab order placed · chat sent.

---
---

# VIDEO 5 — PHARMACY

| | |
|---|---|
| **1. Video name** | Arogyix for Pharmacies (clip prefix `PHA`) |
| **2. Target duration** | 3:55 |
| **3. Login role** | Pharmacy — `wellness.pharmacy@example.com` / `Demo@12345` |
| **4. Starting URL** | `/login` |
| **5. Required demo data** | `DEMO_DATA.md` §5. Supplier, 6 catalog items, opening stock. **Rahul's prescription in Pending** with all three medicines matched (no "Select medicine…" dropdowns). Atorvastatin Low Stock; Cetirizine (CTZ-2511-E, expiry **25-10-2026**) Expiring Soon |
| **6. Pre-recording setup** | **Dispense Qty is `1` for each medicine** (finding #1 resolved). Dispensing can't be redone without a reset |
| **7. Scene order** | 01 (edit) → 02 → … → 09 |
| **10. Voiceover reference** | `MASTER_VOICEOVER_SCRIPT.md` → "Pharmacy (3:55)" |

--------------------------------
SCENE 01
--------------------------------

Screen: Title card — **EDIT ONLY**
Route: none (blurred still of `/dashboard/pharmacy-portal`)
Role: none

Before recording:
- Screenshot `/dashboard/pharmacy-portal`.

Actions:
1. Nothing to record.

Expected result:
"Arogyix for Pharmacies" · *Prescriptions · Stock · Counter sales*.

Narration:
[00:00–00:10] "Dr. Patil has sent Rahul's prescription to Wellness Pharmacy. Here's what happens next."

Highlight:
None.

Pause:
Hold 10 s.

Next scene:
Cross-fade to login.

--------------------------------
SCENE 02
--------------------------------

Screen: Login
Route: `/login` → `/dashboard/pharmacy-portal`
Role: Pharmacy

Before recording:
- `Pharmacy` profile signed out.

Actions:
1. **Email address** `wellness.pharmacy@example.com`.
2. Type the password.
3. Click **Sign In**.

Expected result:
**My Pharmacy** dashboard.

Narration:
[00:10–00:20] "Suresh, the pharmacist, signs in to his own pharmacy workspace."

Highlight:
**Sign In**. Lower-third **Suresh Kale · Wellness Pharmacy**.

Pause:
1 s.

Next scene:
Stay on the dashboard.

--------------------------------
SCENE 03
--------------------------------

Screen: My Pharmacy
Route: `/dashboard/pharmacy-portal`
Role: Pharmacy

Before recording:
- None.

Actions:
1. Hover **Low Stock**, **Expiring Soon**, **Pending Rx**, **Today's Sales** (1 s each).
2. Park on **Pending Rx**.

Expected result:
Low Stock ≥ 1 (Atorvastatin), Expiring Soon ≥ 1 (Cetirizine CTZ-2511-E, expiry 25-10-2026), Pending Rx = 1.

Narration:
[00:20–00:45] "His dashboard shows what needs attention: medicines running low, batches close to expiry, and prescriptions waiting from the hospital. One new prescription has just arrived."

Highlight:
Cyan on the 4 cards; stronger on Pending Rx.

Pause:
1.5 s on Pending Rx.

Next scene:
Sidebar **Rx Queue**.

--------------------------------
SCENE 04
--------------------------------

Screen: Rx Queue → prescription detail
Route: `/dashboard/pharmacy-portal/prescriptions` → `/dashboard/pharmacy-portal/prescriptions/<id>`
Role: Pharmacy

Before recording:
- The **Catalog Medicine** column only appears when an item is unmatched. With all three matched (the required state) it won't be on screen. That's expected; don't wait for it.

Actions:
1. **Pending** tab → point at Rahul's row.
2. Click to open.
3. Pause on **Diagnosis**, **Advice**, and the **Items** table (Medicine, Dosage, Qty, Remaining).
4. Click **Verify Prescription**.

Expected result:
"Prescription verified"; status VERIFIED.

Narration:
[00:45–01:25] "Rahul's prescription is already here. No paper, no guessing at handwriting. Suresh sees the diagnosis, the doctor's advice, and each medicine, already matched to his own catalog. He checks it and verifies it."

Highlight:
Cyan on the Items table. Feature title **Pharmacy Management**.

Pause:
2 s on Items before verifying; 1 s after the toast.

Next scene:
Stay on the page.

--------------------------------
SCENE 05
--------------------------------

Screen: Prescription detail (Verified)
Route: `/dashboard/pharmacy-portal/prescriptions/<id>`
Role: Pharmacy

Before recording:
- Each item shows **Qty 1 / Remaining 1** (the pharmacy receives every forwarded item with quantity 1).
- **Enter `1` for each medicine.** Never 30 / 30 / 14: that leaves Remaining −29 / −29 / −13 and can't be undone without a reset.

Actions:
1. **Dispense Qty**: Amlodipine `1`, Atorvastatin `1`, Pantoprazole `1`.
2. Click **Dispense Selected Items** → "Prescription dispensed".
3. Back to the Rx Queue → **Dispensed** tab → Rahul's row.

Expected result:
Remaining **0** on every row; status DISPENSED; row in the Dispensed tab.

Narration:
[01:25–01:55] "He enters the quantities and dispenses. Arogyix takes stock from the batch that expires first, and updates the inventory instantly. If only part of a prescription can be supplied today, it waits in Partially Dispensed until the rest is collected."

Highlight:
Cyan on Dispense Qty, then the status badge. No zoom on the Qty column.

Pause:
1.5 s after the toast.

Next scene:
Sidebar **Inventory**.

--------------------------------
SCENE 06
--------------------------------

Screen: Inventory
Route: `/dashboard/pharmacy-portal/inventory`
Role: Pharmacy

Before recording:
- None.

Actions:
1. **Batches** tab: pause 2 s.
2. **Low Stock** → point at Atorvastatin 10mg.
3. **Expiry** → point at batch **CTZ-2511-E** (expiry 25-10-2026).
4. **Stock Ledger** → point at the three dispense rows.

Expected result:
All three visible.

Narration:
[01:55–02:35] "Stock is tracked by batch, with expiry dates and prices. Low Stock shows what needs reordering. Expiry flags batches before they go out of date. And the stock ledger records every movement, so every tablet can be traced."

Highlight:
Cyan on each row.

Pause:
1 s per tab.

Next scene:
Sidebar **Sales**.

--------------------------------
SCENE 07
--------------------------------

Screen: Sales → New Sale (POS)
Route: `/dashboard/pharmacy-portal/sales`
Role: Pharmacy

Before recording:
- None.

Actions:
1. Click **New Sale**.
2. Beside the customer search, **+ New** → `Vikram Joshi`, `9800000501` → **Add & Select**.
3. "Search medicine to add to cart..." → `Parac` → **Paracetamol 500mg**, Qty `10`.
4. `Cetir` → batch **CTZ-2511-E**, Qty `10`.
5. **Payments**: method **UPI** → **Fill Full Balance**.
6. "Reference No. (optional)" `UPI-DEMO-78421`.
7. Click **Complete Sale**.
8. In the list, click the print icon on the new sale; show 2 s; close.

Expected result:
"Customer added and selected" → "Sale completed"; the invoice prints.

Narration:
[02:35–03:20] "Walk-in customers are billed at the counter. Suresh adds the customer, picks the medicines, and Arogyix shows only batches that are in stock, with prices and GST filled in. The customer pays by UPI, and the invoice is ready to print."

Highlight:
Cyan on the cart batch, then the total and Complete Sale. Feature title **Counter Sales**.

Pause:
1.5 s after "Sale completed"; 2 s on the print.

Next scene:
Sidebar **Reports**.

--------------------------------
SCENE 08
--------------------------------

Screen: Reports → Sales
Route: `/dashboard/pharmacy-portal/reports`
Role: Pharmacy

Before recording:
- None.

Actions:
1. **Sales** tab: **From** / **To** = today.
2. Hover **Total Revenue**, **Payment Collected**.
3. **Purchases**, then **Supplier History** (1 s each).
4. Hover **CSV** and **PDF**.

Expected result:
Totals include Vikram Joshi's sale.

Narration:
[03:20–03:40] "Reports show revenue, collections, tax and purchases, by month or by supplier, ready to export for the accountant."

Highlight:
Cyan on the summary cards, then CSV/PDF.

Pause:
1 s per tab.

Next scene:
Sidebar **My Pharmacy**.

--------------------------------
SCENE 09
--------------------------------

Screen: My Pharmacy
Route: `/dashboard/pharmacy-portal`
Role: Pharmacy

Before recording:
- None.

Actions:
1. Wait for load. Park the cursor.

Expected result:
**Pending Rx = 0**.

Narration:
[03:40–03:55] "Rahul's medicines are ready, stock is accurate to the batch, and the pharmacy's books are up to date."

Highlight:
Cyan on Pending Rx (0). End card **Next: The Diagnostic Lab**.

Pause:
3 s.

Next scene:
End of video.

**11. Screen recording notes:** speed up 07 steps 2–4 to 2×. Dispensing is one-shot, so rehearse the page layout first (open and look without clicking).
**12. What to avoid:** **Cancel Sale**, **Adjust Stock** submit, **Edit Details**; typing a payment amount above the balance (use Fill Full Balance); ringing up Rahul's medicines in the POS (double deduction); saying dispensing creates a bill.
**13. Completion check:** RX-01 Dispensed · ledger rows visible · SALE-01 complete · Pending Rx 0 · ⚠️ Remaining values look sensible.

---
---

# VIDEO 6 — PATHOLOGY LAB

| | |
|---|---|
| **1. Video name** | Arogyix for Diagnostic Labs (clip prefix `LAB`) |
| **2. Target duration** | 3:45 |
| **3. Login role** | Pathology — `careplus.lab@example.com` / `Demo@12345` |
| **4. Starting URL** | `/login` |
| **5. Required demo data** | `DEMO_DATA.md` §4 (result values), §6. Link to the hospital **Active**. Test catalog imported. Collector Sachin More. **Rahul's order in the Active tab** (Doctor 10) |
| **6. Pre-recording setup** | Result tables (5 lipid rows, 6 KFT rows) on screen 2. Every row needs a value or saving fails |
| **7. Scene order** | 01 (edit) → 02 → … → 09 |
| **10. Voiceover reference** | `MASTER_VOICEOVER_SCRIPT.md` → "Diagnostic Lab (3:45)" |

--------------------------------
SCENE 01
--------------------------------

Screen: Title card — **EDIT ONLY**
Route: none (blurred still of `/dashboard/pathology-portal`)
Role: none

Before recording:
- Screenshot `/dashboard/pathology-portal`.

Actions:
1. Nothing to record.

Expected result:
"Arogyix for Diagnostic Labs" · *Samples · Results · Verified reports*.

Narration:
[00:00–00:10] "Dr. Patil has ordered blood tests for Rahul. Let's follow them through CarePlus Diagnostics."

Highlight:
None.

Pause:
Hold 10 s.

Next scene:
Cross-fade to login.

--------------------------------
SCENE 02
--------------------------------

Screen: Login
Route: `/login` → `/dashboard/pathology-portal`
Role: Pathology

Before recording:
- `Lab` profile signed out.

Actions:
1. **Email address** `careplus.lab@example.com`.
2. Type the password.
3. Click **Sign In**.

Expected result:
**My Lab** dashboard.

Narration:
[00:10–00:20] "Dr. Anita Menon, the lab's pathologist, signs in to the lab's own workspace."

Highlight:
**Sign In**. Lower-third **Dr. Anita Menon · CarePlus Diagnostics**.

Pause:
1 s.

Next scene:
Stay on the dashboard.

--------------------------------
SCENE 03
--------------------------------

Screen: My Lab
Route: `/dashboard/pathology-portal`
Role: Pathology

Before recording:
- None.

Actions:
1. Hover **Orders & Samples** (2 s).
2. Hover **Reports & Verification** (2 s), pausing on **Pending Verification**.
3. Scroll to **Pending Work**.

Expected result:
Counts shown; Rahul's order in Pending Work.

Narration:
[00:20–00:45] "The dashboard is organised the way a lab works: new orders and samples, results waiting for sign-off, critical values, and turnaround time. Pending Work shows exactly what needs attention next."

Highlight:
Cyan on each group, then Pending Work.

Pause:
1 s on Pending Work.

Next scene:
Sidebar **Orders**.

--------------------------------
SCENE 04
--------------------------------

Screen: Orders → order detail
Route: `/dashboard/pathology-portal/orders` → `/dashboard/pathology-portal/orders/<id>`
Role: Pathology

Before recording:
- None.

Actions:
1. **Active** tab → point at Rahul's order (from Arogyix Multispeciality Hospital).
2. Click to open.
3. Pause on the patient, hospital, doctor and both tests.

Expected result:
Rahul, both tests, and the **Timeline** visible.

Narration:
[00:45–01:05] "Dr. Patil's order is already here, with the patient's details and both tests. There's no paper slip to lose or re-type."

Highlight:
Cyan on the tests. Feature title **Lab Workflow**.

Pause:
1.5 s on the header.

Next scene:
Stay on the page.

--------------------------------
SCENE 05
--------------------------------

Screen: Order detail → Register Sample Collection
Route: `/dashboard/pathology-portal/orders/<id>`
Role: Pathology

Before recording:
- None.

Actions:
1. **Sample Type** Blood · **Container** (free text) `SST (gold top)`.
2. **Mark Collected — Assign Sample ID** → "Sample registered as collected".
3. **Receive at Lab** → "Sample received at lab".
4. Hover **Reject Sample**. Don't click.
5. **Accept Sample** → "Sample accepted for processing".
6. **Start Processing** → "Processing started".

Expected result:
Sample ID shown; the Timeline records each step.

Narration:
[01:05–01:45] "When Rahul's blood is drawn, the sample gets its own ID, so it can be tracked at every step. It's received at the lab and accepted. If a sample isn't usable, it can be rejected with a reason and a recollection requested. Then processing starts."

Highlight:
Cyan on the Sample ID, then the Timeline.

Pause:
~1 s after each toast.

Next scene:
Scroll to **Tests**.

--------------------------------
SCENE 06
--------------------------------

Screen: Tests → result editor
Route: `/dashboard/pathology-portal/orders/<id>`
Role: Pathology

Before recording:
- Every Flag dropdown starts at **Normal**. Choose High by hand.

Actions:
1. **Lipid Profile** → **Enter Results**. Fill every row:
   Total Cholesterol `228` **High** · Triglycerides `176` **High** · HDL Cholesterol `42` Normal · LDL Cholesterol `148` **High** · VLDL `35` Normal.
   (If the rows aren't pre-filled: **Add Row** per parameter.)
2. Point at the note "…auto-flagged CRITICAL on save…".
3. **Save Results** → "Results saved".
4. **Kidney Function Test (KFT)** → **Enter Results**, all Normal: Blood Urea `28` · Serum Creatinine `0.9` · Uric Acid `5.6` · Sodium `139` · Potassium `4.2` · Chloride `102` → **Save Results**.
5. **Submit for Verification** → "Submitted for pathologist verification".

Expected result:
High badges on Total Cholesterol, LDL and Triglycerides.

Narration:
[01:45–02:30] "Results are entered against each test, with units and reference ranges. Values above the normal range are marked high, and anything in the critical range is flagged critical automatically, so it can't be missed. The results then go to the pathologist for sign-off."

Highlight:
Cyan on the Flag column. Red only if a Critical flag appears.

Pause:
2 s on the saved flags.

Next scene:
Stay on the page.

--------------------------------
SCENE 07
--------------------------------

Screen: Review & Verify preview
Route: `/dashboard/pathology-portal/orders/<id>`
Role: Pathology

Before recording:
- None.

Actions:
1. Click **Review & Verify**.
2. Scroll the preview 3 s.
3. Tick **I have reviewed the results** (Confirm stays disabled until you do).
4. **Confirm & Verify** → "Report verified".

Expected result:
Status Verified.

Narration:
[02:30–02:55] "Dr. Menon previews the report exactly as it will be issued, confirms she has reviewed it, and verifies it. Nothing leaves the lab without a pathologist's sign-off."

Highlight:
Cyan on the preview, then Confirm & Verify.

Pause:
1 s.

Next scene:
Stay on the page.

--------------------------------
SCENE 08
--------------------------------

Screen: Order detail (Verified)
Route: `/dashboard/pathology-portal/orders/<id>`
Role: Pathology

Before recording:
- **Download** opens the report in a **new tab**. Close it afterwards so you're back to one tab.

Actions:
1. **Deliver Report** → "Report delivered".
2. **Download** → show the PDF 2 s → close the tab.

Expected result:
Delivered; PDF with CarePlus branding and Rahul's results.

Narration:
[02:55–03:20] "With one click the report is delivered. It goes straight into Rahul's hospital record and timeline, and both Rahul and Dr. Patil are notified."

Highlight:
Cyan on Deliver Report. Caption *Delivered to Rahul's hospital record*.

Pause:
2 s on the PDF.

Next scene:
Sidebar **Lab Reports**.

--------------------------------
SCENE 09
--------------------------------

Screen: Lab Reports
Route: `/dashboard/pathology-portal/reports`
Role: Pathology

Before recording:
- None.

Actions:
1. **From** / **To** = this month.
2. Hover **Total Revenue** and **Hospital-linked Revenue** (and the walk-in figure).
3. Park the cursor.

Expected result:
This month's orders and revenue.

Narration:
[03:20–03:45] "Lab Reports show order volume, revenue from hospital and walk-in orders, and turnaround times. Orders arrive digitally, every sample is traceable, and verified results reach the doctor and patient the same day."

Highlight:
Cyan on the revenue cards. End card **Next: The Patient's View**.

Pause:
3 s.

Next scene:
End of video.

**11. Screen recording notes:** speed up 05 steps 3–6 to 1.5× and 06 typing to 2×.
**12. What to avoid:** **Reject Sample**, **Cancel**, amend; saying High/Low is automatic. "Every result row needs a parameter name and value" = an empty row.
**13. Completion check:** LR-01 delivered · 3 High flags visible · PDF shown · tab count back to one.

---
---

# VIDEO 7 — PATIENT

| | |
|---|---|
| **1. Video name** | Arogyix for Patients (clip prefix `PAT`) |
| **2. Target duration** | 3:00 |
| **3. Login role** | Patient — `rahul.sharma@example.com` / Temporary Password from Receptionist 04 |
| **4. Starting URL** | `/login` |
| **5. Required demo data** | Rahul has: RX-01; paid ₹800 invoice; **pending ₹300 "Resting ECG"** invoice (created off camera); **delivered** CarePlus report; Dr. Patil's chat message |
| **6. Pre-recording setup** | Create the ₹300 invoice (see `QUICK_RECORDING_ORDER.md` block 7). Know whether Razorpay test keys are set. D+14 = **24-10-2026** (Saturday). Record **early enough** that some medicine reminders are still due today |
| **7. Scene order** | 01 (edit) → 02 → … → 09 |
| **10. Voiceover reference** | `MASTER_VOICEOVER_SCRIPT.md` → "Patient (3:00)" |

--------------------------------
SCENE 01
--------------------------------

Screen: Title card — **EDIT ONLY**
Route: none (blurred still of `/dashboard/patient`)
Role: none

Before recording:
- Screenshot `/dashboard/patient`.

Actions:
1. Nothing to record.

Expected result:
"Arogyix for Patients".

Narration:
[00:00–00:08] "Rahul is home. Everything from his visit is waiting for him in the patient portal."

Highlight:
None.

Pause:
Hold 8 s.

Next scene:
Cross-fade to login.

--------------------------------
SCENE 02
--------------------------------

Screen: Login
Route: `/login` → `/dashboard/patient`
Role: Patient

Before recording:
- `PatientRahul` profile signed out.

Actions:
1. **Email address** `rahul.sharma@example.com`.
2. Type the temporary password.
3. Click **Sign In**.

Expected result:
"Hello, Rahul! 👋".

Narration:
[00:08–00:20] "He signs in with the login the front desk gave him. Patients can also sign up themselves by choosing their hospital."

Highlight:
**Sign In**. Lower-third **Rahul Sharma · Patient**.

Pause:
1 s.

Next scene:
Stay on the dashboard.

--------------------------------
SCENE 03
--------------------------------

Screen: Patient dashboard
Route: `/dashboard/patient`
Role: Patient

Before recording:
- If **Medicines Due** says "No medicines due", drop "the medicines due next" from the line.

Actions:
1. Hover **Upcoming Appointments**.
2. Hover **Medicines Due**.
3. Hover **Recent Prescriptions**.
4. Hover **Amount Due** (₹300) and **Pay Now**. Don't click.
5. Hover **Recent Reports**.

Expected result:
Upcoming doses listed; Amount Due ₹300.

Narration:
[00:20–00:45] "His dashboard shows the medicines due next, with times, his latest prescription, any amount still to pay, and his most recent reports."

Highlight:
Cyan on Medicines Due, then Amount Due.

Pause:
1.5 s on Medicines Due.

Next scene:
Sidebar **Prescriptions**.

--------------------------------
SCENE 04
--------------------------------

Screen: My Prescriptions
Route: `/dashboard/prescriptions`
Role: Patient

Before recording:
- **PDF** downloads the file; it doesn't open a viewer (same as Doctor 08). Downloads configured and tested in the `PatientRahul` profile (Global setup). Download list cleared.

Actions:
1. Pause on Dr. Patil's card (diagnosis, medicines, "Sent to Wellness Pharmacy").
2. Click **PDF**.
3. Click the file in the download bubble (it opens in a new Chrome tab) → show 3 s → close the tab.

Expected result:
PDF with the hospital branding and three medicines.

Narration:
[00:45–01:10] "His prescription is here, with each medicine's dose, timing and duration, and the pharmacy it was sent to. He can download it any time. No more lost paper."

Highlight:
Cyan on the medicine list, then PDF.

Pause:
3 s on the PDF.

Next scene:
Sidebar **Reports**.

--------------------------------
SCENE 05
--------------------------------

Screen: Report Repository
Route: `/dashboard/reports`
Role: Patient

Before recording:
- The download icon opens the file in a **new tab**. Close it afterwards.

Actions:
1. Point at "Lab Report — LAB-<year>-…".
2. Click its download icon; show 2 s; close the tab.

Expected result:
Report with High flags.

Narration:
[01:10–01:35] "His blood test results are already here. The lab delivered them straight into his record, and he was notified. He can also upload older reports so his doctor can see them."

Highlight:
Cyan on the lab report card.

Pause:
2 s on the report.

Next scene:
Sidebar **Billing**.

--------------------------------
SCENE 06
--------------------------------

Screen: My Billing
Route: `/dashboard/billing`
Role: Patient

Before recording:
- Razorpay test keys set? Yes → steps 1–5. No → steps 1–4 and 6, with the alternative line.

Actions:
1. Hover **Amount Due**, **Total Paid**, **Total Invoices**.
2. Point at the paid ₹800 invoice.
3. On the ₹300 "Resting ECG" invoice, click **Pay Now**.
4. "Choose a payment method" → **UPI**.
5. (Keys set) **Proceed to Payment** → finish the Razorpay test flow → "Payment successful!".
6. (No keys) Close the dialog.

Expected result:
₹300 paid (with keys).

Narration:
[01:35–02:05] "All his invoices are in one place. The consultation was paid at the desk. For the ECG, he pays online by UPI, card, net banking or wallet, and the invoice is marked paid automatically."
Alt (no Razorpay): "All his invoices are in one place. Anything still due can be paid online by UPI, card, net banking or wallet."

Highlight:
Cyan on the payment methods.

Pause:
1.5 s after "Payment successful!".

Next scene:
Sidebar **Appointments**.

--------------------------------
SCENE 07
--------------------------------

Screen: Schedule New Appointment
Route: `/dashboard/appointments` → `/dashboard/appointments/new`
Role: Patient

Before recording:
- D+14 = **24-10-2026**, a Saturday. Dr. Patil has Saturday ticked (Mon–Sat), so slots appear.

Actions:
1. Click **New Appointment**.
2. Check that the patient shows **Your Profile**.
3. **Doctor / Specialist**: `Amit` → Dr. Amit Patil.
4. **Appointment Date**: D+14 = **24-10-2026**.
5. **Available Slots**: the first free slot.
6. **Appointment Type**: Follow Up Visit.
7. **Reason for Visit**: `Two-week BP review`.
8. **Schedule Appointment**.

Expected result:
"Appointment scheduled successfully!"

Narration:
[02:05–02:35] "Dr. Patil asked to see him in two weeks. Rahul books the review himself, choosing from the doctor's free times. The hospital sees the booking straight away."

Highlight:
Cyan on Available Slots.

Pause:
1.5 s after the toast.

Next scene:
Sidebar **Chat**.

--------------------------------
SCENE 08
--------------------------------

Screen: Chat
Route: `/dashboard/chat`
Role: Patient

Before recording:
- Shows Connected.

Actions:
1. Open the conversation with **Dr. Amit Patil**.
2. Point at his message.
3. Send: `Thank you, Doctor. Can I take Amlodipine with my morning tea?`

Expected result:
Reply under Dr. Patil's message.

Narration:
[02:35–02:50] "And if he has a question about his medicines, he can message Dr. Patil directly."

Highlight:
Cyan on the conversation.

Pause:
1.5 s.

Next scene:
Sidebar **Dashboard**.

--------------------------------
SCENE 09
--------------------------------

Screen: Patient dashboard
Route: `/dashboard/patient`
Role: Patient

Before recording:
- None.

Actions:
1. Wait for load. Park the cursor.

Expected result:
Upcoming Appointments shows 24-10-2026.

Narration:
[02:50–03:00] "Prescriptions, results, bills and his doctor, all in one place."

Highlight:
Cyan on the new appointment. End card **Arogyix — connected care**.

Pause:
3 s.

Next scene:
End of video.

**11. Screen recording notes:** Razorpay test mode only; never show a real card or UPI ID.
**12. What to avoid:** **Cancel** on appointments; the **delete** icon on report cards (it's visible to patients); a 503 on Pay Now (no keys) left in the cut.
**13. Completion check:** PDF shown · lab report shown · ₹300 paid or alt line used · APT-02 booked · chat reply sent.

---
---

# VIDEO 8 — MASTER PRODUCT DEMO

| | |
|---|---|
| **1. Video name** | Arogyix — One Patient, One Connected Hospital (clip prefix `MST`) |
| **2. Target duration** | 6:30 |
| **3. Login role** | Mostly re-used role footage. New clips: logged-out (MST-01), Hospital Admin (MST-02, MST-10) |
| **4. Starting URL** | MST-01: `/`. MST-02 / MST-10: `/dashboard/hospital`, `/dashboard/analytics` |
| **5. Required demo data** | MST-02 and MST-01: prepared demo data only (warm-up history, Missed Follow-ups shows Sunita Rao, **no Rahul yet**). MST-10: all role takes done. Editing: all role takes labelled by clip ID |
| **6. Pre-recording setup** | **This is the first video recorded on Sat 10-10-2026:** MST-02 is the first take of the day (08:40). Record only **MST-01, MST-02, MST-10**. MST-11 is built in the editor. Hide the cursor for the first and last ½ s of every clip so cuts don't jump |
| **7. Scene order** | Record: **MST-02 (first take of D, 08:40)** → MST-01 (straight after) → MST-10 (end of day). Edit: 01 → 11 |
| **10. Voiceover reference** | `MASTER_VOICEOVER_SCRIPT.md` → "Product Demo (6:30)" |

--------------------------------
SCENE 01
--------------------------------

Screen: Landing page hero → **Built for every role** — **NEW CLIP MST-01**
Route: `/`
Role: none (logged out)

Before recording:
- Clean logged-out profile; no pop-ups.

Actions:
1. Open `/`. Hold on the hero ("Healthcare management made simple.") 3 s.
2. Scroll ~600 px over 8 s to **Built for every role**.
3. Stop and hold.

Expected result:
Hero, then Built for every role.

Narration:
[00:00–00:20] "Arogyix is a hospital management platform that connects everyone involved in a patient's care: the front desk, the doctor, the pharmacy, the lab, and the patient. Let's follow one patient, Rahul Sharma, through a single hospital visit."

Highlight:
Cursor hidden. Title **Arogyix** · *Connected hospital management*. Disclaimer 4 s.

Pause:
2 s on Built for every role.

Next scene:
Cross-fade 0.8 s.

--------------------------------
SCENE 02
--------------------------------

Screen: Hospital Dashboard — **NEW CLIP MST-02** (or reuse ADM-03)
Route: `/dashboard/hospital`
Role: Hospital Admin

Before recording:
- **First take of the recording day**, 08:40 on Sat 10-10-2026, before any other take and before Rahul is registered.
- `Admin` profile signed in, zoom 110%, download list cleared, notifications off, dev tools closed.
- Missed Follow-ups shows Sunita Rao (warm-up data).
- After the take, **sign the `Admin` profile out**, so Admin Scene 02 starts on `/login`.

Actions:
1. Hover **Today's Appointments**, **Total Patients**, **Active Doctors**, **Today's Revenue**.
2. Scroll slightly to **Today's Appointment Status**.

Expected result:
All cards show numbers.

Narration:
[00:20–00:40] "It's morning at Arogyix Multispeciality Hospital. The administrator, Meera, can see today's appointments, patients, doctors on duty and revenue in one place."

Highlight:
Cyan on the 4 cards. Lower-third **Meera Joshi · Hospital Administrator**.

Pause:
1 s on the cards.

Next scene:
Hard cut, lower-third → receptionist.

--------------------------------
SCENE 03
--------------------------------

Screen: Register New Patient — **REUSE REC-04**
Route: `/dashboard/patients/new`
Role: Receptionist

Before recording:
- Nothing new. REC-04 must include the Penicillin chip and the Patient Registered! modal.

Actions:
1. Use REC-04 (registration → modal → Done & Close).

Expected result:
Patient Registered! modal.

Narration:
[00:40–01:20] "Rahul arrives at the front desk. Priya, the receptionist, registers him, including his penicillin allergy and high blood pressure. Arogyix creates his patient record and his own login for the patient portal."

Highlight:
**Red** on Penicillin; cyan on the credentials. **Blur the password.** Typing at 3×.

Pause:
1.5 s on the modal.

Next scene:
Hard cut.

--------------------------------
SCENE 04
--------------------------------

Screen: Booking, then queue — **REUSE REC-05, REC-06**
Route: `/dashboard/appointments/new`, `/dashboard/receptionist`
Role: Receptionist

Before recording:
- Nothing new.

Actions:
1. REC-05: slot 11:30 → Schedule Appointment.
2. REC-06: Check In → Generate Bill. (⚠️ Never Check Out.)

Expected result:
Booked; checked in; Collect visible.

Narration:
[01:20–01:55] "She books him with the cardiologist, Dr. Amit Patil. Only genuinely free times are offered, so there's no double-booking. When Rahul is ready, he's checked in, and his bill is raised from the doctor's consultation fee."

Highlight:
Cyan on Available Slots, then the queue row. Feature title **Appointment Management**.

Pause:
1 s after each toast.

Next scene:
Hard cut, lower-third → doctor.

--------------------------------
SCENE 05
--------------------------------

Screen: Appointment Details, patient file — **REUSE DOC-04, DOC-05, DOC-06**
Route: `/dashboard/appointments/<id>`, `/dashboard/patients/<id>`
Role: Doctor

Before recording:
- Nothing new.

Actions:
1. Allergy close-up (DOC-04), timeline (DOC-05), Save Notes (DOC-06).

Expected result:
"Clinical notes saved successfully".

Narration:
[01:55–02:35] "Dr. Patil opens Rahul's visit. The penicillin allergy is right there, along with the reason for the visit and his full history. After examining him, the doctor records his findings."

Highlight:
**Red** on Allergies. Feature title **Doctor Consultation**.

Pause:
2 s on the allergy.

Next scene:
Hard cut.

--------------------------------
SCENE 06
--------------------------------

Screen: Prescription, PDF, completion — **REUSE DOC-07, DOC-08, DOC-09**
Route: `/dashboard/prescriptions/new?appointmentId=<id>`, `/dashboard/prescriptions`, `/dashboard/appointments/<id>`
Role: Doctor

Before recording:
- DOC-08 PDF: opened from the download bubble in a Chrome tab (finding #3, resolved).

Actions:
1. Suggestion dropdown + Send to Pharmacy (DOC-07; valid until 09-11-2026).
2. PDF 2 s (DOC-08).
3. Complete Appointment → follow-up D+14 = 24-10-2026 → Schedule (DOC-09).

Expected result:
Sent to Wellness Pharmacy; Completed; Scheduled Follow-up.

Narration:
[02:35–03:25] "He writes the prescription with suggestions from the hospital's own medicine catalog, and reminder times are scheduled for Rahul automatically. With one choice, the prescription goes straight to Wellness Pharmacy. Arogyix produces a branded PDF, and the visit can only be completed once the prescription exists. A follow-up is set for two weeks."

Highlight:
Cyan on the suggestions → Send to Pharmacy → Scheduled Follow-up. Feature title **Digital Prescription**. Medicine entry at 2×.

Pause:
2 s on the PDF.

Next scene:
Hard cut, lower-third → pharmacy.

--------------------------------
SCENE 07
--------------------------------

Screen: Rx detail, Stock Ledger — **REUSE PHA-04, PHA-05, PHA-06 (ledger only)**
Route: `/dashboard/pharmacy-portal/prescriptions/<id>`, `/dashboard/pharmacy-portal/inventory`
Role: Pharmacy

Before recording:
- Uses the PHA-05 take, where **Dispense Qty was `1` for each medicine**: Amlodipine `1`, Atorvastatin `1`, Pantoprazole `1`. **Never** 30 / 30 / 14.

Actions:
1. Verify (PHA-04) → Dispense 1 / 1 / 1 (PHA-05) → ledger rows (PHA-06).

Expected result:
"Prescription verified" → "Prescription dispensed"; Remaining 0 on every row; ledger rows.

Narration:
[03:25–04:05] "At Wellness Pharmacy, Rahul's prescription is already waiting, matched to the pharmacy's own catalog. The pharmacist verifies it and dispenses the medicines. Stock is taken from the batch that expires first, and every movement is recorded."

Highlight:
Cyan on the Items table, then the ledger rows. Feature title **Pharmacy Management**.

Pause:
1 s after each toast.

Next scene:
Hard cut to the doctor's lab order.

--------------------------------
SCENE 08
--------------------------------

Screen: New Lab Order, then lab order detail — **REUSE DOC-10, LAB-04 … LAB-08**
Route: `/dashboard/pathology-orders/new`, `/dashboard/pathology-portal/orders/<id>`
Role: Doctor, then Pathology

Before recording:
- Nothing new.

Actions:
1. Place Order (DOC-10).
2. Sample steps as a 3× montage (LAB-05).
3. Flag column with High (LAB-06).
4. Confirm & Verify (LAB-07) → Deliver Report (LAB-08).

Expected result:
"Lab order placed" … "Report delivered".

Narration:
[04:05–04:50] "Dr. Patil also orders blood tests from CarePlus Diagnostics, the hospital's partner lab. The lab tracks Rahul's sample with its own ID from collection to processing. Results are entered and high values are clearly flagged. Once the pathologist verifies the report, it's delivered straight into Rahul's hospital record, and both Rahul and his doctor are notified."

Highlight:
Cyan on the Sample ID → Flag column → Deliver Report. Lower-third **Dr. Anita Menon · CarePlus Diagnostics**. Feature title **Lab Workflow**.

Pause:
1 s on the flags.

Next scene:
Hard cut, lower-third → receptionist.

--------------------------------
SCENE 09
--------------------------------

Screen: Front desk Collect; patient Pay Now — **REUSE REC-07, PAT-06**
Route: `/dashboard/receptionist`, `/dashboard/billing`
Role: Receptionist, then Patient

Before recording:
- If there are no Razorpay keys, drop the PAT-06 part.

Actions:
1. Collect → Today's Revenue (REC-07). (⚠️ Never Check Out.)
2. Pay Now → UPI → payment (PAT-06).

Expected result:
"Payment recorded successfully"; with keys, "Payment successful!".

Narration:
[04:50–05:15] "Back at the desk, Rahul pays for his consultation and the receptionist records it. Today's revenue updates instantly. Bills can also be paid online from the patient portal, by UPI, card, net banking or wallet."

Highlight:
Cyan on Today's Revenue, then the payment methods. Feature title **Billing**.

Pause:
1 s on Today's Revenue.

Next scene:
Hard cut, lower-third → patient.

--------------------------------
SCENE 10
--------------------------------

Screen: Patient views (reuse), then Analytics — **REUSE PAT-03/04/05 + NEW CLIP MST-10** (or ADM-10)
Route: `/dashboard/patient`, `/dashboard/prescriptions`, `/dashboard/reports`, `/dashboard/analytics`
Role: Patient, then Hospital Admin

Before recording (MST-10):
- End of D, after Rahul's payment. `Admin` profile. Download list cleared (`chrome://downloads` → Clear all).

Actions:
1. (Reuse) Medicines Due → PDF → lab report.
2. (MST-10) **Analytics** → pause on the charts → **Reports** → **Revenue Report** → **Today** → **Export**.

Expected result:
Revenue Report includes Rahul's invoice.

Narration:
[05:15–06:05] "At home, Rahul sees which medicines are due, downloads his prescription, and opens his lab report the moment it's delivered. And at the end of the day, everything that happened feeds the administrator's analytics and reports, ready to print or export."

Highlight:
Cyan on Medicines Due → the lab report → Export. Lower-thirds Rahul, then Meera. Feature title **Records & Reports**.

Pause:
1 s on each screen.

Next scene:
Cross-fade 0.8 s to the end slide.

--------------------------------
SCENE 11
--------------------------------

Screen: End slide — **EDIT ONLY (MST-11)**
Route: none
Role: none

Before recording:
- Nothing to record.

Actions:
1. Six icons: Front desk → Doctor → Pharmacy → Lab → Patient → Administrator, animated in on the matching words.
2. Fade to the logo and end card.

Expected result:
The whole journey in one frame.

Narration:
[06:05–06:30] "One patient visit: registration, booking, consultation, digital prescription, pharmacy, lab, payment and follow-up. Every person connected, in one system. That's Arogyix."

Highlight:
**Arogyix** · *One patient. One connected hospital.*

Pause:
3 s on the logo.

Next scene:
Fade to black 1 s.

**11. Screen recording notes:** MST clips at the same 1920×1080 / 110% as the role clips so cuts match.
**12. What to avoid:** saying or showing: an automatic invoice at visit end; choosing cash/card at the desk; dispensing creating a bill; credentials emailed; High/Low set automatically.
**13. Completion check:** MST-01, MST-02, MST-10 recorded · every reused clip ID exists · Rahul's details identical across scenes · passwords and tokens blurred.
