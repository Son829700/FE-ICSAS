/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import API from "../../api";
import toast from "react-hot-toast";

type Step = "email" | "reset" | "success";
const OTP_LENGTH = 6;

export default function ForgotPasswordForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(() => (sessionStorage.getItem("fw_step") as Step) || "email");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(() => sessionStorage.getItem("fw_email") || "");

  // OTP
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [otpError, setOtpError] = useState("");
  const [countdown, setCountdown] = useState(() => {
    const saved = sessionStorage.getItem("fw_countdown_end");
    if (saved) {
      const remaining = Math.floor((parseInt(saved) - Date.now()) / 1000);
      return remaining > 0 ? remaining : 0;
    }
    return 60;
  });
  const [canResend, setCanResend] = useState(() => {
    const saved = sessionStorage.getItem("fw_countdown_end");
    if (saved) {
      return parseInt(saved) <= Date.now();
    }
    return false;
  });
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Email step error
  const [emailError, setEmailError] = useState("");

  /* Countdown */
  useEffect(() => {
    if (step !== "reset") return;
    if (countdown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, step]);

  /* ── Step 1: Send OTP ── */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true); setEmailError("");
    try {
      await API.post("/users/send-otp", null, { params: { email: email.trim() } });
      setCountdown(60); setCanResend(false);
      setStep("reset");
      sessionStorage.setItem("fw_step", "reset");
      sessionStorage.setItem("fw_email", email.trim());
      sessionStorage.setItem("fw_countdown_end", (Date.now() + 60000).toString());
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      toast.success("OTP sent to your email!");
    } catch (err: any) {
      setEmailError(err?.response?.data?.message ?? "Email not found or failed to send OTP.");
    } finally { setLoading(false); }
  };

  /* ── OTP input handlers ── */
  const handleOtpChange = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    const n = [...otp]; n[i] = d; setOtp(n); setOtpError("");
    if (d && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (otp[i]) { const n = [...otp]; n[i] = ""; setOtp(n); }
      else if (i > 0) { inputRefs.current[i - 1]?.focus(); const n = [...otp]; n[i - 1] = ""; setOtp(n); }
    } else if (e.key === "ArrowLeft" && i > 0) inputRefs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!p) return;
    const n = Array(OTP_LENGTH).fill("");
    p.split("").forEach((c, i) => { n[i] = c; });
    setOtp(n);
    inputRefs.current[Math.min(p.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleResend = async () => {
    if (!canResend) return;
    setLoading(true);
    try {
      await API.post("/users/send-otp", null, { params: { email: email.trim() } });
      setOtp(Array(OTP_LENGTH).fill(""));
      setCountdown(60); setCanResend(false); setOtpError("");
      sessionStorage.setItem("fw_countdown_end", (Date.now() + 60000).toString());
      inputRefs.current[0]?.focus();
      toast.success("New OTP sent!");
    } catch { toast.error("Failed to resend OTP."); }
    finally { setLoading(false); }
  };

  /* ── Step 2: Reset password (OTP + new password cùng 1 API) ── */
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;

    if (otp.some((d) => !d)) { setOtpError("Please enter all 6 digits."); valid = false; }
    if (newPassword.length < 8) { setPasswordError("Password must be at least 8 characters."); valid = false; }
    else if (newPassword !== confirmPassword) { setPasswordError("Passwords do not match."); valid = false; }

    if (!valid) return;

    setLoading(true);
    try {
      await API.post("/users/reset-password", null, {
        params: { email: email.trim(), otp: otp.join(""), newPassword },
      });
      setStep("success");
      sessionStorage.removeItem("fw_step");
      sessionStorage.removeItem("fw_email");
      sessionStorage.removeItem("fw_countdown_end");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Invalid or expired OTP.";
      setOtpError(msg);
    } finally { setLoading(false); }
  };

  const Spinner = () => (
    <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );

  const BackChevron = () => (
    <svg className="stroke-current" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M12.7083 5L7.5 10.2083L12.7083 15.4167" stroke="" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div className="flex flex-col flex-1 w-full lg:w-1/2">
      {/* Back to sign in */}
      <div className="w-full max-w-md pt-10 mx-auto min-h-[64px]">
        {step === "email" ? (
          <Link
            to="/signin"
            className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <BackChevron /> Back to sign in
          </Link>
        ) : step === "reset" ? (
          <button
            onClick={() => { setStep("email"); sessionStorage.setItem("fw_step", "email"); }}
            className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <BackChevron /> Back to email
          </button>
        ) : null}
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">

        {/* ── STEP 1: EMAIL ── */}
        {step === "email" && (
          <>
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Forgot Your Password?
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter your registered email and we'll send you a verification code.
              </p>
            </div>

            <form onSubmit={handleSendOtp}>
              <div className="space-y-6">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Email <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                    placeholder="Enter your email"
                    required
                    className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 bg-transparent text-gray-800 transition ${emailError
                        ? "border-error-400 focus:border-error-400 focus:ring-error-500/20"
                        : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800"
                      }`}
                  />
                  {emailError && <p className="mt-1.5 text-xs text-error-500">{emailError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading
                    ? <span className="flex items-center gap-2"><Spinner />Sending...</span>
                    : "Send Verification Code"}
                </button>

                {sessionStorage.getItem("fw_email") === email.trim() && email.trim() !== "" && (
                  <button
                    type="button"
                    onClick={() => { setStep("reset"); sessionStorage.setItem("fw_step", "reset"); }}
                    className="flex justify-center items-center w-full px-4 py-3 text-sm font-medium transition rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    I already have an OTP
                  </button>
                )}
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Wait, I remember my password...{" "}
                <Link to="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                  Click here
                </Link>
              </p>
            </div>
          </>
        )}

        {/* ── STEP 2: OTP + NEW PASSWORD (gộp, 1 API call) ── */}
        {step === "reset" && (
          <>
            <div className="mb-5 sm:mb-8">

              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Reset Password
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter the code sent to{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>{" "}
                and your new password.
              </p>
            </div>

            <form onSubmit={handleReset}>
              <div className="space-y-6">
                {/* OTP inputs */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Verification Code <span className="text-error-500">*</span>
                  </label>
                  <div className="flex gap-2 sm:gap-3" onPaste={handlePaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        className={`h-11 w-full rounded-lg border text-center text-xl font-semibold text-gray-800 shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 transition ${otpError
                            ? "border-error-300 focus:border-error-300 focus:ring-error-500/10 dark:border-error-700"
                            : digit
                              ? "border-brand-400 focus:border-brand-300 focus:ring-brand-500/10 dark:border-brand-600"
                              : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800"
                          }`}
                      />
                    ))}
                  </div>
                  {otpError && <p className="mt-1.5 text-xs text-error-500">{otpError}</p>}
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Didn't receive the code?{" "}
                    {canResend ? (
                      <button type="button" onClick={handleResend} disabled={loading}
                        className="text-brand-500 hover:text-brand-600 dark:text-brand-400 font-medium">
                        Resend
                      </button>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">
                        Resend in{" "}
                        <span className="tabular-nums font-medium text-gray-600 dark:text-gray-400">{countdown}s</span>
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
                      type={showPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); }}
                      placeholder="Min. 8 characters"
                      className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 bg-transparent text-gray-800 transition ${passwordError
                          ? "border-error-400 focus:border-error-400 focus:ring-error-500/20"
                          : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800"
                        }`}
                    />
                    <span
                      onClick={() => setShowPw(!showPw)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPw
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
                      className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 bg-transparent text-gray-800 transition ${passwordError
                          ? "border-error-400 focus:border-error-400 focus:ring-error-500/20"
                          : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800"
                        }`}
                    />
                    <span
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showConfirm
                        ? <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        : <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />}
                    </span>
                  </div>
                  {passwordError && <p className="mt-1.5 text-xs text-error-500">{passwordError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading
                    ? <span className="flex items-center gap-2"><Spinner />Resetting...</span>
                    : "Reset Password"}
                </button>
              </div>
            </form>
          </>
        )}

        {/* ── STEP 3: SUCCESS ── */}
        {step === "success" && (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-success-50 dark:bg-success-500/10">
              <svg className="size-8 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
              Password Reset Successfully
            </h2>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Your password has been updated. You can now sign in with your new password.
            </p>
            <button
              onClick={() => navigate("/signin")}
              className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white rounded-lg bg-brand-500 hover:bg-brand-600 transition"
            >
              Go to Sign In
            </button>
          </div>
        )}

      </div>
    </div>
  );
}