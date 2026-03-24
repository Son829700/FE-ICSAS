import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { GridIcon, HorizontaLDots, ChevronDownIcon, TableIcon } from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { useAuthContext } from "../context/AuthContext";
import {
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
  Layers,
  Ticket,
  Users,
} from "lucide-react";
import API from "../api";

interface Dashboard {
  dashboard_id: string;
  dashboard_name: string;
  url_path: string;
  category: string;
  status: string;
}

export interface Group {
  group_id: string;
  group_name: string;
  description: string;
  member: number;
  groupType: string;
  status: string;
  createdAt: string;
  department_name?: string;
}

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  roles?: string[];
  subItems?: {
    name: string;
    path: string;
    pro?: boolean;
    new?: boolean;
  }[];
};

/* =======================
   BASE NAV ITEMS
   Không còn role MANAGER
   BI ticket filter động theo isManager
======================= */
const navItems: NavItem[] = [
  {
    name: "Dashboard",
    icon: <GridIcon />,
    path: "/",
    roles: ["ADMINISTRATOR", "STAFF", "BI"],
  },

  // ADMINISTRATOR
  {
    name: "User Management",
    icon: <Users />,
    path: "/user",
    roles: ["ADMINISTRATOR"],
  },
  {
    name: "Department Management",
    icon: <Building2 />,
    path: "/department",
    roles: ["ADMINISTRATOR"],
  },
  {
    name: "Log Monitoring",
    icon: <FileText />,
    path: "/log",
    roles: ["ADMINISTRATOR"],
  },
  {
    name: "Ticket Management",
    icon: <Ticket />,
    path: "/admin/ticket",
    roles: ["ADMINISTRATOR"],
  },

  // STAFF
  {
    name: "Ticket Management",
    icon: <Ticket />,
    path: "/ticket",
    roles: ["STAFF"],
  },

  // BI — cả 2, sẽ filter động theo isManager
  {
    name: "Dashboard Management",
    icon: <BarChart3 />,
    path: "/dashboard",
    roles: ["BI"],
  },
  { name: "Group Management", icon: <Layers />, path: "/group", roles: ["BI"] },
  {
    name: "Ticket Management",
    icon: <TableIcon />,
    path: "/BI/ticket",
    roles: ["BI"],
  }, // chỉ hiện nếu isManager
  {
    name: "My Tickets",
    icon: <Ticket />,
    path: "/BI/my-ticket",
    roles: ["BI"],
  }, // chỉ hiện nếu !isManager
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const { user, isManager } = useAuthContext();
  const role = user?.role;
  const [userDashboards, setUserDashboards] = useState<Dashboard[]>([]);
  const [hasApproverTickets, setHasApproverTickets] = useState(false);

  /* =====================
     Check STAFF có phải manager không
     bằng cách gọi /tickets/approver/{id}
  ===================== */
  useEffect(() => {
    const checkApproverTickets = async () => {
      if (role !== "STAFF" || !user?.user_id) return;
      try {
        const res = await API.get(`/tickets/approver/${user.user_id}`);
        const tickets = res.data.data ?? [];
        setHasApproverTickets(tickets.length > 0);
      } catch {
        setHasApproverTickets(false);
      }
    };
    checkApproverTickets();
  }, [user?.user_id, role]);

  /* =====================
     Fetch dashboards
  ===================== */
  useEffect(() => {
    const fetchDashboards = async () => {
      try {
        if (!user?.user_id) return;

        if (role === "STAFF") {
          const groupRes = await API.get(
            `/groups/groups-by-user/${user.user_id}`,
          );
          const groups: Group[] = groupRes.data.data;

          if (!groups.length) {
            setUserDashboards([]);
            return;
          }

          const responses = await Promise.all(
            groups.map((g) =>
              API.get(`/dashboard/group-access/group/${g.group_id}`),
            ),
          );

          const allDashboards = responses
            .flatMap((res) => res.data.data)
            .filter((d: Dashboard) => d.status === "ACTIVE");

          const map = new Map<string, Dashboard>();
          allDashboards.forEach((d: Dashboard) => {
            if (!map.has(d.dashboard_id)) map.set(d.dashboard_id, d);
          });

          setUserDashboards(Array.from(map.values()));
        } else if (role === "BI" || role === "ADMINISTRATOR") {
          const res = await API.get("/dashboard");
          const all: Dashboard[] = res.data.data;
          setUserDashboards(all.filter((d) => d.status === "ACTIVE"));
        }
      } catch (err) {
        console.error("Fetch dashboards error:", err);
      }
    };

    fetchDashboards();
  }, [user, role]);

  /* =====================
     Build dynamic nav items
  ===================== */
  const buildNavItems = (): NavItem[] => {
    // 1. Filter theo role
    const roleFiltered = navItems.filter((item) => {
      if (!item.roles) return true;
      return item.roles.includes(role ?? "");
    });

    // 2. Filter BI ticket items theo isManager
    const biFiltered = roleFiltered.filter((item) => {
      if (role === "BI") {
        if (item.path === "/BI/ticket") return isManager; // chỉ BI manager
        if (item.path === "/BI/my-ticket") return !isManager; // chỉ BI staff
      }
      return true;
    });

    // 3. Inject manager ticket cho STAFF nếu có approver tickets
    const withManagerTicket = [...biFiltered];
    
    // 4. Build dynamic dashboard submenu
    return withManagerTicket.map((item) => {
      if (item.name === "Dashboard") {
        if (userDashboards.length > 0) {
          return {
            ...item,
            path: undefined,
            subItems: userDashboards.map((d) => ({
              name: d.dashboard_name,
              path: `/dashboard/${d.dashboard_id}`,
            })),
          };
        }
        return { ...item, subItems: undefined, path: "/" };
      }
      return item;
    });
  };

  const finalNavItems = buildNavItems();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {},
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname],
  );

  useEffect(() => {
    let submenuMatched = false;
    finalNavItems.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({ type: "main", index });
            submenuMatched = true;
          }
        });
      }
    });
    if (!submenuMatched) setOpenSubmenu(null);
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `main-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number) => {
    setOpenSubmenu((prev) => {
      if (prev && prev.type === "main" && prev.index === index) return null;
      return { type: "main", index };
    });
  };

  const renderMenuItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name + (nav.path ?? "")}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index)}
              className={`menu-item group ${
                openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`menu-item-icon-size ${
                  openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}

          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`main-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.index === index
                    ? `${subMenuHeight[`main-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(finalNavItems)}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
