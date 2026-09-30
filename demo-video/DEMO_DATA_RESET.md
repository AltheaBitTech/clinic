# Arogyix — Demo Data Reset Plan

Use this when you need to record again: a take went wrong after Rahul was registered, you want to re-shoot on another day, or the demo database got messy.

**Why a reset is needed at all.** Several demo steps can only happen once, and the app has no "undo" for them:

| Step | Why it can't simply be repeated |
|---|---|
| Register Rahul Sharma | His email `rahul.sharma@example.com` can only belong to one account |
| Complete Rahul's appointment | It can only be completed on its scheduled date, and only once |
| Dispense Rahul's prescription | Stock is deducted; the prescription moves to Dispensed |
| Deliver the lab report | The order moves to Delivered |
| Collect payment | The invoice becomes Paid |
| Add the Orthopedics department / invite Dr. Rohit Deshpande | They already exist after the first take |
| Approve Sahyadri Care Clinic | The request is no longer pending, and the tenant exists |

The app also doesn't allow booking in the past, so you can't re-create "yesterday" through the screens.

> ⚠️ **Only ever do this on the dedicated demo database.** Every method below overwrites or deletes data. Check that `DATABASE_URL` in `backend/.env` points at the demo database, **not production**, before you start. If you're not sure, ask whoever set up the environment.

---

## Method A (recommended): restore a "ready to record" snapshot

This takes about 5 minutes and gives you exactly the same starting point every time.

### A1. Take the snapshot once, when the demo is ready

Do this at the end of the prep work in `DEMO_DATA.md` §8 (steps 1–6), **before** recording anything on day D. At this moment: the hospital, departments (not Orthopedics), staff, doctors, catalog, pharmacy, lab, stock, background patients and warm-up history exist, and Rahul does **not**.

1. Stop the backend server.
2. Open a terminal in the `backend/` folder.
3. Take a copy of the database (you need the PostgreSQL command-line tools installed; use the direct, non-pooled connection address if your host provides one):
   ```bash
   pg_dump --format=custom --no-owner --file=arogyix-demo-ready.dump "<DEMO_DATABASE_URL>"
   ```
4. Store `arogyix-demo-ready.dump` somewhere safe **outside the git repository** (it contains demo account password hashes). Don't commit it.
5. Uploaded files (hospital logo, avatars) are stored in the Supabase storage bucket named in `SUPABASE_STORAGE_BUCKET`, not in the database. They aren't removed by a restore, so you don't need to back them up for a reset.

### A2. Restore it before each re-recording

1. Stop the backend server.
2. Restore the snapshot over the demo database:
   ```bash
   pg_restore --clean --if-exists --no-owner --dbname="<DEMO_DATABASE_URL>" arogyix-demo-ready.dump
   ```
3. Start the backend again.
4. Sign out of every Chrome profile (or clear the site data for your app in each profile). Old login tokens belong to the pre-restore state.
5. Run the **Post-reset checks** below.

### A3. If you re-record on a later date

The snapshot keeps its old dates. That's fine, with these things to check:
- The new recording day's **weekday** must be in the **Weekly Availability** of **both** Dr. Amit Patil and Dr. Sneha Kulkarni (Monday–Saturday in the demo data). If you record on a Sunday, change the date.
- If re-recording later, the Cetirizine batch must still be 1–30 days from expiry. For the planned recording day, Sat 10-10-2026, its expiry is 25-10-2026 (D+15).
- The warm-up history is now older. **Today's** numbers on dashboards will be low until the day's recordings add to them. Analytics "last 7 days" may look emptier. If that matters, top up with a short warm-up (`DEMO_DATA.md` §3) on the days just before recording.
- Update D, D+14 and D+30 in `DEMO_DATA.md` §0 and the date table at the top of `RECORDING_RUNBOOK.md` to the new dates. D+14 must also be a day Dr. Patil works.

---

## Method B: rebuild from scratch

Use this if you never took a snapshot, or the snapshot is lost. It takes 2–3 hours of setup, plus optional warm-up days.

1. Create a **new, empty** PostgreSQL database for the demo and put its address in `backend/.env` as `DATABASE_URL`.
2. In `backend/`:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```
   The seed creates the Super Admin, the hospital admin, the "Arogyix Clinic" hospital, plans and the master test list. It's safe to run again: it doesn't overwrite names you've changed, but it does reset the seeded accounts' passwords to `Password123!`.
3. Follow `DEMO_DATA.md` §8 steps 2–6 exactly, in order.
4. Optional but recommended: run the warm-up week (`DEMO_DATA.md` §3) so dashboards and charts have history. **Skip Sunday 4 Oct 2026**: no doctor has Sunday slots.
5. Take a snapshot now (Method A1), so next time you can use Method A.

---

## Method C: partial "same-day" retake without a reset

Only use this for a single scene that went wrong **before** its irreversible step, for example a typo while filling the Register Patient form, before clicking **Register Patient**. Reload the page and record the scene again.

After an irreversible step (see the table at the top), don't try to work around it with edits in the app. Use Method A.

The only workaround that is safe without a reset: if Rahul's registration take is bad **but** the rest of the day hasn't started, you can register the story patient under a fresh email (for example `rahul.sharma2@example.com`). His name, details and everything else stay the same. Note the new email in `DEMO_DATA.md` and use it for the Patient video login.

---

## Post-reset checks (tick all before recording)

- [ ] Backend and frontend are running, and `/login` loads.
- [ ] Hospital Admin signs in; the hospital is named **Arogyix Multispeciality Hospital** and shows its logo.
- [ ] **Departments**: Cardiology, General Medicine, Pediatrics. **No Orthopedics.**
- [ ] **Staff**: Priya Deshmukh, Dr. Amit Patil and Dr. Sneha Kulkarni active. **No Rohit Deshpande.**
- [ ] **Doctors**: Dr. Patil **and** Dr. Kulkarni both show **Monday–Saturday** (Saturday ticked) in Weekly Availability. If Saturday is missing, fix it in **Doctors → Edit** (`/dashboard/doctors/<id>/edit`) before recording.
- [ ] **Hospital Dashboard → Missed Follow-ups** shows **Sunita Rao**.
- [ ] **Patients**: searching "Rahul" finds **nothing**.
- [ ] **Medicines Catalog**: the six items from `DEMO_DATA.md` §2.
- [ ] **Pharmacies**: Wellness Pharmacy listed. **Pathology Labs**: CarePlus Diagnostics linked (Active).
- [ ] Pharmacy signs in: Low Stock ≥ 1, Expiring Soon ≥ 1, **Pending Rx = 0**. Inventory → Expiry shows Cetirizine **CTZ-2511-E, expiry 25-10-2026**.
- [ ] Lab signs in: test catalog imported; Sachin More in Collectors; no order for Rahul.
- [ ] Super Admin signs in: "Test Clinic Duplicate" pending; **no Sahyadri Care Clinic** request or tenant.
- [ ] `DEMO_DATA.md` §0 dates match the recording day: D = **10-10-2026**, D+14 = **24-10-2026**, D+30 = **09-11-2026**.
- [ ] All Chrome profiles signed out, then signed back in fresh.
- [ ] Chrome downloads configured and one PDF download tested per profile (`RECORDING_RUNBOOK.md` → Global setup).
