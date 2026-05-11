# Hybrid Ephemeral Messenger

A privacy-first real-time chat application built with Next.js, Express, Redis, and Firebase.

## Core Features
- **Identity:** Secure Google OAuth authentication via Firebase.
- **Volatility:** Messages are stored in Redis Lists with a configurable TTL (Default: 2 mins).
- **System Pulse:** A real-time terminal monitor showing backend lifecycle events.

## Setup Instructions

### 1. Prerequisites
- MongoDB (Running on `mongodb://localhost:27017`)
- Redis (Running on `redis://localhost:6379`)
- Firebase Project (Service Account JSON and Client Config)

### 2. Configuration

#### Backend (`/backend/.env`)
- Fill in your `MONGO_URI`.
- Place your Firebase Service Account JSON in the `backend` folder and name it `firebase-service-account.json`.

#### Frontend (`/frontend/.env.local`)
Create a `.env.local` file in the `frontend` directory with your Firebase client credentials:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### 3. Running the Application

#### Start Backend
```bash
cd backend
npm run dev
```

#### Start Frontend
```bash
cd frontend
npm run dev
```

## Architecture
- **Express + Socket.io:** Handles real-time messaging and system events.
- **Redis Keyspace Notifications:** Detects when a chat room (key) expires and notifies the frontend to wipe its local state.
- **Silent Registration:** Backend automatically creates/updates user metadata in MongoDB upon first valid JWT verification.
