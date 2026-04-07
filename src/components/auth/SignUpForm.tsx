/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/auth/SignUpForm.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import API from "../../api";
import toast from "react-hot-toast";
import { buildSignupNotificationEmailBody } from "../../utils/Emailtemplates";


export default function SignUpForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [form, setForm] = useState({
    user_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.user_name.trim()) newErrors.user_name = "Username is required.";
    if (form.user_name.trim().length < 3)
      newErrors.user_name = "Username must be at least 3 characters.";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email) newErrors.email = "Email is required.";
    else if (!emailRegex.test(form.email))
      newErrors.email = "Please enter a valid email.";

    if (!form.password) newErrors.password = "Password is required.";
    else if (form.password.length < 8)
      newErrors.password = "Password must be at least 8 characters.";

    if (!form.confirmPassword)
      newErrors.confirmPassword = "Please confirm your password.";
    else if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match.";

    if (!agreed) newErrors.agreed = "You must accept the Terms of Service.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // 1. Tạo tài khoản customer (INACTIVE by default)
      await API.post("/users/custom", {
        user_name: form.user_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      // 2. Gửi email thông báo đang chờ duyệt
      try {
        await API.post("/email/send", {
          to: form.email.trim().toLowerCase(),
          subject: "ICSAS — Registration Received, Pending Review",
          body: buildSignupNotificationEmailBody({
            username: form.user_name.trim(),
            email: form.email.trim().toLowerCase(),
          }),
        });
      } catch {
        // email failure không block flow
      }

      toast.success(
        "Registration submitted! Check your email for confirmation.",
        { duration: 5000 },
      );
      navigate("/signin");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        "Registration failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-6 py-10">
        <div className="mb-6">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Create an Account
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Register to access the ICSAS Analytics Portal. Your account will be
            reviewed and activated by an administrator.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            {/* Username */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Username <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                name="user_name"
                value={form.user_name}
                onChange={handleChange}
                placeholder="Enter your username"
                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 transition ${
                  errors.user_name
                    ? "border-error-400 focus:border-error-400 focus:ring-error-500/20"
                    : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800"
                }`}
              />
              {errors.user_name && (
                <p className="mt-1 text-xs text-error-500">
                  {errors.user_name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Email <span className="text-error-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 bg-transparent text-gray-800 transition ${
                  errors.email
                    ? "border-error-400 focus:border-error-400 focus:ring-error-500/20"
                    : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800"
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-error-500">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Password <span className="text-error-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 bg-transparent text-gray-800 transition ${
                    errors.password
                      ? "border-error-400 focus:border-error-400 focus:ring-error-500/20"
                      : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? (
                    <EyeOffIcon className="size-5" />
                  ) : (
                    <EyeIcon className="size-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-error-500">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Confirm Password <span className="text-error-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 bg-transparent text-gray-800 transition ${
                    errors.confirmPassword
                      ? "border-error-400 focus:border-error-400 focus:ring-error-500/20"
                      : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showConfirm ? (
                    <EyeOffIcon className="size-5" />
                  ) : (
                    <EyeIcon className="size-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-error-500">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms checkbox */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => {
                    setAgreed(e.target.checked);
                    setErrors((prev) => ({ ...prev, agreed: "" }));
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20 dark:border-gray-700"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  By creating an account you agree to the{" "}
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    Terms and Conditions
                  </span>{" "}
                  and{" "}
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    Privacy Policy
                  </span>
                </span>
              </label>
              {errors.agreed && (
                <p className="mt-1 text-xs text-error-500">{errors.agreed}</p>
              )}
            </div>

        

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin size-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </div>
        </form>

        <div className="mt-5">
          <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
            Already have an account?{" "}
            <Link
              to="/signin"
              className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
