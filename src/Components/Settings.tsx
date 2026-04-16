import { useState, useEffect } from "react";
import {
  LogOut,
  ChevronRight,
  Key,
  EyeOff,
  Eye,
  HelpCircle,
  Bell,
  Sun,
  Moon,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Api from "../routeWrapper/Api";
import { showTopToast } from "../utils/Redirecttoast";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setHideAmounts as setHideAmountsAction } from "../store/slices/amountSlice";
import { clearUserProfile } from "../store/slices/userSlice";
import { toggleTheme } from "../store/slices/themeSlice";
import { usePushNotifications } from "../hooks/usePushNotifications";

export default function Settings() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const hideAmounts = useAppSelector((state) => state.amount.hideAmounts);
  const theme = useAppSelector((state) => state.theme.theme);
  const setHideAmounts = (value: boolean) => dispatch(setHideAmountsAction(value));
  const [hideAmountsUpdating, setHideAmountsUpdating] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const { isSubscribed: pushEnabled, isLoading: pushLoading, isSupported: pushSupported, isBlocked: pushBlocked, toggle: togglePush } = usePushNotifications();
  const [testingPush, setTestingPush] = useState(false);
  const [dailyReminderTime, setDailyReminderTime] = useState("21:00");
  const [savedReminderTime, setSavedReminderTime] = useState("21:00");
  const [reminderSaving, setReminderSaving] = useState(false);

  // Load saved reminder time from profile on mount
  useEffect(() => {
    Api.get<{ dailyReminderTime?: string }>("/api/profile/view")
      .then((res) => {
        const t = res.data?.dailyReminderTime;
        if (t) {
          setDailyReminderTime(t);
          setSavedReminderTime(t);
        }
      })
      .catch(() => {/* non-critical */});
  }, []);

  // Derived hour/minute/period for the custom picker
  const reminderHour24 = parseInt(dailyReminderTime.split(":")[0], 10);
  const reminderMinute = dailyReminderTime.split(":")[1] ?? "00";
  const reminderPeriod = reminderHour24 >= 12 ? "PM" : "AM";
  const reminderHour12 = reminderHour24 % 12 === 0 ? 12 : reminderHour24 % 12;

  const setReminderFromParts = (h12: number, min: string, period: string) => {
    let h24 = h12 % 12;
    if (period === "PM") h24 += 12;
    setDailyReminderTime(`${String(h24).padStart(2, "0")}:${min}`);
  };

  const sendTestNotification = async () => {
    setTestingPush(true);
    try {
      await Api.post("/api/push/test");
      showTopToast("Test notification sent! Check your notifications.", { duration: 2500 });
    } catch (err) {
      const e = err as { response?: { data?: { reasons?: string[]; reason?: string; message?: string } } };
      const reason = e?.response?.data?.reasons?.[0] || e?.response?.data?.reason || e?.response?.data?.message || "Unknown error";
      console.error("Test push failed:", reason, err);
      showTopToast(`Push failed: ${reason}`, { tone: "error" });
    } finally {
      setTestingPush(false);
    }
  };

  const handleLogout = async () => {
    try {
      await Api.post("/api/auth/logout");
      dispatch(clearUserProfile());
      window.location.href = "/login";
    } catch {
      showTopToast("Failed to logout", { tone: "error" });
    }
  };

  const handleHideAmountsToggle = async (nextValue: boolean) => {
    if (hideAmountsUpdating) return;
    setHideAmountsUpdating(true);
    try {
      await Api.patch("/api/profile/update", { hideAmounts: nextValue });
      setHideAmounts(nextValue);
      showTopToast(nextValue ? "Amounts hidden" : "Amounts visible", { duration: 1500 });
    } catch {
      showTopToast("Failed to update hide amounts setting", { tone: "error" });
    } finally {
      setHideAmountsUpdating(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 pb-28">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Settings</h1>
        <p className="text-sm text-white/40 mt-1">Personalize your experience and privacy.</p>
      </div>

      {/* User Preferences */}
      <section className="mb-6">
        <h2 className="text-[11px] font-semibold text-white/45 uppercase tracking-[0.2em] mb-3 px-1">
          User Preferences
        </h2>
        <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/4 via-transparent to-white/2 shadow-[0_0_24px_rgba(255,255,255,0.03)] overflow-hidden">
          <SettingToggle
            icon={theme === "dark" ? Moon : Sun}
            label="Dark Mode"
            description="Switch between light and dark theme"
            enabled={theme === "dark"}
            onChange={() => dispatch(toggleTheme())}
          />
        </div>
      </section>

      {/* Privacy */}
      <section className="mb-6">
        <h2 className="text-[11px] font-semibold text-white/45 uppercase tracking-[0.2em] mb-3 px-1">
          Privacy
        </h2>
        <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/4 via-transparent to-white/2 shadow-[0_0_24px_rgba(255,255,255,0.03)] overflow-hidden">
          <SettingToggle
            icon={hideAmounts ? EyeOff : Eye}
            label="Hide Amounts"
            description="Blur amounts until tapped (for privacy)"
            enabled={hideAmounts}
            disabled={hideAmountsUpdating}
            onChange={handleHideAmountsToggle}
          />
        </div>
      </section>

      {/* Notifications */}
      <section className="mb-6">
        <h2 className="text-[11px] font-semibold text-white/45 uppercase tracking-[0.2em] mb-3 px-1">
          Notifications
        </h2>
        <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/4 via-transparent to-white/2 shadow-[0_0_24px_rgba(255,255,255,0.03)] overflow-hidden">
          {pushBlocked ? (
            <div className="flex items-start gap-3 px-4 py-4">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0">
                <Bell className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-white">Push Notifications</p>
                <p className="text-[11px] text-red-400 mt-0.5">Blocked by browser</p>
                <p className="text-[11px] text-white/40 mt-1">
                  Click the lock icon in your browser's address bar, set Notifications to <span className="text-white/60 font-medium">Allow</span>, then reload the page.
                </p>
              </div>
            </div>
          ) : (
            <>
              <SettingToggle
                icon={Bell}
                label="Push Notifications"
                description={pushSupported ? "Get notified about expense reminders" : "Not supported in this browser"}
                enabled={pushEnabled}
                disabled={pushLoading || !pushSupported}
                onChange={togglePush}
              />
              {pushEnabled && (
                <>
                  <div className="h-px bg-white/5" />
                  {/* Daily reminder time picker */}
                  <div className="px-4 py-3.5 flex flex-col gap-3">
                    {/* Top row: icon + label */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                        <Clock className="w-4 h-4 text-white/60" />
                      </div>
                      <div>
                        <p className="text-sm text-white">Daily Reminder</p>
                        <p className="text-[11px] text-white/40">
                          {savedReminderTime === dailyReminderTime
                            ? `Reminder set for ${reminderHour12}:${reminderMinute} ${reminderPeriod}`
                            : "Get notified at this time every day"}
                        </p>
                      </div>
                    </div>
                    {/* Bottom row: controls aligned under label */}
                    <div className="flex items-center gap-2 pl-12">
                      <select
                        value={reminderHour12}
                        onChange={(e) => setReminderFromParts(Number(e.target.value), reminderMinute, reminderPeriod)}
                        className="bg-white/8 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white/80 focus:outline-none focus:border-emerald-500/40 appearance-none text-center w-12 cursor-pointer"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                          <option key={h} value={h} className="bg-zinc-900">{String(h).padStart(2, "0")}</option>
                        ))}
                      </select>
                      <span className="text-white/30 font-medium text-sm">:</span>
                      <select
                        value={reminderMinute}
                        onChange={(e) => setReminderFromParts(reminderHour12, e.target.value, reminderPeriod)}
                        className="bg-white/8 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white/80 focus:outline-none focus:border-emerald-500/40 appearance-none text-center w-14 cursor-pointer"
                      >
                        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((m) => (
                          <option key={m} value={m} className="bg-zinc-900">{m}</option>
                        ))}
                      </select>
                      <div className="flex rounded-lg border border-white/10 overflow-hidden">
                        {(["AM", "PM"] as const).map((p) => (
                          <button
                            key={p}
                            onClick={() => setReminderFromParts(reminderHour12, reminderMinute, p)}
                            className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                              reminderPeriod === p
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-white/5 text-white/40 hover:text-white/60"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={async () => {
                          setReminderSaving(true);
                          try {
                            await Api.patch("/api/profile/update", {
                              dailyReminderTime,
                              tzOffsetMinutes: new Date().getTimezoneOffset(),
                            });
                            setSavedReminderTime(dailyReminderTime);
                            showTopToast(`Reminder set for ${reminderHour12}:${reminderMinute} ${reminderPeriod}`, { duration: 1500 });
                          } catch {
                            showTopToast("Failed to save reminder time", { tone: "error" });
                          } finally {
                            setReminderSaving(false);
                          }
                        }}
                        disabled={savedReminderTime === dailyReminderTime || reminderSaving}
                        className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25"
                      >
                        {reminderSaving ? "Saving…" : "Set"}
                      </button>
                    </div>
                  </div>
                  <div className="h-px bg-white/5" />
                  <button
                    onClick={sendTestNotification}
                    disabled={testingPush}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition-colors disabled:opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                        <Bell className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm text-white text-left">Send Test Notification</p>
                        <p className="text-[11px] text-white/40">Verify push is working</p>
                      </div>
                    </div>
                    {testingPush && <span className="text-[11px] text-white/40">Sending…</span>}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* Account */}
      <section className="mb-6">
        <h2 className="text-[11px] font-semibold text-white/45 uppercase tracking-[0.2em] mb-3 px-1">
          Account
        </h2>
        <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/4 via-transparent to-white/2 shadow-[0_0_24px_rgba(255,255,255,0.03)] overflow-hidden">
          <SettingButton
            icon={Key}
            label="Update Password"
            onClick={() => setShowPasswordModal(true)}
          />
          <div className="h-px bg-white/5" />
          <SettingButton
            icon={LogOut}
            label="Log Out"
            onClick={() => setShowLogoutConfirm(true)}
          />
        </div>
      </section>

      {/* Help & FAQs */}
      <section className="mb-6">
        <h2 className="text-[11px] font-semibold text-white/45 uppercase tracking-[0.2em] mb-3 px-1">
          Help & FAQs
        </h2>
        <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/4 via-transparent to-white/2 shadow-[0_0_24px_rgba(255,255,255,0.03)] overflow-hidden">
          <SettingButton
            icon={HelpCircle}
            label="Help & FAQs"
            onClick={() => navigate('/help')}
          />
        </div>
      </section>

      {/* Logout Confirmation */}
      {showLogoutConfirm && (
        <ConfirmModal
          title="Log Out?"
          message="Are you sure you want to log out?"
          confirmLabel="Log Out"
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogout}
        />
      )}

      {/* Update Password Modal */}
      {showPasswordModal && (
        <PasswordModal
          onClose={() => setShowPasswordModal(false)}
        />
      )}
    </div>
  );
}

/* ---------- Sub-components ---------- */

interface SettingToggleProps {
  icon: React.ElementType;
  label: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}

function SettingToggle({ icon: Icon, label, description, enabled, disabled, onChange }: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
          <Icon className="w-4 h-4 text-white/60" />
        </div>
        <div>
          <p className="text-sm text-white">{label}</p>
          <p className="text-[11px] text-white/40">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        disabled={disabled}
        className={`w-11 h-6 rounded-full transition-colors relative border ${
          enabled ? "bg-emerald-500/70 border-emerald-500/60" : "bg-white/5 border-white/10"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            enabled ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

interface SettingButtonProps {
  icon: React.ElementType;
  label: string;
  danger?: boolean;
  onClick: () => void;
}

function SettingButton({ icon: Icon, label, danger, onClick }: SettingButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-4 hover:bg-white/5 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
          danger ? "bg-red-500/10 border-red-500/20" : "bg-white/5 border-white/10"
        }`}>
          <Icon className={`w-4 h-4 ${danger ? "text-red-400" : "text-white/60"}`} />
        </div>
        <p className={`text-sm ${danger ? "text-red-400" : "text-white"}`}>{label}</p>
      </div>
      <ChevronRight className={`w-4 h-4 ${danger ? "text-red-400/50" : "text-white/25"}`} />
    </button>
  );
}

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmModal({ title, message, confirmLabel, danger, onCancel, onConfirm }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-70 rounded-xl border border-white/25 bg-[#1a1a1a] p-4 text-center">
        <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
        <p className="text-[11px] text-gray-400 mb-4">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-[11px] font-medium text-gray-300 rounded-lg border border-white/20 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2 text-[11px] font-semibold text-white rounded-lg transition-colors ${
              danger ? "bg-red-500/90 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface PasswordModalProps {
  onClose: () => void;
}

function PasswordModal({ onClose }: PasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await Api.patch("/api/auth/update/password", {
        oldPassword: currentPassword,
        newPassword: newPassword,
      });
      showTopToast("Password updated. Please login again.", { duration: 2500 });
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError?.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-75 rounded-xl border border-white/25 bg-[#1a1a1a] p-4">
        <h3 className="text-sm font-semibold text-white mb-4 text-center">Update Password</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg bg-[#2a2a2a] border border-white/20 px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-white/30 focus:outline-none"
              placeholder="Enter current password"
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg bg-[#2a2a2a] border border-white/20 px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-white/30 focus:outline-none"
              placeholder="Enter new password"
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg bg-[#2a2a2a] border border-white/20 px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-white/30 focus:outline-none"
              placeholder="Confirm new password"
            />
          </div>

          {error && (
            <p className="text-[10px] text-red-400 text-center">{error}</p>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-[11px] font-medium text-gray-300 rounded-lg border border-white/20 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2 text-[11px] font-semibold text-white rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {loading ? "..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
}
