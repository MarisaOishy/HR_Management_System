// =============================================================================
// HR Assistant Chatbot - Supabase Edge Function
//   - Runs on Supabase's Deno runtime, NOT Node. VSCode's default TS server
//     will flag `Deno` and `https://...` imports — those are false positives.
//     The @ts-nocheck below silences them; Deno validates types at deploy.
//   - Receives chat messages from the signed-in user
//   - Calls Google Gemini API (free tier) with role-aware tool definitions
//   - Executes tools against Supabase using the caller's JWT (so RLS applies)
//   - Returns the model's final natural-language reply
//
// Deploy:   supabase functions deploy hr-chat --no-verify-jwt
// Secrets:  supabase secrets set GEMINI_API_KEY=...
// =============================================================================
// @ts-nocheck

// deno-lint-ignore-file no-explicit-any
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Model is configurable via the GEMINI_MODEL secret so you can swap without
// redeploying code. Falls back to gemini-2.5-flash (current free-tier model).
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

interface UserContext {
  authId: string;
  email: string;
  displayName: string;
  role: string;          // "Admin" | "HR Admin" | "HR" | "Employee"
  employeeId: string | null;
}

// ---------------------------------------------------------------------------
// Role helpers (mirrors src/app/contexts/AuthContext.tsx)
// ---------------------------------------------------------------------------
function deriveRoleFromEmail(email: string): string {
  const local = email.split("@")[0].toLowerCase();
  if (local === "hr.admin" || local.startsWith("hr.admin")) return "HR Admin";
  if (local === "hr" || local.startsWith("hr.")) return "HR";
  return "Employee";
}
function isAdminOrHR(role: string): boolean {
  return role === "Admin" || role === "HR Admin" || role === "HR";
}

// ---------------------------------------------------------------------------
// Tool definitions (Gemini functionDeclarations format)
//   - Self-service tools work for any signed-in user (scoped to their own data)
//   - HR/Admin tools are filtered out for the Employee role
// ---------------------------------------------------------------------------
const selfServiceTools = [
  {
    name: "get_my_profile",
    description: "Get the signed-in user's own employee profile (name, role, department, join date).",
    parameters: { type: "OBJECT", properties: {} },
  },
  {
    name: "get_my_leave_balance",
    description: "Get the signed-in user's remaining leave days for annual, sick, and casual leave.",
    parameters: { type: "OBJECT", properties: {} },
  },
  {
    name: "get_my_recent_leaves",
    description: "Get the signed-in user's most recent leave requests with status.",
    parameters: {
      type: "OBJECT",
      properties: {
        limit: { type: "INTEGER", description: "Max number of records (default 5)." },
      },
    },
  },
  {
    name: "get_my_latest_payslip",
    description: "Get the signed-in user's most recent payroll record.",
    parameters: { type: "OBJECT", properties: {} },
  },
  {
    name: "get_my_attendance_summary",
    description: "Summarise the signed-in user's attendance for a date range (defaults to current month).",
    parameters: {
      type: "OBJECT",
      properties: {
        start_date: { type: "STRING", description: "ISO date YYYY-MM-DD." },
        end_date: { type: "STRING", description: "ISO date YYYY-MM-DD." },
      },
    },
  },
];

const hrOnlyTools = [
  {
    name: "get_pending_leave_approvals",
    description: "HR/Admin only. List leave requests with status = Pending.",
    parameters: { type: "OBJECT", properties: {} },
  },
  {
    name: "get_employees_on_leave",
    description: "HR/Admin only. Employees with approved leave covering the given date (defaults to today).",
    parameters: {
      type: "OBJECT",
      properties: {
        on_date: { type: "STRING", description: "ISO date YYYY-MM-DD (defaults to today)." },
      },
    },
  },
  {
    name: "count_employees_by_department",
    description: "HR/Admin only. Count of active employees grouped by department.",
    parameters: { type: "OBJECT", properties: {} },
  },
];

function toolsForRole(role: string) {
  return isAdminOrHR(role)
    ? [...selfServiceTools, ...hrOnlyTools]
    : selfServiceTools;
}

// ---------------------------------------------------------------------------
// Tool executor — all queries run through the user's RLS context
// ---------------------------------------------------------------------------
async function runTool(
  name: string,
  args: Record<string, any>,
  ctx: UserContext,
  sb: SupabaseClient,
): Promise<any> {
  const requireEmployeeId = () => {
    if (!ctx.employeeId) {
      throw new Error("No employee record linked to your account.");
    }
    return ctx.employeeId;
  };
  const requireHR = () => {
    if (!isAdminOrHR(ctx.role)) {
      throw new Error("This action is restricted to HR or Admin users.");
    }
  };

  switch (name) {
    case "get_my_profile": {
      const id = requireEmployeeId();
      const { data, error } = await sb
        .from("employees")
        .select("id, name, email, role, department, join_date, status")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ?? { error: "Profile not found" };
    }

    case "get_my_leave_balance": {
      const id = requireEmployeeId();
      const { data, error } = await sb
        .from("leave_balances")
        .select("annual_leave, sick_leave, casual_leave")
        .eq("employee_id", id)
        .maybeSingle();
      if (error) throw error;
      return data ?? { annual_leave: 0, sick_leave: 0, casual_leave: 0 };
    }

    case "get_my_recent_leaves": {
      const id = requireEmployeeId();
      const limit = Math.min(Math.max(Number(args.limit ?? 5), 1), 20);
      const { data, error } = await sb
        .from("leave_requests")
        .select("type, start_date, end_date, days, status, applied_date")
        .eq("employee_id", id)
        .order("applied_date", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    }

    case "get_my_latest_payslip": {
      const id = requireEmployeeId();
      const { data, error } = await sb
        .from("payroll")
        .select("month, basic_salary, allowances, deductions, net_salary, status, pay_date")
        .eq("employee_id", id)
        .order("pay_date", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ?? { error: "No payslip found." };
    }

    case "get_my_attendance_summary": {
      const id = requireEmployeeId();
      const today = new Date();
      const defaultStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
      const defaultEnd = today.toISOString().slice(0, 10);
      const start = args.start_date || defaultStart;
      const end = args.end_date || defaultEnd;
      const { data, error } = await sb
        .from("attendance_records")
        .select("date, status, hours")
        .eq("employee_id", id)
        .gte("date", start)
        .lte("date", end);
      if (error) throw error;

      const rows = data ?? [];
      const summary = { range: { start, end }, total_days: rows.length, present: 0, absent: 0, late: 0, total_hours: 0 };
      for (const r of rows) {
        const s = String(r.status || "").toLowerCase();
        if (s === "present") summary.present++;
        else if (s === "absent") summary.absent++;
        else if (s === "late") summary.late++;
        summary.total_hours += parseFloat(r.hours || "0") || 0;
      }
      summary.total_hours = Math.round(summary.total_hours * 10) / 10;
      return summary;
    }

    case "get_pending_leave_approvals": {
      requireHR();
      const { data, error } = await sb
        .from("leave_requests")
        .select("id, employee_name, type, start_date, end_date, days, applied_date")
        .eq("status", "Pending")
        .order("applied_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    }

    case "get_employees_on_leave": {
      requireHR();
      const onDate = args.on_date || new Date().toISOString().slice(0, 10);
      const { data, error } = await sb
        .from("leave_requests")
        .select("employee_name, type, start_date, end_date")
        .eq("status", "Approved")
        .lte("start_date", onDate)
        .gte("end_date", onDate);
      if (error) throw error;
      return { on_date: onDate, employees: data ?? [] };
    }

    case "count_employees_by_department": {
      requireHR();
      const { data, error } = await sb
        .from("employees")
        .select("department, status")
        .eq("status", "Active");
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const r of data ?? []) {
        counts[r.department] = (counts[r.department] ?? 0) + 1;
      }
      return Object.entries(counts)
        .map(([department, count]) => ({ department, count }))
        .sort((a, b) => b.count - a.count);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ---------------------------------------------------------------------------
// Gemini call helper
// ---------------------------------------------------------------------------
async function callGemini(
  apiKey: string,
  systemPrompt: string,
  contents: any[],
  tools: any[],
): Promise<any> {
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      tools: tools.length ? [{ functionDeclarations: tools }] : undefined,
      contents,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }
  return await res.json();
}

// ---------------------------------------------------------------------------
// HTTP handler
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("Server is missing GEMINI_API_KEY secret.");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !anonKey) throw new Error("Server is missing Supabase env.");

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing auth token." }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Per-user Supabase client → every query runs under the user's RLS context
    const sb = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await sb.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid session." }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    const authUser = userData.user;
    const email = authUser.email ?? "";
    const role =
      (authUser.user_metadata?.role as string | undefined) ||
      deriveRoleFromEmail(email);
    const displayName =
      (authUser.user_metadata?.name as string | undefined) || role;

    // Link auth user → employees row (by email, mirroring leaveService)
    let employeeId: string | null = null;
    {
      const { data: empRow } = await sb
        .from("employees")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      employeeId = (empRow as { id?: string } | null)?.id ?? null;
    }

    const ctx: UserContext = { authId: authUser.id, email, displayName, role, employeeId };

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : [];
    if (!messages.length) {
      return new Response(JSON.stringify({ error: "No messages provided." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const tools = toolsForRole(role);
    const systemPrompt = [
      `You are the HR assistant for this HRMS application.`,
      `Signed-in user: ${displayName} (email: ${email}, role: ${role}${employeeId ? `, employee_id: ${employeeId}` : ""}).`,
      `Today's date: ${new Date().toISOString().slice(0, 10)}.`,
      ``,
      `Rules:`,
      `- Stay focused on HR topics (leaves, attendance, payroll, profile, policies, approvals).`,
      `- For any factual question about this user or the company, ALWAYS call a tool — never invent numbers, dates or names.`,
      `- If a tool returns empty data, say so plainly.`,
      `- Refuse politely if asked for data outside the user's role (e.g. an Employee asking about another employee's salary).`,
      `- Keep replies short, friendly, and use bullet points when listing items.`,
    ].join("\n");

    // Gemini "contents" format: array of { role, parts }
    const contents: any[] = messages.map((m) => ({
      role: m.role === "model" ? "model" : "user",
      parts: [{ text: m.text }],
    }));

    // Tool-calling loop (max 4 rounds to keep request cheap)
    const MAX_ROUNDS = 4;
    let finalText = "";
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const result = await callGemini(apiKey, systemPrompt, contents, tools);
      const candidate = result?.candidates?.[0];
      const parts = candidate?.content?.parts ?? [];

      const functionCalls = parts.filter((p: any) => p.functionCall);
      if (functionCalls.length === 0) {
        finalText = parts
          .filter((p: any) => typeof p.text === "string")
          .map((p: any) => p.text)
          .join("")
          .trim();
        break;
      }

      // Append the model turn (with the functionCall parts) to the conversation
      contents.push({ role: "model", parts });

      // Execute each requested tool and append a function-response turn
      const responseParts: any[] = [];
      for (const part of functionCalls) {
        const { name, args } = part.functionCall;
        let response: any;
        try {
          response = await runTool(name, args ?? {}, ctx, sb);
        } catch (err: any) {
          response = { error: err?.message ?? String(err) };
        }
        responseParts.push({
          functionResponse: { name, response: { result: response } },
        });
      }
      contents.push({ role: "user", parts: responseParts });
    }

    if (!finalText) {
      finalText = "Sorry, I couldn't generate a response. Please try again.";
    }

    return new Response(JSON.stringify({ reply: finalText }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? "Internal error" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
