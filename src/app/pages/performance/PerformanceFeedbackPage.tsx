import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getEmployees } from "../../../lib/services/employeeService";
import { createPerformanceReview } from "../../../lib/services/performanceService";
import { useAuth } from "../../contexts/AuthContext";
import type { Employee } from "../../../lib/types/database";

export default function PerformanceFeedbackPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [employeeQuery, setEmployeeQuery] = useState("");
  const [period, setPeriod] = useState("Q1 2026");
  const [technical, setTechnical] = useState("");
  const [communication, setCommunication] = useState("");
  const [teamwork, setTeamwork] = useState("");
  const [leadership, setLeadership] = useState("");
  const [comments, setComments] = useState("");
  const [goals, setGoals] = useState("");

  useEffect(() => {
    async function fetchEmps() {
      try {
        const data = await getEmployees();
        setEmployees(data.filter((e) => e.status === "Active"));
      } catch (err: any) {
        toast.error("Failed to fetch employees: " + err.message);
      } finally {
        setLoadingEmployees(false);
      }
    }
    fetchEmps();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Find selected employee
    const selectedEmp = employees.find(
      (emp) => emp.name === employeeQuery || emp.id === employeeQuery
    );

    if (!selectedEmp) {
      toast.error("Please select a valid employee from the list.");
      return;
    }
    if (!period) {
      toast.error("Review period is required.");
      return;
    }

    const techVal = Number(technical);
    const commVal = Number(communication);
    const teamVal = Number(teamwork);
    const leadVal = Number(leadership);

    if ([techVal, commVal, teamVal, leadVal].some((v) => isNaN(v) || v < 1 || v > 5)) {
      toast.error("Scores must be between 1 and 5.");
      return;
    }

    const rating = (techVal + commVal + teamVal + leadVal) / 4;

    const goalsArray = goals
      .split("\n")
      .map((g) => g.trim())
      .filter((g) => g.length > 0);

    setSubmitting(true);
    try {
      await createPerformanceReview({
        employee_id: selectedEmp.id,
        employee_name: selectedEmp.name,
        period,
        rating: Number(rating.toFixed(1)),
        technical_skills: techVal,
        communication: commVal,
        teamwork: teamVal,
        leadership: leadVal,
        reviewer: user?.name || "Manager",
        review_date: new Date().toISOString().split("T")[0],
        comments,
        goals: JSON.stringify(goalsArray) as any, // Stored as JSONB
      });
      toast.success("Performance feedback submitted successfully!");
      navigate("/performance/reviews");
    } catch (error: any) {
      toast.error("Failed to submit feedback: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <Link
          to="/performance/reviews"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to reviews
        </Link>
        <h1 className="text-3xl font-semibold text-gray-900">Submit Feedback</h1>
        <p className="text-gray-600 mt-1">Provide feedback for an employee</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feedback Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="employee">Select Employee *</Label>
              <div className="relative">
                <Input
                  id="employee"
                  list="employee-options"
                  placeholder="Type name or ID to search..."
                  value={employeeQuery}
                  onChange={(e) => setEmployeeQuery(e.target.value)}
                  disabled={loadingEmployees}
                  required
                />
                <datalist id="employee-options">
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.name}>
                      {emp.id} - {emp.department}
                    </option>
                  ))}
                </datalist>
                {loadingEmployees && (
                  <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-3 text-gray-400" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Review Period *</Label>
              <Input
                id="period"
                list="period-options"
                placeholder="e.g. Q1 2026 or March 2026"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                required
              />
              <datalist id="period-options">
                <option value="Q1 2026" />
                <option value="Q2 2026" />
                <option value="Q3 2026" />
                <option value="Q4 2026" />
              </datalist>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="technical">Technical Skills (1-5) *</Label>
                <Input
                  id="technical"
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  placeholder="5"
                  value={technical}
                  onChange={(e) => setTechnical(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="communication">Communication (1-5) *</Label>
                <Input
                  id="communication"
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  placeholder="4"
                  value={communication}
                  onChange={(e) => setCommunication(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teamwork">Teamwork (1-5) *</Label>
                <Input
                  id="teamwork"
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  placeholder="5"
                  value={teamwork}
                  onChange={(e) => setTeamwork(e.target.value)}
                  required
             />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadership">Leadership (1-5) *</Label>
                <Input
                  id="leadership"
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  placeholder="4"
                  value={leadership}
                  onChange={(e) => setLeadership(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">Comments *</Label>
              <Textarea
                id="comments"
                placeholder="Provide detailed feedback on the employee's performance..."
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goals">Goals for Next Period</Label>
              <Textarea
                id="goals"
                placeholder="List goals for the next review period (one per line)..."
                rows={3}
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" size="lg" disabled={submitting || loadingEmployees}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Feedback
              </Button>
              <Button type="button" variant="outline" size="lg" asChild disabled={submitting}>
                <Link to="/performance/reviews">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
