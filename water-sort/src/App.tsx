/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Bottle, DIFFICULTY_PRESETS, GAME_COLORS } from "./types";
import { GameCanvas } from "./components/GameCanvas";
import { UIOverlay } from "./components/UIOverlay";
import { Tutorial } from "./components/Tutorial";
import { generateSolvableLevel, solveWaterSort, checkIsSolved } from "./components/Solver";
import { gameAudio } from "./utils/audio";
import { Sparkles, Heart, Coins, Play, Info, Mail, ShieldAlert, Award, FileText, X, Copy, Check, Lock, Unlock, Brain, Trash2, Volume2, VolumeX, Tv, Settings, RefreshCw, ShoppingBag, Palette, MessageSquare, Send, Bot, Image as ImageIcon, UploadCloud, DoorClosed, DoorOpen, Trophy, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BOTTLE_SKINS, BACKGROUND_THEMES, BottleSkin, BackgroundTheme } from "./data/skins";
import { ShopModal } from "./components/ShopModal";
import { LevelSelectorModal } from "./components/LevelSelectorModal";
import backgroundImage from "./assets/images/background.jpg";
import playerImage from "./assets/images/player.png";

// Interactive message log schema for Galaxy Gemini-powered AI
interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  image?: string; // base64 encoded picture
  timestamp: string;
}

interface MessageSegment {
  type: "text" | "code";
  content: string;
  language?: string;
}

function parseMessageText(text: string): MessageSegment[] {
  const parts = text.split("```");
  const segments: MessageSegment[] = [];
  
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      // Text segment
      if (parts[i]) {
        segments.push({ type: "text", content: parts[i] });
      }
    } else {
      // Code segment
      const lines = parts[i].split("\n");
      const firstLine = lines[0].trim();
      const language = firstLine || "code";
      const content = lines.slice(1).join("\n").trim();
      segments.push({ type: "code", content, language });
    }
  }
  return segments;
}

const renderFormattedText = (text: string) => {
  const paragraphs = text.split("\n");
  return paragraphs.map((p, pIdx) => {
    const isBullet = p.trim().startsWith("- ") || p.trim().startsWith("* ") || p.trim().startsWith("• ");
    let cleanText = p;
    if (isBullet) {
      cleanText = p.trim().replace(/^[-*•]\s+/, "");
    }

    const parts = cleanText.split(/\*\*([^*]+)\*\*/g);
    const content = parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-bold text-white">{part}</strong>;
      }
      return part;
    });

    if (isBullet) {
      return (
        <div key={pIdx} className="flex items-start gap-1.5 my-1 pl-2">
          <span className="text-cyan-400 mt-1 select-none text-[8px]">✦</span>
          <span className="flex-1">{content}</span>
        </div>
      );
    }

    return (
      <p key={pIdx} className={pIdx > 0 ? "mt-1.5" : ""}>
        {content}
      </p>
    );
  });
};

function getOfflineAiResponse(userText: string, bottles: number[][], level: number, userName: string): string {
  const query = userText.toLowerCase().trim();
  
  if (query === "hello" || query === "hlo" || query === "hi" || query === "hey" || query === "yo") {
    return `🌌 **Galaxy AI** ✨\n\nHello bro! How can I help you today? 🤗`;
  }

  if (query.includes("who made") || query.includes("made this game") || query.includes("creator") || query.includes("owner") || query.includes("banaechi") || query.includes("developer") || query.includes("maker") || query.includes("build") || query.includes("built") || query.includes("banaichi")) {
    return `🌌 **Galaxy AI** ✨\n\nThis game was proudly built by **Galaxy Studio** using state-of-the-art AI design! We are fully committed to creating next-generation, high-performance web and AI applications. 🚀`;
  }
  
  if (query.includes("hint") || query.includes("solve") || query.includes("help") || query.includes("move") || query.includes("how to solve")) {
    const solution = solveWaterSort(bottles, 3000);
    if (solution && solution.length > 0) {
      const nextMoves = solution.slice(0, 3).map((move, idx) => {
        return `${idx + 1}. **Pour Tube ${move.from + 1}** into **Tube ${move.to + 1}**`;
      }).join("\n");
      
      return `🌌 **Galaxy AI** 🚀\n\nHello, bro! I have scanned your current game state and computed the optimal sorting pathway locally.\n\nHere are the next recommended moves:\n${nextMoves}\n\n*Tip: Focus on clearing a tube to handle color bottlenecks!*`;
    } else {
      if (checkIsSolved(bottles)) {
        return `🌟 **Galaxy AI** 🚀\n\nFantastic, bro! This stage is already fully sorted! Tap the next-level controller of the game overlay to progress!`;
      }
      return `🌌 **Galaxy AI** 🚀\n\nI scanned the vessels but found **no possible moves** from this state. It seems you've reached a bottleneck!\n\nTry tapping **Undo (↩️)** or adding an **Extra Tube (🧪)** from the lower action HUD to clear the workspace!`;
    }
  }
  
  if (query.includes("rule") || query.includes("how to play") || query.includes("learn") || query.includes("sort")) {
    return `📝 **Universal Liquid Sorting Codex**\n\nRules of the space portal:\n1. Tap any tube to select the top liquid layer, then tap another tube to pour it.\n2. You can only pour liquid into an empty tube, or on top of a layer of the **exact same color**.\n3. Each tube has a limit of **4 liquid units**.\n4. Sort all same-colored elements into their respective single-color tubes to unlock the gateway!`;
  }
  
  if (query.includes("booster") || query.includes("extra") || query.includes("strat") || query.includes("tip")) {
    return `⚡ **Booster Tactics & Cosmic Tips**\n\n1. **Early Space Creation**: Target a tube that can be emptied quickly. A vacant container is the single most powerful tool in the puzzle.\n2. **Group matching**: Group all matching color blocks into one single continuous column where possible.\n3. **Use of undo**: If you make a risky move, double-back using the **Undo (↩️)** button before committing!`;
  }
  
  // Heuristic offline Q&A simulator to support "game bahare bi" general questions
  if (query.includes("capit") || query.includes("odisha") || query.includes("bhubaneswar")) {
    return `🌌 **Galaxy AI** ✨\n\nBhubaneswar is the capital of Odisha, bro! It is known as the "Temple City" and is a beautiful, green place. 🏛️✨\n\nWant to know anything else about Odisha or general history, bhai?`;
  }

  if (query.includes("prime minister") || query.includes("pm of india") || query.includes("modi")) {
    return `🌌 **Galaxy AI** ✨\n\nShri Narendra Modi is the Prime Minister of India, bro! He has been in office since 2014. 🇮🇳\n\nAny other general knowledge questions you want to solve, bhai?`;
  }

  if (query.includes("chief minister") || query.includes("cm of odisha") || query.includes("mohan")) {
    return `🌌 **Galaxy AI** ✨\n\nShri Mohan Charan Majhi is the current Chief Minister of Odisha, bro! 🌾✨\n\nAsk me anything else, bro! I'm ready!`;
  }

  if (query.includes("calculate") || query.includes("+") || query.includes("-") || query.includes("*") || query.includes("/")) {
    try {
      const sanitizedExpr = query.replace(/[^-+*/0-9.]/g, '');
      if (sanitizedExpr.length >= 3) {
        const result = Function(`"use strict"; return (${sanitizedExpr})`)();
        return `🌌 **Galaxy AI** 🧠\n\nI calculated this for you locally, bro:\n\n**${sanitizedExpr} = ${result}** ⚡\n\nNeed help with any more math, bro?`;
      }
    } catch (e) {}
  }
  
  return `🌌 **Galaxy AI** ✨\n\nSorry, bro! Mun eta bhabiki kahiparuni (I can't answer this right now/I don't know). \n\nAsk me anything about **Water Sort rules**, **level solutions**, **math calculations**, or **Odisha capitals** and I'll answer instantly! Let's keep playing and sorting, bhai! 🧪✨`;
}

interface CodeBlockProps {
  key?: React.Key;
  content: string;
  language?: string;
  onRunCode: (content: string) => void;
}

const CodeBlock = ({ content, language, onRunCode }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isHtml = language?.toLowerCase().includes("html") || content.trim().toLowerCase().startsWith("<!doctype") || content.trim().toLowerCase().startsWith("<html");

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-white/10 bg-black/40 w-full">
      <div className="flex justify-between items-center bg-stone-900 px-3.5 py-1.5 text-[10px] font-mono text-slate-400 border-b border-white/5">
        <span className="uppercase font-bold tracking-wider text-cyan-400">
          {language || "code"}
        </span>
        <div className="flex gap-2">
          {isHtml && (
            <button
              type="button"
              onClick={() => onRunCode(content)}
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded cursor-pointer transition-colors border-none"
            >
              <Play className="h-2.5 w-2.5 text-emerald-450" />
              <span>RUN GAME</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-white cursor-pointer transition-colors border-none bg-transparent"
          >
            {copied ? (
              <>
                <Check className="h-2.5 w-2.5 text-emerald-400" />
                <span className="text-emerald-450 font-bold">COPIED</span>
              </>
            ) : (
              <>
                <Copy className="h-2.5 w-2.5" />
                <span>COPY</span>
              </>
            )}
          </button>
        </div>
      </div>
      <pre className="p-3.5 overflow-x-auto text-[10.5px] font-mono text-cyan-50/90 leading-normal max-h-72 select-text whitespace-pre scrollbar-thin scrollbar-thumb-white/10">
        <code>{content}</code>
      </pre>
    </div>
  );
};

export default function App() {
  // --- Game Persistence State ---
  // Default first-time users to start directly from level 1!
  const [level, setLevel] = useState<number>(() => {
    const forceResetV1 = localStorage.getItem("water_sort_force_level_1_reset_v3");
    if (!forceResetV1) {
      localStorage.setItem("water_sort_force_level_1_reset_v3", "true");
      localStorage.setItem("water_sort_level", "1");
      localStorage.setItem("water_sort_max_unlocked_level", "1");
      return 1;
    }
    const saved = localStorage.getItem("water_sort_level");
    return saved ? parseInt(saved, 10) : 1;
  });

  // --- Derived Automatic Difficulty based on current level ---
  const difficulty: "easy" | "medium" | "hard" = level <= 5 ? "easy" : (level <= 15 ? "medium" : "hard");

  // Keep track of the highest level unlocked by the human player naturally
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState<number>(() => {
    const forceResetV1 = localStorage.getItem("water_sort_force_level_1_reset_v3");
    if (!forceResetV1) {
      return 1;
    }
    const savedMax = localStorage.getItem("water_sort_max_unlocked_level");
    const savedCurrent = localStorage.getItem("water_sort_level");
    const currentLvl = savedCurrent ? parseInt(savedCurrent, 10) : 1;
    return savedMax ? Math.max(currentLvl, parseInt(savedMax, 10)) : currentLvl;
  });

  // --- Coin Wallet & System ---
  const [coins, setCoins] = useState<number>(() => {
    const saved = localStorage.getItem("water_sort_coins_balance");
    return saved ? parseInt(saved, 10) : 0; // default initial coins
  });

  // --- Interactive UX Phase state ---
  // 'splash' -> Shows GALAXY STUDIO splash intro
  // 'title'  -> Shows WATER COLOUR 2D main menu with Play, Level settings & info drawers
  // 'playing'-> Actual gameplay arena
  const [gamePhase, setGamePhase] = useState<'splash' | 'title' | 'playing'>('splash');
  const [splashProgress, setSplashProgress] = useState<number>(0);

  // --- Runtime Game State ---
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [initialBottles, setInitialBottles] = useState<Bottle[]>([]); // Saved seed representation for Replay
  const [history, setHistory] = useState<Bottle[][]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [movesCount, setMovesCount] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isCelebrating, setIsCelebrating] = useState<boolean>(false);
  const [addedBottleCount, setAddedBottleCount] = useState<number>(0);

  // --- Tooling & Options State ---
  const [soundMuted, setSoundMuted] = useState<boolean>(() => gameAudio.isSoundMuted());
  const [tutorialOpen, setTutorialOpen] = useState<boolean>(() => {
    const visited = localStorage.getItem("water_sort_visited_before");
    return visited !== "true";
  });
  const [showHintActive, setShowHintActive] = useState<boolean>(false);
  const [hintMove, setHintMove] = useState<{ from: number; to: number } | null>(null);
  const [hintDescription, setHintDescription] = useState<string | null>(null);

  // --- Theme State ('black' for dark mode and 'white' for light mode) ---
  const [theme, setTheme] = useState<'black' | 'white'>(() => {
    return (localStorage.getItem("water_sort_theme") as 'black' | 'white') || 'white';
  });

  // Synchronize theme configuration state with local storage
  useEffect(() => {
    localStorage.setItem("water_sort_theme", theme);
  }, [theme]);

  // --- Shop states for Custom Bottles and Backgrounds ---
  const [unlockedSkinIds, setUnlockedSkinIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("water_sort_unlocked_skin_ids");
    try {
      return saved ? JSON.parse(saved) : ["skin_0"];
    } catch {
      return ["skin_0"];
    }
  });

  const [equippedSkinId, setEquippedSkinId] = useState<string>(() => {
    const saved = localStorage.getItem("water_sort_equipped_skin_id");
    return saved || "skin_0";
  });

  const [unlockedBgIds, setUnlockedBgIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("water_sort_unlocked_bg_ids");
    try {
      return saved ? JSON.parse(saved) : ["bg_0", "bg_wood"];
    } catch {
      return ["bg_0", "bg_wood"];
    }
  });

  const [equippedBgId, setEquippedBgId] = useState<string>(() => {
    const saved = localStorage.getItem("water_sort_equipped_bg_id");
    return saved || "bg_0";
  });

  const [shopOpen, setShopOpen] = useState<boolean>(false);
  const [shopTab, setShopTab] = useState<'skins' | 'backgrounds'>('skins');

  useEffect(() => {
    localStorage.setItem("water_sort_unlocked_skin_ids", JSON.stringify(unlockedSkinIds));
  }, [unlockedSkinIds]);

  useEffect(() => {
    localStorage.setItem("water_sort_equipped_skin_id", equippedSkinId);
  }, [equippedSkinId]);

  useEffect(() => {
    localStorage.setItem("water_sort_unlocked_bg_ids", JSON.stringify(unlockedBgIds));
  }, [unlockedBgIds]);

  useEffect(() => {
    localStorage.setItem("water_sort_equipped_bg_id", equippedBgId);
  }, [equippedBgId]);

  const equippedSkin = BOTTLE_SKINS.find((s) => s.id === equippedSkinId) || BOTTLE_SKINS[0];
  const equippedBg = BACKGROUND_THEMES.find((b) => b.id === equippedBgId) || BACKGROUND_THEMES[0];

  // --- Username Identification State ---
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem("water_sort_username") || "";
  });
  const [nameInput, setNameInput] = useState<string>("");
  const [nameError, setNameError] = useState<string | null>(null);

  // --- Galaxy AI Chat Companion State ---
  const [aiChatOpen, setAiChatOpen] = useState<boolean>(false);
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("water_sort_ai_messages");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });
  const [inputText, setInputText] = useState<string>("");
  const [inputImage, setInputImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [aiIsTyping, setAiIsTyping] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [codePreviewContent, setCodePreviewContent] = useState<string | null>(null);

  // --- Premium Subscriptions & AI Usage Limits ---
  const [subscription, setSubscription] = useState<"none" | "1year" | "5years" | "lifetime">(() => {
    return (localStorage.getItem("water_sort_subscription") as any) || "none";
  });
  const [aiChatCount, setAiChatCount] = useState<number>(() => {
    return parseInt(localStorage.getItem("water_sort_ai_chat_count") || "0", 10);
  });
  const [aiImageCount, setAiImageCount] = useState<number>(() => {
    return parseInt(localStorage.getItem("water_sort_ai_image_count") || "0", 10);
  });
  const [lastAiReset, setLastAiReset] = useState<number>(() => {
    return parseInt(localStorage.getItem("water_sort_last_ai_reset") || "0", 10);
  });
  const [aiLimitHit, setAiLimitHit] = useState<boolean>(() => {
    return localStorage.getItem("water_sort_ai_limit_hit") === "true";
  });
  const [aiResetCountdown, setAiResetCountdown] = useState<string>("");
  const [forceOfflineMode, setForceOfflineMode] = useState<boolean>(() => {
    return localStorage.getItem("water_sort_force_offline") === "true";
  });

  useEffect(() => {
    localStorage.setItem("water_sort_subscription", subscription);
  }, [subscription]);

  useEffect(() => {
    localStorage.setItem("water_sort_ai_chat_count", aiChatCount.toString());
  }, [aiChatCount]);

  useEffect(() => {
    localStorage.setItem("water_sort_ai_image_count", aiImageCount.toString());
  }, [aiImageCount]);

  useEffect(() => {
    localStorage.setItem("water_sort_last_ai_reset", lastAiReset.toString());
  }, [lastAiReset]);

  useEffect(() => {
    localStorage.setItem("water_sort_ai_limit_hit", aiLimitHit ? "true" : "false");
  }, [aiLimitHit]);

  useEffect(() => {
    localStorage.setItem("water_sort_force_offline", forceOfflineMode ? "true" : "false");
  }, [forceOfflineMode]);

  const requestNotificationPermission = () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            showNotification("Notification permission granted! 🔔");
          }
        });
      } else if (Notification.permission === "denied") {
        showNotification("Please enable notifications in your browser settings to get alerts! 🔔");
      } else {
        showNotification("Notification settings are active! 🔔");
      }
    }
  };

  const triggerLimitOpenNotification = () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("Galaxy AI Limit Reset! 🚀", {
          body: `Hi ${userName || "Player"}! Your 24-hour daily AI limit has opened! Solve all your doubts in the world now! ✨`,
          icon: "/favicon.ico"
        });
      }
    }
    gameAudio.playVictory();
    showNotification("🎉 AI Limit Reset! You can now chat again! 🚀");
  };

  // Safe rate limit countdown live ticks and periodic reset check
  useEffect(() => {
    const ONE_DAY = 24 * 60 * 60 * 1000;
    
    const updateCountdownAndCheck = () => {
      const now = Date.now();
      if (lastAiReset === 0) return;
      
      const target = lastAiReset + ONE_DAY;
      const diff = target - now;
      
      if (diff <= 0) {
        setAiResetCountdown("");
        if (aiLimitHit) {
          setAiLimitHit(false);
          setAiChatCount(0);
          setAiImageCount(0);
          setLastAiReset(now);
          triggerLimitOpenNotification();
        } else if (aiChatCount > 0 || aiImageCount > 0) {
          setAiChatCount(0);
          setAiImageCount(0);
          setLastAiReset(now);
        }
      } else {
        const hrs = Math.floor(diff / (60 * 60 * 1000));
        const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
        const secs = Math.floor((diff % (60 * 1000)) / 1000);
        setAiResetCountdown(`${hrs}h ${mins}m ${secs}s`);
      }
    };

    updateCountdownAndCheck();
    const interval = setInterval(updateCountdownAndCheck, 1000);
    return () => clearInterval(interval);
  }, [lastAiReset, aiLimitHit, aiChatCount, aiImageCount, userName]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of AI chat log
  useEffect(() => {
    if (aiChatOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 80);
    }
  }, [aiMessages, aiIsTyping, aiChatOpen]);

  // Auto-welcome on user identification
  useEffect(() => {
    if (userName && aiMessages.length === 0) {
      const initialMsgs: ChatMessage[] = [
        {
          id: "welcome",
          sender: "ai",
          text: `🌌 **Hello Bro! Welcome to Galaxy AI!** ✨🤗\n\nI am your ultimate companion. Speak to me like a friend (bhai/bro) in **English, Hindi (हिन्दी), or Odia (ଓଡ଼ିଆ)**! I am fully user-friendly and ready to help you with anything—whether you want game tips, to chat about anything, or even want me to generate powerful code and games for you!\n\nHow can I help you today, brother? 🚀`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
      setAiMessages(initialMsgs);
      localStorage.setItem("water_sort_ai_messages", JSON.stringify(initialMsgs));
    }
  }, [userName, aiMessages]);

  const handleClearAiChat = () => {
    const welcomeMsg: ChatMessage[] = [
      {
        id: "welcome-reset",
        sender: "ai",
        text: `🌌 **Welcome back, bro!** ✨\n\nOur chat has been cleared and reset. Ask me anything in English, Hindi, or Odia—whether it's code generation, game development, or just a friendly chat! How can I help you today? 🤗`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setAiMessages(welcomeMsg);
    localStorage.setItem("water_sort_ai_messages", JSON.stringify(welcomeMsg));
    gameAudio.playVictory();
    showNotification("Galaxy AI Conversation Reset! 🔄");
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showNotification("Please select an image file! 🖼️");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showNotification("Image too large! Max 5MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setInputImage({
          data: reader.result,
          mimeType: file.type
        });
        showNotification("Image attached! Type prompt or hit Send 🚀");
        gameAudio.playPop();
      }
    };
    reader.readAsDataURL(file);
  };

  const checkAndResetDailyQuotas = () => {
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (now - lastAiReset >= ONE_DAY || lastAiReset === 0) {
      setAiChatCount(0);
      setAiImageCount(0);
      setLastAiReset(now);
      return { chats: 0, images: 0 };
    }
    return { chats: aiChatCount, images: aiImageCount };
  };

  const isAiAllowed = (isImg: boolean) => {
    const quotas = checkAndResetDailyQuotas();
    const activeChats = quotas.chats;

    // Lifetime gives unlimited access to everything
    if (subscription === "lifetime") {
      return { allowed: true };
    }

    if (isImg) {
      if (subscription === "5years") {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `Image analysis and generation is restricted under your current subscription status: ${subscription.toUpperCase()}.\n\nTo unlock image sending, generation, and analysis, please buy one of our higher VIP packages in the Game Shop:\n1. 5 Years Premium (₹99) - Unlimited text chats + image sending.\n2. Lifetime Premium (₹149) - Unlimited everything including AI image generator and image analysis.\n\n🛒 How to buy: Click the Game Shop (🛒) icon in the top header, select the "Coins & Ads" tab, choose your premium subscription plan, and click the Buy button!`
      };
    } else {
      if (subscription === "1year" || subscription === "5years") {
        return { allowed: true };
      }
      
      const maxChats = 30; // 30 daily messages limit
      if (activeChats >= maxChats) {
        setAiLimitHit(true);
        requestNotificationPermission();
        return {
          allowed: false,
          reason: `Daily free limit reached! You have used ${activeChats}/${maxChats} free AI messages today.\n\nTo continue chatting, get unlimited queries, or send images, please subscribe to a premium AI VIP plan!\n\nOur AI Chat Plans:\n- 1 Year Unlimited Text Chat: ₹49\n- 5 Years Unlimited Chat & Images: ₹99\n- Lifetime All-Access Premium: ₹149\n\n🛒 How to buy:\n1. Tap the **Game Shop (🛒)** button at the top of the main screen.\n2. Go to the **Coins & Ads** tab.\n3. Scroll down to the **Galaxy AI VIP Chat Subscriptions** section.\n4. Tap on your preferred package to securely buy it and enjoy unlimited chat instantly! Thank you for playing Water Sort!`
        };
      }
    }

    return { allowed: true };
  };

  const handleHomepageBackgroundClick = (e: React.MouseEvent) => {
    // Traverse up to see if we clicked inside any interactive element
    let target = e.target as HTMLElement | null;
    while (target && target !== e.currentTarget) {
      const tagName = target.tagName.toLowerCase();
      if (
        tagName === 'button' ||
        tagName === 'a' ||
        tagName === 'input' ||
        tagName === 'form' ||
        tagName === 'select' ||
        target.getAttribute('role') === 'button' ||
        target.classList.contains('cursor-pointer') ||
        target.id === "title-small-ad-bonus-btn" ||
        target.id === "title-weekly-gate-btn" ||
        target.id === "title-shop-toggle-btn" ||
        target.id === "title-settings-toggle-btn" ||
        target.id === "title-sound-toggle-btn" ||
        target.id === "welcome-screen-play-btn" ||
        target.id === "welcome-screen-daily-challenge-btn"
      ) {
        // Interactive element clicked, ignore
        return;
      }
      target = target.parentElement;
    }

    // Award +10 coins!
    setCoins((c) => c + 10);
    gameAudio.playPop();
    showNotification("Found +10 Cosmic Coins in the cosmos! 🪙✨");
  };

  const handleSendAiMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const activeText = customText !== undefined ? customText : inputText;
    if (!activeText.trim() && !inputImage) return;

    const userMsgText = activeText;
    const userMsgImg = inputImage;
    
    if (customText === undefined) {
      setInputText("");
    }
    setInputImage(null);

    // Run Quota Check intercepts
    const quotaCheck = isAiAllowed(!!userMsgImg);
    if (!quotaCheck.allowed) {
      const limitMsg: ChatMessage = {
        id: "ai-limit-" + Date.now(),
        sender: "ai",
        text: `⚠️ **Daily Quota Refusing to Sync**\n\n${quotaCheck.reason}\n\n*Subscription Level: ${subscription.toUpperCase()}*\n\n🛒 **Check the Paint Selector/Game Shop for VIP upgrades & persistent unlimited chat power!**`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const finalMsgs = [...aiMessages, limitMsg];
      setAiMessages(finalMsgs);
      localStorage.setItem("water_sort_ai_messages", JSON.stringify(finalMsgs));
      gameAudio.playError();
      return;
    }

    // Increment quotas
    if (userMsgImg) {
      setAiImageCount((prev) => prev + 1);
    }
    setAiChatCount((prev) => prev + 1);

    const newMsg: ChatMessage = {
      id: "usr-" + Date.now(),
      sender: "user",
      text: userMsgText || "Sent an attached screenshot/image",
      image: userMsgImg?.data,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMsgs = [...aiMessages, newMsg];
    setAiMessages(updatedMsgs);
    localStorage.setItem("water_sort_ai_messages", JSON.stringify(updatedMsgs));
    setAiIsTyping(true);
    gameAudio.playPop();

    try {
      let responseText = "";

      if (forceOfflineMode || (typeof navigator !== "undefined" && !navigator.onLine)) {
        // High quality responsive offline mode simulated delay (800ms) for high-craft feeling
        await new Promise((resolve) => setTimeout(resolve, 800));
        responseText = getOfflineAiResponse(userMsgText, bottles, level, userName);
      } else {
        const payload = {
          messages: updatedMsgs.map(m => ({ sender: m.sender, text: m.text })),
          image: userMsgImg,
          userName: userName
        };

        const response = await fetch("/api/gemini/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        if (data.text) {
          responseText = data.text;
        } else {
          // Fall back gracefully to offline response instead of erroring out when API key / limits act up!
          responseText = getOfflineAiResponse(userMsgText, bottles, level, userName);
        }
      }

      if (responseText) {
        const aiMsg: ChatMessage = {
          id: "ai-" + Date.now(),
          sender: "ai",
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const finalMsgs = [...updatedMsgs, aiMsg];
        setAiMessages(finalMsgs);
        localStorage.setItem("water_sort_ai_messages", JSON.stringify(finalMsgs));
        // Tone is kept silent here as requested: "game ai msg asile sound karani"
      } else {
        throw new Error("No response generated");
      }
    } catch (err: any) {
      console.error(err);
      // Even in catch block, fall back to offline strategist so the game is 100% playable and failsafe offline!
      const offlineFallbackText = getOfflineAiResponse(userMsgText, bottles, level, userName);
      const aiErrorMsg: ChatMessage = {
        id: "ai-fallback-" + Date.now(),
        sender: "ai",
        text: offlineFallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const finalMsgs = [...updatedMsgs, aiErrorMsg];
      setAiMessages(finalMsgs);
      localStorage.setItem("water_sort_ai_messages", JSON.stringify(finalMsgs));
      // Tone kept silent
    } finally {
      setAiIsTyping(false);
    }
  };

  // --- Informational Modals ---
  const [infoModal, setInfoModal] = useState<'about' | 'privacy' | 'contact' | 'settings' | null>(null);
  const [settingsTab, setSettingsTab] = useState<'preferences' | 'about' | 'privacy' | 'contact'>('preferences');
  const [levelSelectorOpen, setLevelSelectorOpen] = useState<boolean>(false);
  const [chatSaveGateOpen, setChatSaveGateOpen] = useState<boolean>(false);
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);
  const [resetPromptOpen, setResetPromptOpen] = useState<boolean>(false);

  // --- Daily & Weekly Challenge states ---
  const [dailyChallengeOpen, setDailyChallengeOpen] = useState<boolean>(false);
  const [weeklyChallengeOpen, setWeeklyChallengeOpen] = useState<boolean>(false);

  const [completedDailyLevels, setCompletedDailyLevels] = useState<number[]>(() => {
    const saved = localStorage.getItem("water_sort_completed_daily");
    return saved ? JSON.parse(saved) : [];
  });

  const [completedWeeklyLevels, setCompletedWeeklyLevels] = useState<number[]>(() => {
    const saved = localStorage.getItem("water_sort_completed_weekly");
    return saved ? JSON.parse(saved) : [];
  });

  const [dailyChallengeActive, setDailyChallengeActive] = useState<boolean>(false);
  const [dailyLevelIndex, setDailyLevelIndex] = useState<number>(1);

  const [weeklyChallengeActive, setWeeklyChallengeActive] = useState<boolean>(false);
  const [weeklyLevelIndex, setWeeklyLevelIndex] = useState<number>(1);

  const [weeklyUnlockTime, setWeeklyUnlockTime] = useState<number>(() => {
    const saved = localStorage.getItem("water_sort_weekly_unlock_time");
    if (saved) return parseInt(saved, 10);
    const initialTime = Date.now() + 24 * 60 * 60 * 1000; // 24 hours timer
    localStorage.setItem("water_sort_weekly_unlock_time", initialTime.toString());
    return initialTime;
  });

  const [weeklyCountdownText, setWeeklyCountdownText] = useState<string>("");
  const [weeklyIsUnlocked, setWeeklyIsUnlocked] = useState<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = weeklyUnlockTime - Date.now();
      if (remaining <= 0) {
        setWeeklyIsUnlocked(true);
        setWeeklyCountdownText("UNLOCKED");
      } else {
        setWeeklyIsUnlocked(false);
        const hrs = Math.floor(remaining / (1000 * 60 * 60));
        const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((remaining % (1000 * 60)) / 1000);
        setWeeklyCountdownText(`${hrs}h ${mins}m ${secs}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [weeklyUnlockTime]);

  const handleRenewChallenges = () => {
    setCompletedDailyLevels([]);
    setCompletedWeeklyLevels([]);
    localStorage.removeItem("water_sort_completed_daily");
    localStorage.removeItem("water_sort_completed_weekly");
    const nextTime = Date.now() + 24 * 60 * 60 * 1000;
    setWeeklyUnlockTime(nextTime);
    localStorage.setItem("water_sort_weekly_unlock_time", nextTime.toString());
    setCoins((c) => c + 1000);
    showNotification("Challenges renewed! Locked again, rewarded 1000 Coins! 🪙🎉");
    gameAudio.playVictory();
  };

  // --- New Feature: Interactive Lobby Bubbles with automatic regeneration and sound effects ---
  const [lobbyBubbles, setLobbyBubbles] = useState([
    { id: 1, top: '22%', left: '8%', size: 'w-10 h-10', color: 'from-cyan-400/30 to-blue-500/25', border: 'border-cyan-400/35', text: '🫧', popped: false, reward: 13 },
    { id: 2, top: '48%', left: '10%', size: 'w-12 h-12', color: 'from-fuchsia-400/30 to-pink-500/25', border: 'border-pink-400/35', text: '🔮', popped: false, reward: 50 },
    { id: 3, top: '35%', right: '8%', size: 'w-14 h-14', color: 'from-emerald-400/30 to-teal-500/25', border: 'border-emerald-400/35', text: '💧', popped: false, reward: 30 },
    { id: 4, top: '15%', right: '12%', size: 'w-9 h-9', color: 'from-amber-400/30 to-orange-500/25', border: 'border-amber-400/35', text: '✨', popped: false, reward: 22 },
  ]);

  const handlePopLobbyBubble = (id: number) => {
    const bub = lobbyBubbles.find(b => b.id === id);
    if (!bub || bub.popped) return;
    
    gameAudio.playPop();
    setCoins(prev => prev + bub.reward);
    showNotification(`Bubble Popped! +${bub.reward} Coins 🪙🫧`);
    
    setLobbyBubbles(bubbles => bubbles.map(b => b.id === id ? { ...b, popped: true } : b));
    
    setTimeout(() => {
      const bubbleRewardsPool = [13, 50, 30, 22, 15, 25, 35, 45, 18, 40];
      const randomReward = bubbleRewardsPool[Math.floor(Math.random() * bubbleRewardsPool.length)];
      setLobbyBubbles(bubbles => bubbles.map(b => b.id === id ? { ...b, popped: false, reward: randomReward } : b));
    }, 4500);
  };

  // --- Toast/Popup Alerts State ---
  const [toastText, setToastText] = useState<string>("");

  // --- Simulated Reward Video Ads Modal states ---
  const [adActive, setAdActive] = useState<boolean>(false);
  const [adCountdown, setAdCountdown] = useState<number>(5);

  // --- Trigger splash timer run ---
  useEffect(() => {
    if (gamePhase === 'splash') {
      const interval = setInterval(() => {
        setSplashProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          const increment = Math.floor(Math.random() * 8) + 4;
          return Math.min(prev + increment, 100);
        });
      }, 100);

      const timer = setTimeout(() => {
        setGamePhase('title');
      }, 3000);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [gamePhase]);

  // --- Initialize Level Seed ---
  useEffect(() => {
    generateLevelBoard();
  }, [level, difficulty, dailyChallengeActive, dailyLevelIndex, weeklyChallengeActive, weeklyLevelIndex]);

  // Sync volume state config to service
  useEffect(() => {
    gameAudio.setMute(soundMuted);
  }, [soundMuted]);

  // Persistent trackers
  useEffect(() => {
    localStorage.setItem("water_sort_level", level.toString());
  }, [level]);

  useEffect(() => {
    localStorage.setItem("water_sort_max_unlocked_level", maxUnlockedLevel.toString());
  }, [maxUnlockedLevel]);

  // Persistent coins tracker
  useEffect(() => {
    localStorage.setItem("water_sort_coins_balance", coins.toString());
  }, [coins]);

  /**
   * Action Toast Notice
   */
  const showNotification = (message: string) => {
    setToastText(message);
    setTimeout(() => {
      setToastText("");
    }, 4500);
  };

  /**
   * Helper to get level-dependent color mappings. Ensures different levels
   * use different colors from the 30 available GAME_COLORS, and absolutely
   * guarantees NO repeat/double colors in a single level by using a deterministic shuffle.
   */
  const getLevelColors = (levelNum: number, count: number): number[] => {
    // Copy the available colors list
    const pool = [...GAME_COLORS];
    
    // Simple deterministic pseudo-random generator based on levelNum as seed
    let seed = levelNum * 357913 + 123456;
    const nextRandom = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    
    // Knuth-Fisher-Yates deterministic shuffle using our custom seed
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(nextRandom() * (i + 1));
      const temp = pool[i];
      pool[i] = pool[j];
      pool[j] = temp;
    }
    
    // Slice exactly 'count' elements (clamped to pool size)
    const taken = pool.slice(0, Math.min(count, pool.length));
    return taken.map((c) => c.id);
  };

  /**
   * Level Board Generator (Fresh Shuffle)
   */
  const generateLevelBoard = () => {
    let colorsCount = 3;
    let emptyBottlesCount = 3;
    let colorSeed = level;

    if (dailyChallengeActive) {
      // 10 levels of increasing high difficulty
      colorsCount = Math.min(12, 6 + dailyLevelIndex); // Level 1: 7 colors, Level 10: 16 -> clamped to 12 colors!
      emptyBottlesCount = 2; // Very hard!
      colorSeed = 20000 + dailyLevelIndex;
    } else if (weeklyChallengeActive) {
      // 5 levels of supreme elite difficulty
      colorsCount = Math.min(12, 9 + weeklyLevelIndex); // Weekly 1: 10 colors, Weekly 5: 14 -> clamped to 12 colors!
      emptyBottlesCount = 2; // Elite!
      colorSeed = 80000 + weeklyLevelIndex;
    } else {
      // Dynamic Level-based hardness progression
      // Starts with 3 colors at Level 1, and grows gradually as level increases up to 12 colors at Level 10,000+
      let baseColors = 3;
      if (level <= 1) {
        baseColors = 3; 
      } else if (level <= 3) {
        baseColors = 4;
      } else if (level <= 10) {
        baseColors = 5;
      } else if (level <= 50) {
        baseColors = 6;
      } else if (level <= 150) {
        baseColors = 7;
      } else if (level <= 500) {
        baseColors = 8;
      } else if (level <= 2000) {
        baseColors = 9;
      } else if (level <= 8000) {
        baseColors = 10;
      } else if (level <= 25000) {
        baseColors = 11;
      } else {
        baseColors = 12; // Extremely complex and expert
      }

      // Number of empty bottles progresses as well to optimize space
      let baseEmpty = 3;
      if (level === 1) {
        baseEmpty = 3;
      } else if (level > 1 && level <= 5) {
        baseEmpty = 3; 
      } else {
        // Even levels have 2 empty bottles (harder), odd levels have 3 empty bottles (slightly easier)
        baseEmpty = level % 2 === 0 ? 2 : 3;
      }

      colorsCount = baseColors;
      emptyBottlesCount = baseEmpty;
    }

    const generated = generateSolvableLevel(colorsCount, emptyBottlesCount);

    // Map sequential color IDs (1...colorsCount) to our level-dependent color IDs
    const levelColors = getLevelColors(colorSeed, colorsCount);
    const mappedGenerated = generated.map((bottle) =>
      bottle.map((colorId) => levelColors[colorId - 1] || colorId)
    );

    setBottles(mappedGenerated);
    setInitialBottles(mappedGenerated.map((b) => [...b])); // Safe deep clone for Replays
    setHistory([]);
    setSelectedId(null);
    setMovesCount(0);
    setIsCompleted(false);
    setAddedBottleCount(0);
    setShowHintActive(false);
    setHintMove(null);
    setHintDescription(null);
  };

  /**
   * Replay Current Level Board (Same Layout seed)
   */
  const handleReplayLevel = () => {
    if (initialBottles.length > 0) {
      setBottles(initialBottles.map((b) => [...b]));
      setHistory([]);
      setSelectedId(null);
      setMovesCount(0);
      setIsCompleted(false);
      setShowHintActive(false);
      setHintMove(null);
      setHintDescription(null);
      setAddedBottleCount(0);
      gameAudio.playPop();
      showNotification("Replaying current layout! 🔄");
    } else {
      generateLevelBoard();
      showNotification("Restarting level board layout! 🔄");
    }
  };

  /**
   * Reset Level Progress only (starts fresh from Level 1)
   */
  const handleResetLevels = () => {
    localStorage.removeItem("water_sort_level");
    localStorage.removeItem("water_sort_max_unlocked_level");
    setLevel(1);
    setMaxUnlockedLevel(1);
    setHistory([]);
    setSelectedId(null);
    setMovesCount(0);
    setIsCompleted(false);
    setAddedBottleCount(0);
    setShowHintActive(false);
    setHintMove(null);
    setHintDescription(null);
    setGamePhase("title");
    setResetPromptOpen(false);
    setInfoModal(null);
    setTimeout(() => {
      generateLevelBoard();
    }, 50);
    gameAudio.playVictory();
    showNotification("Level progress reset! Started fresh from Level 1. 🔄");
  };

  /**
   * Reset Unlocked and Equipped Skins only
   */
  const handleResetSkins = () => {
    localStorage.setItem("water_sort_unlocked_skin_ids", JSON.stringify(["skin_0"]));
    localStorage.setItem("water_sort_equipped_skin_id", "skin_0");
    setUnlockedSkinIds(["skin_0"]);
    setEquippedSkinId("skin_0");
    setResetPromptOpen(false);
    setInfoModal(null);
    gameAudio.playVictory();
    showNotification("Bottle skins reset! Re-locked all helper skins. 🧪");
  };

  /**
   * Reset Unlocked and Equipped Backgrounds only
   */
  const handleResetBackgrounds = () => {
    localStorage.setItem("water_sort_unlocked_bg_ids", JSON.stringify(["bg_0"]));
    localStorage.setItem("water_sort_equipped_bg_id", "bg_0");
    setUnlockedBgIds(["bg_0"]);
    setEquippedBgId("bg_0");
    setResetPromptOpen(false);
    setInfoModal(null);
    gameAudio.playVictory();
    showNotification("Backgrounds reset! Re-locked all backgrounds. 🌌");
  };

  /**
   * Reset Everything (Wipe Data)
   */
  const handleResetEverything = () => {
    localStorage.removeItem("water_sort_level");
    localStorage.removeItem("water_sort_max_unlocked_level");
    localStorage.removeItem("water_sort_coins_balance");
    localStorage.removeItem("water_sort_difficulty");
    localStorage.removeItem("water_sort_theme");
    localStorage.setItem("water_sort_unlocked_skin_ids", JSON.stringify(["skin_0"]));
    localStorage.setItem("water_sort_equipped_skin_id", "skin_0");
    localStorage.setItem("water_sort_unlocked_bg_ids", JSON.stringify(["bg_0"]));
    localStorage.setItem("water_sort_equipped_bg_id", "bg_0");
    
    setLevel(1);
    setMaxUnlockedLevel(1);
    setCoins(0);
    setTheme("black");
    setUnlockedSkinIds(["skin_0"]);
    setEquippedSkinId("skin_0");
    setUnlockedBgIds(["bg_0"]);
    setEquippedBgId("bg_0");
    setHistory([]);
    setSelectedId(null);
    setMovesCount(0);
    setIsCompleted(false);
    setAddedBottleCount(0);
    setShowHintActive(false);
    setHintMove(null);
    setHintDescription(null);
    setInfoModal(null);
    setGamePhase("title");
    setResetPromptOpen(false);
    
    setTimeout(() => {
      generateLevelBoard();
    }, 50);
    
    gameAudio.playVictory();
    showNotification("Fresh start activated! Full game progress wiped. 🔄⭐");
  };

  // Keep compatibility for any direct call under old name
  const handleGlobalRestartGame = () => {
    setResetPromptOpen(true);
  };

  /**
   * Selection of completed/unlocked levels is fully allowed.
   */
  const handleSetLevel = (targetLvl: number) => {
    if (targetLvl <= maxUnlockedLevel) {
      setLevel(targetLvl);
      setIsCompleted(false);
      gameAudio.playPop();
      showNotification(`Switched to Level ${targetLvl}!`);
    } else {
      gameAudio.playError();
      showNotification(`Level ${targetLvl} is locked! Complete Level ${level} to naturally progress.`);
    }
  };

  /**
   * Skip levels (costs 5000 coins)
   */
  const handleSkipLevel = () => {
    if (level >= 100000) {
      showNotification("You are on Level 100000, which is the final level!");
      gameAudio.playError();
      return;
    }

    if (coins < 5000) {
      showNotification("Need 5000 coins! Watch simulated ad to earn fast");
      gameAudio.playError();
      return;
    }

    setCoins((c) => Math.max(0, c - 5000));
    const nextLvl = level + 1;
    const nextUnlocked = Math.min(100000, Math.max(maxUnlockedLevel, nextLvl));
    setMaxUnlockedLevel(nextUnlocked);
    setLevel(nextLvl);
    setIsCompleted(false);
    gameAudio.playVictory();
    showNotification(`Level Skipped to level ${nextLvl}! -5000🪙`);
  };

  // --- Simulated Reward Ad Timer Safe Engine ---
  useEffect(() => {
    if (!adActive) return;
    if (adCountdown <= 0) {
      setCoins((c) => c + 50);
      setAdActive(false);
      gameAudio.playVictory();
      showNotification("Rewarded +50 Coins! 🪙");
      return;
    }
    const timer = setTimeout(() => {
      setAdCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [adActive, adCountdown]);

  /**
   * Watch Simulated Reward Video Ads (+50 Coins) - Instant reward, no blocking overlay!
   */
  const handleTriggerAdReward = () => {
    setCoins((c) => c + 50);
    gameAudio.playVictory();
    if (subscription !== "none") {
      showNotification("VIP Auto-Reward: +50 Coins credited instantly! (Ads-Off Skip) 🪙✨");
    } else {
      showNotification("Sponsored Reward: +50 Coins credited instantly! 🪙");
    }
  };

  /**
   * Swapping difficulty states (automatically determined based on current level progress)
   */
  const handleDifficultyChange = (newDiff: "easy" | "medium" | "hard") => {
    // Kept as dummy for compatibility with legacy component props
  };

  /**
   * Action: Selection change
   */
  const handleSelectBottle = (id: number) => {
    if (selectedId === id) {
      setSelectedId(null);
    } else {
      setSelectedId(id);
    }
  };

  /**
   * Action: Core Pour Engine Callback
   */
  const handlePourComplete = (sourceId: number, targetId: number) => {
    // 1. Deep copy prior step into Undo logs
    const historyCopy = bottles.map((b) => [...b]);
    const updatedHistory = [...history, historyCopy];

    // 2. Compute state transition results
    const src = [...bottles[sourceId]];
    const tgt = [...bottles[targetId]];

    const colorId = src[src.length - 1];

    // Count contiguous elements of the same color on top of the source
    let pourCount = 0;
    for (let i = src.length - 1; i >= 0; i--) {
      if (src[i] === colorId) {
        pourCount++;
      } else {
        break;
      }
    }

    // Capacity check target
    const remainingTarget = 4 - tgt.length;
    const actualPouredAmount = Math.min(pourCount, remainingTarget);

    for (let p = 0; p < actualPouredAmount; p++) {
      src.pop();
      tgt.push(colorId);
    }

    // Set updated state
    const nextBottles = bottles.map((b, idx) => {
      if (idx === sourceId) return src;
      if (idx === targetId) return tgt;
      return [...b];
    });

    setBottles(nextBottles);
    setHistory(updatedHistory);
    setSelectedId(null); // Deselect on complete
    setMovesCount((m) => m + 1);

    // Drop active hint visuals to keep focus minimal
    setShowHintActive(false);
    setHintMove(null);
    setHintDescription(null);

    // 3. Victory Checker - auto completion next level prompt
    if (checkIsSolved(nextBottles)) {
      setIsCelebrating(true);
      
      if (dailyChallengeActive) {
        setCoins((c) => c + 200);
        const nextCompleted = Array.from(new Set([...completedDailyLevels, dailyLevelIndex]));
        setCompletedDailyLevels(nextCompleted);
        localStorage.setItem("water_sort_completed_daily", JSON.stringify(nextCompleted));
      } else if (weeklyChallengeActive) {
        setCoins((c) => c + 350);
        const nextCompleted = Array.from(new Set([...completedWeeklyLevels, weeklyLevelIndex]));
        setCompletedWeeklyLevels(nextCompleted);
        localStorage.setItem("water_sort_completed_weekly", JSON.stringify(nextCompleted));
      } else {
        setCoins((c) => c + 100); // Rewarding 100 coins on complete level
        const nextLevelUnlocked = Math.min(100000, level + 1);
        if (nextLevelUnlocked > maxUnlockedLevel) {
          setMaxUnlockedLevel(nextLevelUnlocked);
        }
      }
      
      gameAudio.playVictory();

      // Exactly 2 seconds delay celebration then prompt next level
      setTimeout(() => {
        setIsCelebrating(false);
        setIsCompleted(true);
      }, 2000);
    }
  };

  /**
   * Support: Undo Operation
   */
  const handleUndo = () => {
    if (history.length === 0) return;
    gameAudio.playPop();

    const previousState = history[history.length - 1];
    setBottles(previousState);

    const nextHistory = history.slice(0, -1);
    setHistory(nextHistory);

    setSelectedId(null);
    setMovesCount((m) => Math.max(0, m - 1));
    setShowHintActive(false);
    setHintMove(null);
    setHintDescription(null);
  };

  /**
   * Support: Additional Tube Assistance
   */
  const handleAddBottle = () => {
    // Strictly capped at exactly 1 extra bottle maximum for all difficulties
    if (addedBottleCount >= 1) {
      gameAudio.playError();
      showNotification("You can only add a maximum of 1 extra tube!");
      return;
    }

    if (coins < 10000) {
      gameAudio.playError();
      showNotification("Need 10,000 Coins to add an extra tube! Watch ads to earn.");
      return;
    }

    setCoins((c) => Math.max(0, c - 10000));
    gameAudio.playPop();
    setBottles([...bottles, []]); // append new empty glass tube!
    setAddedBottleCount((c) => c + 1);
    showNotification("Purchased Extra Tube! -10000🪙");
  };

  /**
   * Support: Custom Hint calculations (Costs 2000 coins)
   */
  const handleShowHint = () => {
    if (showHintActive) {
      setShowHintActive(false);
      setHintMove(null);
      setHintDescription(null);
      gameAudio.playPop();
      return;
    }

    // Check coin requirements first
    if (coins < 2000) {
      showNotification("Need 2000 coins for a hint! Claim Gift or Watch Ads to earn!");
      gameAudio.playError();
      return;
    }

    // Tap solver
    const solution = solveWaterSort(bottles, 3000);
    if (solution && solution.length > 0) {
      const nextMove = solution[0];
      setCoins((c) => Math.max(0, c - 2000)); // deduct coins for hint
      setHintMove(nextMove);
      setHintDescription(
        `Suggested: Pour tube ${nextMove.from + 1} into tube ${nextMove.to + 1}`
      );
      setShowHintActive(true);
      gameAudio.playPop();
      showNotification("Hint obtained! -2000🪙");
    } else {
      // Solver detected no possibilities
      setHintMove(null);
      setHintDescription("No valid moves available. Try using Undo or adding a tube!");
      setShowHintActive(true);
      gameAudio.playError();
    }
  };

  /**
   * Copy Email trigger and copy alert notice
   */
  const handleCopyEmail = () => {
    const emailStr = "watersort@gmail.com";
    navigator.clipboard.writeText(emailStr).then(() => {
      setCopiedEmail(true);
      gameAudio.playSelect();
      setTimeout(() => setCopiedEmail(false), 2000);
    });
  };

  /**
   * Play audio toggle
   */
  const handleToggleSound = () => {
    setSoundMuted((m) => !m);
  };

  /**
   * Close or open tutorial panels
   */
  const handleOpenTutorial = () => {
    setTutorialOpen(true);
    gameAudio.playPop();
  };

  const handleCloseTutorial = () => {
    setTutorialOpen(false);
    localStorage.setItem("water_sort_visited_before", "true");
    gameAudio.playPop();
  };

  /**
   * Navigation: Next game challenge
   */
  const handleNextLevel = () => {
    if (dailyChallengeActive) {
      if (dailyLevelIndex < 10) {
        setDailyLevelIndex(dailyLevelIndex + 1);
        setIsCompleted(false);
        gameAudio.playPop();
      } else {
        setIsCompleted(false);
        setDailyChallengeActive(false);
        setGamePhase('title');
        setDailyChallengeOpen(true);
        showNotification("All 10 Daily Challenge levels completed! 🏆");
        gameAudio.playVictory();
      }
      return;
    }

    if (weeklyChallengeActive) {
      if (weeklyLevelIndex < 5) {
        setWeeklyLevelIndex(weeklyLevelIndex + 1);
        setIsCompleted(false);
        gameAudio.playPop();
      } else {
        setIsCompleted(false);
        setWeeklyChallengeActive(false);
        setGamePhase('title');
        setWeeklyChallengeOpen(true);
        showNotification("All 5 Weekly Challenge levels completed! 🎖️");
        gameAudio.playVictory();
      }
      return;
    }

    const nextLvl = level + 1;
    if (nextLvl > 100000) {
      showNotification("CONGRATULATIONS! You completed all 100000 levels! 🎉");
      gameAudio.playVictory();
      setIsCompleted(false);
      return;
    }
    const nextUnlocked = Math.min(100000, Math.max(maxUnlockedLevel, nextLvl));
    setMaxUnlockedLevel(nextUnlocked);
    setLevel(nextLvl);
    gameAudio.playPop();
    setIsCompleted(false);
  };

  return (
    <div id="game-container" className={`relative h-screen h-[100dvh] w-full overflow-hidden flex flex-col items-center justify-center font-sans select-none transition-all duration-300 p-0 ${
      theme === 'white' 
        ? "bg-slate-50 text-slate-950" 
        : (equippedBgId === 'bg_0' ? "bg-gradient-to-b from-[#07090f] to-[#010103]" : (equippedBg ? equippedBg.gradientClass : "bg-[#0a1226]")) + " text-slate-100"
    }`}>
      
      {/* Floating notification Toast */}
      <AnimatePresence>
        {toastText && (
          <motion.div
            key="toast-banner"
            initial={{ opacity: 0, y: -25, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -25, scale: 0.92 }}
            className="fixed top-4 z-[99] bg-[#1a233d] border border-cyan-500/40 text-cyan-200 px-5 py-3 rounded-2xl shadow-2xl font-sans text-xs font-black tracking-widest uppercase text-center max-w-xs mx-auto flex items-center justify-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            <span>{toastText}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic ambient dark background glowing bubble spotlights */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden origin-center opacity-50">
        <div className="absolute top-[10%] left-[8%] w-80 h-80 rounded-full bg-blue-600/15 blur-[130px]" />
        <div className="absolute bottom-[18%] right-[10%] w-96 h-96 rounded-full bg-cyan-600/10 blur-[130px]" />
        <div className="absolute top-[40%] right-[3%] w-72 h-72 rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      {/* Primary Mobile-Friendly Viewport - Clean responsive wrapper without mock device frames */}
      <div 
        className={`w-full h-[100dvh] relative overflow-hidden flex flex-col justify-between transition-all duration-300 ${
          theme === 'white'
            ? "bg-slate-50 text-slate-900"
            : (equippedBgId === 'bg_0' ? "bg-gradient-to-b from-[#0a0d16] via-[#05070c] to-[#010103]" : (equippedBg ? equippedBg.gradientClass : "bg-[#070b19]")) + " text-slate-100"
        }`}
        style={theme !== 'white' && equippedBgId === 'bg_wood' ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        id="portable-mobile-gaming-frame"
      >
        <div className="flex-1 w-full relative overflow-hidden flex flex-col justify-between">
          
          {/* Cartoon liquid splash layout decoration like the user image */}
          {theme !== 'white' && equippedBgId === 'bg_wood' && (
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
              {/* Top Splats - multiple organic bezier waves or blobs in darker blue */}
              <div className="absolute top-0 left-0 right-0 h-44 opacity-80 select-none pointer-events-none">
                <svg viewBox="0 0 400 150" fill="#2db5ff" className="w-full h-full filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.08)]">
                  <path d="M 0,0 
                           L 400,0 
                           L 400,90 
                           Q 360,70 320,110 
                           Q 280,140 240,105 
                           Q 200,70 160,115 
                           Q 120,140 80,100 
                           Q 40,70 0,95 Z" />
                </svg>
              </div>

              {/* Bottom Splats - multiple organic wavy splashes like the user image */}
              <div className="absolute bottom-0 left-0 right-0 h-48 opacity-85 select-none pointer-events-none">
                <svg viewBox="0 0 400 160" fill="#2299dd" className="w-full h-full filter drop-shadow-[0_-5px_8px_rgba(0,0,0,0.06)]">
                  <path d="M 0,160 
                           L 400,160 
                           L 400,70 
                           Q 350,110 310,75 
                           Q 260,35 220,80 
                           Q 170,115 130,55 
                           Q 90,5 50,75 
                           Q 20,110 0,60 Z" />
                </svg>
              </div>

              {/* Animated Floating Bubbles */}
              <div className="absolute inset-0 select-none pointer-events-none">
                {/* Bubble 1 */}
                <span className="absolute left-[8%] bottom-[25%] w-8 h-8 rounded-full bg-white/20 border border-white/30 shadow-[inset_0_3px_5px_rgba(255,255,255,0.3)] animate-[bounce_8s_infinite]" />
                
                {/* Bubble 2 */}
                <span className="absolute right-[12%] top-[30%] w-6 h-6 rounded-full bg-white/15 border border-white/25 shadow-[inset_0_2px_4px_rgba(255,255,255,0.25)] animate-pulse" />

                {/* Bubble 3 */}
                <span className="absolute left-[35%] top-[15%] w-10 h-10 rounded-full bg-white/20 border border-white/30 shadow-[inset_0_4px_6px_rgba(255,255,255,0.3)]" />

                {/* Bubble 4 */}
                <span className="absolute right-[22%] bottom-[35%] w-5 h-5 rounded-full bg-white/15 border border-white/25 animate-bounce" style={{ animationDuration: '6s' }} />

                {/* Bubble 5 */}
                <span className="absolute right-[40%] bottom-[18%] w-9 h-9 rounded-full bg-white/20 border border-white/35 shadow-[inset_0_3px_5px_rgba(255,255,255,0.3)] animate-pulse" style={{ animationDuration: '7s' }} />
              </div>
            </div>
          )}
          
          {/* STATE 1: WATER COLOUR 2D SPLASH INTRO */}
          <AnimatePresence mode="wait">
            {gamePhase === 'splash' && (
              <motion.div
                key="splash-screen"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.6 } }}
                onClick={() => setGamePhase('title')}
                className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#0c51f3] text-white cursor-pointer select-none"
                id="galaxy-studio-splash-screen"
              >
                {/* Clean minimalist design exactly like picture */}
                <div className="flex flex-col items-center justify-center text-center space-y-12">
                  {/* Rhombus Box with letter G */}
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.6, type: "spring" }}
                    className="relative w-28 h-28 flex items-center justify-center"
                  >
                    {/* Rhombus/Diamond shape with drop shadow */}
                    <div className="absolute w-24 h-24 bg-[#ef235a] rounded-3xl rotate-45 shadow-[0_12px_28px_rgba(0,0,0,0.35)] flex items-center justify-center">
                      {/* G is normalized upright */}
                      <span className="font-sans text-[54px] font-black text-white select-none rotate-[-45deg] transform translate-x-[-1px] translate-y-[-1px] tracking-normal leading-none flex items-center justify-center">
                        G
                      </span>
                    </div>
                  </motion.div>

                  {/* Text Logo */}
                  <div className="space-y-3.5 pt-4">
                    <h1 className="font-sans text-[28px] sm:text-[32px] font-extrabold tracking-[12px] text-white select-none pl-[12px]">
                      GALAXY
                    </h1>
                    <p className="font-sans text-[11px] font-extrabold tracking-[8px] text-[#ef235a] select-none uppercase pl-[8px]">
                      STUDIO
                    </p>
                  </div>
                </div>

                {/* Micro clean load bar at very bottom - doesn't disrupt clean elegant style */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-60">
                  <div className="w-24 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${splashProgress}%` }}
                      className="h-full bg-white rounded-full transition-all duration-100"
                    />
                  </div>
                  <span className="text-[8px] font-mono tracking-wider opacity-80">LOADING {splashProgress}%</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* STATE 2: WATER COLOUR 2D MAIN WELCOME SCREEN */}
          <AnimatePresence>
            {gamePhase === 'title' && (
              <motion.div
                key="title-screen"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={handleHomepageBackgroundClick}
                className={`absolute inset-0 z-40 flex flex-col justify-between p-4 sm:p-6 transition-all duration-300 overflow-hidden ${
                  theme === 'white'
                    ? "bg-gradient-to-b from-[#e6f4f1] via-[#f0f9f8] to-[#e1f5fe] text-slate-900"
                    : (equippedBgId === 'bg_0' ? "bg-transparent text-slate-900" : "bg-gradient-to-b from-[#0e2a47] via-[#081a30] to-[#030914] text-white")
                }`}
                id="water-colour-2d-title-phase"
              >
                {/* Dynamic and fully interactive popping bubble decals - something cool & new! */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                  {lobbyBubbles.map((bub) => (
                    <AnimatePresence key={bub.id}>
                      {!bub.popped && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5, y: 15 }}
                          animate={{ 
                            opacity: 0.82, 
                            scale: 1, 
                            y: [0, -12, 0],
                            x: [0, 6, 0]
                          }}
                          exit={{ 
                            opacity: 0, 
                            scale: 1.8, 
                            rotate: 45, 
                            filter: 'blur(4px)',
                            transition: { duration: 0.25 } 
                          }}
                          transition={{
                            y: { duration: 3.5 + bub.id, repeat: Infinity, ease: "easeInOut" },
                            x: { duration: 2.8 + bub.id, repeat: Infinity, ease: "easeInOut" },
                            opacity: { duration: 0.3 }
                          }}
                          style={{ 
                            top: bub.top, 
                            left: bub.left || 'auto',
                            right: bub.right || 'auto',
                          }}
                          onClick={() => handlePopLobbyBubble(bub.id)}
                          className={`absolute pointer-events-auto rounded-full bg-gradient-to-tr ${bub.color} border ${bub.border} shadow-lg ${bub.shadow} cursor-pointer flex items-center justify-center text-[10px] select-none hover:brightness-125 hover:scale-110 active:scale-95 transition-all filter backdrop-blur-[0.5px] ${bub.size}`}
                          title={`Click to pop for +${bub.reward} Coins!`}
                        >
                          {/* Shimmer light effect inside the bubble */}
                          <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 bg-white/60 rounded-full" />
                          <span className="text-[10px] filter drop-shadow-md">{bub.text}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  ))}
                </div>
                {/* Top Bar for Sound Toggle & Coins Display */}
                <div className="flex justify-between items-center w-full z-10 shrink-0 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 border px-3 py-1 rounded-full backdrop-blur-md transition-all ${
                      theme === 'white'
                        ? "bg-white/90 border-slate-200 text-slate-800"
                        : "bg-black/40 border-white/10 text-amber-200"
                    }`}>
                      <Coins className="h-3.5 w-3.5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
                      <span className="font-mono text-xs font-black">{coins}</span>
                    </div>

                    {/* GALAXY COSMIC GIFT COIN REWARD */}
                    <motion.button
                      onClick={() => {
                        setCoins((c) => c + 50);
                        gameAudio.playVictory();
                        showNotification("Claimed Reward! +50 Coins 🪙🎁");
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white font-sans text-[8px] font-black px-2 py-1 rounded-full shadow-md cursor-pointer tracking-wider shrink-0 uppercase border border-emerald-400/10 active:scale-95 transition-all"
                      id="title-small-gift-bonus-btn"
                      title="Claim free 50 Coins reward"
                    >
                      <Sparkles className="h-2.5 w-2.5 animate-pulse text-emerald-100" />
                      <span>+50🪙 GIFT</span>
                    </motion.button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* WEEKLY CHALLENGE GATE ICON */}
                    <motion.button
                      onClick={() => {
                        setWeeklyChallengeOpen(true);
                        gameAudio.playPop();
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`w-8 h-8 flex items-center justify-center rounded-full border cursor-pointer select-none shadow-lg transition-all ${
                        weeklyIsUnlocked 
                          ? "bg-gradient-to-r from-cyan-500/20 to-teal-550/20 border-cyan-500/40 text-cyan-300 hover:border-cyan-400"
                          : "bg-gradient-to-r from-rose-500/10 to-pink-500/10 border-rose-500/30 text-rose-450 hover:border-rose-400 opacity-90"
                      }`}
                      title={weeklyIsUnlocked ? "Enter Weekly Gate!" : `Weekly Gate locked (Unlocks in ${weeklyCountdownText})`}
                      id="title-weekly-gate-btn"
                    >
                      {weeklyIsUnlocked ? (
                        <DoorOpen className="h-4 w-4 text-cyan-400 animate-bounce" style={{ animationDuration: '3s' }} />
                      ) : (
                        <DoorClosed className="h-4 w-4 text-rose-400" />
                      )}
                    </motion.button>

                    {/* SKIN/BOTTLE SHOP BUTTON AS REQUESTED BY USER */}
                    <motion.button
                      onClick={() => {
                        setShopOpen(true);
                        gameAudio.playPop();
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-amber-200 cursor-pointer select-none shadow-lg transition-all"
                      title="Open Shop & Skins"
                      id="title-shop-toggle-btn"
                    >
                      <ShoppingBag className="h-4 w-4 text-amber-400" />
                    </motion.button>

                    {/* SETTINGS MENU BUTTON AS REQUESTED BY USER */}
                    <motion.button
                      onClick={() => {
                        setInfoModal('settings');
                        setSettingsTab('preferences');
                        gameAudio.playPop();
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-black/40 border border-white/10 hover:border-cyan-500/30 text-slate-300 hover:text-white cursor-pointer select-none shadow-lg transition-all"
                      title="Open Game Settings"
                      id="title-settings-toggle-btn"
                    >
                      <Settings className="h-4 w-4 text-indigo-400 hover:scale-105 transition-transform" />
                    </motion.button>

                    <motion.button
                      onClick={() => {
                        handleToggleSound();
                        gameAudio.playPop();
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-black/40 border border-white/10 hover:border-cyan-500/30 text-slate-300 hover:text-white cursor-pointer select-none shadow-lg transition-all"
                      title={soundMuted ? "Unmute system sounds" : "Mute system sounds"}
                      id="title-sound-toggle-btn"
                    >
                      {soundMuted ? (
                        <VolumeX className="h-4 w-4 text-rose-500 hover:scale-105 transition-transform" />
                      ) : (
                        <Volume2 className="h-4 w-4 text-cyan-400 hover:scale-105 transition-transform" />
                      )}
                    </motion.button>
                  </div>
                </div>

                {/* If Username is not set, force identification input first as requested */}
                {!userName ? (
                  <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-full max-w-sm bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 shadow-2xl text-center space-y-6 flex flex-col items-center justify-between"
                      id="identity-welcome-card"
                    >
                      <div className="space-y-2">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 shadow-lg shadow-yellow-500/20 mx-auto">
                          <Palette className="h-7 w-7 text-slate-950 animate-bounce" />
                        </div>
                        <h2 className="font-sans text-base font-black text-white uppercase tracking-[1px] pt-2">
                          Welcome Player!
                        </h2>
                        <p className="font-sans text-[11px] text-slate-350 leading-relaxed max-w-xs mx-auto">
                          Enter your name to start sorting colorful liquids and unlock expert help from **Galaxy AI**!
                        </p>
                      </div>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!nameInput.trim()) {
                            setNameError("Please enter your name");
                            gameAudio.playError();
                            return;
                          }
                          if (nameInput.trim().length > 15) {
                            setNameError("Name is too long (Max 15 letters)");
                            gameAudio.playError();
                            return;
                          }
                          const trimmed = nameInput.trim();
                          setUserName(trimmed);
                          localStorage.setItem("water_sort_username", trimmed);
                          gameAudio.playVictory();
                          showNotification(`Welcome, ${trimmed}! Let's sort! 🎉`);
                        }}
                        className="w-full space-y-4"
                      >
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Enter Name..."
                            value={nameInput}
                            onChange={(e) => {
                              setNameInput(e.target.value);
                              if (nameError) setNameError(null);
                            }}
                            className="w-full bg-slate-950 border border-slate-700/60 rounded-2xl py-3 px-4 text-xs font-bold font-sans text-center text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-400 tracking-[1px]"
                          />
                        </div>

                        {nameError && (
                          <p className="text-[10px] font-mono text-rose-450 uppercase tracking-wider animate-pulse">
                            ⚠️ {nameError}
                          </p>
                        )}

                        <motion.button
                          type="submit"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-semibold text-slate-950 font-sans text-xs font-black uppercase tracking-[2px] rounded-2xl border-t border-white/20 border-b-4 border-amber-600 shadow-lg shadow-amber-500/20 select-none cursor-pointer"
                        >
                          START PLAYING
                        </motion.button>
                      </form>
                    </motion.div>
                  </div>
                ) : (
                  <>
                    {/* Logo area */}
                    <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0 [content-visibility:auto]">
                      
                      {/* Overlapping Cartoon Test Tubes and Mascot character like the user image - smaller on short viewports */}
                      <div className="relative mb-2 sm:mb-4 mt-1 sm:mt-2 flex flex-col items-center justify-center scale-75 xs:scale-85 sm:scale-100 origin-center shrink-0">
                        <motion.div
                          animate={{ y: [0, -6, 0], rotate: [0, 1, 0] }}
                          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                          className="relative w-40 h-28 sm:w-48 sm:h-36 flex items-center justify-center filter drop-shadow-[0_8px_20px_rgba(30,144,255,0.4)] select-none pointer-events-none"
                        >
                          {/* Tube 1 (Tilted Left) */}
                          <div className="absolute w-8 sm:w-10 h-24 sm:h-30 rounded-b-3xl border-[3px] sm:border-[3.5px] border-white bg-white/10 backdrop-blur-[0.5px] rotate-[-22deg] origin-bottom shadow-[inset_0_4px_12px_rgba(255,255,255,0.5)] overflow-hidden flex flex-col justify-end left-3">
                            {/* Liquid Layer 3 (Cyan) */}
                            <div className="h-5 sm:h-6 bg-[#38bdf8] w-full relative">
                              <span className="absolute left-1 top-0.5 w-1 h-1 rounded-full bg-white/45" />
                            </div>
                            {/* Liquid Layer 2 (Pink) */}
                            <div className="h-6 sm:h-7 bg-[#f472b6] w-full relative">
                              <span className="absolute right-1 top-1 w-1 h-1 rounded-full bg-white/40" />
                            </div>
                            {/* Liquid Layer 1 (Green) */}
                            <div className="h-7 sm:h-8 bg-[#4ade80] w-full relative">
                              <span className="absolute left-2 top-1 w-1 h-1 rounded-full bg-white/40" />
                            </div>
                            {/* Tube Glass Shine Reflection */}
                            <div className="absolute top-0 right-0.5 w-1 h-full bg-white/15 rounded-full" />
                          </div>

                          {/* Player.png Mascot in the center of the logo! */}
                          <motion.img
                            src={playerImage}
                            alt="Water Sort character mascot hero"
                            referrerPolicy="no-referrer"
                            animate={{ scale: [1, 1.05, 1], y: [0, -4, 0] }}
                            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute w-18 h-18 sm:w-22 sm:h-22 object-contain filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.5)] z-20"
                          />

                          {/* Tube 2 (Tilted Right, Overlapping) */}
                          <div className="absolute w-9 sm:w-11 h-26 sm:h-32 rounded-b-3xl border-[3px] sm:border-[3.5px] border-white bg-white/15 backdrop-blur-[0.5px] rotate-[18deg] origin-bottom shadow-[0_5px_15px_rgba(0,0,0,0.2),inset_0_4px_12px_rgba(255,255,255,0.6)] overflow-hidden flex flex-col justify-end z-10 translate-y-2 right-3">
                            {/* Liquid Layer 3 (Blue) */}
                            <div className="h-6 sm:h-7 bg-[#2563eb] w-full relative">
                              <span className="absolute left-1 top-1 w-1 h-1 rounded-full bg-white/55" />
                            </div>
                            {/* Liquid Layer 2 (Cyan/Turquoise) */}
                            <div className="h-6 sm:h-7 bg-[#2dd4bf] w-full relative">
                              <span className="absolute right-1 top-0.5 w-1 h-1 rounded-full bg-white/40" />
                            </div>
                            {/* Liquid Layer 1 (Green) */}
                            <div className="h-8 sm:h-9 bg-[#22c55e] w-full relative">
                              <span className="absolute left-2 top-2 w-1.5 h-1.5 rounded-full bg-white/50" />
                            </div>
                            {/* Tube Glass Shine Reflection */}
                            <div className="absolute top-0 right-0.5 w-1 h-full bg-white/20 rounded-full" />
                          </div>
                        </motion.div>
                      </div>

                      {/* Premium Neon-Glow Curved Pod Background for the brand title - smaller padded & compact */}
                      <div className="relative w-full max-w-[310px] sm:max-w-[340px] px-4 py-3 sm:px-6 sm:py-5 mx-auto rounded-[24px] sm:rounded-[32px] overflow-hidden flex flex-col items-center select-none bg-white/75 border border-white/40 shadow-[0_12px_30px_rgba(30,144,255,0.06),inset_0_1px_2px_rgba(255,255,255,0.4)] backdrop-blur-md shrink-0">
                        {/* Dynamic colorful water glow elements in the background */}
                        <div className="absolute top-[-40px] left-[-30px] w-24 h-24 rounded-full bg-cyan-450/10 blur-xl animate-[pulse_5s_infinite]" />
                        <div className="absolute bottom-[-40px] right-[-30px] w-24 h-24 rounded-full bg-pink-400/10 blur-xl animate-[pulse_6s_infinite]" />

                        {/* Top game badge */}
                        <div className="mb-2 px-3 py-0.5 rounded-full bg-[#e0f7fc] border border-cyan-200/40 text-[8px] sm:text-[9px] font-black tracking-[1px] sm:tracking-[1.5px] text-[#00b2e3] uppercase flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00b2e3] animate-pulse" />
                          ● LIQUID COLOR MIXING
                        </div>

                        {/* Modified Name & Styling styling with multi-layer neon effects */}
                        <div className="relative inline-block rotate-[-2deg] select-none text-center">
                          <h1 className="text-2xl sm:text-[34px] font-[1000] tracking-tight select-none uppercase font-sans drop-shadow-md">
                            <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-b from-[#0c316e] via-[#051c42] to-[#02112d]" style={{ WebkitTextStroke: "1px #ffffff", textShadow: "0 4px 6px rgba(12,49,110,0.15)" }}>
                              Color Water Sort
                            </span>
                          </h1>
                        </div>
                        <div className="relative inline-block rotate-[1deg] select-none mt-0.5 sm:mt-1">
                          <h2 className="text-[10px] sm:text-xs font-black tracking-[3px] sm:tracking-[4px] text-[#0086cd] uppercase" style={{ textShadow: "0 1px 2px rgba(0,134,205,0.2)" }}>
                            Puzzle Game
                          </h2>
                        </div>

                        <motion.p 
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="mt-2.5 sm:mt-4 text-[9px] sm:text-[11px] font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-yellow-400 to-[#00a2e5] tracking-[1.5px] sm:tracking-[2px] uppercase font-sans text-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
                        >
                          🛸 GREETINGS & WELCOME, CAPTAIN {userName}! 🪐✨
                        </motion.p>
                      </div>

                      {/* PLAY BUTTON AND GALAXY AI CHAT TRIGGERS - more compact margins */}
                      <div className="mt-3 sm:mt-6 w-full max-w-xs px-4 flex flex-col gap-2 sm:gap-3 shrink-0">
                        <motion.button
                          onClick={() => {
                            gameAudio.playVictory();
                            setGamePhase('playing');
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.96 }}
                          className="w-full flex items-center justify-center gap-2.5 py-3 sm:py-3.5 px-6 rounded-full bg-[#ffbc00] hover:bg-[#ffca28] text-slate-1000 font-sans text-xs sm:text-base font-black uppercase tracking-widest shadow-[0_6px_18px_rgba(255,188,0,0.3)] active:scale-95 transition-all border-t border-white/20 select-none cursor-pointer"
                          id="welcome-screen-play-btn"
                        >
                          <Play className="h-4 w-4 fill-current text-slate-950" />
                          <span>PLAY NOW</span>
                        </motion.button>

                        {/* VERY HARD DAILY CHALLENGE */}
                        <div className="w-full z-10">
                          <motion.button
                            onClick={() => {
                              setDailyChallengeOpen(true);
                              gameAudio.playPop();
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.96 }}
                            className="w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 px-6 rounded-full bg-gradient-to-r from-amber-600 via-orange-600 to-red-650 hover:from-amber-500 hover:to-red-500 text-white font-sans text-[10px] sm:text-xs font-black uppercase tracking-[1.5px] sm:tracking-[2px] shadow-lg border-t border-white/20 select-none cursor-pointer"
                            id="welcome-screen-daily-challenge-btn"
                          >
                            <Trophy className="h-3.5 w-3.5 text-yellow-350" />
                            <span>VERY HARD DAILY CHALLENGE</span>
                          </motion.button>
                        </div>

                        {/* Dedicated Galaxy AI companion button - ONLY AI CHAT KEPT AS REQUESTED */}
                        <div className="w-full z-10">
                          <motion.button
                            onClick={() => {
                              setAiChatOpen(true);
                              gameAudio.playPop();
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.96 }}
                            className="w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 px-6 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-sans text-[10px] sm:text-xs font-black uppercase tracking-[2px] shadow-md shadow-purple-500/10 border-t border-white/15 select-none cursor-pointer"
                            id="welcome-screen-ai-companion-btn"
                          >
                            <Brain className="h-3.5 w-3.5 text-cyan-200 animate-pulse" />
                            <span>GALAXY AI CHAT</span>
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* STATE 3: CORE SOLVING PLAYING GRAPHIC GRID */}
          {gamePhase === 'playing' && (
            <div className="relative z-10 w-full h-full flex flex-col justify-between items-center overflow-hidden" id="main-gameplay-arena">
              
              {/* Full Interactive Canvas Zone with Black Canvas wrappers */}
              <div className="w-full h-full flex-1 flex items-center justify-center relative pt-[78px] pb-[10px] px-3" id="canvas-container">
                <div className="w-full h-full flex items-center justify-center rounded-3xl bg-black/40 border border-neutral-900 shadow-2xl overflow-hidden" id="game-canvas-wrapper">
                  <GameCanvas
                    bottles={bottles}
                    selectedId={selectedId}
                    onSelectBottle={handleSelectBottle}
                    onPour={handlePourComplete}
                    isCompleted={isCompleted}
                    hintMove={hintMove}
                    equippedSkin={equippedSkin}
                  />
                </div>
              </div>

              {/* HUD control overlays */}
              <div className="absolute inset-0 z-20 w-full h-full pointer-events-none flex flex-col justify-between">
                <UIOverlay
                  theme={theme}
                  onChangeTheme={setTheme}
                  bottles={bottles}
                  level={level}
                  difficulty={difficulty}
                  movesCount={movesCount}
                  undoAvailable={history.length > 0}
                  canAddBottle={addedBottleCount < (difficulty === "easy" ? 1 : 2)}
                  isCompleted={isCompleted}
                  soundMuted={soundMuted}
                  showHintActive={showHintActive}
                  hintDescription={hintDescription}
                  coins={coins}
                  maxUnlockedLevel={maxUnlockedLevel}
                  dailyChallengeActive={dailyChallengeActive}
                  dailyLevelIndex={dailyLevelIndex}
                  weeklyChallengeActive={weeklyChallengeActive}
                  weeklyLevelIndex={weeklyLevelIndex}
                  onRestart={generateLevelBoard}
                  onUndo={handleUndo}
                  onShowHint={handleShowHint}
                  onAddBottle={handleAddBottle}
                  onToggleSound={handleToggleSound}
                  onOpenTutorial={handleOpenTutorial}
                  onChangeDifficulty={handleDifficultyChange}
                  onNextLevel={handleNextLevel}
                  onSkipLevel={handleSkipLevel}
                  onSetLevel={handleSetLevel}
                  onReplayLevel={handleReplayLevel}
                  onTriggerAdReward={handleTriggerAdReward}
                  subscription={subscription}
                  onOpenChatSaveGate={() => {
                    gameAudio.playPop();
                    setChatSaveGateOpen(true);
                  }}
                  onBackToHome={() => {
                    gameAudio.playPop();
                    setDailyChallengeActive(false);
                    setWeeklyChallengeActive(false);
                    setGamePhase('title');
                  }}
                />
              </div>

              {/* FLOATING GALAXY AI COMPANION IN-GAME TRIGGER - FLOATING GRACEFULLY */}
              <div className="absolute right-4 bottom-4 z-30 pointer-events-auto">
                <motion.button
                  onClick={() => {
                    setAiChatOpen(true);
                    gameAudio.playPop();
                  }}
                  whileHover={{ scale: 1.1, rotate: 8 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-11 h-11 rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 border border-white/20 flex items-center justify-center shadow-[0_5px_22px_rgba(6,182,212,0.5)] cursor-pointer select-none transition-all"
                  title="Speak with Galaxy AI"
                  id="gameplay-ai-floating-trigger"
                >
                  <Bot className="h-5 w-5 text-white animate-pulse" />
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-cyan-400 to-indigo-500 text-[8px] font-black font-sans text-white px-1.5 py-0.5 rounded-full border border-white/20 shadow-sm scale-90">AI</span>
                </motion.button>
              </div>
            </div>
          )}

          {/* GALAXY AI CHAT DRAWER OVERLAY INSIDE MOBILE FRAME */}
          <AnimatePresence>
            {aiChatOpen && (
              <motion.div
                key="galaxy-ai-drawer"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="absolute inset-x-0 bottom-0 top-0 z-50 bg-[#070914]/96 backdrop-blur-md flex flex-col justify-between"
                id="galaxy-ai-drawer-panel"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileSelect(e.dataTransfer.files[0]);
                  }
                }}
              >
                {/* Header */}
                <div className="shrink-0 p-4 border-b border-white/5 bg-slate-950/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-md">
                      <Bot className="h-5 w-5 text-white animate-pulse" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-sans text-xs font-black text-white uppercase tracking-[1.5px] flex items-center gap-1.5">
                        GALAXY AI <span className="text-[8px] tracking-normal font-mono bg-cyan-500/15 text-cyan-400 py-0.5 px-1.5 rounded-full border border-cyan-400/12 uppercase">GEMINI</span>
                      </h3>
                      <p className="font-sans text-[8px] font-bold text-slate-450 uppercase tracking-widest mt-0.5">
                        Water Sort Advisor
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setChatSaveGateOpen(true);
                        gameAudio.playPop();
                      }}
                      className="p-1.5 text-slate-500 hover:text-violet-400 transition-colors cursor-pointer select-none rounded-lg"
                      title="Open Chat Save Gate"
                      id="ai-save-gate-drawer-btn"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleClearAiChat}
                      className="p-1.5 text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer select-none rounded-lg"
                      title="Clear conversation"
                      id="ai-clear-conversation-btn"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setAiChatOpen(false);
                        gameAudio.playPop();
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer select-none rounded-lg"
                      title="Close AI Terminal"
                      id="ai-close-terminal-btn"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans select-text" id="ai-chat-scroller">
                  {aiMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[85%] ${
                        msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-xs text-left select-text whitespace-pre-wrap shadow-sm leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-indigo-600 text-white rounded-tr-none"
                            : "bg-stone-900/90 text-slate-200 rounded-tl-none border border-white/5"
                        }`}
                      >
                        {msg.image && (
                          <div className="mb-2 relative rounded-lg overflow-hidden border border-white/10 max-h-36">
                            <img referrerPolicy="no-referrer" src={msg.image} alt="Attachment" className="object-cover max-w-full h-auto" />
                          </div>
                        )}
                        {(() => {
                          const segments = parseMessageText(msg.text);
                          return segments.map((seg, idx) => {
                            if (seg.type === "code") {
                              return <CodeBlock key={idx} content={seg.content} language={seg.language} onRunCode={(content) => setCodePreviewContent(content)} />;
                            } else {
                              return <div key={idx} className="font-sans whitespace-pre-wrap select-text">{renderFormattedText(seg.content)}</div>;
                            }
                          });
                        })()}
                      </div>
                      <span className="text-[7.5px] font-mono text-slate-505 tracking-wider mt-1 uppercase">
                        {msg.sender === "user" ? userName : "Galaxy AI"} • {msg.timestamp}
                      </span>
                    </div>
                  ))}

                  {dragOver && (
                    <div className="absolute inset-0 bg-indigo-950/80 border-4 border-dashed border-indigo-500/50 flex flex-col items-center justify-center text-center p-6 z-20 animate-pulse pointer-events-none">
                      <UploadCloud className="h-10 w-10 text-indigo-405" />
                      <h4 className="font-sans text-xs font-black text-white uppercase tracking-[2px] mt-2">DROP BOARD SCREENSHOT HERE</h4>
                      <p className="font-sans text-[9px] text-slate-400 mt-1 uppercase tracking-wider">Galaxy AI will analyze it instantly!</p>
                    </div>
                  )}

                  {aiIsTyping && (
                    <div className="flex flex-col items-start max-w-[85%] mr-auto">
                      <div className="bg-stone-900/80 rounded-2xl rounded-tl-none border border-white/5 px-4 py-2.5 flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest pl-1">QUANTUM SYNTHESIS...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick actions */}
                <div className="p-2 border-t border-white/5 bg-slate-950/10 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      handleSendAiMessage(undefined, "Explain general knowledge, science, PM, CM, MLA, MP or any doubt! 🌍");
                      gameAudio.playPop();
                    }}
                    className="shrink-0 font-sans text-[9px] font-black uppercase text-amber-400 tracking-wider bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/20 rounded-full px-3 py-1 cursor-pointer"
                  >
                    🌍 Ask Me Anything!
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSendAiMessage(undefined, "Who built this amazing game? 🚀");
                      gameAudio.playPop();
                    }}
                    className="shrink-0 font-sans text-[9px] font-black uppercase text-emerald-400 tracking-wider bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400/20 rounded-full px-3 py-1 cursor-pointer"
                  >
                    🚀 Who is the Creator?
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSendAiMessage(undefined, "Write code for a complete beautiful Snake Game in HTML, CSS and JS! 🐍");
                      gameAudio.playPop();
                    }}
                    className="shrink-0 font-sans text-[9px] font-black uppercase text-violet-400 tracking-wider bg-violet-500/10 hover:bg-violet-500/20 border border-violet-400/20 rounded-full px-3 py-1 cursor-pointer"
                  >
                    🐍 Write Snake Game Code
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSendAiMessage(undefined, `Give me specific hints for solving Level ${level}!`);
                      gameAudio.playPop();
                    }}
                    className="shrink-0 font-sans text-[9px] font-black uppercase text-cyan-450 tracking-wider bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/20 rounded-full px-3 py-1 cursor-pointer"
                  >
                    💡 Help with Level {level}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSendAiMessage(undefined, "Explain how to play and sort correctly.");
                      gameAudio.playPop();
                    }}
                    className="shrink-0 font-sans text-[9px] font-black uppercase text-indigo-400 tracking-wider bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-400/20 rounded-full px-3 py-1 cursor-pointer"
                  >
                    🧪 Sorting Rules
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSendAiMessage(undefined, "Suggest booster strategies for difficult sorting configurations.");
                      gameAudio.playPop();
                    }}
                    className="shrink-0 font-sans text-[9px] font-black uppercase text-pink-400 tracking-wider bg-pink-500/10 hover:bg-pink-500/20 border border-pink-400/20 rounded-full px-3 py-1 cursor-pointer"
                  >
                    🚀 Boosters Tips
                  </button>
                </div>

                {/* Input Draft form */}
                <form onSubmit={handleSendAiMessage} className="p-3 border-t border-white/5 bg-slate-950/40 shrink-0 space-y-2">
                  {aiLimitHit && subscription === "none" && (
                    <div className="bg-[#1a0e14] border border-rose-500/20 rounded-2xl p-3 text-center flex flex-col items-center gap-2 mb-2">
                      <p className="text-[11px] text-rose-300 font-sans font-semibold flex items-center gap-1.5 justify-center">
                        <span className="animate-pulse">⏳</span>
                        <span>Daily Free Chat Limit reached! Resets in: <strong className="font-mono text-white text-xs">{aiResetCountdown || "calculating..."}</strong></span>
                      </p>
                      <button
                        type="button"
                        onClick={requestNotificationPermission}
                        className="text-[9px] bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 rounded-xl px-3 py-1.5 uppercase tracking-wider font-sans font-black flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                      >
                        🔔 Notify me when my limit opens
                      </button>
                    </div>
                  )}
                  {inputImage && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#0e162f] border border-cyan-500/20 text-left">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10">
                          <img referrerPolicy="no-referrer" src={inputImage.data} alt="Upload draft" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <span className="font-sans text-[9px] font-black text-cyan-300 uppercase tracking-widest block">SCREENSHOT LOADED</span>
                          <span className="font-mono text-[7px] text-slate-500 uppercase tracking-wider">Ready to submit with ask</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setInputImage(null);
                          gameAudio.playPop();
                        }}
                        className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <label className="p-2 rounded-xl bg-stone-900 border border-white/5 text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer select-none flex items-center justify-center shrink-0">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileSelect(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                      <ImageIcon className="h-4.5 w-4.5" />
                    </label>

                    <input
                      type="text"
                      placeholder="Ask Galaxy AI..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="flex-1 bg-stone-950 border border-white/5 rounded-xl py-2 px-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
                    />

                    <button
                      type="submit"
                      disabled={!inputText.trim() && !inputImage}
                      className={`p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                        inputText.trim() || inputImage
                          ? "bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white"
                          : "bg-stone-900 border border-white/5 text-slate-600 cursor-not-allowed"
                      }`}
                      id="ai-send-message-btn"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* Guide overlay tutorial */}
      <Tutorial isOpen={tutorialOpen} onClose={handleCloseTutorial} />

      {/* Interstitial Informational Overlay Dialogs */}
      <AnimatePresence>
        {isCelebrating && (
          <div key="celebration-particles" className="absolute inset-x-0 top-0 bottom-0 z-30 pointer-events-none overflow-hidden select-none">
            {/* Real flying celebratory particles and ribbon confetti using direct divs directly on top of the game canvas, completely transparent and non-blocking */}
            {[...Array(50)].map((_, i) => {
              const colors = ["#FFD700", "#FF4500", "#FF1493", "#00FF00", "#00BFFF", "#9400D3", "#FF8C00", "#00FF7F"];
              const size = Math.random() * 8 + 5;
              const left = Math.random() * 100;
              const delay = Math.random() * 0.8;
              const duration = Math.random() * 1.5 + 1.0;
              const color = colors[Math.floor(Math.random() * colors.length)];
              return (
                <motion.div
                  key={i}
                  initial={{ y: -20, x: `${left}%`, opacity: 0, rotate: 0 }}
                  animate={{ 
                    y: "100vh", 
                    opacity: [0, 1, 1, 0], 
                    rotate: [0, 360, 720],
                    x: [`${left}%`, `${left + (Math.random() * 12 - 6)}%`]
                  }}
                  transition={{
                    duration: duration,
                    delay: delay,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{
                    position: "absolute",
                    width: size,
                    height: size,
                    backgroundColor: color,
                    borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
                  }}
                />
              );
            })}
          </div>
        )}

        {resetPromptOpen && (
          <div key="reset-prompt-overlay" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setResetPromptOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md pointer-events-auto"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-[#120a16] border-2 border-rose-500/25 rounded-3xl p-6 shadow-2xl pointer-events-auto text-slate-100"
              id="game-reset-choice-dialog"
            >
              {/* Close button */}
              <button
                onClick={() => {
                  gameAudio.playPop();
                  setResetPromptOpen(false);
                }}
                className="absolute top-4 right-4 p-1.5 bg-neutral-900 border border-neutral-850 rounded-xl hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex flex-col items-center text-center gap-3 mt-2">
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl">
                  <RefreshCw className="h-6 w-6 text-rose-400 animate-spin" style={{ animationDuration: '8s' }} />
                </div>
                <div>
                  <h3 className="font-sans text-sm font-black uppercase tracking-widest text-white">
                    Advanced Reset Panel
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal font-sans">
                    Select the option you want to reset. You can restart levels, lock purchased skins/backgrounds, or fully wipe the game.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 mt-5">
                {/* 1. Level Progress Reset option */}
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to restart your Level Progress to Level 1? (Skins/Backgrounds/Coins will be kept!)")) {
                      handleResetLevels();
                    }
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-cyan-400 text-left transition-all cursor-pointer font-sans"
                >
                  <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-wider">Restart Levels</h4>
                    <p className="text-[8px] text-slate-400">Back to Level 1 status, saves seed</p>
                  </div>
                </button>

                {/* 2. Skins Reset option */}
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to reset and re-lock all Custom Bottle Shapes?")) {
                      handleResetSkins();
                    }
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-amber-400 text-left transition-all cursor-pointer font-sans"
                >
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-wider">Reset Custom Skins</h4>
                    <p className="text-[8px] text-slate-400">Lock all custom skins & equip default</p>
                  </div>
                </button>

                {/* 3. Backgrounds Reset option */}
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to reset and re-lock all Custom Background Themes?")) {
                      handleResetBackgrounds();
                    }
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-indigo-400 text-left transition-all cursor-pointer font-sans"
                >
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <Palette className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-wider">Reset Backgrounds</h4>
                    <p className="text-[8px] text-slate-400">Lock all backgrounds & equip default</p>
                  </div>
                </button>

                {/* 4. Full Reset (Wipe All) */}
                <button
                  onClick={() => {
                    if (confirm("⚠️ DANGER! This will permanently erase ALL levels, coins, premium status, custom skins, and background themes immediately. Proceed?")) {
                      handleResetEverything();
                    }
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-rose-955/45 hover:bg-rose-950/80 border border-rose-900 hover:border-rose-600 hover:text-rose-400 text-left transition-all cursor-pointer font-sans"
                >
                  <div className="p-2 bg-rose-500/20 text-rose-500 rounded-xl">
                    <Trash2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-rose-200">Restart/Reset All</h4>
                    <p className="text-[8px] text-rose-300">Absolute wipe, everything to default!</p>
                  </div>
                </button>
              </div>

              <div className="mt-4 flex justify-between gap-3">
                <button
                  onClick={() => {
                    gameAudio.playPop();
                    setResetPromptOpen(false);
                  }}
                  className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#00e1ff] transition-all cursor-pointer text-center"
                >
                  Keep Playing
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {infoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInfoModal(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm pointer-events-auto"
            />

            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 15 }}
              className="relative w-full max-w-sm bg-[#111625] border border-neutral-800 rounded-3xl p-6 shadow-2xl pointer-events-auto text-slate-100"
              id="informational-overlay-dialog"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  {settingsTab === 'about' && <Info className="h-5 w-5 text-cyan-400" />}
                  {settingsTab === 'privacy' && <FileText className="h-5 w-5 text-emerald-400" />}
                  {settingsTab === 'contact' && <Mail className="h-5 w-5 text-amber-500" />}
                  {settingsTab === 'preferences' && <Settings className="h-5 w-5 text-indigo-300" />}
                  <h3 className="font-sans text-sm font-black uppercase tracking-widest text-white">
                    {settingsTab === 'about' && "About Us"}
                    {settingsTab === 'privacy' && "Privacy Policy"}
                    {settingsTab === 'contact' && "Contact Support"}
                    {settingsTab === 'preferences' && "Engine Settings"}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    gameAudio.playPop();
                    setInfoModal(null);
                  }}
                  className="p-1.5 bg-neutral-900 border border-neutral-800 rounded-xl hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* GORGEOUS TAB PILLS SELECTOR IN SETTINGS */}
              <div className="flex gap-1 overflow-x-auto pb-2.5 border-b border-white/5 scrollbar-none mb-3">
                {[
                  { id: 'preferences', label: 'Settings', color: 'text-indigo-400' },
                  { id: 'about', label: 'About', color: 'text-cyan-400' },
                  { id: 'privacy', label: 'Privacy', color: 'text-emerald-400' },
                  { id: 'contact', label: 'Contact', color: 'text-amber-400' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setSettingsTab(tab.id as any);
                      gameAudio.playPop();
                    }}
                    className={`px-3 py-1.5 rounded-xl font-sans text-[10px] font-black uppercase tracking-wider transition-all select-none border whitespace-nowrap cursor-pointer ${
                      settingsTab === tab.id
                        ? "bg-slate-850 border-cyan-500/30 text-white font-extrabold shadow-sm"
                        : "bg-black/25 border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="space-y-4 text-xs font-sans text-left leading-relaxed text-slate-300 max-h-[55vh] overflow-y-auto pr-1">
                {settingsTab === 'about' && (
                  <div className="space-y-3 px-1">
                    <p className="font-sans text-xs font-bold text-cyan-400 uppercase tracking-widest">About Our Independent Design Agency</p>
                    <p>
                      Welcome to <strong>Galaxy Studio</strong>, a pioneering independent digital craft guild established to create meaningful, delightful, and highly polished puzzle experiences. We believe that modern game design has lost its soul to invasive trackers, unnecessary network dependencies, and aggressive monetization schemas. Our team stands firmly against these practices, choosing instead to focus purely on tactile beauty, structural mechanical integrity, and high-DPI visual fluidity.
                    </p>
                    <p>
                      <strong>Water Colour 2D</strong> is our flagship project, representing a delicate marriage of traditional fluid sorting puzzles with contemporary flat color palettes, smooth physics-like transitions, and customized audio synthesis. Our core goal from day one was to draft a highly performant offline playground that sharpens cognitive skills, relaxes spatial anxiety, and provides endless gameplay loops without ever requesting permissions to access your personal workspace or location statistics.
                    </p>
                    <p>
                      Every visual choice you see in the app—from the golden decorated victory crown with its glowing green gemstone, to the simulated test tubes, the liquid level curvatures, and the soft ambient glowing dark mode colors—has been handcrafted by passionate, real designers. We write standard, optimized TypeScript code without automatic boilerplate builders to preserve the highest level of craftsmanship.
                    </p>
                    <p>
                      Our gaming engine is engineered to run seamlessly even on legacy mobile browsers or low-powered computers. By utilizing modern web tech such as HTML5 canvas renders, pure CSS transitions, and local client-side performance models, we achieve a lightweight footprint of under a few megabytes. This allows the game to boot up instantaneously and work completely offline, rendering gorgeous, high-contrast liquid curves with zero frame-rate stuttering.
                    </p>
                    <p>
                      We dedicate our days to creating experiences that act as digital sanctuaries—safe zones where players of all ages can relax their minds, track logical progressions, and experience organic reward systems. We strongly value game-design honesty, which is why everything you unlock—from levels to extra tubes and helper hints—is earned through pure gameplay and interaction. Thank you for installing Water Colour 2D, and thank you for supporting the independent developer ecosystem!
                    </p>
                    <p>
                      At Galaxy Studio, we are constantly working to expand the horizons of modern modular design. If you love our vision, we welcome you to join our journey, share support with friends and family, and help us continue building independent, tracking-free software designed explicitly to celebrate human creativity.
                    </p>
                    <div className="bg-neutral-950/50 p-3.5 rounded-2xl border border-white/5 italic text-slate-400 mt-2">
                      "Real colors, calibrated glass tubes, responsive tactile clicks, and beautiful Web Audio. No databases, no tracking. Just pure relaxation, handcrafted for the human mind."
                    </div>
                  </div>
                )}

                {settingsTab === 'privacy' && (
                  <div className="space-y-3 px-1 text-slate-300">
                    <p className="font-sans text-xs font-bold text-emerald-400 uppercase tracking-widest">Privacy Policy & Secure Data Manifesto</p>
                    <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl mb-2 text-center">
                      <p className="text-xs text-emerald-300 font-bold mb-1">Our Complete Live Policy can be viewed at:</p>
                      <a 
                        href="https://www.freeprivacypolicy.com/live/47e95744-6466-49a9-a33e-98874f91097e" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs text-sky-400 underline font-mono break-all hover:text-sky-300 word-break select-text select-all"
                      >
                        https://www.freeprivacypolicy.com/live/47e95744-6466-49a9-a33e-98874f91097e
                      </a>
                    </div>
                    <p>
                      At <strong>Galaxy Studio</strong>, we treat your digital privacy as a fundamental, non-negotiable human right. We explicitly reject the standard modern practice of silent tracking, telemetry collection, advertising profile building, and personal identity monetization. We believe that your gameplay statistics, device identifiers, and logical puzzle patterns belong strictly to you and should never leave your physical device.
                    </p>
                    <p>
                      Therefore, we stand by a strict, comprehensive pledge: <strong>Water Colour 2D never collects, stores, parses, analyzes, shares, or transmits any form of personal or private player data.</strong>
                    </p>
                    <p>
                      To ensure this protection remains ironclad, our application has been engineered from the ground up to run entirely offline inside your local browser sandbox. All dynamic state management, randomized level generation, solver path searching algorithms, coin balance calculations, and move counters are processed in local memory variables. There are absolute zero tracking pixels, analytics SDKs, cloud-hosted backends, or data warehouses integrated into our workspace.
                    </p>
                    <p>
                      Any progression variables—such as your current game level, highest level unlocked naturally, difficulty selectors, setting preferences, and accumulated game coins—are stored securely inside your browser's private Web Storage slot (`localStorage`). This data is fully under your sovereignty: you can examine it, clear it through browser privacy settings, or reset it at any time. We do not use persistent cookies to map browser sessions.
                    </p>
                    <p>
                      In our simulated Ad Video Reward mechanism, we run a completely local, self-contained timer countdown simulation inside your browser threads. This allows you to accumulate reward coins for free without sending your IP address, geolocation metrics, or consumer attributes to commercial advertising nodes. It serves as a secure, local simulation that gives you immediate access to gameplay rewards without sacrificing your personal security.
                    </p>
                    <p>
                      By downloading and playing Water Colour 2D, you are stepping into a secure offline environment. Our game requires no internet permissions, no camera accesses, no storage scopes, and no account registrations. Play with complete focus and peace of mind, knowing that you are fully secure and that your personal space is absolutely protected!
                    </p>
                  </div>
                )}

                {settingsTab === 'contact' && (
                  <div className="space-y-3 px-1">
                    <p className="font-sans text-xs font-bold text-amber-500 uppercase tracking-widest">Contact Support & Developer Correspondence</p>
                    <p>
                      We represent a humble, human-built studio, and we are incredibly passionate about hearing from our global playing community! Whether you have found an interesting liquid combination, want to propose a beautiful custom design for our test tubes, found a visual layout glitch on a specific screen, or simply want to share your positive experiences, Galaxy Studio guarantees direct, personal communication.
                    </p>
                    <p>
                      We explicitly reject robotic corporate automated responders and generic support reply scripts. When you write to us, you are communicating directly with the head game designer. Every single piece of correspondence receives an authentic, friendly response within 24 hours. We welcome your honest criticism, feedback, bug reports, and features requests as they help us make our game the finest puzzle applet in the world.
                    </p>
                    <p>
                      To contact our official support desk or submit feedback, please write to us at our dedicated creator mailbox. We recommend specifying your device type, operating system version, and a brief description of any issue or feature you would like to discuss to help us analyze the context:
                    </p>
                    <div className="bg-[#182138] border border-cyan-500/20 rounded-2xl p-4 space-y-3">
                      <div className="flex flex-col">
                        <span className="text-3xs font-extrabold text-cyan-400 uppercase tracking-wider mb-0.5">Official support correspondence desk</span>
                        <a href="mailto:watersort@gmail.com" className="font-mono text-xs font-bold text-white hover:text-cyan-300 transition-colors break-all underline">
                          watersort@gmail.com
                        </a>
                      </div>

                      <div className="flex gap-2">
                        {/* Copy button */}
                        <button
                          onClick={handleCopyEmail}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 font-sans text-3xs font-black text-slate-950 uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-cyan-500/10 border-none"
                        >
                          {copiedEmail ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedEmail ? "Copied" : "Copy Email"}</span>
                        </button>

                        <a
                          href="mailto:watersort@gmail.com"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 font-sans text-3xs font-black text-white uppercase tracking-widest transition-all text-center"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>Mail Native</span>
                        </a>
                      </div>
                    </div>
                    <p>
                      When suggesting features, you can outline options like custom backgrounds, alternate sound selection schemes, or different layout densities. We regularly implement community proposals in our weekly software upgrades to keep our game dynamic, and we always credit the players who proposed them. Thank you once again for playing and being an active part of the Galaxy Studio family!
                    </p>
                  </div>
                )}

                {settingsTab === 'preferences' && (
                  <div className="space-y-5 px-1 py-1">
                    <p className="font-sans text-xs font-bold text-indigo-400 uppercase tracking-widest">Personalize Your Fluid Puzzle</p>

                    {/* Captain Profile Identity Settings Option */}
                    <div className="space-y-2">
                      <label className="text-3xs font-extrabold uppercase tracking-wider text-slate-400 block">
                        Captain Profile Name (Change/Remove)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value.slice(0, 15))}
                          className="flex-1 bg-[#090d16] border border-white/5 px-3 py-2 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
                          placeholder="Enter Captain Name..."
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (nameInput.trim()) {
                              setUserName(nameInput.trim());
                              localStorage.setItem("water_sort_username", nameInput.trim());
                              showNotification(`Captain Name updated to: ${nameInput.trim()} 🛸✨`);
                              gameAudio.playVictory();
                            } else {
                              showNotification("Captain Name cannot be empty!");
                            }
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-3xs font-black uppercase tracking-widest cursor-pointer shadow-md transition-all shrink-0 font-sans"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                    
                    {/* Theme Preference Settings Selector */}
                    <div className="space-y-2">
                      <label className="text-3xs font-extrabold uppercase tracking-wider text-slate-400 block">
                        Visual Theme preference
                      </label>
                      <div className="grid grid-cols-2 gap-2 bg-[#090d16] p-1.5 rounded-2xl border border-white/5">
                        <button
                          onClick={() => {
                            setTheme('black');
                            gameAudio.playPop();
                          }}
                          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-sans text-3xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                            theme === 'black'
                              ? "bg-slate-800 text-white shadow-md border-t border-slate-700/50"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          <span>Black Theme</span>
                        </button>
                        <button
                          onClick={() => {
                            setTheme('white');
                            gameAudio.playPop();
                          }}
                          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-sans text-3xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                            theme === 'white'
                              ? "bg-amber-400 text-slate-950 shadow-md border-t border-amber-300"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          <span>White Theme</span>
                        </button>
                      </div>
                    </div>

                     {/* Audio & Sounds Setting */}
                     <div className="space-y-2">
                       <label className="text-3xs font-extrabold uppercase tracking-wider text-slate-400 block">
                         Interactive Sound Effects
                       </label>
                       <button
                         onClick={() => {
                           handleToggleSound();
                           gameAudio.playPop();
                         }}
                         className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                           soundMuted
                             ? "bg-[#2d1e24] border-red-500/20 text-red-400 hover:bg-[#3d262f]"
                             : "bg-[#182a25] border-emerald-500/20 text-emerald-405 hover:bg-[#203c34]"
                         }`}
                       >
                         <span className="font-sans text-3xs font-black uppercase tracking-widest">
                           {soundMuted ? "Sound Actions: Muted" : "Sound Actions: ON"}
                         </span>
                         <span>
                           {soundMuted ? "🔈 OFF" : "🔊 ON"}
                         </span>
                       </button>
                     </div>

                     {/* Quick Utility Game Controls Area */}
                     <div className="space-y-2">
                       <label className="text-3xs font-extrabold uppercase tracking-wider text-slate-400 block">
                         Quick Actions
                       </label>
                       <div className="grid grid-cols-2 gap-2">
                         <button
                           onClick={() => {
                             handleReplayLevel();
                             setInfoModal(null);
                             setGamePhase('playing');
                           }}
                           className="py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-semibold text-slate-950 font-sans text-3xs font-black uppercase tracking-widest active:scale-95 transition-all cursor-pointer shadow-md text-center"
                         >
                           Restart Level
                         </button>

                         <button
                           onClick={() => {
                             setGamePhase('title');
                             setInfoModal(null);
                             gameAudio.playVictory();
                           }}
                           className="py-3 px-4 rounded-2xl bg-slate-900 hover:bg-[#22c55e] text-slate-100 hover:text-slate-950 border border-slate-850 hover:border-transparent font-sans text-3xs font-black uppercase tracking-widest active:scale-95 transition-all cursor-pointer shadow-md text-center"
                         >
                           Home Screen
                         </button>
                       </div>
                     </div>

                    <div className="bg-[#090d16] p-3.5 rounded-2xl border border-white/5 space-y-1.5">
                      <h4 className="text-xs font-black uppercase tracking-widest text-[#38bdf8]">Your Game Summary</h4>
                      <div className="flex justify-between font-mono text-[9px] text-slate-400">
                        <span>CONNECTION MODE:</span>
                        <span className="font-bold text-white uppercase">
                          {forceOfflineMode ? "Offline (No Data)" : "Online Adaptive"}
                        </span>
                      </div>
                      <div className="flex justify-between font-mono text-[9px] text-slate-400">
                        <span>VIP STATUS:</span>
                        <span className="font-bold text-amber-400 uppercase">
                          PREMIUM UNLOCKED 🪐
                        </span>
                      </div>
                      <div className="flex justify-between font-mono text-[9px] text-slate-400">
                        <span>UNLOCKED BOTTLES:</span>
                        <span className="font-bold text-white">{unlockedSkinIds.length} Skins</span>
                      </div>
                      <div className="flex justify-between font-mono text-[9px] text-slate-400">
                        <span>UNLOCKED BACKDROPS:</span>
                        <span className="font-bold text-white">{unlockedBgIds.length} Backdrops</span>
                      </div>
                      <div className="flex justify-between font-mono text-[9px] text-slate-400">
                        <span>AUDIO OUTPUT:</span>
                        <span className="font-bold text-white uppercase">{soundMuted ? "Muted" : "Active Synth"}</span>
                      </div>
                    </div>

                    {/* Danger Zone: Reset Entire Game state */}
                    <div className="space-y-2 border-t border-rose-500/10 pt-4">
                      <label className="text-3xs font-extrabold uppercase tracking-wider text-rose-400 block font-black">
                        Danger Zone
                      </label>
                      <button
                        onClick={handleGlobalRestartGame}
                        className="w-full flex items-center justify-center gap-2 p-3 pb-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-sans text-3xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-rose-600/10 border-none"
                        id="danger-restart-entire-game-btn"
                      >
                        <RefreshCw className="h-4 w-4 text-white animate-spin" style={{ animationDuration: '6s' }} />
                        <span>Restart Entire Game (Wipe Data)</span>
                      </button>
                      <p className="text-[10px] text-slate-400 font-sans leading-normal">
                        This will completely clear your current level progression, highest level unlocked, difficulty state, and reset your coins balance to 0.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-white/5">
                <button
                  onClick={() => {
                    gameAudio.playPop();
                    setInfoModal(null);
                  }}
                  className="w-full bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded-xl py-2.5 font-sans text-2xs font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-all cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      <ShopModal
        isOpen={shopOpen}
        onClose={() => setShopOpen(false)}
        coins={coins}
        onDeductCoins={(amount) => setCoins((c) => Math.max(0, c - amount))}
        onAddCoins={(amount) => setCoins((c) => c + amount)}
        unlockedSkinIds={unlockedSkinIds}
        onUnlockSkin={(skinId) => setUnlockedSkinIds((prev) => [...prev, skinId])}
        equippedSkinId={equippedSkinId}
        onEquipSkin={setEquippedSkinId}
        unlockedBgIds={unlockedBgIds}
        onUnlockBg={(bgId) => setUnlockedBgIds((prev) => [...prev, bgId])}
        equippedBgId={equippedBgId}
        onEquipBg={setEquippedBgId}
        showNotification={showNotification}
        subscription={subscription}
        onBuySubscription={(type) => {
          setSubscription(type);
          localStorage.setItem("water_sort_subscription", type);
        }}
        aiChatCount={aiChatCount}
        aiImageCount={aiImageCount}
      />

      {/* ----------------- GALAXY CHAT SAVE GATE MODAL ----------------- */}
      <AnimatePresence>
        {chatSaveGateOpen && (
          <div key="chat-save-gate-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/92 backdrop-blur-md overflow-hidden select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#090b14] border border-violet-500/30 rounded-3xl w-full max-w-md h-[80vh] flex flex-col overflow-hidden shadow-2xl shadow-violet-500/5 text-slate-100"
              id="chat-save-gate-modal-card"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#05060d] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-violet-500/10 rounded-xl">
                    <FileText className="h-5 w-5 text-violet-400 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <h2 className="font-sans text-base font-black text-white uppercase tracking-wider">Chat Save Gate</h2>
                    <p className="text-[10px] font-mono text-[#a78bfa] uppercase tracking-widest">Captain Profile Sandbox</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setChatSaveGateOpen(false);
                    gameAudio.playPop();
                  }}
                  className="p-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-slate-400 hover:text-white cursor-pointer select-none"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable content body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="bg-violet-950/20 p-4 rounded-2xl border border-violet-500/10 space-y-1.5 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9.5px] font-mono font-black text-emerald-400 uppercase tracking-widest">
                      GATEWAY STATUS: ENCRYPTED & LIVE 🔒
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans leading-normal">
                    Hi <strong>{userName || "Captain"}</strong>! This control module lets you manage and extract all saved chat logs from your local browser environment. Keep helpful guides, strategy suggestions, and levels walkthroughs forever.
                  </p>
                </div>

                {/* Stored Stats */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-slate-950/50 p-3 rounded-2xl border border-white/5 text-center">
                    <span className="text-4xs font-black text-slate-400 uppercase tracking-widest block mb-0.5">Stored Chats</span>
                    <strong className="text-xl font-mono text-white">{aiMessages.length}</strong>
                  </div>
                  <div className="bg-slate-950/50 p-3 rounded-2xl border border-white/5 text-center">
                    <span className="text-4xs font-black text-slate-400 uppercase tracking-widest block mb-0.5">Free Left Today</span>
                    <strong className="text-xl font-mono text-cyan-400">
                      {subscription !== "none" ? "∞" : Math.max(0, 30 - aiChatCount)}
                    </strong>
                  </div>
                </div>

                {/* Stored Chats Log Preview Area */}
                <div className="space-y-1 text-left">
                  <label className="text-3xs font-black text-slate-400 uppercase tracking-widest">
                    Live Chat Logs Transcripts ({aiMessages.length})
                  </label>
                  <div className="bg-black/60 border border-white/5 p-3.5 rounded-2xl max-h-56 overflow-y-auto font-mono text-4xs text-slate-300 space-y-2 select-text text-left leading-relaxed">
                    {aiMessages.length === 0 ? (
                      <p className="text-slate-500 italic text-center py-4 font-sans">No conversations stored in your profile sandbox yet. Start a chat with the AI companion!</p>
                    ) : (
                      aiMessages.map((msg, i) => (
                        <div key={msg.id || i} className="border-b border-white/5 pb-2 last:border-0 last:pb-0 font-sans">
                          <span className={`font-bold ${msg.sender === 'user' ? 'text-indigo-400' : 'text-[#a78bfa]'}`}>
                            [{msg.sender === 'user' ? 'Captain' : 'Galaxy AI'}]:
                          </span>{" "}
                          <span>{msg.text}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Secure Sandbox sync state details */}
                <div className="bg-slate-950/20 p-3 rounded-xl border border-white/5 flex items-center justify-center gap-2 text-center select-none font-sans text-[10px] text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA] shrink-0" />
                  <span>Local Backup Synchronization is always enabled automatically.</span>
                </div>
              </div>

              {/* Footer action controls */}
              <div className="p-4 border-t border-white/5 bg-[#05060d] flex flex-col gap-2 shrink-0">
                <div className="flex gap-2">
                  {/* Copy entire log to clipboard */}
                  <button
                    onClick={() => {
                      if (aiMessages.length === 0) {
                        showNotification("No chats available to copy!");
                        return;
                      }
                      const transcript = aiMessages.map(m => `[${m.sender === 'user' ? 'Captain' : 'AI'}]: ${m.text}`).join("\n\n");
                      navigator.clipboard.writeText(transcript);
                      showNotification("Copied entire chat log transcript to clipboard! 📝📋");
                      gameAudio.playVictory();
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-3xs font-black uppercase tracking-wider cursor-pointer border-none"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Transcript</span>
                  </button>

                  {/* Download log as file */}
                  <button
                    onClick={() => {
                      if (aiMessages.length === 0) {
                        showNotification("No chats available to download!");
                        return;
                      }
                      const transcript = aiMessages.map(m => `[${m.sender === 'user' ? 'Captain' : 'AI'}]: ${m.text}`).join("\n\n");
                      const blob = new Blob([transcript], { type: "text/plain;charset=utf-8" });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = `galaxy_ai_chat_saved_${Date.now()}.txt`;
                      link.click();
                      URL.revokeObjectURL(url);
                      showNotification("Chat Log downloaded successfully! 📝💾");
                      gameAudio.playVictory();
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-3 text-3xs font-black uppercase tracking-wider cursor-pointer border-none"
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    <span>Download Log</span>
                  </button>
                </div>

                {/* Clear Sandbox Backup option */}
                <button
                  onClick={() => {
                    if (aiMessages.length === 0) {
                      showNotification("Log is already completely empty!");
                      return;
                    }
                    if (confirm("Are you sure you want to permanently clear all saved chats in your profile sandbox? This action cannot be undone.")) {
                      handleClearAiChat();
                      showNotification("Chat logs permanently cleared! 🗑️");
                    }
                  }}
                  className="w-full bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-red-400 hover:text-red-300 rounded-xl py-2.5 text-3xs font-bold uppercase tracking-widest cursor-pointer border-none"
                >
                  Clear Sandbox Backup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <LevelSelectorModal
        isOpen={levelSelectorOpen}
        onClose={() => setLevelSelectorOpen(false)}
        maxUnlockedLevel={maxUnlockedLevel}
        currentLevel={level}
        onSelectLevel={(lvl) => {
          setLevel(lvl);
          setLevelSelectorOpen(false);
          setGamePhase('playing');
        }}
        onResetLevelProgress={() => {
          handleResetLevels();
          setLevelSelectorOpen(false);
        }}
      />

      {/* ---------------- VERY HARD DAILY CHALLENGE MODAL ---------------- */}
      <AnimatePresence>
        {dailyChallengeOpen && (
          <div key="daily-challenge-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/92 backdrop-blur-md overflow-hidden select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0b0e17] border border-orange-500/30 rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden shadow-2xl shadow-orange-500/5"
              id="daily-challenge-modal-card"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#07090f] shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/10 rounded-xl">
                    <Trophy className="h-5 w-5 text-amber-400 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="font-sans text-sm font-black text-white uppercase tracking-wider">Very Hard Daily Challenge</h2>
                    <p className="text-[9px] font-mono text-amber-300 uppercase tracking-widest">10 Extremely Difficult Stages</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setDailyChallengeOpen(false);
                    gameAudio.playPop();
                  }}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Instructions Bar */}
              <div className="px-5 py-3.5 bg-gradient-to-r from-orange-950/20 to-red-950/20 border-b border-white/5 shrink-0 text-slate-300 text-[11px] font-sans flex items-start gap-2 leading-relaxed">
                <Sparkles className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5 animate-pulse" />
                <span>
                  Solve all 10 very hard stages to claim the ultimate championship bonus (+1000 Coins) and renew the gate cycle!
                </span>
              </div>

              {/* Grid content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* 10 Levels Grid */}
                <div className="grid grid-cols-5 gap-3">
                  {Array.from({ length: 10 }).map((_, idx) => {
                    const levelNum = idx + 1;
                    const isCompleted = completedDailyLevels.includes(levelNum);
                    const isUnlocked = levelNum === 1 || completedDailyLevels.includes(levelNum - 1);

                    return (
                      <button
                        key={levelNum}
                        onClick={() => {
                          if (!isUnlocked) {
                            gameAudio.playError();
                            showNotification(`Unlock Level ${levelNum - 1} first! 🔒`);
                            return;
                          }
                          gameAudio.playVictory();
                          setDailyChallengeActive(true);
                          setDailyLevelIndex(levelNum);
                          setDailyChallengeOpen(false);
                          setGamePhase('playing');
                        }}
                        disabled={!isUnlocked}
                        className={`aspect-square rounded-2xl border flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                          isCompleted
                            ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/10"
                            : isUnlocked
                              ? "bg-gradient-to-tr from-amber-500/20 to-orange-500/10 border-amber-400/40 text-amber-200 hover:border-amber-400 hover:scale-105 active:scale-95 shadow-sm"
                              : "bg-slate-950/60 border-white/5 text-slate-650 opacity-45 cursor-not-allowed"
                        }`}
                        title={`Daily Level ${levelNum}`}
                      >
                        {isCompleted ? (
                          <>
                            <span className="text-2xs font-bold leading-tight">Lvl {levelNum}</span>
                            <div className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-500 text-black rounded-full">
                              <Check className="h-2 w-2 stroke-[4]" />
                            </div>
                          </>
                        ) : isUnlocked ? (
                          <>
                            <span className="text-2xs font-extrabold leading-tight">Lvl {levelNum}</span>
                            <span className="text-[7px] font-mono text-amber-400/80 mt-0.5">+200🪙</span>
                          </>
                        ) : (
                          <Lock className="h-3 w-3 text-slate-650" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Progress Status Card */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center text-center space-y-3">
                  <div className="w-full flex justify-between items-center text-[10px] uppercase font-sans tracking-wider text-slate-400">
                    <span>Daily Progress</span>
                    <span className="text-white font-black">{completedDailyLevels.length}/10 Done</span>
                  </div>
                  <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${(completedDailyLevels.length / 10) * 100}%` }}
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
                    />
                  </div>

                  {/* Renew cycle section inside daily modal too */}
                  {completedDailyLevels.length === 10 && completedWeeklyLevels.length === 5 ? (
                    <motion.div
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      className="w-full bg-gradient-to-r from-teal-905/40 via-emerald-950/40 to-teal-955/40 p-3 rounded-xl border border-emerald-550/30 text-center space-y-2 mt-2"
                    >
                      <p className="text-[11px] font-sans font-black text-emerald-300 uppercase tracking-wider animate-pulse">
                        🏆 ALL GRAND CHALLENGES COMPLETED! 🏆
                      </p>
                      <p className="text-[9px] text-slate-300">
                        Daily & Weekly cycles are fully solved. Click below to claim premium coins and reset the countdown lock.
                      </p>
                      <button
                        onClick={handleRenewChallenges}
                        className="w-full py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 text-2xs font-black uppercase tracking-widest rounded-lg shadow-lg hover:brightness-110 active:scale-95 cursor-pointer transition-all"
                      >
                        Claim +1000 🪙 & Renew
                      </button>
                    </motion.div>
                  ) : (
                    <div className="text-[9px] text-slate-400 leading-normal">
                      Completed: <strong>Daily: {completedDailyLevels.length}/10</strong> | <strong>Weekly: {completedWeeklyLevels.length}/5</strong>
                      <p className="mt-1 text-slate-550 text-[8px]">Solve BOTH challenges completely to trigger the renewal lock cycle!</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- WEEKLY CHALLENGE MODAL ---------------- */}
      <AnimatePresence>
        {weeklyChallengeOpen && (
          <div key="weekly-challenge-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/92 backdrop-blur-md overflow-hidden select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0b0e17] border border-cyan-500/30 rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden shadow-2xl shadow-cyan-500/5"
              id="weekly-challenge-modal-card"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#07090f] shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-cyan-500/10 rounded-xl">
                    <Calendar className="h-5 w-5 text-cyan-400 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="font-sans text-sm font-black text-white uppercase tracking-wider">Weekly Master Gate</h2>
                    <p className="text-[9px] font-mono text-cyan-300 uppercase tracking-widest">5 Ultra Hard Master Levels</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setWeeklyChallengeOpen(false);
                    gameAudio.playPop();
                  }}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Countdown or Game Stage list */}
              {!weeklyIsUnlocked ? (
                /* LOCKED GATE INTERFACE */
                <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-6 overflow-y-auto">
                  <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-450 animate-pulse shadow-lg shadow-rose-500/5">
                    <DoorClosed className="h-8 w-8 text-rose-400" />
                  </div>

                  <div className="space-y-2 max-w-xs">
                    <h3 className="font-sans text-xs font-black text-white uppercase tracking-[1px]">Gate Is Currently Locked</h3>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      This gate opens and resets automatically every 24 hours. Check back once the countdown completes!
                    </p>
                  </div>

                  {/* Live Countdown Timer Widget */}
                  <div className="bg-black/50 border border-rose-500/20 px-6 py-3 rounded-2xl min-w-[200px]">
                    <span className="text-[9px] font-sans text-rose-400 font-extrabold uppercase tracking-widest block mb-0.5">UNLOCK TIME REMAINING</span>
                    <span className="font-mono text-lg font-black text-white drop-shadow-[0_2px_4px_rgba(255,100,100,0.2)]">
                      {weeklyCountdownText || "Calculating..."}
                    </span>
                  </div>

                  {/* EXCELLENT DEV HACK: SECRET INSTANT UNLOCK */}
                  <div className="pt-4">
                    <button
                      onClick={() => {
                        const now = Date.now();
                        setWeeklyUnlockTime(now - 1000);
                        localStorage.setItem("water_sort_weekly_unlock_time", (now - 1000).toString());
                        setWeeklyIsUnlocked(true);
                        gameAudio.playVictory();
                        showNotification("Weekly Gate Unlocked! Enjoy sorting master levels! 🔓🌌");
                      }}
                      className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:text-cyan-300 rounded-xl font-sans text-[8px] font-black uppercase tracking-wider cursor-pointer select-none flex items-center gap-1.5 mx-auto transition-all duration-300"
                    >
                      <Sparkles className="h-3 w-3 text-cyan-300 animate-spin" />
                      <span>Unlock Weekly Gate Instantly (Testing Hack)</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* UNLOCKED WEEKLY CHALLENGE CHANNELS LIST */
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  <div className="p-3.5 bg-cyan-950/20 rounded-2xl border border-cyan-500/10 flex items-start gap-2.5 text-[11px] font-sans text-slate-300 leading-relaxed shrink-0">
                    <Award className="h-4.5 w-4.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      Welcome inside the weekly master dimension! Sort all 5 supreme levels to register your achievements. Reward: +350🪙 per level!
                    </span>
                  </div>

                  {/* 5 Levels Selection Grid */}
                  <div className="grid grid-cols-5 gap-3">
                    {Array.from({ length: 5 }).map((_, idx) => {
                      const levelNum = idx + 1;
                      const isCompleted = completedWeeklyLevels.includes(levelNum);
                      const isUnlocked = levelNum === 1 || completedWeeklyLevels.includes(levelNum - 1);

                      return (
                        <button
                          key={levelNum}
                          onClick={() => {
                            if (!isUnlocked) {
                              gameAudio.playError();
                              showNotification(`Clear Level ${levelNum - 1} of Weekly first! 🔒`);
                              return;
                            }
                            gameAudio.playVictory();
                            setWeeklyChallengeActive(true);
                            setWeeklyLevelIndex(levelNum);
                            setWeeklyChallengeOpen(false);
                            setGamePhase('playing');
                          }}
                          disabled={!isUnlocked}
                          className={`aspect-square rounded-2xl border flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                            isCompleted
                              ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/10"
                              : isUnlocked
                                ? "bg-gradient-to-tr from-cyan-500/20 to-teal-500/10 border-cyan-400/40 text-cyan-200 hover:border-cyan-400 hover:scale-105 active:scale-95 shadow-sm"
                                : "bg-slate-950/60 border-white/5 text-slate-650 opacity-45 cursor-not-allowed"
                          }`}
                          title={`Weekly Level ${levelNum}`}
                        >
                          {isCompleted ? (
                            <>
                              <span className="text-2xs font-bold leading-tight flex flex-col items-center">
                                <span>Lvl</span>
                                <span>{levelNum}</span>
                              </span>
                              <div className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-500 text-black rounded-full">
                                <Check className="h-2 w-2 stroke-[4]" />
                              </div>
                            </>
                          ) : isUnlocked ? (
                            <>
                              <span className="text-2xs font-extrabold leading-tight">Lvl {levelNum}</span>
                              <span className="text-[7px] font-mono text-cyan-400 mt-0.5">+350🪙</span>
                            </>
                          ) : (
                            <Lock className="h-3 w-3 text-slate-650" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Progress Info Column */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center text-center space-y-3">
                    <div className="w-full flex justify-between items-center text-[10px] uppercase font-sans tracking-wider text-slate-400">
                      <span>Weekly Progress</span>
                      <span className="text-white font-black">{completedWeeklyLevels.length}/5 Completed</span>
                    </div>
                    <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${(completedWeeklyLevels.length / 5) * 100}%` }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full transition-all duration-300"
                      />
                    </div>

                    {/* All Completed Multi-cycle reset block */}
                    {completedDailyLevels.length === 10 && completedWeeklyLevels.length === 5 ? (
                      <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        className="w-full bg-gradient-to-r from-teal-900/40 via-emerald-900/40 to-teal-900/40 p-3 rounded-xl border border-emerald-500/30 text-center space-y-2 mt-1"
                      >
                        <p className="text-[11px] font-sans font-black text-emerald-300 uppercase tracking-wider animate-pulse">
                          🏆 ALL GRAND CHALLENGES COMPLETED! 🏆
                        </p>
                        <p className="text-[9px] text-slate-300">
                          Daily & Weekly cycles are fully solved. Click below to claim premium coins and reset the countdown lock.
                        </p>
                        <button
                          onClick={handleRenewChallenges}
                          className="w-full py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 text-2xs font-black uppercase tracking-widest rounded-lg shadow-lg hover:brightness-110 active:scale-95 cursor-pointer transition-all"
                        >
                          Claim +1000 🪙 & Renew
                        </button>
                      </motion.div>
                    ) : (
                      <div className="text-[9px] text-slate-450 leading-normal">
                        Completed: <strong>Daily: {completedDailyLevels.length}/10</strong> | <strong>Weekly: {completedWeeklyLevels.length}/5</strong>
                        <p className="mt-1 text-slate-550 text-[8px]">Fully solve both daily & weekly boards to enable cycle reload!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Code Preview / Game Sandbox Overlay */}
      {codePreviewContent && (
        <div className="fixed inset-0 bg-slate-950/95 flex flex-col z-[100] animate-in fade-in duration-200">
          {/* Header */}
          <div className="h-14 bg-slate-900 border-b border-white/10 flex items-center justify-between px-6 shrink-0 select-none">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Play className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-left">
                <h3 className="font-sans text-xs font-black text-white uppercase tracking-wider">Galaxy AI Game Sandbox</h3>
                <p className="text-[9px] font-mono text-emerald-400/80 uppercase">RUNNING LIVE HTML/CSS/JS PREVIEW</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  // Reload iframe by updating srcDoc with a tiny nudge
                  const current = codePreviewContent;
                  setCodePreviewContent(null);
                  setTimeout(() => setCodePreviewContent(current), 100);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-sans font-bold text-slate-300 uppercase tracking-wider cursor-pointer transition-colors border border-white/5"
              >
                <RefreshCw className="h-3 w-3 text-cyan-400" />
                <span>Restart</span>
              </button>
              <button
                type="button"
                onClick={() => setCodePreviewContent(null)}
                className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 cursor-pointer transition-colors"
                title="Close Sandbox"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Interactive sandbox iframe */}
          <div className="flex-1 bg-white relative">
            <iframe
              id="galaxy-ai-sandbox-frame"
              title="Galaxy AI Sandbox Frame"
              srcDoc={codePreviewContent}
              sandbox="allow-scripts allow-modals allow-same-origin"
              className="w-full h-full border-none"
            />
          </div>
        </div>
      )}

    </div>
  );
}
