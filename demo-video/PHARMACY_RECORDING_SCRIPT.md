# Pharmacy — Recording Script

> **⚠️ REFERENCE DOCUMENT — not the recording instructions.** **RECORD FROM `RECORDING_RUNBOOK.md` ONLY.** Where this file differs from the runbook, follow the runbook. Recording day: **Saturday 10 October 2026**.

**Video:** Arogyix for Pharmacies
**Target length:** 3:55
**Clip prefix:** `PHA`
**Login:** `wellness.pharmacy@example.com` / `Demo@12345`
**Demo data:** `DEMO_DATA.md` §5 and §9

---

## The story

| | |
|---|---|
| **Who** | Suresh Kale, owner and pharmacist at Wellness Pharmacy, a partner pharmacy of Arogyix Multispeciality Hospital |
| **Why** | He fills hospital prescriptions and serves walk-in customers. He needs to know what's in stock, what's expiring, and what's been sold |
| **Problem** | Handwritten prescriptions that are hard to read, stock that runs out unnoticed, expired batches on the shelf, and no clear record of what went where |
| **Action** | He receives Rahul's prescription digitally, verifies it, dispenses it from the right batch, checks his stock, and bills a walk-in customer at the counter |
| **What happens next** | Stock goes down batch by batch, every movement is in the ledger, low-stock and expiry alerts update, and sales flow into his reports |

```
Dr. Patil sends the prescription → it appears in Wellness Pharmacy's Rx Queue
   → Suresh verifies it → dispenses (stock taken from the batch that expires first)
   → ledger updated → separately: counter sale for a walk-in customer → reports
```

> **Honesty note.** Dispensing a hospital prescription reduces stock but does **not** create a pharmacy bill. Counter billing is shown separately with a walk-in customer. Don't narrate "dispense and bill", and don't ring up Rahul's medicines in the POS as well (stock would be deducted twice).

---

## Video timeline

| Time | Scene | Section |
|---|---|---|
| 00:00–00:10 | 01 | Introduction |
| 00:10–00:20 | 02 | Login |
| 00:20–00:45 | 03 | My Pharmacy dashboard |
| 00:45–01:25 | 04 | Receive and verify the prescription |
| 01:25–01:55 | 05 | Dispense |
| 01:55–02:35 | 06 | Inventory |
| 02:35–03:20 | 07 | Counter sale (POS) |
| 03:20–03:40 | 08 | Reports |
| 03:40–03:55 | 09 | Summary |

---

## Pre-recording checklist

| # | Item | Check |
|---|---|---|
| 1 | **Browser** | Google Chrome, the `Pharmacy` profile. Extensions off, bookmarks bar hidden, password saving off |
| 2 | **URL** | `<your-app-url>/login` in a single tab |
| 3 | **Login account** | `wellness.pharmacy@example.com` / `Demo@12345` |
| 4 | **Demo data** | `DEMO_DATA.md` §5 (catalog, stock, POS sale) open off camera |
| 5 | **Browser zoom** | 110% |
| 6 | **Screen resolution** | 1920×1080, browser maximised |
| 7 | **Notifications disabled** | Do Not Disturb on, Chrome notifications off |
| 8 | **Clean browser** | One tab, download bar closed, page reloaded before the take |
| 9 | **No personal information** | Only demo values; Vikram Joshi's phone is `9800000501` |
| 10 | **Required demo records** | Wellness Pharmacy registered through the hospital's **Invite Pharmacy** link. Supplier, 6 catalog items and opening stock entered. **Rahul's prescription is in the Pending tab** (Doctor video Scene 07 done) and all three medicines are already matched (no "Select medicine…" dropdowns). Atorvastatin shows Low Stock; Cetirizine shows Expiring Soon |

---

## Recording sequence

Scene 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09

---

# Scene 01

## Duration
00:00 - 00:10

## Purpose
Introduce the pharmacy role and link it to the story.

## User Role
None (title card)

## URL / Route
None. Title card over a blurred still of `/dashboard/pharmacy-portal`.

## Starting Screen
Title card

## Action
1. No live action.

## Demo Data
None

## Expected Result
The viewer knows this is the pharmacy's side of Rahul's visit.

## Voiceover
"Dr. Patil has sent Rahul's prescription to Wellness Pharmacy. Here's what happens next."

## On-Screen Text
**Arogyix for Pharmacies**
Subtitle: *Prescriptions · Stock · Counter sales*

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
Show the pharmacy sign-in.

## User Role
Pharmacy

## URL / Route
`/login` → `/dashboard/pharmacy-portal`

## Starting Screen
Login page

## Action
1. Type `wellness.pharmacy@example.com` in **Email address**.
2. Type the password.
3. Click **Sign In**.

## Demo Data
`wellness.pharmacy@example.com` / `Demo@12345`

## Expected Result
The **My Pharmacy** dashboard opens.

## Voiceover
"Suresh, the pharmacist, signs in to his own pharmacy workspace."

## On-Screen Text
Lower-third: **Suresh Kale · Wellness Pharmacy**

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
Show what needs the pharmacist's attention today.

## User Role
Pharmacy

## URL / Route
`/dashboard/pharmacy-portal`

## Starting Screen
**My Pharmacy** dashboard

## Action
1. Hover the four cards, 1 second each: **Low Stock**, **Expiring Soon**, **Pending Rx**, **Today's Sales**.
2. Park the cursor on **Pending Rx**.

## Demo Data
Opening stock (Atorvastatin low; Cetirizine CTZ-2511-E expiring 25-10-2026). Rahul's pending prescription.

## Expected Result
Low Stock ≥ 1, Expiring Soon ≥ 1, Pending Rx = 1.

## Voiceover
"His dashboard shows what needs attention: medicines running low, batches close to expiry, and prescriptions waiting from the hospital. One new prescription has just arrived."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around the four cards, then a stronger box on **Pending Rx**.

## Zoom
Zoom to 130% on the four cards.

## Pause
1.5 seconds on **Pending Rx**.

## Transition
Click **Rx Queue** in the sidebar. Hard cut.

---

# Scene 04

## Duration
00:45 - 01:25

## Purpose
Show the hospital prescription arriving digitally and being verified.

## User Role
Pharmacy

## URL / Route
`/dashboard/pharmacy-portal/prescriptions` → `/dashboard/pharmacy-portal/prescriptions/<id>`

## Starting Screen
Rx Queue, **Pending** tab

## Action
1. On the **Pending** tab, point at Rahul Sharma's row.
2. Click the row to open it.
3. Pause on **Diagnosis**, **Advice** and the **Items** table (Medicine, Dosage, Qty, Remaining, **Catalog Medicine**).
4. Click **Verify Prescription**.

## Demo Data
RX-01 (Amlodipine 5mg, Atorvastatin 10mg, Pantoprazole 40mg).

## Expected Result
The "Prescription verified" toast appears. The status changes to Verified.

## Voiceover
"Rahul's prescription is already here. No paper, no guessing at handwriting. Suresh sees the diagnosis, the doctor's advice, and each medicine, already matched to his own catalog. He checks it and verifies it."

## On-Screen Text
Feature title (3 s): **Pharmacy Management**

## Cursor / Highlight
Cyan box around the **Items** table, then the **Catalog Medicine** column.

## Zoom
Zoom to 130% on the Items table.

## Pause
2 seconds on the Items table before verifying. 1 second after the toast.

## Transition
Stay on the page. Continue into Scene 05.

> If any row shows a "Select medicine…" dropdown, the names don't match between the hospital and pharmacy catalogs. Stop, fix the data, and have the doctor re-send.

---

# Scene 05

## Duration
01:25 - 01:55

## Purpose
Dispense the medicines and show stock being taken from the right batch.

## User Role
Pharmacy

## URL / Route
`/dashboard/pharmacy-portal/prescriptions/<id>`

## Starting Screen
Prescription detail (Verified)

## Action
1. In **Dispense Qty**, enter `1` for each medicine: Amlodipine `1`, Atorvastatin `1`, Pantoprazole `1`. **Never 30 / 30 / 14.**
2. Click **Dispense Selected Items**.
3. Wait for the "Prescription dispensed" toast.
4. Go back to the Rx Queue and click the **Dispensed** tab to show Rahul's row there.

## Demo Data
Quantity 1 per medicine. The pharmacy receives each forwarded item with Qty 1, so a larger number would leave a negative Remaining.

## Expected Result
The status becomes Dispensed. **Remaining** drops to 0. The row moves to the **Dispensed** tab.

## Voiceover
"He enters the quantities and dispenses. Arogyix takes stock from the batch that expires first, and updates the inventory instantly. If only part of a prescription can be supplied today, it waits in Partially Dispensed until the rest is collected."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around the **Dispense Qty** inputs, then the status badge.

## Zoom
No zoom on the Dispense Qty column.

## Pause
1.5 seconds after the toast.

## Transition
Click **Inventory** in the sidebar. Hard cut.

---

# Scene 06

## Duration
01:55 - 02:35

## Purpose
Show batch-level stock control: low stock, expiry and a full audit trail.

## User Role
Pharmacy

## URL / Route
`/dashboard/pharmacy-portal/inventory`

## Starting Screen
Inventory, **Batches** tab

## Action
1. On **Batches**, pause 2 seconds (batch numbers, expiry dates, prices).
2. Click **Low Stock**. Point at **Atorvastatin 10mg**.
3. Click **Expiry**. Point at batch **CTZ-2511-E** (Cetirizine, expiry 25-10-2026).
4. Click **Stock Ledger**. Point at the three dispense rows from Scene 05.

## Demo Data
INV-01…05 opening stock.

## Expected Result
Atorvastatin appears in Low Stock. The Cetirizine batch appears in Expiry. The ledger shows the dispense movements for Rahul's medicines.

## Voiceover
"Stock is tracked by batch, with expiry dates and prices. Low Stock shows what needs reordering. Expiry flags batches before they go out of date. And the stock ledger records every movement, so every tablet can be traced."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around Atorvastatin in Low Stock, the Cetirizine batch in Expiry, and the dispense rows in the ledger.

## Zoom
Zoom to 125% on each highlighted row.

## Pause
1 second on each tab.

## Transition
Click **Sales** in the sidebar. Hard cut.

---

# Scene 07

## Duration
02:35 - 03:20

## Purpose
Bill a walk-in customer at the counter.

## User Role
Pharmacy

## URL / Route
`/dashboard/pharmacy-portal/sales`

## Starting Screen
Sales → **New Sale (POS)**

## Action
1. Click **New Sale**.
2. Next to the customer search, click **+ New**. Enter Name `Vikram Joshi`, Phone `9800000501`. Click **Add & Select**.
3. In "Search medicine to add to cart...", type `Parac` and add **Paracetamol 500mg**. Set Qty `10`.
4. Search `Cetir` and add the batch **CTZ-2511-E**. Set Qty `10`.
5. In **Payments**, set the method to **UPI** and click **Fill Full Balance**.
6. In "Reference No. (optional)", type `UPI-DEMO-78421`.
7. Click **Complete Sale**.
8. In the sales list, click the print icon on the new sale. Show it for 2 seconds, then close it.

## Demo Data
POS-01 / SALE-01 in `DEMO_DATA.md` §5 and §9.

## Expected Result
The "Customer added and selected" toast, then the "Sale completed" toast. The sale appears in the list and the invoice prints.

## Voiceover
"Walk-in customers are billed at the counter. Suresh adds the customer, picks the medicines, and Arogyix shows only batches that are in stock, with prices and GST filled in. The customer pays by UPI, and the invoice is ready to print."

## On-Screen Text
Feature title (3 s): **Counter Sales**

## Cursor / Highlight
Cyan box around the batch shown in the cart, then the total and **Complete Sale**.

## Zoom
Zoom to 130% on the cart. Zoom to 130% on the payment area.

## Pause
1.5 seconds after "Sale completed". 2 seconds on the printed invoice.

## Transition
Speed up steps 2–4 to 2× in the edit. Click **Reports** in the sidebar. Hard cut.

> Never type an amount above the balance; the app rejects it. **Fill Full Balance** avoids that.

---

# Scene 08

## Duration
03:20 - 03:40

## Purpose
Show the business view for the owner and accountant.

## User Role
Pharmacy

## URL / Route
`/dashboard/pharmacy-portal/reports`

## Starting Screen
Reports, **Sales** tab

## Action
1. On **Sales**, set **From** and **To** to today.
2. Hover **Total Revenue** and **Payment Collected**.
3. Click **Purchases**, then **Supplier History** (1 second each).
4. Hover **CSV** and **PDF**.

## Demo Data
Today's sale.

## Expected Result
The Sales totals include Vikram Joshi's sale.

## Voiceover
"Reports show revenue, collections, tax and purchases, by month or by supplier, ready to export for the accountant."

## On-Screen Text
None

## Cursor / Highlight
Cyan box around the summary cards, then the **CSV** and **PDF** buttons.

## Zoom
Zoom to 120% on the summary cards.

## Pause
1 second on each tab.

## Transition
Click **Dashboard**. Cross-fade (0.5 s).

---

# Scene 09

## Duration
03:40 - 03:55

## Purpose
Summarise and hand over.

## User Role
Pharmacy

## URL / Route
`/dashboard/pharmacy-portal`

## Starting Screen
**My Pharmacy** dashboard

## Action
1. Wait for the dashboard. Park the cursor on the right.

## Demo Data
None

## Expected Result
**Pending Rx** is back to 0.

## Voiceover
"Rahul's medicines are ready, stock is accurate to the batch, and the pharmacy's books are up to date."

## On-Screen Text
End card: **Next: The Diagnostic Lab**

## Cursor / Highlight
Cyan box around **Pending Rx** showing 0.

## Zoom
None

## Pause
3 seconds on the final frame.

## Transition
Fade to the end card (1 s).

---

## Post-recording checklist

- [ ] No accidental clicks (especially **Cancel Sale**, **Adjust Stock** submit, or **Edit Details**)
- [ ] No personal information: only demo values; no real UPI IDs
- [ ] No browser errors or red toasts
- [ ] No loading screens left in the cut
- [ ] No irrelevant screens
- [ ] No developer tools visible
- [ ] No console errors visible
- [ ] Cursor movement is smooth
- [ ] Narration matches the screen; nothing says dispensing creates a bill
- [ ] Transitions are clean
