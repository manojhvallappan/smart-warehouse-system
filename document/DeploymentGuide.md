# 🚀 Deployment Guide

This guide details the two best pathways for deploying the Smart Warehouse Management System to the public internet.

---

## Option A: Free Cloud Hosting (Recommended for Portfolios)
Deploy your frontend with **Vercel** and your backend API/Database with **Render**. Both platforms offer generous free tiers and automatically deploy updates when you push to your GitHub repository.

### 1. Deploy the Database (Render)
1. Log in to [Render.com](https://render.com) using your GitHub account.
2. Click **New +** and select **PostgreSQL**.
3. Name your database (e.g., `warehouse-db`), select the free tier, and click **Create Database**.
4. Once provisioned, note the **Internal Database URL** and **External Database URL**.

### 2. Deploy the Backend API (Render)
1. On Render, click **New +** and select **Web Service**.
2. Connect your GitHub repository (`smart-warehouse-system`).
3. Set the following Build settings:
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Expand **Advanced** -> **Environment Variables** and add:
   - `PORT`: `5000`
   - `DB_DIALECT`: `postgres`
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` (extract these from your Render Database settings)
   - `JWT_SECRET`: `your_secure_random_string`
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: (You will set this to your Vercel URL in the next step)
5. Click **Create Web Service**. Wait for the build to finish and copy your live backend URL (e.g., `https://warehouse-api.onrender.com`).

### 3. Deploy the Frontend (Vercel)
1. Log in to [Vercel.com](https://vercel.com) using your GitHub account.
2. Click **Add New... -> Project** and import your `smart-warehouse-system` repository.
3. **Important**: Edit the **Root Directory** and select `frontend`.
4. Vercel will auto-detect **Vite** as the framework framework.
5. Open **Environment Variables** and add:
   - `VITE_API_URL`: `https://warehouse-api.onrender.com/api` (the Render URL from step 2).
6. Click **Deploy**. Vercel will build your React application and provide you with a live, shareable URL!

---

## Option B: Deploy to a VPS using Docker (AWS EC2, DigitalOcean, Linode)
If you have a dedicated Linux server (Virtual Private Server), the project is already fully containerized natively with Docker Compose.

### Deployment Steps:
1. **SSH into your Linux server:**
   ```bash
   ssh root@your_server_ip
   ```
2. **Install Docker and Git** (if not already installed).
3. **Clone your repository:**
   ```bash
   git clone https://github.com/manojhvallappan/smart-warehouse-system.git
   cd smart-warehouse-system
   ```
4. **Configure your Database variables:** Open `docker-compose.yml` or your `.env` file to change the default PostgreSQL passwords to secure ones. Set the `FRONTEND_URL` environment variable to your server's domain or public IP.
5. **Launch the stack:**
   ```bash
   docker-compose up -d --build
   ```
6. The frontend application is now mapped to `http://your_server_ip:3000` and the corresponding backend API runs internally on port `5000`.
