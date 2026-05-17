import fs from "fs";
import { createClient } from "@supabase/supabase-js";

function parseEnv(content) {
  const out = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^"|"$/g, "");
    out[key] = value;
  }
  return out;
}

const envRaw = fs.readFileSync(".env", "utf8");
const env = parseEnv(envRaw);
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const bdNames = [
  "Tanvir Ahmed",
  "Nusrat Jahan",
  "Mehedi Hasan",
  "Farzana Akter",
  "Siam Rahman",
  "Tasnim Chowdhury",
  "Rafiul Islam",
  "Mim Sultana",
  "Sabbir Hossain",
  "Sharmin Akter",
  "Arif Mahmud",
  "Nabila Yasmin",
  "Sakib Al Hasan",
  "Tanjina Rahman",
  "Raihan Karim",
  "Jannatul Ferdous",
  "Shuvo Das",
  "Ayesha Siddika",
  "Imran Hossain",
  "Mariam Khatun",
];

const bdAreas = [
  "Dhanmondi, Dhaka",
  "Uttara, Dhaka",
  "Mirpur, Dhaka",
  "Banani, Dhaka",
  "Mohammadpur, Dhaka",
  "Chattogram",
  "Khulna",
  "Rajshahi",
  "Sylhet",
  "Barishal",
];

const { data: employees, error: employeeFetchError } = await supabase
  .from("employees")
  .select("*")
  .order("id");

if (employeeFetchError) throw employeeFetchError;
if (!employees || employees.length === 0) {
  console.log("No employees found.");
  process.exit(0);
}

for (let i = 0; i < employees.length; i += 1) {
  const employee = employees[i];
  const name = bdNames[i % bdNames.length];
  const [firstName, lastName = "hr"] = name.split(" ");
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@banglahr.com.bd`;
  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0ea5e9&color=fff&size=150`;
  const address = `${bdAreas[i % bdAreas.length]}, Bangladesh`;
  const phone = `+880 17${String(10000000 + i).slice(0, 8)}`;
  const emergencyContact = `+880 18${String(20000000 + i).slice(0, 8)}`;

  const { error: employeeUpdateError } = await supabase
    .from("employees")
    .update({
      name,
      email,
      avatar,
      address,
      phone,
      emergency_contact: emergencyContact,
    })
    .eq("id", employee.id);
  if (employeeUpdateError) throw employeeUpdateError;

  const { error: leaveError } = await supabase
    .from("leave_requests")
    .update({ employee_name: name })
    .eq("employee_id", employee.id);
  if (leaveError) {
    console.log(`Leave sync warning for ${employee.id}: ${leaveError.message}`);
  }

  const { error: payrollError } = await supabase
    .from("payroll")
    .update({ employee_name: name })
    .eq("employee_id", employee.id);
  if (payrollError) {
    console.log(`Payroll sync warning for ${employee.id}: ${payrollError.message}`);
  }
}

console.log(`Localized ${employees.length} employee records to Bangladeshi profiles.`);
