# Product Order Management

Web application with an Express API, PostgreSQL database, and browser-based
frontend.

## Setup

1. Copy `backend/.env.example` to `backend/.env` and fill in local values.
2. Install dependencies with `npm install` and `npm install --prefix backend`.
3. Apply database migrations with `npm run migrate --prefix backend`.
4. Start the application with `npm run dev`.
5. Open `http://127.0.0.1:3000` in a browser.

## Verification

- Run backend security tests: `npm test --prefix backend`
- Run database migrations: `npm run migrate --prefix backend`

Never commit `backend/.env`. Only `backend/.env.example` belongs in Git.
