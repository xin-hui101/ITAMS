# ITAMS — IT Asset Management System

A full-stack web application for managing IT assets, maintenance records, user permissions, and audit logs within an organization.

🌐 **Live:** https://itams.eastasia.cloudapp.azure.com

---

## Features

### 📦 Asset Management

- Track all IT assets with category-based organization
- Dynamic custom fields per category
- Asset ID auto-generation based on category prefix
- Status tracking (Active, Inactive, Under Maintenance, Dispose)
- Warranty expiry monitoring and alerts
- Purchase price tracking and total asset value calculation
- Print asset reports (filtered, landscape PDF)

### 🔧 Maintenance Management

- Log maintenance records linked to specific assets
- Filter assets by category in the maintenance modal
- Track maintenance status (Pending, In Progress, Completed)
- Record technician/company, cost, and completion date

### 👥 User Management

- Role-based access control (RBAC)
- Granular module-level permissions (Create, Read, Update, Delete)
- Token versioning — permission changes force immediate re-login
- User status management (Active/Inactive)

### 📁 Categories Management

- Dynamic category creation with custom icons
- Configurable fixed fields (Serial Number, Brand, Model, Location)
- Custom field definitions per category (Text, Number, Date, Select)
- Asset prefix auto-numbering (e.g. LAP-000 → first asset is LAP-001)

### 📋 Audit Log

- Full activity tracking across all modules
- Human-readable action descriptions
- Malaysia timezone (UTC+8) display
- Date range filtering
- KPI cards for today's activity
- Print audit log reports

### 📊 Dashboard

- KPI overview (assets, value, maintenance, logs)
- Asset status donut chart
- Maintenance status bar chart
- Assets by category bar chart
- Warranty expiring soon alerts (expired, 7 days, 30 days)
- Recent activity feed
- Permission-based widget visibility

---

## Tech Stack

### Frontend

| Technology      | Purpose             |
| --------------- | ------------------- |
| React 18        | UI framework        |
| TypeScript      | Type safety         |
| Vite            | Build tool          |
| React Router v6 | Client-side routing |
| Axios           | HTTP client         |
| Tabler Icons    | Icon library        |

### Backend

| Technology            | Purpose           |
| --------------------- | ----------------- |
| ASP.NET Core 10       | Web API framework |
| C#                    | Backend language  |
| Entity Framework Core | ORM               |
| JWT Authentication    | Stateless auth    |
| BCrypt                | Password hashing  |

### Database

| Technology         | Purpose                 |
| ------------------ | ----------------------- |
| Azure SQL Database | Cloud database          |
| EF Core Migrations | Schema management       |
| EAV Pattern        | Dynamic category fields |

### Infrastructure

| Technology              | Purpose                             |
| ----------------------- | ----------------------------------- |
| Azure VM (Ubuntu 22.04) | Hosting                             |
| Docker + Docker Compose | Containerization                    |
| Nginx                   | Reverse proxy + static file serving |
| Let's Encrypt           | SSL certificate                     |
| GitHub Actions          | CI/CD auto-deployment               |

---

## Architecture

```
GitHub (Source Code)
    ↓ Push to main branch
GitHub Actions (CI/CD)
    ↓ SSH into VM
Azure VM — Docker
├── itams-frontend (React + Nginx)  → Port 80/443
└── itams-backend  (ASP.NET Core)   → Port 8080
         ↓
Azure SQL Database (ITAMS_DB)
```

## Author

**Xin Hui** — [@xin-hui101](https://github.com/xin-hui101)
