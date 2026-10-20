import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import api from "../routeWrapper/Api";
import { useAppDispatch } from "../store/hooks";
import { clearUserProfile } from "../store/slices/userSlice";
import NavBar from "./NavBar";

export default function ResetPassword() {
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get("token") || "");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const dispatch = useAppDispatch();
  const validLink = /^[a-f0-9]{64}$/.test(token);

  useEffect(() => {
    window.history.replaceState(window.history.state, "", window.location.pathname);
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !validLink) return;
    if (password !== confirmation) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await api.post<{ message: string }>("/api/auth/reset-password", { token, newPassword: password });
      dispatch(clearUserProfile());
      setPassword("");
      setConfirmation("");
      setMessage(response.data.message);
    } catch (failure) {
      setError(axios.isAxiosError<{ message?: string }>(failure)
        ? failure.response?.data?.message || "Could not reset your password. Please try again."
        : "Could not reset your password. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return <>
    <NavBar />
    <main className="min-h-[calc(100dvh-84px)] bg-black flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[340px] bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
        <h1 className="text-lg font-semibold text-zinc-100 mb-4">Reset Password</h1>
        {!validLink ? <p role="alert" className="text-sm text-zinc-400">This reset link is invalid or missing. Request a new link from the sign-in page.</p>
          : message ? <p role="status" className="text-sm text-zinc-400">{message}</p>
          : <form onSubmit={submit} className="space-y-4">
            <label className="block text-xs text-zinc-400">
              New password
              <input required type="password" minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-zinc-100 text-sm" />
            </label>
            <label className="block text-xs text-zinc-400">
              Confirm password
              <input required type="password" minLength={8} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-1 w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-zinc-100 text-sm" />
            </label>
            <p className="text-xs text-zinc-400">Use at least 8 characters.</p>
            {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
            <button type="submit" disabled={busy} className="w-full py-2.5 bg-zinc-100 text-black text-sm font-semibold rounded-lg disabled:opacity-60">{busy ? "Resetting…" : "Reset Password"}</button>
          </form>}
        <Link to="/login" className="block mt-4 text-center text-xs text-zinc-400 underline">Back to sign in</Link>
      </div>
    </main>
  </>;
}
