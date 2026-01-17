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
    <label className="text-[10px] font-medium text-neutral-500 mb-1 block tracking-wide uppercase">{label}</label>
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-white transition-colors duration-200">
          {icon}
        </span>
      )}
      <input
        {...props}
        className={`w-full ${
          icon ? "pl-9" : "pl-3"
        } py-2 bg-black/60 border border-neutral-800 rounded-lg text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-700 focus:bg-black transition-all duration-200`}
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
    <label className="text-[10px] font-medium text-neutral-500 mb-1 block tracking-wide uppercase">Password</label>
    <div className="relative">
      <Lock
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-white transition-colors duration-200"
      />
      <input
        type={show ? "text" : "password"}
        name="password"
        value={value}
        onChange={onChange}
        className="w-full pl-9 pr-9 py-2 bg-black/60 border border-neutral-800 rounded-lg text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-700 focus:bg-black transition-all duration-200"
      />
      <button
        type="button"
        onClick={toggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-white transition-colors duration-200"
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
    <div>
      <NavBar />
    </div>
    <div className="min-h-[80vh] bg-black flex items-center justify-center px-4 lg:pt-16 xl:pt-20">
      
      {/* Subtle background texture */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-neutral-900/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] bg-neutral-800/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-[320px] lg:max-w-[300px] bg-neutral-950 border border-neutral-800/80 rounded-2xl shadow-2xl shadow-black overflow-hidden">
        
        {/* Decorative top line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent"></div>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 lg:px-5 lg:pt-5 lg:pb-3 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 lg:w-10 lg:h-10 rounded-xl bg-white mb-3 lg:mb-2 shadow-lg shadow-white/10">
            <User size={22} className="text-black lg:hidden" />
            <User size={18} className="text-black hidden lg:block" />
          </div>
          <h1 className="text-lg lg:text-base font-bold text-white mb-1 tracking-tight">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-xs text-neutral-500">
            {isLogin
              ? "Sign in to continue tracking"
              : "Start your expense journey"}
          </p>
        </div>

        <div className="px-6 pb-6 lg:px-5 lg:pb-5">

          {/* Toggle */}
          <div className="flex mb-5 lg:mb-4 bg-black rounded-lg p-0.5 border border-neutral-800">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-all duration-300 ${
                isLogin
                  ? "bg-white text-black shadow-lg"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-all duration-300 ${
                !isLogin
                  ? "bg-white text-black shadow-lg"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-2.5">

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
                  className="text-[10px] text-neutral-500 hover:text-white transition-colors duration-200"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 mt-1 bg-white hover:bg-neutral-100 text-black text-sm font-semibold rounded-lg shadow-lg shadow-white/10 hover:shadow-white/20 transform hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
            >
              {isLogin ? "Sign In" : "Create Account"}
            </button>

            <p className="text-center text-[11px] text-neutral-600 pt-2">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-white hover:underline"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative bg-neutral-950 border border-neutral-800 rounded-xl w-[300px] p-5 shadow-2xl shadow-black">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent"></div>
            
            <button
              onClick={() => setShowForgot(false)}
              className="absolute top-4 right-4 text-neutral-600 hover:text-white transition-colors duration-200"
            >
              <X size={16} />
            </button>

            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white mb-3 shadow-lg shadow-white/10">
                <Mail size={18} className="text-black" />
              </div>
              <h2 className="text-base font-bold text-white mb-1">
                Reset Password
              </h2>
              <p className="text-xs text-neutral-500">We'll send you a reset link</p>
            </div>

            <input
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full bg-black/60 border border-neutral-800 rounded-lg py-2 px-3 text-white text-sm mb-4 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-700 transition-all duration-200"
              placeholder="you@example.com"
            />

            <button className="w-full py-2.5 bg-white hover:bg-neutral-100 text-black text-sm font-semibold rounded-lg shadow-lg shadow-white/10 hover:shadow-white/20 transform hover:scale-[1.01] active:scale-[0.99] transition-all duration-200">
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
