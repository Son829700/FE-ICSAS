import { useState, useEffect, useCallback } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const login = async (username, password) => {
        setAuthLoading(true);
        setError(null);
        try {
            const response = await API.post("/auth/token", {
                username,
                password,
            });
            localStorage.setItem("token", response.data.data.token);
            const loginAccount = await fetchUser(); 
            const { role } = loginAccount;

            if (role === "ADMIN") {
                navigate("/admin");
            } else if (role === "USER") {
                navigate("/");
            } else if (role === "COACH") {
                navigate("/coach");
            } else {
                navigate("/");
            }

            setUser(loginAccount);
            toast.success("Đăng nhập thành công!"); 
        } catch (error) {
            console.error("Error during login:", error);
            if (error.response) {
                setError(error.response.data.message || "Login failed.");
                toast.error(error.response.data.message);
            } else if (error.request) {
                setError("No response from server.");
                toast.error("No response from server.");
            } else {
                setError("Unexpected error occurred.");
                toast.error("Unexpected error occurred.");
            }
            throw error;
        } finally {
            setAuthLoading(false);
        }
    };

    const register = async (username, password, confirm) => {
        try {
            await API.post("api/user", { username, password, confirm });
            await login(username, password);
        } catch (error) {
            if (error.response) {
                setError(error.response.data.message || "Registration failed.");
                toast.error(error.response.data.message);
            }
            console.error("Error during register:", error);
        }
    };

    const logout = () => {
        localStorage.clear();
        toast.success("Đăng xuất thành công!");
        navigate("/");
        setUser(null);
    };

    const fetchUser = useCallback(async () => {
        try {
            const res = await API.get("/users/my-info");
            setUser(res.data.data);
            return res.data.data;
        } catch (error) {
            console.error("Auth error:", error);
            logout();
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
