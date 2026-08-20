# Taskboard — Frontend (React + Vite)

**Live demo:** 
https://taskboard-frontend-iota.vercel.app **Backend API:**
https://taskboard-app-ay48.onrender.com 
Note: first load may take 30-50s if the backend has been idle (Render free tier spins down). 


React frontend for the mini-Trello task board: auth, boards, lists, cards,
and live updates via WebSocket (STOMP over SockJS).

## Stack
- React 19 + Vite
- React Router
- Tailwind CSS v4
- @stomp/stompjs + sockjs-client for live board updates

## Setup
```bash
npm install
npm run dev
```
Runs on `http://localhost:5173`. The dev server proxies `/api` and `/ws`
requests to `http://localhost:8080`, so **make sure the Spring Boot backend
is running first**.

## What's here
- `src/context/AuthContext.jsx` — signup/login/logout, persists JWT + user in localStorage
- `src/lib/api.js` — fetch wrapper that attaches the JWT to every request
- `src/lib/socket.js` — connects to `/ws` and subscribes to a board's live-update topic
- `src/pages/` — Login, Signup, Boards list, Board detail (the kanban view)
- `src/components/BoardCard.jsx` — a single card, with the "flash" animation on live update
- `src/components/BoardListColumn.jsx` — one list/column with its cards

## Live updates
When you open a board, the page subscribes to `/topic/board/{boardId}`.
Any card created/updated/moved/deleted by anyone (including another browser
tab) shows up instantly — the card briefly flashes amber so the update is
visible, not just silently correct.

To see this in action: open the same board in two browser windows side by
side, and add/move a card in one — it should appear in the other within a
second, no refresh needed. This is the best thing to show off in an
interview or a demo GIF for your README.

https://github.com/user-attachments/assets/4e04912c-826b-40c3-a621-04814f3377fc

GitHub automatically renders a pasted attachment URL like this as an inline video player — no special markdown syntax needed, just the bare URL on its own line.

## Deploying
Build with `npm run build`, deploy the `dist/` folder to Vercel/Netlify.
Before deploying:
- Set the backend's CORS + WebSocket allowed origins to your deployed frontend URL
- Point `/api` and `/ws` at your deployed backend URL instead of relying on
  the dev proxy (e.g. via an environment variable and a small fetch base-url
  change in `src/lib/api.js` and `src/lib/socket.js`)

## Still to do
- [ ] Deploy frontend (Vercel) + backend (Render/Railway)
- [ ] Record a screen capture of the live-update feature for the README/demo
- [ ] Optional: drag-and-drop card reordering (@dnd-kit)
