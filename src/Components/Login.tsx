import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  X,
} from "lucide-react";
import api from "../routeWrapper/Api";

import type {
  ChangeEvent,
  FormEvent,
  InputHTMLAttributes,
  ReactNode,
} from "react";
import NavBar from "./NavBar";

/* ---------------- Types ---------------- */

interface FormData {
  name: string;
  emailId: string;
  password: string;
  confirmPassword: string;
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
}

interface PasswordInputProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  show: boolean;
  toggle: () => void;
}

/* ---------------- Inputs ---------------- */

const Input = ({ label, icon, ...props }: InputProps) => (
  <div>
    <label className="text-[11px] font-medium text-white/50 mb-1 block">{label}</label>
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
          {icon}
        </span>
      )}
      <input
        {...props}
        className={`w-full ${
          icon ? "pl-9" : "pl-3"
        } pr-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors`}
      />
    </div>
  </div>
);

const PasswordInput = ({
  value,
  onChange,
  show,
  toggle,
}: PasswordInputProps) => (
  <div>
    <label className="text-[11px] font-medium text-white/50 mb-1 block">Password</label>
    <div className="relative">
      <Lock
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
      />
      <input
        type={show ? "text" : "password"}
        name="password"
        value={value}
        onChange={onChange}
        className="w-full pl-9 pr-9 py-2 bg-black border border-white/10 rounded-lg text-white text-sm placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors"
      />
      <button
        type="button"
        onClick={toggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50"
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  </div>
);

/* ---------------- Component ---------------- */

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const navigate = useNavigate();


  const [formData, setFormData] = useState<FormData>({
    name: "",
    emailId: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /* -------- API Submit -------- */

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      if (isLogin) {
        // LOGIN
        const res = await api.post("/api/auth/login", {
          emailId: formData.emailId,
          password: formData.password,
        });

        navigate("/");
        console.log(res.data);
      } else {
        // SIGNUP
        if (formData.password !== formData.confirmPassword) {
          alert("Passwords do not match");
          return;
        }

        await api.post("/api/auth/signup", {
          name: formData.name,
          emailId: formData.emailId,
          password: formData.password,
        });
        navigate("/");
      }
    } catch (error) {
  if (axios.isAxiosError(error)) {
    alert(error.response?.data?.message || "Request failed");
  } else {
    alert("Something went wrong");
  }
}

  };

  return (
    <>
      <NavBar />
      <div className="min-h-[calc(100vh-60px)] bg-black flex items-center justify-center px-4 py-6">
        {/* Card */}
        <div className="w-full max-w-[300px] bg-[#0a0a0a] border border-white/[0.08] rounded-xl overflow-hidden">
        
          {/* Header */}
          <div className="px-5 pt-5 pb-3 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white mb-3">
              <User size={18} className="text-black" />
            </div>
            <h1 className="text-base font-semibold text-white">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-xs text-white/40 mt-0.5">
              {isLogin
                ? "Sign in to continue"
                : "Start tracking expenses"}
            </p>
          </div>

          <div className="px-5 pb-5">
            {/* Toggle */}
            <div className="flex mb-4 bg-black rounded-lg p-0.5 border border-white/10">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  isLogin
                    ? "bg-white text-black"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  !isLogin
                    ? "bg-white text-black"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">

            {!isLogin && (
              <Input
                label="Full Name"
                icon={<User size={14} />}
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            )}

            <Input
              label="Email"
              icon={<Mail size={14} />}
              name="emailId"
              value={formData.emailId}
              onChange={handleChange}
            />

            <PasswordInput
              value={formData.password}
              onChange={handleChange}
              show={showPassword}
              toggle={() => setShowPassword(!showPassword)}
            />

            {!isLogin && (
              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            )}

              {isLogin && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-[10px] text-white/40 hover:text-white/60"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 mt-1 bg-white hover:bg-white/90 text-black text-sm font-medium rounded-lg transition-colors"
              >
                {isLogin ? "Sign In" : "Create Account"}
              </button>

              <p className="text-center text-[11px] text-white/40 pt-2">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-white hover:text-white/80"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
            </form>
          </div>
        </div>

        {/* Forgot Password Modal */}
        {showForgot && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <div className="relative bg-[#0a0a0a] border border-white/[0.08] rounded-xl w-full max-w-[280px] p-5">
              <button
                onClick={() => setShowForgot(false)}
                className="absolute top-3 right-3 text-white/30 hover:text-white/60"
              >
                <X size={16} />
              </button>

              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white mb-3">
                  <Mail size={16} className="text-black" />
                </div>
                <h2 className="text-sm font-semibold text-white">Reset Password</h2>
                <p className="text-[11px] text-white/40 mt-0.5">We'll send you a reset link</p>
              </div>

              <input
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-lg py-2 px-3 text-white text-sm mb-3 placeholder-white/25 focus:outline-none focus:border-white/30"
                placeholder="you@example.com"
              />

              <button className="w-full py-2 bg-white hover:bg-white/90 text-black text-sm font-medium rounded-lg transition-colors">
                Send Reset Link
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Login;
