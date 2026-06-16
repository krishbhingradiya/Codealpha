# 🗄️ ShortLink Pro — Backend API Server

This is the backend server for **ShortLink Pro**, a modern, internship-level URL shortener project built using Node.js, Express.js, and Supabase PostgreSQL.

---

## 📡 Tech Stack & Packages
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: Supabase Client (`@supabase/supabase-js`)
- **QR Codes**: `qrcode` (Base64 generation)
- **ID Generator**: `nanoid`
- **Security & Validation**: `helmet`, `cors`, `express-rate-limit`, `express-validator`

---

## ⚙️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and configure your settings:
```bash
cp .env.example .env
```
Ensure `SUPABASE_URL` and `SUPABASE_ANON_KEY` are populated with your credentials.

### 3. Create the Database Table
Copy the content of `database/setup.sql` and run it in your **Supabase Project → SQL Editor**.

### 4. Run Server
```bash
# Start in development mode (with nodemon auto-restart)
npm run dev

# Start in production mode
npm start
```
The API server will run at **http://localhost:5000** 🚀

---

## 🔌 API Endpoints Reference

All success payloads return:
```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

### URL Management
- **`POST /api/urls/shorten`**: Shorten a long URL.
  - Body: `{ "url": "https://example.com", "expires_at": "ISO-date-string" }`
- **`POST /api/urls/custom`**: Create a URL with a custom short code.
  - Body: `{ "url": "https://example.com", "custom_code": "my-code", "expires_at": "..." }`
- **`GET /api/urls`**: Get all URLs paginated (`?page=1&limit=10`).
- **`GET /api/urls/search`**: Search URLs (`?q=keyword&page=1&limit=10`).
- **`GET /api/urls/:id`**: Get a single URL by database ID.
- **`PUT /api/urls/:id`**: Update URL status, expiry, or original destination.
  - Body: `{ "original_url": "...", "expires_at": "...", "is_active": true/false }`
- **`DELETE /api/urls/:id`**: Delete a URL.
- **`GET /api/urls/analytics/:shortCode`**: Detailed visit stats & QR code for a short code.

### Redirection & Health
- **`GET /:shortCode`**: Resolves the short code, increments the click counter, and issues a `302 Redirect` to the target website.
- **`GET /health`**: Health status endpoint.
