# 🔗 ShortLink Pro — Enterprise-Grade URL Shortener Ecosystem

> **ShortLink Pro** is a modern, production-ready, full-stack URL shortener and link management system. Engineered with a **fully decoupled architecture**, it isolates the high-performance REST API backend from the EJS-templated frontend. Backed by **Supabase PostgreSQL** and **JWT Authentication**, it provides comprehensive link controls, automated QR code generation, real-time analytics, and enterprise-grade security filters.

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-v4.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/PostgreSQL-Active-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/JWT%20Auth-Enabled-orange?style=for-the-badge&logo=json-web-tokens&logoColor=white" alt="JWT Auth" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" />
</p>

---

## 🏗️ System Architecture & Workflow

The architecture is built on absolute separation of concerns. The frontend acts purely as a presentation layer, serving pages and executing client-side scripts, while the backend API serves JSON payloads, executes business logic, and communicates with Supabase.

### 1. Data Flow & System Layers
```mermaid
graph TD
    A[Client Browser] -->|1. Render Pages| B(Frontend Express UI Server)
    A -->|2. REST Actions & JWT Auth| C(Backend Express API Server)
    C -->|3. Read/Write Data| D[(Supabase PostgreSQL Database)]
    C -->|4. Get Account Context| E[Supabase Auth Service]
    C -->|5. Generate QR Code| F[QR Code Engine]
    C -->|6. Send Transactional Mail| G[Nodemailer / SMTP Server]

    style A fill:#4f46e5,stroke:#312e81,stroke-width:2px,color:#fff
    style B fill:#0e7490,stroke:#155e75,stroke-width:2px,color:#fff
    style C fill:#0f766e,stroke:#115e59,stroke-width:2px,color:#fff
    style D fill:#15803d,stroke:#166534,stroke-width:2px,color:#fff
    style E fill:#be185d,stroke:#9d174d,stroke-width:2px,color:#fff
    style F fill:#b45309,stroke:#92400e,stroke-width:2px,color:#fff
    style G fill:#6b21a8,stroke:#581c87,stroke-width:2px,color:#fff
```

### 2. JWT Authentication & Request Pipeline
```mermaid
sequenceDiagram
    participant Client as Web Client (Vanilla JS)
    participant UI as Frontend EJS Server (Port 3000)
    participant API as Backend API (Port 5000)
    participant DB as Supabase PostgreSQL / Auth
    
    Client->>UI: Request Page (e.g., /dashboard)
    UI-->>Client: Serve EJS Template & main.js
    Client->>DB: Fetch JWT Session
    DB-->>Client: Return access_token (JWT)
    Client->>API: HTTP Request + Bearer JWT
    API->>DB: Verify JWT (supabase.auth.getUser)
    DB-->>API: User context validated
    API->>DB: Perform Database Query (Scoped to User UUID)
    DB-->>API: Query Results
    API-->>Client: Return JSON response
```

---

## 🗄️ Database Architecture & Relational Schema

ShortLink Pro uses **Supabase PostgreSQL** optimized for performance and security. The schema utilizes Foreign Keys referencing Supabase Auth users, custom Pl/pgSQL triggers, and specialized performance indexes.

### 1. Database Entity-Relationship (ER) Diagram
```mermaid
erDiagram
    auth_users ||--o{ urls : "owns / manages"
    auth_users {
        uuid id PK "User Unique Identifier"
        string email "User Login Email"
        timestamp last_sign_in_at "Timestamp of Session Init"
    }
    urls {
        uuid id PK "URL Entry UUID"
        text original_url "Target Redirect Destination"
        varchar short_code UK "Unique 7-character Alias"
        int click_count "Accumulated Link Hits"
        timestamp created_at "Record Creation Time"
        timestamp updated_at "Record Auto-Update Time"
        timestamp last_visited "Time of Most Recent Access"
        timestamp expires_at "Scheduled Expiration Time"
        boolean is_active "Operational Enable/Disable Flag"
        uuid user_id FK "Reference to auth.users"
    }
```

### 2. Indexes & Performance Optimization
To maintain sub-millisecond query response times in production, the following indexes are deployed:
- **`idx_urls_short_code`**: Speeds up direct 302 redirection lookups.
- **`idx_urls_user_id`**: Accelerates dashboard retrieval query performance.
- **`idx_urls_search_original`** & **`idx_urls_search_code`**: `GIN` indexes with Trigram support (`pg_trgm`) to enable high-speed fuzzy searches over long URLs and alias codes.

---

## 🔄 Link Redirection & Lifecycle Flowchart

The backend implements a multi-step validation engine on incoming redirection requests to ensure expired or deactivated links are safely handled.

```mermaid
graph TD
    Start([User hits: shortlink.pro/xyz]) --> ActiveCheck{Is Link Active?}
    ActiveCheck -->|No / is_active = false| ExpiredPage[Redirect to 404 / Expired page]
    ActiveCheck -->|Yes| ExpiryCheck{Has Expiration Time Passed?}
    ExpiryCheck -->|Yes / expires_at < NOW| ExpiredPage
    ExpiryCheck -->|No| Increment[1. Increment click_count <br> 2. Set last_visited = NOW]
    Increment --> Redirect[302 HTTP Redirect to original_url]

    style Start fill:#4f46e5,stroke:#312e81,color:#fff
    style ExpiredPage fill:#be185d,stroke:#9d174d,color:#fff
    style Redirect fill:#15803d,stroke:#166534,color:#fff
    style ActiveCheck fill:#b45309,stroke:#92400e,color:#fff
    style ExpiryCheck fill:#b45309,stroke:#92400e,color:#fff
```

---

## 📊 Analytics Dashboard Mockup (Data Insights)

The frontend visualizes dynamic click statistics for each link. Below is a representation of typical metrics tracked by our analytical queries:

```mermaid
pie title "Visitor Traffic Referrers (Distribution Example)"
    "Direct / Bookmarks" : 45
    "Social Platforms (LinkedIn, X)" : 30
    "Search Engines (Google, Bing)" : 15
    "Others" : 10
```

---

## 🌟 Premium Features

### 👤 User Lifecycle & Authentication
- **Secure Sessions**: Powered by Supabase Auth, offering signup, verification, secure logins, password resets, and logout sequences.
- **Transactional Welcome Emails**: Automatic dispatch of welcome onboarding emails using Nodemailer with support for local Ethereal fallback and external SMTP services (like Brevo).

### ⚙️ Link Customization & Configuration
- **Custom Aliases**: Users can specify customized short codes (e.g., `/my-promo`) for branded marketing.
- **Expiration Scheduler**: Enforce link expiration dates and times with a precise calendar selector.
- **Active / Inactive Toggles**: Toggle link availability instantly from the dashboard to enable/disable redirects.

### 📊 Real-Time Analytics & QR Engine
- **Visitor Monitoring**: Tracking click-through counters, creation dates, and UTC last-visited timestamps.
- **Automatic QR Codes**: Automatic base64 QR code generation for every created link.
- **Instant High-Res Downloads**: In-dashboard capability to download generated QR codes instantly.

### 🔒 Enterprise Protection & Performance
- **Port Isolation**: Segregated operations: UI runs on Port `3000`, API operates on Port `5000`.
- **CORS Whitelisting**: Lock API requests strictly to trusted origins.
- **Rate-Limiting Schemas**: Strict rate limiting to block API spam (100 requests / 15 mins) and URL creation abuse.

---

## 📁 Repository Anatomy

The repository contains two isolated Node.js modules:

```
ShortLink-Pro/
│
├── backend/                    # Core REST API Service
│   ├── database/
│   │   └── setup.sql           # Database schema, performance indexes, and RLS policies
│   ├── src/
│   │   ├── config/             # Config loader & database clients
│   │   ├── controllers/        # Core business operations (URL creation, redirection, analytics)
│   │   ├── middleware/         # CORS filters, JWT verification, validation schemas, rate limiters
│   │   ├── models/             # Database access abstractions using Supabase JS client
│   │   ├── routes/             # Router mappings (REST endpoints & redirection handlers)
│   │   ├── services/           # Helper services (QR generation, welcome emails)
│   │   └── app.js              # Express middleware and routing assembly
│   ├── server.js               # Service Entry (Port 5000)
│   ├── package.json
│   ├── .env.example
│   └── README.md               # Backend documentation
│
├── frontend/                   # Client-Facing Interface
│   ├── public/
│   │   ├── css/
│   │   │   └── style.css       # Responsive custom glassmorphism stylesheets
│   │   └── js/
│   │       └── main.js         # API integration client-side application logic
│   ├── src/
│   │   └── views/              # EJS server-rendered HTML templates
│   ├── server.js               # Service Entry (Port 3000)
│   ├── package.json
│   ├── .env.example
│   └── README.md               # Frontend documentation
│
└── README.md                   # Workspace Root Documentation (this file)
```

---

## ⚙️ Quick Start

Follow these steps to deploy and run the workspace locally:

### 1. Database Provisioning
1. Sign up on [Supabase](https://supabase.com) and spin up a new PostgreSQL project.
2. In the **SQL Editor**, paste and run the contents of [setup.sql](file:///c:/Users/JBC/Desktop/URL%20Shortner/backend/database/setup.sql) to provision the `urls` table, indexing columns, and security configurations.

### 2. Backend Initialization
```bash
# Move to backend folder
cd backend

# Install production and development dependencies
npm install

# Setup environment configuration
cp .env.example .env
```
Edit the `.env` file and populate it with your database credentials:
```env
PORT=5000
NODE_ENV=development
BASE_URL=http://localhost:5000
TZ=Asia/Kolkata
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_public_key
```
Start the API server:
```bash
npm run dev
```

### 3. Frontend Initialization
Open a new terminal window at the project root and run:
```bash
# Move to frontend folder
cd frontend

# Install dependencies
npm install

# Setup environment configuration
cp .env.example .env
```
Edit `.env` and verify the backend API address:
```env
PORT=3000
NODE_ENV=development
TZ=Asia/Kolkata
BACKEND_URL=http://localhost:5000
```
Start the frontend web application:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser! 🚀

---

## 🔌 API Endpoints Reference

All API responses enforce a consistent JSON structure:
```json
{
  "success": true,
  "message": "Action completed successfully",
  "data": { ... }
}
```

### URL Management API (`/api/urls`)
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/urls/shorten` | Optional | Creates a random short-code URL. |
| **POST** | `/api/urls/custom` | Optional | Creates a URL with a custom short alias code. |
| **GET** | `/api/urls` | **Yes** | Fetches paginated URLs owned by the current user. |
| **GET** | `/api/urls/search` | **Yes** | Fuzzy searches URLs using terms matching URL or short-code. |
| **GET** | `/api/urls/:id` | **Yes** | Fetches detailed metadata for a single URL record. |
| **PUT** | `/api/urls/:id` | **Yes** | Updates target URL, expiration time, or active state. |
| **DELETE**| `/api/urls/:id` | **Yes** | Permanently deletes a URL record from database. |
| **GET** | `/api/urls/analytics/:shortCode` | **Yes** | Retrieves analytics metrics and base64 QR string. |

### Redirection & System API
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/:shortCode` | No | Resolves the code, increments clicks, and issues `302 Redirect`. |
| **POST** | `/api/welcome` | No | Dispatches onboarding welcome emails for signup. |
| **GET** | `/health` | No | Simple API service health check. |

---

## 🛡️ Security & Development Best Practices

- **Strict Validation Pipelines**: Every request body parameter is parsed and sanitized by `express-validator` to guarantee structural sanitization before reaching the database.
- **SQL Injection Prevention**: Supabase Javascript Client acts as a secure parameterization engine preventing SQL injection vectors.
- **Row Level Security (RLS)**: Row-Level Security policies are activated in the database to prevent cross-tenant information access.
- **Clean Timezone Alignment**: Local calendar expirations and server comparisons are synced to the `Asia/Kolkata` time database context to ensure consistent operations.
- **Production CORS Locking**: Origin checks lock access to specified production frontend URLs, shielding backend endpoints from external domains.
