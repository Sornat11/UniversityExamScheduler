# University Exam Scheduler - Frontend

React + TypeScript app built with Vite (rolldown-vite). The UI uses React Router, React Query, Tailwind CSS, and an OpenAPI-based API client.

## Requirements
- Node.js 20+ and npm

## Setup
```bash
npm install
```

## Development
```bash
npm run dev
```
Dev server proxies `/api` to `http://127.0.0.1:5000` (see `vite.config.ts`).

## Scripts
- `npm run dev` - start dev server
- `npm run build` - typecheck and build
- `npm run preview` - preview production build
- `npm run lint` - run ESLint
- `npm run test` - run Vitest once
- `npm run test:watch` - run Vitest in watch mode
- `npm run icons` - generate PWA icons (`frontend/scripts/generate-icons.js`)

## Auth (demo)
- Use `/api/auth/login` with usernames: `student`, `starosta`, `prowadzacy`, `dziekanat`, `admin` (any password).
- JWT is stored in `localStorage` under `ues_token` and attached by the API client.

## Project Structure
- `src/app` - app shell, providers, routing
- `src/features` - feature modules
- `src/shared` - shared components, hooks, utilities
- `src/api` - API client and typed models

## PWA
The manifest and icons are configured in `vite.config.ts`. Generated icons live in `frontend/public`.
