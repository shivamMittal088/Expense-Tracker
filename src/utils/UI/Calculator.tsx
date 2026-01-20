import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Delete, X, History, Copy, Check } from "lucide-react";
import "./Calculator.css";

interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HistoryItem {
  equation: string;
  result: string;
}

export const Calculator: React.FC<CalculatorProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState("0");
  const [equation, setEquation] = useState("");
  const [isNewNumber, setIsNewNumber] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const calculatorRef = useRef<HTMLDivElement>(null);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setShowHistory(false);
    }
  }, [isOpen]);



  // Handle keyboard input
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
        return;
      }
      
      if (e.key >= "0" && e.key <= "9") {
        handleNumber(e.key);
      } else if (e.key === "+") {
        handleOperator("+");
      } else if (e.key === "-") {
        handleOperator("-");
      } else if (e.key === "*") {
        handleOperator("×");
      } else if (e.key === "/") {
        handleOperator("÷");
      } else if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        handleEquals();
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "." || e.key === ",") {
        handleDecimal();
      } else if (e.key === "c" || e.key === "C") {
        handleClear();
      } else if (e.key === "%") {
        handleOperator("%");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, display, equation, isNewNumber]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  }, [onClose]);

  const handleNumber = (num: string) => {
    setActiveButton(num);
    setTimeout(() => setActiveButton(null), 150);
    
    if (isNewNumber) {
      setDisplay(num);
      setIsNewNumber(false);
    } else {
      if (display.length < 15) {
        setDisplay(display === "0" ? num : display + num);
      }
    }
  };

  const handleOperator = (op: string) => {
    setActiveButton(op);
    setTimeout(() => setActiveButton(null), 150);
    setEquation(display + " " + op + " ");
    setIsNewNumber(true);
  };

  const handleEquals = () => {
    setActiveButton("=");
    setTimeout(() => setActiveButton(null), 150);
    
    try {
      const fullEquation = equation + display;
      const sanitized = fullEquation
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/−/g, "-");
      
      // Safe evaluation
      const result = Function('"use strict"; return (' + sanitized + ')')();
      const resultStr = Number.isFinite(result) 
        ? parseFloat(result.toFixed(10)).toString()
        : "Error";
      
      if (resultStr !== "Error" && fullEquation.trim()) {
        setHistory(prev => [...prev.slice(-9), { equation: fullEquation, result: resultStr }]);
      }
      
      setDisplay(resultStr);
      setEquation("");
      setIsNewNumber(true);
    } catch {
      setDisplay("Error");
      setEquation("");
      setIsNewNumber(true);
    }
  };

  const handleClear = () => {
    setActiveButton("AC");
    setTimeout(() => setActiveButton(null), 150);
    setDisplay("0");
    setEquation("");
    setIsNewNumber(true);
  };

  const handleBackspace = () => {
    setActiveButton("DEL");
    setTimeout(() => setActiveButton(null), 150);
    
    if (display.length > 1 && display !== "Error") {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
      setIsNewNumber(true);
    }
  };

  const handleDecimal = () => {
    setActiveButton(".");
    setTimeout(() => setActiveButton(null), 150);
    
    if (!display.includes(".")) {
      setDisplay(display + ".");
      setIsNewNumber(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(display);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleHistoryClick = (item: HistoryItem) => {
    setDisplay(item.result);
    setEquation("");
    setIsNewNumber(true);
    setShowHistory(false);
  };

  const formatDisplay = (value: string) => {
    if (value === "Error") return value;
    const parts = value.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  };

  if (!isOpen) return null;

  const calculatorContent = (
    <div className={`calc-premium-overlay ${isClosing ? "closing" : ""}`}>
      <div
        ref={calculatorRef}
        className={`calc-premium-modal ${isClosing ? "closing" : ""}`}
      >
        {/* Ambient glow effects */}
        <div className="calc-ambient-glow calc-glow-1" />
        <div className="calc-ambient-glow calc-glow-2" />
        
        {/* Header */}
        <div className="calc-header">
          <div className="calc-header-left">
            <div className="calc-logo">
              <span className="calc-logo-icon">⌘</span>
            </div>
            <span className="calc-title">Calculator</span>
          </div>
          <div className="calc-header-actions">
            <button 
              className={`calc-header-btn ${showHistory ? 'active' : ''}`}
              onClick={() => setShowHistory(!showHistory)}
              title="History"
            >
              <History size={14} />
            </button>
            <button className="calc-header-btn calc-close-btn" onClick={handleClose}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Display Area */}
        <div className="calc-display-container">
          {/* Previous calculations preview */}
          {history.length > 0 && (
            <div className="calc-prev-calculations">
              {history.slice(-2).map((item, idx) => (
                <div 
                  key={idx} 
                  className="calc-prev-item"
                  onClick={() => handleHistoryClick(item)}
                >
                  <span className="calc-prev-eq">{item.equation}</span>
                  <span className="calc-prev-res">= {item.result}</span>
                </div>
              ))}
            </div>
          )}
          <div className="calc-equation-row">
            <span className="calc-equation">{equation || "\u00A0"}</span>
          </div>
          <div className="calc-result-row">
            <span className={`calc-result ${display.length > 10 ? 'small' : ''}`}>
              {formatDisplay(display)}
            </span>
            <button 
              className={`calc-copy-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
              title="Copy result"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        </div>

        {/* History Panel */}
        <div className={`calc-history-panel ${showHistory ? 'open' : ''}`}>
          <div className="calc-history-header">
            <span>History</span>
            {history.length > 0 && (
              <button 
                className="calc-clear-history"
                onClick={() => setHistory([])}
              >
                Clear
              </button>
            )}
          </div>
          <div className="calc-history-list">
            {history.length === 0 ? (
              <div className="calc-history-empty">No calculations yet</div>
            ) : (
              history.slice().reverse().map((item, idx) => (
                <div 
                  key={idx} 
                  className="calc-history-item"
                  onClick={() => handleHistoryClick(item)}
                >
                  <span className="calc-history-eq">{item.equation}</span>
                  <span className="calc-history-res">= {item.result}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Button Grid */}
        <div className="calc-button-grid">
          {/* Row 1 */}
          <button 
            onClick={handleClear} 
            className={`calc-btn calc-btn-func ${activeButton === 'AC' ? 'active' : ''}`}
          >
            <span>AC</span>
          </button>
          <button 
            onClick={handleBackspace} 
            className={`calc-btn calc-btn-func ${activeButton === 'DEL' ? 'active' : ''}`}
          >
            <Delete size={18} strokeWidth={1.5} />
          </button>
          <button 
            onClick={() => handleOperator("%")} 
            className={`calc-btn calc-btn-func ${activeButton === '%' ? 'active' : ''}`}
          >
            <span>%</span>
          </button>
          <button 
            onClick={() => handleOperator("÷")} 
            className={`calc-btn calc-btn-op ${activeButton === '÷' ? 'active' : ''}`}
          >
            <span>÷</span>
          </button>

          {/* Row 2 */}
          <button onClick={() => handleNumber("7")} className={`calc-btn calc-btn-num ${activeButton === '7' ? 'active' : ''}`}>
            <span>7</span>
          </button>
          <button onClick={() => handleNumber("8")} className={`calc-btn calc-btn-num ${activeButton === '8' ? 'active' : ''}`}>
            <span>8</span>
          </button>
          <button onClick={() => handleNumber("9")} className={`calc-btn calc-btn-num ${activeButton === '9' ? 'active' : ''}`}>
            <span>9</span>
          </button>
          <button onClick={() => handleOperator("×")} className={`calc-btn calc-btn-op ${activeButton === '×' ? 'active' : ''}`}>
            <span>×</span>
          </button>

          {/* Row 3 */}
          <button onClick={() => handleNumber("4")} className={`calc-btn calc-btn-num ${activeButton === '4' ? 'active' : ''}`}>
            <span>4</span>
          </button>
          <button onClick={() => handleNumber("5")} className={`calc-btn calc-btn-num ${activeButton === '5' ? 'active' : ''}`}>
            <span>5</span>
          </button>
          <button onClick={() => handleNumber("6")} className={`calc-btn calc-btn-num ${activeButton === '6' ? 'active' : ''}`}>
            <span>6</span>
          </button>
          <button onClick={() => handleOperator("-")} className={`calc-btn calc-btn-op ${activeButton === '-' ? 'active' : ''}`}>
            <span>−</span>
          </button>

          {/* Row 4 */}
          <button onClick={() => handleNumber("1")} className={`calc-btn calc-btn-num ${activeButton === '1' ? 'active' : ''}`}>
            <span>1</span>
          </button>
          <button onClick={() => handleNumber("2")} className={`calc-btn calc-btn-num ${activeButton === '2' ? 'active' : ''}`}>
            <span>2</span>
          </button>
          <button onClick={() => handleNumber("3")} className={`calc-btn calc-btn-num ${activeButton === '3' ? 'active' : ''}`}>
            <span>3</span>
          </button>
          <button onClick={() => handleOperator("+")} className={`calc-btn calc-btn-op ${activeButton === '+' ? 'active' : ''}`}>
            <span>+</span>
          </button>

          {/* Row 5 */}
          <button onClick={() => handleNumber("0")} className={`calc-btn calc-btn-num calc-btn-zero ${activeButton === '0' ? 'active' : ''}`}>
            <span>0</span>
          </button>
          <button onClick={handleDecimal} className={`calc-btn calc-btn-num ${activeButton === '.' ? 'active' : ''}`}>
            <span>.</span>
          </button>
          <button onClick={handleEquals} className={`calc-btn calc-btn-equals ${activeButton === '=' ? 'active' : ''}`}>
            <span>=</span>
          </button>
        </div>

        {/* Keyboard hint */}
        <div className="calc-keyboard-hint">
          <span>Use keyboard for input</span>
        </div>
      </div>
    </div>
  );

  return createPortal(calculatorContent, document.body);
};

export default Calculator;