# Penn Campus Events

A campus events platform for Penn students built with React, Express, and MongoDB.

**Live website:** [penn-campus-events.onrender.com](https://penn-campus-events.onrender.com/)

The free Render service sleeps after inactivity, so the first visit may take about a minute.

## Features

- Personalized recommendations, search, trending events, and category/date filters.
- Event creation, registration, waitlists, and automatic promotion.
- Friends Going feed and friend requests.
- Event Reels with uploads, likes, comments, and sharing.
- In-app notifications and interest preferences.
- Persistent MongoDB storage and hashed account passwords.

## Run locally

Use Node.js 22 or newer. Install dependencies in both folders:

```bash
npm ci --prefix backend
npm ci --prefix frontend
cp backend/.env.example backend/.env
```

Set `MONGO_URI` and a random `JWT_SECRET` in `backend/.env`. Run each server in a separate terminal:

```bash
npm start --prefix backend
npm start --prefix frontend
```

Open http://localhost:3000. The API runs on port 8080. For an existing database with legacy passwords, run `npm run migrate:passwords --prefix backend` before starting.

## Checks

```bash
npm test --prefix backend
CI=true npm test --prefix frontend -- --watchAll=false --runInBand
npm run build --prefix frontend
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for Render, Docker, secrets, and MongoDB access configuration. Never commit environment files containing credentials.

Calendar integration, saved events, messaging, richer profiles, and email/push notifications remain future work.
