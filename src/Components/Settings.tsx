import { useState, useEffect } from "react";
import {
  Bell,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Globe,
  Shield,
  Trash2,
  LogOut,
  ChevronRight,
  Loader2,
  Key,
} from "lucide-react";
import Api from "../routeWrapper/Api";
import { showTopToast } from "../utils/Redirecttoast";

interface UserSettings {
  soundEnabled: boolean;
  notifications: boolean;
  currency: "INR" | "USD" | "EUR";
  darkMode: boolean;
  startWeekOnMonday: boolean;
}

const currencies = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
];

export default function Settings() {
  const [settings, setSettings] = useState<UserSettings>({
    soundEnabled: true,
    notifications: true,
    currency: "INR",
    darkMode: true,
    startWeekOnMonday: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

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
          darkMode: data.preferences?.darkMode ?? true,
          startWeekOnMonday: data.preferences?.startWeekOnMonday ?? false,
        }));
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
      } else if (key === "darkMode" || key === "startWeekOnMonday") {
        payload.preferences = {
          ...settings,
          [key]: value,
        };
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
      window.location.href = "/login";
    } catch {
      showTopToast("Failed to logout", { tone: "error" });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await Api.delete("/api/profile/delete");
      window.location.href = "/login";
    } catch {
      showTopToast("Failed to delete account", { tone: "error" });
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
    <div className="max-w-md mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-white mb-6">Settings</h1>

      {/* Sound & Notifications */}
      <section className="mb-6">
        <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
          Sound & Notifications
        </h2>
        <div className="rounded-xl border border-white/10 bg-[#111] overflow-hidden">
          <SettingToggle
            icon={settings.soundEnabled ? Volume2 : VolumeX}
            label="Toast Sounds"
            description="Play sound when notifications appear"
            enabled={settings.soundEnabled}
            onChange={(v) => updateSetting("soundEnabled", v)}
          />
          <div className="h-px bg-white/5" />
          <SettingToggle
            icon={Bell}
            label="Push Notifications"
            description="Receive expense reminders"
            enabled={settings.notifications}
            onChange={(v) => updateSetting("notifications", v)}
          />
        </div>
      </section>

      {/* Appearance */}
      <section className="mb-6">
        <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
          Appearance
        </h2>
        <div className="rounded-xl border border-white/10 bg-[#111] overflow-hidden">
          <SettingToggle
            icon={settings.darkMode ? Moon : Sun}
            label="Dark Mode"
            description="Use dark theme"
            enabled={settings.darkMode}
            onChange={(v) => updateSetting("darkMode", v)}
          />
        </div>
      </section>

      {/* Preferences */}
      <section className="mb-6">
        <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
          Preferences
        </h2>
        <div className="rounded-xl border border-white/10 bg-[#111] overflow-hidden">
          {/* Currency Selector */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <Globe className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-white">Currency</p>
                <p className="text-[10px] text-gray-500">Default currency for expenses</p>
              </div>
            </div>
            <select
              value={settings.currency}
              onChange={(e) => updateSetting("currency", e.target.value as UserSettings["currency"])}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-white/20"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code} className="bg-[#1a1a1a]">
                  {c.symbol} {c.code}
                </option>
              ))}
            </select>
          </div>

          <div className="h-px bg-white/5" />

          <SettingToggle
            icon={Globe}
            label="Week Starts Monday"
            description="Calendar week begins on Monday"
            enabled={settings.startWeekOnMonday}
            onChange={(v) => updateSetting("startWeekOnMonday", v)}
          />
        </div>
      </section>

      {/* Account */}
      <section className="mb-6">
        <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
          Account
        </h2>
        <div className="rounded-xl border border-white/10 bg-[#111] overflow-hidden">
          <SettingButton
            icon={Key}
            label="Update Password"
            onClick={() => setShowPasswordModal(true)}
          />
          <div className="h-px bg-white/5" />
          <SettingButton
            icon={Shield}
            label="Privacy & Security"
            onClick={() => showTopToast("Coming soon", { tone: "info" })}
          />
          <div className="h-px bg-white/5" />
          <SettingButton
            icon={LogOut}
            label="Log Out"
            onClick={() => setShowLogoutConfirm(true)}
          />
          <div className="h-px bg-white/5" />
          <SettingButton
            icon={Trash2}
            label="Delete Account"
            danger
            onClick={() => setShowDeleteConfirm(true)}
          />
        </div>
      </section>

      {/* Version */}
      <p className="text-center text-[10px] text-gray-600 mt-8">
        Expense Tracker v1.0.0
      </p>

      {/* Saving indicator */}
      {saving && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2">
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

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Account?"
          message="This action cannot be undone. All your data will be permanently deleted."
          confirmLabel="Delete"
          danger
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteAccount}
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
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
          <Icon className="w-4 h-4 text-gray-400" />
        </div>
        <div>
          <p className="text-sm text-white">{label}</p>
          <p className="text-[10px] text-gray-500">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`w-10 h-6 rounded-full transition-colors relative ${
          enabled ? "bg-blue-500" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            enabled ? "left-5" : "left-1"
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
      className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          danger ? "bg-red-500/10" : "bg-white/5"
        }`}>
          <Icon className={`w-4 h-4 ${danger ? "text-red-400" : "text-gray-400"}`} />
        </div>
        <p className={`text-sm ${danger ? "text-red-400" : "text-white"}`}>{label}</p>
      </div>
      <ChevronRight className={`w-4 h-4 ${danger ? "text-red-400/50" : "text-gray-600"}`} />
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
      <div className="w-full max-w-[280px] rounded-xl border border-white/10 bg-[#1a1a1a] p-4 text-center">
        <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
        <p className="text-[11px] text-gray-400 mb-4">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-[11px] font-medium text-gray-300 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
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
      <div className="w-full max-w-[300px] rounded-xl border border-white/10 bg-[#1a1a1a] p-4">
        <h3 className="text-sm font-semibold text-white mb-4 text-center">Update Password</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg bg-[#2a2a2a] border border-white/10 px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-white/30 focus:outline-none"
              placeholder="Enter current password"
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg bg-[#2a2a2a] border border-white/10 px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-white/30 focus:outline-none"
              placeholder="Enter new password"
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg bg-[#2a2a2a] border border-white/10 px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-white/30 focus:outline-none"
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
            className="flex-1 py-2 text-[11px] font-medium text-gray-300 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
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
