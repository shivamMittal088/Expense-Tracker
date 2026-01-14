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
import api from "./Api";

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
    <label className="text-[11px] text-gray-500">{label}</label>
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
          {icon}
        </span>
      )}
      <input
        {...props}
        className={`w-full ${
          icon ? "pl-9" : "pl-3"
        } py-1.5 bg-[#111318] border border-gray-800 rounded-md text-white text-xs focus:outline-none focus:ring-1 focus:ring-gray-600`}
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
    <label className="text-[11px] text-gray-500">Password</label>
    <div className="relative">
      <Lock
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
      />
      <input
        type={show ? "text" : "password"}
        name="password"
        value={value}
        onChange={onChange}
        className="w-full pl-9 pr-9 py-1.5 bg-[#111318] border border-gray-800 rounded-md text-white text-xs focus:outline-none focus:ring-1 focus:ring-gray-600"
      />
      <button
        type="button"
        onClick={toggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
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
    <div className="mt-[10vh] bg-black flex items-center justify-center">

      <div className="w-[250px] bg-[#0d0f14] border border-gray-800 rounded-xl shadow-2xl">

        {/* Header */}
        <div className="px-3 py-3 border-b border-gray-800 text-center">
          <h1 className="text-sm font-semibold text-white">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-[11px] text-gray-500">
            {isLogin
              ? "Sign in to continue"
              : "Start tracking your expenses"}
          </p>
        </div>

        <div className="p-2">

          {/* Toggle */}
          <div className="flex mb-1.5 bg-[#111318] rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-1 text-xs rounded-md ${
                isLogin
                  ? "bg-[#1b1f2a] text-white"
                  : "text-gray-500"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-1 text-xs rounded-md ${
                !isLogin
                  ? "bg-[#1b1f2a] text-white"
                  : "text-gray-500"
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
                  className="text-[11px] text-gray-500 hover:text-white"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-1.5 bg-[#1b1f2a] hover:bg-[#252a3a] text-white text-xs rounded-md"
            >
              {isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#0d0f14] border border-gray-800 rounded-lg w-[280px] p-4 relative">
            <button
              onClick={() => setShowForgot(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-white"
            >
              <X size={14} />
            </button>

            <h2 className="text-xs font-semibold text-white mb-1">
              Reset Password
            </h2>

            <input
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full bg-[#111318] border border-gray-800 rounded-md py-1.5 px-3 text-white text-xs mb-3"
              placeholder="you@example.com"
            />

            <button className="w-full bg-[#1b1f2a] hover:bg-[#252a3a] py-1.5 text-white text-xs rounded-md">
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
