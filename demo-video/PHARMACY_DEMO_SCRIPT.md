# Video E — Pharmacy Demo

> **⚠️ REFERENCE DOCUMENT — not the recording instructions.** **RECORD FROM `RECORDING_RUNBOOK.md` ONLY.** Where this file differs from the runbook, follow the runbook. Recording day: **Saturday 10 October 2026**.

| | |
|---|---|
| **Duration** | 6:45 |
| **Target audience** | Pharmacy owners and pharmacists, especially pharmacies partnered with a hospital on Arogyix |
| **Objective** | Show a pharmacy running on Arogyix: receiving and dispensing hospital prescriptions, managing catalog and batch stock, buying from suppliers, selling at the counter, and reporting |
| **Starting screen** | `/login` |
| **Ending screen** | Pharmacy Reports → Sales tab |
| **Main workflow** | Rx Queue → Verify Prescription → Dispense Selected Items |
| **Secondary workflows** | Purchase Order → Receive Stock; New Sale (POS) |
| **Must show** | My Pharmacy dashboard, Rx Queue + detail, Medicine Catalog, Inventory (Batches, Low Stock, Expiry, Stock Ledger), New Purchase Order + receive, New Sale (POS), Reports |
| **Can skip** | Edit listing details, price history, returns, sale cancellation, PO email/WhatsApp, Settings |
| **Narration style** | Operational and precise: stock, batches, expiry, money |
| **Login used** | `wellness.pharmacy@example.com` / `Demo@12345` |
| **Data** | `DEMO_DATA.md` §5 |

**Before recording**
- Wellness Pharmacy was registered through the hospital's **Invite Pharmacy** link. An independent pharmacy can't receive hospital prescriptions (gaps G4 and G20).
- Supplier, catalog (six items) and opening stock have been entered.
- Dr. Patil's prescription for Rahul Sharma has been sent to Wellness Pharmacy (Video D, Scene 08).
- The purchase order **PO-2026-0012 does not exist yet**.

**Honesty notes for this video**
- Dispensing reduces stock but **doesn't create a sale or bill** (gap G11). Don't say "dispense and bill". Show POS billing separately, with a walk-in customer.
- Don't ring up Rahul's dispensed medicines in the POS as well. Stock would be deducted twice.

---

## Storyboard

### Scene 01 — Introduction
**Time:** 00:00–00:12 · *Story step 1*

- **Screen:** Title card
- **Purpose:** Introduce the role
- **User action:** None
- **On-screen action:** "Arogyix for Pharmacies"
- **Voiceover:** "This video is for pharmacies. You'll see how to receive prescriptions from partner hospitals, manage your stock by batch and expiry, buy from suppliers, and bill customers at the counter."
- **Highlight:** None
- **Transition:** Fade
- **Expected result:** The viewer knows the scope

**Recording checklist**
1. Title card only.

### Scene 02 — Login
**Time:** 00:12–00:25 · *Story step 2*

- **Screen:** Login
- **Purpose:** Show entry
- **User action:** Type the credentials, click **Sign In**
- **On-screen action:** Pharmacy dashboard
- **Voiceover:** "Your pharmacy registered through the invite link from its partner hospital. Sign in with the email and password you set there."
- **Highlight:** None
- **Transition:** Cut
- **Expected result:** Logged in

**Recording checklist**
1. `/login` → `wellness.pharmacy@example.com` → **Sign In**. The URL is `/dashboard/pharmacy-portal`.

### Scene 03 — Pharmacy dashboard
**Time:** 00:25–00:55 · *Story step 3*

- **Screen:** My Pharmacy
- **Purpose:** Daily alerts
- **User action:** Hover Low Stock, Expiring Soon, Pending Rx, Today's Sales; scroll to the listing details
- **On-screen action:** Low Stock ≥ 1 (Atorvastatin); Expiring Soon ≥ 1 (Cetirizine, expiry 25-10-2026); Pending Rx = 1
- **Voiceover:** "The dashboard shows what needs attention: medicines below their reorder level, batches close to expiry, prescriptions waiting to be processed, and today's activity. Below are shortcuts to your catalog, inventory, prescriptions, suppliers and purchase orders, and your pharmacy's listing details, which you can edit at any time."
- **Highlight:** Zoom on the four alert cards
- **Transition:** Hover the sidebar
- **Expected result:** The viewer knows what to check each morning

**Recording checklist**
1. Hover each of the four cards for 1 s.
2. Scroll to the listing details. Don't click **Edit Details**.

### Scene 04 — Menu
**Time:** 00:55–01:08 · *Story step 4*

- **Screen:** Sidebar
- **Purpose:** Show scope
- **User action:** Hover the menu
- **On-screen action:** Medicine Catalog, Inventory, Suppliers, Purchase Orders, Sales, Reports, Rx Queue
- **Voiceover:** "Everything a pharmacy needs is in the menu: catalog, inventory, suppliers, purchase orders, sales, reports, and the prescription queue."
- **Highlight:** Glow on **Rx Queue**
- **Transition:** Click **Rx Queue**
- **Expected result:** The viewer sees the scope of the role

**Recording checklist**
1. Hover from **Medicine Catalog** down to **Rx Queue**.

### Scene 05 — Receive and verify a hospital prescription
**Time:** 01:08–01:50 · *Story step 5: Primary workflow (1/2)*

- **Screen:** Prescriptions (Rx Queue) → detail
- **Purpose:** Show the hospital-to-pharmacy handoff
- **User action:** On the **Pending** tab, open Rahul Sharma's prescription and click **Verify Prescription**
- **On-screen action:** Diagnosis, Advice, and Items (Medicine, Dosage, Qty, Remaining); the "Prescription verified" toast; status VERIFIED
- **Voiceover:** "When a doctor at a partner hospital sends a prescription to your pharmacy, it appears here in the Pending queue. Open it to see the diagnosis, the doctor's advice, and each prescribed medicine with its dosage. Medicines are matched to your own catalog automatically. After checking the prescription, click Verify Prescription."
- **Highlight:** Zoom on the Items table and the **Catalog Medicine** column
- **Transition:** Stay on the page
- **Expected result:** The viewer sees that prescriptions arrive digitally from the hospital

**Recording checklist**
1. `/dashboard/pharmacy-portal/prescriptions`. The **Pending** tab is active.
2. Click Rahul Sharma's row.
3. Pause 2 s on the diagnosis and items. The three medicines should already be matched. If a "Select medicine…" dropdown appears, the names don't match (gap G5); fix the data and re-send the prescription.
4. Click **Verify Prescription**. Check for the toast.

### Scene 06 — Dispense
**Time:** 01:50–02:25 · *Story step 5: Primary workflow (2/2)*

- **Screen:** Prescription detail
- **Purpose:** Fulfilment
- **User action:** Enter **Dispense Qty** for each item, click **Dispense Selected Items**
- **On-screen action:** The "Prescription dispensed" toast; status DISPENSED (or PARTIALLY DISPENSED); Remaining updates
- **Voiceover:** "Enter the quantity you're handing over for each medicine and click Dispense Selected Items. Arogyix takes stock from the batch that expires soonest first, and updates your inventory. If you can only supply part of the prescription today, it stays in the Partially Dispensed tab until the rest is given."
- **Highlight:** The **Dispense Qty** inputs, then the status badge
- **Transition:** Click **Inventory**
- **Expected result:** Stock goes down, and the prescription is fulfilled and traceable

**Recording checklist**
1. **Dispense Qty**: `1` for each medicine (Amlodipine `1`, Atorvastatin `1`, Pantoprazole `1`). Never 30 / 30 / 14.
2. Click **Dispense Selected Items**.
3. Go back to the queue and click the **Dispensed** tab to show the row there.

### Scene 07 — Inventory by batch and expiry
**Time:** 02:25–03:05 · *Story step 7: Important features*

- **Screen:** Inventory
- **Purpose:** Stock visibility
- **User action:** Click through the **Batches**, **Low Stock**, **Expiry** and **Stock Ledger** tabs
- **On-screen action:** Batch numbers with expiry and prices; Atorvastatin in Low Stock; Cetirizine in Expiry; DISPENSE movements in the ledger
- **Voiceover:** "Inventory is tracked by batch, with each batch's expiry date, purchase price, MRP and sale price. The Low Stock tab lists medicines below their reorder level. The Expiry tab highlights batches that are about to expire, so you can act before they do. The Stock Ledger records every movement, including purchases, sales, dispensing, returns and adjustments, so every tablet can be traced."
- **Highlight:** Zoom on the Expiry Date column, and on the DISPENSE rows in the ledger
- **Transition:** Click **Adjust Stock** (show briefly), then **Purchase Orders**
- **Expected result:** The viewer understands batch-level control

**Recording checklist**
1. `/dashboard/pharmacy-portal/inventory`, **Batches** tab. Pause 2 s.
2. **Low Stock** tab. Point at Atorvastatin 10mg.
3. **Expiry** tab. Point at the Cetirizine batch CTZ-2511-E.
4. **Stock Ledger** tab. Point at the three DISPENSE rows from Scene 06.
5. Hover **Adjust Stock** and say "for damage or opening stock". Don't submit.

### Scene 08 — Purchase order and receiving stock
**Time:** 03:05–04:15 · *Story step 6: Secondary workflow (1/2)*

- **Screen:** Purchase Orders → New Purchase Order → PO detail
- **Purpose:** Replenish the low-stock item
- **User action:** Create PO-2026-0012 with two lines, open it, enter the received quantities, click **Receive Stock**
- **On-screen action:** Net Payable is calculated; the "Purchase order created" toast; after receiving, the "Stock received" toast and a status change
- **Voiceover:** "To restock, create a purchase order. Choose the supplier and enter the order and invoice numbers. For each product, add the batch number, expiry, quantity, any free units, rate, MRP and GST. Arogyix calculates the item total, GST and net payable, just like the supplier's invoice. When the goods arrive, open the order, enter the quantity received, and click Receive Stock. The new batches are added to your inventory straight away. You can also download the order as a PDF to send to your supplier."
- **Highlight:** Zoom on the totals block (Item Total, GST + CESS, GST Invoice Amount, Net Payable)
- **Transition:** Click **Sales**
- **Expected result:** The viewer sees that purchasing flows directly into stock

**Recording checklist**
1. `/dashboard/pharmacy-portal/purchases` → **New Purchase Order**.
2. **Supplier**: Shree Ganesh Pharma Distributors. **Order No.** `PO-2026-0012`. **Order Date** D. **Invoice No.** `SGPD/26/4471`. **Invoice Date** D.
3. Line 1: Atorvastatin 10mg · Batch `ATV-2609-F` · Expiry 31-08-2028 · Qty 200 · Free 20 · Rate 3.40 · MRP 6.50 · GST 12 · HSN 30049099 · Pack 10x10.
4. Click **Add Item**. Line 2: Cetirizine 10mg · `CTZ-2609-G` · 31-08-2028 · 100 · 0 · 0.90 · 2.00 · 12.
5. Hover the totals, then click **Create Purchase Order**.
6. Open the PO (**View**). Enter the **Receive Qty** on both lines, then click **Receive Stock**.
7. Click the PDF icon and show it for 2 s. Don't use the WhatsApp or email icons unless email is configured.
8. Speed up line entry to 2× in the edit.

### Scene 09 — Counter sale (POS)
**Time:** 04:15–05:25 · *Story step 6: Secondary workflow (2/2)*

- **Screen:** Sales → New Sale (POS)
- **Purpose:** Everyday billing
- **User action:** Add a new customer, add two in-stock items, set the payment, click **Complete Sale**, then print
- **On-screen action:** Cart with batch, qty, price and GST; Subtotal, GST / Tax, Total; the "Sale completed" toast; the printed invoice
- **Voiceover:** "For counter sales, click New Sale. Search for an existing customer or add a new one. You can also leave it blank for a walk-in. Search for a medicine and add it. Only batches that are in stock are shown, so you can't sell what you don't have. Set the quantity. Arogyix fills in the price and GST from the batch. Choose how the customer is paying. You can split a bill across cash, card and UPI if needed. Click Fill Full Balance, then Complete Sale. The invoice can be printed straight away, and the stock is updated."
- **Highlight:** Zoom on the batch shown in the cart; zoom on the Total and **Complete Sale**
- **Transition:** Click **Reports**
- **Expected result:** The viewer sees a complete POS transaction

**Recording checklist**
1. `/dashboard/pharmacy-portal/sales` → **New Sale**.
2. Customer → **+ New** → Name `Vikram Joshi`, Phone `9800000501` → **Add & Select**.
3. Search `Parac` → add Paracetamol 500mg → Qty `10`.
4. Search `Cetir`. The results list each batch; pick **CTZ-2511-E** (expires soonest) → Qty `10`.
5. Payments: set the method on the first row to **UPI** → **Fill Full Balance** → Reference `UPI-DEMO-78421`.
6. Click **Complete Sale**. Check for the toast.
7. In the sales list, click the print icon on the new sale and show it for 2 s.
8. Don't enter an amount above the balance. The app will reject it.

### Scene 10 — Reports
**Time:** 05:25–06:20 · *Story step 7: Important features*

- **Screen:** Reports
- **Purpose:** Business view
- **User action:** **Sales** tab (Today), then **Purchases**, then **Supplier History**; click **CSV**
- **On-screen action:** Total Revenue, Payment Collected, Outstanding, Discount Given, GST / Tax Collected, Refunds, Cancelled Sales; Month-wise Revenue; Supplier-wise Purchases
- **Voiceover:** "Reports give you the full picture. Sales shows revenue, payments collected, outstanding amounts, discounts, tax collected and refunds, by month and by year. Purchases shows what you've bought and what's still pending from suppliers. Supplier History lists every item bought from each supplier. Any report can be exported for your accountant."
- **Highlight:** The summary cards, then the **CSV** button
- **Transition:** Fade to summary
- **Expected result:** The viewer can find the numbers they need

**Recording checklist**
1. `/dashboard/pharmacy-portal/reports`. The **Sales** tab is active. Set From/To to today.
2. Hover the summary cards.
3. **Purchases** tab: point at PO-2026-0012.
4. **Supplier History** → **View history →** for Shree Ganesh.
5. Click **CSV**.

### Scene 11 — Summary
**Time:** 06:20–06:45 · *Story step 8*

- **Screen:** My Pharmacy dashboard
- **Purpose:** Wrap up
- **User action:** None
- **On-screen action:** Pending Rx is back to 0
- **Voiceover:** "Your pharmacy now receives prescriptions digitally from the hospital, dispenses from the right batch, restocks through purchase orders, bills customers at the counter, and has reports ready for your accountant."
- **Highlight:** Pending Rx = 0
- **Transition:** End card
- **Expected result:** The viewer understands the loop

**Recording checklist**
1. Click **Dashboard** and hold 3 s.

---

## Voiceover script (continuous)

> **[Intro]** This video is for pharmacies. You'll see how to receive prescriptions from partner hospitals, manage your stock by batch and expiry, buy from suppliers, and bill customers at the counter.
>
> **[Login]** Your pharmacy registered through the invite link from its partner hospital. Sign in with the email and password you set there.
>
> **[Dashboard]** The dashboard shows what needs attention: medicines below their reorder level, batches close to expiry, prescriptions waiting to be processed, and today's activity. Below are shortcuts to your catalog, inventory, prescriptions, suppliers and purchase orders, and your pharmacy's listing details, which you can edit at any time.
>
> **[Menu]** Everything a pharmacy needs is in the menu: catalog, inventory, suppliers, purchase orders, sales, reports, and the prescription queue.
>
> **[Verify]** When a doctor at a partner hospital sends a prescription to your pharmacy, it appears here in the Pending queue. Open it to see the diagnosis, the doctor's advice, and each prescribed medicine with its dosage. Medicines are matched to your own catalog automatically. After checking the prescription, click Verify Prescription.
>
> **[Dispense]** Enter the quantity you're handing over for each medicine and click Dispense Selected Items. Arogyix takes stock from the batch that expires soonest first, and updates your inventory. If you can only supply part of the prescription today, it stays in the Partially Dispensed tab until the rest is given.
>
> **[Inventory]** Inventory is tracked by batch, with each batch's expiry date, purchase price, MRP and sale price. The Low Stock tab lists medicines below their reorder level. The Expiry tab highlights batches that are about to expire, so you can act before they do. The Stock Ledger records every movement, including purchases, sales, dispensing, returns and adjustments, so every tablet can be traced.
>
> **[Purchase]** To restock, create a purchase order. Choose the supplier and enter the order and invoice numbers. For each product, add the batch number, expiry, quantity, any free units, rate, MRP and GST. Arogyix calculates the item total, GST and net payable, just like the supplier's invoice. When the goods arrive, open the order, enter the quantity received, and click Receive Stock. The new batches are added to your inventory straight away. You can also download the order as a PDF to send to your supplier.
>
> **[Sale]** For counter sales, click New Sale. Search for an existing customer or add a new one. You can also leave it blank for a walk-in. Search for a medicine and add it. Only batches that are in stock are shown, so you can't sell what you don't have. Set the quantity. Arogyix fills in the price and GST from the batch. Choose how the customer is paying. You can split a bill across cash, card and UPI if needed. Click Fill Full Balance, then Complete Sale. The invoice can be printed straight away, and the stock is updated.
>
> **[Reports]** Reports give you the full picture. Sales shows revenue, payments collected, outstanding amounts, discounts, tax collected and refunds, by month and by year. Purchases shows what you've bought and what's still pending from suppliers. Supplier History lists every item bought from each supplier. Any report can be exported for your accountant.
>
> **[Summary]** Your pharmacy now receives prescriptions digitally from the hospital, dispenses from the right batch, restocks through purchase orders, bills customers at the counter, and has reports ready for your accountant.
