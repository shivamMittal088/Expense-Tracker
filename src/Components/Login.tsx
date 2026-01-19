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
  <div className="group">
    <label className="text-xs font-medium text-white/60 mb-2 block">{label}</label>
    <div className="relative">
      {icon && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-white/60 transition-colors">
          {icon}
        </span>
      )}
      <input
        {...props}
        className={`w-full ${
          icon ? "pl-10" : "pl-4"
        } pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all`}
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
  <div className="group">
    <label className="text-xs font-medium text-white/60 mb-2 block">Password</label>
    <div className="relative">
      <Lock
        size={16}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-white/60 transition-colors"
      />
      <input
        type={show ? "text" : "password"}
        name="password"
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
      />
      <button
        type="button"
        onClick={toggle}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
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
      <div className="min-h-[calc(100vh-60px)] bg-[#0a0a0f] flex items-center justify-center px-4 py-8">
        {/* Card */}
        <div className="relative w-full max-w-[340px] bg-[#12121a] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        
          {/* Header */}
          <div className="px-6 pt-8 pb-4 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 mb-4 shadow-lg shadow-blue-500/20">
              <User size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white mb-1">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-sm text-white/50">
              {isLogin
                ? "Sign in to continue tracking"
                : "Start your expense journey"}
            </p>
          </div>

          <div className="px-6 pb-6">
            {/* Toggle */}
            <div className="flex mb-6 bg-white/5 rounded-xl p-1">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isLogin
                    ? "bg-blue-500 text-white shadow-lg"
                    : "text-white/50 hover:text-white/70"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  !isLogin
                    ? "bg-blue-500 text-white shadow-lg"
                    : "text-white/50 hover:text-white/70"
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

            {!isLogin && (
              <Input
                label="Full Name"
                icon={<User size={16} />}
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            )}

            <Input
              label="Email"
              icon={<Mail size={16} />}
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
                    className="text-xs text-white/40 hover:text-blue-400 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 mt-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200"
              >
                {isLogin ? "Sign In" : "Create Account"}
              </button>

              <p className="text-center text-sm text-white/40 pt-3">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
            </form>
          </div>
        </div>

        {/* Forgot Password Modal */}
        {showForgot && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative bg-[#12121a] border border-white/[0.08] rounded-2xl w-full max-w-[320px] p-6 shadow-2xl">
              <button
                onClick={() => setShowForgot(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white/70 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 mb-4 shadow-lg shadow-blue-500/20">
                  <Mail size={20} className="text-white" />
                </div>
                <h2 className="text-lg font-bold text-white mb-1">Reset Password</h2>
                <p className="text-sm text-white/50">We'll send you a reset link</p>
              </div>

              <input
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm mb-4 placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                placeholder="you@example.com"
              />

              <button className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200">
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
