To run the project

- Ensure '.env' file is in Backend and contains 
DATABASE_URL, JWT_SECRET, PORT=5000, NODE_ENV='development'

1. git clone <your-repo-url>
cd MiebachMgmt

2. Backend Setup
cd Backend 
npm install

- Migrate database
-npm:run prisma:migrate

- Seed database with given seed.ts
npm run:prisma:seed

### Start backend server
npm run dev

3. Frontend Setup
cd Frontend
npm install 

### Start frontend server in another terminal 
npm run dev

[http://localhost:5173]

## Seeded Credentials
### Manager Account
- **Email:** `niraj@example.com`
- **Password:** `manager123`
- **Role:** Full access to create projects, assign tasks, view budgets, and generate invoices

### Contributor Accounts

**Alice (Consultant)**
- **Email:** `alice@example.com`
- **Password:** `alice123`
- **Role:** Can view assigned tasks and log time entries

**Bob (Analyst)**
- **Email:** `bob@example.com`
- **Password:** `bob123`
- **Role:** Can view assigned tasks and log time entries


## 🎯 Optional Extensions Implemented

### 1. **Real-Time Budget Tracking UI**
- Budget widgets display on task and phase cards
- Live updates as time entries are logged

### 2. **Enhanced Utilization Dashboard**
- Project-level utilization table showing all team members
- Per-user utilization metrics
- Visual comparison of forecast vs. actual hours

### 3. **Invoice Generation UI**
- Interactive invoice generator with date range selection
- Detailed line-item breakdown by task and contributor
- Automatic total calculation

### 4. **Improved UX**
- Modal-based workflows for task assignment
- Inline forms for quick data entry
- Addition of forms for all staffing/tasks/phases 

---

## 🏗️ Design Choices & Trade-offs

### Architecture
- **Separation of Concerns:** Clean separation between business logic (services), data access (Prisma), and API routes (controllers)
- **RESTful API:** Standard REST conventions for predictable endpoints
- **JWT Authentication:** Stateless authentication for scalability

### Database Design
- **Decimal Types:** Used for money and hours to avoid floating-point precision issues
- **Cascade Deletes:** Configured to maintain referential integrity
- **Indexed Columns:** Added indexes on frequently queried fields (email, dates, relationships)

### Frontend Patterns
- **Context API:** For global auth state management
- **Custom Hooks:** `useAuth()` for cleaner component code
- **Protected Routes:** Middleware-style route protection
- **Optimistic UI:** Immediate feedback before API responses

### Trade-offs
1. **Forecast Hour Adjustment:** Currently decrements forecast hours when time is logged. In a real system, you might track "planned vs. actual" separately to preserve original estimates.

2. **Invoice Storage:** Generated dynamically on request rather than stored. Storing invoices would enable audit trails but adds complexity.

3. **Real-Time Updates:** Currently requires manual refresh. WebSocket integration would provide live updates but increases infrastructure complexity.

4. **Validation:** Basic validation on the frontend and backend. Production would need more comprehensive validation (e.g., preventing overlapping tasks, budget overruns).

5. **Error Handling:** Generic error messages for simplicity. Production would need detailed error codes and user-friendly messages.

