import { useRegisterSW } from "virtual:pwa-register/react";
import { useAppSelector } from "../store/hooks";

export default function PWAUpdatePrompt() {
  const theme = useAppSelector((state) => state.theme.theme);
  const isLight = theme === "light";

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-9999 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
      style={{
        background: isLight
          ? "rgba(255,255,255,0.97)"
          : "rgba(18,18,18,0.95)",
        border: isLight
          ? "1px solid rgba(0,0,0,0.12)"
          : "1px solid rgba(255,255,255,0.15)",
        backdropFilter: "blur(14px)",
        boxShadow: isLight
          ? "0 8px 32px rgba(0,0,0,0.12)"
          : "0 8px 32px rgba(0,0,0,0.6)",
        maxWidth: "calc(100vw - 32px)",
        width: "max-content",
      }}
    >
      {/* Icon */}
      <span className="text-lg select-none">🔄</span>

      {/* Text */}
      <div className="flex flex-col leading-tight">
        <span
          className="text-[12px] font-semibold"
          style={{ color: isLight ? "#111" : "#f5f5f5" }}
        >
          Update available
        </span>
        <span
          className="text-[10px]"
          style={{ color: isLight ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.45)" }}
        >
          A new version is ready.
        </span>
      </div>

      {/* Update button */}
      <button
        onClick={() => updateServiceWorker(true)}
        className="ml-2 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-colors"
        style={{
          background: "linear-gradient(120deg,#2563eb,#7c3aed)",
          color: "#fff",
        }}
      >
        Reload
      </button>
    </div>
  );
}
