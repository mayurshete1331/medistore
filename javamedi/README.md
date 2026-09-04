# Medi — Java 21 Spring Boot Backend (`javamedi`)

Enterprise-grade Spring Boot 3 REST API backend for the **Medi** Medical Store Management, Counter POS, Doctor e-Prescription & Customer COD platform.

---

## 🛠️ Technology Stack
- **Language**: Java 21
- **Framework**: Spring Boot 3.3.3
- **Build Tool**: Gradle 8.10
- **Database**: MySQL 8+
- **ORM / Persistence**: Spring Data JPA (Hibernate 6)
- **Documentation**: Springdoc OpenAPI / Swagger UI (v2.6.0)
- **Utilities**: Project Lombok

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Java 21 JDK** installed (`java -version`).
- **MySQL 8.0+** running locally on port `3306`.

### 2. Database Setup (MySQL)
Open MySQL command line or MySQL Workbench:
```sql
CREATE DATABASE IF NOT EXISTS medi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Check `src/main/resources/application.yml` and adjust credentials if needed:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/medi_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
    username: root
    password: root
```

### 3. Build & Run
From the `javamedi` directory:

```bash
# Using Gradle
gradle bootRun

# Or using Gradle wrapper on Windows
gradlew.bat bootRun

# Or using Gradle wrapper on Linux/macOS
./gradlew bootRun
```

The server will start at: **`http://localhost:8080`**

---

## 📖 Interactive Swagger API Documentation
Once running, open your browser:
👉 **`http://localhost:8080/swagger-ui.html`**

---

## 📦 Database Auto-Seeding on Initial Startup
The `DataInitializer` bean automatically seeds:
- **3 Demo Users**:
  - `owner@medicare.com` (Store Owner / Chief Pharmacist)
  - `dr.sneha@clinic.org` (Doctor, Reg # MMC-2016-89421)
  - `vikram.m@gmail.com` (Customer)
- **3 Partner Medical Stores** with DL & GSTIN records
- **2 Distributors / Suppliers**
- **8 Core Medicines** with active batches, shelf locations, and tax rates

---

## 🌐 Key REST Endpoints

### 1. Authentication & Stores (`/api/auth`)
- `GET /api/auth/users` — Get available profiles (Store Owner, Doctor, Customer)
- `GET /api/auth/stores` — Get partner medical stores directory
- `POST /api/auth/login` — Authenticate user or switch active profile

### 2. Medicine Master & Inventory (`/api/medicines`)
- `GET /api/medicines` — Search medicines (supports `?query=` and `?category=`)
- `GET /api/medicines/{id}` — Get single medicine details
- `GET /api/medicines/{id}/fefo-batches` — Get active batches ordered by earliest expiry (FEFO)
- `GET /api/medicines/low-stock` — Get medicines at or below reorder threshold
- `POST /api/medicines` — Add new medicine and initial batch to Master Catalog
- `POST /api/medicines/{id}/batches` — Inward a new batch to an existing drug

### 3. High-Speed Counter POS Billing (`/api/billing`)
- `POST /api/billing/checkout` — Atomic POS checkout: deducts batch stock, calculates taxes (CGST/SGST), and creates invoice
- `GET /api/billing/invoices` — Get all past invoices
- `GET /api/billing/invoices/{invoiceNumber}` — Get specific invoice for thermal/A4 re-printing

### 4. Doctor & Customer Orders (`/api/orders`)
- `POST /api/orders/doctor` — Doctor submits e-prescription or drug order with dosages and diagnosis
- `POST /api/orders/customer` — Customer places order with **Cash on Delivery (COD)** or **Prepaid Online**
- `GET /api/orders` — Store owner views all incoming orders with Doctor MCI# attribution
- `PUT /api/orders/{id}/status` — Advance status (`PACKED`, `OUT_FOR_DELIVERY`, `COMPLETED`)

### 5. Automated Low-Stock Reorder (`/api/reorder`)
- `GET /api/reorder/low-stock` — Low inventory alert list
- `GET /api/reorder/whatsapp-url/{medicineId}` — Generates pre-filled WhatsApp Purchase Order URL
- `GET /api/reorder/email-url/{medicineId}` — Generates pre-filled Email Purchase Order URL

### 6. Profit & Loss Analytics (`/api/analytics`)
- `GET /api/analytics/pnl` — Real-time P&L (Total Revenue, COGS, Gross Profit, Net Margin %)
- `GET /api/analytics/top-selling` — Ranked list of best-selling medicines by volume & revenue
