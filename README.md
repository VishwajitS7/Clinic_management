# Clinic Appointment Manager — Full-Stack Technical Architecture & Interview Guide

A comprehensive, production-grade **Clinic Appointment Management System** built with **Node.js, Express, MongoDB Atlas, Mongoose, React, and Bootstrap 5**.

Designed for **campus recruitment technical interviews**, demonstrating deep competence in layered clean architecture, role-based access control (RBAC), database indexing, dynamic interval slot generation, interval-overlap conflict detection, and backend-enforced financial calculations.

---

## 1. Executive Summary & Central Domain Workflow

The system manages the entire outpatient healthcare operational lifecycle across three authenticated roles: **Admin**, **Doctor**, and **Receptionist**.

```text
    Patient Registration (PAT-XXXXXX)
                 ↓
      Doctor Specialist Profiling
                 ↓
     Doctor Weekly Working Schedules
                 ↓
   Dynamic Real-Time Available Slots (Zero Hardcoding)
                 ↓
  Appointment Booking Engine (APT-YYYY-XXXXXX with Overlap Conflict Math)
                 ↓
    Doctor Clinical Encounter / Consultation (1:1 with Appointment)
                 ↓
  Structured Prescription (Rx) with Itemized Medicine Schedules
                 ↓
  Tax Invoice Generation (INV-YYYY-XXXXXX, Backend Financial Recalculation)
                 ↓
 Multi-Tender Payment Receipts (PAY-YYYY-XXXXXX, Overpayment Prevention)
```

---

## 2. Technology Stack & Design Decisions

| Category | Technology | Rationale & Justification |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 (Vite) | Declarative UI, high component reusability, lightning-fast HMR, lightweight bundle. |
| **Styling** | Bootstrap 5 + React-Bootstrap | Clean, accessible clinical UI design system without CSS bloat. |
| **Icons** | Bootstrap Icons | Consistent medical and operational iconography across all screens. |
| **Routing** | React Router DOM v6 | Nested routes, programmatic navigation, role-protected route guards. |
| **State Management** | React Context API | Clean authentication and state flow without third-party Redux complexity. |
| **HTTP Client** | Axios | Interceptors for auto-injecting JWT Bearer tokens and centralized error handling. |
| **Backend Framework** | Node.js + Express.js | Layered RESTful architecture, modular routing, non-blocking asynchronous I/O. |
| **Database** | MongoDB Atlas / Local MongoDB | Schema flexibility with strict Mongoose ODM validation, referencing, and compound indexing. |
| **Authentication** | JWT (`jsonwebtoken`) | Stateless token-based authentication with cryptographically signed payloads. |
| **Password Security** | `bcryptjs` | Salted hashing (10 salt rounds) with automatic pre-save hooks. |
| **Logging & Security** | CORS & Morgan | Whitelisted cross-origin request handling and structured HTTP activity logging. |

---

## 3. Database Entity Relationship (ER) Model

```text
+-------------------+        1:1        +-------------------+
|      User         |<----------------->|      Doctor       |
|-------------------|                   |-------------------|
| _id (PK)          |                   | _id (PK)          |
| name, email       |                   | user (FK -> User) |
| password (bcrypt) |                   | specialization    |
| role (ENUM)       |                   | consultationFee   |
| phone             |                   | roomNumber        |
+-------------------+                   +-------------------+
         ^                                        | 1
         | createdBy                              |
         |                                        | 1:N
+-------------------+                   +-------------------+
|      Patient      |                   |  DoctorSchedule   |
|-------------------|                   |-------------------|
| _id (PK)          |                   | _id (PK)          |
| patientCode (UQ)  |                   | doctor (FK)       |
| firstName         |                   | dayOfWeek (ENUM)  |
| lastName          |                   | startTime (HH:mm) |
| phone, email      |                   | endTime (HH:mm)   |
| gender, bloodGroup|                   | slotDuration (min)|
+-------------------+                   | isAvailable (bool)|
         | 1                                    +-------------------+
         |                                        |
         +-------------------+                    |
                             |                    |
                            1:N                  1:N
                             ↓                    ↓
                     +---------------------------------+
                     |           Appointment           |
                     |---------------------------------|
                     | _id (PK)                        |
                     | appointmentCode (UQ)            |
                     | patient (FK -> Patient)         |
                     | doctor (FK -> Doctor)           |
                     | appointmentDate (Date)          |
                     | startTime (HH:mm)               |
                     | endTime (HH:mm)                 |
                     | status (SCHEDULED, CONFIRMED...)|
                     | createdBy (FK -> User)          |
                     +---------------------------------+
                                      | 1
                                      | 1:1
                                      ↓
                     +---------------------------------+
                     |          Consultation           |
                     |---------------------------------|
                     | _id (PK)                        |
                     | appointment (FK -> Appointment) |
                     | doctor (FK -> Doctor)           |
                     | patient (FK -> Patient)         |
                     | symptoms, diagnosis             |
                     | clinicalNotes, followUpDate     |
                     +---------------------------------+
                                      | 1
                                      | 1:1
                                      ↓
                     +---------------------------------+
                     |          Prescription           |
                     |---------------------------------|
                     | _id (PK)                        |
                     | consultation (FK)               |
                     | doctor (FK), patient (FK)       |
                     | items: [{ medicine, dosage,     |
                     |   frequency, duration, route }] |
                     | instructions                    |
                     +---------------------------------+
                                      |
         +----------------------------+
         ↓
+---------------------------------+        1:N        +---------------------------------+
|             Invoice             |<----------------->|             Payment             |
|---------------------------------|                   |---------------------------------|
| _id (PK)                        |                   | _id (PK)                        |
| invoiceNumber (UQ)              |                   | paymentCode (UQ)                |
| patient (FK -> Patient)         |                   | invoice (FK -> Invoice)         |
| appointment (FK -> Appointment) |                   | amount (Number, min > 0)        |
| items: [{ desc, qty, price }]   |                   | paymentMethod (CASH, UPI, CARD) |
| subtotal, discount, tax         |                   | transactionReference            |
| totalAmount, amountPaid, due    |                   | createdBy (FK -> User)          |
| status (UNPAID, PAID...)        |                   | paidAt (Date)                   |
+---------------------------------+                   +---------------------------------+
```

### Strategic Modeling: Referencing vs. Embedding
- **Referenced**: Core administrative and scheduling entities (`Patient`, `Doctor`, `Appointment`, `Consultation`, `Invoice`) are normalized using Mongoose ObjectIds to prevent unbounded document growth, eliminate redundant data duplication, and enable granular queries.
- **Embedded**: Prescription medicine rows (`Prescription.items`) and Invoice line charges (`Invoice.items`) are embedded subdocuments because they are accessed exclusively within their parent context, are bounded in size (typically 1–10 items), and are atomic in nature.

---

## 4. Layered Backend Architecture

Every HTTP request traverses clear architectural boundaries:

```text
HTTP Request (GET / POST / PATCH / PUT / DELETE)
       ↓
Express Router Layer (backend/src/routes/)
       ↓
Authentication Middleware (authenticateUser -> JWT verification)
       ↓
Authorization Middleware (authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'))
       ↓
Input Validator Layer (backend/src/validators/)
       ↓
Controller Layer (backend/src/controllers/ -> Request parsing, status codes, standard response)
       ↓
Service Layer (backend/src/services/ -> Interval conflict math, Mongoose queries, calculations)
       ↓
Mongoose Model Layer (backend/src/models/ -> Schemas, indexes, pre-validate calculation hooks)
       ↓
MongoDB Database Persistence
       ↓
apiResponse Utility ({ success: true, message, data, pagination })
```

---

## 5. Mathematical Interval Overlap Conflict Detection

Double-booking of physicians is prevented by enforcing interval overlap math on the server:

Two intervals `A = [newStart, newEnd]` and `B = [existingStart, existingEnd]` overlap if and only if:

$$\text{Conflict} \iff \text{newStart} < \text{existingEnd} \land \text{newEnd} > \text{existingStart}$$

### Verification Truth Table
| Case | Slot A | Slot B | $A_{start} < B_{end}$ | $A_{end} > B_{start}$ | Result |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Strictly Before** | 09:00 - 09:30 | 09:30 - 10:00 | True (09:00 < 10:00) | False (09:30 > 09:30 is False) | **No Conflict (Adjacent)** |
| **Strictly After** | 10:00 - 10:30 | 09:30 - 10:00 | False (10:00 < 10:00 is False) | True (10:30 > 09:30) | **No Conflict (Adjacent)** |
| **Partial Overlap** | 09:15 - 09:45 | 09:00 - 09:30 | True (09:15 < 09:30) | True (09:45 > 09:00) | **Conflict (HTTP 409)** |
| **Identical Slot** | 09:00 - 09:30 | 09:00 - 09:30 | True (09:00 < 09:30) | True (09:30 > 09:00) | **Conflict (HTTP 409)** |
| **Enclosing Slot** | 09:00 - 10:30 | 09:30 - 10:00 | True (09:00 < 10:00) | True (10:30 > 09:30) | **Conflict (HTTP 409)** |

*Note: Cancelled appointments (`status === 'CANCELLED'`) are dynamically excluded from overlap checks.*

---

## 6. Role-Based Access Control (RBAC) Matrix

| Endpoint | Method | Admin | Doctor | Receptionist | Description |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `/api/auth/login` | POST | Yes | Yes | Yes | Public authentication |
| `/api/auth/me` | GET | Yes | Yes | Yes | Logged-in profile |
| `/api/patients` | GET | Yes | Yes | Yes | Search & filter patients |
| `/api/patients` | POST | Yes | No | Yes | Register new patient |
| `/api/patients/:id` | GET | Yes | Yes | Yes | View comprehensive dossier |
| `/api/doctors` | GET | Yes | Yes | Yes | Specialist directory |
| `/api/doctors` | POST | Yes | No | No | Register new doctor |
| `/api/doctors/:id/available-slots` | GET | Yes | Yes | Yes | Dynamic interval slots |
| `/api/schedules` | POST | Yes | Yes (Own) | No | Create weekly shift |
| `/api/appointments` | GET | Yes | Yes (Own) | Yes | List appointments |
| `/api/appointments` | POST | Yes | Yes | Yes | Book appointment |
| `/api/appointments/:id/status` | PATCH | Yes | Yes | Yes | Transition status |
| `/api/appointments/:id/reschedule` | PUT | Yes | Yes | Yes | Reschedule appointment |
| `/api/appointments/:id` | DELETE | Yes | No | Yes | Cancel appointment |
| `/api/consultations` | GET | Yes | Yes (Own) | Yes | List consultations |
| `/api/consultations` | POST | Yes | Yes (Own) | No | Record clinical encounter |
| `/api/prescriptions` | GET | Yes | Yes (Own) | Yes | View prescriptions |
| `/api/prescriptions` | POST | Yes | Yes (Own) | No | Issue medical Rx |
| `/api/invoices` | GET | Yes | Yes | Yes | View invoices |
| `/api/invoices` | POST | Yes | No | Yes | Generate invoice |
| `/api/invoices/:id/payments` | POST | Yes | No | Yes | Record payment |
| `/api/invoices/payments` | GET | Yes | No | Yes | Payments ledger |
| `/api/dashboard/stats` | GET | Yes | Yes | Yes | Role-tailored analytics |

---

## 7. Demo Accounts & Credentials

Pre-seeded credentials ready for technical demonstration:

| Role | Email Address | Password | Clinical Specialization |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@clinic.com` | `Admin@123` | Clinic Management & Supervision |
| **Attending Doctor** | `dr.rahul@clinic.com` | `Doctor@123` | General Medicine & Cardiology |
| **Attending Doctor** | `dr.priya@clinic.com` | `Doctor@123` | Dermatology |
| **Attending Doctor** | `dr.arun@clinic.com` | `Doctor@123` | Orthopedics |
| **Front-Desk Receptionist**| `receptionist@clinic.com` | `Recep@123` | Registration & Billing Desk |

---

## 8. Installation, Seeding & Execution Guide

### Prerequisites
- Node.js (v18.x or v20.x recommended)
- MongoDB instance (MongoDB Community Local or MongoDB Atlas URI)

### Step 1: Clone and Configure Environment Files

**Backend Configuration (`backend/.env`):**
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/clinic_manager
JWT_SECRET=production_interview_jwt_secret_clinic_manager_2026_secure
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Frontend Configuration (`frontend/.env`):**
```env
VITE_API_BASE_URL=/api
```

### Step 2: Install Dependencies
```bash
# Install root, backend, and frontend dependencies
npm run install:all
```

### Step 3: Run Seed Script
```bash
cd backend
npm run seed
```
*Seeds 7 users (Admin, Receptionist, 5 Doctors), 55 weekly working schedules, 20 patients, 16 appointments, 7 consultations, 7 prescriptions, 7 invoices, and 6 payments.*

### Step 4: Run Application
```bash
# Terminal 1: Backend Dev Server
cd backend
npm run dev

# Terminal 2: Frontend Vite Server
cd frontend
npm run dev
```

- Frontend App: **`http://localhost:5173`**
- Backend Health Check: **`http://localhost:5000/api/health`**
- Postman Collection: `clinic_appointment_manager.postman_collection.json` (located in root directory)

---

## 9. Section 50: Technical Interview Defense & Viva Guide (40 Comprehensive Answers)

### Part 1: Architecture & Backend Design

#### 1. Why did you choose a layered architecture (Routes -> Controllers -> Services -> Models)?
**Answer:** Layered architecture establishes strict separation of concerns. The **Route layer** only maps HTTP verbs to endpoints and attaches auth middleware. The **Controller layer** handles HTTP semantics (parsing query parameters, returning standardized status codes). The **Service layer** contains pure business logic (interval overlap math, financial recalculations) completely decoupled from `req` and `res`, making it testable and reusable. The **Model layer** encapsulates schema definitions, validation constraints, and database queries. This prevents "fat controllers" and ensures that if we switch protocols or frameworks, business rules remain untouched.

#### 2. What is the difference between operational errors and programmer errors?
**Answer:** **Operational errors** are inevitable runtime situations in a correctly written program, such as duplicate keys (HTTP 409), invalid user input (HTTP 400), unauthenticated requests (HTTP 401), or time slot conflicts. We handle these gracefully using our custom `AppError` class with `isOperational = true`. **Programmer errors** are unanticipated bugs in code (syntax errors, `TypeError: Cannot read properties of undefined`, unhandled promise rejections). These are caught by centralized Express error-handling middleware, logged to error tracking, and presented to clients as generic 500 Internal Server Errors to avoid leaking server internals.

#### 3. How does centralized error handling work in Express?
**Answer:** In Express, any middleware with four arguments `(err, req, res, next)` is recognized as an error-handling middleware. When controllers call `next(error)` inside `try...catch` blocks, Express skips all subsequent regular middleware and delegates execution directly to `errorHandler.js`. It inspects `err.statusCode`, maps Mongoose-specific errors (CastError, ValidationError, MongoError 11000), and outputs a uniform error response `{ success: false, message, errors }`.

#### 4. Why use Mongoose schema validation instead of relying solely on frontend validation?
**Answer:** Frontend validation is purely for user experience (instant visual feedback) and can be easily bypassed using tools like Postman, curl, or browser developer tools. Backend Mongoose validation guarantees database integrity at the persistence level. In our system, required constraints, email regexes, enum values, and positive financial numbers are enforced in Mongoose schemas so invalid data can never enter MongoDB.

#### 5. How does the health check endpoint determine system readiness?
**Answer:** `GET /api/health` checks `mongoose.connection.readyState`. If the value is `1` (`CONNECTED`), it returns HTTP 200 with process uptime, timestamp, and environment. If MongoDB is disconnected (state `0`), it returns HTTP 503 Service Unavailable. This is critical for Kubernetes liveness/readiness probes or AWS ELB health checks.

#### 6. Why did you choose JWT over stateful server sessions?
**Answer:** JWTs are stateless. The user's identity (`_id`, `role`, `email`) is cryptographically signed inside the token payload and stored client-side in `localStorage`. The backend server does not need to query a Redis session store or database on every single incoming HTTP request, enabling horizontal scalability across multiple server instances.

#### 7. How are secret environment variables protected?
**Answer:** All sensitive configuration (`MONGODB_URI`, `JWT_SECRET`, `PORT`) is managed via `dotenv` and loaded from `.env` files. Both `backend/.env` and `frontend/.env` are strictly listed in `.gitignore`. Example template files (`.env.example`) are provided with dummy placeholders for team onboarding.

#### 8. What is the purpose of the code generator utility (`PAT-`, `APT-`, etc.)?
**Answer:** Sequential, human-readable identifier codes (e.g., `PAT-000001`, `APT-2026-000001`, `INV-2026-000001`) allow clinic receptionists, doctors, and patients to easily reference appointments and bills verbally or on paper, avoiding unwieldy 24-character hexadecimal MongoDB ObjectIds.

---

### Part 2: Database Modeling & Indexing

#### 9. Why are Consultations modeled as a separate collection instead of embedded in Appointments?
**Answer:** While there is a 1:1 relationship between an appointment and its clinical consultation, consultations represent distinct clinical encounter records with extensive diagnoses, symptoms, and potential follow-up dates. Separating them allows independent queries for medical history, prevents bloating appointment scheduling queries, and supports role-based permissions where receptionists can view appointments without accessing confidential medical notes.

#### 10. Why are Prescription items embedded instead of normalized into a Medicines collection?
**Answer:** Prescription items (`medicineName`, `dosage`, `frequency`, `duration`, `route`, `instructions`) are immutable historical records of what was prescribed at that specific clinical moment. Embedding them ensures that future edits to a clinic pharmacy catalog will never retroactively alter past medical prescriptions. Furthermore, prescription items are always retrieved together with the parent prescription.

#### 11. Explain the compound index `{ doctor: 1, appointmentDate: 1, status: 1 }` on Appointments.
**Answer:** This index is tailored for interval conflict detection and schedule queries. When an appointment is booked or slots are calculated, the database executes:
`db.appointments.find({ doctor: doctorId, appointmentDate: { $gte, $lte }, status: { $nin: ['CANCELLED'] } })`.
The compound index enables MongoDB to satisfy the query using an index scan (IXSCAN) without a full collection scan (COLLSCAN), executing in $O(\log N)$ time.

#### 12. How do Mongoose pre-validate hooks enforce financial integrity on Invoices?
**Answer:** In `Invoice.js`, a `pre('validate')` hook recalculates `item.amount = quantity * unitPrice` for every item, sums them into `subtotal`, computes `totalAmount = subtotal - discount + tax`, and sets `amountDue = totalAmount - amountPaid`. It also sets the invoice status (`UNPAID`, `PARTIALLY_PAID`, `PAID`). This guarantees that even if a malicious client sends falsified totals, the database hook computes the exact mathematical values before persisting.

#### 13. What is the difference between Mongoose pre-save and pre-validate hooks?
**Answer:** `pre('validate')` runs *before* Mongoose schema validation executes. This is ideal for calculating derived fields (such as invoice subtotal or amount due) that are required by the schema. `pre('save')` runs *after* validation succeeds, right before the document is written to MongoDB, which is where password hashing with bcrypt is performed.

#### 14. Why did you use soft status transitions (`CANCELLED`) instead of deleting records?
**Answer:** In healthcare compliance, medical and audit trails must be preserved. Deleting an appointment record destroys operational history. By transitioning status to `CANCELLED`, the slot is freed for new bookings while maintaining legal traceability of who scheduled and cancelled the appointment.

#### 15. How does MongoDB handle timezone differences in Date fields?
**Answer:** MongoDB stores all `Date` objects internally as 64-bit integers representing milliseconds since Unix epoch in UTC. To prevent calendar shifts across timezones (e.g. UTC vs IST +05:30), our scheduling and appointment engines normalize dates to UTC midnight (`setUTCHours(0, 0, 0, 0)`), ensuring consistent day-of-week matching.

#### 16. What is the N+1 query problem and how does Mongoose `populate` avoid or trigger it?
**Answer:** The N+1 problem occurs when fetching $N$ records requires $N$ additional separate database queries to fetch related entities. Mongoose `populate()` optimizes this by collecting all referenced ObjectIds from the parent array and executing a single `$in` query: `db.patients.find({ _id: { $in: [id1, id2, ...] } })`. This executes in exactly 2 database round trips ($1 + 1$) instead of $N + 1$.

---

### Part 3: Scheduling & Conflict Math

#### 17. State the exact mathematical condition for two time intervals to overlap.
**Answer:** Given Interval 1 $[S_1, E_1]$ and Interval 2 $[S_2, E_2]$:
$$\text{Overlap} \iff S_1 < E_2 \land E_1 > S_2$$
If and only if both conditions are true, the intervals intersect in time.

#### 18. Why is `newStart < existingEnd && newEnd > existingStart` better than checking if `newStart` is between `existingStart` and `existingEnd`?
**Answer:** Checking if `newStart >= existingStart && newStart < existingEnd` misses scenarios where the new appointment is larger than and completely envelops the existing appointment (e.g. new appointment: 09:00–11:00, existing appointment: 09:30–10:00). In that case, `newStart` (09:00) is *not* between 09:30 and 10:00, causing a false negative. The formula $S_1 < E_2 \land E_1 > S_2$ covers all 4 topological overlap cases.

#### 19. How are time slots generated dynamically without hardcoding in the frontend?
**Answer:** In `slotGenerator.js`, the service receives the doctor's active `DoctorSchedule` for that day of week (e.g. 09:00 to 13:00, slot duration: 30 min). It converts start and end times to minutes from midnight (540 min to 780 min). A `while` loop iterates in 30-minute steps generating `[09:00, 09:30]`, `[09:30, 10:00]`, etc. For each slot, it checks for overlap against booked appointments on that date, outputting `{ startTime, endTime, available: boolean }`.

#### 20. How does the system handle doctors with multiple shifts in a single day?
**Answer:** A doctor can have multiple `DoctorSchedule` documents on the same day (e.g. Morning Shift: 09:00–13:00, Evening Shift: 17:00–20:00). `validateScheduleCoverage` queries all active schedules for that doctor and day, ensuring the requested slot fits entirely within at least one valid shift.

#### 21. How does rescheduling work without causing false conflicts with the existing appointment?
**Answer:** When `rescheduleAppointment(id, newDate, newStartTime, newEndTime)` is called, the conflict detection query passes `excludeAppointmentId: id`. This ensures `Appointment.find({ _id: { $ne: id } })` ignores the appointment being rescheduled, preventing it from conflicting with its own previous time slot.

---

### Part 4: Authentication & Role Authorization

#### 22. Explain how `authenticateUser` and `authorizeRoles` middlewares work together.
**Answer:** `authenticateUser` verifies the incoming `Authorization: Bearer <token>` header using `jwt.verify()`, fetches the active user, and attaches `req.user = user`. It then calls `next()`. Next, `authorizeRoles('ADMIN', 'DOCTOR')` returns a closure that checks if `allowedRoles.includes(req.user.role)`. If true, execution continues; otherwise, it throws an `AppError('Forbidden: Access denied', 403)`.

#### 23. Why use 10 salt rounds in bcrypt?
**Answer:** 10 rounds means $2^{10} = 1024$ key expansion hashing iterations. It provides the optimal balance between security against brute-force/GPU cracking attacks (~100ms calculation time per password on modern CPUs) and server response latency for legitimate user logins.

#### 24. What happens when a JWT expires?
**Answer:** When a JWT expires, `jwt.verify()` throws a `TokenExpiredError`. The centralized error handler catches this, creates a clear 401 Unauthorized response (`"Token has expired. Please log in again"`), and the frontend Axios response interceptor intercepts the 401, clears `localStorage`, and redirects the user to `/login`.

#### 25. How do you prevent horizontal privilege escalation in doctor consultations?
**Answer:** In `consultationService.js`, if `currentUser.role === 'DOCTOR'`, we query `Doctor.findOne({ user: currentUser._id })`. We verify that `String(appointment.doctor) === String(doctorProfile._id)`. If Doctor A attempts to record or update a consultation for Doctor B's appointment, the server throws an HTTP 403 Forbidden error.

---

### Part 5: Clinical Modules (Consultation & Prescription)

#### 26. How is the 1:1 constraint between Appointment and Consultation enforced?
**Answer:** At the database level, `Consultation.schema` marks `appointment: { type: ObjectId, unique: true }`. At the service level, before creating a consultation, `Consultation.findOne({ appointment: appointmentId })` checks if one exists and throws an HTTP 409 Conflict error if already recorded.

#### 27. What status transition occurs when a Consultation is recorded?
**Answer:** Recording a consultation completes the clinical encounter. The service sets `appointment.status = 'COMPLETED'` and saves the appointment record in the same execution cycle.

#### 28. What constitutes the Section 21 printable prescription format?
**Answer:** It follows standard Indian medical council prescription guidelines: Clinic Header (Name, Reg, Address), Doctor Credentials & License Number, Patient Demographics, Clinical Diagnosis, the traditional **Rx** symbol, itemized medication table (Name, Dosage, Frequency, Duration, Route, Instructions), general clinical guidance, and an authorized digital signature block.

#### 29. Can a completed appointment be cancelled or rescheduled?
**Answer:** No. In `appointmentService.js`, state machine rules prohibit modifying terminal states:
`if (appointment.status === 'COMPLETED') throw new AppError('Completed appointments cannot be rescheduled or cancelled', 400);`

---

### Part 6: Billing, Invoices & Payments

#### 30. Why must invoice subtotal, tax, and discount never be trusted from the frontend?
**Answer:** A client could inspect network requests and send `{ totalAmount: 1 }` for a ₹5,000 consultation. By calculating line totals `qty * unitPrice`, summing subtotals, and applying discounts on the backend, the server guarantees financial correctness regardless of client input.

#### 31. How does the system prevent overpayment on an invoice?
**Answer:** In `invoiceService.js`:
```javascript
if (paymentAmount > invoice.amountDue) {
  throw new AppError(`Payment amount ₹${paymentAmount} exceeds balance due of ₹${invoice.amountDue}`, 400);
}
```
If an invoice has ₹400 remaining and a payment of ₹500 is submitted, it is rejected with HTTP 400.

#### 32. What are the invoice status transitions during payments?
**Answer:**
- When issued: `UNPAID` (`amountPaid = 0`).
- When a payment $0 < P < \text{totalAmount}$ is received: `PARTIALLY_PAID`.
- When cumulative payments equal `totalAmount` (`amountDue = 0`): `PAID`.
- If invalidated: `CANCELLED`.

#### 33. Why is payment recorded as a separate document rather than updating only the invoice?
**Answer:** In accounting, every transaction must have an immutable audit receipt. If a patient pays in two installments (e.g. ₹500 via UPI on Monday, ₹500 Cash on Tuesday), the clinic needs two separate `Payment` records with distinct payment codes (`PAY-XXXXXX`), timestamps, transaction references, and cashier identifiers.

---

### Part 7: Frontend Architecture & React Best Practices

#### 34. How does the Vite reverse proxy solve CORS issues in development?
**Answer:** In `vite.config.js`:
```javascript
server: {
  proxy: {
    '/api': { target: 'http://localhost:5000', changeOrigin: true }
  }
}
```
Browser requests to `/api/...` are sent to `localhost:5173`. The Vite development server forwards them to `localhost:5000` server-to-server, bypassing browser Same-Origin Policy (SOP) restrictions.

#### 35. Explain the role of Axios request and response interceptors in `api.js`.
**Answer:** The **Request Interceptor** inspects `localStorage.getItem('token')`. If present, it attaches `config.headers.Authorization = 'Bearer ' + token` to every outgoing request. The **Response Interceptor** checks for `error.response?.status === 401`. If an expired token is detected, it clears storage and redirects to `/login`.

#### 36. Why use Context API instead of Redux for this application?
**Answer:** Redux introduces significant boilerplate (actions, reducers, dispatchers, store configuration). Context API provides a lightweight, native React solution for global concerns like Authentication (`AuthContext`). Local UI states (filters, modal open/close, pagination) remain localized within component state, avoiding unnecessary global re-renders.

#### 37. How does `useCallback` optimize the appointment and patient fetching functions?
**Answer:** Functions defined inside components are re-created on every render. Wrapping `fetchAppointments` in `useCallback` with dependencies `[page, search, selectedDoctorFilter, selectedStatusFilter]` ensures the function reference remains stable unless a dependency changes, preventing infinite loops when passed to `useEffect`.

#### 38. How is the step-by-step booking modal structured in `AppointmentsPage.jsx`?
**Answer:** It guides the user through 5 sequential steps:
1. Select active patient
2. Select specialist doctor
3. Select appointment date
4. Dynamically load and render real-time available slots using `TimeSlotSelector`
5. Input clinical visit reason and submit

#### 39. What is the role of `ProtectedRoute` and `RoleGuard` in client-side security?
**Answer:** `ProtectedRoute` checks `isAuthenticated`. If false, it redirects unauthenticated users to `/login`. `RoleGuard` checks if `allowedRoles.includes(user.role)`. If a Receptionist tries to access `/doctors/new`, `RoleGuard` renders a forbidden alert or redirects, preventing unauthorized navigation.

#### 40. If you were deploying this application to production, what architectural enhancements would you make?
**Answer:**
1. **Containerization**: Package frontend and backend with multi-stage Dockerfiles.
2. **Reverse Proxy & SSL**: Nginx with Let's Encrypt SSL certificates.
3. **Database Caching**: Redis cache for doctor working schedules and specialist directories.
4. **Rate Limiting**: `express-rate-limit` to prevent brute-force attacks on `/api/auth/login`.
5. **Real-time Notifications**: WebSockets (Socket.io) to notify doctors instantly when an appointment is booked.
6. **Automated Testing**: Jest and Supertest for backend integration tests, React Testing Library for frontend component tests.

---

## 10. License & Authorship
- **Author**: Vishwajit S (Candidate / Project Lead)
- **License**: MIT
- **Application**: Clinic Appointment Manager — Campus Technical Project
