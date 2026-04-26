# SoulRep Gym — Management Software

A professional-grade Gym Management System built with **Next.js 15**, **Prisma**, and **PostgreSQL (Neon)**. Designed with a focus on modular backend architecture, type-safety, and AI-driven features.

## 🏗️ Technical Architecture

As a backend-focused project, the system follows a **Service-Oriented** architecture to ensure scalability, maintainability, and clear separation of concerns.

### 1. Domain-Based Service Layer
The business logic is decoupled from the API routes and isolated into dedicated domain services located in `src/backend/services/`:
*   **Nutrition Service**: Orchestrates AI-powered diet plan generation and macro calculations.
*   **Attendance Service**: Handles QR-based check-ins and session tracking.
*   **Booking Service**: Manages trainer schedules and PT session reservations.
*   **Review Service**: Processes trainer feedback and rating aggregation.
*   **Member Service**: Manages member profiles, security settings (password hashing), and physiological data synchronization.

### 2. Thin API Wrappers
Next.js API routes (`src/app/api/`) act as thin transport layers. They are responsible only for:
*   Route-level authentication via custom middleware.
*   Request validation and payload parsing.
*   Delegating execution to the appropriate domain service.

### 3. Database & Type Safety
*   **ORM**: Uses **Prisma** for type-safe database queries and automated migrations.
*   **Database**: Hosted on **Neon (PostgreSQL)**, utilizing serverless compute scaling.
*   **Schema**: A normalized relational schema documented via **DBML** (see `docs/database_schema.dbml`).

## 🤖 AI Features
Integrated with **Google Gemini Pro** to provide a personalized "AI Nutritionist" experience for gym members. The system takes into account:
*   Fitness goals (Muscle Gain, Fat Loss, etc.).
*   Activity levels and dietary preferences (Veg, Vegan, Non-Veg).
*   Automatic macro-target calculation based on physiological data.

## 📂 Project Structure
To maintain a "Clean Code" environment, all non-core assets are organized follows:
*   `/docs/`: Contains the database schema (DBML) and system diagrams (PlantUML).
*   `/scripts/`: Administrative utility scripts for data maintenance and migration.
*   `/src/backend/`: The heart of the application logic, containing services, shared Prisma clients, and server-side utilities.

---

## 🚀 Getting Started

### 1. Environment Setup
Create a `.env.local` file in the root directory:
```env
DATABASE_URL="your_postgresql_url"
NEXTAUTH_SECRET="your_secret"
SOULREP_GEMINI_API_KEY="your_gemini_key"
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Database Initialization
```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server
```bash
pnpm dev
```

---

## 🔐 Demo Login Credentials

For testing and demonstration purposes, the following default users are available (seeded via `prisma/seed.ts`):

### 👨‍🏫 Trainer Accounts
**Emails:**
- rajesh@soulrep.com  
- priya@soulrep.com  
- vikram@soulrep.com  
- anjali@soulrep.com  

**Password:** `trainer123`

---

### 🧑‍💼 Owner Account
**Email:** owner@soulrep.com  
**Password:** `owner123`

> ⚠️ Note: These credentials are intended for development/demo use only. In production, ensure proper authentication and secure credential management.

## 🛠️ Built With
*   **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
*   **Database**: [PostgreSQL](https://www.postgresql.org/) via [Neon](https://neon.tech/)
*   **ORM**: [Prisma](https://www.prisma.io/)
*   **AI**: [Google Gemini SDK](https://ai.google.dev/)
*   **Styling**: Vanilla CSS with modern Design Tokens
