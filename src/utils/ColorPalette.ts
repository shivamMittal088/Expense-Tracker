// Curated color palette for tile/category pickers

export type PaletteColor = {
  hex: string;
  name: string;
};

export const colorPalette: PaletteColor[] = [
  // Blues
  { hex: "#2563eb", name: "Blue" },
  { hex: "#1d4ed8", name: "Royal Blue" },
  { hex: "#3b82f6", name: "Sky Blue" },
  { hex: "#0ea5e9", name: "Cyan" },
  { hex: "#06b6d4", name: "Teal" },
  { hex: "#0891b2", name: "Dark Cyan" },
  { hex: "#1e3a8a", name: "Navy" },
  { hex: "#60a5fa", name: "Light Blue" },
  
  // Purples & Pinks
  { hex: "#7c3aed", name: "Purple" },
  { hex: "#8b5cf6", name: "Violet" },
  { hex: "#a855f7", name: "Orchid" },
  { hex: "#c026d3", name: "Fuchsia" },
  { hex: "#d946ef", name: "Magenta" },
  { hex: "#ec4899", name: "Pink" },
  { hex: "#f472b6", name: "Rose" },
  { hex: "#6b21a8", name: "Plum" },
  
  // Reds & Oranges
  { hex: "#ef4444", name: "Red" },
  { hex: "#dc2626", name: "Crimson" },
  { hex: "#f97316", name: "Orange" },
  { hex: "#fb923c", name: "Tangerine" },
  { hex: "#f59e0b", name: "Amber" },
  { hex: "#fbbf24", name: "Golden" },
  { hex: "#fb7185", name: "Coral" },
  { hex: "#ff6b6b", name: "Salmon" },
  
  // Greens
  { hex: "#10b981", name: "Emerald" },
  { hex: "#22c55e", name: "Green" },
  { hex: "#16a34a", name: "Forest" },
  { hex: "#84cc16", name: "Lime" },
  { hex: "#a3e635", name: "Chartreuse" },
  { hex: "#14b8a6", name: "Mint" },
  { hex: "#2dd4bf", name: "Aqua" },
  { hex: "#059669", name: "Jade" },
  
  // Yellows
  { hex: "#facc15", name: "Yellow" },
  { hex: "#eab308", name: "Gold" },
  { hex: "#d97706", name: "Bronze" },
  { hex: "#fcd34d", name: "Lemon" },
  
  // Neutrals
  { hex: "#64748b", name: "Slate" },
  { hex: "#475569", name: "Steel" },
  { hex: "#334155", name: "Charcoal" },
  { hex: "#78716c", name: "Stone" },
  { hex: "#a8a29e", name: "Warm Gray" },
  { hex: "#6b7280", name: "Cool Gray" },
  { hex: "#1f2937", name: "Dark" },
  { hex: "#000000", name: "Black" },
];

// Helper to get a random color
export const getRandomColor = (): PaletteColor => {
  return colorPalette[Math.floor(Math.random() * colorPalette.length)];
};

// Helper to find color by hex
export const findColorByHex = (hex: string): PaletteColor | undefined => {
  return colorPalette.find(c => c.hex.toLowerCase() === hex.toLowerCase());
};

// Default color
export const defaultColor = colorPalette[0]; // Blue
