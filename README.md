# Penn Campus Events

A campus events platform for Penn students, built with React, Express, and MongoDB. Students can discover events, personalize recommendations, connect with friends, watch event Reels, and register for events with automatic waitlist promotion.

## Implemented features

- For You feeds: Recommended, Friends Going, and Reels.
- Keyword search, recent searches, trending events, and personalized ranking.
- Eight campus categories; in-person, online, and hybrid formats; date shortcuts and friend attendance filters.
- Sorting by relevance, date, or popularity; pagination; Apply/Reset controls; removable filter chips.
- Interest preferences and accepted friend requests.
- Organizer video uploads with persistent GridFS storage, playback, likes, comments, comment likes, and link sharing.
- Event creation, organizer editing, registration, waitlists, and an account event dashboard.
- A responsive navy and muted red design with date badges, category shortcuts, and structured event details.

## Local setup

Use Node.js 20.19 or newer. Run these commands from separate terminals where indicated.

```bash
git clone https://github.com/RenaL27/penn-campus-events.git
cd penn-campus-events
cd backend
npm ci
cp .env.example .env
```

Set `MONGO_URI` and `JWT_SECRET` in `backend/.env`. Use a MongoDB Atlas connection string with an explicit database name, such as `penn-campus-events`. Generate a JWT secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Keep credentials out of version control; local environment files are ignored.

```dotenv
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@YOUR_CLUSTER/penn-campus-events
JWT_SECRET=YOUR_RANDOM_SECRET
CLIENT_ORIGIN=http://localhost:3000
PORT=8080
```

Start the backend:

```bash
# In backend/
npm start
```

Start the frontend in another terminal:

```bash
# In frontend/
npm ci
npm start
```

Open http://localhost:3000. The API runs on http://localhost:8080. If macOS reports watcher limits, run `BROWSER=none WATCHPACK_POLLING=true npm start` in the frontend.

The frontend defaults to `http://localhost:8080`. Set `REACT_APP_API_URL` in `frontend/.env.local` to change it, then restart or rebuild. Set `CLIENT_ORIGIN` on the backend to the frontend origin. MongoDB persists events, accounts, preferences, friendships, comments, and videos. Include the GridFS collections in backups.

### Populate a persistent database with samples

```bash
# In backend/, after configuring .env
node scripts/seed-sample-events.js
```

This adds 16 clearly labeled fictional events across all eight categories and three formats to the `penn-campus-events` database. It creates a dedicated sample organizer, preserves existing listings, and skips sample titles already present. Dates are relative to the day the script runs; rerunning does not refresh existing dates. It does not create fake attendance or friendships for real users. Sample events are not actual Penn announcements, and online examples have no real meeting links.

### Try an isolated demo

Build the frontend with `npm run build` in `frontend`, then run `npm run demo` in `backend`. Open `http://localhost:3000`. The demo uses a **temporary MongoDB database**, ignores `MONGO_URI`, and deletes its data when stopped. Its first run may download a MongoDB binary.

Demo accounts: `alex`, `maya`, and `host`, all using password `campus-demo`. Alex and Maya are already friends. Alex hosts “Ideas worth sharing,” which can be used to test Reel uploads. All listings are fictional sample data. Stop the demo before starting the normal servers on the same ports.

### Feature behavior

- Recommendations combine selected interests, the ten most recent searches, categories of past RSVP events, confirmed friends' attendance, and event popularity. Each card includes a reason or friend attendance. Interest and search history persist for authenticated accounts; guest searches remain in that browser only.
- Ranking is deterministic and explainable: 12 points for an interest match, 8 for a past-attendance category, 6 for a recent-search match, up to 10 for attending friends, plus `log(1 + popularity)`. Keyword matches add title/body relevance. Past attendance is inferred from a retained RSVP after the event starts; there is no check-in system.
- Popularity is `4 × attendees + 2 × waitlisted + Reel likes + 2 × comments + 3 × unique authenticated sharers`. It ranks upcoming events. Likes and recorded shares are deduplicated per user; anonymous users can share links without affecting the score.
- Search matches all entered words across title, description, category, location, and organizer. Categories and event types use OR within each group and AND between groups. Date, location, organizer, time, and friends filters combine with them. Results support relevance, date, and popularity sorting, pagination, Apply/Reset, removable chips, and bookmarkable filter URLs.
- Dates use **America/New_York**. “This week” means today through Sunday; “This weekend” means Saturday and Sunday of the current week. Past event start times are excluded from discovery. The original `/events` endpoint still includes past events for the dashboard.
- Friend requests must be accepted by the recipient before attendance appears in Friends Going. Users can cancel, decline, or remove connections. Friends display stored avatars when available and initials otherwise.
- Organizers publish MP4/WebM Reels of up to **50 MB**. Uploads are authenticated and checked for container signatures; MongoDB GridFS stores the files. Playback supports HTTP byte ranges for seeking. Use browser-compatible codecs (H.264 in MP4 or VP8/VP9 in WebM). Native video controls support playback and sound; offscreen videos pause. The upload limit is size-based, not a duration limit.
- Reels include likes, paginated comments, comment likes, and native sharing with a clipboard/link fallback. Shared Reel URLs open directly even when an event has passed.
- New event forms collect a category and event type, and organizers can edit them. Existing events stay available without a category; assign categories through Edit Event to improve recommendations. Legacy events without an event type are treated as In-Person. No destructive data migration is needed.

### API additions

| Endpoint | Purpose |
| --- | --- |
| `GET /events/meta` | Categories, event types, campus timezone |
| `GET /events/discover` | Ranked, filtered, paginated upcoming events |
| `GET /users/me` | Current account and preferences, excluding password |
| `PUT /users/me/interests` | Save interest selection |
| `POST /users/me/searches`, `DELETE /users/me/searches` | Record/clear recent searches |
| `GET /users/search?q=...` | Find students |
| `GET /users/me/friends` | List connections and requests |
| `POST /users/me/friends/:userId` | Request friendship |
| `PUT /users/me/friends/:friendshipId`, `DELETE /users/me/friends/:friendshipId` | Accept or remove a request/connection |
| `GET /reels`, `POST /reels` | Browse or upload Reels |
| `GET /reels/:id`, `GET /reels/:id/video` | Reel details and range-capable video |
| `PUT /reels/:id/like`, `POST /reels/:id/share` | Set like state and record a share |
| `GET /reels/:id/comments`, `POST /reels/:id/comments` | Read/post comments |
| `PUT /reels/:id/comments/:commentId/like` | Set comment-like state |

Discovery query parameters: `q`, `categories` (comma-separated), `types` (comma-separated), `datePreset` (`any`, `today`, `tomorrow`, `week`, `weekend`, `date`), `date` (`YYYY-MM-DD`), `friends=true`, `sort` (`relevance`, `date`, `popularity`), `location`, `organizer`, `time`, `page`, and `limit` (maximum 30). The response is `{ events, total, page, pages }`. Authenticated requests use `Authorization: Bearer <token>`.

Reel uploads use multipart fields `eventId`, `caption`, and `video`. Like endpoints accept `{ "liked": true }` or `{ "liked": false }` and are idempotent.

### Validation

- `npm test` in `backend`: unit tests and integration tests against disposable MongoDB, including recommendations, filters, timezone boundaries, interests/history persistence, friendship consent, upload permissions, video ranges, likes/comments/shares, and RSVP regression coverage.
- `CI=true npm test -- --watchAll=false --runInBand` in `frontend`: discovery rendering, Apply/Reset/chips, search history, interest saving, and failure states.
- `npm run build` in `frontend`: production build.

The ranking service currently computes scores in application memory, appropriate for this campus prototype. A large production catalog should move ranking/pagination into database queries or a dedicated index. The existing authentication implementation still stores plaintext passwords; password hashing and other production hardening remain separate work.


## Core API

| Endpoint | Purpose |
| --- | --- |
| `POST /auth/register`, `POST /auth/login` | Account registration and JWT login |
| `GET /events`, `GET /events/:id` | All events and event details |
| `POST /events/create` | Create an event (authenticated) |
| `PUT /events/:id` | Edit an event (organizer only) |
| `POST /events/:id/rsvp` | Register, join a waitlist, or cancel current registration |

Event creation requires `title`, `date` (`YYYY-MM-DD`), `time` (`HH:mm`), `location`, `capacity`, and `category`; `description` and `eventType` are supported. Requests requiring authentication use a bearer token.

## Remaining work

Calendar views and synchronization, notifications, richer profiles, saved events, organization profiles/following, direct messages, event images, and deployment are not implemented. Some account and organizer screens retain the earlier UI. Before public use, replace plaintext password storage with hashing and add production API/upload protections. Recommendations use transparent heuristics rather than machine learning.

## Formatting

From the repository root:

```bash
npx prettier --write "frontend/src/**/*.{js,jsx,css}" "backend/{src,scripts}/**/*.js"
```
