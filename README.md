# OneTrip

Upload once. Share one link. Download in original quality. Deleted automatically.
Product spec and architecture: [AGENTS.md](AGENTS.md). UI tokens: [DESIGN.md](DESIGN.md).

## Setup

```bash
cp .env.example .env   # fill in values
npm install            # also runs prisma generate
npx prisma migrate deploy
npm run dev
```

### Cloudflare R2 (one-time)

1. Create a **private** bucket (e.g. `onetrip-photos`). Do not enable public access or r2.dev.
2. Create an R2 API token with *Object Read & Write* scoped to that bucket → `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`.
3. Bucket → Settings → **CORS policy** (browsers upload/download directly):

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["content-type"],
    "MaxAgeSeconds": 3600
  }
]
```

4. Bucket → Settings → **Object lifecycle rule**: prefix `albums/`, delete objects 8 days after upload. Backstop in case cleanup cron misses something (max expiry is 7 days).

### Google sign-in (optional)

Google Cloud Console → APIs & Services → OAuth consent screen (External) → Credentials → Create OAuth client ID (Web application).
Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google` and `https://<your-domain>/api/auth/callback/google`.
Put the ID/secret in `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, restart. The Google button appears only when both are set.

### Expiry & cleanup

Access stops the moment an album expires. `vercel.json` runs `/api/cron/cleanup` daily (Hobby plan limit) to delete files + rows; set `CRON_SECRET` in Vercel and it sends it automatically. On Pro, change the schedule to hourly. Manual run:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/cleanup
```

## Scripts

| | |
|---|---|
| `npm run dev` | dev server |
| `npm test` | unit tests (node:test) |
| `npm run typecheck` | route typegen + tsc |
| `npm run lint` | eslint |
| `npm run db:migrate` | create/apply migration in dev |
