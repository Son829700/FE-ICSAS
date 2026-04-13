/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import API from "../../api";
import toast from "react-hot-toast";
import VerifySignupOTPForm from "./VerifySignupOTPForm";

export default function SignUpForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);

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

    if (!form.user_name.trim())
      newErrors.user_name = "Username is required.";
    else if (form.user_name.trim().length < 3)
      newErrors.user_name = "Username must be at least 3 characters.";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email)
      newErrors.email = "Email is required.";
    else if (!emailRegex.test(form.email))
      newErrors.email = "Please enter a valid email.";

    if (!form.password)
      newErrors.password = "Password is required.";
    else if (form.password.length < 8)
      newErrors.password = "Password must be at least 8 characters.";

    if (!form.confirmPassword)
      newErrors.confirmPassword = "Please confirm your password.";
    else if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // 1. Send OTP instead of creating account directly
      await API.post("/users/generate-registration-otp", null, {
        params: { email: form.email.trim().toLowerCase() }
      });
      toast.success("OTP sent to your email!");
      setShowOtpForm(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to send OTP. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (showOtpForm) {
    return (
      <VerifySignupOTPForm
        formData={form}
        onBack={() => setShowOtpForm(false)}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign Up
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Register to access the ICSAS Analytics Portal.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Username */}
              <div>
                <Label>
                  Username <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  name="user_name"
                  placeholder="Enter your username"
                  value={form.user_name}
                  onChange={handleChange}
                />
                {errors.user_name && (
                  <p className="mt-1.5 text-xs text-error-500">{errors.user_name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <Label>
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-error-500">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <Label>
                  Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
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
                {errors.password && (
                  <p className="mt-1.5 text-xs text-error-500">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <Label>
                  Confirm Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                  />
                  <span
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showConfirm ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )}
                  </span>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-error-500">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit */}
              <div>
                <Button className="w-full" size="sm" disabled={loading}>
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
              </div>
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
    </div>
  );
}