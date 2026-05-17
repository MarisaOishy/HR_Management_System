import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";
import { PhoneInput } from "../../components/PhoneInput";
import { getEmployeeById, replaceAvatar, updateEmployee, validateAvatarFile } from "../../../lib/services/employeeService";
import { inferPhoneCountry, toInternationalPhone } from "../../../lib/phone";
import type { Employee } from "../../../lib/types/database";
import { toast } from "sonner";

export default function EmployeeEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [salary, setSalary] = useState("");
  const [status, setStatus] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await getEmployeeById(id);
        setEmployee(data);
        setName(data.name); setEmail(data.email); setPhone(data.phone);
        setDob(data.date_of_birth); setAddress(data.address);
        setJoinDate(data.join_date); setDepartment(data.department.toLowerCase());
        setRole(data.role); setSalary(String(data.salary));
        setStatus(data.status.toLowerCase()); setEmergencyContact(data.emergency_contact);
        setAvatarPreview(data.avatar || null);
      } catch (error: any) {
        toast.error("Employee not found");
        navigate("/employees");
      } finally { setLoading(false); }
    })();
  }, [id]);

  const deptMap: Record<string, string> = {
    engineering: "Engineering", product: "Product", design: "Design",
    marketing: "Marketing", sales: "Sales", "human resources": "Human Resources",
  };
  const statusMap: Record<string, string> = { active: "Active", "on leave": "On Leave", inactive: "Inactive" };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateAvatarFile(file);
    if (validationError) {
      toast.error(validationError);
      e.target.value = "";
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.onerror = () => toast.error("Could not preview the selected image.");
    reader.readAsDataURL(file);
  };

  const clearSelectedAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(employee?.avatar || null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      const normalizedPhone = toInternationalPhone(phone, inferPhoneCountry(phone));
      const normalizedEmergencyContact = emergencyContact
        ? toInternationalPhone(emergencyContact, inferPhoneCountry(emergencyContact))
        : "";

      let avatarUrl: string | undefined;
      if (avatarFile) {
        avatarUrl = await replaceAvatar(avatarFile, id, employee?.avatar);
      }

      await updateEmployee(id, {
        name, email, phone: normalizedPhone, date_of_birth: dob, address, join_date: joinDate,
        department: deptMap[department] || department,
        role, salary: Number(salary),
        status: statusMap[status] || status,
        emergency_contact: normalizedEmergencyContact,
        ...(avatarUrl ? { avatar: avatarUrl } : {}),
      });
      toast.success("Employee updated successfully!");
      navigate("/employees");
    } catch (error: any) {
      toast.error("Failed to update: " + error.message);
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-500">Loading employee...</span>
      </div>
    );
  }
  if (!employee) return <div>Employee not found</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link to="/employees" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to employees
        </Link>
        <h1 className="text-3xl font-semibold text-gray-900">Edit Employee</h1>
        <p className="text-gray-600 mt-1">Update employee information</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-4 mb-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <div className="relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={avatarFile ? "New employee photo preview" : employee.name}
                    className="w-24 h-24 rounded-full object-cover border-2 border-blue-400"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=3b82f6&color=fff`; }}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                {avatarFile && (
                  <button
                    type="button"
                    onClick={clearSelectedAvatar}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                    title="Remove selected photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                Change Photo
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PhoneInput id="phone" label="Phone" value={phone} onChange={setPhone} required />
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Employment Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employee ID</Label>
                <Input value={employee.id} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="joinDate">Join Date</Label>
                <Input id="joinDate" type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department *</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="human resources">Human Resources</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary">Salary *</Label>
                <Input id="salary" type="number" value={salary} onChange={(e) => setSalary(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on leave">On Leave</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Emergency Contact</CardTitle></CardHeader>
          <CardContent>
            <PhoneInput id="emergencyContact" label="Contact Phone" value={emergencyContact} onChange={setEmergencyContact} />
          </CardContent>
        </Card>
        <div className="flex gap-4">
          <Button type="submit" size="lg" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" size="lg" asChild>
            <Link to="/employees">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
