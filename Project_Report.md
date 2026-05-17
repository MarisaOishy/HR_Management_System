# HR Management System (HRMS) - Project Report

## 1. Project Context & Overview
The HR Management System (HRMS) is a comprehensive, modern, and robust web application designed to centralize and streamline human resource operations. It replaces traditional, fragmented HR processes with a unified platform for managing employees, attendance, payroll, leave requests, and performance reviews. 

The system is built with a modern serverless architecture, utilizing a React frontend and a Supabase backend to ensure high performance, real-time data synchronization, and secure data handling.

## 2. Technology Stack
The project leverages a modern tech stack to provide a responsive and dynamic user experience:

### Frontend
* **Framework:** React (v18) with TypeScript for type safety.
* **Build Tool:** Vite for fast module replacement and building.
* **Routing:** React Router v7 for seamless single-page application navigation.
* **Styling & UI:** Tailwind CSS for utility-first styling, integrated with Radix UI primitives for accessible components.
* **Data Visualization:** Recharts for dynamic dashboard analytics.
* **Forms & Animations:** React Hook Form for state management and validation; Framer Motion for UI micro-animations.

### Backend & Database
* **Platform:** Supabase (Serverless PostgreSQL).
* **Authentication:** Supabase Auth for secure user sessions and role management.
* **Storage:** Supabase Storage for managing employee profile pictures and documents.
* **Realtime:** Real-time database subscriptions for live attendance and status updates.

## 3. Core Modules & Functionalities

### Authentication & Authorization
* Secure login, registration, and password recovery workflows.
* Centralized Role-Based Access Control (RBAC) ensuring users only see data and modules relevant to their designation.

### Dashboard & Analytics
* High-level overview cards displaying key metrics (Total Employees, Attendance Summary, Leave Stats).
* Visual charts showing attendance trends and organization growth.
* Recent activity feeds for HR and Admins.

### Employee Management
* End-to-end CRUD operations for employee records.
* Advanced search, filtering, and pagination support.
* Detailed employee profiles including personal information, assigned departments, and uploaded documents.

### Attendance Tracking
* Real-time Check-in / Check-out functionality with live clocks.
* Daily attendance logs and interactive calendar views.
* Automated status calculations to flag Present, Absent, Late, or Early Departures, alongside working hour calculations.

### Leave Management
* Submission workflows for different leave types (Casual, Sick, Annual).
* Approval/rejection pipelines for managers.
* Live tracking of available leave balances and historical request data.

### Payroll Management
* Salary overviews and monthly payroll processing workflows.
* Calculation of base pay, bonuses, tax deductions, and net salary.
* Generation and export capabilities for employee payslips.

### Departments & Performance
* **Departments:** Organization structure management, mapping employees to designated functional units.
* **Performance:** Modules for conducting performance reviews and capturing feedback.

## 4. Role-Based Access Control (RBAC)
The system is strictly governed by user roles. The primary roles are **Admin**, **HR**, and **Employee**. 

### Administrator (Admin)
The Admin has unrestricted access to the entire platform. 
* Can manage all employee data, approve leaves, and process payroll.
* **Exclusive Access:** Only the Admin can access the **Roles** management module and the application/company **Settings**. They also have access to dedicated Admin-only modules like system-wide Audit Logs and overarching reporting.

### Human Resources (HR)
The HR role is designed for daily operational management but lacks system configuration privileges.
* Can manage employee profiles, track attendance, approve/reject leaves, and oversee payroll processes.
* **Key Restriction:** The HR role **does not** have access to the **Settings** tab or the **Roles** tab. They cannot reconfigure system permissions, change core company configurations, or manipulate global security settings.

### Employee
The Employee role has self-service access.
* Can view their own profile, submit leave requests, check in/out for attendance, and view personal payslips.
* Cannot view other employees' sensitive data or access any management dashboards.

## 5. Database Architecture
The application uses PostgreSQL (via Supabase) with the following key relational entities:
* **Employees/Users:** Linked securely to Supabase Auth.
* **Departments & Roles:** For organizational structuring.
* **Attendance Logs:** Storing precise timestamps for check-ins and check-outs.
* **Leave Requests:** Tracking leave status (Pending, Approved, Rejected) and balances.
* **Payroll Records:** Archiving monthly salary disbursements.
* **Audit Logs:** (Admin only) Tracking critical system changes for security and compliance.

## 6. Summary
The HRMS is a production-ready application that efficiently segregates responsibilities through its RBAC model. By restricting sensitive configuration modules (Roles and Settings) solely to Administrators, it ensures that HR personnel can focus entirely on organizational management and employee relations without risking accidental system-wide misconfigurations.
