import { useEffect, useRef } from "react";
import API from "../api";

/**
 * Coverage:
 * Navigate sang route khác        → useEffect cleanup
 * Chuyển tab / minimize window    → visibilitychange hidden
 * Đóng tab desktop                → beforeunload
 * Thoát app mobile (iOS/Android)  → pagehide (reliable trên mobile)
 * Quay lại tab/app                → visibilitychange visible → session mới
 */
export function useDashboardLogger(dashboardId: string | undefined) {
  const logIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const flushedRef = useRef(false);
  const lastHiddenRef = useRef<number>(0);
  function flush() {
    const logId = logIdRef.current;
    if (!logId || flushedRef.current) return;

    flushedRef.current = true;
    logIdRef.current = null;

    const duration = Math.max(
      1,
      Math.floor((Date.now() - startTimeRef.current) / 1000),
    );
    const device = getDeviceType();
    const token = localStorage.getItem("token");
    const base = import.meta.env.VITE_API_URL as string;

    const url = `${base}/dashboard-usage-logs/${logId}/update/duration/${duration}/device/${device}`;

    try {
      const payload = JSON.stringify({ token });

      const ok = navigator.sendBeacon(url, payload);

      if (!ok) {
        fetch(url, {
          method: "POST",
          keepalive: true,
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }).catch(() => { });
      }
    } catch {
      // fallback cuối
    }
  }

  async function createLog(id: string) {
    flushedRef.current = false;

    try {
      const res = await API.post(`/dashboard-usage-logs/dashboardID/${id}`);
      const logId = res.data?.data?.log_id;

      if (!logId) return;

      logIdRef.current = logId;
      startTimeRef.current = Date.now();
    } catch (err) {
      console.error("[DashboardLogger] Failed to create log:", err);
    }
  }

  useEffect(() => {
    if (!dashboardId) return;

    createLog(dashboardId);

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        lastHiddenRef.current = Date.now();
        flush();
      } else if (document.visibilityState === "visible") {
        const now = Date.now();

        // chỉ tạo session mới nếu rời > 3s
        if (now - lastHiddenRef.current > 3000) {
          createLog(dashboardId);
        }
      }
    };

    const handleBeforeUnload = () => flush();
    const handlePageHide = () => flush();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      flush();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [dashboardId]);
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return "Mobile";
  if (/Tablet|iPad/i.test(ua)) return "Tablet";
  return "Desktop";
}
