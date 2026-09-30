# Arogyix — Video Editing Guide

This guide is for whoever turns the raw screen recordings into finished videos. It applies to all eight videos. The goal is a calm, confident SaaS product demo, not a software tutorial: the viewer should always know **whose job** they're watching and **why** it matters.

---

## 1. Screen recording style

| Setting | Value |
|---|---|
| Aspect ratio | **16:9** |
| Resolution | **1920×1080 (Full HD)**. Record at exactly this size, or record a 2560×1440 screen and export at 1080p for sharper zooms |
| Frame rate | 30 fps (60 fps if you use a lot of zooms) |
| Browser | Google Chrome, **light mode**, zoom 110%, no extensions, bookmarks bar hidden, one tab |
| Never visible | Developer tools, the console, other tabs, bookmarks, desktop icons, the Dock, notifications, password-manager pop-ups |
| Address bar | Allowed, except when it contains an invite token (`/register?token=…`): crop or blur |
| Recording tools | Screen Studio (automatic zoom and smooth cursor), ScreenFlow, Camtasia or OBS all work |
| Export | H.264 MP4, 1080p, about 12 Mbps; a 720p copy for email |

## 2. Cursor

- **Smooth, straight movements.** Move directly to the target. Never zig-zag or circle an element.
- **Hover before you click.** Rest on the target for about half a second so the viewer can follow.
- **Get out of the way.** After clicking, move the cursor off the thing being explained.
- **Park it when idle.** In empty space on the right side of the screen.
- **Cursor effects:** a soft highlight halo and a subtle click ripple. **No click sounds.**
- **Size:** one step larger than the default system cursor.
- If your tool supports it, apply cursor smoothing in the edit to remove small jitters.
- In the Master Product Demo, clips from different recordings are joined. Hide the cursor for the first and last half-second of each clip, so it doesn't jump at the cut.

## 3. Zoom

**When to zoom in**
- Stat cards when the narrator names them.
- Form sections while the key field is being filled: **Allergies**, **Available Slots**, **Send to Pharmacy**, **Dispense Qty**, the lab **Flag** column.
- Summaries and results: **Booking Summary**, **Prescription Summary**, the **Patient Registered!** and **Hospital Approved!** dialogs.
- Confirmation moments: a status badge changing, **Today's Revenue** updating.

**How much**
| Situation | Zoom |
|---|---|
| A single card, button or small field | 130–140% |
| A form section or table | 120–130% |
| A dialog | 120% |
| Page-to-page navigation | 100% (never zoom during navigation) |

**How**
- Zoom in over about **0.4 s**, hold, then zoom out over about 0.4 s.
- **Never zoom and pan at the same time.** Zoom, hold, then zoom out before moving elsewhere.
- Each scene's **Zoom** section in the recording scripts says exactly where to zoom.

## 4. Transitions

**Use**
- **Cross-fade (0.5–0.8 s):** from a title card into the app; from the last app scene into the end card; at the start and end of every video.
- **Hard cuts:** everywhere inside the story (page to page, action to action). Hard cuts keep a product demo feeling fast and confident.
- **Lower-third change + hard cut:** when the Master Product Demo moves from one role to the next.
- **A 1-second "After the consultation…" card:** only in the Receptionist video, between check-in and payment.

**Don't use**
- Wipes, spins, page curls, zoom-blurs or any "fancy" transition.
- A transition between two actions on the same screen.
- A cross-fade in the middle of a form (it looks like something was hidden).

**Speed changes**
- Speed up long typing to 2–3×, as noted in each script. Keep the narration at normal speed over the sped-up section.
- Never speed up a toast message, a status change, or anything the narrator is describing at that moment.
- Trim every loading skeleton and spinner.

## 5. Text overlays

Keep text minimal. The voiceover explains; text only labels.

**Types of overlay**

| Type | Where | Style | On screen for |
|---|---|---|---|
| **Title card** | Start of each video | Large title, one-line subtitle, over a blurred still of the role's dashboard | The whole intro scene |
| **Lower-third (who)** | First time each person appears | "Name · Role", e.g. **Priya Deshmukh · Receptionist** | 3–4 s |
| **Feature title (what)** | When a main feature starts | Small label top-left | 3 s |
| **Short caption** | Rare, only where the screen can't show it | One line, e.g. *Delivered to Rahul's hospital record* | 3 s |
| **End card** | End of each video | "Next: …" or the Arogyix logo | 3 s |
| **Disclaimer** | Start of the Master Product Demo (or end of every video) | *All names and data in this video are fictitious.* | 4 s |

**Standard feature titles (use these exact words)**
- Hospital Dashboard
- Patient Registration
- Appointment Management
- Check-in & Billing
- Doctor Consultation
- Digital Prescription
- Pharmacy Management
- Counter Sales
- Lab Workflow
- Billing
- Records & Reports
- Analytics & Reports
- Staff Onboarding
- Onboarding Approval

**Rules**
- **One overlay on screen at a time.** Never a lower-third and a feature title together.
- **Maximum six words** per overlay (the disclaimer is the only exception).
- Don't write out what the narrator is saying. No subtitles-as-overlays (captions are a separate SRT file).
- Keep text away from the outer 5% of the frame.
- Font: one clean sans-serif (Inter or similar). White text on a dark translucent bar, or dark text on white.

## 6. Highlights

- **Cyan rounded rectangle** (brand cyan `#0891b2`), 2–3 px, with the rest of the screen dimmed about 30%, for anything the narrator points out.
- **Red rounded rectangle** only for safety items: the **Penicillin allergy**, "the temporary password will not be shown again", and any **Critical** lab flag.
- One highlight at a time. Remove it before the next one appears.

## 7. Privacy in the edit

Before export, **blur**:
- Every **Temporary Password** (Receptionist Scene 04, Staff Scene 05, Master Scene 03).
- Every invite **token** in the staff invite dialog and the address bar (Admin Scenes 05–06).
- Any email inbox window, if one was captured by mistake.

## 8. Audio

- Record the voiceover separately, from `MASTER_VOICEOVER_SCRIPT.md`. Don't record system audio.
- Place each voiceover block at the time shown. If the screen action runs long, extend the pause on screen, not the narration speed.
- Music: soft, corporate, no vocals, at about **−28 dB** under the voice. Duck it further under dense explanation. Let it rise slightly on title and end cards.
- Captions: create an SRT file from the voiceover script for every video. Check the spelling of medicine names.

## 9. Final review before export

Watch each video once, start to finish, and check:
- [ ] The narration matches exactly what's on screen at that moment.
- [ ] Nothing shows or says: an automatic invoice, choosing cash/card at the desk, pharmacy dispensing creating a bill, credentials emailed automatically, High/Low lab flags set automatically, or a reminder arriving live.
- [ ] Rahul's details are identical everywhere (Penicillin allergy, Dr. Amit Patil, 11:30 AM, ₹800, the three medicines, CarePlus tests).
- [ ] No passwords, tokens or real personal data visible.
- [ ] No red error toasts, loading spinners or developer tools.
- [ ] Overlays are within the six-word limit and one at a time.
- [ ] The video length is within its target (see `DEMO_VIDEO_FINAL_INDEX.md`).
