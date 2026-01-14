/* ---------- Types ---------- */

interface ToastOverlay extends HTMLDivElement {
  _timeoutId?: number;
}

type ToastOptions = {
  title?: string;
  duration?: number;
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
    "border:1px solid rgba(255,255,255,0.08)",
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
    "border:1px solid rgba(255,255,255,0.12)",
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
