/* ---------- Types ---------- */

interface ToastOverlay extends HTMLDivElement {
  _timeoutId?: number;
}

type ToastOptions = {
  title?: string;
  duration?: number;
};

type TopToastOptions = {
  duration?: number;
  tone?: "success" | "error" | "info";
};

/* ---------- Toast API ---------- */

export const showToast = (
  message: string,
  options: ToastOptions = {}
) => {
  if (typeof document === "undefined") return;

  const { title = "Attention needed", duration = 4500 } = options;

  // Remove any existing toast
  const existing = document.getElementById("global-toast-overlay");
  existing?.remove();

  /* ---------- Overlay ---------- */

  const overlay = document.createElement("div") as ToastOverlay;
  overlay.id = "global-toast-overlay";
  overlay.style.cssText = [
    "position:fixed",
    "inset:0",
    "background:rgba(0,0,0,0.55)",
    "backdrop-filter:blur(4px)",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "z-index:2147483000",
    "padding:16px",
  ].join(";");

  /* ---------- Card ---------- */

  const card = document.createElement("div");
  card.style.cssText = [
    "background:#0f1117",
    "color:#f7f7f7",
    "border:1px solid rgba(255,255,255,0.25)",
    "box-shadow:0 25px 70px rgba(0,0,0,0.55)",
    "border-radius:14px",
    "padding:20px",
    "width:min(90vw,380px)",
    "font-family:'Inter',system-ui,-apple-system,sans-serif",
  ].join(";");

  /* ---------- Heading ---------- */

  const heading = document.createElement("div");
  heading.textContent = title;
  heading.style.cssText = [
    "font-weight:700",
    "font-size:16px",
    "letter-spacing:0.2px",
    "margin-bottom:8px",
  ].join(";");

  /* ---------- Message ---------- */

  const body = document.createElement("p");
  body.textContent = message;
  body.style.cssText = [
    "margin:0",
    "line-height:1.5",
    "color:#d5d9e3",
  ].join(";");

  /* ---------- Actions ---------- */

  const actions = document.createElement("div");
  actions.style.cssText =
    "display:flex;justify-content:flex-end;margin-top:16px;gap:8px";

  const close = document.createElement("button");
  close.textContent = "Got it";
  close.style.cssText = [
    "padding:10px 14px",
    "border-radius:10px",
    "border:1px solid rgba(255,255,255,0.25)",
    "background:linear-gradient(120deg,#2563eb,#7c3aed)",
    "color:white",
    "cursor:pointer",
    "font-weight:600",
    "letter-spacing:0.2px",
    "transition:transform 120ms ease,box-shadow 120ms ease",
  ].join(";");

  close.onmouseenter = () => {
    close.style.transform = "translateY(-1px)";
    close.style.boxShadow = "0 10px 25px rgba(124,58,237,0.35)";
  };

  close.onmouseleave = () => {
    close.style.transform = "translateY(0)";
    close.style.boxShadow = "none";
  };

  /* ---------- Remove logic ---------- */

  const removeOverlay = () => overlay.remove();

  close.onclick = removeOverlay;
  overlay.onclick = (event) => {
    if (event.target === overlay) removeOverlay();
  };

  /* ---------- Assemble ---------- */

  actions.appendChild(close);
  card.appendChild(heading);
  card.appendChild(body);
  card.appendChild(actions);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  /* ---------- Auto close ---------- */

  window.clearTimeout(overlay._timeoutId);
  overlay._timeoutId = window.setTimeout(() => {
    const current = document.getElementById("global-toast-overlay");
    current?.remove();
  }, duration);
};

// Lightweight top toast (no overlay) for quick status messages
export const showTopToast = (
  message: string,
  options: TopToastOptions = {}
) => {
  if (typeof document === "undefined") return;

  const { duration = 2000, tone = "success" } = options;

  const existing = document.getElementById("inline-toast");
  existing?.remove();

  const container = document.createElement("div");
  container.id = "inline-toast";
  container.style.cssText = [
    "position:fixed",
    "top:12px",
    "left:50%",
    "transform:translateX(-50%)",
    "z-index:2147483000",
    "width:min(96vw,420px)",
    "display:flex",
    "justify-content:center",
    "pointer-events:none",
  ].join(";");

  const card = document.createElement("div");
  const bg = tone === "error"
    ? "linear-gradient(135deg,#3b1a1d,#2a0f10)"
    : tone === "info"
      ? "linear-gradient(135deg,#0f1e2f,#0c1723)"
      : "linear-gradient(135deg,#0f2417,#0b1a12)";

  const fg = tone === "error" ? "#fde2e2" : tone === "info" ? "#e0edff" : "#d9fbe6";
  const border = tone === "error" ? "rgba(248,113,113,0.35)" : tone === "info" ? "rgba(96,165,250,0.35)" : "rgba(52,211,153,0.45)";
  const glow = tone === "error" ? "0 18px 40px rgba(248,113,113,0.18)" : tone === "info" ? "0 18px 40px rgba(96,165,250,0.18)" : "0 18px 40px rgba(52,211,153,0.2)";

  card.style.cssText = [
    `background:${bg}`,
    `color:${fg}`,
    `border:1px solid ${border}`,
    `box-shadow:${glow}, 0 8px 30px rgba(0,0,0,0.45)`,
    "border-radius:14px",
    "padding:12px 16px",
    "font-family:'Space Grotesk','Inter',system-ui,-apple-system,sans-serif",
    "font-weight:700",
    "letter-spacing:0.15px",
    "text-align:center",
    "pointer-events:auto",
    "font-size:13px",
    "line-height:1.35",
    "opacity:0",
    "transform:translateY(-8px) scale(0.98)",
    "transition:opacity 180ms ease, transform 180ms ease",
  ].join(";");

  card.textContent = message;

  container.appendChild(card);
  document.body.appendChild(container);

  requestAnimationFrame(() => {
    card.style.opacity = "1";
    card.style.transform = "translateY(0) scale(1)";
  });

  window.clearTimeout((container as any)._timeoutId);
  (container as any)._timeoutId = window.setTimeout(() => {
    const current = document.getElementById("inline-toast");
    if (current) {
      (current.firstChild as HTMLElement).style.opacity = "0";
      (current.firstChild as HTMLElement).style.transform = "translateY(-6px) scale(0.98)";
      setTimeout(() => current.remove(), 200);
    }
  }, duration);
};
