# 🏢 HR Management System (HRMS)

## 📌 Overview
A modern, responsive HR Management System (HRMS) for managing employees, attendance, payroll, recruitment, and performance in a centralized platform.

---

# 🚀 Features & Functionalities

## 🔐 Authentication & Authorization
- User registration (Admin, HR, Employee)
- Login / Logout
- Forgot & Reset Password
- Role-Based Access Control (RBAC)
- JWT authentication + bcrypt password hashing

---

## 📊 Dashboard
- Overview cards:
  - Total Employees
  - Attendance Summary
  - Leave Stats
  - Payroll Summary
- Charts:
  - Attendance trends
  - Employee growth
- Recent activity feed

---

## 👥 Employee Management
- Employee list (search, filter, pagination)
- Add / Edit employee
- Employee profile
- Document upload
- Department & role assignment

---

## 🕒 Attendance Management
- Check-in / Check-out system
- Attendance dashboard (present, absent, late)
- Daily attendance table
- Calendar view
- Auto status calculation

---

## 🌴 Leave Management
- Leave request form
- Leave balance tracking
- Leave approval/rejection (Admin/HR)
- Leave history
- Leave types (casual, sick, annual)

---

## 💰 Payroll Management
- Salary overview dashboard
- Payroll table (monthly salaries)
- Payslip generation (PDF)
- Bonus & deductions
- Tax calculation support

---

## 🏢 Department & Roles
- Department creation & listing
- Role & permission management
- RBAC (read/write/update/delete)

---

## 📢 Recruitment Module
- Job posting
- Candidate list
- Application tracking
- Resume upload
- Hiring pipeline (applied → interviewed → hired)

---

## 📈 Performance Management
- Performance review system
- KPI tracking
- Rating system
- Feedback form
- Review cycles (monthly/quarterly)

---

## 🔔 Notifications & Messaging
- Notification panel
- Real-time alerts
- Internal messaging (chat system)
- WebSocket integration (Socket.io)

---

## ⚙️ Settings
- Profile settings
- Company settings
- Security settings (password, 2FA)

---

## 📊 Reports & Analytics
- Custom reports dashboard
- Filters & analytics
- Export options (PDF, CSV)

---

## 🎨 UI System
- Reusable components (buttons, tables, modals)
- Light / Dark mode
- Loading states
- Empty states
- Responsive design

---

# 🗄️ Database Design

## ✅ Recommended Database: MongoDB
- Flexible schema
- Fast development (MERN stack)
- Good for nested data

---

## 📂 Collections

### Users
```json
{
  _id,
  name,
  email,
  password,
  role,
  departmentId,
  profileImage,
  createdAt
}