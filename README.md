# Uncover Remote

A temporary, real-time two-player personal discovery game.

## What it does

- Creates a private six-character room
- Produces a shareable invite link
- Synchronizes wheel spins, card selections, question reveals, turns, and scores
- Plays sounds independently on both devices
- Unlocks deeper questions after five rounds
- Stores room state only in server memory

## Run locally

1. Install Node.js 18 or newer.
2. Open a terminal in this folder.
3. Run:

```bash
npm install
npm start
```

4. Open `http://localhost:3000`.

To test remote play on the same Wi-Fi network, open the app from another device using the computer's local IP address, such as `http://192.168.1.25:3000`.

## Deploy on Render

1. Create a new GitHub repository.
2. Upload this project's files to the repository.
3. In Render, choose **New → Web Service**.
4. Connect the GitHub repository.
5. Render should detect `render.yaml`. If entering settings manually, use:
   - Build command: `npm install`
   - Start command: `npm start`
   - Health check path: `/health`
6. After deployment, open the generated `onrender.com` URL.
7. Create a room and send the invite link.

## Temporary-server behavior

Rooms live only in the Node server's memory. They are deleted ten minutes after both players disconnect, and all rooms disappear whenever the service restarts or redeploys. This is intentional for a lightweight temporary game.

For durable rooms, accounts, or saved answers, connect the app to a database such as PostgreSQL, MongoDB, Firebase, or Supabase.
