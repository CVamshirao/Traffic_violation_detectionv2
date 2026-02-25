# 🚦 AI-Based Traffic Violation Detection System

An intelligent, full-stack web application for reporting, verifying, and managing traffic violations using **AI-powered image analysis**. The system uses a **two-stage AI verification pipeline** — YOLOv8 object detection followed by Gemini/Heuristic contextual analysis — to automatically validate submitted evidence before admin review.

---

## 📑 Table of Contents

- [Features](#-features)
- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Two-Stage AI Verification Pipeline](#-two-stage-ai-verification-pipeline)
- [Database Schema](#-database-schema)
- [API Endpoints](#-api-endpoints)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [How It Works (User Flow)](#-how-it-works-user-flow)
- [Key Concepts Explained](#-key-concepts-explained)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

### For Users (Reporters)
- 📸 **Report violations** with photo evidence, location, and plate number
- 🤖 **Instant AI verification** of submitted images (YOLO + Gemini/Heuristic)
- 📊 **Track your reported violations** — see status (Pending / Approved / Rejected)
- 💰 **View fines** issued against violations
- 💳 **Make payments** for fines online

### For Admins
- 🛡️ **Admin panel** to review all violations with evidence images
- ✅ **Approve / Reject** violations with custom fine amounts
- 📈 **Dashboard** with real-time statistics (total violations, pending count, revenue)
- 👥 **User management** — view registered users

### AI & Detection
- 🔍 **Stage 1 — YOLO**: Real-time object detection (cars, motorcycles, traffic lights, persons, etc.)
- 🧠 **Stage 2 — Gemini AI**: Contextual violation verification via Google Generative AI
- 🆓 **Stage 2 Fallback — Heuristic AI**: Free rule-based verification when Gemini is unavailable
- 🔄 **Graceful degradation**: If any AI stage fails, the system falls back intelligently

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (React)                  │
│         Vite + React 19 + Tailwind CSS 4            │
│     Port: 5173 (dev) — Proxies /api → :8080         │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP (REST API)
                       ▼
┌─────────────────────────────────────────────────────┐
│               BACKEND (Spring Boot)                 │
│        Java 17 + Spring Boot 3.2 + JPA              │
│        Port: 8080 — REST API + JWT Auth             │
│                                                     │
│  ┌───────────────────────────────────┐              │
│  │     AIVerificationService         │              │
│  │  ┌─────────┐   ┌──────────────┐  │              │
│  │  │ Stage 1  │──▶│   Stage 2    │  │              │
│  │  │  YOLO    │   │ Gemini/Heur. │  │              │
│  │  └────┬─────┘   └──────┬───────┘  │              │
│  └───────│────────────────│──────────┘              │
└──────────│────────────────│─────────────────────────┘
           │ HTTP           │ HTTP (Gemini API)
           ▼                │ + HTTP (Heuristic /analyze)
┌──────────────────────┐    │
│  YOLO Python Service │◄───┘
│  FastAPI + YOLOv8n   │
│  Port: 8081          │
│  /detect + /analyze  │
└──────────────────────┘
           │
           ▼
┌──────────────────────┐
│     MySQL Database   │
│  traffic_violation_db│
│     Port: 3306       │
└──────────────────────┘
```

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Java 17** | Programming language |
| **Spring Boot 3.2** | Web framework, dependency injection, auto-configuration |
| **Spring Security** | Authentication & authorization (role-based: USER / ADMIN) |
| **Spring Data JPA** | ORM — maps Java objects to MySQL tables via Hibernate |
| **JWT (jjwt 0.12)** | Stateless authentication using JSON Web Tokens |
| **MySQL 8** | Relational database for persistent storage |
| **Lombok** | Reduces boilerplate (getters, setters, builders, constructors) |
| **Maven** | Build tool and dependency management |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI library — component-based architecture |
| **Vite 7** | Lightning-fast build tool and dev server |
| **Tailwind CSS 4** | Utility-first CSS framework |
| **React Router 7** | Client-side routing (SPA navigation) |
| **Axios** | HTTP client for API calls |

### AI / ML
| Technology | Purpose |
|---|---|
| **YOLOv8n (Ultralytics)** | Real-time object detection — identifies vehicles, persons, traffic elements |
| **Google Gemini 2.0 Flash** | Vision-language model — contextual violation verification |
| **FastAPI** | Python web framework hosting the YOLO microservice |
| **Pillow (PIL)** | Image processing in Python |

---

## 📁 Project Structure

```
Traffic_violation_detection/
│
├── backend/                          # Spring Boot Java Backend
│   ├── src/main/java/com/tvds/
│   │   ├── TvdsApplication.java      # Main Spring Boot entry point
│   │   ├── config/
│   │   │   ├── SecurityConfig.java   # Spring Security + CORS configuration
│   │   │   ├── JwtAuthFilter.java    # JWT token filter (intercepts every request)
│   │   │   ├── JwtUtil.java          # JWT token generation & validation
│   │   │   ├── WebConfig.java        # Static resource serving (uploads)
│   │   │   └── GlobalExceptionHandler.java
│   │   ├── controller/               # REST API endpoints
│   │   │   ├── AuthController.java   # POST /api/auth/register, /api/auth/login
│   │   │   ├── ViolationController.java  # CRUD for violations
│   │   │   ├── DashboardController.java  # GET /api/dashboard (stats)
│   │   │   ├── VehicleController.java
│   │   │   ├── FineController.java
│   │   │   └── PaymentController.java
│   │   ├── dto/                      # Data Transfer Objects (request/response shapes)
│   │   │   ├── LoginRequest.java
│   │   │   ├── RegisterRequest.java
│   │   │   ├── ViolationRequest.java
│   │   │   ├── ApiResponse.java
│   │   │   └── ...
│   │   ├── model/                    # JPA Entities (database tables)
│   │   │   ├── User.java            # users table
│   │   │   ├── Vehicle.java         # vehicles table
│   │   │   ├── Violation.java       # violations table
│   │   │   ├── Fine.java            # fines table
│   │   │   ├── Payment.java         # payments table
│   │   │   ├── Role.java            # Enum: USER, ADMIN
│   │   │   ├── ViolationType.java   # Enum: OVER_SPEED, NO_HELMET, etc.
│   │   │   ├── ViolationStatus.java # Enum: PENDING, APPROVED, REJECTED
│   │   │   └── PaymentStatus.java   # Enum: UNPAID, PAID
│   │   ├── repository/              # Spring Data JPA repositories (database queries)
│   │   │   ├── UserRepository.java
│   │   │   ├── ViolationRepository.java
│   │   │   ├── VehicleRepository.java
│   │   │   ├── FineRepository.java
│   │   │   └── PaymentRepository.java
│   │   └── service/                  # Business logic layer
│   │       ├── AIVerificationService.java   # ⭐ Two-stage AI pipeline
│   │       ├── YoloDetectionService.java    # ⭐ Calls YOLO Python service
│   │       ├── ViolationService.java        # Violation CRUD + fine calculation
│   │       ├── AuthService.java             # Registration, login, JWT
│   │       ├── DashboardService.java
│   │       ├── VehicleService.java
│   │       ├── FineService.java
│   │       └── PaymentService.java
│   ├── src/main/resources/
│   │   └── application.properties    # All configuration (DB, JWT, Gemini, YOLO)
│   ├── pom.xml                       # Maven dependencies
│   └── mvnw / mvnw.cmd              # Maven wrapper (no need to install Maven)
│
├── frontend/                         # React Frontend
│   ├── src/
│   │   ├── main.jsx                  # React entry point
│   │   ├── App.jsx                   # Router + layout
│   │   ├── index.css                 # Global styles (Tailwind + custom CSS)
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # React Context for authentication state
│   │   ├── components/
│   │   │   └── Navbar.jsx            # Navigation bar component
│   │   ├── pages/
│   │   │   ├── Login.jsx             # Login form
│   │   │   ├── Register.jsx          # Registration form
│   │   │   ├── Dashboard.jsx         # Stats overview
│   │   │   ├── ReportViolation.jsx   # ⭐ Upload evidence + see AI result
│   │   │   ├── Violations.jsx        # User's violation history
│   │   │   ├── Vehicles.jsx          # Vehicle management
│   │   │   ├── Fines.jsx             # View fines
│   │   │   ├── Payments.jsx          # Payment history
│   │   │   └── AdminPanel.jsx        # ⭐ Admin review + approve/reject
│   │   └── services/
│   │       └── api.js                # Axios instance + API helper functions
│   ├── vite.config.js                # Vite config + API proxy
│   └── package.json                  # NPM dependencies
│
└── yolo_service/                     # Python YOLO Microservice
    ├── main.py                       # ⭐ FastAPI app: /detect + /analyze endpoints
    └── requirements.txt              # Python dependencies
```

---

## 🤖 Two-Stage AI Verification Pipeline

This is the core innovation of the project. When a user submits a violation image:

### Stage 1: YOLO Object Detection (`/detect`)

**What it does:** Uses YOLOv8n (a pre-trained neural network) to detect objects in the image.

**How it works:**
1. Image is sent to the Python FastAPI service (`POST /detect`)
2. YOLOv8n identifies objects from COCO dataset (80 classes including car, motorcycle, person, truck, bus, traffic light, stop sign)
3. Each detected object gets a **confidence score** (0–100%)
4. Objects are assigned **weights** based on traffic relevance:
   - `car`, `motorcycle`, `bus`, `truck` → weight **1.0** (highest)
   - `bicycle` → weight **0.8**
   - `traffic light`, `stop sign` → weight **0.7**
   - `person` → weight **0.5**
5. A **weighted traffic score** is computed: `sum(confidence × weight) / sum(weights)`
6. If score ≥ **40%** → **PASS** (proceed to Stage 2)
7. If score < 40% → **REJECT** immediately (no vehicle/traffic scene detected)

**Key learning:** This is a *pre-filter*. It's fast (~50ms per image) and prevents non-traffic images from ever reaching the expensive AI model.

### Stage 2: Contextual Verification

**Option A — Gemini AI (primary, requires API key):**
1. Sends the base64-encoded image + a structured prompt to Google Gemini
2. Asks: "Does this image show evidence of a [violation type] involving a [vehicle category]?"
3. Gemini returns JSON with `is_violation`, `confidence`, `vehicle_detected`, `is_traffic_scene`, `remarks`
4. If confidence ≥ **55%** and `is_violation` is true → **VERIFIED**

**Option B — Heuristic AI (free fallback, no API key needed):**
1. When Gemini fails (429 quota / timeout), falls back to `POST /analyze`
2. Runs YOLO detection again + applies **violation-type-specific rules**:
   - `NO_HELMET`: requires motorcycle/bicycle + person detected
   - `SIGNAL_JUMP`: requires vehicle + traffic light
   - `TRIPLE_RIDING`: requires motorcycle + multiple persons
   - etc.
3. Calculates confidence with boosts for matching context
4. Same threshold (≥ 55%) applies

### Fallback Chain
```
Image → YOLO Stage 1 → Pass?
                          │
                    No ───┤──→ REJECTED (no traffic scene)
                          │
                    Yes ──┤──→ Try Gemini Stage 2
                          │         │
                          │    Success ──→ Use Gemini result
                          │         │
                          │    Fail (429/timeout) ──→ Try Heuristic /analyze
                          │                               │
                          │                          Success ──→ Use Heuristic result
                          │                               │
                          │                          Fail ──→ Accept with YOLO-only
                          │
                          └──→ Final Result: VERIFIED or REJECTED
```

---

## 🗄 Database Schema

```
┌──────────┐     ┌────────────┐     ┌─────────────┐
│  users   │     │  vehicles  │     │ violations  │
├──────────┤     ├────────────┤     ├─────────────┤
│ id (PK)  │◄──┐│ id (PK)    │◄───┐│ id (PK)     │
│ username │   ││ plate_no   │    ││ vehicle_id  │──→ vehicles.id
│ email    │   ││ owner_name │    ││ type        │
│ password │   ││ vehicle_type    ││ location    │
│ role     │   │└────────────┘    ││ status      │  PENDING/APPROVED/REJECTED
│ full_name│   │                  ││ evidence_img│
│ phone    │   │                  ││ ai_verified │  true/false
└──────────┘   │                  ││ ai_confid.  │  0.0–1.0
               │                  ││ ai_remarks  │  Full AI analysis text
               │                  ││ reported_by │──→ users.id
               │                  │└─────────────┘
               │                  │
               │    ┌─────────┐   │   ┌───────────┐
               │    │  fines  │   │   │ payments  │
               │    ├─────────┤   │   ├───────────┤
               │    │ id (PK) │   │   │ id (PK)   │
               └────│ violat. │───┘   │ fine_id   │──→ fines.id
                    │ amount  │       │ amount    │
                    │ status  │       │ method    │
                    └─────────┘       │ txn_id    │
                                      └───────────┘
```

---

## 🔌 API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login, returns JWT token | ❌ |

### Violations (`/api/violations`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/violations` | Report a new violation (multipart: image + data) | 🔒 USER |
| GET | `/api/violations` | Get all violations | 🔒 USER |
| GET | `/api/violations/my` | Get current user's violations | 🔒 USER |
| GET | `/api/violations/{id}` | Get violation by ID | 🔒 USER |
| PUT | `/api/violations/{id}/approve?fineAmount=X` | Approve with fine | 🔒 ADMIN |
| PUT | `/api/violations/{id}/status?status=X` | Update status | 🔒 ADMIN |

### Dashboard (`/api/dashboard`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard` | Get stats (total, pending, approved, revenue) | 🔒 USER |

### Vehicles, Fines, Payments
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/vehicles/my` | Current user's vehicles | 🔒 USER |
| GET | `/api/fines/my` | Current user's fines | 🔒 USER |
| POST | `/api/payments` | Make a payment | 🔒 USER |

### YOLO Service (Python — Port 8081)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/detect` | YOLO object detection (Stage 1) |
| POST | `/analyze` | Heuristic violation analysis (Stage 2 fallback) |

---

## 🚀 Getting Started

### Prerequisites
- **Java 17+** (JDK) — [Download](https://adoptium.net/)
- **Node.js 18+** — [Download](https://nodejs.org/)
- **Python 3.9+** — [Download](https://python.org/)
- **MySQL 8** — [Download](https://dev.mysql.com/downloads/)

### 1. Database Setup
```sql
-- MySQL will auto-create the database, but ensure MySQL is running:
-- Username: root
-- Password: root
-- Port: 3306
```

### 2. Start YOLO Service (Terminal 1)
```bash
cd yolo_service
pip install -r requirements.txt       # First time only
python main.py                         # Runs on port 8081
```
> First run downloads YOLOv8n model (~6 MB).

### 3. Start Backend (Terminal 2)
```bash
cd backend
./mvnw spring-boot:run                # Linux/Mac
.\mvnw.cmd spring-boot:run            # Windows
# Runs on port 8080
```

### 4. Start Frontend (Terminal 3)
```bash
cd frontend
npm install                            # First time only
npm run dev                            # Runs on port 5173
```

### 5. Open in Browser
Navigate to `http://localhost:5173`

### Default Admin Account
Register a new user, then manually update their role in MySQL:
```sql
UPDATE users SET role = 'ADMIN' WHERE username = 'your_username';
```

---

## ⚙ Configuration

All backend config is in `backend/src/main/resources/application.properties`:

```properties
# Server
server.port=8080

# MySQL Database
spring.datasource.url=jdbc:mysql://localhost:3306/traffic_violation_db
spring.datasource.username=root
spring.datasource.password=root

# JWT — change the secret in production!
app.jwt.secret=YourSecretKeyHere
app.jwt.expiration=2592000000        # 30 days in milliseconds

# File Upload
spring.servlet.multipart.max-file-size=10MB
app.upload.dir=./uploads

# Google Gemini AI (optional — heuristic fallback works without it)
app.gemini.api-key=YOUR_KEY_HERE     # Get from https://aistudio.google.com/apikey
app.gemini.model=gemini-2.0-flash

# YOLO Detection Service
app.yolo.url=http://localhost:8081
app.yolo.confidence-threshold=0.40   # 40% minimum to pass Stage 1
```

---

## 🔄 How It Works (User Flow)

### Reporting a Violation
```
1. User logs in → navigates to "Report Violation"
2. Fills form: violation type, plate number, location, vehicle category
3. Uploads photo evidence (JPEG/PNG, max 10MB)
4. Clicks "Submit"
        ↓
5. Backend saves image to ./uploads/
6. AIVerificationService.verifyImage() is called:
        ↓
7. YOLO Stage 1 — sends image to Python service
   → Returns: objects detected, traffic score
   → If score < 40%: REJECTED immediately
        ↓
8. Gemini Stage 2 — sends image + prompt to Google API
   → If 429/timeout: Falls back to Heuristic /analyze
   → Returns: is_violation, confidence, remarks
        ↓
9. If AI verified (confidence ≥ 55%):
   → Violation saved with status: PENDING
   → Awaits admin review
10. If AI rejected:
    → Violation saved with status: REJECTED
    → User sees rejection reason
```

### Admin Review
```
1. Admin logs in → sees AdminPanel with all PENDING violations
2. Reviews evidence image + AI analysis + AI remarks
3. Clicks "Approve" and sets fine amount
   → Fine record created (UNPAID)
   → Violation status → APPROVED
4. OR clicks "Reject"
   → Violation status → REJECTED
```

### Paying Fines
```
1. User navigates to "Fines" → sees unpaid fines
2. Clicks "Pay" → enters payment method and transaction ID
3. Payment recorded → Fine status → PAID
```

---

## 📚 Key Concepts Explained

### 1. JWT Authentication (Stateless Auth)
Instead of server-side sessions, we use **JSON Web Tokens**:
- On login, server creates a JWT containing `{userId, username, role, expiry}`
- JWT is signed with a secret key and returned to the client
- Client stores it in `localStorage` and sends it in every request header: `Authorization: Bearer <token>`
- `JwtAuthFilter` intercepts every request, validates the token, and sets the security context
- **Why?** Scalable — server doesn't need to store session state

### 2. Spring Security Filter Chain
```
Request → JwtAuthFilter → SecurityContext → Controller
                ↓
         Token valid? → Set Authentication
         Token invalid? → 401 Unauthorized
         No token? → Check if endpoint is public
```

### 3. Spring Data JPA (ORM)
- **Entity classes** (`@Entity`) map directly to database tables
- **Repository interfaces** extend `JpaRepository` — Spring auto-generates SQL
- Example: `violationRepository.findByStatus(PENDING)` → `SELECT * FROM violations WHERE status = 'PENDING'`
- No manual SQL needed for basic CRUD operations

### 4. Microservice Pattern (YOLO Service)
The YOLO detection runs as a **separate Python process** because:
- YOLOv8 requires Python (PyTorch/Ultralytics library)
- Separation of concerns — ML inference separate from business logic
- Can be scaled independently
- If YOLO crashes, the backend continues working (graceful fallback)

### 5. Proxy Configuration (Vite Dev Server)
```javascript
// vite.config.js
proxy: {
  '/api': 'http://localhost:8080',    // Forward /api/* to Spring Boot
  '/uploads': 'http://localhost:8080' // Forward /uploads/* for images
}
```
This avoids CORS issues in development. The React app (port 5173) proxies API calls to Spring Boot (port 8080).

### 6. Builder Pattern (Lombok)
```java
// Instead of:
Violation v = new Violation();
v.setLocation("Main St");
v.setStatus(PENDING);

// We use:
Violation v = Violation.builder()
    .location("Main St")
    .status(PENDING)
    .build();
```
Cleaner, immutable-friendly object construction. Enabled by `@Builder` annotation from Lombok.

### 7. Graceful Degradation
The system is designed to **never fail completely**:
- YOLO service down? → Skip Stage 1, go to Gemini
- Gemini quota exhausted? → Fall back to Heuristic AI
- Heuristic fails? → Accept image with YOLO-only score
- All AI fails? → Image still saved, admin can manually review

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| `Port 8080 already in use` | Kill old Java process: `taskkill /F /IM java.exe` |
| `ECONNREFUSED /api/*` | Backend not running. Start with `./mvnw spring-boot:run` |
| Gemini `429 Too Many Requests` | Free quota exhausted. Wait for reset or use heuristic fallback (automatic) |
| YOLO model download stuck | Check internet connection. Model is ~6MB from Ultralytics |
| `Access Denied` MySQL | Ensure MySQL is running with user `root` / password `root` |
| Images not showing | Check `./uploads/` directory exists and has read permissions |
| `npm run dev` fails | Run `npm install` first |

---

## 📄 License

This project is for educational purposes.

---

Built with ❤️ using **Spring Boot**, **React**, **YOLOv8**, and **Google Gemini AI**.
