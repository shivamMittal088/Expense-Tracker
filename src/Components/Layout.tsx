import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Outlet} from "react-router-dom";
import NavBar from "./NavBar";
import Footer from "./Footer";
import type { FollowRequest } from "./NotificationsModal";
import api from "../routeWrapper/Api";

const PeopleSearchModal = lazy(() => import("./PeopleSearchModal"));
const NotificationsModal = lazy(() => import("./NotificationsModal"));

export default function Layout() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationRequests, setNotificationRequests] = useState<FollowRequest[] | null>(null);
  const loadingNotifications = isNotificationsOpen && notificationRequests === null;
  const notificationsInFlight = useRef(false);

  const fetchNotifications = useCallback(() => {
    if (notificationsInFlight.current) return;
    notificationsInFlight.current = true;
    api.get("/api/profile/follow-requests")
      .then((res) => {
        setNotificationRequests(res.data?.requests || []);
      })
      .catch(() => {
        setNotificationRequests([]);
      })
      .finally(() => {
        notificationsInFlight.current = false;
      });
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const seedKey = "seedTilesOnce";
    if (localStorage.getItem(seedKey) === "true") {
      return;
    }

    api.post("/api/seed/tiles")
      .then(() => {
        localStorage.setItem(seedKey, "true");
      })
      .catch(() => {
        // Ignore failures to avoid blocking app load.
      });
  }, []);

  useEffect(() => {
    if (!isNotificationsOpen) return;
    if (notificationRequests !== null) return;
    fetchNotifications();
  }, [isNotificationsOpen, notificationRequests, fetchNotifications]);

  const handleOpenNotifications = () => {
    setIsNotificationsOpen(true);
  };

  const handleAcceptRequest = async (requestId: string) => {
    await api.post(`/api/profile/follow-requests/${requestId}/accept`);
    setNotificationRequests((prev) => (prev ? prev.filter((r) => r.id !== requestId) : prev));
  };

  const handleDeclineRequest = async (requestId: string) => {
    await api.delete(`/api/profile/follow-requests/${requestId}`);
    setNotificationRequests((prev) => (prev ? prev.filter((r) => r.id !== requestId) : prev));
  };

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <NavBar
        onSearchClick={() => setIsSearchOpen(true)}
        onNotificationClick={handleOpenNotifications}
        notificationCount={notificationRequests?.length || 0}
      />

      {/* This is the scrollable area */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      <Footer />

      {isSearchOpen && (
        <Suspense
          fallback={(
            <div className="fixed inset-0 z-70 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-300/25 border-t-emerald-300 animate-spin shadow-[0_0_14px_rgba(52,211,153,0.35)]" />
            </div>
          )}
        >
          <PeopleSearchModal
            open={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
          />
        </Suspense>
      )}
      {isNotificationsOpen && (
        <Suspense
          fallback={(
            <div className="fixed inset-0 z-70 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-300/25 border-t-emerald-300 animate-spin shadow-[0_0_14px_rgba(52,211,153,0.35)]" />
            </div>
          )}
        >
          <NotificationsModal
            open={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            count={notificationRequests?.length || 0}
            requests={notificationRequests || []}
            loading={loadingNotifications}
            onAccept={handleAcceptRequest}
            onDecline={handleDeclineRequest}
          />
        </Suspense>
      )}
    </div>
  );
}