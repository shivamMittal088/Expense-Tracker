import { useEffect, useRef } from "react";
import { Outlet} from "react-router-dom";
import NavBar from "./NavBar";
import Footer from "./Footer";
import api from "../routeWrapper/Api";
import { getPendingExpenses, deletePendingExpense } from "../utils/indexedDB/expensesDB";
import { showTopToast } from "../utils/Redirecttoast";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setHideAmounts as setHideAmountsAction } from "../store/slices/amountSlice";

export default function Layout() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
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

  // Sync pending offline expenses when back online
  useEffect(() => {
    const syncPendingExpenses = async () => {
      const pending = await getPendingExpenses();
      if (!pending.length) return;

      let synced = 0;
      for (const expense of pending) {
        try {
          await api.post("/api/expense/add", {
            amount: expense.amount,
            category: expense.category,
            payment_mode: expense.payment_mode,
            notes: expense.notes,
            occurredAt: expense.occurredAt,
          }, {
            params: { tzOffsetMinutes: new Date().getTimezoneOffset() },
          });
          if (expense.id != null) await deletePendingExpense(expense.id);
          synced++;
        } catch {
          // Stop syncing on first failure — will retry next time online
          break;
        }
      }
      if (synced > 0) {
        showTopToast(`${synced} expense${synced > 1 ? "s" : ""} moved from locally to database`, { duration: 2500 });
      }
      window.dispatchEvent(new CustomEvent("expense:changed"));
    };

    window.addEventListener("online", syncPendingExpenses);
    // Also try syncing on mount in case we came online before this mounted
    if (navigator.onLine) syncPendingExpenses();

    return () => window.removeEventListener("online", syncPendingExpenses);
  }, []);

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <NavBar />

      {/* This is the scrollable area */}
      <div id="app-scroll-container" className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      <Footer />
    </div>
  );
}