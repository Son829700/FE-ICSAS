/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/auth/ForgotPasswordForm.tsx
// 4-step flow: email → OTP → new password → success
// APIs: POST /users/send-otp, POST /users/reset-password
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EyeIcon, EyeOffIcon, ArrowLeftIcon } from "lucide-react";
import API from "../../api";
import toast from "react-hot-toast";

type Step = "email" | "otp" | "reset" | "success";
const OTP_LENGTH = 6;

export default function ForgotPasswordForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step !== "otp") return;
    if (countdown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, step]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true); setError("");
    try {
      await API.post(`/users/send-otp`, null, { params: { email: email.trim() } });
      setCountdown(60); setCanResend(false);
      setStep("otp");
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      toast.success("OTP sent to your email!");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Email not found or failed to send OTP.");
    } finally { setLoading(false); }
  };

  const handleOtpChange = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    const n = [...otp]; n[i] = d; setOtp(n); setError("");
    if (d && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (otp[i]) { const n = [...otp]; n[i] = ""; setOtp(n); }
      else if (i > 0) { inputRefs.current[i - 1]?.focus(); const n = [...otp]; n[i - 1] = ""; setOtp(n); }
    } else if (e.key === "ArrowLeft" && i > 0) inputRefs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!p) return;
    const n = Array(OTP_LENGTH).fill(""); p.split("").forEach((c, i) => { n[i] = c; }); setOtp(n);
    inputRefs.current[Math.min(p.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleResend = async () => {
    if (!canResend) return;
    setLoading(true);
    try {
      await API.post(`/users/send-otp`, null, { params: { email: email.trim() } });
      setOtp(Array(OTP_LENGTH).fill("")); setCountdown(60); setCanResend(false); setError("");
      inputRefs.current[0]?.focus(); toast.success("New OTP sent!");
    } catch { toast.error("Failed to resend OTP."); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = () => {
    if (otp.some((d) => !d)) { setError("Please enter all 6 digits."); return; }
    setError(""); setStep("reset");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await API.post(`/users/reset-password`, null, {
        params: { email: email.trim(), otp: otp.join(""), newPassword },
      });
      setStep("success");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Invalid or expired OTP. Please try again.");
    } finally { setLoading(false); }
  };

  const inputCls = (hasError?: boolean) =>
    `h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 bg-transparent text-gray-800 transition ${hasError ? "border-error-400 focus:border-error-400 focus:ring-error-500/20" : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800"}`;

  const BackChevron = () => (
    <svg className="stroke-current" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M12.7083 5L7.5 10.2083L12.7083 15.4167" stroke="" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const Spinner = () => (
    <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  );

  return (
    <div className="flex flex-col flex-1 w-full lg:w-1/2">
      <div className="w-full max-w-md pt-10 mx-auto px-6">
        <Link to="/signin" className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
          <BackChevron /> Back to sign in
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-6">

        {/* STEP 1: EMAIL */}
        {step === "email" && (
          <>
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Forgot Your Password?</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Enter your registered email and we'll send you a verification code.</p>
            </div>
            <form onSubmit={handleSendOtp}>
              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Email <span className="text-error-500">*</span></label>
                  <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder="Enter your email" required className={inputCls(!!error)} />
                  {error && <p className="mt-1.5 text-xs text-error-500">{error}</p>}
                </div>
                <button type="submit" disabled={loading || !email.trim()} className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? <span className="flex items-center gap-2"><Spinner />Sending...</span> : "Send Verification Code"}
                </button>
              </div>
            </form>
            <div className="mt-5">
              <p className="text-sm text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Remember your password?{" "}
                <Link to="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">Sign in</Link>
              </p>
            </div>
          </>
        )}

        {/* STEP 2: OTP */}
        {step === "otp" && (
          <>
            <div className="mb-5 sm:mb-8">
              <button onClick={() => setStep("email")} className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 transition">
                <ArrowLeftIcon className="size-4" /> Change email
              </button>
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Enter Verification Code</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                We sent a 6-digit code to <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>
              </p>
            </div>
            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">6-digit verification code</label>
                <div className="flex gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input key={i} ref={(el) => { inputRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`h-12 w-full rounded-lg border text-center text-xl font-semibold text-gray-800 shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 transition ${error ? "border-error-300 focus:border-error-300 focus:ring-error-500/10" : digit ? "border-brand-400 focus:border-brand-300 focus:ring-brand-500/10 dark:border-brand-600" : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700"}`}
                    />
                  ))}
                </div>
                {error && <p className="mt-1.5 text-xs text-error-500">{error}</p>}
              </div>
              <button onClick={handleVerifyOtp} disabled={otp.some((d) => !d)}
                className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed">
                Verify Code
              </button>
              <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                Didn't receive the code?{" "}
                {canResend ? (
                  <button onClick={handleResend} disabled={loading} className="text-brand-500 hover:text-brand-600 font-medium">Resend</button>
                ) : (
                  <span className="text-gray-400">Resend in <span className="tabular-nums font-medium text-gray-600 dark:text-gray-400">{countdown}s</span></span>
                )}
              </p>
            </div>
          </>
        )}

        {/* STEP 3: NEW PASSWORD */}
        {step === "reset" && (
          <>
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Set New Password</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Create a strong new password for your account.</p>
            </div>
            <form onSubmit={handleResetPassword}>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">New Password <span className="text-error-500">*</span></label>
                  <div className="relative">
                    <input type={showPw ? "text" : "password"} value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setError(""); }} placeholder="Min. 8 characters" className={inputCls() + " pr-11"} />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                      {showPw ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Confirm New Password <span className="text-error-500">*</span></label>
                  <div className="relative">
                    <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }} placeholder="Re-enter new password" className={inputCls() + " pr-11"} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                      {showConfirm ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-xs text-error-500">{error}</p>}
                <button type="submit" disabled={loading || !newPassword || !confirmPassword}
                  className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? <span className="flex items-center gap-2"><Spinner />Resetting...</span> : "Reset Password"}
                </button>
              </div>
            </form>
          </>
        )}

        {/* STEP 4: SUCCESS */}
        {step === "success" && (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-success-50 dark:bg-success-500/10">
              <svg className="size-8 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">Password Reset Successfully</h2>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Your password has been updated. You can now sign in with your new password.</p>
            <button onClick={() => navigate("/signin")} className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white rounded-lg bg-brand-500 hover:bg-brand-600 transition">
              Go to Sign In
            </button>
          </div>
        )}

      </div>
    </div>
  );
}