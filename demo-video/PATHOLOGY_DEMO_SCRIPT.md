# Video H — Pathology Lab Demo *(extra)*

> **⚠️ REFERENCE DOCUMENT — not the recording instructions.** **RECORD FROM `RECORDING_RUNBOOK.md` ONLY.** Where this file differs from the runbook, follow the runbook. Recording day: **Saturday 10 October 2026**.

This role (`PATHOLOGY`) is fully built in the app, including its own portal, and it completes the doctor → lab → patient loop. It wasn't in the original A–G list, so it's added here.

| | |
|---|---|
| **Duration** | 5:40 |
| **Target audience** | Diagnostic lab owners, lab managers and technicians |
| **Objective** | Take a hospital lab order from sample to verified, delivered report, and show walk-in orders, catalog, hospital links and revenue |
| **Starting screen** | `/login` |
| **Ending screen** | Lab Reports, with a cut to the patient's Reports showing the delivered report |
| **Main workflow** | Order → Mark Collected → Receive at Lab → Accept Sample → Start Processing → Save Results → Submit for Verification → Confirm & Verify → Deliver Report |
| **Must show** | My Lab dashboard, Orders queue + detail, result entry with flags (Critical is automatic), verification preview, Deliver Report, Hospital Links, Lab Reports |
| **Can skip** | Edit listing details, report amendment, email report, Collectors (a brief view is fine) |
| **Narration style** | Process-oriented. Emphasise traceability and verification |
| **Login used** | `careplus.lab@example.com` / `Demo@12345` |
| **Data** | `DEMO_DATA.md` §4 (lab order and results) and §6 |

**Before recording**
- Rahul's order (Lipid Profile + KFT) was placed by Dr. Patil in Video D, Scene 10.
- Optional, for Scene 05: log in as Kiran Pawar (Sahyadri Care Clinic, approved in Video F) → **Pathology Labs** → **Request Link** on CarePlus, so there's a **pending** link to approve.
- The test catalog has been imported and collector Sachin More added.

---

## Storyboard

### Scene 01 — Introduction
**Time:** 00:00–00:12 · *Story step 1*

- **Screen:** Title card
- **Purpose:** Introduce the role
- **User action:** None
- **On-screen action:** "Arogyix for Diagnostic Labs"
- **Voiceover:** "This video is for diagnostic labs. You'll see how orders arrive from partner hospitals, how each sample is tracked, and how verified reports reach the patient and the doctor automatically."
- **Highlight:** None
- **Transition:** Fade
- **Expected result:** The viewer knows the scope

**Recording checklist**
1. Title card only.

### Scene 02 — Login
**Time:** 00:12–00:22 · *Story step 2*

- **Screen:** Login
- **Purpose:** Show entry
- **User action:** Sign in
- **On-screen action:** My Lab dashboard
- **Voiceover:** "Your lab signs in on the same Arogyix login page."
- **Highlight:** None
- **Transition:** Cut
- **Expected result:** Logged in

**Recording checklist**
1. `/login` → `careplus.lab@example.com` → **Sign In**. The URL is `/dashboard/pathology-portal`.

### Scene 03 — Lab dashboard
**Time:** 00:22–00:55 · *Story step 3*

- **Screen:** My Lab
- **Purpose:** Workload overview
- **User action:** Hover the three stat groups and Pending Work
- **On-screen action:** Orders & Samples (Samples Pending Collection, Samples Received, Processing, Rejected Samples, Recollection Requested); Reports & Verification (Results Pending, Pending Verification, Critical, Reports Finalized Today, Delivered Today, Avg. Turnaround (TAT)); Revenue & Network
- **Voiceover:** "The dashboard is organised the way a lab works: samples waiting to be collected or received, work in progress, results waiting for verification, critical values, reports delivered today, and your average turnaround time. Pending Work lists each sample that needs attention."
- **Highlight:** Zoom on **Critical** and **Avg. Turnaround (TAT)**
- **Transition:** Hover the sidebar
- **Expected result:** The viewer sees the lab's day at a glance

**Recording checklist**
1. Hover each group for about 2 s. Scroll to **Pending Work**.

### Scene 04 — Menu
**Time:** 00:55–01:05 · *Story step 4*

- **Screen:** Sidebar
- **Purpose:** Show scope
- **User action:** Hover the menu
- **On-screen action:** Test Catalog, Hospital Links, Orders, Collectors, Lab Reports
- **Voiceover:** "From the menu, you manage your test catalog, hospital partnerships, orders, sample collectors and lab reports."
- **Highlight:** Menu glow
- **Transition:** Click **Hospital Links**
- **Expected result:** The viewer sees the scope of the role

**Recording checklist**
1. Hover from **Test Catalog** to **Lab Reports**.

### Scene 05 — Hospital links
**Time:** 01:05–01:30 · *Story step 7: Important features*

- **Screen:** Hospital Links
- **Purpose:** Partnership control
- **User action:** **Approve** Sahyadri Care Clinic's pending request
- **On-screen action:** The "Hospital link approved" toast; Arogyix Multispeciality Hospital already active
- **Voiceover:** "Hospitals ask to link with your lab. Once you approve, their doctors and staff can send you test orders. You stay in control, and can reject or revoke a link at any time."
- **Highlight:** The **Approve** button
- **Transition:** Click **Orders**
- **Expected result:** The viewer knows how hospital partners are managed

**Recording checklist**
1. Open `/dashboard/pathology-portal/links`.
2. Click **Approve** on Sahyadri Care Clinic. If you skipped that prep, just hover the active Arogyix link.

### Scene 06 — Receive the hospital order and the sample
**Time:** 01:30–02:25 · *Story step 5: Primary workflow (1/3)*

- **Screen:** Orders → order detail
- **Purpose:** Sample traceability
- **User action:** Open Rahul Sharma's order; click **Mark Collected — Assign Sample ID** (sample type and container); **Receive at Lab**; **Accept Sample**; **Start Processing**
- **On-screen action:** The Timeline fills in (Collected → Received at Lab); the Sample ID appears; the status moves to In Progress
- **Voiceover:** "Here's the order Dr. Patil placed for Rahul Sharma: a lipid profile and kidney function test. When the sample is collected, record it. Arogyix assigns a sample ID so the sample can be tracked. When it reaches the lab, mark it received and accept it. If a sample isn't usable, for example it's haemolysed or insufficient, you can reject it with a reason and request a recollection instead. Then start processing."
- **Highlight:** Zoom on the **Sample ID** and the order **Timeline**
- **Transition:** Scroll to the Tests section
- **Expected result:** Every sample step is time-stamped

**Recording checklist**
1. Open `/dashboard/pathology-portal/orders`. The **Active** tab shows Rahul's order. Open it.
2. Click **Mark Collected — Assign Sample ID** → Sample Type `Serum` → Container `SST (gold top)` → confirm.
3. Click **Receive at Lab** → **Accept Sample** → **Start Processing**. Pause about 1 s after each toast.
4. Hover **Reject Sample** (don't click it) while saying "if a sample isn't usable".

### Scene 07 — Enter results
**Time:** 02:25–03:20 · *Story step 5: Primary workflow (2/3)*

- **Screen:** Order detail → Tests → result editor
- **Purpose:** Result entry with safety checks
- **User action:** Enter the Lipid Profile values (and KFT), click **Save Results**
- **On-screen action:** The Flag column shows High for Total Cholesterol, LDL and Triglycerides (chosen from the Flag dropdown, which starts at Normal); the "Results saved" toast
- **Voiceover:** "Enter each result value. Units and reference ranges come from your test catalog. The technician marks each value normal, low, high or abnormal, and anything in the critical range is flagged critical automatically. For critical values, you can notify the referring doctor and record their acknowledgement, so there's a record that they were told."
- **Highlight:** Zoom on the **Flag** column; point at the text "Values outside a parameter's critical range are auto-flagged CRITICAL on save"
- **Transition:** Click **Submit for Verification**
- **Expected result:** The viewer sees built-in safety flags

**Recording checklist**
1. Under **Tests → Lipid Profile**, enter the values from `DEMO_DATA.md` §4. Use the pre-filled parameter names if they exist; otherwise **Add Row**.
2. Enter normal KFT values.
3. Click **Save Results**. Pause 2 s on the flags.
4. Don't use values that trip the critical range unless you want to show **Notify Doctor**.

### Scene 08 — Verify and deliver
**Time:** 03:20–04:10 · *Story step 5: Primary workflow (3/3)*

- **Screen:** Order detail → report preview
- **Purpose:** Pathologist sign-off and delivery
- **User action:** **Submit for Verification** → **Review & Verify** (preview) → **Confirm & Verify** → **Deliver Report**
- **On-screen action:** The report preview with lab branding; the "Report verified" and "Report delivered" toasts; the **Download** button
- **Voiceover:** "Submit the results for verification. The pathologist sees a preview of the final report exactly as it will be issued, and verifies it. Then click Deliver Report. For hospital orders, the report goes straight into the patient's record at the hospital, is added to their timeline, and both the patient and the doctor who ordered it are notified. You can also download, email or share the report. If a correction is needed later, the report can be amended, with a reason recorded."
- **Highlight:** Zoom on the preview; box the **Deliver Report** button
- **Transition:** Cut to a split screen of the patient's Reports page (optional)
- **Expected result:** The viewer sees results reach the patient with no paperwork

**Recording checklist**
1. Click **Submit for Verification**.
2. Click **Review & Verify**. Scroll the preview for 3 s. Click **Confirm & Verify**.
3. Click **Deliver Report**.
4. Click **Download** and show the PDF for 2 s.
5. Optional cut: Rahul's `/dashboard/reports` showing "Lab Report — LAB-2026-…".

### Scene 09 — Walk-in order
**Time:** 04:10–04:40 · *Story step 6: Secondary workflow*

- **Screen:** Orders → New Walk-in Order
- **Purpose:** Direct customers
- **User action:** Enter a new patient, pick CBC, choose Walk-in, create
- **On-screen action:** The "Walk-in order created" toast
- **Voiceover:** "Patients can also come to you directly. Create a walk-in order with the patient's details, pick the tests, and choose walk-in or home collection. If a doctor referred them, you can record the doctor and a commission percentage. From here, the order follows the same sample and report steps."
- **Highlight:** The Referring Doctor and Commission % fields
- **Transition:** Click **Test Catalog**
- **Expected result:** The viewer knows the lab isn't limited to hospital orders

**Recording checklist**
1. Orders → **New Walk-in Order** → **New Patient**: `Deepak Verma`, `9800000611`, DOB 02-02-1983, Male.
2. Search tests `CBC` → select. **Collection Type** Walk-in.
3. Create the order.

### Scene 10 — Test catalog and collectors
**Time:** 04:40–05:05 · *Story step 7*

- **Screen:** Test Catalog → Add Test; Collectors
- **Purpose:** Setup
- **User action:** Show the catalog; open **Add Test** and type "HbA1c" in "Import from master test list" (don't save); show Collectors
- **On-screen action:** Name, Department, Sample, Price, TAT, Params columns; master list suggestions
- **Voiceover:** "Your test catalog sets each test's price, sample type, turnaround time and reference parameters. Common tests can be imported from Arogyix's master list, so you don't have to type them in. Collectors are the staff who collect samples at the lab or at patients' homes."
- **Highlight:** The import search box
- **Transition:** Click **Lab Reports**
- **Expected result:** The viewer knows setup is quick

**Recording checklist**
1. Open `/dashboard/pathology-portal/tests`, then **Add Test** → type `HbA1c` → show the suggestions → **Cancel**.
2. Open `/dashboard/pathology-portal/collectors` for 2 s.

### Scene 11 — Lab reports and summary
**Time:** 05:05–05:40 · *Story steps 7–8*

- **Screen:** Lab Reports
- **Purpose:** Business view and wrap-up
- **User action:** Set From/To to this month
- **On-screen action:** Orders, Total Revenue, Hospital-linked Revenue, Walk-in Revenue; Referring Doctor Commissions
- **Voiceover:** "Lab Reports show your order volume and revenue, split between hospital and walk-in orders, your turnaround times, and commissions owed to referring doctors. With Arogyix, orders arrive digitally, every sample is traceable, and verified reports reach patients and doctors without delay."
- **Highlight:** The revenue split cards
- **Transition:** End card
- **Expected result:** The viewer understands the whole loop

**Recording checklist**
1. Open `/dashboard/pathology-portal/reports`. Set From/To. Hover the cards. Hold 3 s.

---

## Voiceover script (continuous)

> **[Intro]** This video is for diagnostic labs. You'll see how orders arrive from partner hospitals, how each sample is tracked, and how verified reports reach the patient and the doctor automatically.
>
> **[Login]** Your lab signs in on the same Arogyix login page.
>
> **[Dashboard]** The dashboard is organised the way a lab works: samples waiting to be collected or received, work in progress, results waiting for verification, critical values, reports delivered today, and your average turnaround time. Pending Work lists each sample that needs attention.
>
> **[Menu]** From the menu, you manage your test catalog, hospital partnerships, orders, sample collectors and lab reports.
>
> **[Links]** Hospitals ask to link with your lab. Once you approve, their doctors and staff can send you test orders. You stay in control, and can reject or revoke a link at any time.
>
> **[Sample]** Here's the order Dr. Patil placed for Rahul Sharma: a lipid profile and kidney function test. When the sample is collected, record it. Arogyix assigns a sample ID so the sample can be tracked. When it reaches the lab, mark it received and accept it. If a sample isn't usable, for example it's haemolysed or insufficient, you can reject it with a reason and request a recollection instead. Then start processing.
>
> **[Results]** Enter each result value. Units and reference ranges come from your test catalog. The technician marks each value normal, low, high or abnormal, and anything in the critical range is flagged critical automatically. For critical values, you can notify the referring doctor and record their acknowledgement, so there's a record that they were told.
>
> **[Verify and deliver]** Submit the results for verification. The pathologist sees a preview of the final report exactly as it will be issued, and verifies it. Then click Deliver Report. For hospital orders, the report goes straight into the patient's record at the hospital, is added to their timeline, and both the patient and the doctor who ordered it are notified. You can also download, email or share the report. If a correction is needed later, the report can be amended, with a reason recorded.
>
> **[Walk-in]** Patients can also come to you directly. Create a walk-in order with the patient's details, pick the tests, and choose walk-in or home collection. If a doctor referred them, you can record the doctor and a commission percentage. From here, the order follows the same sample and report steps.
>
> **[Catalog]** Your test catalog sets each test's price, sample type, turnaround time and reference parameters. Common tests can be imported from Arogyix's master list, so you don't have to type them in. Collectors are the staff who collect samples at the lab or at patients' homes.
>
> **[Summary]** Lab Reports show your order volume and revenue, split between hospital and walk-in orders, your turnaround times, and commissions owed to referring doctors. With Arogyix, orders arrive digitally, every sample is traceable, and verified reports reach patients and doctors without delay.
