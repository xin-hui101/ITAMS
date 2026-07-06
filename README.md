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
<img width="959" height="437" alt="image" src="https://github.com/user-attachments/assets/d0b4895f-14b9-4c5e-bc5e-5bbb77f4575d" />

### 🔧 Maintenance Management

- Log maintenance records linked to specific assets
- Filter assets by category in the maintenance modal
- Track maintenance status (Pending, In Progress, Completed)
- Record technician/company, cost, and completion date
<img width="959" height="436" alt="image" src="https://github.com/user-attachments/assets/c69b6731-a2e9-4bfc-95e6-9341a45e8b54" />

### 👥 User Management

- Role-based access control (RBAC)
- Granular module-level permissions (Create, Read, Update, Delete)
- Token versioning — permission changes force immediate re-login
- User status management (Active/Inactive)
<img width="959" height="445" alt="image" src="https://github.com/user-attachments/assets/609473b4-238d-4c3a-8964-58f24f6da74d" />

### 📁 Categories Management

- Dynamic category creation with custom icons
- Configurable fixed fields (Serial Number, Brand, Model, Location)
- Custom field definitions per category (Text, Number, Date, Select)
- Asset prefix auto-numbering (e.g. LAP-000 → first asset is LAP-001)
<img width="947" height="439" alt="image" src="https://github.com/user-attachments/assets/64219398-83d8-46e3-9dcf-afacf886a85b" />


### 📋 Audit Log

- Full activity tracking across all modules
- Human-readable action descriptions
- Malaysia timezone (UTC+8) display
- Date range filtering
- KPI cards for today's activity
- Print audit log reports
<img width="958" height="440" alt="image" src="https://github.com/user-attachments/assets/c4f58840-7c9e-47ea-8f46-c1ee41ffc86d" />

### 📊 Dashboard

- KPI overview (assets, value, maintenance, logs)
- Asset status donut chart
- Maintenance status bar chart
- Assets by category bar chart
- Warranty expiring soon alerts (expired, 7 days, 30 days)
- Recent activity feed
- Permission-based widget visibility
<img width="959" height="440" alt="image" src="https://github.com/user-attachments/assets/b2966b97-9fbb-45d4-b3c5-51d8125e1628" />


### 🤖 AI Chatbot Assistant

- Ask questions about assets, maintenance, and warranty status in natural language
- Responses grounded in real-time data fetched directly from the database
- Supports markdown formatting including tables for structured data
- Responds in the same language the user writes in
<img width="955" height="443" alt="image" src="https://github.com/user-attachments/assets/765e33a1-f21d-40c8-8b59-599a979753e4" />


**What the assistant knows:**

| Data                | Description                                           |
| ------------------- | ----------------------------------------------------- |
| Total Assets        | Count of all registered assets                        |
| Total Asset Value   | Sum of all asset purchase prices (RM)                 |
| Active Assets       | Count of assets with status `Active`                  |
| Pending Maintenance | Count of maintenance records with status `Pending`    |
| Assets by Category  | Breakdown of asset count per category                 |
| Warranty Alerts     | Assets with warranty expiring within the next 30 days |
| Recent Maintenance  | Latest 10 maintenance records                         |

**Example questions:**

- `Which assets are expiring soon?`
- `What is the total asset value?`
- `How many assets are under maintenance?`
- `Show me asset summary`

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

| Technology              | Purpose           |
| ----------------------- | ----------------- |
| ASP.NET Core 10         | Web API framework |
| C#                      | Backend language  |
| Entity Framework Core   | ORM               |
| JWT Authentication      | Stateless auth    |
| BCrypt                  | Password hashing  |
| Google Gemini 3.5 Flash | AI chatbot        |

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

---

## Configuration

Add your Gemini API key to `appsettings.json`:

```json
"Gemini": {
  "ApiKey": "your-gemini-api-key-here"
}
```

> **Note:** `appsettings.Production.json` is excluded from version control via `.gitignore`. Never commit your API key.

---

## Author

**Xin Hui** — [@xin-hui101](https://github.com/xin-hui101)
