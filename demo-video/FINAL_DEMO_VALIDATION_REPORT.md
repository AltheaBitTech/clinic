# Arogyix — Final Demo Recording Validation Report

**First validated:** Wed 30 Sep 2026 (status then: NEEDS PREPARATION)
**Re-validated:** Wed 30 Sep 2026, after the documentation and demo-data fixes below
**Scope:** all files in `demo-video/`, checked against the application source (`frontend/app`, `frontend/components`, `backend/src`, `backend/prisma/seed.ts`). **No application code was changed.** Only documentation and demo data were edited.
**Recording day:** **Saturday 10 October 2026** (D)
**Authoritative source:** **RECORD FROM `RECORDING_RUNBOOK.md` ONLY.**

Legend: ✅ RESOLVED / READY · ⚠️ NEEDS PREPARATION · ❌ BLOCKED

---

## 1. Summary

| # | Issue (first validation) | Was | Now | Fix applied in |
|---|---|---|---|---|
| B1 | Dispense Qty `30 / 30 / 14` gives Remaining −29 / −29 / −13 | ❌ | ✅ | Dispense Qty is **`1` per medicine** (Remaining 0): runbook Pharmacy 05, Master 07, the "Three rules" block and finding #1; `PHARMACY_RECORDING_SCRIPT.md`, `PHARMACY_DEMO_SCRIPT.md`, `MASTER_PRODUCT_DEMO_RECORDING_SCRIPT.md`; `DEMO_DATA.md` §5 and §9.8; `QUICK_RECORDING_ORDER.md`; `RECORDING_PROGRESS.md` |
| B2 | Cetirizine expiry 30-11-2026 is outside the 30-day Expiring Soon window | ❌ | ✅ | CTZ-2511-E expiry = **D+15 = 25-10-2026**: `DEMO_DATA.md` §0, §5 (incl. the Add New Batch instruction if stock was already entered); runbook date table, Pharmacy 03 and 06; `DEMO_DATA_RESET.md` A3 and post-reset checks; `SCREEN_RECORDING_CHECKLIST.md` |
| S1 | Dates were for Thu 8 Oct 2026 | ⚠️ | ✅ | D = **Sat 10-10-2026**, D+14 = **Sat 24-10-2026**, D+30 = **Mon 09-11-2026**: `DEMO_DATA.md` §0/§4/§9.7; runbook date table plus Doctor 07/09, Patient 07, Master 06; per-video scripts |
| S2 | The warm-up week contains a Sunday | ⚠️ | ✅ | **Sunday 4 Oct 2026 has no doctor slots, so skip it**: `DEMO_DATA.md` §0, §3, §8, §9.7; runbook date table; `QUICK_RECORDING_ORDER.md`; `DEMO_DATA_RESET.md` Method B |
| S3 | Sat 3 Oct is too close for the warm-up | ⚠️ | ✅ | Recording on 10 Oct leaves the full warm-up Sat 3 to Fri 9 Oct (Sunita Rao on Mon 5 Oct, follow-up on Fri 9 Oct) |
| S4 | Both doctors need Saturday ticked | ⚠️ | ✅ | **Dr. Patil: Monday–Saturday. Dr. Kulkarni: Monday–Saturday.** Required in `DEMO_DATA.md` §2, §8, §9.4. The post-reset check in `DEMO_DATA_RESET.md` now covers **both** doctors. Also in the final checklist and the screen checklist |
| P1 | Per-video scripts contradicted the runbook | ⚠️ | ✅ | All 4 lines corrected (Today's Sales; 1/1/1 twice; "Password copied to clipboard!", also in `STAFF_DEMO_SCRIPT.md`). **Every per-video script is now marked as a reference document**, and the runbook, index, order, progress, data and checklist files say **RECORD FROM `RECORDING_RUNBOOK.md` ONLY** |
| P2 | Unmentioned Check Out button | ⚠️ | ✅ | ⚠️ **DO NOT CLICK "Check Out"**, with the reason, in the runbook's "Three rules", Receptionist header, Scenes 06 and 07, What to avoid, and Master 04 and 09; `RECEPTIONIST_RECORDING_SCRIPT.md`; `RECEPTIONIST_DEMO_SCRIPT.md`; `QUICK_RECORDING_ORDER.md`; `SCREEN_RECORDING_CHECKLIST.md`; the final checklist |
| P3 | PDF buttons download instead of opening | ⚠️ | ✅ | Pre-recording requirement in runbook Global setup and `SCREEN_RECORDING_CHECKLIST.md`: set downloads per profile, set "Open PDFs in Chrome", test each PDF download once, clear the list before each take, never open a PDF externally. Receptionist 08, Doctor 08, Patient 04, Master 06 and Master 10 now say: open the file from the download bubble in a Chrome tab → show → close the tab |
| P4 | Missed Follow-ups depends on the warm-up | ⚠️ | ✅ | "Don't book Sunita Rao with Dr. Kulkarni again" (`DEMO_DATA.md` §3). New post-reset check "Missed Follow-ups shows Sunita Rao". Admin 03 and Master 02 check it before the take |
| P5 | The backend must run on an IST machine | ⚠️ | ✅ | Added to runbook Global setup, `SCREEN_RECORDING_CHECKLIST.md` and the final checklist |
| D1 | "Schedule Follow Up" wording | ⚠️ | ✅ | `DEMO_DATA.md` §4 and `DOCTOR_DEMO_SCRIPT.md` now say the form opens automatically |
| D2 | Old video letters and old recording order in `DEMO_DATA.md` | ⚠️ | ✅ | Letters replaced by video names. §8 step 7 now says to follow `QUICK_RECORDING_ORDER.md` |
| D3 | Old lab note in `DOCTOR_DEMO_SCRIPT.md` | ⚠️ | ✅ | "Collect sample today after consultation" |
| D4 | "No medicines due" note is overcautious | — | ✅ | Kept as a harmless fallback (no on-camera risk) |
| D5 | "Findings #1–#4 resolved" in progress | ⚠️ | ✅ | Runbook findings #1–#4 are marked resolved or expected. New findings #10–#12 (Check Out, Cetirizine, Saturday) added. The progress tracker was updated |

**New file:** `FINAL_RECORDING_PREPARATION_CHECKLIST.md`, the go / no-go list of 18 checkboxes.

**Recording order change:** the **Master Product Demo** clips are now the first takes of D: **MST-02** at 08:40, then **MST-01**. Staff moves to 09:00, and the rest of the day is unchanged. MST-02 only views the morning dashboard, so moving it earlier removes no dependency. A sign-out step was added after it so Admin Scene 02 still starts on `/login`. Updated in the runbook, `QUICK_RECORDING_ORDER.md`, `RECORDING_PROGRESS.md`, `DEMO_VIDEO_FINAL_INDEX.md` and `SCREEN_RECORDING_CHECKLIST.md`.

---

## 2. Date check for D = Saturday 10 October 2026

| Token | Date | Weekday | Who must be available | Result |
|---|---|---|---|---|
| D-7 | 03-10-2026 | Saturday | Dr. Patil / Dr. Kulkarni (Mon–Sat) | ✅ Warm-up |
| D-6 | 04-10-2026 | Sunday | No one | ✅ Documented as **skip** |
| D-5 | 05-10-2026 | Monday | Dr. Kulkarni | ✅ Sunita Rao visit, follow-up 09-10-2026 |
| D-1 | 09-10-2026 | Friday | Dr. Kulkarni | ✅ Sunita's missed follow-up date |
| D | 10-10-2026 | Saturday | Dr. Patil (10:00–17:00; 11:30 slot fits) | ✅ Requires Saturday ticked |
| D+14 | 24-10-2026 | Saturday | Dr. Patil | ✅ Follow-up (Doctor 09) and self-booking (Patient 07). Requires Saturday ticked |
| D+15 | 25-10-2026 | Sunday | — | ✅ Cetirizine expiry, 15 days after D, inside the 30-day window |
| D+30 | 09-11-2026 | Monday | — | ✅ Prescription Valid Until (a date only; no slot needed) |

---

## 3. Scene-by-scene re-check (from `RECORDING_RUNBOOK.md`, in recording order)

| Block | Video / scenes | Result | What was checked after the fixes |
|---|---|---|---|
| 1 | **Master MST-02** (Scene 02) | ✅ | First take, 08:40. Needs the prepared data and no Rahul. Missed Follow-ups shows Sunita. `Admin` is signed out afterwards |
| 1 | **Master MST-01** (Scene 01) | ✅ | Logged-out landing page. No dependency |
| 2 | Staff 01 (edit), 02–09 | ✅ | Toast label corrected. Independent of the hospital story |
| 3 | Admin 01 (edit), 02–09 | ✅ | Admin 02 starts signed out. Admin 03 checks Missed Follow-ups. Admin 07 ticks Saturday for Dr. Deshpande |
| 4 | Receptionist 01 (edit), 02–06 | ✅ | Saturday slots exist (Dr. Patil Mon–Sat). ⚠️ Check Out warning in Scene 06 |
| 5 | Doctor 01 (edit), 02–12 | ✅ | Valid Until 09-11-2026. PDF opens from the download bubble. Follow-up 24-10-2026 is a Saturday Dr. Patil works. The follow-up form opens because the **doctor** completes the visit (never Check Out) |
| 6 | Receptionist 07–09 | ✅ | Collect only; ⚠️ Check Out warning in Scene 07. Invoice PDF opens from the download bubble |
| 7 | Off camera: ₹300 invoice | ✅ | Unchanged |
| 8 | Pharmacy 01 (edit), 02–09 | ✅ | Expiring Soon ≥ 1 (Cetirizine, 25-10-2026). Catalog Medicine column not expected. **Dispense 1/1/1 → Remaining 0**. Expiry tab shows CTZ-2511-E. POS still sells CTZ-2511-E (not expired on D) |
| 9 | Pathology 01 (edit), 02–09 | ✅ | Unchanged; lab Download already opens a new tab |
| 10 | Patient 01 (edit), 02–09 | ✅ | PDF opens from the download bubble. APT-02 on 24-10-2026 (Saturday slots exist) |
| 11 | Admin 10–12, **Master MST-10** (Scene 10) | ✅ | Revenue includes Rahul. Download list cleared before Export |
| Edit | Master 03–09, 11 | ✅ | Reuse clips: REC-04/05/06 (no Check Out), DOC-04…09 (24-10-2026 follow-up), PHA-04/05/06 (1/1/1), DOC-10 + LAB-04…08, REC-07 + PAT-06, PAT-03/04/05 |

No scene contains a step that fails on camera when the runbook is followed.

---

## 4. Environment conditions (unchanged, already handled by alternative lines)

These aren't defects. Each already has a documented alternative:
- **Razorpay test keys**: Patient 06 and Master 09 step 2. Without keys, use the alternative line.
- **Active subscriptions**: Staff 08. Without them, use the alternative line.
- **Chat "Connected"**: needs `NEXT_PUBLIC_SOCKET_URL` pointing at the running local backend.

---

## 5. What's left to do (preparation, not documentation)

The documents are complete. Before recording, carry out the prep they describe and tick `FINAL_RECORDING_PREPARATION_CHECKLIST.md`:
1. `DEMO_DATA.md` §8 steps 1–6 (both doctors Monday–Saturday; Cetirizine expiry 25-10-2026).
2. Warm-up: Sat 3, Mon 5, Tue 6, Wed 7, Thu 8, Fri 9 Oct. **Skip Sun 4 Oct.**
3. Submit **Test Clinic Duplicate** from the landing page.
4. Configure Chrome downloads and test one PDF download per profile.
5. Take the snapshot (`DEMO_DATA_RESET.md` A1) and run the post-reset checks.

---

## RECORDING STATUS: **READY**

Every blocking and preparation issue from the first validation has been fixed in the documentation and demo data. No application code was changed. Record from `RECORDING_RUNBOOK.md` only, after ticking `FINAL_RECORDING_PREPARATION_CHECKLIST.md`.

**FIRST VIDEO TO RECORD:** **MASTER PRODUCT DEMO**

**FIRST SCENE:** **Master Product Demo, Scene 02: Hospital Dashboard (new clip MST-02)**, at **08:40 on Saturday 10 October 2026**, before any other take and before Rahul is registered.
1. In the `Admin` Chrome profile (signed in as Meera Joshi, zoom 110%, download list cleared), open `/dashboard/hospital`.
2. Hover **Today's Appointments**, **Total Patients**, **Active Doctors** and **Today's Revenue**, 1 s each.
3. Scroll slightly to **Today's Appointment Status**. Hold 1 s.
4. Stop recording, then sign the `Admin` profile out, ready for Admin Scene 02.

Then record **MST-01** (Scene 01, landing page `/` in the clean logged-out profile), and continue with block 2 of `QUICK_RECORDING_ORDER.md` (Staff, 09:00).
