# ChatGenius

Real-time chat app with groups, reactions, file attachments and an `@ai` assistant (Google Gemini).

- **Frontend:** React 18 + Vite (`chatgenius-frontend/chatgenius-react`)
- **Backend:** Flask + Flask-SocketIO + SQLAlchemy (`chatgenius-backend`)
- **Database:** PostgreSQL

> The HTML/JS files directly inside `chatgenius-frontend/` are an older static version; the React app is the current frontend.

## Online demo (no backend needed)
The frontend has a **demo mode** that runs entirely in the browser: visitors can create an account, log in, chat, make groups, react to messages and get scripted AI replies. Accounts and chats are saved in the visitor's own browser (localStorage) and never leave it. Do not reuse a real password in the demo.

Try it locally (no Python or Postgres needed):
```
cd chatgenius-frontend/chatgenius-react
npm install
npm run dev:demo
```

Publish it on GitHub Pages: push this repo to GitHub, then **Settings -> Pages -> Source: GitHub Actions**. The included workflow (`.github/workflows/deploy-demo.yml`) builds and publishes the demo on every push to `main`. The site appears at `https://<your-username>.github.io/<repo-name>/`.

Vercel also works: Root Directory `chatgenius-frontend/chatgenius-react`, Build Command `npm run build:demo`, Output Directory `dist`.

In demo mode the AI replies are scripted (date/time, greetings, help). The full app (below) uses Google Gemini through the Flask backend.

## Full version (React + Flask + PostgreSQL)

## Prerequisites
Python 3.10+, Node.js 18+, PostgreSQL 14+

## 1. Database
Create an empty database (tables are created automatically on first start):
```
psql -U postgres -c "CREATE DATABASE chatgenius;"
```

## 2. Backend (http://localhost:8000)
```
cd chatgenius-backend
python -m venv venv
# Windows:  venv\Scripts\activate        macOS/Linux:  source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env        # macOS/Linux: cp .env.example .env
# edit .env: set DATABASE_URL (your Postgres password), SECRET_KEY, JWT_SECRET_KEY, optional GOOGLE_API_KEY
python run.py
```
Check: open http://localhost:8000/ -> `{"service":"ChatGenius API","status":"ok"}`

## 3. Frontend (http://localhost:5173)
```
cd chatgenius-frontend/chatgenius-react
npm install
copy .env.example .env        # macOS/Linux: cp .env.example .env
npm run dev
```

## Environment variables
| Where | Name | Purpose |
|---|---|---|
| backend | `DATABASE_URL` | PostgreSQL connection string (required) |
| backend | `SECRET_KEY`, `JWT_SECRET_KEY` | Flask / JWT signing keys |
| backend | `CORS_ORIGINS` | Allowed frontend origins, comma separated |
| backend | `GOOGLE_API_KEY` | Optional, enables `@ai` |
| frontend | `VITE_API_URL` | Backend base URL (default `http://localhost:8000`) |

Never commit `.env` files.

## API overview
`POST /api/auth/register`, `POST /api/auth/login`, `GET|POST /api/conversations`, `POST /api/conversations/join`, `GET|POST|PUT /api/groups`, `POST /api/messages`, `GET /api/messages/conversation/<id>`, `POST /api/messages/<id>/react`, `GET|PUT /api/users/profile`, `GET /api/users/search`, `POST /ai/chat`. Real-time events use Socket.IO on the same port.

## Known limitations
- `/ai/image` (image generation) is called by the UI but not implemented in the backend yet.
- Socket.IO events are not authenticated yet.
- Uploaded files are stored on local disk (`chatgenius-backend/uploads`).
