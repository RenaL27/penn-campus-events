# Penn Campus Events

Penn Campus Events is a web application that helps University of Pennsylvania students discover campus activities, connect with classmates, and manage event registration in one place. It brings academic talks, student organization events, arts programs, social gatherings, wellness activities, and volunteer opportunities into a searchable campus event directory.

Campus opportunities can be spread across organization websites, social media, and group chats, making it difficult for students to find relevant events or keep track of their plans. Penn Campus Events addresses this by combining personalized recommendations with filters for interests, dates, event formats, and friends’ attendance. Students can explore upcoming events, watch short event videos, register for activities, and receive updates through an in-app notification inbox.

For organizers, the platform provides tools to publish events, share promotional videos, manage capacity, and view registrations. When an event fills up, students can join a waitlist and automatically receive a place when one becomes available.

The product’s intended impact is to make campus opportunities easier to discover and participation easier to coordinate. By reducing the effort required to find relevant activities and see where friends are going, it aims to support student involvement, help organizations reach interested students, and encourage connections across campus. These are design goals; participation and engagement outcomes have not yet been measured.

Built with React, Express, and MongoDB, the application includes persistent data storage, authenticated accounts, and a responsive interface. Current example listings are clearly labeled fictional sample events; this is a student project, not an official university event directory.

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
