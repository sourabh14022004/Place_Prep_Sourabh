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

### 1. Health Check
- **HTTP Method**: `GET`
- **Endpoint**: `/api/health`
- **Description**: Check server health and MongoDB Atlas connection status.
- **Sample Request**:
  ```http
  GET http://localhost:5050/api/health
  ```

---

### 2. Database Statistics & Metrics
- **HTTP Method**: `GET`
- **Endpoint**: `/api/stats`
- **Description**: Returns total database counts (`167 companies`, `12,433 questions`, `experiences`) and category/difficulty breakdowns.
- **Sample Request**:
  ```http
  GET http://localhost:5050/api/stats
  ```

---

### 3. List Companies (Filter & Paginate)
- **HTTP Method**: `GET`
- **Endpoint**: `/api/companies`
- **Description**: Returns paginated list of companies with optional category and search filtering.
- **Query Parameters**:
  - `category` *(optional)*: Filter by tier/category (`maang`, `product`, `service`, `startup`)
  - `search` *(optional)*: Text search matching company name or slug
  - `page` *(optional, default: `1`)*: Page number for pagination
  - `limit` *(optional, default: `20`)*: Items per page
- **Sample Requests**:
  ```http
  GET http://localhost:5050/api/companies
  GET http://localhost:5050/api/companies?category=maang
  GET http://localhost:5050/api/companies?search=google&page=1&limit=10
  ```

---

### 4. Company Profile by Slug
- **HTTP Method**: `GET`
- **Endpoint**: `/api/companies/:slug`
- **Description**: Fetch full company profile by slug, including round structure, topic frequency breakdown, and sample company questions.
- **Sample Request**:
  ```http
  GET http://localhost:5050/api/companies/google
  GET http://localhost:5050/api/companies/amazon
  ```

---

### 5. Search & Filter Question Bank
- **HTTP Method**: `GET`
- **Endpoint**: `/api/questions`
- **Description**: Search and filter problem bank by company, topic, difficulty, round type, or text query.
- **Query Parameters**:
  - `companySlug` *(optional)*: Filter by target company (e.g. `google`, `amazon`)
  - `topic` *(optional)*: Filter by topic (e.g. `Dynamic Programming`, `Arrays`, `Graphs`, `LLD`)
  - `difficulty` *(optional)*: Filter by difficulty (`Easy`, `Medium`, `Hard`)
  - `roundType` *(optional)*: Filter by round (`Coding`, `System Design`, `LLD`, `HR`, `Domain`, `Aptitude`)
  - `search` *(optional)*: Keyword search in question title
  - `page` *(optional, default: `1`)*: Page number for pagination
  - `limit` *(optional, default: `20`)*: Items per page
- **Sample Requests**:
  ```http
  GET http://localhost:5050/api/questions?companySlug=amazon&topic=Dynamic%20Programming&difficulty=Medium
  GET http://localhost:5050/api/questions?search=string&page=1&limit=10
  ```

---

### 6. Question Details by ID
- **HTTP Method**: `GET`
- **Endpoint**: `/api/questions/:id`
- **Description**: Fetch details of a single question by its MongoDB `_id`.
- **Sample Request**:
  ```http
  GET http://localhost:5050/api/questions/66aa01010101010101010102
  ```

---

### 7. List Student Interview Experiences
- **HTTP Method**: `GET`
- **Endpoint**: `/api/experiences`
- **Description**: Fetch student interview experience logs with company and outcome filters.
- **Query Parameters**:
  - `companySlug` *(optional)*: Filter by company (e.g. `google`, `amazon`, `flipkart`)
  - `outcome` *(optional)*: Filter by result (`offer`, `rejected`)
  - `page` *(optional, default: `1`)*: Page number
  - `limit` *(optional, default: `20`)*: Items per page
- **Sample Requests**:
  ```http
  GET http://localhost:5050/api/experiences
  GET http://localhost:5050/api/experiences?companySlug=google&outcome=offer
  ```

---

### 8. Authentication & Demo Credentials
- **HTTP Method**: `GET` / `POST`
- **Endpoints**:
  - `GET /api/auth/credentials`: Returns pre-configured demo portal credentials (Student, Faculty, Admin).
  - `POST /api/auth/login`: Authenticates login request with email & password payload.
- **Sample Requests**:
  ```http
  GET http://localhost:5050/api/auth/credentials
  POST http://localhost:5050/api/auth/login
  Header: Content-Type: application/json
  Body: { "email": "student@newtonschool.co", "password": "student123" }
  ```

---

## 🛠️ Database Seeding (Optional)

If you need to seed initial sample records into MongoDB Atlas:

```bash
cd backend
npm run seed
```
