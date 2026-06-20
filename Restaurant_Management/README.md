# 🍽️ DineFlow — Restaurant Management System

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-brightgreen?logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.21-blue?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791?logo=postgresql)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-ISC-yellow)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)]()

A **complete, production-ready restaurant ordering and management platform** built with modern web technologies. DineFlow streamlines customer experience, order management, inventory tracking, and business analytics in one unified system.

---

## 📊 Technology Stack & Language Composition

```
JavaScript  ████████████████████████████████ 53.7%
EJS         ███████████████ 24.6%
CSS         ██████████ 19.1%
PLpgSQL     ▌ 1.4%
HTML        ▌ 1.2%
```

| Category | Technology |
|----------|-----------|
| **Backend Framework** | Node.js + Express.js |
| **Database** | Supabase PostgreSQL |
| **View Engine** | EJS with express-ejs-layouts |
| **Styling** | Tailwind CSS (CDN) |
| **Authentication** | bcrypt + JWT + express-session |
| **Visualization** | Chart.js 4.4.0 |
| **File Upload** | Multer |
| **Security** | Helmet, CORS |
| **Development** | Nodemon for hot reload |

---

## 🎯 Key Features

### 👥 **Customer Portal**
- 🍜 Browse dynamic menu with categories
- 🛒 Shopping cart with real-time updates
- 📦 Place orders with delivery/pickup options
- 📍 Reservation system with availability checking
- 📊 Order history and tracking
- 💳 Payment integration ready

### 🍴 **Table & Reservation Management**
- Add, edit, and manage restaurant tables
- Real-time table availability status
- Reservation booking with conflict detection
- Automated table occupancy tracking
- Peak hour management

### 📦 **Inventory Management**
- Real-time stock level tracking
- Low-stock alerts and notifications
- Automatic inventory deduction on orders
- Supplier management
- Usage reports and forecasting

### 🍽️ **Menu Management**
- Full CRUD operations for menu items
- Category-based organization
- Availability toggle (in-stock/out-of-stock)
- Item pricing and description management
- Bulk import/export capabilities

### 📋 **Order Management System**
- Accept/reject orders
- Real-time order status updates
- Auto-inventory deduction
- Kitchen display integration
- Order history and customer communication

### 📈 **Reports & Analytics**
- Daily, weekly, and monthly sales reports
- Top-selling items analysis
- Revenue trends and forecasting
- Customer analytics
- **CSV export** for further analysis

```
 Sales Dashboard Performance
 ┌─────────────────────────────────────────┐
 │ Daily Revenue       │ Monthly Revenue    │
 │ ████████████ $2,450 │ ██████████ $45,800│
 │ Growth: +12.5%      │ Growth: +8.3%     │
 │─────────────────────────────────────────│
 │ Top Items by Sales  │ Peak Hours        │
 │ 1. Biryani      │ 12:00 - 14:00 ███ 32%│
 │ 2. Curry        │ 19:00 - 21:00 ████42%│
 │ 3. Pizza        │ Others       ██ 26% │
 └─────────────────────────────────────────┘
```

### 🔔 **Notification System**
- Real-time order updates (polling-based)
- Customer notifications
- Staff alerts for new orders
- System-wide announcements

### 👨‍💼 **Admin Panel**
- Complete user management (create, edit, delete, roles)
- Activity logging and audit trail
- System statistics dashboard
- Performance metrics
- User role-based access control (RBAC)

### 🔌 **REST API**
- Comprehensive JSON APIs for all features
- RESTful endpoint design
- Request validation
- Error handling with proper HTTP status codes

---

## 👤 User Roles & Permissions

| Feature | Customer | Manager | Admin |
|---------|----------|---------|-------|
| Browse Menu | ✅ | ✅ | ✅ |
| Place Orders | ✅ | ✅ | ✅ |
| Make Reservations | ✅ | ✅ | ✅ |
| View Order History | ✅ | ✅ | ✅ |
| **Manage Orders** | ❌ | ✅ | ✅ |
| **Manage Menu** | ❌ | ✅ | ✅ |
| **Manage Tables** | ❌ | ✅ | ✅ |
| **Manage Inventory** | ❌ | ✅ | ✅ |
| **View Reports** | ❌ | ✅ | ✅ |
| **User Management** | ❌ | ❌ | ✅ |
| **Activity Logs** | ❌ | ❌ | ✅ |
| **System Settings** | ❌ | ❌ | ✅ |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 16+ and npm
- Supabase account (free tier available)
- Git

### Step 1️⃣ — Clone Repository
```bash
git clone https://github.com/krishbhingradiya/Codealpha.git
cd Restaurant_Management
```

### Step 2️⃣ — Setup Database
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor in your project dashboard
3. Create the database schema by running migration scripts
4. Your PostgreSQL database is ready! 🎉

### Step 3️⃣ — Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# Session
SESSION_SECRET=your-random-secret-key

# Server
PORT=3000
NODE_ENV=development
```

### Step 4️⃣ — Install Dependencies
```bash
npm install
```

### Step 5️⃣ — Start Development Server
```bash
npm run dev
```

Server runs on `http://localhost:3000`

### Step 6️⃣ — Login with Demo Account
```
📧 Email: admin@restaurant.com
🔑 Password: Admin@123
```

---

## 📁 Project Structure

```
Restaurant_Management/
├── src/
│   ├── server.js                 # Main application entry point
│   ├── models/                   # Database models & queries
│   ├── routes/                   # API routes
│   ├── controllers/              # Business logic
│   ├── middleware/               # Express middlewares
│   ├── utils/                    # Helper functions
│   └── public/                   # Static assets (CSS, JS, images)
├── views/                        # EJS templates
│   ├── layouts/                  # Layout templates
│   ├── partials/                 # Reusable components
│   └── pages/                    # Page templates
├── migrations/                   # Database migrations
├── scripts/                      # Setup & utility scripts
├── package.json                  # Dependencies
├── .env.example                  # Environment variables template
└── render.yaml                   # Deployment configuration
```

---

## 📦 Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | 4.21.2 | Web framework |
| `@supabase/supabase-js` | 2.49.1 | Database client |
| `ejs` | 3.1.10 | Template engine |
| `express-session` | 1.18.1 | Session management |
| `bcryptjs` | 2.4.3 | Password hashing |
| `jsonwebtoken` | 9.0.2 | JWT authentication |
| `chart.js` | 4.4.0 | Analytics visualization |
| `helmet` | 8.0.0 | Security headers |
| `cors` | 2.8.5 | Cross-origin requests |
| `morgan` | 1.10.0 | Request logging |

---

## 🔐 Security Features

✅ **Password Encryption** — bcryptjs with salt rounds  
✅ **Session Management** — Secure cookie-based sessions  
✅ **JWT Tokens** — Stateless authentication  
✅ **Security Headers** — Helmet.js integration  
✅ **CORS Protection** — Configurable cross-origin requests  
✅ **Input Validation** — Server-side request validation  
✅ **SQL Injection Prevention** — Parameterized queries  
✅ **HTTPS Ready** — Production deployment compatible  

---

## 🌐 API Endpoints Overview

### Authentication
```
POST   /api/auth/register          Register new user
POST   /api/auth/login             User login
POST   /api/auth/logout            User logout
```

### Orders
```
GET    /api/orders                 List all orders
POST   /api/orders                 Create new order
GET    /api/orders/:id             Get order details
PUT    /api/orders/:id             Update order status
DELETE /api/orders/:id             Cancel order
```

### Menu
```
GET    /api/menu                   List all menu items
POST   /api/menu                   Add new menu item
PUT    /api/menu/:id               Update menu item
DELETE /api/menu/:id               Delete menu item
```

### Inventory
```
GET    /api/inventory              List inventory items
PUT    /api/inventory/:id          Update stock level
GET    /api/inventory/low-stock    Get low-stock alerts
```

### Tables
```
GET    /api/tables                 List all tables
POST   /api/tables                 Add new table
PUT    /api/tables/:id             Update table status
```

### Reports
```
GET    /api/reports/daily          Daily sales report
GET    /api/reports/weekly         Weekly sales report
GET    /api/reports/monthly        Monthly sales report
GET    /api/reports/export         Export as CSV
```

---

## 🚀 Deployment

### Deploy on Render.com (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect Repository**
   - Go to [Render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

3. **Configure Environment**
   - Set environment variables in Render dashboard
   - Point to your Supabase database

4. **Deploy**
   - Render automatically deploys from `main` branch
   - Uses `render.yaml` configuration

Your app is live! 🎉

**Deployment Configuration** (`render.yaml`):
```yaml
services:
  - type: web
    name: restaurant-system
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
```

---

## 📊 Performance Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Page Load Time | < 2s | ✅ Optimized |
| Database Query | < 100ms | ✅ Indexed |
| API Response | < 500ms | ✅ Cached |
| Uptime | 99.9% | ✅ Monitored |

---

## 🛠️ Development Commands

```bash
# Start development server with hot reload
npm run dev

# Start production server
npm start

# Setup database (if needed)
npm run setup:db

# Install new dependencies
npm install [package-name]
```

---

## 📝 Environment Variables Reference

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Supabase Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-api-key

# Authentication
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-email-password
```

---

## 📖 Database Schema Highlights

### Key Tables:
- **users** — User accounts with roles
- **orders** — Customer orders with status tracking
- **menu_items** — Restaurant menu with categories
- **inventory** — Stock levels and tracking
- **tables** — Table management and status
- **reservations** — Booking system
- **activity_logs** — Audit trail for admin

All with proper indexing and relationships for optimal performance.

---

## 🤝 Contributing

This is a **portfolio project** developed during an internship. Contributions and feedback are welcome!

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the ISC License — see [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author & Credits

**Developed by:** Krish Bhingradiya  
**Portfolio Project:** Built during internship at CodeAlpha  
**Demo Date:** 2026  

### Key Learnings:
- Full-stack web development with Node.js & Express
- Database design and optimization with PostgreSQL
- RESTful API design principles
- User authentication and authorization
- Real-time notifications
- Business analytics and reporting
- Production deployment strategies

---

## 📞 Support & Contact

- 📧 Email: krishbhingradiya@example.com
- 🔗 GitHub: [@krishbhingradiya](https://github.com/krishbhingradiya)
- 🌐 Portfolio: [Your Portfolio Link]

---

## ⭐ Show Your Support

If you find this project helpful, please consider giving it a **star** ⭐ on GitHub!

---

**Built with ❤️ using Node.js, Express, and Supabase**
