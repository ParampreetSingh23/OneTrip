# AGENTS.md — OneTrip: Temporary Photo Sharing Web App

## Product mission
Simple, fast, mobile-first web app: upload a large batch of original-quality photos, get one secure album link, let friends on iPhone, Android, or desktop preview and download all or selected photos. Albums expire automatically and stored files are deleted.

User story: I took 116 photos with friends. AirDrop was unreliable, some friends have Android, I don't want to lose quality or send files manually. Upload once, send one link, everyone picks their photos, album disappears after a chosen time.

**Upload once. Share one link. Download in original quality. Delete automatically.**

## Build priorities
- Minimal, polished UX. Uploaders sign in (Google or email/password) and manage named collections; recipients never sign in.
- Preserve original files byte-for-byte; thumbnails are separate preview files.
- Reliable bulk uploads: per-file progress, bounded concurrency, retries, clear failure states.
- Cross-device sharing: unguessable album URL, browser gallery, multi-select, download selected, download all.
- Predictable expiry: deny access at expiry; physically delete objects and metadata via scheduled cleanup.
- Privacy by default: private bucket, no public URLs, access checks, rate limits, optional album password.

## MVP workflows
**Sender (signed in):** dashboard lists their collections (copy link, open, delete early) → New collection: name it, pick 100+ photos → see count, total size, per-file + overall progress → upload direct to R2 via short-lived presigned URLs, retry failures without redoing successes → choose expiry (24h / 3d / 7d) → optional password → get share URL with copy/share actions.

**Recipient:** open URL without login → password if set → lazy-loaded gallery with thumbnails and remaining lifetime → select one/many/all, clear → download single original, selection, or all (streamed ZIP, no recompression) → "Save to Photos/Gallery" via Web Share API where supported, ZIP/file fallback. Never claim a web app can silently save 100+ images into iOS Photos / Android Gallery. Expired/deleted album → clear unavailable page.

## Stack
Next.js 16 (App Router) + TypeScript + Tailwind v4 · Better Auth (email/password + optional Google, Prisma adapter) · Neon PostgreSQL + Prisma 7 (Neon driver adapter) · Cloudflare R2 private bucket · Vercel hosting + Vercel Cron for cleanup. UI tokens come from `DESIGN.md` (mapped in `src/app/globals.css`).

## Architecture decisions (current)
- Share URL `/a/<token>`; token = 32 random bytes base64url. DB stores `sha256(token)` for lookup and AES-GCM(token, APP_SECRET) so the owner can see the link again.
- Upload/publish/delete routes require a Better Auth session and album ownership (`userId`). Viewer routes never touch sessions.
- R2 keys derived from ids: `albums/<albumId>/o/<assetId>` (original), `albums/<albumId>/t/<assetId>.jpg` (thumb).
- Thumbnails generated client-side (canvas) at upload — handles HEIC on iPhone Safari, strips EXIF from previews, zero server CPU. Originals untouched.
- Publish verifies uploads with one `ListObjectsV2` on the album prefix (size must match), drops missing assets.
- Passwords: scrypt (node:crypto). Unlock = httpOnly cookie holding HMAC(APP_SECRET, albumId).
- Downloads: single = 302 to 5-min presigned GET with attachment disposition; ZIP = server-streamed store-mode ZIP (`client-zip`, exact Content-Length, de-duplicated names).
  - iOS: "Save to Photos" = fetch originals in batches of 10 via presigned URLs, then `navigator.share({ files })` (one tap per batch).
  - Android: sequential single-file downloads (land in Downloads → visible in Gallery). ZIP offered as secondary.
  - Desktop: ZIP.
- Expiry: every request checks `expiresAt > now`. Drafts get `expiresAt = now + 24h` so abandoned uploads expire by the same rule. Cron deletes R2 prefix then DB row (idempotent). R2 lifecycle rule (delete after 8 days) is the backstop.
- Deletion guarantee: access stops at expiry instantly; `/api/cron/cleanup` (Vercel Cron, daily on Hobby) deletes files then rows, ≤200 albums/run, failures retried next run; R2 lifecycle (8 days) is the backstop.
- Presigned URLs already issued stay valid ≤5 min.
- Collaboration (`Album.collaborative`): same share link/QR; when on, anyone with it can join with a name (no account) and upload. Guest identity = random key in httpOnly cookie `oc_<albumId>`, sha256 in `Contributor.keyHash`; same browser = same person. `Asset.contributorId` null = owner. Owner toggles on/off (off freezes guest uploads; guests can still delete their own). Photos appear instantly; owner deletes anything, guests only their own. Per-guest cap `MAX_FILES_PER_GUEST` (200). Upload verification is scoped per uploader so concurrent guests don't drop each other's pending uploads. ZIPs use one folder per person when several people uploaded.
- Uploader sessions: Better Auth, 7-day sliding expiry (refreshed daily on use).

## Security and reliability
- Accept JPEG, PNG, HEIC/HEIF, WebP. Validate declared type + size server-side; signed ContentLength caps upload size.
- Configurable limits: file count, per-file size, album size (env).
- No originals in logs/analytics/caches; `Referrer-Policy: no-referrer`; `noindex`.
- Never trust album/asset ids alone — every access resolves via token hash + expiry + password check.
- Originals may contain GPS EXIF; tell the uploader. Don't modify originals.

## UX principles
Mobile-first, accessible, few steps. Sender: Select → Upload → Expiry → Share. Recipient: Open → Browse → Select → Download. Warn that the link is a bearer credential unless a password is set.

## Non-goals (v1)
Native apps, feeds/comments/likes, AI, payments, recipient accounts, public discovery, separate view-only vs contribute links, revoking/regenerating links, removing contributors (not built).

## Rules for coding agents
- Inspect before editing; keep existing structure.
- Small vertical slices: schema+storage → upload → publish → gallery → downloads → cleanup → hardening.
- Secrets only in env; keep `.env.example` current.
- Typed, validated (zod) inputs at every route. Business logic in `src/lib`, not duplicated across routes.
- Tests: `npm test` (node:test, pure modules use relative `.ts` imports). Cover token auth, expiry, selection, retries, cleanup idempotency.
- Run `npm run typecheck`, `npm run lint`, `npm run build`, `npm test` after changes; report what passed and what's untested.
- Ambiguous → safest simplest MVP choice, documented. No new paid services or infra without asking.

## Acceptance criteria
- 116 photos upload from a phone browser, failures visible + retryable, one share URL results.
- Recipient previews and downloads one / selected / all originals on Android, iPhone, desktop.
- Downloaded bytes identical to uploaded; filenames preserved.
- Expired albums serve nothing; cleanup removes originals + thumbs and survives retries.
- Password + unguessable URLs enforced; no public bucket exposure.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
