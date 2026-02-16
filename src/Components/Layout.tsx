import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet} from "react-router-dom";
import NavBar from "./NavBar";
import Footer from "./Footer";
import PeopleSearchModal from "./PeopleSearchModal.tsx";
import NotificationsModal, { type FollowRequest } from "./NotificationsModal";
import api from "../routeWrapper/Api";

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
    const seedKey = "seedFollowersOnce";
    if (localStorage.getItem(seedKey) === "true") {
      return;
    }

    api.post("/api/seed/followers")
      .then(() => {
        localStorage.setItem(seedKey, "true");
      })
      .catch(() => {
        // Ignore failures to avoid blocking app load.
      });
  }, []);

  useEffect(() => {
    const seedKey = "seedTransactionsOnce";
    if (localStorage.getItem(seedKey) === "true") {
      return;
    }

    api.post("/api/seed/transactions")
      .then(() => {
        localStorage.setItem(seedKey, "true");
      })
      .catch(() => {
        // Ignore failures to avoid blocking app load.
      });
  }, []);

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
  }, [isNotificationsOpen, notificationRequests]);

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
        <PeopleSearchModal
          open={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />
      )}
      <NotificationsModal
        open={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        count={notificationRequests?.length || 0}
        requests={notificationRequests || []}
        loading={loadingNotifications}
        onAccept={handleAcceptRequest}
        onDecline={handleDeclineRequest}
      />
    </div>
  );
}