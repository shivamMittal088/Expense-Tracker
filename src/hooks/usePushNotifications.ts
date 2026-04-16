import { useState, useEffect } from "react";
import Api from "../routeWrapper/Api";
import { showTopToast } from "../utils/Redirecttoast";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

export function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported] = useState(
    () => "serviceWorker" in navigator && "PushManager" in window
  );
  const [permission, setPermission] = useState<NotificationPermission>(
    () => ("Notification" in window ? Notification.permission : "default")
  );

  // Sync UI state with the actual browser subscription on mount
  useEffect(() => {
    if (!isSupported) return;
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub);
      });
    });
  }, [isSupported]);

  const subscribe = async (): Promise<void> => {
    if (!isSupported) return;
    setIsLoading(true);
    try {
      // If already blocked, tell the user rather than silently failing
      if (Notification.permission === "denied") {
        showTopToast("Notifications are blocked. Please allow them in your browser site settings.", { tone: "error" });
        return;
      }

      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        showTopToast("Notification permission not granted.", { tone: "error" });
        return;
      }

      // Step 1: Fetch VAPID public key
      let publicKey: string;
      try {
        const { data } = await Api.get<{ publicKey: string }>("/api/push/vapid-public-key");
        publicKey = data.publicKey;
        if (!publicKey) throw new Error("Empty VAPID key");
      } catch (err) {
        const e = err as { response?: { status?: number; data?: { message?: string } }; message?: string; code?: string };
        console.error("VAPID key fetch failed:", {
          status: e.response?.status,
          data: e.response?.data,
          message: e.message,
          code: e.code,
          online: navigator.onLine,
        });
        if (e.response) {
          const msg = e.response.data?.message || "Push notifications unavailable on server.";
          showTopToast(msg, { tone: "error" });
        } else if (!navigator.onLine) {
          showTopToast("You are offline. Connect to the internet and try again.", { tone: "error" });
        } else {
          showTopToast("Backend is not reachable. Make sure the server is running.", { tone: "error" });
        }
        return;
      }

      // Step 2: Subscribe via browser PushManager
      let subscription: PushSubscription;
      try {
        const applicationServerKey = urlBase64ToUint8Array(publicKey);
        const reg = await navigator.serviceWorker.ready;
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      } catch (err) {
        console.error("PushManager.subscribe failed:", err);
        showTopToast("Browser could not create push subscription. Try reloading the page.", { tone: "error" });
        return;
      }

      // Step 3: Save subscription on backend
      try {
        await Api.post("/api/push/subscribe", subscription.toJSON());
      } catch (err) {
        console.error("Backend subscribe failed:", err);
        showTopToast("Subscribed in browser but failed to save on server. Try again.", { tone: "error" });
        return;
      }

      setIsSubscribed(true);
      showTopToast("Push notifications enabled", { duration: 1500 });
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async (): Promise<void> => {
    if (!isSupported) return;
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        setIsSubscribed(false);
        return;
      }

      await Api.delete("/api/push/unsubscribe", {
        data: { endpoint: subscription.endpoint },
      });
      await subscription.unsubscribe();
      setIsSubscribed(false);
      showTopToast("Push notifications disabled", { duration: 1500 });
    } catch (err) {
      console.error("Push unsubscribe error:", err);
      showTopToast("Failed to disable push notifications.", { tone: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const toggle = () => (isSubscribed ? unsubscribe() : subscribe());

  return { isSubscribed, isLoading, isSupported, isBlocked: permission === "denied", toggle };
}
