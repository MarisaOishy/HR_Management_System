# 🏢 HR Management System (HRMS)

A modern, responsive, and robust HR Management System built with React, Vite, Tailwind CSS, and Supabase. It provides a centralized platform for managing employees, attendance, payroll, leaves, and more.

## 🚀 Tech Stack

- **Frontend Framework:** React (v18) with TypeScript
- **Build Tool:** Vite
- **Routing:** React Router v7
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI primitives, accessible UI components
- **Icons:** Lucide React, Material UI Icons
- **Charts & Data Visualization:** Recharts
- **Forms & Validation:** React Hook Form
- **Animations:** Framer Motion (`motion`)
- **Backend & Database:** Supabase (PostgreSQL, Authentication, Storage)

## 📌 Key Features & Modules

- **🔐 Authentication & Authorization**
  - Secure login and user sessions managed via Supabase Auth.
  - Role-Based Access Control (RBAC) supporting Admin, HR, and Employee roles.

- **📊 Dashboard**
  - High-level overview cards (Total Employees, Attendance Summary, Leave Stats).
  - Visual charts showing attendance trends and employee growth using Recharts.
  - Recent activity feeds.

- **👥 Employee Management**
  - Complete operations for employee records.
  - Search, filter, and pagination support.
  - Detailed profiles, document uploads, and department assignments.

- **🕒 Attendance Tracking**
  - Check-in / Check-out functionality.
  - Daily attendance logs and interactive calendar views.
  - Automatic status calculation (Present, Absent, Late, Working Hours).

- **🌴 Leave Management**
  - Leave request submissions with types (casual, sick, annual).
  - Approval/rejection workflows for Admin and HR.
  - Live tracking of leave balances and history.

- **💰 Payroll Management**
  - Salary overview and monthly payroll processing.
  - Support for bonuses, deductions, and tax calculations.
  - Payslip viewing and export generation.

- **🏢 Departments & Roles**
  - Organization structure management.
  - Department creation and listing.
  - Dynamic role and permissions assignment.

- **📈 Performance & Reports**
  - Performance review modules.
  - Custom reporting tools with filtering.

- **⚙️ Settings**
  - Application, profile, and security settings configuration.

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A [Supabase](https://supabase.com/) account and project.

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd Hrmanagementsystemuidesign
   ```

2. **Install dependencies:**
   Using npm:
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

## 🗄️ Database Architecture (Supabase / PostgreSQL)

This application relies entirely on Supabase for its backend, replacing traditional MERN stacks with a modern Serverless Postgres approach. The system takes advantage of Supabase for:
- **Authentication**: Managing secure user access.
- **Database**: PostgreSQL schema for structured HR data.
- **Realtime**: For live updates across the dashboard and attendance system.
- **Storage**: For managing employee profile pictures and documents.

Key relational entities typically managed include Employees, Attendance logs, Leave requests, Departments, Roles, and Payroll records.