# OneTrip — brag plan

**What:** Web app: upload a whole trip's photos once, share one link, friends on iPhone/Android/desktop download originals, album deletes itself.
**For:** The person holding 116 photos after a group trip, with friends on mixed phones.
**Sets it apart:** Original bytes (no recompression), per-platform download (Save to Photos on iPhone, Downloads on Android, ZIP on desktop), no app/account for friends, auto-delete.
**Most impressive claim:** 116 photos → one link → everyone gets originals, then it vanishes.
**Visual hook:** 116 photo tiles slam into a grid with a counter.
**Real UI shown:** CollaborateSheet + JoinCard + guest upload tray (QR from the project's `qrcode`, avatars from `src/lib/avatar.ts`), Uploader (overall bar + UploadProgressCard rows + expiry picker), ShareCard (teal link card), Gallery (cover, select mode, platform-specific primary button). Markup + Tailwind classes copied verbatim from `src/components`, compiled against the real `globals.css` tokens.
**Tone:** default — punchy, playful, clean. Cream canvas, ink, brand pastels (lavender / peach / mint / teal).
**Share caption:** 116 trip photos, one link, originals for everyone. Then it deletes itself.

Privacy: all names, photos, link tokens are fictional (gradient "photos", token `7fK2mQ9xLwR4pZ8s`). No real hostnames.

## Storyboard — 1920×1080, 30fps, 25.0s

| # | Time | Scene | On screen | Sound |
|---|---|---|---|---|
| 1 | 0.0–2.6 | Hook | Tiles pop into a dense grid, counter runs 0→116. Big type: **116 photos.** / *from one trip.* | Kick drop, soft tile ticks |
| 2 | 2.6–5.4 | Problem | Three pastel cards pop: "AirDrop — Stalled at photo 23 ✕ Failed", "Android friends — ✕ Left out", "Group chat — ✕ Compressed". Line: **Sharing them shouldn't be the hard part.** | Pops in key |
| 3 | 5.4–9.6 | Upload once | Logo + **Upload once.** Phone with real Uploader: "116 photos", overall bar fills, file rows tick to Complete, button "Uploading 84 of 116… keep this page open" → "Create link", expiry "3 days" selected | Rising pluck arp |
| 4 | 9.6–13.0 | Share one link | **Share one link.** Real ShareCard: "Your link is ready · Goa trip · 116 photos · deleted in 3 days", teal link box, "Copy link" tap → "Copied" | Chime |
| 4b | 13.0–17.4 | Friends add theirs | **Friends add theirs.** / *Same link. Just a name. No signup.* Owner phone: real CollaborateSheet, "Let friends add photos" switch flips on, QR + contributors list fills (Sam 116, Riya 24, Arjun 18). Guest phone: real JoinCard "Were you on this trip?… Just your name, no account.", types "Riya" → Join trip → "Add your photos", "Adding as Riya", upload tray, toast "24 photos added. Thanks, Riya!", person chips + avatars on tiles | Taps, type ticks, chime |
| 5 | 17.4–20.8 | Originals, any phone | **Originals. On any phone.** Three devices with the real Gallery (158 photos · 3 people, person chips, avatar on each tile): tiles get selected, each shows its own button: "Save 12 to Photos" (iPhone), "Download 12 photos" (Android), "Download 12 as ZIP" (desktop) | Taps |
| 6 | 20.8–25.0 | Auto-delete + outro | Pill "Then it deletes itself." with a spinning clock → tiles dissolve. End card: logo, **OneTrip**, "Upload once. Share one link. Deleted automatically." | Reverse swell, final chord |

Transitions: soft — old content scales/fades out, then new content in (no double exposure).
Music: synthesized in-house, 120 BPM, A minor → C → G → F pop progression; SFX tuned to the same key, mixed under the bed.
