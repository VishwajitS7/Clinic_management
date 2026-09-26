# Clinic Appointment Manager — Full-Stack Web Application

A professional, interview-ready **Clinic Appointment Management System** built with **Node.js, Express, MongoDB Atlas, Mongoose, React, and Bootstrap**.

Designed to showcase mastery over layered backend architecture, role-based security, interval overlap conflict detection, dynamic slot generation, and backend-enforced financial calculations.

---

## 1. Central Domain Workflow

```text
Patient
   ↓
Doctor
   ↓
Doctor Schedule
   ↓
Available Slots (Generated dynamically from doctor schedule & existing appointments)
   ↓
Appointment (Protected with strict interval-overlap conflict detection)
   ↓
Consultation (Symptoms, diagnosis, clinical notes)
   ↓
Prescription (Embedded medicines: Paracetamol, Cetirizine, etc.)
   ↓
Invoice (Backend-calculated subtotal, discount, tax, total, amount due)
   ↓
Payment (Partial and full payment balance tracking, automatic status transition)
```

---

## 2. Technology Stack

### Frontend
- **React.js (v18)** + **Vite** (Fast dev server, optimized production build)
- **JavaScript (ES6+)**
- **React Router DOM (v6)** (Client-side routing & route protection)
- **Axios** (Configured instance with Bearer interceptors & unified error handling)
- **Bootstrap 5 & React-Bootstrap** (Responsive, interview-friendly design system)
- **Bootstrap Icons** (Semantic clinical and UI iconography)

### Backend
- **Node.js** + **Express.js** (Layered REST API architecture)
- **Mongoose ODM** (Schema validation, indexes, references, subdocuments)
- **MongoDB Atlas** (Cloud document database)
- **JWT (jsonwebtoken)** (Stateless authentication)
- **bcryptjs** (Salted password hashing)
- **CORS & Morgan** (Cross-origin configuration & HTTP request logging)
- **dotenv** (Secure environment configuration)

---

## 3. Layered Backend Architecture

Every request travels through dedicated layers to guarantee separation of concerns:

```text
HTTP Request
     ↓
Route Layer (URL endpoints & HTTP method mapping)
     ↓
Authentication Middleware (JWT token verification)
     ↓
Authorization Middleware (Role validation: ADMIN, DOCTOR, RECEPTIONIST)
     ↓
Validation Layer (Input payload & format constraints)
     ↓
Controller Layer (Request parsing, status code handling, response formatting)
     ↓
Service Layer (Pure business logic: scheduling math, slot availability, billing totals)
     ↓
Mongoose Model Layer (Data schemas, indexes, hooks, database persistence)
     ↓
MongoDB Atlas
     ↓
JSON Response ({ success, message, data, pagination })
```

---

## 4. Project Directory Structure

```text
Clinic_management/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/         # Reusable UI (LoadingSpinner, StatusBadge, Navbar)
│   │   ├── pages/              # View pages (HealthCheckPage, ArchitecturePage)
│   │   ├── layouts/            # Page layouts & navigation shells
│   │   ├── services/           # Axios instance & API endpoint services
│   │   ├── context/            # React context (AuthContext, ToastContext)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── utils/              # Client-side formatters and helpers
│   │   ├── routes/             # App routing & ProtectedRoute guards
│   │   ├── styles/             # Global CSS variables & custom styling
│   │   ├── App.jsx             # Main router configuration
│   │   └── main.jsx            # React root entry point
│   ├── package.json
│   ├── vite.config.js          # Vite config with backend proxy (/api -> :5000)
│   ├── .env.example
│   └── .env
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js     # MongoDB Atlas connection & event listeners
│   │   ├── models/             # Mongoose schemas (User, Patient, Doctor, Appointment...)
│   │   ├── controllers/        # Express route controllers
│   │   ├── services/           # Reusable business logic services
│   │   ├── routes/             # Express API routers (health, auth, appointments...)
│   │   ├── middleware/         # Auth, roles, error handling, 404
│   │   ├── validators/         # Request validation logic
│   │   ├── utils/              # AppError, apiResponse helpers
│   │   ├── seeds/              # Database seeding scripts
│   │   ├── app.js              # Express app setup and middleware pipeline
│   │   └── server.js           # Server listener & graceful shutdown
│   ├── package.json
│   ├── .env.example
│   └── .env
│
├── package.json                # Root package with multi-package runner scripts
├── .gitignore                  # Prevents secrets (.env) and node_modules commit
└── README.md
```

---

## 5. Environment Setup & Configuration

### Backend Environment Variables (`backend/.env`)

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/clinic_manager?retryWrites=true&w=majority
JWT_SECRET=dev_jwt_secret_clinic_appointment_manager_2026_super_secure
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

> **Security Note:** `.env` is ignored by git. Never commit real MongoDB credentials or JWT secrets to source control.

### Frontend Environment Variables (`frontend/.env`)

```env
VITE_API_BASE_URL=/api
```

---

## 6. How to Run Locally

### Prerequisites
- Node.js (v18+ or v20+)
- MongoDB Atlas account (or local MongoDB instance)

### 1. Install Dependencies
From the project root:
```bash
npm run install:all
```
*(or run `npm install` inside both `backend` and `frontend` folders)*

### 2. Start Backend Server
```bash
npm run dev:backend
```
Backend will start on: **`http://localhost:5000`**  
Health Check: **`http://localhost:5000/api/health`**

### 3. Start Frontend Dev Server
In a separate terminal:
```bash
npm run dev:frontend
```
Frontend will be available at: **`http://localhost:5173`**

---

## 7. Phase 1 Verification

Phase 1 provides the foundational architecture:
1. **Express Server:** Bootstrapped with CORS, JSON body parser, Morgan logger, and centralized error handling.
2. **MongoDB Atlas Connection Layer:** Configured in `backend/src/config/database.js` with connection state listeners and resilience against initial DB downtime.
3. **Layered Directory Structure:** Clean separation of Routes, Controllers, Services, Models, Middleware, and Utils.
4. **Unified API Response Standard:**
   - Success: `{ success: true, message: string, data: object, pagination?: object }`
   - Error: `{ success: false, message: string, errors?: array }`
5. **Operational Error Handling:** `AppError` class, Mongoose CastError, duplicate key (11000), and validation error mappers.
6. **Health Check Endpoint:** `GET /api/health` providing service uptime, timestamp, and database connectivity.
7. **Frontend Foundation:** React 18 + Vite with Bootstrap 5, Axios configured with Bearer token interceptor, React Router DOM, and an interactive System Health & Architecture dashboard.
