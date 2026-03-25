import { Routes, Route } from "react-router-dom";
import SignIn from "./pages/AuthPages/SignIn";
// import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/User/UserProfiles";
import UserManagement from "./pages/Administrator/UserManagement";
import DepartmentManagement from "./pages/Administrator/DepartmentManagement";

import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
// import Home from "./pages/Dashboard/Home";
import LogsList from "./pages/Administrator/Logs";
import SupportTicketPage from "./pages/Staff/TicketManagement";
import GroupManagement from "./pages/BI/GroupManagemnt";
import AppLoading from "./pages/OtherPage/AppLoading";
import TicketDetail from "./pages/Staff/TicketDetail";
import DashboardManagement from "./pages/BI/DashboardManagement";
import GroupDetail from "./pages/BI/GroupDetail";
import TicketDetailBI from "./pages/BI/TicketDetailBI";
import ProtectedRoute from "./routes/ProtectedRoute";
import { Toaster } from "react-hot-toast";
import StaffHome from "./pages/Staff/Home";
import TicketDetailManager from "./pages/Manager/TicketDetailManager";
import TicketListManager from "./pages/Manager/TicketManagement";
import OAuth2RedirectHandler from "./components/auth/OAuth2RedirectHandler";
import TicketListBI from "./pages/BI/TicketManagement";
import AdminTicketManagement from "./pages/Administrator/TicketManagement";
import TicketListBIStaff from "./pages/BI/TicketListBIStaff";

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        containerStyle={{
          zIndex: 100000,
        }}
      />
      <ScrollToTop />

      <Routes>
        {/* Dashboard Layout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/"
            element={
              <ProtectedRoute
                allowedRoles={["STAFF", "MANAGER", "BI", "ADMINISTRATOR"]}
              >
                <StaffHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute
                allowedRoles={["STAFF", "MANAGER", "BI", "ADMINISTRATOR"]}
              >
                <UserProfiles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/:id"
            element={
              <ProtectedRoute
                allowedRoles={["STAFF", "MANAGER", "BI", "ADMINISTRATOR"]}
              >
                <StaffHome />
              </ProtectedRoute>
            }
          />
          {/* ADMIN */}
          <Route
            path="/user"
            element={
              <ProtectedRoute allowedRoles={["ADMINISTRATOR"]}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/department"
            element={
              <ProtectedRoute allowedRoles={["ADMINISTRATOR"]}>
                <DepartmentManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/log"
            element={
              <ProtectedRoute allowedRoles={["ADMINISTRATOR"]}>
                <LogsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ticket"
            element={
              <ProtectedRoute allowedRoles={["ADMINISTRATOR"]}>
                <AdminTicketManagement />
              </ProtectedRoute>
            }
          />
          {/* MANAGER */}
          <Route
            path="/manager/ticket"
            element={
              <ProtectedRoute allowedRoles={["STAFF"]}>
                <TicketListManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/ticket/:id"
            element={
              <ProtectedRoute allowedRoles={["STAFF"]}>
                <TicketDetailManager />
              </ProtectedRoute>
            }
          />
          {/* STAFF */}
          <Route
            path="/ticket"
            element={
              <ProtectedRoute allowedRoles={["STAFF"]}>
                <SupportTicketPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ticket/:id"
            element={
              <ProtectedRoute allowedRoles={["STAFF", "MANAGER"]}>
                <TicketDetail />
              </ProtectedRoute>
            }
          />
          {/* BI */}
          <Route
            path="/group"
            element={
              <ProtectedRoute allowedRoles={["BI"]}>
                <GroupManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/BI/my-ticket"
            element={
              <ProtectedRoute allowedRoles={["BI"]}>
                <TicketListBIStaff />
              </ProtectedRoute>
            }
          />
          <Route
            path="/BI/ticket"
            element={
              <ProtectedRoute allowedRoles={["BI"]}>
                <TicketListBI />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/:groupId"
            element={
              <ProtectedRoute allowedRoles={["BI"]}>
                <GroupDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["BI"]}>
                <DashboardManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/BI/ticket-detail"
            element={
              <ProtectedRoute allowedRoles={["BI"]}>
                <TicketDetailBI />
              </ProtectedRoute>
            }
          />
        </Route>
        {/* Auth Layout */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/oauth2-redirect" element={<OAuth2RedirectHandler />} />
        <Route path="/loading" element={<AppLoading />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
