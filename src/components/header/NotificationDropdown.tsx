import { useState, useEffect } from "react";
import Pusher from "pusher-js";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Link } from "react-router";
import { useAuthContext } from "../../context/AuthContext";
import API from "../../api";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  // LẤY LỊCH SỬ KHI USER ĐĂNG NHẬP
  useEffect(() => {
    if (!user?.user_id) return;

    const fetchHistory = async () => {
      try {
        const res = await API.get(`/notifications/${user.user_id}`);
        // Chú ý: Backend có thể bọc data trong `res.data.data` hoặc trả thẳng mảng `res.data`
        const dataList = Array.isArray(res.data) ? res.data : (res.data?.data || []);

        // Sắp xếp giảm dần theo id nếu API chưa sắp xếp
        const sortedList = [...dataList].sort((a: any, b: any) =>
          (b.notification_id || b.notificationId || b.id) - (a.notification_id || a.notificationId || a.id)
        );

        setNotifications(sortedList);

        const unread = sortedList.filter((n: any) => !n.read && !n.isRead).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error("Lỗi lấy lịch sử thông báo:", error);
      }
    };

    fetchHistory();
  }, [user]);

  // BẬT PUSHER LẮNG NGHE REAL-TIME
  useEffect(() => {
    if (!user?.user_id) return;

    // TODO: Nhớ cấu hình VITE_PUSHER_APP_KEY trong file .env
    const pusherAppKey = import.meta.env.VITE_PUSHER_APP_KEY || "YOUR_APP_KEY";

    const pusher = new Pusher(pusherAppKey, {
      cluster: "ap1",
    });

    const channel = pusher.subscribe(`user-${user.user_id}`);

    channel.bind("new-notification", (newData: any) => {
      console.log("Có chuông mới:", newData);
      setNotifications((prev) => [newData, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [user]);

  // XỬ LÝ KHI CLICK "ĐÃ ĐỌC"
  const handleMarkAsRead = async (notificationId: string | number, isRead: boolean) => {
    if (isRead) return;

    try {
      await API.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId || n.notificationId === notificationId || n.notification_id === notificationId
            ? { ...n, isRead: true, read: true }
            : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Lỗi khi đánh dấu đã đọc:", error);
    }
  };

  const handleReadAll = async () => {
    if (!user?.user_id || unreadCount === 0) return;
    try {
      // First attempt a standard read-all endpoint pattern, fallback to parallel array updates
      await API.put(`/notifications/read-all/${user.user_id}`).catch(async () => {
        const unreadNotifs = notifications.filter(n => !(n.isRead || n.read));
        await Promise.all(unreadNotifs.map(n => {
          const idToRead = n.notification_id || n.id || n.notificationId;
          return API.put(`/notifications/${idToRead}/read`);
        }));
      });

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Lỗi khi đánh dấu đã đọc tất cả:", error);
    }
  };

  const handleClick = () => {
    toggleDropdown();
  };

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        <span
          className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-error-500 border border-white dark:border-gray-900 ${unreadCount === 0 ? "hidden" : "flex"
            }`}
        ></span>
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 flex items-center gap-2 dark:text-gray-200">
            Notification
            {unreadCount > 0 && (
              <span className="bg-error-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </h5>
          <button
            onClick={toggleDropdown}
            className="text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="p-5 text-sm text-center text-gray-500 dark:text-gray-400">
              You don't have any notifications yet.
            </div>
          ) : (
            notifications.map((n: any, idx: number) => {
              const id = n.notification_id || n.id || n.notificationId;
              const isRead = n.isRead || n.read;

              return (
                <li key={id || idx}>
                  <DropdownItem
                    onItemClick={() => handleMarkAsRead(id, isRead)}
                    className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4 py-3 dark:border-gray-800 dark:hover:bg-white/5 transition mb-1 ${!isRead
                      ? "bg-brand-50/40 hover:bg-brand-50/80 dark:bg-brand-500/10"
                      : "hover:bg-gray-100 bg-white dark:bg-gray-dark"
                      }`}
                  >
                    <span className="relative block w-10 flex-shrink-0 h-10 rounded-full z-1">
                      <div className="flex items-center justify-center w-full h-full text-lg rounded-full bg-gray-100 dark:bg-gray-800">
                        🔔
                      </div>
                    </span>

                    <span className="block flex-1">
                      <span className="mb-1 block text-theme-sm text-gray-500 dark:text-gray-400">
                        <span className={`text-gray-800 dark:text-white/90 ${!isRead ? "font-semibold" : "font-medium"}`}>
                          {n.title || "Thông báo"}
                        </span>
                        <span className={`block mt-0.5 whitespace-pre-wrap ${!isRead ? "text-gray-700 dark:text-gray-300" : ""}`}>
                          {n.message}
                        </span>
                      </span>

                      <span className="flex items-center justify-between text-gray-500 text-theme-xs dark:text-gray-400 mt-1">
                        <span className="text-gray-400 text-[11px]">{n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN') : 'Vừa xong'}</span>
                        {!isRead && (
                          <span className="w-2 h-2 bg-brand-500 rounded-full"></span>
                        )}
                      </span>
                    </span>
                  </DropdownItem>
                </li>
              );
            })
          )}
        </ul>

        <button
          onClick={handleReadAll}
          className="block w-full px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition"
        >
          Read All Notifications
        </button>
      </Dropdown>
    </div>
  );
}
