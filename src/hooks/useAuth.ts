import { useState, useEffect, useCallback } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import toast from "react-hot-toast";

/* =========================
   TYPES
========================= */
type Role = "ADMINISTRATOR" | "STAFF" | "BI";

interface User {
  user_id: string;
  username: string;
  email: string;
  role: Role;
  department: Department | null;
  createdAt: string;
  status: string;
}

export interface Department {
  department_id: string;
  department_name: string;
  manager: User;
  status: string;
}

interface AuthErrorResponse {
  message?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isManager, setIsManager] = useState<boolean>(false);

  const navigate = useNavigate();

  /* Check isManager từ departments */
  const checkIsManager = useCallback(async (userId: string) => {
    try {
      const res = await API.get("/departments");
      const depts: Department[] = res.data.data ?? [];
      const managed = depts.some(
        (d) => d.manager?.user_id === userId && d.status === "ACTIVE",
      );
      setIsManager(managed);
    } catch {
      setIsManager(false);
    }
  }, []);

  const login = async (
    username: string,
    password: string,
  ): Promise<User | null> => {
    setAuthLoading(true);
    setError(null);

    try {
      const response = await API.post("/auth/token", { username, password });
      const token: string = response.data.data.token;
      localStorage.setItem("token", token);

      const loginAccount = await fetchUser();
      if (!loginAccount) return null;

      setUser(loginAccount);
      // Check isManager sau khi login
      await checkIsManager(loginAccount.user_id);

      toast.success("Login successfully!");
      return loginAccount;
    } catch (err) {
      const axiosError = err as AxiosError<AuthErrorResponse>;
      if (axiosError.response) {
        const message = axiosError.response.data?.message || "Login failed.";
        setError(message);
        toast.error(message);
      } else if (axiosError.request) {
        setError("No response from server.");
        toast.error("No response from server.");
      } else {
        setError("Unexpected error occurred.");
        toast.error("Unexpected error occurred.");
      }
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (
    username: string,
    password: string,
    confirm: string,
  ): Promise<void> => {
    try {
      await API.post("api/user", { username, password, confirm });
      await login(username, password);
    } catch (err) {
      const axiosError = err as AxiosError<AuthErrorResponse>;
      const message =
        axiosError.response?.data?.message || "Registration failed.";
      setError(message);
      toast.error(message);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await API.post("/auth/logout", { token });
      }
    } catch (err) {
      console.error("Logout API failed:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("isOAuth2Redirect");
      delete API.defaults.headers.common["Authorization"];
      setUser(null);
      setIsManager(false); // ← reset isManager khi logout
      navigate("/signin", { replace: true });
      toast.success("Logout successfully!");
    }
  };

  const fetchUser = useCallback(async (): Promise<User | null> => {
    try {
      const res = await API.get("/users/my-profile");
      const userData: User = res.data.data;
      setUser(userData);
      // Check isManager sau khi fetch user
      await checkIsManager(userData.user_id);
      return userData;
    } catch (err) {
      const axiosError = err as AxiosError;
      if (axiosError.response?.status === 401) {
        logout();
      } else {
        console.error("Fetch user failed:", err);
      }
      return null;
    } finally {
      setAuthLoading(false);
    }
  }, [checkIsManager]);

  /* Auto fetch user khi có token */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAuthLoading(false);
      return;
    }

    const init = async () => {
      try {
        const res = await API.get("/users/my-profile");
        const userData: User = res.data.data;
        setUser(userData);
        await checkIsManager(userData.user_id);
      } catch (err) {
        localStorage.removeItem("token");
        console.error(err);
      } finally {
        setAuthLoading(false);
      }
    };

    init();
  }, [checkIsManager]);

  return {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    authLoading,
    error,
    fetchUser,
    isManager,        // ← export
    checkIsManager,   // ← export để dùng khi admin đổi manager
  };
};