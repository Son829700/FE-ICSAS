import { useState, useEffect, useCallback } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import toast from "react-hot-toast";

/* =========================
   TYPES
========================= */

type Role = "ADMINISTRATOR" | "STAFF" | "MANAGER" | "BI";

interface User {
  user_id: string;
  username: string;
  email: string;
  role: Role;
  createdAt: string;
  department: string;
  status: string;
}

interface AuthErrorResponse {
  message?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const login = async (
    username: string,
    password: string,
  ): Promise<User | null> => {
    setAuthLoading(true);
    setError(null);

    try {
      const response = await API.post("/auth/token", {
        username,
        password,
      });
      const token: string = response.data.data.token;
      localStorage.setItem("token", token);

      const loginAccount = await fetchUser();
      if (!loginAccount) return null;

      setUser(loginAccount);
      toast.success("Login successfully!");
      return loginAccount;
    } catch (err) {
      const axiosError = err as AxiosError<AuthErrorResponse>;

      console.error("Error during login:", axiosError);

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

      console.error("Error during register:", axiosError);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await API.post("/auth/logout", {
          token: token,
        });
      }
    } catch (err) {
      console.error("Logout API failed:", err);
    } finally {
      // Luôn clear ở frontend dù API có fail
      localStorage.removeItem("token");
      localStorage.removeItem("isOAuth2Redirect");

      delete API.defaults.headers.common["Authorization"];

      setUser(null);

      navigate("/signin", { replace: true });

      toast.success("Logout successfully!");
    }
  };

  const fetchUser = useCallback(async (): Promise<User | null> => {
    try {
      const res = await API.get("/users/my-profile");
      const userData: User = res.data.data;

      setUser(userData);
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
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const isOAuth2Redirect = localStorage.getItem("isOAuth2Redirect");

    if (token) {
      if (!isOAuth2Redirect) {
        fetchUser().catch((err) => {
          console.error("Tự động fetch user thất bại", err);
        });
      }
    } else {
      setAuthLoading(false);
    }
  }, [fetchUser]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setAuthLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await API.get("/users/my-profile");
        setUser(res.data.data);
      } catch (err) {
        localStorage.removeItem("token");
        console.log(err)
      } finally {
        setAuthLoading(false);
      }
    };

    fetchUser();
  }, []);
  return {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    authLoading,
    error,
    fetchUser,
  };
};
