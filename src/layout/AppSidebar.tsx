import { Link, useLocation } from "react-router-dom";
import React from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  ClipboardList,
  Ticket,
  BarChart3,
  Layers,
} from "lucide-react";
import { HorizontaLDots } from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { useAuthContext } from "../context/AuthContext";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

const navItemsByRole: Record<string, NavItem[]> = {
  ADMINISTRATOR: [
    { name: "Dashboard", icon: <LayoutDashboard />, path: "/" },
    { name: "User Management", icon: <Users />, path: "/user" },
    { name: "Department Management", icon: <Building2 />, path: "/department" },
    { name: "Log Monitoring", icon: <FileText />, path: "/log" },
  ],

  MANAGER: [
    { name: "Dashboard", icon: <LayoutDashboard />, path: "/" },
    {
      name: "Ticket Management",
      icon: <ClipboardList />,
      path: "/manager/ticket",
    },
    { name: "My Ticket", icon: <Ticket />, path: "/ticket" },
  ],

  STAFF: [
    { name: "Dashboard", icon: <LayoutDashboard />, path: "/" },
    { name: "My Ticket", icon: <Ticket />, path: "/ticket" },
    { name: "Ticket Detail", icon: <FileText />, path: "/ticket-detail" },
  ],

  BI: [
    { name: "Dashboard", icon: <LayoutDashboard />, path: "/" },
    { name: "Dashboard Management", icon: <BarChart3 />, path: "/dashboard" },
    { name: "Group Management", icon: <Layers />, path: "/group" },
    { name: "Ticket Detail", icon: <FileText />, path: "/BI/ticket-detail" },
  ],
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { user } = useAuthContext();
  const location = useLocation();

  if (!user) return null;

  const navItems = navItemsByRole[user.role] || [];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
              ? "w-[290px]"
              : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          <img
            alt="Logo"
            width="150"
            height="40"
            src="/images/logo/logo.svg"
            className="dark:hidden"
          />
          <img
            className="hidden dark:block"
            alt="Logo"
            width="150"
            height="40"
            src="/images/logo/logo-dark.svg"
          />
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto no-scrollbar">
        <nav className="mb-6">
          <h2
            className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
              !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
            }`}
          >
            {isExpanded || isHovered || isMobileOpen ? (
              "Menu"
            ) : (
              <HorizontaLDots className="size-6" />
            )}
          </h2>

          <ul className="flex flex-col gap-4">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`menu-item group ${
                    isActive(item.path)
                      ? "menu-item-active"
                      : "menu-item-inactive"
                  }`}
                >
                  <span
                    className={`menu-item-icon-size ${
                      isActive(item.path)
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    {item.icon}
                  </span>

                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">{item.name}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
