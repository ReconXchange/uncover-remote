# Uncover — Remote

A private, real-time two-player game for reconnecting. Two phones, one shared room:
every spin, card, question, and sound appears on both screens at once.

Built for couples who want to see each other more clearly, laugh a little, and rebuild
trust one honest answer at a time.

## Decks

Either player can switch the deck at any time. It changes the pool the wheel and cards draw from.

- **💜 Reconnect** — warm, open questions to see each other clearly again (the default).
- **❤️ Us** — appreciation, your shared story, understanding, trust, repair, and your future.
- **😄 Playful** — light, silly, would-you-rathers, and gentle dares to break the tension.
- **🔥 Spicy** — flirty and intimate, just for the two of you.

There is also a **Deeper** mode that unlocks after five rounds, with Reflection, Vulnerable,
and About-Us questions. Anyone can tap **Pass** on any question — no explanation needed.

## Menu (18+)

A private **Menu** mode for adults only. One of you picks a set of options (toys and
kinds of play), sends them over, and the other responds **Yes / Maybe / No** to each — so
nothing is on the table unless you both agree. It's hidden behind a one-time 18+
confirmation, and either of you can tap **Clear / start over** at any time. All options live
in the `MENU_OPTIONS` object in `server.js`, so you can edit or add your own freely.

## How to play

1. One person taps **Create a private room** and gets an invite link.
2. Send the link (Copy, Share, or Text it) to the other person.
3. They open it, see who invited them, enter their name, and join.
4. Take turns. Pick the wheel, a mystery card, or a deeper question.
5. Tap **Great answer** to add a connection point when a moment lands.

## Run locally

1. Install Node.js 20 or newer.
2. In this folder, run:

   ```bash
   npm install
   npm start
   ```

3. Open `http://localhost:3000`.

To test with a second device on the same Wi-Fi, open the app from that device using the
computer's local IP, e.g. `http://192.168.1.25:3000`.

## Deploy on Render (free)

1. Push this project to your GitHub repository.
2. In Render, choose **New → Web Service** and connect the repo.
3. Render detects `render.yaml`. If entering settings manually:
   - Build command: `npm install`
   - Start command: `npm start`
   - Health check path: `/health`
4. Deploy, then open the generated `onrender.com` URL and create a room.

The free Render service sleeps when idle, so the first visit after a while can take
30–60 seconds to wake. Once it's awake, both phones connect instantly.

## Temporary-room behavior

Rooms live only in the server's memory. They are deleted ten minutes after both players
disconnect, and all rooms clear whenever the service restarts or redeploys. This is
intentional — nothing you say is stored anywhere. For durable rooms or saved answers,
connect the app to a database such as PostgreSQL, MongoDB, or Supabase.
