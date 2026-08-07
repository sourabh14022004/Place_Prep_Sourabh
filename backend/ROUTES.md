# 🌐 PlacePrep Express API Routes Documentation

This directory contains the Express.js API backend connected to **MongoDB Atlas**, serving structured data for the PlacePrep Portal (Student, Faculty, and Admin dashboards).

---

## 🚀 How to Run the Server

```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already installed)
npm install

# Start the Express API server
npm start
```

Default server URL: **`http://localhost:5050`**

---

## 📬 Postman & REST API Endpoints

| Feature | HTTP Method | Endpoint URL | Query Parameters / Payload |
| :--- | :--- | :--- | :--- |
| **Health Check** | `GET` | `http://localhost:5050/api/health` | None |
| **Database Stats** | `GET` | `http://localhost:5050/api/stats` | None |
| **List Companies** | `GET` | `http://localhost:5050/api/companies` | `category` (maang, product, service, startup), `search`, `page`, `limit` |
| **Company Profile** | `GET` | `http://localhost:5050/api/companies/:slug` | e.g. `/api/companies/google` |
| **Search Questions** | `GET` | `http://localhost:5050/api/questions` | `companySlug`, `topic`, `difficulty`, `roundType`, `search`, `page`, `limit` |
| **Question Details** | `GET` | `http://localhost:5050/api/questions/:id` | e.g. `/api/questions/66aa01010101010101010102` |
| **Interview Experiences** | `GET` | `http://localhost:5050/api/experiences` | `companySlug`, `outcome` (offer, rejected), `page`, `limit` |
| **Demo Credentials** | `GET` | `http://localhost:5050/api/auth/credentials` | None |
| **User Login** | `POST` | `http://localhost:5050/api/auth/login` | `{ "email": "...", "password": "..." }` |
