# Arogyix — Role-to-Feature Matrix

Taken from the sidebar filter in `frontend/components/layout/DashboardLayout.tsx` and the `@Roles(...)` guards on every backend controller. Only features that exist in the current code are listed.

**Legend**
- ✓ full use (create, edit, act)
- **View**: read-only
- **Own**: only the user's own records
- **—**: no access (hidden in the UI, blocked by the API, or both)
- **API**: allowed by the backend but not shown in that role's sidebar (not demo-able)

Column abbreviations: **SA** Super Admin · **HA** Hospital Admin · **Rec** Receptionist · **Doc** Doctor · **Pat** Patient · **Pha** Pharmacy · **Lab** Pathology Lab · **Ref** Referral Partner

## 1. Platform and onboarding

| Feature | SA | HA | Rec | Doc | Pat | Pha | Lab | Ref |
|---|---|---|---|---|---|---|---|---|
| Submit hospital registration (landing page, public) | — | — | — | — | — | — | — | — |
| Approve or reject hospital, pharmacy and lab requests | ✓ | — | — | — | — | — | — | — |
| Hospitals (tenant list, activate or deactivate) | ✓ | — | — | — | — | — | — | — |
| Platform Users list | ✓ | — | — | — | — | — | — | — |
| Revenue Analytics (MRR, plans) | ✓ | — | — | — | — | — | — | — |
| Referral Signups: approve, KYC, commission, payouts | ✓ | — | — | — | — | — | — | — |
| Referral Dashboard: code, KYC, earnings | — | — | — | — | — | — | — | ✓ |
| Subscription: Current Plan, Manage Subscription | — | ✓ | — | — | — | — | — | — |
| Hospital branding (name, logo, contact) | API | ✓ | — | — | — | — | — | — |
| Personal profile, avatar, WhatsApp opt-in | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Notifications page | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

The first row is marked — for every role because it is done by a **public visitor** before an account exists.

## 2. Hospital setup

| Feature | SA | HA | Rec | Doc | Pat | Pha | Lab | Ref |
|---|---|---|---|---|---|---|---|---|
| Staff: invite (Receptionist, Doctor, Admin), deactivate | API | ✓ | — | — | — | — | — | — |
| Doctors: Configure Doctor Profile (fee, slots, availability) | API | ✓ | — | API (edit own) | — | — | — | — |
| Doctors list | — | ✓ | View (while booking) | View (while booking) | View (while booking) | — | — | — |
| Departments CRUD | — | ✓ | — | — | — | — | — | — |
| Medicines & Ointments Catalog (for prescriptions) | — | ✓ | — | ✓ | — | — | — | — |
| Pharmacies: add, invite, edit | — | ✓ | ✓ | ✓ | — | — | — | — |
| Pharmacies: deactivate | — | ✓ | — | — | — | — | — | — |
| Pathology Labs: browse, invite, request link, revoke | — | ✓ | ✓ | ✓ | — | — | — | — |

## 3. Patients and appointments

| Feature | SA | HA | Rec | Doc | Pat | Pha | Lab | Ref |
|---|---|---|---|---|---|---|---|---|
| Patient registration (creates a login and temp password) | — | ✓ | ✓ | ✓ | Self-signup | — | — | — |
| Patient list and search | View* | ✓ | ✓ | ✓ | — | — | — | — |
| Patient file: summary, edit, family members | — | ✓ | ✓ | ✓ | — | — | — | — |
| Patient Timeline | — | ✓ | — | ✓ | Own (API) | — | — | — |
| Book appointment (live slots) | — | ✓ | ✓ | ✓ | ✓ (self) | — | — | — |
| Appointment list, search, filters | View* | ✓ | ✓ | ✓ (own) | Own | — | — | — |
| Confirm, Check In & Start Visit, No Show | — | ✓ | ✓ | ✓ | — | — | — | — |
| Complete appointment (needs a prescription, same day) | — | ✓ | ✓ (Check Out) | ✓ | — | — | — | — |
| Cancel appointment (with reason) | — | ✓ | ✓ | ✓ | Own | — | — | — |
| Clinical notes on appointment | — | View | View | ✓ | View | — | — | — |
| Schedule follow-up | — | — | — | ✓ | — | — | — | — |
| Missed Follow-ups: list, send reminder | — | ✓ | ✓ | ✓ (own) | — | — | — | — |
| Chat (real time) | — | — | — | ✓ | ✓ | — | — | — |

\* The Super Admin stat cards link to these lists. The data is tenant-scoped, so don't rely on this in a demo.

## 4. Clinical records

| Feature | SA | HA | Rec | Doc | Pat | Pha | Lab | Ref |
|---|---|---|---|---|---|---|---|---|
| Write prescription (oral and topical, reminders) | — | ✓ | — | ✓ | — | — | — | — |
| Send prescription to pharmacy | — | ✓ | — | ✓ | — | Receives | — | — |
| Prescriptions list and PDF | — | ✓ | — | ✓ | Own | — | — | — |
| Medical Reports repository: upload, view, delete | — | ✓ | — | ✓ | Own | — | — | — |
| Lab order from hospital | — | ✓ | ✓ | ✓ | — | — | Receives | — |
| Lab Orders list and results view | — | ✓ | ✓ | ✓ | — | — | ✓ | — |
| Lab report in patient Reports and Timeline | — | View | — | View | Own | — | Delivers | — |

## 5. Billing and reports (hospital)

| Feature | SA | HA | Rec | Doc | Pat | Pha | Lab | Ref |
|---|---|---|---|---|---|---|---|---|
| Generate invoice (queue, appointment page, or Create Invoice) | — | ✓ | ✓ | — | — | — | — | — |
| Billing list, filters, invoice PDF | — | ✓ | ✓ | — | Own | — | — | — |
| Mark Paid / Collect (no payment method captured) | — | ✓ | ✓ | — | — | — | — | — |
| Pay Now online (UPI, card, net banking, wallet via Razorpay) | — | — | — | — | Own | — | — | — |
| Export invoices | — | ✓ | ✓ | — | — | — | — | — |
| Hospital Dashboard stats | — | ✓ | — | — | — | — | — | — |
| Analytics charts | — | ✓ | — | — | — | — | — | — |
| Operational Reports panel (12 types, Export and Print) | — | ✓ (in Analytics) | ✓ (Reports menu) | — | — | — | — | — |

## 6. Pharmacy operations

| Feature | SA | HA | Rec | Doc | Pat | Pha | Lab | Ref |
|---|---|---|---|---|---|---|---|---|
| Pharmacy dashboard and listing details | — | — | — | — | — | ✓ | — | — |
| Medicine Catalog (MRP, sale price, Rx-required, price history) | — | — | — | — | — | ✓ | — | — |
| Inventory: batches, expiry, low stock, movements | — | — | — | — | — | ✓ | — | — |
| Manual Stock Adjustment / Add New Batch | — | — | — | — | — | ✓ | — | — |
| Suppliers | — | — | — | — | — | ✓ | — | — |
| Purchase Orders: create, receive, PDF, email | — | — | — | — | — | ✓ | — | — |
| Sales: POS, split payments, returns, cancel, print | — | — | — | — | — | ✓ | — | — |
| Rx Queue: verify and dispense | — | — | — | Sees "Sent to <pharmacy>" only | — | ✓ | — | — |
| Pharmacy Reports: sales, purchases, suppliers (CSV/PDF) | — | — | — | — | — | ✓ | — | — |

## 7. Pathology operations

| Feature | SA | HA | Rec | Doc | Pat | Pha | Lab | Ref |
|---|---|---|---|---|---|---|---|---|
| Lab dashboard and listing details | — | — | — | — | — | — | ✓ | — |
| Test Catalog (import from master list, parameters) | — | View (lab detail) | View | View | — | — | ✓ | — |
| Hospital Links: approve, reject, revoke | — | Request or revoke | Request or revoke | Request or revoke | — | — | ✓ | — |
| Walk-in orders | — | — | — | — | — | — | ✓ | — |
| Collectors | — | — | — | — | — | — | ✓ | — |
| Sample lifecycle, results, verify, deliver, amend | — | — | — | — | — | — | ✓ | — |
| Critical-value doctor notification | — | — | — | — | — | — | ✓ | — |
| Lab Reports: revenue, turnaround, commissions | — | — | — | — | — | — | ✓ | — |

## 8. Short matrix (for a slide)

| Feature | Hospital Admin | Receptionist | Doctor | Patient | Pharmacy | Lab | Super Admin |
|---|---|---|---|---|---|---|---|
| Patient Registration | ✓ | ✓ | ✓ | Self-signup | — | Walk-in only | — |
| Appointments | ✓ | ✓ | ✓ | Own | — | — | — |
| Prescription | ✓ | — | ✓ | View own | Dispense | — | — |
| Billing (hospital) | ✓ | ✓ | — | Pay own | — | — | — |
| Pharmacy Inventory and POS | — | — | — | — | ✓ | — | — |
| Lab Orders | ✓ | ✓ | ✓ | View report | — | ✓ | — |
| Staff and Doctors setup | ✓ | — | — | — | — | — | — |
| Reports / Analytics | ✓ | ✓ | — | — | ✓ (own) | ✓ (own) | Revenue |
| Chat | — | — | ✓ | ✓ | — | — | — |
| Tenant approval | — | — | — | — | — | — | ✓ |
