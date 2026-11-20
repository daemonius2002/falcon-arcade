# Falcon Arcade v0.1.1

Pixel games platform: 6 categories, 30 games planned, 11 playable.

- `public/` - the whole site (static HTML, CSS, JS, PNG)
- `server.js` - tiny Node server with no dependencies; serves `public/` on `$PORT` (default 3000)
- Health check: `GET /healthz` returns `ok`

Run locally: `npm start`, then open http://localhost:3000

Deploy: push this folder to a Git repository and deploy it as a Node app.
No build step and no `npm install` packages are needed; the start command is `npm start`.

Player name, high scores and favourites are stored in each browser (localStorage).
