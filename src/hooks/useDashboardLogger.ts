import { useEffect, useRef } from "react";
import API from "../api";

export function useDashboardLogger(dashboardId: string | undefined) {
  const logIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!dashboardId) return;

    startTimeRef.current = Date.now();
    logIdRef.current = null;

    // Ghi log khi bắt đầu xem
    const createLog = async () => {
      try {
        const res = await API.post(
          `/dashboard-usage-logs/dashboardID/${dashboardId}`,
        );
        const logId = res.data?.data?.log_id;
        if (logId) {
          logIdRef.current = logId;
        }
      } catch (err) {
        console.error("[DashboardLogger] Failed to create log:", err);
      }
    };

    createLog();

    // Cleanup: ghi duration khi rời trang
    return () => {
      const logId = logIdRef.current;
      if (!logId) return;

      const durationSeconds = Math.max(
        1,
        Math.floor((Date.now() - startTimeRef.current) / 1000),
      );
      const deviceType = getDeviceType();
      const token = localStorage.getItem("token");
      const baseURL = import.meta.env.VITE_API_URL as string;

      // Dùng fetch + keepalive để không bị cancel khi navigate
      fetch(
        `${baseURL}/dashboard-usage-logs/${logId}/update/duration/${durationSeconds}/device/${deviceType}`,
        {
          method: "POST",
          keepalive: true, // ← request sống sót qua navigation
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      ).catch(() => {
        // silent fail
      });
    };
  }, [dashboardId]);
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return "Mobile";
  if (/Tablet|iPad/i.test(ua)) return "Tablet";
  return "Desktop";
}