import AdminHome from "../Adminitrator/Home";
import StaffHome from "../Staff/Home";
import BIHome from "../BI/Home";
import ManagerHome from "../Manager/Home";
import { useAuthContext } from "../../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function Home() {
  const { user } = useAuthContext();

  if (!user) return <Navigate to="/signin" />;

  switch (user.role) {
    case "ADMINISTRATOR":
      return <AdminHome />;
    case "STAFF":
      return <StaffHome />;
    case "MANAGER":
      return <ManagerHome />;
    case "BI":
      return <BIHome />;
    default:
      return <Navigate to="/signin" />;
  }
}
