import { jwtDecode } from "jwt-decode";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

interface JwtPayload {
  sub: string;
  exp?: number;
  iat?: number;
}

export default function OAuth2RedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchUser } = useAuthContext();

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const token = params.get("appToken");
    const googleToken = params.get("googleToken");

    if (token) {
      try {
        localStorage.setItem("token", token);

        if (googleToken) {
          localStorage.setItem("googleToken", googleToken);
        }

        const decoded = jwtDecode<JwtPayload>(token);

        if (decoded?.sub) {
          localStorage.setItem("username", decoded.sub);
        }
        fetchUser();
        toast.success("Login succesfully!");

        navigate("/");
      } catch (error) {
        console.error("Decode token failed:", error);
        navigate("/login?error=invalid_token");
      }
    } else {
      console.error("No access token found in URL!");
      navigate("/login?error=oauth2");
    }
  }, [location, navigate, fetchUser]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        <p className="text-sm text-gray-500">Processing Google login...</p>
      </div>
    </div>
  );
}
