# DineFlow — Restaurant Management System

A complete restaurant ordering and management platform built with Node.js, Express.js, EJS, Supabase PostgreSQL, and Tailwind CSS.

## Features

- **Customer Ordering** — Browse menu, add to cart, place orders, track status
- **Table Management** — Add/manage tables with status tracking
- **Reservation System** — Book tables with availability checking
- **Inventory Management** — Track stock levels with low-stock alerts
- **Menu Management** — Full CRUD with categories and availability toggle
- **Order Management** — Accept, update status, auto-deduct inventory
- **Reports & Analytics** — Daily/weekly/monthly sales, top items, CSV export
- **Notification System** — Real-time-ish notifications with polling
- **Admin Panel** — User management, activity logs, system stats
- **REST APIs** — Complete JSON API for all features

## User Roles

| Role | Access |
|------|--------|
| **Customer** | Browse menu, place orders, make reservations, view history |
| **Manager** | Dashboard, manage orders/menu/tables/reservations/inventory |
| **Admin** | All manager features + user management, reports, activity logs |

## Quick Start

### 1. Setup Database

Run the SQL migration in your Supabase SQL Editor:

```
https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql
```

Copy and run the contents of `migrations/001_initial_schema.sql`.

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your Supabase URL and API key
```

### 3. Install & Run

```bash
npm install
npm run dev
```

### 4. Default Admin Login

```
Email: admin@restaurant.com
Password: Admin@123
```

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: Supabase PostgreSQL
- **View Engine**: EJS with express-ejs-layouts
- **Styling**: Tailwind CSS (CDN)
- **Auth**: bcrypt + JWT + express-session
- **Icons**: Remix Icons

## Deployment (Render)

1. Push to GitHub
2. Connect repo to Render
3. Set environment variables
4. Deploy!

See `render.yaml` for configuration.
