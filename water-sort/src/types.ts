/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ColorDef {
  id: number;
  name: string;
  lightModel: string; // Tailwind-like human readable name
  primary: string;     // Primary hex color
  secondary: string;   // Secondary hex color (for gradients)
  bubbleColor: string; // Color of the splash/glow bubbles
}

export type Bottle = number[]; // Elements representing color IDs, 0: bottom, up to 3: top

export interface GameState {
  bottles: Bottle[];
  history: Bottle[][];   // Store deep copies of bottles state for undo operations
  selectedId: number | null; // Currently selected bottle index
  level: number;
  difficulty: "easy" | "medium" | "hard";
  movesCount: number;
  isCompleted: boolean;
  addedBottleCount: number; // Keep track of extra empty bottles purchased/added
}

export interface LevelConfig {
  colorsCount: number;
  emptyBottlesCount: number;
  difficultyName: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  alpha: number;
  life: number;
  decay: number;
}

export interface AnimationState {
  isPouring: boolean;
  sourceId: number | null;
  targetId: number | null;
  sourceAngle: number; // in radians
  progress: number; // 0 to 1 for the pour animation
  streamColor: string | null;
  fluidLevelSource: number; // level height ratio
  fluidLevelTarget: number; // level height ratio
}

export const GAME_COLORS: ColorDef[] = [
  {
    id: 1,
    name: "Coral Rose",
    lightModel: "Coral",
    primary: "#F43F5E",
    secondary: "#FDA4AF",
    bubbleColor: "#FFE4E6",
  },
  {
    id: 2,
    name: "Ocean Sky",
    lightModel: "Cyan",
    primary: "#0EA5E9",
    secondary: "#7DD3FC",
    bubbleColor: "#E0F2FE",
  },
  {
    id: 3,
    name: "Emerald Mint",
    lightModel: "Mint",
    primary: "#10B981",
    secondary: "#6EE7B7",
    bubbleColor: "#D1FAE5",
  },
  {
    id: 4,
    name: "Butter Amber",
    lightModel: "Gold",
    primary: "#F59E0B",
    secondary: "#FCD34D",
    bubbleColor: "#FEF3C7",
  },
  {
    id: 5,
    name: "Royal Purple",
    lightModel: "Lilac",
    primary: "#8B5CF6",
    secondary: "#C4B5FD",
    bubbleColor: "#EDE9FE",
  },
  {
    id: 6,
    name: "Tangerine Peach",
    lightModel: "Peach",
    primary: "#F97316",
    secondary: "#FDBA74",
    bubbleColor: "#FFEDD5",
  },
  {
    id: 7,
    name: "Orchid Pink",
    lightModel: "Pink",
    primary: "#EC4899",
    secondary: "#F9A8D4",
    bubbleColor: "#FCE7F3",
  },
  {
    id: 8,
    name: "Teal Lagoon",
    lightModel: "Teal",
    primary: "#0D9488",
    secondary: "#5EEAD4",
    bubbleColor: "#CCFBF1",
  },
  {
    id: 9,
    name: "Cocoa Brown",
    lightModel: "Bronze",
    primary: "#B45309",
    secondary: "#F59E0B",
    bubbleColor: "#FEF3C7",
  },
  {
    id: 10,
    name: "Slate Silver",
    lightModel: "Silver",
    primary: "#64748B",
    secondary: "#CBD5E1",
    bubbleColor: "#F1F5F9",
  },
  {
    id: 11,
    name: "Lime Grass",
    lightModel: "Lime",
    primary: "#84CC16",
    secondary: "#BEF264",
    bubbleColor: "#ECFCCB",
  },
  {
    id: 12,
    name: "Indigo Night",
    lightModel: "Indigo",
    primary: "#6366F1",
    secondary: "#A5B4FC",
    bubbleColor: "#EEF2FF",
  },
  {
    id: 13,
    name: "Crimson Red",
    lightModel: "Crimson",
    primary: "#DC2626",
    secondary: "#F87171",
    bubbleColor: "#FEE2E2",
  },
  {
    id: 14,
    name: "Sunset Yellow",
    lightModel: "Yellow",
    primary: "#EAB308",
    secondary: "#FDE047",
    bubbleColor: "#FEFCE8",
  },
  {
    id: 15,
    name: "Lavender Mist",
    lightModel: "Lavender",
    primary: "#A78BFA",
    secondary: "#DDD6FE",
    bubbleColor: "#F5F3FF",
  },
  {
    id: 16,
    name: "Forest Pine",
    lightModel: "Pine",
    primary: "#15803D",
    secondary: "#4ADE80",
    bubbleColor: "#DCFCE7",
  },
  {
    id: 17,
    name: "Dark Fuchsia",
    lightModel: "Fuchsia",
    primary: "#D946EF",
    secondary: "#F5D0FE",
    bubbleColor: "#FDF4FF",
  },
  {
    id: 18,
    name: "Sky Ice",
    lightModel: "Ice",
    primary: "#38BDF8",
    secondary: "#BAE6FD",
    bubbleColor: "#F0F9FF",
  },
  {
    id: 19,
    name: "Gold Bronze",
    lightModel: "GoldBronze",
    primary: "#D97706",
    secondary: "#FBBF24",
    bubbleColor: "#FEF3C7",
  },
  {
    id: 20,
    name: "Navy Blue",
    lightModel: "Navy",
    primary: "#1D4ED8",
    secondary: "#93C5FD",
    bubbleColor: "#EFF6FF",
  },
  {
    id: 21,
    name: "Mint Spring",
    lightModel: "Spring",
    primary: "#34D399",
    secondary: "#A7F3D0",
    bubbleColor: "#ECFDF5",
  },
  {
    id: 22,
    name: "Dark Magenta",
    lightModel: "Magenta",
    primary: "#BE185D",
    secondary: "#F472B6",
    bubbleColor: "#FDF2F8",
  },
  {
    id: 23,
    name: "Plum Silk",
    lightModel: "Plum",
    primary: "#86198F",
    secondary: "#E879F9",
    bubbleColor: "#FDF4FF",
  },
  {
    id: 24,
    name: "Olive Leaf",
    lightModel: "Olive",
    primary: "#4D7C0F",
    secondary: "#A3E635",
    bubbleColor: "#F7FEE7",
  },
  {
    id: 25,
    name: "Electric Cyan",
    lightModel: "Electric",
    primary: "#06B6D4",
    secondary: "#67E8F9",
    bubbleColor: "#ECFEFF",
  },
  {
    id: 26,
    name: "Grape Violet",
    lightModel: "Grape",
    primary: "#701A75",
    secondary: "#F472B6",
    bubbleColor: "#FDF2F8",
  },
  {
    id: 27,
    name: "Rust Copper",
    lightModel: "Copper",
    primary: "#C2410C",
    secondary: "#FB923C",
    bubbleColor: "#FFEDD5",
  },
  {
    id: 28,
    name: "Soft Violet",
    lightModel: "SoftViolet",
    primary: "#818CF8",
    secondary: "#C7D2FE",
    bubbleColor: "#EEF2FF",
  },
  {
    id: 29,
    name: "Jade Jewel",
    lightModel: "Jade",
    primary: "#059669",
    secondary: "#34D399",
    bubbleColor: "#E6F4EA",
  },
  {
    id: 30,
    name: "Charcoal Ash",
    lightModel: "Ash",
    primary: "#4B5563",
    secondary: "#9CA3AF",
    bubbleColor: "#F3F4F6",
  }
];

export const DIFFICULTY_PRESETS: Record<"easy" | "medium" | "hard", LevelConfig> = {
  easy: {
    colorsCount: 2,
    emptyBottlesCount: 2,
    difficultyName: "Easy",
  },
  medium: {
    colorsCount: 6,
    emptyBottlesCount: 2,
    difficultyName: "Medium",
  },
  hard: {
    colorsCount: 10,
    emptyBottlesCount: 2,
    difficultyName: "Hard",
  },
};
