import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Search, X } from "lucide-react";
import {
  getAttendanceByEmployee,
  getAllEmployees,
} from "../../../lib/services/attendanceService";
import type { AttendanceRecord } from "../../../lib/types/database";
import { toast } from "sonner";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type DayStatus = "Present" | "Late" | "Present (Late)" | "Half Day" | "Absent" | "Leave" | "Holiday";

export default function AttendanceCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");

  // ── Search state ──────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  // ── Click-outside to close suggestions ────────────────────
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Filtered employees based on search query ──────────────
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const query = searchQuery.toLowerCase().trim();
    return employees.filter((emp) =>
      emp.name.toLowerCase().startsWith(query)
    );
  }, [employees, searchQuery]);

  // ── Handle selecting an employee from suggestions ─────────
  const handleSelectEmployee = (empId: string, empName: string) => {
    setSelectedEmployee(empId);
    setSearchQuery(empName);
    setShowSuggestions(false);
  };

  // ── Handle clearing the search ────────────────────────────
  const handleClearSearch = () => {
    setSearchQuery("");
    setSelectedEmployee("");
    setShowSuggestions(false);
  };

  // ── Fetch employees on mount ──────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const emps = await getAllEmployees();
        setEmployees(emps.map((e) => ({ id: e.id, name: e.name })));
        if (emps.length > 0 && !selectedEmployee) {
          setSelectedEmployee(emps[0].id);
          setSearchQuery(emps[0].name);
        }
      } catch (error: any) {
        toast.error("Failed to load employees: " + error.message);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch records when employee changes ───────────────────
  useEffect(() => {
    if (!selectedEmployee) return;
    (async () => {
      try {
        setLoading(true);
        const data = await getAttendanceByEmployee(selectedEmployee);
        setRecords(data);
      } catch (error: any) {
        toast.error("Failed to load attendance: " + error.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedEmployee]);

  // ── Build a map of date → status for the current month ────
  const statusMap = useMemo(() => {
    const map = new Map<number, DayStatus>();
    for (const rec of records) {
      const d = new Date(rec.date + "T00:00:00");
      if (d.getFullYear() === year && d.getMonth() === month) {
        const status = rec.status as DayStatus;
        map.set(d.getDate(), status);
      }
    }
    return map;
  }, [records, year, month]);

  // ── Monthly stats ─────────────────────────────────────────
  const stats = useMemo(() => {
    const today = new Date();
    // Only count working days up to today (Mon–Fri)
    let workingDays = 0;
    const limit = year === today.getFullYear() && month === today.getMonth()
      ? Math.min(today.getDate(), daysInMonth)
      : daysInMonth;
    for (let d = 1; d <= limit; d++) {
      const day = new Date(year, month, d).getDay();
      if (day !== 0 && day !== 6) workingDays++;
    }

    let present = 0;
    let late = 0;
    let absent = 0;
    let leave = 0;

    statusMap.forEach((status) => {
      switch (status) {
        case "Present":
          present++;
          break;
        case "Present (Late)":
        case "Late":
          present++;
          late++;
          break;
        case "Half Day":
          present++;
          break;
        case "Absent":
          absent++;
          break;
        case "Leave":
          leave++;
          break;
      }
    });

    // Absent = working days with no record at all (and not in the future)
    const recordedDays = present + absent + leave;
    const impliedAbsent = Math.max(0, workingDays - recordedDays);
    absent += impliedAbsent;

    const baseDays = workingDays - leave;
    const attendanceRate = baseDays > 0
      ? ((present / baseDays) * 100).toFixed(0)
      : "100";

    return { present, late, absent, leave, attendanceRate };
  }, [statusMap, year, month, daysInMonth]);

  // ── Navigation ────────────────────────────────────────────
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // ── Status color helper ───────────────────────────────────
  const getStatusColor = (status?: DayStatus) => {
    switch (status) {
      case "Present":
        return "bg-green-100 text-green-700 border-green-300";
      case "Present (Late)":
      case "Late":
      case "Half Day":
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "Absent":
        return "bg-red-100 text-red-700 border-red-300";
      case "Leave":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "Holiday":
        return "bg-purple-100 text-purple-700 border-purple-300";
      default:
        return "bg-white text-gray-900 border-gray-200";
    }
  };

  // ── Build calendar cells ──────────────────────────────────
  const todayDate = new Date();
  const isCurrentMonth =
    todayDate.getFullYear() === year && todayDate.getMonth() === month;

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="p-2" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const status = statusMap.get(day);
    const isToday = isCurrentMonth && todayDate.getDate() === day;
    const displayStatus = status
      ? status.charAt(0).toUpperCase() + status.slice(1)
      : undefined;

    days.push(
      <div
        key={day}
        className={`p-2 border rounded-lg text-center ${getStatusColor(status)} ${
          isToday ? "ring-2 ring-blue-500" : ""
        }`}
      >
        <div className="font-semibold">{day}</div>
        {displayStatus && (
          <div className="text-xs mt-1">{displayStatus}</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/attendance"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to attendance
        </Link>
        <h1 className="text-3xl font-semibold text-gray-900">Attendance Calendar</h1>
        <p className="text-gray-600 mt-1">View attendance history by employee</p>
      </div>

      {/* Employee search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-full sm:w-80 relative" ref={searchRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Search Employee
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Type employee name to search..."
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    bg-white text-gray-900 placeholder-gray-400
                    transition-all duration-200"
                />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Suggestions dropdown */}
              {showSuggestions && searchQuery.trim() && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredEmployees.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      No employees found matching "{searchQuery}"
                    </div>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <button
                        key={emp.id}
                        onClick={() => handleSelectEmployee(emp.id, emp.name)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center gap-3 ${
                          selectedEmployee === emp.id ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-900"
                        }`}
                      >
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=3b82f6&color=fff&size=28`}
                          alt={emp.name}
                          className="w-7 h-7 rounded-full"
                        />
                        <span>{emp.name}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {selectedEmployee && (
              <div className="flex items-center gap-2 mt-6 sm:mt-0">
                <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 py-1.5 px-3">
                  Viewing: {employees.find(e => e.id === selectedEmployee)?.name || "—"}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
              <span className="text-sm text-gray-700">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300" />
              <span className="text-sm text-gray-700">Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
              <span className="text-sm text-gray-700">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300" />
              <span className="text-sm text-gray-700">Leave</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {months[month]} {year}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-500">Loading calendar...</span>
            </div>
          ) : (
            <>
              {/* Days of week */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {daysOfWeek.map((day) => (
                  <div key={day} className="text-center font-semibold text-gray-700 p-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-2">{days}</div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Present Days</p>
            <p className="text-3xl font-semibold text-gray-900 mt-2">{stats.present}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Absent Days</p>
            <p className="text-3xl font-semibold text-gray-900 mt-2">{stats.absent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Leave Days</p>
            <p className="text-3xl font-semibold text-gray-900 mt-2">{stats.leave}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Attendance Rate</p>
            <p className="text-3xl font-semibold text-gray-900 mt-2">{stats.attendanceRate}%</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
