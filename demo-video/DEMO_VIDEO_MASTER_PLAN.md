# Arogyix — Demo Video Master Plan

This folder is the full production kit for recording Arogyix product demo videos. Everything in it was checked against the current source code (frontend pages, backend controllers and services, and the Prisma schema) as of 30 September 2026. No code was changed.

| File | What it's for |
|---|---|
| `DEMO_VIDEO_MASTER_PLAN.md` (this file) | What the app actually does, per role; video strategy; gaps and recording blockers |
| `ROLE_FEATURE_MATRIX.md` | Role-to-feature matrix |
| `MASTER_DEMO_FLOW.md` | End-to-end journey plus the storyboard and voiceover for **Video A — Full Product Demo** |
| `ADMIN_DEMO_SCRIPT.md` | Video B — Hospital Admin |
| `RECEPTIONIST_DEMO_SCRIPT.md` | Video C — Receptionist |
| `DOCTOR_DEMO_SCRIPT.md` | Video D — Doctor |
| `PHARMACY_DEMO_SCRIPT.md` | Video E — Pharmacy |
| `STAFF_DEMO_SCRIPT.md` | Video F — Platform Administrator (Super Admin), plus Referral Partner appendix |
| `PATIENT_DEMO_SCRIPT.md` | Video G — Patient |
| `PATHOLOGY_DEMO_SCRIPT.md` | Video H — Pathology Lab (extra: this role exists and isn't covered by A–G) |
| `DEMO_DATA.md` | All dummy data to enter, and the order to enter it in |
| `SCREEN_RECORDING_CHECKLIST.md` | Environment setup, recording settings, per-video pre-flight checks |

---

## 0. Before you trust the older docs

`README.md`, `APP_FLOW.md` and `CLINIC_FLOW.md` are out of date in ways that matter for a demo. The scripts in this folder follow the code instead. The differences:

| Older docs say | The code actually does |
|---|---|
| 5 roles | **8 roles**: `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `DOCTOR`, `RECEPTIONIST`, `PATIENT`, `PHARMACY`, `PATHOLOGY`, `REFERRAL` |
| An invoice is created automatically when a consultation is completed | **No automatic invoice.** Staff click **Generate Bill** in the receptionist queue, **Generate Invoice** on the appointment page, or **Create Invoice** in Billing |
| The receptionist selects a payment method, then clicks "Mark as Paid" | **Collect** and **Mark Paid** mark the invoice paid in one click; no payment method is asked for. Only patients paying online choose a method (UPI, card, net banking or wallet, through Razorpay) |
| Hospital admins set a temporary password for new staff | Admin clicks **Invite Staff**, which generates a **registration link**. The staff member opens it and sets their own password |
| Adding a doctor is one step | **Two steps**: the invite creates the login, then **Doctors → Configure Doctor Profile** makes the doctor bookable |
| A patient who signs up has no hospital | Self-signup **requires choosing a hospital** and an **email verification code**. A patient record is created at that hospital |
| Hospitals register at `/register` | Hospitals register through **Register Your Clinic / Hospital** on the landing page `/`. `/register` is for patients and invite links |
| A welcome email is sent on approval | **No email is sent.** The Super Admin sees the temporary password once, in a modal, and passes it on manually |
| Reminders run on an in-app cron | Reminders run when an **external scheduler calls `/reminders/cron/*`**. There's nothing to show live on screen |

---

## PHASE 1 — Application Functionality Map

Every signed-in user sees a left sidebar that is filtered by role (`frontend/components/layout/DashboardLayout.tsx`). Every role also gets **Dashboard**, **Notifications** and **Settings**. All roles sign in on the same page, `/login`, and are sent to their own dashboard (`frontend/lib/auth.tsx → redirectByRole`).

### 1.1 Super Admin (Platform Administrator)

| Item | Detail |
|---|---|
| **Role** | `SUPER_ADMIN` |
| **Purpose** | Runs the Arogyix platform: approves new hospitals, pharmacies and labs, and oversees tenants, users, subscription revenue and referral partners |
| **Who uses it** | The Arogyix operations team |
| **Login** | `/login`. The account is created only by the seed script and can't be registered through the app. Redirects to `/dashboard/super-admin` |
| **Dashboard** | **Super Admin Portal**. Stat cards: Total Hospitals, Total Pharmacies, Total Labs, Total Patients, Platform Users, Total Appointments, Pending Referrals. Below them, the **Hospital Registration Requests** table with Pending, Approved and Rejected tabs |
| **Navigation** | Dashboard · Hospitals · Referral Signups · Revenue Analytics · Notifications · Settings. **Platform Users** opens from its stat card |
| **Main screens** | Super Admin Portal; Hospitals (all tenants, filterable by type); Platform Users; Referral Signups; Revenue Analytics |
| **Important actions** | Approve or reject a registration request (hospital, pharmacy or lab), which shows the new admin's **temporary password once**; activate or deactivate a tenant; approve or reject referral partners and their KYC; edit commission rates; record payouts |
| **Main workflows** | Tenant onboarding approval; referral partner approval, KYC and payouts |
| **Permissions** | Platform-wide |
| **Can view** | All tenant requests, tenants, platform users, MRR and subscription analytics, referral partners, commissions, payouts |
| **Can create** | Tenants (by approving a request), referral payouts |
| **Can edit** | Tenant active status, referral commission rate, KYC status |
| **Can delete** | Backend supports `DELETE /tenants/:id`. The UI only exposes deactivating |
| **Reports** | Revenue Analytics: current MRR, active subscriptions, plan tiers in use, MRR by month, MRR by plan, subscription status breakdown |
| **Notifications** | Notifications page (shared) |
| **Depends on** | Applicants submitting requests from the landing page or registration pages; hospitals paying subscriptions |

### 1.2 Hospital Admin

| Item | Detail |
|---|---|
| **Role** | `HOSPITAL_ADMIN` |
| **Purpose** | Sets up and runs one hospital or clinic: staff, doctors, departments, catalog, partner pharmacies and labs, branding, subscription, and analytics |
| **Who uses it** | The hospital owner or administrator |
| **Login** | `/login` with the temporary password from the Super Admin (or an admin invite link). Redirects to `/dashboard/hospital` |
| **Dashboard** | Stat cards: Today's Appointments, Total Patients, Active Doctors, Today's Revenue. Also Missed Follow-ups, Today's Appointment Status chart, Recently Registered Patients |
| **Navigation** | Dashboard · Appointments · Follow-ups · Patients · Doctors · Departments · Prescriptions · Medicines Catalog · Pharmacies · Pathology Labs · Lab Orders · Reports (medical documents) · Billing · Staff · Analytics · Notifications · Settings |
| **Main screens** | Staff & Access Control; Doctors Directory and Configure Doctor Profile; Departments; Medicines & Ointments Catalog; Pharmacies; Pathology Labs; Analytics Dashboard (including the operational Reports panel); Settings (Hospital Settings tab, subscription) |
| **Important actions** | Invite staff (Receptionist, Consulting Doctor, Administrator); activate or deactivate staff; configure doctor profiles (fee, slot length, hours, weekly availability); CRUD departments; CRUD catalog items; add, invite, edit or deactivate pharmacies; invite labs and request links; update branding and logo; manage the subscription; export reports |
| **Main workflows** | Hospital setup → staff onboarding → doctor profiles → catalog and partner network → monitoring through Analytics and Reports |
| **Permissions** | Their own tenant. Can also do most front-desk and clinical-record actions (register patients, book appointments, generate and collect invoices, write prescriptions) |
| **Can view** | Everything inside their tenant |
| **Can create** | Staff invites, doctor profiles, departments, catalog items, pharmacies, lab invites and link requests, patients, appointments, invoices, prescriptions, lab orders, report uploads |
| **Can edit** | Doctor profiles, departments, catalog items, pharmacies, patients, appointment status, hospital branding |
| **Can delete** | Departments, catalog items, pharmacies (deactivate), uploaded reports. Staff can only be deactivated, not deleted |
| **Reports** | Analytics: appointments over the last 7 days, consultations by department, billing over the last 6 months. **Reports panel** with 12 report types (Appointment, Patient, Doctor Activity, Revenue, Invoice, Payment, Prescription, "Pharmacy Sales" (prescribed medicines), Inventory (catalog), Follow-up, Cancellation, Lab Orders). Each has date, doctor and department filters, search, Print and CSV export |
| **Notifications** | Shared Notifications page; "Lab report delivered" when they placed the lab order |
| **Depends on** | Super Admin approval to exist. Doctors and receptionists doing the day-to-day work |

### 1.3 Receptionist

| Item | Detail |
|---|---|
| **Role** | `RECEPTIONIST` |
| **Purpose** | Runs the front desk: registers patients, books appointments, runs the check-in queue, bills and collects payments |
| **Who uses it** | Front-desk staff |
| **Login** | Invite link → **Activate your account** (sets own password) → `/login`. Redirects to `/dashboard/receptionist` |
| **Dashboard** | **Front Desk Dashboard**. Stat cards: Today's Appointments, Checked-In / Waiting, Payments Pending, Today's Revenue. **Reception Quick Actions**: Register Patient, Book Appointment, Billing Center, Missed Follow-ups, Reports. **Patient Queue & Schedule** table with search, status filter, and Generate Bill, Check In, Check Out, Collect and Cancel actions |
| **Navigation** | Dashboard · Appointments · Follow-ups · Reports (operational) · Patients · Pharmacies · Pathology Labs · Lab Orders · Billing · Notifications · Settings |
| **Main screens** | Front Desk Dashboard; Register New Patient; Patients list and patient file; Schedule New Appointment; Appointment Details; Billing & Invoices and Generate Clinic Invoice; Missed Follow-ups; Reports panel; New Lab Order |
| **Important actions** | Register a patient (a login and temporary password are created for them); link family members; book an appointment by picking a live slot; check in and out; generate a bill; collect payment; cancel with a reason; export invoices; place a lab order; send a follow-up reminder |
| **Main workflows** | Walk-in: register → book → check in → (doctor consults) → generate bill → collect → check out |
| **Permissions** | Their own tenant. **Cannot** write prescriptions (the backend allows only Doctor and Hospital Admin; the Prescriptions menu is hidden). **Cannot** see the medical Reports repository or the patient timeline |
| **Can view** | Patients, appointments, invoices, pharmacies, labs, lab orders, operational reports |
| **Can create** | Patients, family members, appointments, invoices, pharmacy entries and invites, lab invites, lab orders |
| **Can edit** | Patient details, appointment status (confirm, check in, no-show, complete, cancel), invoice status (paid), pharmacy details |
| **Can delete** | Nothing. Cancelling an appointment is a status change |
| **Reports** | The same 12-type Reports panel as the Hospital Admin, at `/dashboard/receptionist/reports` |
| **Notifications** | Shared page |
| **Depends on** | Admin: doctor profiles and availability must exist before booking. Doctor: a prescription must exist before the visit can be completed |

### 1.4 Doctor

| Item | Detail |
|---|---|
| **Role** | `DOCTOR` |
| **Purpose** | Sees patients, reviews history, writes prescriptions (optionally sending them to a pharmacy), orders lab tests, schedules follow-ups, and chats with patients |
| **Who uses it** | Consulting doctors |
| **Login** | Invite link → activate → `/login`. Redirects to `/dashboard/doctor`. They can't be booked until the admin has configured their profile |
| **Dashboard** | "Dr. <Name>'s Dashboard". Stat cards: Today's Appointments, Total Patients, Prescriptions Pending. Also Missed Follow-ups and Today's Schedule |
| **Navigation** | Dashboard · Appointments · Follow-ups · Patients · Prescriptions · Medicines Catalog · Pharmacies · Pathology Labs · Lab Orders · Reports · Chat · Notifications · Settings |
| **Main screens** | Appointment Details (clinical notes, workflow control, prescriptions); Write New Prescription; patient file (Timeline, Records & Care, Family Members); Chat; Medicines Catalog; Lab Orders |
| **Important actions** | Check in and start a visit; save clinical notes; **Write Prescription** (oral medicines and topical ointments, reminder times, Send to Pharmacy); **Complete Appointment**; **Schedule Follow-up**; place a lab order; upload reports; chat with patients; add catalog items |
| **Main workflows** | Today's Schedule → Appointment Details → notes → Write Prescription → Complete → Schedule Follow-up |
| **Permissions** | Their own tenant. Today's list and missed follow-ups are filtered to their own patients |
| **Can view** | Patients, full patient timeline, prescriptions, medical reports, lab orders and results |
| **Can create** | Prescriptions, clinical notes, follow-ups, patients, appointments, catalog items, lab orders, report uploads, chat messages |
| **Can edit** | Appointment status and notes, their own doctor profile (backend), catalog items |
| **Can delete** | Catalog items, uploaded reports |
| **Reports** | None (no operational Reports panel) |
| **Notifications** | New chat message, appointment booked with them (email), lab report delivered |
| **Depends on** | Admin: profile and availability. Receptionist: booking and check-in. Pharmacy and lab: fulfilment |

### 1.5 Patient

| Item | Detail |
|---|---|
| **Role** | `PATIENT` |
| **Purpose** | Self-service: appointments, prescriptions (PDF), medical reports, bills and online payment, chat with doctors |
| **Who uses it** | Patients of a hospital on Arogyix |
| **Login** | Either (a) the front desk registered them and handed over the temporary password shown on screen, or (b) self-registration at `/register`: pick a hospital, enter details, then enter the **email verification code**. Redirects to `/dashboard/patient` |
| **Dashboard** | "Hello, <Name>! 👋". Upcoming Appointments (with Book Appointment), Medicines Due, Recent Prescriptions, Billing (Amount Due, Pay Now), Recent Reports |
| **Navigation** | Dashboard · Appointments · Prescriptions (My Prescriptions) · Reports · Chat · Billing · Notifications · Settings |
| **Main screens** | Patient dashboard; Schedule New Appointment ("Your Profile" preselected); My Prescriptions (PDF download); Report Repository (own reports plus upload); Billing (own invoices, Pay Now); Chat |
| **Important actions** | Book an appointment; cancel their own appointment (the only status change allowed); download prescription PDFs; upload their own reports; pay an invoice online by UPI, card, net banking or wallet (Razorpay); chat with doctors; turn on WhatsApp reminders in Settings |
| **Main workflows** | Book → attend → view prescription → pay → follow up by chat |
| **Permissions** | Their own records only |
| **Can view** | Their own appointments, prescriptions, reports (including delivered lab reports), invoices, notifications |
| **Can create** | Appointments, report uploads, chat messages, online payments |
| **Can edit** | Their own profile; cancel their own appointment |
| **Can delete** | Their own uploaded reports (the backend checks ownership) |
| **Reports** | None |
| **Notifications** | Appointment booked, prescription issued, medicines scheduled, report uploaded, lab report ready, follow-up reminder, new chat message, and appointment-tomorrow and medicine reminders (when the external cron runs) |
| **Depends on** | Everyone else. There's nothing to see until a hospital has doctors |

### 1.6 Pharmacy

| Item | Detail |
|---|---|
| **Role** | `PHARMACY` |
| **Purpose** | Runs a pharmacy: catalog, batch inventory, suppliers, purchase orders, point-of-sale, and a queue of prescriptions sent by hospital doctors |
| **Who uses it** | Pharmacy owner or pharmacist |
| **Login** | Two ways to get an account. (a) **Hospital-linked**: a hospital user clicks **Invite Pharmacy**, and the pharmacy completes **Register your pharmacy** with their own login. (b) **Independent**: `/register/pharmacy-business` → Super Admin approval → temporary password. Redirects to `/dashboard/pharmacy-portal` |
| **Dashboard** | "My Pharmacy". Stat cards: Low Stock, Expiring Soon, Pending Rx, Today. Quick links: Medicine Catalog, Inventory, Prescriptions, Suppliers, Purchase Orders. Listing details (Edit Details) |
| **Navigation** | Dashboard · My Pharmacy · Medicine Catalog · Inventory · Suppliers · Purchase Orders · Sales · Reports · Rx Queue · Notifications · Settings |
| **Main screens** | Medicine Catalog and Add Medicine; Inventory (batches, expiry, low stock, movement ledger) and Manual Stock Adjustment; Suppliers; Purchase Orders, New Purchase Order and Receive; Sales list and **New Sale (POS)**; sale detail (returns, pay remaining, cancel, print); Rx Queue (Pending, Verified, Partially Dispensed, Dispensed, All) and Rx detail (Verify Prescription, Dispense Selected Items); Reports |
| **Important actions** | Add medicines (MRP, sale price, reorder level, Rx-required flag); add batches; adjust stock; create a PO, then receive stock; POS checkout with split payments; returns and cancellations; verify and dispense prescriptions (stock picked first-expiry-first-out); PO PDF and email |
| **Main workflows** | Stock in (supplier → PO → receive) → sell (POS) → fulfil hospital prescriptions (verify → dispense) → reports |
| **Permissions** | Their own pharmacy only |
| **Can view/create/edit** | Their own catalog, batches, suppliers, POs, sales, returns, prescriptions, listing details |
| **Can delete** | Nothing is hard-deleted. Medicines are discontinued, suppliers and batches deactivated, sales cancelled |
| **Reports** | Sales (revenue, collected, outstanding, discount, GST, refunds, cancelled; month-wise and year-wise), Purchases (month-wise, supplier-wise), Supplier history. CSV and PDF export |
| **Notifications** | Low stock, payment pending, purchase received |
| **Depends on** | Doctors choosing this pharmacy under **Send to Pharmacy** (hospital-linked pharmacies only) |

### 1.7 Pathology Lab

| Item | Detail |
|---|---|
| **Role** | `PATHOLOGY` |
| **Purpose** | Runs a diagnostic lab: test catalog, links with hospitals, orders from hospitals and walk-ins, sample lifecycle, results, verification, report delivery |
| **Login** | Hospital invite (**Invite Pathology Lab** → `/register/pathology-lab`, auto-linked to that hospital), or independent via `/register/pathology-business` → Super Admin approval. Redirects to `/dashboard/pathology-portal` |
| **Dashboard** | "My Lab": Orders & Samples, Reports & Verification (including Critical and Avg. Turnaround), Revenue & Network |
| **Navigation** | Dashboard · My Lab · Test Catalog · Hospital Links · Orders · Collectors · Lab Reports · Notifications · Settings |
| **Important actions** | Add tests (import from the master list); approve, reject or revoke hospital links; New Walk-in Order; schedule collection → **Mark Collected — Assign Sample ID** → **Receive at Lab** → **Accept Sample** or reject / request recollection → **Start Processing** → enter results (flag chosen per value; Critical applied automatically) → **Save Results** → **Submit for Verification** → **Confirm & Verify** → **Deliver Report**; notify the doctor about critical values; amend a report |
| **Reports** | Lab Reports: orders, revenue (hospital-linked and walk-in), turnaround, referring-doctor commissions |
| **Effect on hospital** | A delivered report appears in the hospital patient's **Reports** and **Timeline**, and both the patient and the person who ordered it get a notification |

### 1.8 Referral Partner

| Item | Detail |
|---|---|
| **Role** | `REFERRAL` |
| **Purpose** | Refers hospitals, labs and pharmacies to Arogyix and earns commission on their subscription charges |
| **Login** | `/register/referral` (with email code) → Super Admin approval → KYC approval activates the code. Redirects to `/dashboard/referral` |
| **Dashboard** | Referral Dashboard: Commission Earnings (Total Earned, Total Paid, Pending Balance), Payout History, Your Referral Code, KYC Verification, Your Profile, Payout Details, Hospitals and Pharmacies Referred |
| **Depends on** | Super Admin (approval, KYC, payouts); referred tenants entering the code when they register |

### 1.9 Cross-cutting features

| Feature | Where | Notes |
|---|---|---|
| Search | Patients (name, phone, code), Appointments (patient, phone, reason, plus status and date filters), Staff, Departments, Doctors, Pharmacies, Labs, Reports, Prescriptions (plus doctor filter), Billing (status and date range), pharmacy catalog and suppliers, Platform Users | Present almost everywhere |
| Notifications | Bell count in the layout; live toasts over Socket.io; `/dashboard/notifications` with **Mark all read** | |
| Settings | Personal Profile (name, phone, **Notify me on WhatsApp**, avatar). Admin also gets the **Hospital Settings** tab (name, logo, contact, address) and **Current Plan → Manage Subscription** | |
| Patient timeline | Patient file → Timeline tab | Records appointments, prescriptions, medicines started, reports, follow-ups, reminders, lab orders, lab reports |
| PDFs | Prescription PDF, invoice PDF, purchase order PDF, lab report PDF | |
| Password reset | `/forgot-password` → email link, valid 1 hour | Needs SMTP |

---

## PHASE 2 — Demo Video Strategy

| Video | Duration | Audience | Objective | Starts on | Ends on | Narration style |
|---|---|---|---|---|---|---|
| **A. Full Product Demo** | 10–12 min | Hospital owners and decision makers evaluating Arogyix | Show one patient's full journey across every role | Landing page `/` | Admin Analytics → Reports panel | Calm, story-led, one patient throughout |
| **B. Hospital Admin** | 6–7 min | New hospital admins | Set up a hospital and see what's happening in it | `/login` | Analytics Reports panel export | Instructional, "set it up once" |
| **C. Receptionist** | 6–7 min | Front-desk staff | Register, book, check in, bill, collect | `/login` | Front Desk Dashboard with a paid visit | Step-by-step, practical |
| **D. Doctor** | 5–6 min | Doctors | Consult, prescribe, complete, follow up | `/login` | Chat reply to patient | Brief, clinical, respectful of doctors' time |
| **E. Pharmacy** | 6–7 min | Pharmacists and owners | Stock, sell, dispense hospital prescriptions | `/login` | Pharmacy Reports | Operational, numbers-focused |
| **F. Platform Administrator** | 4–5 min | Arogyix internal ops | Approve tenants, monitor platform, referrals | `/login` | Revenue Analytics | Internal, matter-of-fact |
| **G. Patient** | 4–5 min | Patients (can be shared by hospitals) | Book, view prescription, pay, chat | `/register` or `/login` | Chat | Friendly, plain language |
| **H. Pathology Lab** *(extra)* | 5–6 min | Lab owners and technicians | Order → sample → result → verified report | `/login` | Lab Reports | Process-oriented |

Screens that **must** be shown and screens that **can be skipped** are listed at the top of each script file.

**Recording order.** Several videos depend on data created in others. Record in this order: **F → B → C → D → E → H → G → A**. A is recorded last, once every screen is populated. See `DEMO_DATA.md §0`.

---

## PHASE 7 — Story structure used by every role video

Each role script is built on this structure. The scene tables label which step each scene covers.

1. **Introduction**: who this person is ("Who am I?")
2. **Login**: how they get in
3. **Dashboard**: what they see first ("What can I do?")
4. **Main responsibilities**: a quick tour of the sidebar
5. **Primary workflow**: the one task they do most ("How do I do it?")
6. **Secondary workflow**: the next most important task
7. **Important features**: search, reports, notifications
8. **Summary**: what happened as a result ("What happens after I do it?") and what the next role picks up

---

## Workflow gaps and recording blockers

These come from the current code. Each script already works around them. Fixing them is optional product work, not demo work.

### Blockers — the demo breaks if you ignore these

| # | Gap | Effect on recording | Workaround used in scripts |
|---|---|---|---|
| G1 | An appointment can be **completed only on its scheduled calendar date** (`appointments.service.ts`), and it **can't be booked in the past** | You can't record "book today, complete yesterday", and you can't create historical data through the UI | Book Rahul Sharma's appointment for **later on the recording day**. Record C → D → billing on the same day |
| G2 | **Complete Appointment** and **Check Out** fail until a **prescription** exists for that appointment | The receptionist can't check out before the doctor writes the prescription | Keep the order: check in → doctor prescribes → complete or check out → bill |
| G3 | **Invoices are not automatic** | Following the old docs, the invoice won't exist | Show **Generate Bill** (queue) or **Generate Invoice** (appointment page) explicitly |
| G4 | **Send to Pharmacy** lists only pharmacies registered **under this hospital**, and only pharmacies that completed the **invite** have a login | If you use **Add Pharmacy** only, the prescription goes to a pharmacy nobody can sign in as | Create "Wellness Pharmacy" through **Invite Pharmacy**. Independent pharmacies (`/register/pharmacy-business`) **can't** receive hospital prescriptions |
| G5 | Prescription items are matched to the pharmacy catalog by **exact name** (case-insensitive) | If the names differ, the pharmacist has to map each medicine by hand before dispensing | Use the identical medicine names from `DEMO_DATA.md` in the hospital catalog, the prescription, and the pharmacy catalog |
| G6 | A doctor can't be booked until **Configure Doctor Profile** is done, and slots come only from that profile's weekly availability and hours | Empty slot list | Make sure the recording day's weekday is ticked and the hours cover the time you plan to book |
| G7 | Patient self-signup, forgot-password, and the invoice/lab-report emails need **SMTP** | No verification code arrives | Configure SMTP. Use a real inbox you control for the self-signup patient only |
| G8 | Patient **Pay Now** and admin **Manage Subscription** need **Razorpay** keys | Checkout fails with a 503 | Use Razorpay **test** keys, or skip those scenes (marked *optional*) |

### Gaps to avoid on camera

| # | Gap | What to do |
|---|---|---|
| G9 | The **email** and **WhatsApp** icons on the Billing invoice list only show "…will be available soon" | Don't click them. Use the PDF download |
| G10 | **Collect** and **Mark Paid** don't record a payment method, so the old "select Cash/Card" step doesn't exist | Narrate "record the payment". Don't mention choosing a method |
| G11 | **Dispensing a prescription doesn't create a pharmacy sale or bill** | Show POS billing as its own workflow. Don't claim dispensing bills the patient |
| G12 | The hospital **"Pharmacy Sales Report"** actually lists *medicines prescribed by doctors*, and **"Inventory Report"** lists the hospital's *Medicines Catalog*. Neither comes from pharmacy stock | Describe them as "medicines prescribed" and "catalog" |
| G13 | **No emails for credentials**: approval temp password, staff invite link, patient temp password and pharmacy/lab invite links are all shown once on screen | Show the modal, say "share these with the user", and blur the password in post |
| G14 | Medicine and appointment **reminders** only go out when an external scheduler calls `/reminders/cron/*` | Show the reminder *times* in the prescription and "Medicines Due" on the patient dashboard. Don't show a reminder arriving live |
| G15 | Dashboards and charts (Analytics, Revenue Analytics, Missed Follow-ups) need **days of history**, and G1 stops you back-dating | Start a **data warm-up** 5–7 days before recording (see `DEMO_DATA.md §3`), or accept sparse charts |
| G16 | **Chat** only works between Doctor and Patient. Receptionists and admins see "Chat isn't available for your account" | Show chat only in the D and G videos |
| G17 | Front-desk patient codes look like `P12345678`. Seeded patients look like `PAT-XXXXXXXX` | Just read the code off the screen. Don't promise a format |
| G18 | There is no UI for the Super Admin to manage the master test list (API only), and no UI to create another Super Admin | Leave out of Video F |
| G19 | Staff can only be **deactivated**, not deleted, and there's no "resend invite" | Say "deactivate". To re-invite, generate a new link |
| G20 | Independent pharmacies have no way to create an Rx queue entry themselves; the queue only fills from hospital doctors | Record Video E with the **hospital-invited** pharmacy |
| G21 | Receptionists can't call the patient-timeline API, so the default **Timeline** tab of the patient file looks empty for them | In Video C, go straight to **Family Members** |
| G22 | Rows in the doctor dashboard's **Today's Schedule** look clickable but aren't links | The doctor opens the visit from **Appointments** |
| G23 | **Write Prescription** from an appointment pre-selects the doctor but **not the patient** | The doctor searches for and selects the same patient before prescribing |
| G24 | The landing-page pricing cards are **Free Trial, Professional, Enterprise**. There's no "Basic" card, even though a Basic plan is seeded | Use Professional in Video F |
| G25 | The doctor's **Complete Appointment** and the receptionist's **Check Out** do the same thing, so only one can be shown on a single appointment | Rahul's visit is completed by the doctor. A second prepared visit (Arjun Mehta) shows **Check Out** |

A detailed hour-by-hour plan for recording day is in `MASTER_DEMO_FLOW.md §4`.
