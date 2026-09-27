# Deployment Guide - Clinic Appointment Manager

This guide covers deployment options for the **Clinic Appointment Manager** full-stack system.

---

## Pre-Deployment Checklist

1. **MongoDB Atlas IP Whitelist (Critical)**:
   - Navigate to **MongoDB Atlas > Network Access**.
   - Click **Add IP Address** and choose **Allow Access From Anywhere** (`0.0.0.0/0`) or whitelist your cloud hosting provider's IP range.
   - Without this, cloud servers (e.g. Render, Railway, Vercel) will be blocked from connecting to your database.

2. **Environment Variables Required**:
   | Variable | Example Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables production optimizations & static asset serving |
   | `PORT` | `5000` | Port for Express server (often assigned dynamically by host) |
   | `MONGODB_URI` | `mongodb+srv://user:pass@cluster0...` | MongoDB Atlas connection string |
   | `JWT_SECRET` | `your_secure_random_jwt_key_here` | 32+ character random string |
   | `JWT_EXPIRES_IN` | `1d` | Token validity duration |
   | `CLIENT_URL` | `https://your-domain.com` | Allowed CORS origin (or unified host) |

---

## Option 1: Unified Single-Service Deployment on Render.com (Recommended)

Render can build the React frontend and run the Node.js backend together in a single Web Service. This eliminates CORS complexities and uses only 1 free service tier.

### Steps on Render:
1. Log in to [Render.com](https://render.com) and click **New + > Web Service**.
2. Connect your GitHub repository (`VishwajitS7/Clinic_management`).
3. Set the following configuration:
   - **Name**: `clinic-appointment-manager`
   - **Region**: Choose the closest region (e.g., Singapore, Frankfurt, Oregon)
   - **Branch**: `main`
   - **Root Directory**: Leave blank (root of repository)
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
4. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = `mongodb+srv://...` (your Atlas URI)
   - `JWT_SECRET` = `<your-jwt-secret>`
   - `JWT_EXPIRES_IN` = `1d`
5. Click **Create Web Service**.
6. Render will run `npm run build` (building Vite frontend into `frontend/dist`) and start Express on port 5000. Once complete, your entire app is live at `https://clinic-appointment-manager.onrender.com`!

---

## Option 2: Split Deployment (Frontend on Vercel + Backend on Render/Railway)

### Step A: Deploy Backend on Render / Railway
1. Create a Web Service pointing to the `backend/` directory.
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Environment Variables**: `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL` set to your Vercel domain.
2. Note your backend live URL, e.g. `https://clinic-api.onrender.com`.

### Step B: Deploy Frontend on Vercel
1. Log in to [Vercel](https://vercel.com) and click **Add New > Project**.
2. Import the repository.
3. Configure the Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Environment Variables**:
     - `VITE_API_BASE_URL` = `https://clinic-api.onrender.com/api`
4. Click **Deploy**. Vercel will use [`frontend/vercel.json`](file:///d:/Clinic_management/frontend/vercel.json) to ensure clean SPA routing on client-side page refreshes.

---

## Option 3: Docker Containerization

Deployable to any container platform (AWS ECS, GCP Cloud Run, DigitalOcean App Platform, Railway Docker, or a VPS).

### Run with Docker Compose Locally or on a VPS:
```bash
# 1. Set environment variables
export MONGODB_URI="mongodb+srv://vishu31103_db_user:<password>@cluster0.80aiv2y.mongodb.net/clinic_manager?retryWrites=true&w=majority"
export JWT_SECRET="your_production_secret_key"

# 2. Build and run in detached mode
docker compose up --build -d

# 3. Check container logs
docker compose logs -f
```
The app will be accessible at `http://localhost:5000` (or `http://<your-vps-ip>:5000`).

---

## Database Seeding in Production (Optional)

To seed initial demonstration data into your Atlas production database:
```bash
# Run from repository root
npm run seed
```
This populates standard demo accounts (`admin@clinic.com`, `dr.rahul@clinic.com`, `receptionist@clinic.com`) and default doctor schedule blocks.
