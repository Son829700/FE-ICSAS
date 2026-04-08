/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/auth/TwoStepVerificationForm.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import API from "../../api";
import toast from "react-hot-toast";

const OTP_LENGTH = 6;

interface Props {
  email: string; // truyền từ ForgotPassword page
  onBack: () => void;
}

export default function TwoStepVerificationForm({ email, onBack }: Props) {
  const navigate = useNavigate();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  /* OTP input handlers */
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp]; next[index] = digit; setOtp(next);
    setOtpError("");
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const n = [...otp]; n[index] = ""; setOtp(n);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const n = [...otp]; n[index - 1] = ""; setOtp(n);
      }
    } else if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((c, i) => { next[i] = c; });
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      await API.post("/users/send-otp", null, { params: { email } });
      setOtp(Array(OTP_LENGTH).fill(""));
      setCountdown(60); setCanResend(false); setOtpError("");
      inputRefs.current[0]?.focus();
      toast.success("New OTP sent to your email!");
    } catch {
      toast.error("Failed to resend OTP.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    let valid = true;
    if (otp.some((d) => !d)) {
      setOtpError("Please enter all 6 digits."); valid = false;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters."); valid = false;
    } else if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match."); valid = false;
    }
    if (!valid) return;

    setLoading(true);
    try {
      // Gọi 1 API duy nhất với cả 3 params
      await API.post("/users/reset-password", null, {
        params: {
          email,
          otp: otp.join(""),
          newPassword,
        },
      });
      toast.success("Password reset successfully!");
      navigate("/signin");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Invalid or expired OTP.";
      setOtpError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isComplete = otp.every((d) => d !== "") && newPassword.length >= 8 && newPassword === confirmPassword;

  return (
    <div className="flex flex-col flex-1 w-full lg:w-1/2">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        {/* Header */}
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Reset Password
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter the 6-digit code sent to{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>{" "}
            and your new password.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* OTP */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Verification Code <span className="text-error-500">*</span>
              </label>
              <div className="flex gap-2 sm:gap-3" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`h-11 w-full rounded-lg border text-center text-xl font-semibold text-gray-800 shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 transition ${
                      otpError
                        ? "border-error-300 focus:border-error-300 focus:ring-error-500/10 dark:border-error-700"
                        : digit
                          ? "border-brand-400 focus:border-brand-300 focus:ring-brand-500/10 dark:border-brand-600"
                          : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800"
                    }`}
                  />
                ))}
              </div>
              {otpError && <p className="mt-1.5 text-xs text-error-500">{otpError}</p>}

              {/* Resend */}
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Didn't receive the code?{" "}
                {canResend ? (
                  <button type="button" onClick={handleResend}
                    className="text-brand-500 hover:text-brand-600 dark:text-brand-400 font-medium">
                    Resend
                  </button>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500">
                    Resend in{" "}
                    <span className="font-medium tabular-nums text-gray-600 dark:text-gray-400">
                      {countdown}s
                    </span>
                  </span>
                )}
              </p>
            </div>

            {/* New Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                New Password <span className="text-error-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); }}
                  placeholder="Min. 8 characters"
                  className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 bg-transparent text-gray-800 transition ${
                    passwordError
                      ? "border-error-400 focus:border-error-400 focus:ring-error-500/20"
                      : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800"
                  }`}
                />
                <span onClick={() => setShowPassword(!showPassword)}
                  className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2">
                  {showPassword
                    ? <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    : <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />}
                </span>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Confirm New Password <span className="text-error-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); }}
                  placeholder="Re-enter new password"
                  className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 bg-transparent text-gray-800 transition ${
                    passwordError
                      ? "border-error-400 focus:border-error-400 focus:ring-error-500/20"
                      : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800"
                  }`}
                />
                <span onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2">
                  {showConfirm
                    ? <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    : <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />}
                </span>
              </div>
              {passwordError && <p className="mt-1.5 text-xs text-error-500">{passwordError}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !isComplete}
              className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Resetting...
                </span>
              ) : "Reset Password"}
            </button>

            {/* Back */}
            <button type="button" onClick={onBack}
              className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition">
              ← Back to enter email
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}