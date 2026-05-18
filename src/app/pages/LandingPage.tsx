import { Link } from "react-router";
import {
  Users,
  Calendar,
  FileText,
  Landmark,
  TrendingUp,
  Shield,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Clock,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { useAuth, isEmployee } from "../contexts/AuthContext";

const features = [
  {
    icon: Users,
    title: "Employee Management",
    description:
      "Centralized employee profiles, departments and roles — all the records you need in one place.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Calendar,
    title: "Attendance Tracking",
    description:
      "Daily attendance, calendar views and shift summaries to keep your workforce on schedule.",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: FileText,
    title: "Leave Management",
    description:
      "Request, approve and review leaves with a clean workflow and complete history.",
    color: "bg-orange-50 text-orange-600",
  },
  {
    icon: Landmark,
    title: "Payroll Processing",
    description:
      "Generate payslips, process payroll in Bangladeshi Taka and keep finance audit-ready.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: TrendingUp,
    title: "Performance Reviews",
    description:
      "Structured feedback and review cycles to grow your people and your business.",
    color: "bg-pink-50 text-pink-600",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    description:
      "Real-time dashboards and exportable reports — make decisions backed by data.",
    color: "bg-indigo-50 text-indigo-600",
  },
];

const highlights = [
  "Built for Bangladeshi organizations",
  "Role-based access for HR, Admin and Employees",
  "Secure authentication and audit logs",
  "Modern, responsive design",
];

export default function LandingPage() {
  const { user, role } = useAuth();
  const dashboardPath = isEmployee(role) ? "/employee/dashboard" : "/dashboard";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">BD</span>
            </div>
            <span className="font-semibold text-gray-900 text-lg">BanglaHR</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">
              Features
            </a>
            <a href="#why" className="text-sm text-gray-600 hover:text-gray-900">
              Why BanglaHR
            </a>
            <a href="#contact" className="text-sm text-gray-600 hover:text-gray-900">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild>
                <Link to={dashboardPath}>
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/auth/login">Login</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium mb-6">
              <Shield className="w-3.5 h-3.5" />
              Trusted HR Management Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Manage your{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                workforce
              </span>{" "}
              with confidence
            </h1>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
              BanglaHR is a complete Human Resource Management System — employees,
              attendance, leave, payroll, performance and reports — designed for
              modern Bangladeshi organizations.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <Button size="lg" asChild>
                  <Link to="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" asChild>
                  <Link to="/auth/login">
                    Login to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              )}
            </div>

            <ul className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {highlights.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Hero visual */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-blue-200/40 via-purple-200/40 to-pink-200/40 rounded-3xl blur-2xl" />
            <Card className="relative shadow-xl border-0 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Welcome back</p>
                    <p className="text-lg font-semibold text-gray-900">HR Dashboard</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-4 rounded-xl bg-blue-50">
                    <Users className="w-5 h-5 text-blue-600 mb-2" />
                    <p className="text-2xl font-semibold text-gray-900">248</p>
                    <p className="text-xs text-gray-500">Employees</p>
                  </div>
                  <div className="p-4 rounded-xl bg-green-50">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mb-2" />
                    <p className="text-2xl font-semibold text-gray-900">231</p>
                    <p className="text-xs text-gray-500">Present today</p>
                  </div>
                  <div className="p-4 rounded-xl bg-orange-50">
                    <FileText className="w-5 h-5 text-orange-600 mb-2" />
                    <p className="text-2xl font-semibold text-gray-900">12</p>
                    <p className="text-xs text-gray-500">Pending leaves</p>
                  </div>
                  <div className="p-4 rounded-xl bg-purple-50">
                    <Landmark className="w-5 h-5 text-purple-600 mb-2" />
                    <p className="text-2xl font-semibold text-gray-900">Tk 4.2M</p>
                    <p className="text-xs text-gray-500">Monthly payroll</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: "Engineering", value: 72 },
                    { label: "Sales", value: 56 },
                    { label: "Operations", value: 40 },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">{row.label}</span>
                        <span className="text-xs font-medium text-gray-900">{row.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                          style={{ width: `${row.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Everything you need, in one platform
            </h2>
            <p className="mt-4 text-gray-600">
              From hiring to payroll — BanglaHR replaces the spreadsheets and
              scattered tools with one focused HR suite.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="border-gray-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why BanglaHR */}
      <section id="why" className="bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Built for the way HR teams actually work
              </h2>
              <p className="text-blue-100 mb-8 leading-relaxed">
                Localized for Bangladesh, designed for clarity. Role-based access
                ensures HR Admins, HR staff and Employees each see exactly what
                they need — nothing more, nothing less.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: Shield, label: "Secure by default" },
                  { icon: Clock, label: "Save hours every week" },
                  { icon: BarChart3, label: "Data-driven decisions" },
                  { icon: Users, label: "Collaborative workflows" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {[
                { value: "100+", label: "Employees managed" },
                { value: "99.9%", label: "Uptime" },
                { value: "24/7", label: "Access" },
                { value: "BDT", label: "Native currency" },
              ].map((stat) => (
                <div key={stat.label} className="p-6 rounded-2xl bg-white/10 backdrop-blur border border-white/20">
                  <p className="text-4xl font-bold mb-2">{stat.value}</p>
                  <p className="text-sm text-blue-100">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Ready to streamline your HR?
          </h2>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            Sign in to the dashboard and start managing your workforce in minutes.
          </p>
          {user ? (
            <Button size="lg" asChild>
              <Link to={dashboardPath}>
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          ) : (
            <Button size="lg" asChild>
              <Link to="/auth/login">
                Login to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">BD</span>
                </div>
                <span className="font-semibold text-white">BanglaHR</span>
              </div>
              <p className="text-sm leading-relaxed">
                Modern HR management for Bangladeshi organizations.
              </p>
            </div>

            <div>
              <p className="text-white font-semibold mb-3">Product</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#why" className="hover:text-white">Why BanglaHR</a></li>
                <li><Link to="/auth/login" className="hover:text-white">Login</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-white font-semibold mb-3">Resources</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
              </ul>
            </div>

            <div>
              <p className="text-white font-semibold mb-3">Contact</p>
              <ul className="space-y-2 text-sm">
                <li>Dhaka, Bangladesh</li>
                <li>hello@banglahr.com.bd</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs">© {new Date().getFullYear()} BanglaHR. All rights reserved.</p>
            <p className="text-xs">Built with care for HR teams.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
