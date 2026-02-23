import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Outlet} from "react-router-dom";
import NavBar from "./NavBar";
import Footer from "./Footer";
import api from "../routeWrapper/Api";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setHideAmounts as setHideAmountsAction } from "../store/slices/amountSlice";
import {
  removeNotificationRequest,
  setNotificationsLoading,
  setNotificationRequests,
} from "../store/slices/notificationsSlice";

const PeopleSearchModal = lazy(() => import("./PeopleSearchModal"));
const NotificationsModal = lazy(() => import("./NotificationsModal"));

export default function Layout() {
  const dispatch = useAppDispatch();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const notificationRequests = useAppSelector((state) => state.notifications.requests);
  const notificationsLoaded = useAppSelector((state) => state.notifications.isLoaded);
  const notificationsLoading = useAppSelector((state) => state.notifications.loading);
  const loadingNotifications = isNotificationsOpen && notificationsLoading;
  const notificationsInFlight = useRef(false);
  const hideAmountsHydrated = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      hideAmountsHydrated.current = false;
      return;
    }
    if (hideAmountsHydrated.current) return;

    hideAmountsHydrated.current = true;
    api.get("/api/profile/view")
      .then((res) => {
        dispatch(setHideAmountsAction(Boolean(res.data?.hideAmounts)));
      })
      .catch(() => {
        // Ignore hydration failure and keep default redux value.
      });
  }, [dispatch, isAuthenticated]);

  const fetchNotifications = useCallback(async (force = false) => {
    if (!force && notificationsLoaded) return;
    if (notificationsInFlight.current) return;
    notificationsInFlight.current = true;
    dispatch(setNotificationsLoading(true));

    try {
      const res = await api.get("/api/follow/follow-requests");
      dispatch(setNotificationRequests(res.data?.requests || []));
    } catch {
      dispatch(setNotificationsLoading(false));
    } finally {
      notificationsInFlight.current = false;
    }
  }, [dispatch, notificationsLoaded]);

  useEffect(() => {
    if (notificationsLoaded) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;

    const scheduleFetch = () => {
      void fetchNotifications();
    };

    const browserWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (browserWindow.requestIdleCallback) {
      idleId = browserWindow.requestIdleCallback(() => {
        scheduleFetch();
      }, { timeout: 3000 });
    } else {
      timeoutId = setTimeout(() => {
        scheduleFetch();
      }, 2000);
    }

    return () => {
      if (idleId !== null) {
        browserWindow.cancelIdleCallback?.(idleId);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [fetchNotifications, notificationsLoaded]);

  useEffect(() => {
    const seedKey = "seedTilesOnce";
    if (localStorage.getItem(seedKey) === "true") {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;

    const runSeed = () => {
      api.post("/api/seed/tiles")
        .then(() => {
          localStorage.setItem(seedKey, "true");
        })
        .catch(() => {
          // Ignore failures to avoid blocking app load.
        });
    };

    const browserWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (browserWindow.requestIdleCallback) {
      idleId = browserWindow.requestIdleCallback(() => {
        runSeed();
      }, { timeout: 5000 });
    } else {
      timeoutId = setTimeout(() => {
        runSeed();
      }, 3000);
    }

    return () => {
      if (idleId !== null) {
        browserWindow.cancelIdleCallback?.(idleId);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  useEffect(() => {
    if (!isNotificationsOpen) return;
    void fetchNotifications();
  }, [isNotificationsOpen, fetchNotifications]);

  const handleOpenNotifications = () => {
    setIsNotificationsOpen(true);
  };

  const handleAcceptRequest = async (requestId: string) => {
    await api.post(`/api/follow/follow-requests/${requestId}/accept`);
    dispatch(removeNotificationRequest(requestId));
  };

  const handleDeclineRequest = async (requestId: string) => {
    await api.delete(`/api/follow/follow-requests/${requestId}`);
    dispatch(removeNotificationRequest(requestId));
  };

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <NavBar
        onSearchClick={() => setIsSearchOpen(true)}
        onNotificationClick={handleOpenNotifications}
        notificationCount={notificationRequests.length}
      />

      {/* This is the scrollable area */}
      <div id="app-scroll-container" className="flex-1 overflow-y-auto">
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
            count={notificationRequests.length}
            requests={notificationRequests}
            loading={loadingNotifications}
            onRefresh={() => fetchNotifications(true)}
            onAccept={handleAcceptRequest}
            onDecline={handleDeclineRequest}
          />
        </Suspense>
      )}
    </div>
  );
}