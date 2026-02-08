import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/User/UserProfiles";
import UserManagement from "./pages/User/UserManagement";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import LogsList from "./pages/Logs";
import SupportTicketPage from "./pages/TicketManagement";
import GroupManagement from "./pages/GroupManagemnt";
import AppLoading from "./pages/AppLoading";
import TicketDetail from "./pages/TicketDetail";
import DashboardManagement from "./pages/DashboardManagement";
import GroupDetail from "./pages/GroupDetail";
import ApiKeyManager from "./pages/ApiKeyManager";
import TicketDetailManager from "./pages/TicketDetailManager";
import TicketDetailBI from "./pages/TicketDetailBI";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Home />} />

            {/* User Pages */}

            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/user" element={<UserManagement />} />
            <Route path="/log" element={<LogsList />} />
            <Route path="/group" element={<GroupManagement />} />
            <Route path="/ticket-detail" element={<TicketDetail />} />
            <Route path="/manager/ticket" element={<TicketDetailManager />} />
            <Route path="/BI/ticket-detail" element={<TicketDetailBI />} />
            <Route path="/dashboard" element={<DashboardManagement />} />
            <Route path="/group-detail" element={<GroupDetail />} />
            <Route path="/api-key" element={<ApiKeyManager />} />


            {/* Others Page */}
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />
            <Route path="/ticket" element={<SupportTicketPage />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="/loading" element={<AppLoading />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
