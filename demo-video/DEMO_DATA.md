# Arogyix — Demo Data

All data below is fictitious. Names are common Indian names and aren't based on real people. Emails use the reserved `example.com` domain, and phone numbers are in the unused `98000 00xxx` range. **Don't use real patient information.**

> **RECORD FROM `RECORDING_RUNBOOK.md` ONLY.** This file holds the values to type; the runbook holds the steps.

The only exception is the **self-signup patient** (optional, Patient video). That signup needs a real inbox you control, because the app emails a 6-digit code.

---

## 0. Dates and the recording day

The app has two rules that fix the calendar (see gaps G1 and G2 in the master plan):
- An appointment can't be booked in the past.
- An appointment can only be completed on its scheduled date, after a prescription exists.

So every date is relative to **D = the recording day**. **The recording day is Saturday 10 October 2026.**

| Token | Date | Weekday | Meaning / check |
|---|---|---|---|
| D | **10-10-2026** | Saturday | Recording day. Dr. Patil Mon–Sat ✅ · Dr. Kulkarni Mon–Sat ✅ · Dr. Deshpande Mon/Wed/Fri/Sat ✅ |
| D-7 | 03-10-2026 | Saturday | Warm-up day 1 |
| D-6 | 04-10-2026 | **Sunday** | **Skip. No doctor works Sundays, so there are no slots** |
| D-5 | 05-10-2026 | Monday | Sunita Rao's visit with Dr. Kulkarni; follow-up set for D-1 |
| D-4 … D-2 | 06-10-2026 … 08-10-2026 | Tue–Thu | Warm-up days |
| D-1 | 09-10-2026 | Friday | Last warm-up day; Sunita's (missed) follow-up date |
| D+14 | **24-10-2026** | Saturday | Follow-up date (Doctor 09) and Rahul's self-booking (Patient 07). **Dr. Patil must work Saturdays** |
| D+30 | **09-11-2026** | Monday | Prescription Valid Until (Doctor 07) |
| CTZ-2511-E expiry | **25-10-2026** | Sunday | D+15: inside the 30-day Expiring Soon window (§5) |

**Main appointment time:** the first free slot at least 60–90 minutes after you start recording the Receptionist video. The example uses **11:30 AM**, which fits 15-minute slots.

---

## 1. Accounts

Seeded accounts come from `npx prisma db seed`. Every seeded password is `Password123!`.

| Role | Name on screen | Login email | Password | How it's created |
|---|---|---|---|---|
| Super Admin | **Sameer Khan** (Arogyix platform operations) | `superadmin@Arogyix.health` | `Password123!` | Seed. Rename in **Settings → Personal Profile** |
| Hospital Admin | **Meera Joshi** | `admin@Arogyix.health` | `Password123!` | Seed. Rename in **Settings → Personal Profile** |
| Receptionist | **Priya Deshmukh** | `priya.deshmukh@example.com` | `Demo@12345` | Admin **Invite Staff** → Receptionist → open the link → Activate |
| Doctor | **Dr. Amit Patil** (Cardiology) | `amit.patil@example.com` | `Demo@12345` | Invite → Consulting Doctor → Activate → **Configure Doctor Profile** |
| Doctor | **Dr. Sneha Kulkarni** (General Medicine) | `sneha.kulkarni@example.com` | `Demo@12345` | Same as above |
| Doctor | **Dr. Rohit Deshpande** (Orthopedics) | `rohit.deshpande@example.com` | `Demo@12345` | Invited **live** in the Admin video. Activate the link off camera, then configure the profile live |
| Patient | **Rahul Sharma** | `rahul.sharma@example.com` | Temp password shown at registration | Registered **live** in the Receptionist video |
| Patient (self-signup) | **Neha Gupta** | *a real inbox you control* | `Demo@12345` | `/register` (optional, Patient video) |
| Pharmacy | **Wellness Pharmacy** (owner Suresh Kale) | `wellness.pharmacy@example.com` | `Demo@12345` | Hospital **Pharmacies → Invite Pharmacy** → complete the link |
| Pathology Lab | **CarePlus Diagnostics** (owner Dr. Anita Menon) | `careplus.lab@example.com` | `Demo@12345` | Hospital **Pathology Labs → Invite Pathology Lab** → complete the link |
| New hospital applicant | **Kiran Pawar**, Sahyadri Care Clinic | `kiran.pawar@example.com` | Temp password from the approval modal | Landing page form in the Staff video |
| Referral partner (optional) | **Rohan Kulkarni** | a real inbox you control | `Demo@12345` | `/register/referral` |

> The seeded doctor (`doctor@Arogyix.health`, "John", Cardiology), receptionist ("Jane") and patient ("Robert") can stay in the database. Keep them out of shot, or deactivate the seeded doctor and receptionist in **Staff** so the lists stay tidy.

---

## 2. Hospital: Arogyix Multispeciality Hospital

Enter in **Settings → Hospital Settings** while signed in as the Hospital Admin. This renames the seeded "Arogyix Clinic".

| Field | Value |
|---|---|
| Hospital / Clinic Name | Arogyix Multispeciality Hospital |
| Clinic Logo | Any simple placeholder logo (PNG under 2 MB) |
| Hospital Contact Email | contact.amh@example.com |
| Hospital Phone Number | 9800000100 |
| Branding Address | 42 Baner Road, Baner |
| City / State / Country | Pune / Maharashtra / India |

### Departments

| Department Name | Description | When |
|---|---|---|
| Cardiology | Heart and blood-pressure care, ECG and cardiac follow-up. | Prep |
| General Medicine | Fever, infections, diabetes and routine adult care. | Prep |
| **Orthopedics** | Bone, joint and spine care, fractures and sports injuries. | Created **live** in the Admin video |
| Pediatrics | Care for infants, children and adolescents. | Prep |

### Doctor profiles (Doctors → Configure Doctor Profile)

| Field | Dr. Amit Patil | Dr. Sneha Kulkarni |
|---|---|---|
| Specialization | Cardiologist | General Physician |
| Department | Cardiology | General Medicine |
| Qualifications | MBBS, MD (Medicine), DM (Cardiology) | MBBS, MD (Medicine) |
| Medical Reg No. | MMC-2011-45872 | MMC-2015-31204 |
| Experience (Years) | 14 | 9 |
| Consultation Fee (INR) | 800 | 500 |
| Slot Duration (Minutes) | 15 | 20 |
| Consultation Start / End (24h) | 10:00 / 17:00 | 09:00 / 14:00 |
| Weekly Availability | **Monday–Saturday (required).** The form starts at Mon–Fri: **tick Saturday**. D (10-10-2026) and D+14 (24-10-2026) are Saturdays | **Monday–Saturday (required).** Tick Saturday |
| Bio / Details | Consultant cardiologist focusing on hypertension and preventive heart care. | Physician for general adult medicine and chronic disease management. |

**Dr. Rohit Deshpande** (configured live in the Admin video): Orthopedic Surgeon · Orthopedics · MBBS, MS (Ortho) · MMC-2013-52290 · 12 years · fee ₹700 · 20-minute slots · 11:00–18:00 · Mon, Wed, Fri, Sat · "Orthopedic surgeon for joint pain, fractures and sports injuries."

### Medicines & Ointments Catalog (hospital)

These give the doctor autocomplete while writing a prescription. **The names must match the pharmacy catalog exactly** (gap G5).

| Type | Item Name | Default Dosage | Suggested Frequency | Suggested Timing |
|---|---|---|---|---|
| Medicine | Amlodipine 5mg | 1 tablet | Once daily (OD) | After Food (PC) |
| Medicine | Atorvastatin 10mg | 1 tablet | Before bed | After Food (PC) |
| Medicine | Pantoprazole 40mg | 1 tablet | Once daily (OD) | Before Food (AC) |
| Medicine | Paracetamol 500mg | 1 tablet | As needed (PRN) | After Food (PC) |
| Medicine | Cetirizine 10mg | 1 tablet | Before bed | After Food (PC) |
| Ointment | Mupirocin Ointment | Apply thin layer | Twice daily (BD) | After Washing/Cleaning the Skin |

Ointment names may contain **letters, spaces, apostrophes and hyphens only**. The app rejects digits or `%` in ointment names.

---

## 3. Patients

### Main patient, registered live in the Receptionist video

| Field | Value |
|---|---|
| First Name / Last Name | Rahul / Sharma |
| Email Address | rahul.sharma@example.com |
| Phone Number | 9800000201 |
| Notify patient on WhatsApp | Off (turn it on only if WhatsApp is configured) |
| Date of Birth | 12-03-1978 |
| Gender | Male |
| Blood Group | B+ |
| Residential Address / City | Flat 12, Sai Residency, Aundh / Pune |
| Emergency Contact Name / Relation / Phone | Anjali Sharma / Spouse / 9800000202 |
| Allergies (press Enter after each) | Penicillin |
| Chronic Conditions | Hypertension |
| Clinical Notes | Home BP readings around 150/95 over the last two weeks. Non-smoker. |

**Family member** (patient file → Family Members → **Link Member**): Anjali Sharma · Spouse · 9800000202 · Female · O+ · Allergies: none.

### Background patients (prep, so the lists aren't empty)

| Name | Email | Phone | DOB | Gender | Blood | City |
|---|---|---|---|---|---|---|
| Sunita Rao | sunita.rao@example.com | 9800000211 | 04-07-1985 | Female | O+ | Pune |
| Arjun Mehta | arjun.mehta@example.com | 9800000212 | 19-11-1992 | Male | A+ | Pune |
| Kavya Nair | kavya.nair@example.com | 9800000213 | 23-01-2001 | Female | AB+ | Pimpri-Chinchwad |
| Mohan Iyer | mohan.iyer@example.com | 9800000214 | 30-05-1960 | Male | B- | Pune |
| Fatima Shaikh | fatima.shaikh@example.com | 9800000215 | 15-09-1974 | Female | A- | Pune |

### Self-signup patient (optional, Patient video)

Neha Gupta · real inbox · phone 9800000221 · Hospital: *Arogyix Multispeciality Hospital* · password `Demo@12345`.

### Warm-up week (optional; fills dashboards and charts)

Because of gap G1, history can only be created on the day it happens. On each **working day** from D-7 to D-1 (Sat 3, Mon 5, Tue 6, Wed 7, Thu 8, Fri 9 Oct 2026), as the receptionist and a doctor. **Skip Sunday 4 Oct 2026 (D-6): no doctor works Sundays, so there are no slots.**

1. Book 2–3 background patients with Dr. Patil or Dr. Kulkarni.
2. Check them in, write a short prescription (for example Paracetamol 500mg, 3 days, "Viral fever"), and complete.
3. **Generate Bill**, then **Collect** on most of them. Leave one or two unpaid so "Payments Pending" isn't zero.
4. On **D-5 (Mon 05-10-2026)**, Dr. Kulkarni schedules a follow-up for Sunita Rao dated **D-1 (Fri 09-10-2026)**. By D it appears in **Missed Follow-ups**. **Don't book Sunita Rao with Dr. Kulkarni again** after D-5, or she drops off the list.
5. Mark one appointment **No Show** and cancel one with the reason "Patient request", so the Cancellation report has data.

---

## 4. Main appointment and consultation (Receptionist, Doctor, Master videos)

| Field | Value |
|---|---|
| Patient | Rahul Sharma |
| Doctor / Specialist | Dr. Amit Patil (Cardiology), fee ₹800 |
| Appointment Date | D = **10-10-2026** (Saturday) |
| Available Slot | 11:30 AM (or the first free slot) |
| Appointment Type | Regular Consultation |
| Reason for Visit | Chest discomfort on exertion and high BP readings at home for 2 weeks |
| Additional Notes | Brings home BP log. Known Penicillin allergy. |

**Clinical / Consultation Notes** (doctor, Appointment Details):
> BP 152/96 mmHg, pulse 84/min, SpO₂ 98%. Heart sounds normal, no murmur. Resting ECG in clinic: normal sinus rhythm. Start antihypertensive and statin; lifestyle counselling given.

*(Updated 30 Sep 2026: the notes now say the ECG was done in clinic, so the ₹300 "Resting ECG" invoice below is consistent with the story.)*

**Second open visit on D (optional, extended Receptionist cut only):** Arjun Mehta · Dr. Sneha Kulkarni · an earlier slot on D (e.g. 10:40) · General Checkup · "Fever and body ache for 2 days". Check in, then as Dr. Kulkarni write: Diagnosis "Viral fever", Paracetamol 500mg · 1 tablet · As needed (PRN) · 3 days · After Food (PC). **Don't** complete it. The short recording scripts (`*_RECORDING_SCRIPT.md`) don't need this visit.

### Prescription (Write New Prescription)

| Field | Value |
|---|---|
| Diagnosis / Assessment | Essential Hypertension (Stage 1) with borderline dyslipidemia |
| Prescription Valid Until | D+30 = **09-11-2026** |

| # | Medicine Name | Dosage | Frequency | Duration | Timing | Specific Instructions |
|---|---|---|---|---|---|---|
| 1 | Amlodipine 5mg | 1 tablet | Once daily (OD) | 30 days | After Food (PC) | Take at the same time every morning |
| 2 | Atorvastatin 10mg | 1 tablet | Before bed | 30 days | After Food (PC) | — |
| 3 | Pantoprazole 40mg | 1 tablet | Once daily (OD) | 14 days | Before Food (AC) | 30 minutes before breakfast |

- **Medicine Reminders:** keep the auto-scheduled times. You can add a custom time such as `08:30` to show the feature.
- **General Notes / Patient Instructions:** "Low-salt diet, 30-minute brisk walk daily, record BP twice a day. Review in 2 weeks with BP log. Seek care immediately if chest pain at rest."
- **Send to Pharmacy:** Wellness Pharmacy
- **Follow-up:** completing the visit opens the **Schedule Follow-up** form automatically → date D+14 = **24-10-2026** (Saturday; Dr. Patil works Saturdays) → notes "Review BP log and lipid report." → **Schedule**.

### Bill

| Field | Value |
|---|---|
| Consultation Fee (INR) | 800 (pre-filled from the doctor profile) |
| Discount (INR) | 0 |
| Billing Notes | Cardiology consultation |
| Payment | Collected at the desk with **Collect** (Receptionist video). ⚠️ Never **Check Out** at the desk: the doctor completes the visit |

**Second, unpaid invoice for Rahul (prep after the consultation, for Pay Now in the Patient video):** Billing → **Create Invoice** → Search Patient: Rahul Sharma · Select Consulting Doctor: Dr. Amit Patil · Amount (INR) 300 · Discount 0 · Tax (GST) 0 · Billing Notes / Remarks "Resting ECG" → **Generate Invoice**. Leave it **pending**.

### Lab order (Doctor and Pathology videos)

| Field | Value |
|---|---|
| Lab | CarePlus Diagnostics (link must be **ACTIVE**) |
| Patient | Rahul Sharma |
| Tests | Lipid Profile; Kidney Function Test (KFT) |
| Collection Type | Walk-in |
| Referring Doctor | Dr. Amit Patil |
| Notes | Collect sample today after consultation |

*(Updated 30 Sep 2026: the old note, "Fasting sample, 10–12 hours", contradicted the lab delivering the report on the same day.)*

**Doctor's chat message to Rahul (Doctor video, Chat scene):**
> Hello Rahul, please give your blood sample at CarePlus Diagnostics today, and bring your BP log to your follow-up visit.

**Rahul's reply (Patient video, Chat scene):**
> Thank you, Doctor. Can I take Amlodipine with my morning tea?

**Result values** (Lipid Profile, entered by the lab; choose the flag by hand):

| Parameter | Value | Unit | Ref Range | Expected flag |
|---|---|---|---|---|
| Total Cholesterol | 228 | mg/dL | < 200 | High |
| LDL Cholesterol | 148 | mg/dL | < 100 | High |
| HDL Cholesterol | 42 | mg/dL | > 40 | Normal |
| Triglycerides | 176 | mg/dL | < 150 | High |
| VLDL | 35 | mg/dL | 5–40 | Normal |

**KFT values** (all Normal):

| Parameter | Value | Unit | Ref Range |
|---|---|---|---|
| Blood Urea | 28 | mg/dL | 15–40 |
| Serum Creatinine | 0.9 | mg/dL | 0.6–1.3 |
| Uric Acid | 5.6 | mg/dL | 3.5–7.2 |
| Sodium | 139 | mEq/L | 135–145 |
| Potassium | 4.2 | mEq/L | 3.5–5.1 |
| Chloride | 102 | mEq/L | 98–107 |

*(Updated 30 Sep 2026: the seeded master tests pre-fill these exact parameter rows, including VLDL and the four extra KFT rows. **Every pre-filled row needs a value**, or saving fails with "Every result row needs a parameter name and value". The **Flag** dropdown starts at Normal for every row; choose **High** by hand for the three high lipid values. Only Critical is applied automatically, and the seeded parameters have no critical ranges.)*

---

## 5. Pharmacy: Wellness Pharmacy

### Invite details (entered by the pharmacy on the registration link)

| Field | Value |
|---|---|
| Pharmacy Name | Wellness Pharmacy |
| Owner / Manager Name | Suresh Kale |
| License / Registration Number | PH-MH-2024-01877 |
| Phone Number / Email | 9800000301 / wellness.pharmacy@example.com |
| Street Address | Shop 3, Sai Plaza, Baner Road |
| City / State / Pincode | Pune / Maharashtra / 411045 |
| Opening / Closing Time | 08:00 / 22:00 |
| Home Delivery Available | On |
| Additional Notes | Accepts digital prescriptions from Arogyix Multispeciality Hospital. |
| Your First / Last Name | Suresh / Kale |
| Password | Demo@12345 |

### Supplier

| Field | Value |
|---|---|
| Name | Shree Ganesh Pharma Distributors |
| Phone | 9800000401 |
| Email | orders.sgpd@example.com |
| GSTIN | 27ABCDE1234F1Z5 (dummy) |
| License No. | DL-MH-2023-00451 |
| Address | Unit 7, Market Yard, Pune 411037 |

### Pharmacy Medicine Catalog (prices per unit)

| Name (exact) | Generic Name | Form | Strength | MRP | Sale Price | Reorder Level | Requires Rx |
|---|---|---|---|---|---|---|---|
| Amlodipine 5mg | Amlodipine Besylate | Tablet | 5mg | 3.00 | 2.70 | 100 | Yes |
| Atorvastatin 10mg | Atorvastatin Calcium | Tablet | 10mg | 6.50 | 5.90 | 100 | Yes |
| Pantoprazole 40mg | Pantoprazole Sodium | Tablet | 40mg | 7.50 | 6.80 | 100 | Yes |
| Paracetamol 500mg | Paracetamol | Tablet | 500mg | 1.20 | 1.10 | 200 | No |
| Cetirizine 10mg | Cetirizine Hydrochloride | Tablet | 10mg | 2.00 | 1.80 | 100 | No |
| Mupirocin Ointment | Mupirocin | Ointment | 2% | 95.00 | 88.00 | 10 | Yes |

### Opening stock (Inventory → Adjust Stock → Add New Batch, Reason "Opening stock entry")

| Medicine | Batch No. | Qty | Mfg. Date | Expiry Date | Purchase Price | GST % |
|---|---|---|---|---|---|---|
| Amlodipine 5mg | AML-2608-A | 300 | 01-08-2026 | 31-07-2028 | 1.60 | 12 |
| Atorvastatin 10mg | ATV-2607-B | 60 | 01-07-2026 | 30-06-2028 | 3.40 | 12 |
| Pantoprazole 40mg | PAN-2606-C | 250 | 01-06-2026 | 31-05-2028 | 3.90 | 12 |
| Paracetamol 500mg | PCM-2605-D | 500 | 01-05-2026 | 30-04-2029 | 0.55 | 12 |
| Cetirizine 10mg | CTZ-2511-E | 40 | 01-11-2025 | **25-10-2026** (D+15) | 0.90 | 12 |

Atorvastatin at 60 (below its reorder level of 100) shows up as **Low Stock**. Cetirizine expiring within 30 days of D shows up as **Expiring Soon**. That's deliberate: both give the dashboard something to show.

- **Cetirizine expiry = D+15 = 25-10-2026** for the recording day Sat 10-10-2026. The app counts a batch as expiring only within 30 days, so a later date (for example 30-11-2026) would leave **Expiring Soon = 0**.
- If the stock was already entered with another expiry, add the batch again with expiry 25-10-2026 through **Inventory → Adjust Stock → Add New Batch** before taking the snapshot. Keep the batch number CTZ-2511-E so the POS step is unchanged.

**Dispensing Rahul's prescription:** enter Dispense Qty **`1` for each medicine** (Amlodipine 1, Atorvastatin 1, Pantoprazole 1). The pharmacy receives every item with Qty 1, so Remaining becomes 0. Never enter 30 / 30 / 14. Atorvastatin stays Low Stock (59).

### Purchase order (optional: only for the extended Pharmacy cut in `PHARMACY_DEMO_SCRIPT.md`; the short `PHARMACY_RECORDING_SCRIPT.md` doesn't create a PO)

| Field | Value |
|---|---|
| Supplier | Shree Ganesh Pharma Distributors |
| Order No. | PO-2026-0012 |
| Order Date | D |
| Invoice No. / Invoice Date | SGPD/26/4471 / D |

| Name of Product | Batch No. | Expiry | Qty | Free | Rate | MRP | GST % | HSN | Pack |
|---|---|---|---|---|---|---|---|---|---|
| Atorvastatin 10mg | ATV-2609-F | 31-08-2028 | 200 | 20 | 3.40 | 6.50 | 12 | 30049099 | 10x10 |
| Cetirizine 10mg | CTZ-2609-G | 31-08-2028 | 100 | 0 | 0.90 | 2.00 | 12 | 30049099 | 10x10 |

### Walk-in POS sale (Pharmacy video)

| Field | Value |
|---|---|
| Customer | **+ New** → Vikram Joshi · 9800000501 |
| Items | Paracetamol 500mg × 10; Cetirizine 10mg × 10 |
| Payment | Add Payment → UPI → **Fill Full Balance**. Reference No. `UPI-DEMO-78421` |

---

## 6. Pathology Lab: CarePlus Diagnostics

| Field | Value |
|---|---|
| Lab Name | CarePlus Diagnostics |
| Owner / Manager | Dr. Anita Menon |
| License / Registration No. | PL-MH-2022-00931 |
| Accreditation No. | NABL-DEMO-4521 (dummy) |
| Phone / Email | 9800000601 / careplus.lab@example.com |
| Address | 2nd Floor, Orchid Complex, Aundh Road, Pune 411007 |
| Hours | 07:00 / 21:00 |
| Home Sample Collection | On · Home Collection Fee ₹150 |
| Collector | Sachin More · 9800000602 |
| Test Catalog (import from master list; names as seeded) | Complete Blood Count (CBC) ₹350; Lipid Profile ₹600; Kidney Function Test (KFT) ₹700; HbA1c (Glycated Hemoglobin) ₹550; Thyroid Profile (T3, T4, TSH) ₹650 |
| Walk-in order (extended Pathology cut only) | Patient: Deepak Verma · 9800000611 · DOB 02-02-1983 · Male. Test: CBC. Walk-in. Discount ₹0 |

---

## 7. Platform data (Staff video)

### New hospital request (landing page → Register Your Clinic / Hospital)

| Field | Value |
|---|---|
| Plan card | Professional (landing page cards: Free Trial, Professional, Enterprise) |
| Clinic / Hospital Name | Sahyadri Care Clinic |
| Admin First / Last Name | Kiran / Pawar |
| Admin Email Address | kiran.pawar@example.com |
| Phone Number | 9800000701 |
| Street / City / State | 18 College Road / Nashik / Maharashtra |
| Referral Code | (leave blank, or the code from the referral partner) |

A second request to **Reject** (prep): "Test Clinic Duplicate", admin `duplicate.test@example.com`.

### Referral partner (optional appendix)

Rohan Kulkarni · 9800000801 · Kothrud, Pune · Payout: UPI `rohan.demo@upi` (dummy) · KYC: a sample image watermarked "SAMPLE — NOT A REAL ID". **Never upload a real ID.**

---

## 8. Setup order (dependency chain)

1. `npx prisma db seed` (Super Admin, hospital, plans, master tests).
2. **HA**: rename the hospital, branding, profile name → departments (except Orthopedics, which is live in the Admin video) → catalog → invite the receptionist and both doctors → activate each link (use an incognito window) → configure both doctor profiles with **Weekly Availability Monday–Saturday** (tick Saturday for Dr. Patil **and** Dr. Kulkarni).
3. **HA**: Invite Pharmacy → complete as Wellness Pharmacy. Invite Pathology Lab → complete as CarePlus.
4. **Pharmacy**: supplier → catalog → opening stock (Cetirizine CTZ-2511-E expiry **25-10-2026**).
5. **Lab**: import tests → add collector.
6. **Receptionist**: background patients. Warm-up week Sat 3 – Fri 9 Oct 2026, **skipping Sunday 4 Oct**.
7. On **D = Sat 10 Oct 2026**, follow `QUICK_RECORDING_ORDER.md` and record from `RECORDING_RUNBOOK.md` only.

---

## 9. Demo record register (for the recording scripts)

This section lists every record the `*_RECORDING_SCRIPT.md` files rely on, in one place. The detailed field values are in the sections above; this register says **what each record is for** and **how it relates to the others**.

**IDs.** The app generates its own IDs, codes and numbers (patient codes like `P12345678`, invoice numbers, `LAB-2026-…` report numbers, pharmacy sale numbers). You can't choose them. The **Ref** column below is a label for this plan only. It never appears in the app. When a script says "read the code off the screen", that's why.

### 9.1 The demo cast (use these names everywhere)

| Ref | Name on screen | Role in the app | Organisation | Appears in |
|---|---|---|---|---|
| U-SA | Sameer Khan | Super Admin | Arogyix (platform) | Staff video |
| U-HA | Meera Joshi | Hospital Admin | Arogyix Multispeciality Hospital | Admin, Master |
| U-REC | Priya Deshmukh | Receptionist | Arogyix Multispeciality Hospital | Receptionist, Master |
| U-DOC1 | Dr. Amit Patil | Doctor (Cardiology) | Arogyix Multispeciality Hospital | Doctor, Master, Patient |
| U-DOC2 | Dr. Sneha Kulkarni | Doctor (General Medicine) | Arogyix Multispeciality Hospital | Background only |
| U-DOC3 | Dr. Rohit Deshpande | Doctor (Orthopedics) | Arogyix Multispeciality Hospital | Admin (invited live) |
| U-PHA | Suresh Kale | Pharmacy (owner / pharmacist) | Wellness Pharmacy | Pharmacy, Master |
| U-LAB | Dr. Anita Menon | Pathology Lab (owner / pathologist) | CarePlus Diagnostics | Pathology, Master |
| U-PAT | Rahul Sharma | Patient | Arogyix Multispeciality Hospital | Every hospital-side video |
| U-APP | Kiran Pawar | New hospital applicant → Hospital Admin | Sahyadri Care Clinic | Staff video |

> The brief suggested "Neha Joshi" as the pharmacist. The existing data already uses **Suresh Kale** for Wellness Pharmacy (and "Neha Gupta" is the self-signup patient, "Meera Joshi" the admin), so Suresh Kale is kept to avoid two similar names on screen.

### 9.2 Initial data (must exist before recording day)

| Ref | Record | Type | Relationship | Purpose in the demo |
|---|---|---|---|---|
| T-01 | Arogyix Multispeciality Hospital | Tenant (hospital) | Home of every hospital user and patient | The hospital in every video |
| T-02 | Wellness Pharmacy | Tenant (pharmacy), registered via the hospital's **Invite Pharmacy** link | Linked to T-01, so doctors can **Send to Pharmacy** | Receives Rahul's prescription |
| T-03 | CarePlus Diagnostics | Tenant (lab), registered via **Invite Pathology Lab** | Link to T-01 is **Active** | Receives Rahul's lab order |
| T-04 | Test Clinic Duplicate | Pending hospital request | None | The **Reject** example in the Staff video |

### 9.3 Departments

| Ref | Name | Relationship | Purpose |
|---|---|---|---|
| DEP-01 | Cardiology | Dr. Amit Patil | Rahul's consultation |
| DEP-02 | General Medicine | Dr. Sneha Kulkarni | Background appointments |
| DEP-03 | Pediatrics | None | Makes the list look real |
| DEP-04 | Orthopedics | Dr. Rohit Deshpande | **Created live** in the Admin video. Must not exist beforehand |

### 9.4 Doctors

| Ref | Name | Department | Fee | Slots | Hours | Days | Purpose |
|---|---|---|---|---|---|---|---|
| DOC-01 | Dr. Amit Patil | Cardiology | ₹800 | 15 min | 10:00–17:00 | **Mon–Sat (Saturday required)** | Treats Rahul on Sat 10-10-2026; follow-up Sat 24-10-2026 |
| DOC-02 | Dr. Sneha Kulkarni | General Medicine | ₹500 | 20 min | 09:00–14:00 | **Mon–Sat (Saturday required)** | Warm-up visits, Missed Follow-ups data |
| DOC-03 | Dr. Rohit Deshpande | Orthopedics | ₹700 | 20 min | 11:00–18:00 | Mon, Wed, Fri, Sat | Invited and configured live (Admin video) |

### 9.5 Receptionists, pharmacy users, pathology users

| Ref | Name | Login | Relationship | Purpose |
|---|---|---|---|---|
| U-REC | Priya Deshmukh | `priya.deshmukh@example.com` | Staff of T-01 | Registers, books, checks in, bills Rahul |
| U-PHA | Suresh Kale | `wellness.pharmacy@example.com` | Owner of T-02 | Verifies and dispenses Rahul's prescription |
| U-LAB | Dr. Anita Menon | `careplus.lab@example.com` | Owner of T-03 | Processes, verifies and delivers Rahul's lab report |
| COL-01 | Sachin More | (no login; a collector record) | Collector at T-03 | Makes the Collectors list non-empty |

### 9.6 Patients

| Ref | Name | Created | Relationship | Purpose |
|---|---|---|---|---|
| PAT-01 | **Rahul Sharma** | **Live**, Receptionist video | Main patient. Penicillin allergy, hypertension | The single story patient in every video |
| PAT-01F | Anjali Sharma | Optional, Link Member | Rahul's spouse and emergency contact | Only in extended cuts |
| PAT-02…06 | Sunita Rao, Arjun Mehta, Kavya Nair, Mohan Iyer, Fatima Shaikh | Prep | Background patients | Fill lists, charts and queues |
| PAT-07 | Neha Gupta | Optional, self-signup | Separate real inbox | Only if you record the optional self-signup |
| LAB-PAT-01 | Deepak Verma | Optional, lab walk-in | CarePlus walk-in customer | Only in the extended Pathology cut |
| POS-01 | Vikram Joshi | Live, Pharmacy video | Pharmacy counter customer | The POS sale example |

### 9.7 Appointments

| Ref | Patient | Doctor | When | Status at the end of D | Purpose |
|---|---|---|---|---|---|
| APT-01 | Rahul Sharma | Dr. Amit Patil | 10-10-2026, 11:30 AM (or first free slot ≥ 60 min after you start) | Completed by the doctor, follow-up 24-10-2026 set | The story visit |
| APT-02 | Rahul Sharma | Dr. Amit Patil | 24-10-2026 (Saturday), first free slot | Scheduled | Booked by Rahul himself in the Patient video |
| APT-W… | Background patients | Dr. Patil / Dr. Kulkarni | 03-10-2026 … 09-10-2026, **not Sunday 04-10-2026** | Completed / No Show / Cancelled | Warm-up history for charts and reports |
| APT-FU | Sunita Rao | Dr. Sneha Kulkarni | 05-10-2026, follow-up set for 09-10-2026 | Completed, follow-up missed | Makes **Missed Follow-ups** non-empty |

### 9.8 Prescriptions, medicines and inventory

| Ref | Record | Relationship | Purpose |
|---|---|---|---|
| RX-01 | Rahul's prescription: Amlodipine 5mg, Atorvastatin 10mg, Pantoprazole 40mg; valid until 09-11-2026; sent to Wellness Pharmacy; dispensed **1 unit per item** | APT-01 → T-02 Rx Queue | The core handoff from doctor to pharmacy |
| CAT-H | Hospital Medicines & Ointments Catalog (6 items, §2) | Names identical to CAT-P | Autocomplete while prescribing |
| CAT-P | Pharmacy Medicine Catalog (6 items, §5) | Names identical to CAT-H | Automatic matching in the Rx Queue |
| INV-01…05 | Opening stock batches (§5) | In T-02 | FEFO dispensing; Atorvastatin shows **Low Stock**, Cetirizine (expiry 25-10-2026) shows **Expiring Soon** |
| SUP-01 | Shree Ganesh Pharma Distributors | Supplier of T-02 | Makes Suppliers non-empty |

### 9.9 Bills

| Ref | Invoice | Amount | Created by | Status at end of D | Purpose |
|---|---|---|---|---|---|
| INV-H01 | Consultation, Dr. Amit Patil | ₹800 | Receptionist, **Generate Bill** (live) | Paid (**Collect**, live) | The billing story |
| INV-H02 | Resting ECG | ₹300 | Receptionist, **Create Invoice** (prep, off camera, after the consultation) | Pending → Paid if Razorpay test mode is used | **Pay Now** in the Patient video |
| SALE-01 | Pharmacy POS: Paracetamol 500mg ×10, Cetirizine 10mg ×10 | Calculated | Pharmacy, live | Paid (UPI) | Counter-sale example |

### 9.10 Reports

| Ref | Record | Relationship | Purpose |
|---|---|---|---|
| LO-01 | Lab order: Lipid Profile + KFT, CarePlus, walk-in | Placed by Dr. Patil for Rahul (live) | The hospital-to-lab handoff |
| LR-01 | Lab report `LAB-2026-…` (number generated by the app) | Delivered by CarePlus into Rahul's Reports and Timeline | Shows results reaching the patient |
| RPT-OPS | Hospital Reports panel (Revenue Report, Appointment Report) | Built from the day's data | Admin and Master closing scenes |

### 9.11 What changed in this file on 30 Sep 2026

- The Super Admin now has a demo display name, **Sameer Khan**.
- The consultation notes say the ECG was done in clinic, so the ₹300 "Resting ECG" invoice fits the story.
- The lab-order note and the doctor's chat message no longer say "fasting / tomorrow", because the lab delivers the report on the same day.
- Arjun Mehta's open visit and the purchase order PO-2026-0012 are now **optional**. Only the longer `*_DEMO_SCRIPT.md` cuts use them.
- Lab result values were added for **every** parameter row the seeded tests pre-fill (VLDL; Uric Acid, Sodium, Potassium, Chloride), and the note now says High/Low flags are chosen by hand.
- Section 9 (this register) was added.

**Final validation fixes (30 Sep 2026):**
- Recording day fixed as **Saturday 10 October 2026**; §0 dates recomputed (D+14 = 24-10-2026, D+30 = 09-11-2026).
- Cetirizine CTZ-2511-E expiry changed from 30-11-2026 to **25-10-2026** (D+15), so it shows as Expiring Soon.
- Dr. Patil and Dr. Kulkarni: Weekly Availability **Monday–Saturday is required**.
- Warm-up week skips **Sunday 4 Oct 2026**; Sunita Rao must not be re-booked with Dr. Kulkarni.
- Dispense quantity for Rahul's prescription is **1 per medicine**.
- Old video letters (A–H) replaced by video names; §8 step 7 points to `QUICK_RECORDING_ORDER.md`.

To reset everything before a re-recording, see `DEMO_DATA_RESET.md`.
