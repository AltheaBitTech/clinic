# Arogyix — Screen Recording Checklist

> **RECORD FROM `RECORDING_RUNBOOK.md` ONLY.** Recording day: **Saturday 10 October 2026**. The final go / no-go list is `FINAL_RECORDING_PREPARATION_CHECKLIST.md`.

Use this together with the runbook. The scene-level steps (Open, Click, Enter, Verify) are in the **Recording checklist** block under each scene in the script files. This file covers everything that applies to all videos.

---

## 1. Environment setup (once)

### Backend (`backend/.env`)
- [ ] `DATABASE_URL` points to a **dedicated demo database**, not production. Seeding and demo data will change it.
- [ ] `npx prisma db push` then `npx prisma db seed` have been run.
- [ ] `FRONTEND_URL` matches the frontend address you'll record, for CORS.
- [ ] **SMTP** is configured, for patient self-signup, forgot password and referral signup codes (gap G7).
- [ ] **Razorpay test keys** (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) are set if you'll record Pay Now or Manage Subscription (gap G8). Otherwise skip those steps.
- [ ] `UPLOAD_DIR` is writable, for logos, avatars, report uploads and generated PDFs.
- [ ] Twilio and WhatsApp are **not** needed. Leave WhatsApp toggles off on camera unless configured.
- [ ] Don't copy real credentials into any `.env.example` file (see the CLAUDE.md warning).
- [ ] Record against the **local** backend on a Mac set to **India Standard Time**. Don't point the frontend at a cloud backend for recording (slot weekdays and booked-slot hiding use the server's timezone).

### Frontend
- [ ] Record against a **production build** (`npm run build && npm run start`) or a staging deployment. In dev mode (`npm run dev`), the Next.js dev indicator and error overlays can appear on screen.
- [ ] `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` point to the backend. Chat and live notifications need the socket.

### Browser
- [ ] Google Chrome, latest. **One Chrome profile per role.** Logins are stored in `localStorage`, which is shared by every tab on the same site. Two roles in two tabs of the same profile will log each other out.
  - Suggested profiles: `SA`, `Admin`, `Reception`, `DrPatil`, `DrKulkarni`, `Pharmacy`, `Lab`, `PatientRahul`, `PatientNeha`.
- [ ] In each profile: extensions off, bookmarks bar hidden (⌘⇧B), password manager "Offer to save" **off**, site notifications **off**, translation prompts off, default zoom **110%** (text is easier to read in video).
- [ ] Downloads, in **each** profile that downloads a file (`DrPatil`, `Reception`, `PatientRahul`, `Admin`, `Lab`):
  - [ ] `chrome://settings/downloads` → "Ask where to save each file before downloading" **off**.
  - [ ] `chrome://settings/content/pdfDocuments` → **Open PDFs in Chrome** (not the system viewer).
  - [ ] Each PDF download **tested once** off camera; the file saves without a dialog and doesn't interrupt the recording.
  - [ ] `chrome://downloads` → **Clear all** before each take.
  - [ ] Never open a PDF externally (Preview, Finder). Open one only where the runbook says so, in a Chrome tab from the download bubble.
- [ ] Clear old toasts or popups by reloading before each take.
- [ ] Light mode (the app is designed in light colours).

### Operating system (macOS)
- [ ] Do Not Disturb **on** (no Slack, Mail or Calendar banners).
- [ ] Hide the Dock, and hide menu-bar items you don't need, or record only the browser window.
- [ ] Desktop cleared, wallpaper neutral.
- [ ] Mouse cursor size one step larger than default (Accessibility → Display → Pointer size).

---

## 2. Recording settings

| Setting | Value |
|---|---|
| Resolution | 1920×1080 (browser window exactly 1920×1080, or record the window region) |
| Frame rate | 30 fps (60 fps if you plan smooth zooms) |
| Tool | OBS / ScreenFlow / Camtasia / Screen Studio (automatic zoom works well for this) |
| Cursor | Highlight on (soft yellow halo), click ripple on, **click sound off** |
| Audio | Record the voiceover separately. Don't record system audio |
| Takes | One take per scene. Name files `B-05-departments-take1.mov` |
| Safe margin | Keep important UI away from the outer 5% (it gets cropped on mobile players) |

---

## 3. Mouse, pacing and zoom rules

**Mouse**
- Move in straight, slow lines. Never zig-zag across the screen.
- Before each click, hover the target for **0.5 s**, so viewers can follow where the cursor is going.
- After the click, move the cursor **off** the element you're explaining, so it isn't covered.
- When there's nothing to click, park the cursor in empty space on the right-hand side.
- Hover each stat card for 1 s when you mention it. Don't circle it.

**Typing**
- Type at a steady, human pace. For long fields (clinical notes, advice, PO lines), paste the text and cover it with "type your notes" in the voiceover. Speed up long forms to 1.5–3× in the edit.
- Never type a password where it's visible. The password fields are masked; keep them that way.

**Pauses**
- Pause **1.5–2 s** after every toast ("…successfully!") and every modal opening.
- Pause **2–3 s** on any screen the voiceover describes for more than one sentence.
- Pause **3 s** on the final frame of each video.

**Zoom (in the edit)**
- Zoom to 120–150% for: form sections while typing, the Available Slots grid, allergy boxes, Booking and Prescription Summary, the Flag column, stat cards, and the Export button.
- Zoom in over 0.4 s and hold. Don't zoom and pan at the same time.
- Keep zoom at 100% during navigation between pages.

**Highlights**
- Use soft rounded rectangles in the brand cyan (`#0891b2`) with a 30% dim outside.
- Use red boxes only for safety items: allergies, critical flags, "password won't be shown again".

---

## 4. Show / avoid list

**Always visible**
- The sidebar (it orients the viewer). Only collapse it for phone-sized demos.
- The page title and subtitle at the top of each screen.
- Toast confirmations.

**Avoid on screen**
- Browser dev tools, the address bar with tokens (`/register?token=…`: crop or blur the token), and API error toasts.
- **Invoice email and WhatsApp icons** on Billing, which show "available soon" (gap G9).
- **Manage Subscription** or **Pay Now** without Razorpay test keys (gap G8).
- **Deactivate** (pharmacies, staff), **Revoke** (labs), **Delete** (departments, catalog, reports), and the tenant status toggle on the demo hospital.
- The Super Admin **Total Patients** and **Total Appointments** cards (tenant-scoped, may show errors).
- Receptionist → patient file → **Timeline** tab (it appears empty for this role).
- Seeded "John", "Jane" and "Robert" accounts in lists. Deactivate them or filter them out.
- Real emails, phone numbers or ID documents. Use only `DEMO_DATA.md`.
- Temporary passwords and invite tokens. **Blur them in post.**

---

## 5. Per-video pre-flight checks

Tick these right before recording each video.

### Staff — Super Admin
- [ ] Logged out on `/` in a clean profile, ready for the applicant form.
- [ ] Pending: "Test Clinic Duplicate". Not present: "Sahyadri Care Clinic".
- [ ] `SA` profile ready at `/login`.
- [ ] Revenue Analytics has data, or you've decided to use the short version.

### Hospital Admin
- [ ] The hospital is renamed Arogyix Multispeciality Hospital, with the logo uploaded.
- [ ] The admin's display name is Meera Joshi.
- [ ] Departments exist except **Orthopedics**.
- [ ] Dr. Patil and Dr. Kulkarni are configured with Weekly Availability **Monday–Saturday** (Saturday ticked for both). Priya is active.
- [ ] Missed Follow-ups shows Sunita Rao.
- [ ] Wellness Pharmacy and CarePlus are registered and linked.
- [ ] A spare incognito window is ready for the invite activation (Scene 07).

### Receptionist
- [ ] It's **day D (Sat 10 Oct 2026)**, and the current time is at least 60 minutes before the planned slot (gap G1).
- [ ] ⚠️ You know **not to click "Check Out"** on Rahul's row. It completes his visit from the desk and bypasses the doctor's follow-up.
- [ ] Rahul Sharma does **not** exist.
- [ ] Dr. Patil has free slots today (Saturday).
- [ ] *(Extended cut only, not the runbook:)* Arjun Mehta's open visit with a prescription, **not completed**, is in the queue.
- [ ] Warm-up data exists for Missed Follow-ups (otherwise use the empty-state line).

### Doctor
- [ ] Rahul's appointment is **In Progress** (checked in) and the invoice is generated.
- [ ] The hospital catalog has Amlodipine 5mg, Atorvastatin 10mg and Pantoprazole 40mg.
- [ ] Wellness Pharmacy appears in **Send to Pharmacy**.
- [ ] CarePlus link is **Active**. Lab catalog has Lipid Profile and KFT.
- [ ] Recording on day D (Complete Appointment only works on the scheduled date).
- [ ] Dates known: Prescription Valid Until **09-11-2026**; follow-up **24-10-2026**.

### Pharmacy
- [ ] Rahul's prescription is in the **Pending** tab, with all three items auto-matched (no "Select medicine…" dropdowns).
- [ ] Opening stock is entered. Atorvastatin shows Low Stock; Cetirizine (CTZ-2511-E, expiry **25-10-2026**) shows Expiring Soon.
- [ ] Dispense Qty will be **1** for each medicine (never 30 / 30 / 14).
- [ ] PO-2026-0012 does **not** exist yet.
- [ ] The supplier exists.

### Pathology Lab
- [ ] Rahul's order is in **Active** with status Ordered.
- [ ] Optional: Sahyadri Care Clinic's link request is pending.
- [ ] The test catalog is imported and a collector has been added.

### Patient
- [ ] SMTP works and the test inbox is open in a separate window (off camera).
- [ ] Rahul has: the prescription, a paid ₹800 invoice, a pending ₹300 invoice, the delivered lab report, and Dr. Patil's chat message.
- [ ] You know Rahul's password (from the Video C modal, or reset it beforehand).
- [ ] Razorpay test mode is on, or you've decided to stop at the method chooser.
- [ ] A dummy PDF `Home BP Log - Sept.pdf` with no real data is ready to upload.

### Master Product Demo
- [ ] **MST-02** (morning dashboard) is the **first take** of D, before Rahul is registered; **MST-01** (landing page) straight after.
- [ ] **MST-10** (end-of-day analytics) is recorded after Rahul has paid.
- [ ] All the role-video takes are exported and labelled by clip ID.

---

## 6. Post-production checklist

- [ ] Blur every temporary password, invite token and email inbox.
- [ ] Add lower-third role labels: "Receptionist · Priya", "Doctor · Dr. Amit Patil" and so on.
- [ ] Add captions (SRT) from the voiceover scripts. Check medicine names are spelled correctly.
- [ ] Music: soft, at −28 dB under the voice, with no music under dense explanations.
- [ ] Add a disclaimer card at the start or end: "All names and data in this video are fictitious."
- [ ] Watch the whole video against the **gaps list** in `DEMO_VIDEO_MASTER_PLAN.md` and make sure no narrated line describes behaviour that doesn't exist (auto-invoice, payment method at the desk, dispense = bill, auto-emails, live reminders).
- [ ] Export at 1080p, H.264, around 12 Mbps. Also export a 720p version for email.
