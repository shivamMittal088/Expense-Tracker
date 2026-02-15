import { useState, useEffect } from "react";
import {
  Volume2,
  VolumeX,
  Shield,
  LogOut,
  ChevronRight,
  Loader2,
  Key,
  EyeOff,
  Eye,
  Target,
  Flame,
} from "lucide-react";
import Api from "../routeWrapper/Api";
import { showTopToast } from "../utils/Redirecttoast";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { setHideAmounts as setHideAmountsAction } from "../store/slices/amountSlice";
import { updateDailyBudget } from "../store/slices/budgetSlice";

interface UserSettings {
  soundEnabled: boolean;
  currency: "INR" | "USD" | "EUR";
}

export default function Settings() {
  const hideAmounts = useAppSelector((state) => state.amount.hideAmounts);
  const { dailyBudget: reduxDailyBudget } = useAppSelector((state) => state.budget);
  const dispatch = useAppDispatch();
  const setHideAmounts = (value: boolean) => dispatch(setHideAmountsAction(value));
  const [settings, setSettings] = useState<UserSettings>({
    soundEnabled: true,
    currency: "INR",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Daily budget for streak tracking (use Redux value as initial)
  const [dailyBudget, setDailyBudget] = useState<number>(reduxDailyBudget);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");

  // Sync local state with Redux when it changes
  useEffect(() => {
    setDailyBudget(reduxDailyBudget);
  }, [reduxDailyBudget]);

  useEffect(() => {
    // Load settings from localStorage and API
    const savedSound = localStorage.getItem("soundEnabled");
    if (savedSound !== null) {
      setSettings((prev) => ({ ...prev, soundEnabled: savedSound === "true" }));
    }

    Api.get("/api/profile/view")
      .then(({ data }) => {
        setSettings((prev) => ({
          ...prev,
          currency: data.currency || "INR",
        }));
        if (typeof data.dailyBudget === 'number') {
          setDailyBudget(data.dailyBudget);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateSetting = async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    const oldValue = settings[key];
    setSettings((prev) => ({ ...prev, [key]: value }));

    // Handle local-only settings
    if (key === "soundEnabled") {
      localStorage.setItem("soundEnabled", String(value));
      showTopToast(value ? "Sound enabled" : "Sound disabled", { duration: 1500 });
      return;
    }

    // Sync with API for profile-related settings
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      if (key === "currency") {
        payload.currency = value;
      }

      await Api.patch("/api/profile/update", payload);
      showTopToast("Settings saved", { duration: 1500 });
    } catch {
      setSettings((prev) => ({ ...prev, [key]: oldValue }));
      showTopToast("Failed to save setting", { tone: "error", duration: 2000 });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await Api.post("/api/auth/logout");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    } catch {
      showTopToast("Failed to logout", { tone: "error" });
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 pb-28">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Settings</h1>
        <p className="text-sm text-white/40 mt-1">Personalize your experience and privacy.</p>
      </div>

      {/* Sound & Notifications */}
      <section className="mb-6">
        <h2 className="text-[11px] font-semibold text-white/45 uppercase tracking-[0.2em] mb-3 px-1">
          Sound & Notifications
        </h2>
        <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/4 via-transparent to-white/2 shadow-[0_0_24px_rgba(255,255,255,0.03)] overflow-hidden">
          <SettingToggle
            icon={settings.soundEnabled ? Volume2 : VolumeX}
            label="Toast Sounds"
            description="Play sound when notifications appear"
            enabled={settings.soundEnabled}
            onChange={(v) => updateSetting("soundEnabled", v)}
          />
        </div>
      </section>

      {/* Budget Streak */}
      <section className="mb-6">
        <h2 className="text-[11px] font-semibold text-white/45 uppercase tracking-[0.2em] mb-3 px-1">
          Budget Streak
        </h2>
        <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/4 via-transparent to-white/2 shadow-[0_0_24px_rgba(255,255,255,0.03)] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
                <Flame className="w-4 h-4 text-orange-300" />
              </div>
              <div>
                <p className="text-sm text-white">Daily Budget</p>
                <p className="text-[11px] text-white/40">Stay under this to build your streak</p>
              </div>
            </div>
            {isEditingBudget ? (
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-sm">₹</span>
                <input
                  type="number"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="w-24 bg-white/5 border border-orange-500/50 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-orange-400"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const value = parseFloat(budgetInput) || 0;
                      setIsEditingBudget(false);
                      dispatch(updateDailyBudget(value))
                        .unwrap()
                        .then(() => {
                          showTopToast(value > 0 ? `Daily budget set to ₹${value}` : 'Daily budget cleared', { duration: 1500 });
                        })
                        .catch(() => {
                          showTopToast('Failed to save budget', { tone: 'error' });
                        });
                    } else if (e.key === 'Escape') {
                      setIsEditingBudget(false);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const value = parseFloat(budgetInput) || 0;
                    setIsEditingBudget(false);
                    dispatch(updateDailyBudget(value))
                      .unwrap()
                      .then(() => {
                        showTopToast(value > 0 ? `Daily budget set to ₹${value}` : 'Daily budget cleared', { duration: 1500 });
                      })
                      .catch(() => {
                        showTopToast('Failed to save budget', { tone: 'error' });
                      });
                  }}
                  className="text-orange-300 hover:text-orange-200 text-xs font-medium"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setBudgetInput(dailyBudget > 0 ? dailyBudget.toString() : '');
                  setIsEditingBudget(true);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                {dailyBudget > 0 ? (
                  <>
                    <span className="text-sm font-medium text-white">₹{dailyBudget.toLocaleString()}</span>
                    <Target className="w-3 h-3 text-white/40" />
                  </>
                ) : (
                  <span className="text-xs text-white/50">Set budget</span>
                )}
              </button>
            )}
          </div>
          <div className="h-px bg-white/5" />
          <div className="px-4 py-3">
            <p className="text-[11px] text-white/40 leading-relaxed">
              🔥 Build a streak by spending ≤ your daily budget. Days with no spending count as under budget!
            </p>
          </div>
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
            onChange={(v) => {
              setHideAmounts(v);
              showTopToast(v ? "Amounts hidden" : "Amounts visible", { duration: 1500 });
            }}
          />
          <div className="h-px bg-white/5" />
          <SettingToggle
            icon={Shield}
            label="Private Account"
            description="Only approved followers can see your profile"
            enabled={false}
            onChange={() => {
              showTopToast("Coming soon", { tone: "info" });
            }}
          />
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

      {/* Version */}
      <p className="text-center text-[11px] text-white/30 mt-8">
        Expense Tracker v1.0.0
      </p>

      {/* Saving indicator */}
      {saving && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2 border border-white/10">
          <Loader2 className="w-3 h-3 text-white animate-spin" />
          <span className="text-xs text-white">Saving...</span>
        </div>
      )}

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
  onChange: (value: boolean) => void;
}

function SettingToggle({ icon: Icon, label, description, enabled, onChange }: SettingToggleProps) {
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
        className={`w-11 h-6 rounded-full transition-colors relative border ${
          enabled ? "bg-emerald-500/70 border-emerald-500/60" : "bg-white/5 border-white/10"
        }`}
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
