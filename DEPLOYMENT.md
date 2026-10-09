# Deploy with Docker and MongoDB Atlas

This deployment serves the React frontend and Express API from the same HTTPS origin. Caddy handles HTTPS. MongoDB Atlas stores persistent application data and Reel files. No local MongoDB container is required.

## Configure Atlas access

1. In Atlas **Database Access**, use a dedicated application database user with **readWrite** permission on **penn-campus-events** only. The application does not need `atlasAdmin` or access to `admin`, `local`, or other databases.
2. Keep that database user's password in the production secret file. URL-encode reserved characters in its connection string. This credential is separate from students' application passwords.
3. In **Network Access**, allow the deployment server's public outbound IP. Keep your development IP if needed. Remove `0.0.0.0/0` once the server address is known and confirmed working. Avoid changing access shared by other applications.
4. Include both regular collections and the `reelVideos.files` / `reelVideos.chunks` GridFS collections in backups.

## Configure the deployment server

Install Docker Engine and Compose on a server with a public IP and enough RAM for the application (at least 1 GB recommended). Point a domain's A/AAAA record to the server and allow inbound ports 80 and 443. SSH administration remains your server's responsibility.

```bash
git clone https://github.com/RenaL27/penn-campus-events.git
cd penn-campus-events
cp .env.example .env
cp backend/.env.production.example backend/.env.production
chmod 600 .env backend/.env.production
```

Set `APP_DOMAIN` in the root `.env` to the public hostname (without `https://`). In `backend/.env.production`, set `CLIENT_ORIGIN=https://YOUR_HOSTNAME`, the restricted Atlas user's `MONGO_URI` with database name `penn-campus-events`, and a fresh JWT secret generated with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Do not reuse example values or commit either secret file. Only the app container receives database credentials. Compose sets trust to exactly one reverse proxy; do not expose the app port directly to the Internet. Multiple replicas require a shared rate-limit store; this configuration runs one replica.

## Migrate passwords, then start

Existing plaintext account passwords must be converted before startup. The migration is resumable and skips already migrated accounts. Users keep their existing passwords. Deploy with the app stopped during migration; changing the JWT secret and the new issuer/audience validation invalidate existing sessions.

```bash
docker compose build
docker compose run --rm --no-deps app npm run migrate:passwords
docker compose up -d
docker compose ps
```

Caddy automatically provisions HTTPS certificates for the configured domain. Persistent Docker volumes retain them. Open the public HTTPS domain and verify `/health` returns `{"status":"ok"}`. Register a new account, sign in, create an event, RSVP, and verify its notification. Test a Reel upload and playback. `docker compose logs --tail=100 app proxy` helps diagnose issues without printing environment variables.

For a new image release, run `docker compose build` and `docker compose up -d`. Back up Atlas before database migrations. To stop, use `docker compose down`; Atlas data remains persistent. Do not remove Caddy volumes unnecessarily.

## Security behavior and limits

Application passwords use bcrypt with cost 12. New registrations require at least 10 characters and at most 72 UTF-8 bytes, and reject invalid account fields. JWTs expire after seven days and require the application issuer, audience, and HS256 signature. Legacy plaintext login is disabled. Old accounts with shorter passwords can still sign in after migration.

The API applies security headers, a 100 KB JSON limit, failed-login limits, general request limits, and a maximum of two concurrent Reel uploads per process. Uploads remain capped at 50 MB and validate MP4/WebM signatures. Caddy caps request bodies at 52 MB. This does not replace malware scanning or video transcoding. Password reset, email verification, refresh tokens, automated event reminders, notification delivery retries, and a multi-instance rate-limit store remain future work.

The frontend still stores bearer sessions in browser storage. It clears rejected tokens and redirects to login. A future HTTP-only cookie session design would further reduce exposure to script injection. Runtime backend dependencies should be audited regularly; frontend build-tool dependencies are not included in the runtime image.


## Free cloud alternative: Render

The root `render.yaml` configures a free Node web service that builds both frontend and backend on Render. No local Docker build is required. After pushing the current changes, connect the repository in Render and create a Blueprint. Set the secret `MONGO_URI` when prompted. Render generates the JWT secret and provides the HTTPS hostname; the app uses `RENDER_EXTERNAL_URL` as its same-origin frontend setting. Add the service's outbound IP ranges from Render's dashboard to Atlas Network Access. Keep the database name in the URI. Existing account passwords have already been migrated in the current Atlas database.

Free Render web services sleep after 15 minutes without inbound traffic, so the next visit may take longer. Free plans have usage limits. Select the free plan and do not enable paid resources. The current configuration uses MongoDB Atlas for persistent data, not the Render filesystem.


## Current cloud deployment

- Public website: https://penn-campus-events.onrender.com/
- Render service: `penn-campus-events` (`srv-db45oovlot8c73ftg960`), Node runtime, Free plan, Oregon.
- Render dashboard: https://dashboard.render.com/web/srv-db45oovlot8c73ftg960
- Source: public GitHub repository, `main`. The service uses the build/start commands from `render.yaml` and `/health`.
- `MONGO_URI` and a generated `JWT_SECRET` are stored in Render environment variables. Never copy them into Git.
- Atlas database user `renal27` has `readWrite` only on `penn-campus-events`.
- Atlas network access is limited to Render's observed Oregon ranges (`74.220.48.0/24`, `74.220.56.0/24`) and the current development network. The unrestricted `0.0.0.0/0` entry was removed. Update the development rule if that network changes, and check Render's Connect menu for any changed outbound ranges.
- To publish future code updates from this public-repository setup, push to `main`, then use **Manual Deploy → Deploy latest commit** in Render. Do not assume automatic deploys without checking the service settings or configuring a Blueprint.

Verified after deployment: HTTPS homepage and event cards load, `/health` returns 200, discovery returns the persistent Atlas events, direct event-page navigation serves the frontend, and anonymous access to notification data returns 401.
