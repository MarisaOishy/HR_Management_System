import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import { Star, Eye, Plus, Loader2 } from "lucide-react";
import { getPerformanceReviews } from "../../../lib/services/performanceService";
import { getEmployees } from "../../../lib/services/employeeService";
import type { PerformanceReview, Employee } from "../../../lib/types/database";
import { toast } from "sonner";

export default function PerformanceReviewsPage() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedReviews((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [reviewData, employeeData] = await Promise.all([
        getPerformanceReviews(),
        getEmployees(),
      ]);
      setReviews(reviewData);
      setEmployees(employeeData);
    } catch (error: any) {
      toast.error("Failed to load performance data: " + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Map employee details for quick lookup
  const employeeMap = new Map<string, Employee>();
  employees.forEach((emp) => employeeMap.set(emp.id, emp));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Performance Reviews</h1>
          <p className="text-gray-600 mt-1">Track employee performance and goals</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/performance/feedback">Submit Feedback</Link>
          </Button>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <Card>
          <CardContent className="py-16 flex items-center justify-center text-gray-500">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Loading performance reviews...
          </CardContent>
        </Card>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-gray-500">No performance reviews found.</p>
            <Button className="mt-4" asChild>
              <Link to="/performance/feedback">
                <Plus className="w-4 h-4 mr-2" />
                Create First Review
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {reviews.map((review) => {
            const empData = employeeMap.get(review.employee_id);
            // goals is stored as stringified JSON in the DB
            let goals: string[] = [];
            try {
              if (Array.isArray(review.goals)) {
                 goals = review.goals;
              } else if (typeof review.goals === "string") {
                 goals = JSON.parse(review.goals || "[]");
              }
            } catch (e) {
              goals = [];
            }

            const isExpanded = expandedReviews.has(review.id);

            return (
              <Card key={review.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {empData?.avatar ? (
                        <img src={empData.avatar} alt={empData.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                          {review.employee_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <CardTitle>{review.employee_name}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {empData ? `${empData.role} • ${empData.department}` : `Reviewer: ${review.reviewer}`}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">Period: {review.period}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        <span className="text-2xl font-semibold text-gray-900">{Number(review.rating).toFixed(1)}</span>
                        <span className="text-gray-600">/ 5.0</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent className="space-y-6 pt-0">
                    {/* Rating Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Technical Skills</span>
                          <span className="font-medium">{review.technical_skills}/5</span>
                        </div>
                        <Progress value={Number(review.technical_skills) * 20} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Communication</span>
                          <span className="font-medium">{review.communication}/5</span>
                        </div>
                        <Progress value={Number(review.communication) * 20} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Teamwork</span>
                          <span className="font-medium">{review.teamwork}/5</span>
                        </div>
                        <Progress value={Number(review.teamwork) * 20} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Leadership</span>
                          <span className="font-medium">{review.leadership}/5</span>
                        </div>
                        <Progress value={Number(review.leadership) * 20} />
                      </div>
                    </div>

                    {/* Comments */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Comments</p>
                      <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">{review.comments || "No comments provided."}</p>
                    </div>

                    {/* Goals */}
                    {goals.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Goals for Next Period</p>
                        <div className="space-y-2">
                          {goals.map((goal, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50/50 p-2 rounded">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                              {goal}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}

                <div className="px-6 py-4 flex items-center justify-between border-t bg-gray-50/30">
                  <p className="text-sm text-gray-500">Reviewed by {review.reviewer} on {review.review_date}</p>
                  <Button variant="outline" size="sm" onClick={() => toggleExpand(review.id)}>
                    <Eye className="w-4 h-4 mr-2" />
                    {isExpanded ? "Hide Full Review" : "View Full Review"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
