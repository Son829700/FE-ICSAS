import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import API from "../../api";
import toast from "react-hot-toast";

interface JwtPayload {
  sub: string;
  exp?: number;
  iat?: number;
}

interface Department {
  department_id: string;
  department_name: string;
  status: string;
}

export default function OAuth2RedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchUser } = useAuthContext();

  const [showModal, setShowModal] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("appToken");
    const googleToken = params.get("googleToken");

    if (!token) {
      console.error("No access token found in URL!");
      navigate("/signin?error=oauth2");
      return;
    }

    try {
      sessionStorage.setItem("token", token);
      if (googleToken) sessionStorage.setItem("googleToken", googleToken);

      const decoded = jwtDecode<JwtPayload>(token);
      if (decoded?.sub) sessionStorage.setItem("username", decoded.sub);

      fetchUser().then(async (user) => {
        if (!user) return;

        setUserName(user.username);

        if (!user.department) {
          try {
            setLoadingDepts(true);

            // Check xem đã có ticket chưa
            const ticketRes = await API.get(
              `/tickets/requester/${user.user_id}`,
            );
            const tickets = ticketRes.data.data ?? [];

            if (tickets.length > 0) {
              // Đã submit ticket rồi → vào /ticket chờ admin duyệt
              toast("Your request is pending Admin approval.", {
                icon: "⏳",
                duration: 5000,
              });
              navigate("/ticket");
              return;
            }

            // Chưa có ticket → fetch departments và hiện modal
            const deptRes = await API.get("/departments");
            const activeDepts: Department[] = (deptRes.data.data ?? []).filter(
              (d: Department) => d.status === "ACTIVE",
            );
            setDepartments(activeDepts);
            setDescription(
              `Hi, I am ${user.username}. I would like to request access to the system. Please assign me the appropriate role and department.`,
            );
            setShowModal(true);
          } catch (err) {
            console.error("Onboarding check failed:", err);
            setShowModal(true); // fallback: vẫn cho tạo ticket nếu lỗi
          } finally {
            setLoadingDepts(false);
          }
        } else {
          toast.success("Login successfully!");
          navigate("/");
        }
      });
    } catch (error) {
      console.error("Decode token failed:", error);
      navigate("/signin?error=invalid_token");
    }
  }, [location, navigate, fetchUser]);

  const handleSubmit = async () => {
    if (!selectedDept || !description.trim()) return;

    const dept = departments.find((d) => d.department_id === selectedDept);

    try {
      setSubmitting(true);

      await API.post("/tickets/ticket_type2", {
        type: "TYPE2",
        description: `${description.trim()}\n\nRequested Department: ${dept?.department_name ?? selectedDept}`,
      });

      toast.success("Request submitted! Admin will review your request.", {
        duration: 5000,
      });

      navigate("/ticket");
    } catch (err) {
      console.error("Submit ticket failed:", err);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* Loading screen */
  if (!showModal) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Processing Google login...
          </p>
        </div>
      </div>
    );
  }

  /* Modal bắt buộc — không cho skip */
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/20">
              <svg
                className="size-5 text-brand-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-800 dark:text-white">
                Complete Your Registration
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Welcome{userName ? `, ${userName}` : ""}! Please complete your
                profile to continue.
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Department */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Requested Department <span className="text-red-500">*</span>
            </label>
            {loadingDepts ? (
              <div className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 px-3 dark:border-gray-700">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                <span className="text-sm text-gray-400">
                  Loading departments...
                </span>
              </div>
            ) : (
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                <option value="">Select your department</option>
                {departments.map((d) => (
                  <option key={d.department_id} value={d.department_id}>
                    {d.department_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Request Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe your request..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 resize-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            />
            <p className="mt-1 text-xs text-gray-400">
              You can edit the description above before submitting.
            </p>
          </div>

          {/* Info */}
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-900/40 dark:bg-blue-900/10">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Admin will review your request and assign the appropriate role and
              department. You will be notified via the ticket system.
            </p>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!selectedDept || !description.trim() || submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition"
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </button>

          <p className="text-center text-xs text-gray-400">
            You must complete this step to access the system.
          </p>
        </div>
      </div>
    </div>
  );
}
