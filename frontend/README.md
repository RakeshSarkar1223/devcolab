# DevColab Frontend

A clean, minimal Next.js application built with TypeScript and Tailwind CSS, interfacing directly with the **DevColab Microservices Backend** through Spring Cloud API Gateway.

---

## 🏗️ Architecture Overview

The frontend communicates with the backend services routed through the API Gateway:

```
[ Next.js Frontend ] (Port 3000)
        │
        ▼ (Next.js Rewrites: /api/* -> http://localhost:8080/api/*)
[ Spring Cloud API Gateway ] (Port 8080)
        │
        ├──▶ /api/auth/**     ──▶ [ AUTH-SERVICE ] (Port 8081)
        ├──▶ /api/user/**     ──▶ [ USER-SERVICE ] (Port 8082)
        └──▶ /api/projects/** ──▶ [ PROJECT-SERVICE ] (Port 8083)
```

---

## 🚀 Features

- **Microservices Connectivity Health**: Live pings to `/api/auth/hello`, `/api/user/hello`, and `/api/projects/hello` to confirm service health and gateway routing.
- **Authentication (Auth Service)**:
  - Register (`POST /api/auth/register`)
  - Login (`POST /api/auth/login`)
  - Current User info with Bearer token (`GET /api/auth/me`)
  - Automatic `localStorage` token storage and `Authorization: Bearer <token>` injection on subsequent requests
- **User Profiles (User Service)**:
  - List all user profiles (`GET /api/user`)
  - Search by user ID or email (`GET /api/user/{id}`, `GET /api/user/email/{email}`)
  - Create user profile (`POST /api/user`)
  - Update user profile (`PUT /api/user/{id}`)
  - Delete user profile (`DELETE /api/user/{id}`)
- **Projects & Team Collaboration (Project Service)**:
  - List all projects (`GET /api/projects`)
  - Filter projects by Owner ID or Member User ID (`GET /api/projects/owner/{id}`, `GET /api/projects/user/{id}`)
  - Create project (`POST /api/projects`)
  - Project Details with active members (`GET /api/projects/{id}/details`)
  - Update project details (`PUT /api/projects/{id}`)
  - Delete project (`DELETE /api/projects/{id}`)
  - Manage Project Members (`POST`, `PUT`, `DELETE` on `/api/projects/{id}/members`)

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js (v18+)
- pnpm (recommended) or npm

### 2. Environment Variables
Create or verify `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 3. Run Development Server
```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
frontend/
├── .env.example
├── .env.local
├── next.config.ts            # Proxy rewrites to API Gateway
├── package.json
├── tsconfig.json
└── src/
    ├── types/
    │   └── index.ts          # TypeScript interfaces for all backend DTOs & models
    ├── lib/
    │   └── api.ts            # Typed API client for Auth, User, and Project services
    ├── components/
    │   ├── Navbar.tsx        # Navigation header & active session indicator
    │   ├── ServiceHealth.tsx # Live microservice status tester
    │   ├── AuthSection.tsx   # Register, Login, & /api/auth/me tester
    │   ├── UsersSection.tsx  # User profile management
    │   └── ProjectsSection.tsx # Projects & project member collaboration
    └── app/
        ├── layout.tsx
        ├── page.tsx          # Main dashboard
        └── globals.css       # Clean minimal styling
```
