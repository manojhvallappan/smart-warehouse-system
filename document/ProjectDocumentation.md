# WareFlow - Smart Warehouse Management System
## Project Documentation

WareFlow is a full-stack warehouse management system designed to track inventory, manage orders and shipments, process goods receipts, and provide real-time analytics.

### Architecture & Tech Stack
-   **Frontend**: React 19, Vite, Recharts (for analytics dashboards), React Router
-   **Backend**: Node.js, Express.js
-   **Database**: SQLite (via Sequelize ORM, ready to be scaled to PostgreSQL)
-   **Authentication**: JSON Web Tokens (JWT) with Role-Based Access Control (Admin, Manager, Worker)

### Core Modules
1.  **Dashboard/Analytics**: Real-time KPI metrics, stock movements, order fulfillment counts, and ABC analysis charts.
2.  **Inventory**: Track products, stock levels, and warehouse locations. Includes a low-stock alert system and a new "Export to CSV" reporting feature.
3.  **Products**: Product catalog with barcode association, SKUs, and pricing details.
4.  **Warehouse**: Rack/Shelf/Bin location modeling.
5.  **Orders**: Order lifecycle tracking (pending, picking, packing, shipped, delivered) with corresponding automatic inventory deductions and "Export to CSV" reporting.
6.  **Goods Receipt**: Goods Receipt Note (GRN) workflow for accepting incoming supplier stock.
7.  **Shipments**: Dispatch tracking and status management.

---

## 🚀 How to Run the Project Locally

Follow these steps to set up and run the application on your local machine.

### Prerequisites
- Node.js (v18 or higher)
- npm (Node Package Manager)

### Step 1: Initialize the Database (Backend)
The backend requires an initial setup to install dependencies and seed the local SQLite database with demo data.

1. Open a new terminal.
2. Navigate to the backend directory:
   ```bash
   cd "backend"
   ```
3. Install the required Node packages:
   ```bash
   npm install
   ```
4. Seed the database with mock users, products, inventory, and orders:
   ```bash
   npm run seed
   ```

### Step 2: Start the Backend Server
Once seeded, start the backend API server.

1. In the same terminal (backend directory), run:
   ```bash
   npm start
   ```
   *(Alternatively, use `npm run dev` if you plan to make code changes and want automatic restarts.)*
2. The server will start and connect to the database. It should output: `Server running on http://localhost:5000`

### Step 3: Start the Frontend Application
Leave the backend terminal running and open a **second, new terminal**.

1. Navigate to the frontend directory:
   ```bash
   cd "frontend"
   ```
2. Install the necessary frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. The console will display a local URL (usually `http://localhost:5173`).

### Step 4: Log In to the Application
1. Open your web browser and navigate to `http://localhost:5173`.
2. You will be greeted by the secure login screen.
3. Use the following **Demo Credentials** to access the system:
   - **Email:** `admin@warehouse.com`
   - **Password:** `password123`

---

## Deployment (Docker)
For production environments, the project includes a `docker-compose.yml` file. You can deploy both the frontend and backend simultaneously by running:
```bash
docker-compose up --build
```
