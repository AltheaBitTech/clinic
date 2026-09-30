# Pathology Lab — Recording Script

> **⚠️ REFERENCE DOCUMENT — not the recording instructions.** **RECORD FROM `RECORDING_RUNBOOK.md` ONLY.** Where this file differs from the runbook, follow the runbook. Recording day: **Saturday 10 October 2026**.

**Video:** Arogyix for Diagnostic Labs
**Target length:** 3:45
**Clip prefix:** `LAB`
**Login:** `careplus.lab@example.com` / `Demo@12345`
**Demo data:** `DEMO_DATA.md` §4 (lab order and result values), §6 and §9

---

## The story

| | |
|---|---|
| **Who** | Dr. Anita Menon, pathologist and owner of CarePlus Diagnostics, a partner lab of Arogyix Multispeciality Hospital |
| **Why** | Hospital doctors send her test orders. She has to track every sample, enter results accurately, sign off each report, and get it back to the doctor and patient quickly |
| **Problem** | Paper test slips, samples that can't be traced, results typed into separate systems, and reports that reach the patient days late |
| **Action** | She picks up Dr. Patil's order for Rahul, records the sample from collection to processing, enters results, verifies the report and delivers it |
| **What happens next** | The report lands in Rahul's hospital record and timeline. Rahul and Dr. Patil are notified. Revenue and turnaround appear in her Lab Reports |

```
Dr. Patil orders Lipid Profile + KFT → order appears at CarePlus → sample collected (Sample ID)
   → received at lab → accepted → processing → results entered → submitted for verification
   → pathologist confirms & verifies → report delivered → Rahul's Reports + Timeline + notifications
```

> **Accuracy note on result flags.** The result editor has a **Flag** dropdown for each value, and it starts at **Normal**. The technician chooses **High** or **Low** where needed. The app **automatically** overrides the flag to **Critical** only when a value falls outside the test parameter's critical range. Don't narrate that High/Low is automatic.

---

## Video timeline

| Time | Scene | Section |
|---|---|---|
| 00:00–00:10 | 01 | Introduction |
| 00:10–00:20 | 02 | Login |
| 00:20–00:45 | 03 | My Lab dashboard |
| 00:45–01:05 | 04 | The hospital order arrives |
| 01:05–01:45 | 05 | Sample tracking |
| 01:45–02:30 | 06 | Result entry |
| 02:30–02:55 | 07 | Pathologist verification |
| 02:55–03:20 | 08 | Report delivery |
| 03:20–03:45 | 09 | Lab Reports and summary |

---

## Pre-recording checklist

| # | Item | Check |
|---|---|---|
| 1 | **Browser** | Google Chrome, the `Lab` profile. Extensions off, bookmarks bar hidden, password saving off |
| 2 | **URL** | `<your-app-url>/login` in a single tab |
| 3 | **Login account** | `careplus.lab@example.com` / `Demo@12345` |
| 4 | **Demo data** | `DEMO_DATA.md` §4 result table open off camera |
| 5 | **Browser zoom** | 110% |
| 6 | **Screen resolution** | 1920×1080, browser maximised |
| 7 | **Notifications disabled** | Do Not Disturb on, Chrome notifications off |
| 8 | **Clean browser** | One tab, download bar closed, page reloaded before the take |
| 9 | **No personal information** | Only demo values |
| 10 | **Required demo records** | CarePlus registered through the hospital's **Invite Pathology Lab** link, and the link is **Active**. Test catalog imported (Lipid Profile, KFT and others). Collector Sachin More added. **Rahul's order (Lipid Profile + KFT) is in the Active tab** (Doctor video Scene 10 done) |

---

## Recording sequence

Scene 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09

---

# Scene 01

## Duration
00:00 - 00:10

## Purpose
Introduce the lab role and link it to the story.

## User Role
None (title card)

## URL / Route
None. Title card over a blurred still of `/dashboard/pathology-portal`.

## Starting Screen
Title card

## Action
1. No live action.

## Demo Data
None

## Expected Result
The viewer knows this is the lab's side of Rahul's visit.

## Voiceover
"Dr. Patil has ordered blood tests for Rahul. Let's follow them through CarePlus Diagnostics."

## On-Screen Text
**Arogyix for Diagnostic Labs**
Subtitle: *Samples · Results · Verified reports*

## Cursor / Highlight
None

## Zoom
None

## Pause
Hold the full 10 seconds.

## Transition
Cross-fade (0.5 s) to the login page.

---

# Scene 02

## Duration
00:10 - 00:20

## Purpose
Show the lab sign-in.

## User Role
Pathology Lab

## URL / Route
`/login` → `/dashboard/pathology-portal`

## Starting Screen
Login page

## Action
1. Type `careplus.lab@example.com` in **Email address**.
2. Type the password.
3. Click **Sign In**.

## Demo Data
`careplus.lab@example.com` / `Demo@12345`

## Expected Result
The **My Lab** dashboard opens.

## Voiceover
"Dr. Anita Menon, the lab's pathologist, signs in to the lab's own workspace."

## On-Screen Text
Lower-third: **Dr. Anita Menon · CarePlus Diagnostics**

## Cursor / Highlight
Highlight **Sign In** before the click.

## Zoom
None

## Pause
1 second after load.

## Transition
Hard cut on load.

---

# Scene 03

## Duration
00:20 - 00:45

## Purpose
Show the lab's workload at a glance.

## User Role
Pathology Lab

## URL / Route
`/dashboard/pathology-portal`

## Starting Screen
**My Lab** dashboard

## Action
1. Hover the **Orders & Samples** group for 2 seconds.
2. Hover the **Reports & Verification** group for 2 seconds, pausing on **Pending Verification**.
3. Scroll down to **Pending Work**.

## Demo Data
Rahul's order.

## Expected Result
The groups show counts, and **Pending Work** lists Rahul's order.

## Voiceover
"The dashboard is organised the way a lab works: new orders and samples, results waiting for sign-off, critical values, and turnaround time. Pending Work shows exactly what needs attention next."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around **Orders & Samples**, then **Reports & Verification**, then **Pending Work**.

## Zoom
Zoom to 120% on each group.

## Pause
1 second on Pending Work.

## Transition
Click **Orders** in the sidebar. Hard cut.

---

# Scene 04

## Duration
00:45 - 01:05

## Purpose
Show the hospital order arriving digitally.

## User Role
Pathology Lab

## URL / Route
`/dashboard/pathology-portal/orders` → `/dashboard/pathology-portal/orders/<id>`

## Starting Screen
Orders, **Active** tab

## Action
1. On the **Active** tab, point at Rahul Sharma's order (from Arogyix Multispeciality Hospital).
2. Click it to open the order.
3. Pause on the patient, the ordering hospital and doctor, and the two tests.

## Demo Data
LO-01: Lipid Profile + Kidney Function Test (KFT), walk-in, referring doctor Dr. Amit Patil.

## Expected Result
The order detail shows Rahul Sharma, both tests, and the order **Timeline**.

## Voiceover
"Dr. Patil's order is already here, with the patient's details and both tests. There's no paper slip to lose or re-type."

## On-Screen Text
Feature title (3 s): **Lab Workflow**

## Cursor / Highlight
Cyan box around the tests list.

## Zoom
Zoom to 125% on the order header.

## Pause
1.5 seconds on the order header.

## Transition
Stay on the page. Continue into Scene 05.

---

# Scene 05

## Duration
01:05 - 01:45

## Purpose
Track the sample from collection to processing.

## User Role
Pathology Lab

## URL / Route
`/dashboard/pathology-portal/orders/<id>`

## Starting Screen
Order detail → **Register Sample Collection**

## Action
1. In **Register Sample Collection**, set **Sample Type** to `Blood` and **Container** to `SST (gold top)`.
2. Click **Mark Collected — Assign Sample ID**. Toast: "Sample registered as collected".
3. Click **Receive at Lab**. Toast: "Sample received at lab".
4. Hover **Reject Sample** without clicking it.
5. Click **Accept Sample**. Toast: "Sample accepted for processing".
6. Click **Start Processing**. Toast: "Processing started".

## Demo Data
Sample Type Blood, Container "SST (gold top)".

## Expected Result
A Sample ID appears. The **Timeline** records collected and received times. The order moves to processing.

## Voiceover
"When Rahul's blood is drawn, the sample gets its own ID, so it can be tracked at every step. It's received at the lab and accepted. If a sample isn't usable, it can be rejected with a reason and a recollection requested. Then processing starts."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around the Sample ID, then around the order **Timeline**.

## Zoom
Zoom to 130% on the Sample ID when it appears.

## Pause
About 1 second after each toast.

## Transition
Speed up steps 3–6 to 1.5× in the edit. Scroll down to **Tests**. Continue into Scene 06.

---

# Scene 06

## Duration
01:45 - 02:30

## Purpose
Enter results, with out-of-range values clearly flagged.

## User Role
Pathology Lab

## URL / Route
`/dashboard/pathology-portal/orders/<id>`

## Starting Screen
Order detail → **Tests** → result editor

## Action
1. Under **Tests**, on the **Lipid Profile** row, click **Enter Results**.
2. The parameter rows are pre-filled from the catalog. Enter a value in **every** row and set the **Flag** dropdown (it starts at Normal):
   - Total Cholesterol `228`, Flag **High**
   - Triglycerides `176`, Flag **High**
   - HDL Cholesterol `42`, Flag Normal
   - LDL Cholesterol `148`, Flag **High**
   - VLDL `35`, Flag Normal
   (If the rows aren't pre-filled, click **Add Row** for each and type the parameter name and unit.)
3. Point at the note "Values outside a parameter's critical range are auto-flagged CRITICAL on save, regardless of the flag chosen here."
4. Click **Save Results**. Toast: "Results saved".
5. On the **Kidney Function Test (KFT)** row, click **Enter Results**. Fill **every** row, all Normal: Blood Urea `28`, Serum Creatinine `0.9`, Uric Acid `5.6`, Sodium `139`, Potassium `4.2`, Chloride `102`. Click **Save Results**.
6. Click **Submit for Verification**. Toast: "Submitted for pathologist verification".

## Demo Data
`DEMO_DATA.md` §4, "Result values" and "KFT values".

## Expected Result
The saved results show **High** badges on Total Cholesterol, LDL and Triglycerides.

## Voiceover
"Results are entered against each test, with units and reference ranges. Values above the normal range are marked high, and anything in the critical range is flagged critical automatically, so it can't be missed. The results then go to the pathologist for sign-off."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around the **Flag** column after saving. Red box only if a Critical flag appears.

## Zoom
Zoom to 130% on the Flag column.

## Pause
2 seconds on the saved flags.

## Transition
Speed up typing in steps 2 and 5 to 2×. Continue into Scene 07.

---

# Scene 07

## Duration
02:30 - 02:55

## Purpose
Show the pathologist's sign-off on the final report.

## User Role
Pathology Lab

## URL / Route
`/dashboard/pathology-portal/orders/<id>`

## Starting Screen
Order detail → **Review & Verify** preview

## Action
1. Click **Review & Verify**.
2. Scroll the **Preview Report** for 3 seconds.
3. Tick **I have reviewed the results**.
4. Click **Confirm & Verify**. Toast: "Report verified".

## Demo Data
None

## Expected Result
The report status changes to Verified.

## Voiceover
"Dr. Menon previews the report exactly as it will be issued, confirms she has reviewed it, and verifies it. Nothing leaves the lab without a pathologist's sign-off."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around the preview, then **Confirm & Verify**.

## Zoom
Zoom to 120% on the preview.

## Pause
1 second after the toast.

## Transition
Continue into Scene 08.

---

# Scene 08

## Duration
02:55 - 03:20

## Purpose
Deliver the report back to the hospital and the patient.

## User Role
Pathology Lab

## URL / Route
`/dashboard/pathology-portal/orders/<id>`

## Starting Screen
Order detail (Verified)

## Action
1. Click **Deliver Report**. Toast: "Report delivered".
2. Click **Download** and show the report PDF for 2 seconds, then close it.

## Demo Data
LR-01.

## Expected Result
The order shows as delivered. The PDF opens with CarePlus branding and Rahul's results.

## Voiceover
"With one click the report is delivered. It goes straight into Rahul's hospital record and timeline, and both Rahul and Dr. Patil are notified."

## On-Screen Text
Short caption (3 s): *Delivered to Rahul's hospital record*

## Cursor / Highlight
Cyan box around **Deliver Report** before the click.

## Zoom
Zoom to 120% on the PDF.

## Pause
2 seconds on the PDF.

## Transition
Click **Lab Reports** in the sidebar. Hard cut.

---

# Scene 09

## Duration
03:20 - 03:45

## Purpose
Show the business view and close.

## User Role
Pathology Lab

## URL / Route
`/dashboard/pathology-portal/reports`

## Starting Screen
Lab Reports

## Action
1. Set **From** and **To** to this month.
2. Hover the order count and revenue cards (hospital-linked and walk-in revenue).
3. Park the cursor on the right.

## Demo Data
This month's orders, including Rahul's.

## Expected Result
The report reflects this month's orders and revenue.

## Voiceover
"Lab Reports show order volume, revenue from hospital and walk-in orders, and turnaround times. Orders arrive digitally, every sample is traceable, and verified results reach the doctor and patient the same day."

## On-Screen Text
End card: **Next: The Patient's View**

## Cursor / Highlight
Cyan box around the revenue cards.

## Zoom
Zoom to 120% on the revenue cards.

## Pause
3 seconds on the final frame.

## Transition
Fade to the end card (1 s).

---

## Post-recording checklist

- [ ] No accidental clicks (especially **Reject Sample**, **Cancel**, or amend)
- [ ] No personal information: only demo values
- [ ] No browser errors or red toasts ("Every result row needs a parameter name and value" means an empty row: remove it and re-save)
- [ ] No loading screens left in the cut
- [ ] No irrelevant screens
- [ ] No developer tools visible
- [ ] No console errors visible
- [ ] Cursor movement is smooth
- [ ] Narration matches the screen; nothing says High/Low flags are automatic
- [ ] Transitions are clean
