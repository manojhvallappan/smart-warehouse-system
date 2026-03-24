# WareFlow – Smart Warehouse Management System

A full-stack warehouse management system built with **React**, **Node.js/Express**, and **PostgreSQL**.

## 🏗 Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌────────────┐
│   React UI  │────▶│  Express API    │────▶│ PostgreSQL │
│   (Vite)    │◀────│  (JWT + RBAC)   │◀────│  Database  │
└─────────────┘     └─────────────────┘     └────────────┘
```

**Tech Stack:** React 19 · Vite · Node.js · Express · Sequelize ORM · PostgreSQL · JWT · Recharts · Docker

---

## 📦 Core Modules

| Module | Description |
|--------|-------------|
| **Authentication** | Login/Register, JWT tokens, Role-based access (Admin, Manager, Worker) |
| **Products** | CRUD operations, barcode generation, categories |
| **Inventory** | Stock tracking, low-stock alerts, ABC analysis |
| **Warehouse** | Rack/Shelf/Bin management, utilization heatmap |
| **Orders** | Full lifecycle: pending → picking → packing → shipped → delivered |
| **Shipments** | Carrier tracking, dispatch management |
| **Goods Receipt** | GRN creation, supplier receiving, auto inventory update |
| **Analytics** | Dashboard KPIs, inventory turnover, demand forecasting |
| **Stock Movements** | Complete audit trail of all inventory changes |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (or Docker)

### Option 1: Docker (Recommended)

```bash
docker-compose up --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Database: localhost:5432

### Option 2: Manual Setup

**1. Database**
```bash
# Create PostgreSQL database
createdb smart_warehouse
```

**2. Backend**
```bash
cd backend
cp .env.example .env    # Edit DB credentials
npm install
npm run seed            # Seed demo data
npm run dev             # Starts on http://localhost:5000
```

**3. Frontend**
```bash
cd frontend
npm install
npm run dev             # Starts on http://localhost:5173
```

---

## 🔑 Demo Credentials

After running the seeder:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@warehouse.com | password123 |
| Manager | manager@warehouse.com | password123 |
| Worker | alice@warehouse.com | password123 |

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register user |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | Yes | Current user |
| GET/POST | `/api/products` | Yes | Products CRUD |
| GET | `/api/products/:id/barcode` | Yes | Barcode image |
| GET/POST | `/api/inventory` | Yes | Inventory CRUD |
| GET | `/api/inventory/low-stock` | Yes | Low stock alerts |
| GET | `/api/inventory/abc-analysis` | Yes | ABC classification |
| GET/POST | `/api/warehouse` | Yes | Locations CRUD |
| GET | `/api/warehouse/utilization` | Yes | Utilization & heatmap |
| GET/POST | `/api/orders` | Yes | Orders CRUD |
| PUT | `/api/orders/:id/status` | Yes | Order workflow |
| GET/POST | `/api/shipments` | Yes | Shipments CRUD |
| GET/POST | `/api/goods-receipt` | Yes | GRN management |
| GET | `/api/stock-movements` | Yes | Movement history |
| GET | `/api/analytics/dashboard` | Yes | Dashboard KPIs |
| GET | `/api/analytics/inventory-turnover` | Yes | Turnover ratios |
| GET | `/api/analytics/demand-forecast` | Yes | Demand predictions |
| GET | `/api/suppliers` | Yes | Suppliers list |

---

## 📊 Analytics Features

- **KPI Dashboard** – Products, orders, revenue, inventory value, low stock count
- **Inventory Turnover** – Ratio analysis by product
- **Order Fulfillment Time** – Average processing metrics
- **Demand Forecasting** – Exponential smoothing predictions
- **ABC Analysis** – Inventory classification (A/B/C categories)
- **Warehouse Heatmap** – Visual utilization by location

---

## 🐳 Deployment

```bash
# Build and deploy with Docker Compose
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

For AWS deployment, push Docker images to ECR and deploy using ECS or EKS.

---

## 📁 Project Structure

```
├── backend/
│   ├── config/          # Database configuration
│   ├── middleware/       # Auth, RBAC, validation
│   ├── models/          # Sequelize models (10 tables)
│   ├── routes/          # Express API routes
│   ├── seeders/         # Demo data seeder
│   ├── server.js        # Entry point
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── api/         # Axios client
│   │   ├── components/  # Layout, Sidebar, ProtectedRoute
│   │   ├── context/     # AuthContext
│   │   ├── pages/       # All page components
│   │   └── index.css    # Design system
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

## License

MIT
