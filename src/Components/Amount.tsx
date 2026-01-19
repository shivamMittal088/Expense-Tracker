import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAppSelector } from "../store/hooks";

interface AmountProps {
  value: number;
  currency?: "INR" | "USD" | "EUR";
  className?: string;
  showCurrency?: boolean;
  size?: "sm" | "md" | "lg";
}

const currencySymbols: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
};

export default function Amount({
  value,
  currency = "INR",
  className = "",
  showCurrency = true,
  size = "md",
}: AmountProps) {
  const hideAmounts = useAppSelector((state) => state.amount.hideAmounts);
  const [revealed, setRevealed] = useState(false);
  const prevHideAmounts = useRef(hideAmounts);

  // Auto-hide after 3 seconds when revealed
  useEffect(() => {
    if (revealed && hideAmounts) {
      const timer = setTimeout(() => setRevealed(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [revealed, hideAmounts]);

  // Reset revealed state when hideAmounts changes (using ref to avoid sync setState)
  useEffect(() => {
    if (prevHideAmounts.current !== hideAmounts) {
      prevHideAmounts.current = hideAmounts;
      if (hideAmounts) {
        // Delay the reset slightly to avoid sync setState
        const timer = setTimeout(() => setRevealed(false), 0);
        return () => clearTimeout(timer);
      }
    }
  }, [hideAmounts]);

  const symbol = currencySymbols[currency] || "₹";
  const formattedValue = value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const shouldHide = hideAmounts && !revealed;

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-lg",
  };

  if (shouldHide) {
    return (
      <button
        onClick={() => setRevealed(true)}
        className={`inline-flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity ${sizeClasses[size]} ${className}`}
        title="Tap to reveal"
      >
        {showCurrency && <span>{symbol}</span>}
        <span className="tracking-widest">•••••</span>
        <EyeOff className="w-3 h-3 opacity-50" />
      </button>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 ${sizeClasses[size]} ${className}`}>
      {showCurrency && symbol}
      {formattedValue}
      {hideAmounts && revealed && (
        <Eye className="w-3 h-3 opacity-50 text-green-400" />
      )}
    </span>
  );
}

// Simple version without interactivity - just shows hidden or value
export function AmountText({
  value,
  currency = "INR",
  className = "",
}: {
  value: number;
  currency?: "INR" | "USD" | "EUR";
  className?: string;
}) {
  const hideAmounts = useAppSelector((state) => state.amount.hideAmounts);
  const symbol = currencySymbols[currency] || "₹";
  
  // Handle undefined/null/NaN values
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;

  const formatted = safeValue.toLocaleString("en-IN", { minimumFractionDigits: 2 });
  
  if (hideAmounts) {
    return <>{symbol}•••••</>;
  }
  
  return <>{symbol}{formatted}</>;
}
