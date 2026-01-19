import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Delete, X } from "lucide-react";
import "./Calculator.css";

interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Calculator: React.FC<CalculatorProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState("0");
  const [equation, setEquation] = useState("");
  const [isNewNumber, setIsNewNumber] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const calculatorRef = useRef<HTMLDivElement>(null);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (calculatorRef.current && !calculatorRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 150);
  }, [onClose]);

  const handleNumber = (num: string) => {
    if (isNewNumber) {
      setDisplay(num);
      setIsNewNumber(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const handleOperator = (op: string) => {
    setEquation(display + " " + op + " ");
    setIsNewNumber(true);
  };

  const handleEquals = () => {
    try {
      const fullEquation = equation + display;
      const result = eval(fullEquation.replace("×", "*").replace("÷", "/"));
      setDisplay(String(result));
      setEquation("");
      setIsNewNumber(true);
    } catch {
      setDisplay("Error");
      setEquation("");
      setIsNewNumber(true);
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setEquation("");
    setIsNewNumber(true);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
      setIsNewNumber(true);
    }
  };

  const handleDecimal = () => {
    if (!display.includes(".")) {
      setDisplay(display + ".");
      setIsNewNumber(false);
    }
  };

  if (!isOpen) return null;

  const calculatorContent = (
    <div
      className={`calculator-overlay ${isClosing ? "closing" : ""}`}
      onClick={handleClose}
    >
      <div
        ref={calculatorRef}
        className={`calculator-modal ${isClosing ? "closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button className="calculator-close-btn" onClick={handleClose}>
          <X size={18} />
        </button>

        {/* Display */}
        <div className="calculator-display">
          <div className="calculator-equation">{equation || "\u00A0"}</div>
          <div className="calculator-result">{display}</div>
        </div>

        {/* Button Grid */}
        <div className="calculator-grid">
          <button onClick={handleClear} className="calc-btn calc-btn-func">AC</button>
          <button onClick={handleBackspace} className="calc-btn calc-btn-func"><Delete size={18} /></button>
          <button onClick={() => handleOperator("%")} className="calc-btn calc-btn-func">%</button>
          <button onClick={() => handleOperator("÷")} className="calc-btn calc-btn-op">÷</button>

          <button onClick={() => handleNumber("7")} className="calc-btn calc-btn-num">7</button>
          <button onClick={() => handleNumber("8")} className="calc-btn calc-btn-num">8</button>
          <button onClick={() => handleNumber("9")} className="calc-btn calc-btn-num">9</button>
          <button onClick={() => handleOperator("×")} className="calc-btn calc-btn-op">×</button>

          <button onClick={() => handleNumber("4")} className="calc-btn calc-btn-num">4</button>
          <button onClick={() => handleNumber("5")} className="calc-btn calc-btn-num">5</button>
          <button onClick={() => handleNumber("6")} className="calc-btn calc-btn-num">6</button>
          <button onClick={() => handleOperator("-")} className="calc-btn calc-btn-op">−</button>

          <button onClick={() => handleNumber("1")} className="calc-btn calc-btn-num">1</button>
          <button onClick={() => handleNumber("2")} className="calc-btn calc-btn-num">2</button>
          <button onClick={() => handleNumber("3")} className="calc-btn calc-btn-num">3</button>
          <button onClick={() => handleOperator("+")} className="calc-btn calc-btn-op">+</button>

          <button onClick={() => handleNumber("0")} className="calc-btn calc-btn-num col-span-2">0</button>
          <button onClick={handleDecimal} className="calc-btn calc-btn-num">.</button>
          <button onClick={handleEquals} className="calc-btn calc-btn-eq">=</button>
        </div>
      </div>
    </div>
  );

  return createPortal(calculatorContent, document.body);
};

export default Calculator;