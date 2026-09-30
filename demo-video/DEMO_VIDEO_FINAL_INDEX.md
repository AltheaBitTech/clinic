# Arogyix — Demo Video Final Index

> ## ▶ RECORD FROM RECORDING_RUNBOOK.md ONLY.
> **Recording day: Saturday 10 October 2026.** `RECORDING_RUNBOOK.md` is the only authoritative recording instruction. The per-video scripts listed below are **reference documents**, not recording instructions. Before the first take, tick `FINAL_RECORDING_PREPARATION_CHECKLIST.md`.

This is the starting point for recording. Everything needed to record, narrate and edit the Arogyix demo videos is in this folder, and every route, button, field and workflow in the recording scripts was checked against the application source code on 30 September 2026. No application code was changed.

---

## 1. The videos

| Video | Role | Duration | Main Workflow | Record from | Reference only |
|---|---|---:|---|---|---|
| Product Demo | All | 6:30 | Complete hospital journey for one patient | `RECORDING_RUNBOOK.md` → Video 8 | `MASTER_PRODUCT_DEMO_RECORDING_SCRIPT.md` |
| Admin | Hospital Admin | 4:35 | Hospital management: department, staff invite, doctor profile, partners, analytics | `RECORDING_RUNBOOK.md` → Video 2 | `ADMIN_RECORDING_SCRIPT.md` |
| Receptionist | Receptionist | 3:50 | Patient registration, appointment, check-in, billing, payment | `RECORDING_RUNBOOK.md` → Video 3 | `RECEPTIONIST_RECORDING_SCRIPT.md` |
| Doctor | Doctor | 4:50 | Consultation, digital prescription, follow-up, lab order | `RECORDING_RUNBOOK.md` → Video 4 | `DOCTOR_RECORDING_SCRIPT.md` |
| Pharmacy | Pharmacy | 3:55 | Prescription verification and dispensing, stock, counter sale | `RECORDING_RUNBOOK.md` → Video 5 | `PHARMACY_RECORDING_SCRIPT.md` |
| Pathology | Pathology Lab | 3:45 | Lab workflow: sample, results, verification, delivery | `RECORDING_RUNBOOK.md` → Video 6 | `PATHOLOGY_RECORDING_SCRIPT.md` |
| Patient | Patient | 3:00 | Prescription, lab report, online payment, self-booking, chat | `RECORDING_RUNBOOK.md` → Video 7 | `PATIENT_RECORDING_SCRIPT.md` |
| Staff | Super Admin (Arogyix platform team) | 3:15 | New hospital application and approval, platform overview | `RECORDING_RUNBOOK.md` → Video 1 | `STAFF_RECORDING_SCRIPT.md` |

All durations are inside the requested ranges. None were padded.

> **"Staff" means the Arogyix platform team.** The app has no role called "Staff". Hospital staff (receptionists, doctors, admins) have their own videos, so the Staff video covers the Super Admin. See the note at the top of `STAFF_RECORDING_SCRIPT.md`.

## 2. Supporting files

| File | Use it for |
|---|---|
| `RECORDING_RUNBOOK.md` | **The only recording instructions.** One block per scene, in recording order |
| `FINAL_RECORDING_PREPARATION_CHECKLIST.md` | The go / no-go checklist to tick before the first take |
| `QUICK_RECORDING_ORDER.md`, `RECORDING_PROGRESS.md` | The day's order of takes, and tick-off |
| `DEMO_DATA.md` | Every value to type, the demo cast, and the record register (§9) |
| `DEMO_DATA_RESET.md` | Resetting the environment before recording again |
| `MASTER_VOICEOVER_SCRIPT.md` | Narration only, all eight videos, timed. Give this to the voice artist or AI voice tool |
| `VIDEO_EDITING_GUIDE.md` | Cursor, zoom, transitions, text overlays, highlights, privacy blurs, audio |
| `SCREEN_RECORDING_CHECKLIST.md` | One-time environment, browser and OS setup |
| `DEMO_VIDEO_MASTER_PLAN.md`, `ROLE_FEATURE_MATRIX.md`, `MASTER_DEMO_FLOW.md` | Background: what each role can do, and the known product gaps |
| `*_RECORDING_SCRIPT.md` (8 files) | **Reference only.** Earlier per-video scripts; the runbook supersedes them |
| `*_DEMO_SCRIPT.md` (7 files) | **Reference only.** Older, longer cuts (5–11 min). Not recording instructions |

## 3. The one story

Every hospital-side video follows the same patient on the same day:

**Rahul Sharma** (Penicillin allergy, hypertension) is registered by **Priya Deshmukh**, booked with **Dr. Amit Patil** at **11:30 AM on Sat 10 Oct 2026**, checked in and billed **₹800**. Dr. Patil prescribes **Amlodipine 5mg, Atorvastatin 10mg, Pantoprazole 40mg**, sends it to **Wellness Pharmacy** (**Suresh Kale**), completes the visit, sets a **2-week follow-up (Sat 24 Oct 2026)**, and orders **Lipid Profile + KFT** from **CarePlus Diagnostics** (**Dr. Anita Menon**). The pharmacy dispenses (1 unit per medicine), the lab delivers the report, Priya collects payment, Rahul sees everything at home and pays the **₹300 Resting ECG** bill online, and **Meera Joshi** sees it all in the revenue report.

## 4. Recording day at a glance

**Before day D (Sat 10 Oct 2026):** complete `DEMO_DATA.md` §8 steps 1–6 (both doctors Monday–Saturday; Cetirizine expiry 25-10-2026; warm-up week skipping Sunday 4 Oct), set up the browser profiles and test PDF downloads, take the database snapshot in `DEMO_DATA_RESET.md` (Method A1), and tick `FINAL_RECORDING_PREPARATION_CHECKLIST.md`.

| Order | Time (example) | Record | Why this order |
|---:|---|---|---|
| 1 | 08:40 | **Master Product Demo** clips **MST-02** (morning dashboard), then **MST-01** (landing page) | First take of the day: the morning dashboard before anything changes it and before Rahul exists |
| 2 | 09:00 | Staff (Super Admin), all scenes | Independent of the hospital story |
| 3 | 09:30 | Admin Scenes 01–09 | Creates Orthopedics and Dr. Deshpande |
| 4 | 10:15 | Receptionist Scenes 01–06 (⚠️ never Check Out) | Registers, books (11:30), checks in and bills Rahul |
| 5 | 10:45 | Doctor, all scenes | Needs Rahul checked in; completion must be on day D |
| 6 | 11:30 | Receptionist Scenes 07–09 (Collect only) | Payment after the consultation |
| 7 | 11:40 | *Off camera:* Billing → Create Invoice, ₹300 "Resting ECG" for Rahul | Needed for Pay Now in the Patient video |
| 8 | 11:45 | Pharmacy, all scenes (Dispense Qty 1 / 1 / 1) | Needs Rahul's prescription in the queue |
| 9 | 12:30 | Pathology, all scenes | Needs Rahul's lab order |
| 10 | 13:15 | Patient, all scenes | Needs the prescription, report, bills and chat message |
| 11 | 14:00 | Admin Scenes 10–12 and Master clip **MST-10** | End-of-day numbers include Rahul |
| 12 | Editing | Master Product Demo from the clips above + **MST-11** end slide | See the runbook's Video 8 section |

## 5. Corrections made while verifying against the code

These affect what's said or done on camera. The recording scripts already follow the code.

| # | Earlier documentation said | The code actually does | Where it's handled |
|---|---|---|---|
| 1 | Lab values outside the normal range are flagged High/Low **automatically** | The result editor's **Flag** dropdown starts at **Normal** and is sent with every row, so High/Low must be chosen by hand. Only **Critical** is applied automatically, and only when a test parameter has a critical range (the seeded ones don't) | Pathology Scene 06; `DEMO_DATA.md` §4. Also corrected in `PATHOLOGY_DEMO_SCRIPT.md`, `MASTER_DEMO_FLOW.md` and `DEMO_VIDEO_MASTER_PLAN.md` |
| 2 | Enter four Lipid Profile values and two KFT values | The seeded tests pre-fill **5 lipid rows** (incl. VLDL) and **6 KFT rows**. Saving fails if any row is empty | Values for every row added to `DEMO_DATA.md` §4 and Pathology Scene 06 |
| 3 | Click **Schedule Follow Up** after completing | Completing the visit **opens the follow-up form automatically**; the doctor picks the date and clicks **Schedule** | Doctor Scene 09 |
| 4 | Click **Confirm & Verify** | The button stays disabled until **"I have reviewed the results"** is ticked | Pathology Scene 07 |
| 5 | Doctor's chat and lab note say "fasting sample, tomorrow" | The same-day recording plan has the lab deliver the report the same day | New lab note and chat text in `DEMO_DATA.md` §4 |
| 6 | Doctor's notes say "ECG advised if symptoms persist", yet Rahul gets an ECG bill | — (story consistency) | Notes now say the ECG was done in clinic |

## 6. Final quality check (Step 11)

| Check | Result | How it was verified |
|---|---|---|
| Every route exists | ✅ | Every `/dashboard/...` route in the scripts matches a `page.tsx` under `frontend/app/` |
| Every button exists | ✅ | Every bolded button and label in the seven role scripts and the master script was searched for in `frontend/app`, `frontend/components` and `frontend/lib`. All UI labels were found; the only "not found" items were demo data, overlay text and notes |
| Every field exists | ✅ | Form labels checked in the patient, appointment, prescription, doctor-profile, department, staff-invite, invoice, POS, lab-order and lab-result screens |
| Every role exists | ✅ | `UserRole` enum in `backend/prisma/schema.prisma`: SUPER_ADMIN, HOSPITAL_ADMIN, DOCTOR, RECEPTIONIST, PATIENT, PHARMACY, PATHOLOGY (REFERRAL exists but isn't in these videos). Sidebar items checked per role in `DashboardLayout.tsx` |
| Every workflow exists | ✅ | Backend rules checked: no past bookings; completion only on the scheduled date and only with a prescription; invoices only created by staff action; prescriptions routed only to active pharmacies of the same hospital; pharmacy items auto-matched by exact name; dispensing doesn't create a sale; patients may only cancel their own appointments |
| Every demo user exists | ✅ | Seeded accounts in `backend/prisma/seed.ts`; all others are created by the prep steps in `DEMO_DATA.md` §8 or live on camera |
| Demo data is consistent | ✅ | One cast and one register (`DEMO_DATA.md` §9); the six story inconsistencies above were fixed |
| No feature has been invented | ✅ | Each script lists the steps that do **not** exist, and the voiceover avoids them |
| No production data is required | ✅ | A dedicated demo database is required (`DEMO_DATA_RESET.md`) |
| No sensitive data is used | ✅ | `example.com` emails, `98000 00xxx` phones, dummy licence/GST numbers; passwords and tokens blurred in the edit |
| Narration matches UI | ✅ | `MASTER_VOICEOVER_SCRIPT.md` is generated directly from the scripts' Voiceover sections; pacing checked (every scene under 2.3 words per second) |
| Scene order is logical | ✅ | Recording order in §4 follows the app's own dependencies |
| Complete patient journey is understandable | ✅ | The Master Product Demo covers all 11 story steps with one patient |

## 7. Things to decide before recording

| Decision | Default in the scripts | If you choose otherwise |
|---|---|---|
| Razorpay **test** keys configured? | Optional | Without them, use the alternative voiceover in Patient Scene 06 and skip the online-payment step in Master Scene 09 |
| Warm-up week of history? | Recommended | Without it, charts, Missed Follow-ups and Revenue Analytics look sparse; shorten those moments |
| Any subscriptions active (Super Admin Revenue Analytics)? | Optional | Use the alternative voiceover in Staff Scene 08 |
