# DevColab 🚀
> **Cloud-Native Collaborative Developer Platform & Git Repository Management Ecosystem**

[![Java](https://img.shields.io/badge/Java-21%20%7C%2023-orange.svg?logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.x-brightgreen.svg?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Spring Cloud](https://img.shields.io/badge/Spring%20Cloud-2025.x-green.svg?logo=spring&logoColor=white)](https://spring.io/projects/spring-cloud)
[![Next.js](https://img.shields.io/badge/Next.js-16.4.x-black.svg?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue.svg?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Apache Kafka](https://img.shields.io/badge/Apache%20Kafka-3.x-231F20.svg?logo=apachekafka&logoColor=white)](https://kafka.apache.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-4169E1.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Eclipse JGit](https://img.shields.io/badge/Eclipse%20JGit-7.1.0-F05032.svg?logo=git&logoColor=white)](https://www.eclipse.org/jgit/)
[![Monaco Editor](https://img.shields.io/badge/Monaco%20Editor-VS%20Code%20Engine-1F8ACB.svg?logo=visualstudiocode&logoColor=white)](https://microsoft.github.io/monaco-editor/)

---

## 📌 Overview

**DevColab** is an end-to-end, distributed developer collaboration platform modeled after GitHub and GitLab. It allows developers to create projects, host Git repositories, edit code in-browser via **Monaco Editor**, review **Pull Requests** with interactive side-by-side diffs, manage team members using **Role-Based Access Control (RBAC)**, and receive real-time updates through an **event-driven Kafka messaging backbone**.

---

## 📸 Application Screenshots

> 💡 **How to add screenshots:** When editing this `README.md` directly on GitHub, place your cursor on the designated comment line below each section and press **`Ctrl + V`** to paste your screenshot. GitHub will automatically upload and insert the image link!

---

### 1. Projects Dashboard & Repository Explorer
Browse public and private repositories, search projects, create new repositories, and toggle team filters.

<!-- ================================================================= -->
<!-- 📸 PASTE SCREENSHOT 1 HERE: Projects Dashboard & Filters           -->
<!-- (On GitHub web editor: Click the line below and press Ctrl+V)      -->
<!-- ================================================================= -->



---

### 2. In-Browser Monaco Code Editor & File Tree
Navigate directory trees, switch branches, create files, edit code with full syntax highlighting (JS, TS, Python, Java, JSON, etc.), and commit directly to the repository.

<!-- ================================================================= -->
<!-- 📸 PASTE SCREENSHOT 2 HERE: Monaco Code Editor & File Explorer     -->
<!-- (On GitHub web editor: Click the line below and press Ctrl+V)      -->
<!-- ================================================================= -->



---

### 3. Pull Requests & Visual Git Diff Viewer
Inspect changes between branches using Monaco Diff Editor, detect conflicts, review commits, and execute one-click PR merges.

<!-- ================================================================= -->
<!-- 📸 PASTE SCREENSHOT 3 HERE: Pull Request & Side-by-Side Diff View  -->
<!-- (On GitHub web editor: Click the line below and press Ctrl+V)      -->
<!-- ================================================================= -->



---

### 4. Team Collaboration & Role-Based Access Control
Invite team members by User ID, assign roles (`OWNER`, `DEVELOPER`, `VIEWER`), and manage project membership statuses (`PENDING`, `ACTIVE`, `INVITED`, `REMOVED`).

<!-- ================================================================= -->
<!-- 📸 PASTE SCREENSHOT 4 HERE: Project Team Members & Roles Modal     -->
<!-- (On GitHub web editor: Click the line below and press Ctrl+V)      -->
<!-- ================================================================= -->



---

### 5. Notification Center & Interactive Action Cards
Receive real-time alerts for project invitations and pull requests. Accept or reject project invitations directly from notification cards with unread badges.

<!-- ================================================================= -->
<!-- 📸 PASTE SCREENSHOT 5 HERE: Notifications Center & Action Cards    -->
<!-- (On GitHub web editor: Click the line below and press Ctrl+V)      -->
<!-- ================================================================= -->



---

### 6. Developer Profile & Completion Wheel
Interactive user profile modal featuring an SVG circular progress wheel that tracks profile completion, highlights missing details, and displays collaboration readiness tiers.

<!-- ================================================================= -->
<!-- 📸 PASTE SCREENSHOT 6 HERE: Profile Modal & Completion Wheel       -->
<!-- (On GitHub web editor: Click the line below and press Ctrl+V)      -->
<!-- ================================================================= -->



---

### 7. Microservices Health & Service Registry Console
Live latency probing and health check dashboard testing connectivity from the API Gateway across all backend microservices.

<!-- ================================================================= -->
<!-- 📸 PASTE SCREENSHOT 7 HERE: Live Service Health Monitor Dashboard  -->
<!-- (On GitHub web editor: Click the line below and press Ctrl+V)      -->
<!-- ================================================================= -->



---

## 🏛 Architecture & Microservices

DevColab follows an event-driven microservices architecture where services register dynamically with **Netflix Eureka** and route through **Spring Cloud Gateway**.

```
[ Client Browser (Next.js 16 :3000) ]
                 │
                 ▼
    [ API Gateway (Spring Cloud :8080) ] <───> [ Eureka Server (:8761) ]
                 │
    ┌────────────┼────────────┬────────────┬────────────┐
    ▼            ▼            ▼            ▼            ▼
[ Auth ]     [ User ]    [ Project ]    [ Repo ]   [ Notification ]
 (:8081)      (:8082)      (:8083)      (:8085)       (:8084)
    │            │            │            │             │
    └────────────┴────────────┼────────────┴─────────────┘
                              ▼
                 [ Apache Kafka Broker (:9092) ]
                              │
                 [ PostgreSQL Database (:5432) ]
```

### Services Summary

| Service | Port | Route | Key Responsibilities |
| :--- | :---: | :--- | :--- |
| **Eureka Server** | `8761` | — | Service discovery and instance registry. |
| **API Gateway** | `8080` | `/**` | Reverse proxy, dynamic load balancing (`lb://`), and CORS handling. |
| **Auth Service** | `8081` | `/api/auth/**` | User authentication, password hashing, and JWT token issuance. |
| **User Service** | `8082` | `/api/user/**` | Developer profiles, bios, skills, education, and social links. |
| **Project Service** | `8083` | `/api/projects/**` | Project lifecycle, public/private visibility, and team RBAC. |
| **Repo Service** | `8085` | `/api/repos/**` | JGit-backed bare repo management, branches, Monaco commits, and PR merges. |
| **Notification Service** | `8084` | `/api/notifications/**` | Event-driven user alerts, invitation actions, and unread badges. |
| **Frontend Web App** | `3000` | — | Next.js 16 App Router UI with Monaco Editor & Tailwind CSS v4. |

---

## 📡 Kafka Event Catalog

All microservices communicate asynchronously via **Apache Kafka** to maintain data consistency:

- **`user-created`**: Published by *Auth Service* when a new user signs up $\rightarrow$ Consumed by *User Service* to seed profile.
- **`user-deleted`**: Published by *User Service* on profile deletion $\rightarrow$ Consumed by *Auth Service* to revoke credentials.
- **`project-created`**: Published by *Project Service* $\rightarrow$ Consumed by *Repo Service* to auto-initialize a bare Git repo (`project-{id}.git`).
- **`project-deleted`**: Published by *Project Service* $\rightarrow$ Consumed by *Repo Service* to clean up Git storage, and *Notification Service* to delete alerts.
- **`project-invitations`**: Published by *Project Service* $\rightarrow$ Consumed by *Notification Service* to send invite alerts to users.
- **`invitation-response`**: Published by *Project Service* $\rightarrow$ Consumed by *Notification Service* to notify the project owner.
- **`pull-request-events`**: Published by *Repo Service* $\rightarrow$ Consumed by *Notification Service* on PR creation, merge, or close.

---

## 🔌 API Endpoints Reference

All requests route through the API Gateway at `http://localhost:8080`.

### Auth Service (`/api/auth`)
- `POST /api/auth/register` — Register a new account
- `POST /api/auth/login` — Login and receive JWT token
- `GET /api/auth/me` — Get current user information

### User Service (`/api/user`)
- `GET /api/user` — List all user profiles
- `GET /api/user/{id}` — Get profile by ID
- `PUT /api/user/{id}` — Update user profile (bio, skills, links, etc.)
- `DELETE /api/user/{id}` — Delete user profile

### Project Service (`/api/projects`)
- `GET /api/projects` — List visible projects (supports `?userId=`)
- `GET /api/projects/{id}/details` — Get project details and member roster
- `POST /api/projects` — Create a project (triggers Git repo creation)
- `PUT /api/projects/{id}` — Update project metadata
- `DELETE /api/projects/{id}` — Delete project
- `POST /api/projects/{id}/members` — Invite user to project
- `PUT /api/projects/{id}/members/{memberId}` — Update member role or status
- `DELETE /api/projects/{id}/members/{memberId}` — Remove member from project
- `POST /api/projects/{id}/members/{userId}/accept` — Accept invitation
- `POST /api/projects/{id}/members/{userId}/reject` — Reject invitation

### Repository Service (`/api/repos`)
- `GET /api/repos/{projectId}/exists` — Check if Git repo is initialized
- `POST /api/repos/{projectId}/init` — Initialize bare Git repository
- `GET /api/repos/{projectId}/branches` — List all branches
- `POST /api/repos/{projectId}/branches` — Create a new branch
- `GET /api/repos/{projectId}/tree` — Get file tree for Monaco explorer
- `GET /api/repos/{projectId}/blob` — Read file content (`?branch=&path=`)
- `POST /api/repos/{projectId}/commit` — Commit file edits or new files to branch
- `GET /api/repos/{projectId}/diff` — Get branch comparison diff
- `POST /api/repos/{projectId}/pull-requests` — Open a Pull Request
- `GET /api/repos/{projectId}/pull-requests` — List PRs (`?status=OPEN|MERGED|CLOSED`)
- `GET /api/repos/{projectId}/pull-requests/{prId}/diff` — Get PR diff
- `POST /api/repos/{projectId}/pull-requests/{prId}/merge` — Merge Pull Request
- `POST /api/repos/{projectId}/pull-requests/{prId}/close` — Close Pull Request

### Notification Service (`/api/notifications`)
- `GET /api/notifications` — List notifications for current user
- `GET /api/notifications/unread-count` — Get unread count badge
- `PATCH /api/notifications/{id}/read` — Mark notification as read
- `PATCH /api/notifications/read-all` — Mark all notifications as read
- `DELETE /api/notifications/{id}` — Delete notification

---

## 🛠️ Quick Start Guide

### Prerequisites
- **Java 21 or 23**
- **Node.js 20+**
- **PostgreSQL 15+** (running on `localhost:5432`)
- **Apache Kafka** (running on `localhost:9092`)

### 1. Database Configuration
Ensure PostgreSQL is running and create the database:
```sql
CREATE DATABASE "DevColab";
```

Verify your root `.env` settings:
```properties
DB_URL=jdbc:postgresql://localhost:5432/DevColab
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

### 2. Start the Backend Services (In Order)

Open separate terminals and run:

1. **Eureka Server (8761):**
   ```bash
   cd eurekaserver
   ./mvnw spring-boot:run
   ```
2. **Auth Service (8081):**
   ```bash
   cd auth
   ./mvnw spring-boot:run
   ```
3. **User Service (8082):**
   ```bash
   cd user
   ./mvnw spring-boot:run
   ```
4. **Project Service (8083):**
   ```bash
   cd projectservice
   ./mvnw spring-boot:run
   ```
5. **Repository Service (8085):**
   ```bash
   cd repo-service
   ./mvnw spring-boot:run
   ```
6. **Notification Service (8084):**
   ```bash
   cd notification
   ./mvnw spring-boot:run
   ```
7. **API Gateway (8080):**
   ```bash
   cd apigateway
   ./mvnw spring-boot:run
   ```

### 3. Start the Frontend (Port 3000)

```bash
cd frontend
npm install
npm run dev
```

Visit **`http://localhost:3000`** in your browser!

---

## 💻 Tech Stack Summary

- **Backend:** Java 21/23, Spring Boot 3.5, Spring Cloud 2025, Spring Security, Eclipse JGit 7.1, Apache Kafka, PostgreSQL, Hibernate.
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Monaco Editor (`@monaco-editor/react`).
- **Architecture:** Microservices, API Gateway Pattern, Service Registry & Discovery, Event-Driven Architecture.

---

## 📄 License

This project is licensed under the MIT License.
