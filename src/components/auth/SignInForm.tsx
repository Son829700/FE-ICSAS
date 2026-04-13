import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api";
import { useAuthContext } from "../../context/AuthContext";

import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import { Building2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

/* =======================
   TYPES
======================= */
export interface UserResponse {
  user_id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  department: Department | null;
  status: string;
}

export interface Department {
  department_id: string;
  department_name: string;
  manager: UserResponse;
  status: string;
  department_type: "INTERNAL" | "EXTERNAL";
}

/* =======================
   COMPONENT
======================= */
export default function SignInForm() {
  const API_GOOGLE_LOGIN_URL = "/oauth2/authorization/google";
  const [showPassword, setShowPassword] = useState(false);
  const { login, authLoading } = useAuthContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Shared state
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);

  // ── Modal: chọn department (STAFF / BI – chỉ INTERNAL) ──
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [loadingDepartment, setLoadingDepartment] = useState(false);



  /* =====================
     GOOGLE LOGIN
  ===================== */
  const handleGoogleLogin = () => {
    window.location.href = API_GOOGLE_LOGIN_URL;
  };

  /* =====================
     SIGN IN
  ===================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      if (!user) return;

      setCurrentUser(user);

      if (!user.department && user.role === "STAFF") {
        setShowDepartmentModal(true);
      } else {
        navigate("/");
      }
    } catch (err) {
      console.log(err);
    }
  };

  /* =====================
     DEPARTMENT MODAL (STAFF/BI)
  ===================== */
  useEffect(() => {
    if (showDepartmentModal) fetchInternalDepartments();
  }, [showDepartmentModal]);

  const fetchInternalDepartments = async () => {
    try {
      const res = await API.get("/departments");
      const all: Department[] = res.data.data ?? [];
      // Chỉ lấy department INTERNAL và ACTIVE
      setDepartments(
        all.filter((d) => d.department_type === "INTERNAL" && d.status === "ACTIVE")
      );
    } catch (err) {
      console.error("Fetch departments failed", err);
    }
  };

  const handleConfirmDepartment = async () => {
    if (!selectedDepartment || !currentUser) return;
    try {
      setLoadingDepartment(true);
      await API.put(`/users/${currentUser.user_id}/department/${selectedDepartment}`);
      setShowDepartmentModal(false);
      navigate("/");
    } catch (err) {
      console.error("Update department failed", err);
      toast.error("Failed to update department. Please try again.");
    } finally {
      setLoadingDepartment(false);
    }
  };



  /* =====================
     RENDER
  ===================== */
  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sign in with your FPT account!
            </p>
          </div>

          <div>
            {/* Google Button */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-1 sm:gap-5">
              <button
                onClick={handleGoogleLogin}
                className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M18.7511 10.1944C18.7511 9.47495 18.6915 8.94995 18.5626 8.40552H10.1797V11.6527H15.1003C15.0011 12.4597 14.4654 13.675 13.2749 14.4916L13.2582 14.6003L15.9087 16.6126L16.0924 16.6305C17.7788 15.1041 18.7511 12.8583 18.7511 10.1944Z" fill="#4285F4" />
                  <path d="M10.1788 18.75C12.5895 18.75 14.6133 17.9722 16.0915 16.6305L13.274 14.4916C12.5201 15.0068 11.5081 15.3666 10.1788 15.3666C7.81773 15.3666 5.81379 13.8402 5.09944 11.7305L4.99473 11.7392L2.23868 13.8295L2.20264 13.9277C3.67087 16.786 6.68674 18.75 10.1788 18.75Z" fill="#34A853" />
                  <path d="M5.10014 11.7305C4.91165 11.186 4.80257 10.6027 4.80257 9.99992C4.80257 9.3971 4.91165 8.81379 5.09022 8.26935L5.08523 8.1534L2.29464 6.02954L2.20333 6.0721C1.5982 7.25823 1.25098 8.5902 1.25098 9.99992C1.25098 11.4096 1.5982 12.7415 2.20333 13.9277L5.10014 11.7305Z" fill="#FBBC05" />
                  <path d="M10.1789 4.63331C11.8554 4.63331 12.9864 5.34303 13.6312 5.93612L16.1511 3.525C14.6035 2.11528 12.5895 1.25 10.1789 1.25C6.68676 1.25 3.67088 3.21387 2.20264 6.07218L5.08953 8.26943C5.81381 6.15972 7.81776 4.63331 10.1789 4.63331Z" fill="#EB4335" />
                </svg>
                Sign in with Google (FPT account)
              </button>
            </div>

            <div className="relative py-3 sm:py-5" />

            {/* Email / Password Form */}
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label>Email <span className="text-error-500">*</span></Label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Password <span className="text-error-500">*</span></Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <Link
                    to="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div>
                  <Button className="w-full" size="sm" disabled={authLoading}>
                    {authLoading ? "Signing in..." : "Sign in"}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                For external sellers or business accounts,{" "}
                <Link to="/signup" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                  sign up here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>



      {/* =============================================
          MODAL 2: STAFF/BI → Chọn INTERNAL department
      ============================================= */}
      <Modal
        isOpen={showDepartmentModal}
        onClose={() => { }}
        showCloseButton={false}
        className="max-w-md p-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
            <Building2 className="size-5 text-brand-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Select Your Department
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You must select a department to continue
            </p>
          </div>
        </div>

        {/* Department select */}
        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Department <span className="text-error-500">*</span>
          </label>
          {departments.length === 0 ? (
            <div className="flex h-11 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-800">
              <Loader2 className="size-4 animate-spin mr-2" />
              Loading departments...
            </div>
          ) : (
            <select
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="">— Select a department —</option>
              {departments.map((dep) => (
                <option key={dep.department_id} value={dep.department_id}>
                  {dep.department_name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Confirm button */}
        <Button
          className="w-full"
          size="md"
          variant="primary"
          onClick={handleConfirmDepartment}
          disabled={!selectedDepartment || loadingDepartment}
        >
          {loadingDepartment ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </span>
          ) : (
            "Confirm Department"
          )}
        </Button>
      </Modal>
    </div>
  );
}