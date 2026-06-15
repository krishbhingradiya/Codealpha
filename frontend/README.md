# 🖥️ ShortLink Pro — Frontend UI Server

This is the frontend server for **ShortLink Pro**, a modern, internship-ready URL shortener project. It renders the views using Express and EJS templates, styling them with glassmorphism CSS, and routes all dynamic requests to the Backend API server via AJAX.

---

## 🎨 Tech Stack & Packages
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Views**: EJS Templating
- **Styling**: Vanilla CSS (Custom Design System, variables, animations)
- **Script**: Vanilla Javascript (calling Backend REST APIs via fetch)

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
Ensure `BACKEND_URL` points to where your Backend API server is running (defaults to `http://localhost:5000`).

### 3. Run UI Server
```bash
# Start in development mode (with nodemon auto-restart)
npm run dev

# Start in production mode
npm start
```
The UI server will run at **http://localhost:3000** 🖥️

---

## 🗺️ UI Routes
- **`/`**: Landing page containing the shortening form, customized aliases toggle, link expiration selection, stats displays, and feature lists.
- **`/dashboard`**: Management console with aggregate stat counters, search/filter table, pagination, create overlays, edit overlays, and QR preview modals.
- **`/analytics/:shortCode`**: Live redirect click tracker, link parameters overview, and direct QR code download buttons.
- **Any other path**: Custom 404 page.
