import { useState, type ReactNode, type MouseEvent } from "react";
import { Zap, RotateCcw, ChevronLeft } from "lucide-react";

export default function BlackPremiumCalculator() {
  const [display, setDisplay] = useState("0");
  const [equation, setEquation] = useState("");
  const [isNewNumber, setIsNewNumber] = useState(true);
  const [history, setHistory] = useState<string[]>([]);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number; buttonId: string }>>([]);

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
      setHistory([fullEquation + " = " + result, ...history.slice(0, 4)]);
      setDisplay(String(result));
      setEquation("");
      setIsNewNumber(true);
    } catch (error) {
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

  const createRipple = (e: MouseEvent<HTMLButtonElement>, buttonId: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples([...ripples, { id, x, y, buttonId }]);
    setTimeout(() => {
      setRipples((r) => r.filter((ripple) => ripple.id !== id));
    }, 600);
  };

  const NeoButton = ({ 
    children, 
    onClick, 
    variant = "default",
    className = "",
    glow = false,
    buttonId = ""
  }: { 
    children: ReactNode; 
    onClick: () => void; 
    variant?: "default" | "operator" | "equals" | "special";
    className?: string;
    glow?: boolean;
    buttonId?: string;
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    const variants = {
      default: {
        bg: "linear-gradient(145deg, #1a1a1a, #0d0d0d)",
        text: "#ffffff",
        shadow: "6px 6px 12px #000000, -6px -6px 12px #262626",
        pressedShadow: "inset 4px 4px 8px #000000, inset -4px -4px 8px #262626",
        border: "rgba(255, 255, 255, 0.05)",
        glow: "rgba(255, 255, 255, 0.15)",
      },
      operator: {
        bg: "linear-gradient(145deg, #2a2a2a, #1a1a1a)",
        text: "#ffffff",
        shadow: "6px 6px 12px #000000, -6px -6px 12px #333333",
        pressedShadow: "inset 4px 4px 8px #000000, inset -4px -4px 8px #333333",
        border: "rgba(255, 255, 255, 0.1)",
        glow: "rgba(255, 255, 255, 0.2)",
      },
      equals: {
        bg: "linear-gradient(145deg, #ffffff, #e5e5e5)",
        text: "#000000",
        shadow: "6px 6px 12px #000000, -6px -6px 12px rgba(255, 255, 255, 0.1)",
        pressedShadow: "inset 4px 4px 8px rgba(0, 0, 0, 0.2), inset -4px -4px 8px rgba(255, 255, 255, 0.8)",
        border: "rgba(255, 255, 255, 0.3)",
        glow: "rgba(255, 255, 255, 0.4)",
      },
      special: {
        bg: "linear-gradient(145deg, #0d0d0d, #000000)",
        text: "#888888",
        shadow: "6px 6px 12px #000000, -6px -6px 12px #1a1a1a",
        pressedShadow: "inset 4px 4px 8px #000000, inset -4px -4px 8px #1a1a1a",
        border: "rgba(255, 255, 255, 0.03)",
        glow: "rgba(255, 255, 255, 0.1)",
      },
    };

    const style = variants[variant];

    return (
      <button
        onClick={(e) => {
          createRipple(e, buttonId);
          onClick();
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        className={`relative overflow-hidden h-16 rounded-2xl font-bold text-base transition-all duration-300 ${className}`}
        style={{
          background: style.bg,
          color: style.text,
          boxShadow: isPressed ? style.pressedShadow : style.shadow,
          border: `1px solid ${style.border}`,
          transform: isPressed ? "scale(0.95)" : isHovered ? "scale(1.05)" : "scale(1)",
        }}
      >
        {glow && isHovered && (
          <div 
            className="absolute inset-0 animate-pulse"
            style={{
              background: `radial-gradient(circle, ${style.glow} 0%, transparent 70%)`,
            }}
          />
        )}
        
        {ripples
          .filter((r) => r.buttonId === buttonId)
          .map((ripple) => (
            <span
              key={ripple.id}
              className="absolute rounded-full animate-ping"
              style={{
                left: ripple.x,
                top: ripple.y,
                width: 10,
                height: 10,
                background: variant === "equals" ? "rgba(0, 0, 0, 0.3)" : "rgba(255, 255, 255, 0.5)",
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        
        <span className="relative z-10">{children}</span>
      </button>
    );
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-5 relative overflow-hidden"
      style={{
        background: "#000000",
      }}
    >
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
            animation: "gridMove 20s linear infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>

      {/* Minimal floating shapes */}
      <div className="absolute top-20 left-20 w-32 h-32 rounded-full opacity-5 blur-3xl" 
           style={{ 
             background: "radial-gradient(circle, #ffffff 0%, transparent 70%)",
             animation: "float 6s ease-in-out infinite"
           }} 
      />
      <div className="absolute bottom-32 right-32 w-40 h-40 opacity-5 blur-3xl" 
           style={{ 
             background: "radial-gradient(circle, #ffffff 0%, transparent 70%)",
             animation: "float 8s ease-in-out infinite",
             animationDelay: "2s"
           }} 
      />

      <div className="relative w-full max-w-md z-10">
        {/* Main Calculator */}
        <div 
          className="rounded-[3rem] p-8 backdrop-blur-xl"
          style={{
            background: "linear-gradient(145deg, #0a0a0a, #000000)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: `
              20px 20px 60px rgba(0, 0, 0, 0.9),
              -20px -20px 60px rgba(38, 38, 38, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.05)
            `,
          }}
        >
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden"
                style={{
                  background: "linear-gradient(145deg, #1a1a1a, #0d0d0d)",
                  boxShadow: "4px 4px 8px #000000, -4px -4px 8px #262626, inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                }}
              >
                <div 
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.05) 50%, transparent 70%)",
                    animation: "glow 3s ease-in-out infinite",
                  }}
                />
                <Zap className="w-6 h-6 text-white relative z-10" />
              </div>
              <div>
                <h2 className="text-base font-black text-white tracking-tight">OBSIDIAN</h2>
                <p className="text-xs text-gray-600 font-semibold">ELITE EDITION</p>
              </div>
            </div>
            
            <button
              onClick={() => setHistory([])}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
              style={{
                background: "linear-gradient(145deg, #1a1a1a, #0d0d0d)",
                boxShadow: "4px 4px 8px #000000, -4px -4px 8px #262626",
              }}
            >
              <RotateCcw className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* History Panel */}
          {history.length > 0 && (
            <div 
              className="mb-4 p-4 rounded-2xl space-y-2 max-h-24 overflow-y-auto"
              style={{
                background: "rgba(0, 0, 0, 0.5)",
                border: "1px solid rgba(255, 255, 255, 0.03)",
                boxShadow: "inset 4px 4px 8px rgba(0, 0, 0, 0.8)",
              }}
            >
              {history.map((item, idx) => (
                <div key={idx} className="text-xs text-gray-600 font-mono flex items-center gap-2">
                  <ChevronLeft className="w-3 h-3 text-gray-700" />
                  {item}
                </div>
              ))}
            </div>
          )}

          {/* Premium Display */}
          <div 
            className="mb-6 p-6 rounded-3xl relative overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #000000, #0a0a0a)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: `
                inset 8px 8px 16px rgba(0, 0, 0, 0.9),
                inset -8px -8px 16px rgba(26, 26, 26, 0.3)
              `,
            }}
          >
            {/* Scanning line effect */}
            <div 
              className="absolute inset-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-10"
              style={{
                animation: "scan 3s linear infinite",
              }}
            />
            
            {equation && (
              <div className="text-right text-sm text-gray-500 mb-2 font-mono font-semibold min-h-6">
                {equation}
              </div>
            )}
            <div className="text-right">
              <div 
                className="text-5xl font-black tracking-tighter truncate"
                style={{
                  color: "#ffffff",
                  textShadow: "0 0 30px rgba(255, 255, 255, 0.3)",
                }}
              >
                {display}
              </div>
            </div>
          </div>

          {/* Button Grid */}
          <div className="grid grid-cols-4 gap-3">
            {/* Row 1 */}
            <NeoButton onClick={handleClear} variant="special" glow buttonId="ac">AC</NeoButton>
            <NeoButton onClick={handleBackspace} variant="special" buttonId="backspace">⌫</NeoButton>
            <NeoButton onClick={() => handleOperator("%")} variant="special" buttonId="percent">%</NeoButton>
            <NeoButton onClick={() => handleOperator("÷")} variant="operator" glow buttonId="divide">÷</NeoButton>

            {/* Row 2 */}
            <NeoButton onClick={() => handleNumber("7")} buttonId="7">7</NeoButton>
            <NeoButton onClick={() => handleNumber("8")} buttonId="8">8</NeoButton>
            <NeoButton onClick={() => handleNumber("9")} buttonId="9">9</NeoButton>
            <NeoButton onClick={() => handleOperator("×")} variant="operator" glow buttonId="multiply">×</NeoButton>

            {/* Row 3 */}
            <NeoButton onClick={() => handleNumber("4")} buttonId="4">4</NeoButton>
            <NeoButton onClick={() => handleNumber("5")} buttonId="5">5</NeoButton>
            <NeoButton onClick={() => handleNumber("6")} buttonId="6">6</NeoButton>
            <NeoButton onClick={() => handleOperator("-")} variant="operator" glow buttonId="subtract">−</NeoButton>

            {/* Row 4 */}
            <NeoButton onClick={() => handleNumber("1")} buttonId="1">1</NeoButton>
            <NeoButton onClick={() => handleNumber("2")} buttonId="2">2</NeoButton>
            <NeoButton onClick={() => handleNumber("3")} buttonId="3">3</NeoButton>
            <NeoButton onClick={() => handleOperator("+")} variant="operator" glow buttonId="add">+</NeoButton>

            {/* Row 5 */}
            <NeoButton onClick={() => handleNumber("0")} className="col-span-2" buttonId="0">0</NeoButton>
            <NeoButton onClick={handleDecimal} buttonId="decimal">•</NeoButton>
            <NeoButton onClick={handleEquals} variant="equals" glow buttonId="equals">=</NeoButton>
          </div>

          {/* Status Bar */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white opacity-50 animate-pulse" />
            <p className="text-xs text-gray-700 font-mono font-semibold uppercase tracking-wider">
              Premium Mode
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}