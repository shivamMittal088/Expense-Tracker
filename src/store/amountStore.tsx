import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AmountContextType {
  hideAmounts: boolean;
  setHideAmounts: (value: boolean) => void;
  toggleHideAmounts: () => void;
}

const AmountContext = createContext<AmountContextType | undefined>(undefined);

export function AmountProvider({ children }: { children: ReactNode }) {
  const [hideAmounts, setHideAmounts] = useState(() => {
    const saved = localStorage.getItem("hideAmounts");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("hideAmounts", String(hideAmounts));
  }, [hideAmounts]);

  const toggleHideAmounts = () => setHideAmounts((prev) => !prev);

  return (
    <AmountContext.Provider value={{ hideAmounts, setHideAmounts, toggleHideAmounts }}>
      {children}
    </AmountContext.Provider>
  );
}

export function useAmountVisibility() {
  const context = useContext(AmountContext);
  if (!context) {
    throw new Error("useAmountVisibility must be used within AmountProvider");
  }
  return context;
}
