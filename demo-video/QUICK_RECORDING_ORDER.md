# Arogyix — Quick Recording Order

> **RECORD FROM `RECORDING_RUNBOOK.md` ONLY.** The per-video scripts are reference documents.

**Recording day D = Saturday 10 October 2026.** One recording day reuses one set of demo data. Each block leaves the data in the state the next block needs.
Scene details: `RECORDING_RUNBOOK.md`. Tick-off: `RECORDING_PROGRESS.md`. Final gate: `FINAL_RECORDING_PREPARATION_CHECKLIST.md`.

---

## Before day D (once)

1. `DEMO_DATA.md` §8 steps 1–6: seed, hospital, departments (**not** Orthopedics), catalog, staff, doctor profiles (**Dr. Patil and Dr. Kulkarni Monday–Saturday**), pharmacy, lab, stock (**Cetirizine expiry 25-10-2026**), background patients.
   Warm-up week: Sat 3, Mon 5 (Sunita Rao, follow-up 09-10-2026), Tue 6, Wed 7, Thu 8, Fri 9 Oct 2026. **Skip Sunday 4 Oct 2026**: there are no doctor slots on Sundays.
2. Submit **Test Clinic Duplicate** from the landing page (for the Staff video).
3. Take the snapshot: `DEMO_DATA_RESET.md` Method A1.
4. Set up Chrome profiles (`SCREEN_RECORDING_CHECKLIST.md`). Configure Chrome download behaviour in each profile and **test each PDF download once** (`RECORDING_RUNBOOK.md` → Global setup).
5. Take the title-card screenshots of each role dashboard.
6. Read the runbook's **"Three rules for every take"**: Dispense Qty `1` per medicine; ⚠️ **never click Check Out**; PDFs open only from the download bubble.
7. Run the `DEMO_DATA_RESET.md` post-reset checks.
8. Tick every box in `FINAL_RECORDING_PREPARATION_CHECKLIST.md`.

---

## Day D

D = **Sat 10 Oct 2026**. Dr. Patil and Dr. Kulkarni both work Monday–Saturday. Start early enough that 11:30 is still ≥ 60 min away after block 4 (Receptionist) begins.

| # | Time (example) | Record | Profile | Needs before | Leaves behind |
|---:|---|---|---|---|---|
| 1 | 08:40 | **Master Product Demo: MST-02** (morning dashboard), then **MST-01** (landing page) | `Admin`, then logged-out | Rahul doesn't exist; Missed Follow-ups shows Sunita Rao | Nothing changes (view-only clips). Sign `Admin` out afterwards for Admin Scene 02 |
| 2 | 09:00 | **Staff** Scenes 02–09 | logged-out → `SA` | Test Clinic Duplicate pending; no Sahyadri | Sahyadri approved (independent of the hospital story) |
| 3 | 09:30 | **Admin** Scenes 02–09 | `Admin` (+ logged-out for Admin 06) | No Orthopedics; Rohit not invited | Orthopedics; Dr. Rohit Deshpande configured |
| 4 | 10:15 | **Receptionist** Scenes 02–06. ⚠️ **Don't click Check Out** | `Reception` | Rahul doesn't exist; 11:30 slot in the future | Rahul registered, booked 11:30, checked in, ₹800 pending. **Temporary Password written down** |
| 5 | 10:45 | **Doctor** Scenes 02–12 | `DrPatil` | Rahul checked in | RX-01 at Wellness (valid until 09-11-2026); visit Completed by the doctor; follow-up 24-10-2026; lab order at CarePlus; chat message sent |
| 6 | 11:30 | **Receptionist** Scenes 07–09. ⚠️ **Collect only, never Check Out** | `Reception` | Visit Completed | ₹800 paid |
| 7 | 11:40 | *Off camera:* Billing → **Create Invoice** → Rahul · Dr. Amit Patil · ₹300 · Discount 0 · GST 0 · "Resting ECG" → **Generate Invoice** (leave pending) | `Reception` | — | ₹300 pending invoice for Patient 06 |
| 8 | 11:45 | **Pharmacy** Scenes 02–09. **Dispense Qty `1` / `1` / `1`** | `Pharmacy` | RX-01 in Pending, all items matched | Dispensed (Remaining 0); ledger rows; SALE-01 |
| 9 | 12:30 | **Pathology** Scenes 02–09 | `Lab` | Lab order in Active | Report delivered to Rahul |
| 10 | 13:15 | **Patient** Scenes 02–09 | `PatientRahul` | RX-01, paid ₹800, pending ₹300, delivered report, chat message | ₹300 paid (if Razorpay); APT-02 on 24-10-2026; chat reply |
| 11 | 14:00 | **Admin** Scenes 10–12, then **Master MST-10** | `Admin` | Everything above done | End-of-day analytics incl. Rahul |
| — | Editing | All title cards (every Scene 01), Master Scene 11 end slide, Master Scenes 03–10 from role clips | — | All clips labelled by ID | — |

### Why this order
- **Master Product Demo first (MST-02, then MST-01):** MST-02 is the morning dashboard and must be filmed before anything else changes today's numbers and before Rahul exists. Both clips are view-only, so a failed take costs nothing. The rest of the Master video is edited from the role clips recorded later in the day, plus MST-10 at the end.
- **Staff next:** it touches only the platform, so a failed take costs nothing.
- **Admin morning scenes before Receptionist:** Orthopedics and Dr. Deshpande are created before the front desk starts.
- **Receptionist split around Doctor:** Collect is filmed after the visit is completed, and completion only works on day D after a prescription exists.
- **Pharmacy and Pathology after Doctor:** they need RX-01 and the lab order.
- **Patient after Pathology:** the report must be delivered and the ₹300 invoice created.
- **Admin 10–12 and MST-10 last:** the day's revenue includes Rahul.

---

## If a take fails

| Failed after… | Do |
|---|---|
| Anything before an irreversible click | Reload and re-take (`DEMO_DATA_RESET.md` Method C) |
| Rahul registered, nothing else done | Re-register as `rahul.sharma2@example.com` and use it for the Patient login |
| Complete, Dispense, Deliver, Collect, Approve, Orthopedics, Rohit invite | Restore the snapshot (Method A2), then restart from block 1 or the affected block |
| Past 11:30 before booking | Book the next free slot and use that time everywhere |
