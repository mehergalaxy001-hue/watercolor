/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  RotateCcw,
  Undo,
  Lightbulb,
  PlusCircle,
  Volume2,
  VolumeX,
  HelpCircle,
  Trophy,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Gauge,
  Play,
  Coins,
  Tv,
  Edit2,
  ChevronRight,
  X,
  Navigation,
  Home,
  Brain,
  Sun,
  Moon,
  FileText
} from "lucide-react";
import { Bottle, GAME_COLORS } from "../types";
import { solveWaterSort } from "./Solver";

interface UIOverlayProps {
  bottles: Bottle[];
  level: number;
  difficulty: "easy" | "medium" | "hard";
  movesCount: number;
  undoAvailable: boolean;
  canAddBottle: boolean;
  isCompleted: boolean;
  soundMuted: boolean;
  showHintActive: boolean;
  hintDescription: string | null;
  coins: number;
  maxUnlockedLevel: number;
  theme?: 'black' | 'white';
  onChangeTheme?: (t: 'black' | 'white') => void;
  subscription?: "none" | "1year" | "lifetime";

  dailyChallengeActive?: boolean;
  dailyLevelIndex?: number;
  weeklyChallengeActive?: boolean;
  weeklyLevelIndex?: number;

  onRestart: () => void;         // Generates fresh board layout
  onUndo: () => void;
  onShowHint: () => void;        // Costs 200 coins
  onAddBottle: () => void;
  onToggleSound: () => void;
  onOpenTutorial: () => void;
  onChangeDifficulty: (diff: "easy" | "medium" | "hard") => void;
  onNextLevel: () => void;
  onSkipLevel: () => void;       // Costs 5000 coins
  onSetLevel: (level: number) => void;
  onReplayLevel: () => void;     // Reset same layout board
  onTriggerAdReward: () => void; // Simulated Ads +50 coins
  onBackToHome: () => void;      // Return to custom welcome/title screen
  onOpenChatSaveGate?: () => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({
  bottles,
  level,
  difficulty,
  movesCount,
  undoAvailable,
  canAddBottle,
  isCompleted,
  soundMuted,
  showHintActive,
  hintDescription,
  coins,
  maxUnlockedLevel,
  theme = 'black',
  onChangeTheme,
  subscription = 'none',

  dailyChallengeActive = false,
  dailyLevelIndex = 1,
  weeklyChallengeActive = false,
  weeklyLevelIndex = 1,

  onRestart,
  onUndo,
  onShowHint,
  onAddBottle,
  onToggleSound,
  onOpenTutorial,
  onChangeDifficulty,
  onNextLevel,
  onSkipLevel,
  onSetLevel,
  onReplayLevel,
  onTriggerAdReward,
  onBackToHome,
  onOpenChatSaveGate,
}) => {
  const [showAiCompanion, setShowAiCompanion] = useState<boolean>(false);
  const [adsWatchedForAi, setAdsWatchedForAi] = useState<number>(0);
  const [isPlayingAd, setIsPlayingAd] = useState<boolean>(false);
  const [adCountdown, setAdCountdown] = useState<number>(0);
  const [currentAdBrand, setCurrentAdBrand] = useState<string>("");

  useEffect(() => {
    setAdsWatchedForAi(0);
    setIsPlayingAd(false);
    setAdCountdown(0);
  }, [level]);

  // Clean, robust timer effect for companion sponsor ads
  useEffect(() => {
    if (!isPlayingAd) return;
    if (adCountdown <= 0) {
      return;
    }
    const timer = setTimeout(() => {
      setAdCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [isPlayingAd, adCountdown]);

  // We can write highly intelligent Board Evaluation logic directly locally!
  const handleAnalyzeBoard = () => {
    // 1. Check if the current level layout is solved:
    const isAlreadySolved = bottles.length > 0 && bottles.every((b) => b.length === 0 || (b.length === 4 && b.every((x) => x === b[0])));
    if (isAlreadySolved) {
      return {
        status: "SOLVED",
        statusClass: "text-emerald-400 bg-emerald-950/20 border-emerald-500/20",
        tip: "Hit NEXT level to proceed onto your journey!",
        mismatchCount: 0,
        completedCount: bottles.filter(b => b.length === 4).length,
        progress: 100,
        path: [] as { from: number; to: number }[],
      };
    }

    // 2. Count distinct unmixed color stacks in the bottles:
    let totalLayers = 0;
    let mismatchedAdjacentLayers = 0;
    let completedBottlesCount = 0;
    
    bottles.forEach((b) => {
      if (b.length > 0) {
        totalLayers += b.length;
        // Count how many adjacent layers are different
        for (let i = 0; i < b.length - 1; i++) {
          if (b[i] !== b[i+1]) {
            mismatchedAdjacentLayers++;
          }
        }
        // Is it completed?
        if (b.length === 4 && b.every((x) => x === b[0])) {
          completedBottlesCount++;
        }
      }
    });

    // 3. Solve the current board state using solveWaterSort:
    const path = solveWaterSort(bottles, 1000);
    const solvable = (path && path.length > 0) || checkIsSolved(bottles);

    let statusText = "Solvable & Maneuverable";
    let statusClass = "text-emerald-400 bg-emerald-900/15 border-emerald-500/20";
    let strategyTip = "Analyze the colors. Focus on emptying at least one tube completely to get a vacant channel!";

    if (solvable) {
      if (path && path[0]) {
        strategyTip = `Strategic Move: Pour Tube ${path[0].from + 1} into Tube ${path[0].to + 1} to open up new pathways!`;
      } else {
        strategyTip = "Excellent! You are just a couple of moves away from completing the level.";
      }
    } else {
      statusText = "Locked / Dead End";
      statusClass = "text-rose-400 bg-rose-950/20 border-rose-550/20";
      strategyTip = "Warning: Current states have no resolving maneuvers! Click 'Undo' or tap '+🧪 Extra Tube' to break the bottleneck.";
    }

    const calculatedProgress = totalLayers > 0 
      ? Math.round((completedBottlesCount / (difficulty === "easy" ? 3 : difficulty === "medium" ? 5 : 8)) * 100)
      : 0;

    return {
      status: statusText,
      statusClass: statusClass,
      solvable: solvable,
      tip: strategyTip,
      mismatchCount: mismatchedAdjacentLayers,
      completedCount: completedBottlesCount,
      progress: Math.min(100, calculatedProgress),
      path: path,
    };
  };

  const checkIsSolved = (state: Bottle[]) => {
    return state.every((b) => b.length === 0 || (b.length === 4 && b.every((col) => col === b[0])));
  };

  const analysis = handleAnalyzeBoard();

  return (
    <div className="flex flex-col w-full h-full max-w-md mx-auto pointer-events-none select-none justify-between">
      {/* Top Controller Panel - Pack all requested actions up top */}
      <div className="w-full shrink-0 flex flex-col p-4 pointer-events-auto gap-3 bg-gradient-to-b from-[#111116]/90 via-[#111116]/40 to-transparent">
        
        {/* GOLDEN RETRO ARCADE BUTTONS ROW */}
        <div className="flex items-center justify-between w-full h-12 gap-1.5 select-none">
          {/* Group 1: Navigation & Moves */}
          <div className="flex items-center gap-1.5">
            {/* Home/Menu button */}
            <button
              onClick={onBackToHome}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 border-2 border-amber-950 shadow-[0_3px_0_#75350f] active:translate-y-[2px] active:shadow-[0_1px_0_#75350f] transition-all cursor-pointer"
              title="Return to title menu"
              id="back-to-home-btn-arcade"
            >
              <Home className="h-5 w-5 text-slate-950 stroke-[2.5]" />
            </button>

            {/* Undo Pour button */}
            <button
              onClick={onUndo}
              disabled={!undoAvailable}
              className={`flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 border-2 border-amber-950 shadow-[0_3px_0_#75350f] active:translate-y-[2px] active:shadow-[0_1px_0_#75350f] transition-all cursor-pointer ${
                !undoAvailable ? "opacity-35 cursor-not-allowed shadow-none translate-y-[2px] border-amber-950/60" : ""
              }`}
              title="Undo last pour"
              id="undo-btn-arcade"
            >
              <Undo className="h-5 w-5 text-slate-950 stroke-[2.5]" />
            </button>

            {/* Replay Same Level layout */}
            <button
              onClick={onReplayLevel}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 border-2 border-amber-950 shadow-[0_3px_0_#75350f] active:translate-y-[2px] active:shadow-[0_1px_0_#75350f] transition-all cursor-pointer"
              title="Reset current level layout"
              id="replay-btn-arcade"
            >
              <RotateCcw className="h-4.5 w-4.5 text-slate-950 stroke-[2.5]" />
            </button>
          </div>

          {/* Group 2: Helpers & Skip */}
          <div className="flex items-center gap-1.5">
            {/* Hint Solver helper */}
            <button
              onClick={onShowHint}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 border-2 border-amber-950 shadow-[0_3px_0_#75350f] active:translate-y-[2px] active:shadow-[0_1px_0_#75350f] transition-all cursor-pointer relative"
              title="Suggest strategic hint (costs 2K coins)"
              id="hint-btn-arcade"
            >
              <Lightbulb className="h-4.5 w-4.5 text-slate-950 stroke-[2.5]" />
              <span className="absolute -bottom-1 -right-0.5 bg-red-600 text-white font-mono font-black text-[7px] px-1 rounded-full border border-amber-950 leading-tight">
                2K
              </span>
            </button>

            {/* Add Extra Empty Tube */}
            <button
              onClick={onAddBottle}
              disabled={!canAddBottle}
              className={`flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 border-2 border-amber-950 shadow-[0_3px_0_#75350f] active:translate-y-[2px] active:shadow-[0_1px_0_#75350f] transition-all cursor-pointer relative ${
                !canAddBottle ? "opacity-35 cursor-not-allowed shadow-none translate-y-[2px] border-amber-950/60" : ""
              }`}
              title="Purchase extra glass tube container (costs 10K coins)"
              id="add-tube-btn-arcade"
            >
              <PlusCircle className="h-4.5 w-4.5 text-slate-950 stroke-[2.5]" />
              <span className="absolute -bottom-1 -right-0.5 bg-red-600 text-white font-mono font-black text-[7px] px-0.5 rounded-full border border-amber-950 leading-tight">
                10K
              </span>
            </button>

            {/* Skip current level board */}
            <button
              onClick={onSkipLevel}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 border-2 border-amber-950 shadow-[0_3px_0_#75350f] active:translate-y-[2px] active:shadow-[0_1px_0_#75350f] transition-all cursor-pointer relative"
              title="Skip level directly (costs 5K coins)"
              id="skip-btn-arcade"
            >
              <ArrowRight className="h-4.5 w-4.5 text-slate-950 stroke-[2.5]" />
              <span className="absolute -bottom-1 -right-0.5 bg-red-600 text-white font-mono font-black text-[7px] px-0.5 rounded-full border border-amber-950 leading-tight">
                5K
              </span>
            </button>

            {/* AI Advisor strategist brain */}
            <button
              onClick={() => {
                setShowAiCompanion(true);
                const audioObj = (window as any).gameAudio || { playPop: () => {} };
                if (audioObj.playPop) audioObj.playPop();
              }}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 border-2 border-amber-950 shadow-[0_3px_0_#75350f] active:translate-y-[2px] active:shadow-[0_1px_0_#75350f] transition-all cursor-pointer relative"
              title="Consult AI Tactical Advisor"
              id="ai-brain-btn-arcade"
            >
              <Brain className="h-4.5 w-4.5 text-slate-950 stroke-[2.5] animate-pulse" />
              <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
            </button>

            {/* Chat Save Gate */}
            {onOpenChatSaveGate && (
              <button
                onClick={() => {
                  onOpenChatSaveGate();
                  const audioObj = (window as any).gameAudio || { playPop: () => {} };
                  if (audioObj.playPop) audioObj.playPop();
                }}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8b5cf6] hover:bg-[#a78bfa] text-white border-2 border-amber-950 shadow-[0_3px_0_#75350f] active:translate-y-[2px] active:shadow-[0_1px_0_#75350f] transition-all cursor-pointer relative"
                title="Open Chat Save Gate"
                id="chat-save-gate-btn-arcade"
              >
                <FileText className="h-4.5 w-4.5 text-white stroke-[2.5]" />
                <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              </button>
            )}
          </div>
        </div>

        {/* HUD LEVEL, COINS, MOVES AND DIFFICULTIES STATUS INFOBAR */}
        <div className="flex items-center justify-between w-full h-9 px-1 gap-1">
          {/* Coins Display / Free Reward Trigger */}
          <button
            onClick={onTriggerAdReward}
            className="flex items-center gap-1.5 h-8 px-2.5 rounded bg-black/45 border border-amber-500/20 text-amber-300 hover:border-amber-400/40 hover:scale-103 active:scale-97 transition-all cursor-pointer select-none shadow-sm"
            title="Bonus: get +50 Coins free!"
          >
            <Coins className="h-3.5 w-3.5 fill-amber-400 stroke-amber-600 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="font-mono text-xs font-black">{coins}</span>
          </button>

          {/* LEVEL DISPLAY */}
          <div className="flex flex-col items-center">
            <span className="font-sans font-black text-xs sm:text-base tracking-[1px] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] select-none uppercase text-center truncate">
              {dailyChallengeActive 
                ? `DAILY ${dailyLevelIndex}/10` 
                : weeklyChallengeActive 
                  ? `WEEKLY ${weeklyLevelIndex}/5` 
                  : `LEVEL ${level}`
              }
            </span>
          </div>

          {/* Moves Count */}
          <div className="flex items-center gap-1 bg-black/45 h-8 px-2.5 rounded border border-indigo-500/10 text-slate-300 text-2xs font-extrabold uppercase">
            <Gauge className="h-3.5 w-3.5 text-sky-400 shrink-0" />
            <span>MOVES: <strong className="text-white font-black">{movesCount}</strong></span>
          </div>
        </div>

        {/* MINIMALIST LEVEL STATS AND FREE GIFT PILLS */}
        <div className="flex items-center justify-end w-full h-6 px-1.5 opacity-90">
          {/* Instant free gift coin button */}
          <button
            onClick={onTriggerAdReward}
            className="flex items-center gap-1 text-[10px] text-emerald-400 font-black tracking-wider uppercase hover:text-emerald-300"
            title={subscription !== "none" ? "VIP Unlimited Coins Boost" : "Claim free daily coins instantly"}
          >
            <Sparkles className="h-3 w-3 shrink-0 text-emerald-400 animate-bounce" />
            <span>{subscription !== "none" ? "+50🪙 VIP-GIFT" : "+50🪙 FREE-GIFT"}</span>
          </button>
        </div>

        {/* Dynamic Hints overlay description inline */}
        <AnimatePresence>
          {showHintActive && hintDescription && (
            <motion.div
              key="hint-description-badge"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="w-full bg-[#1A2234]/95 border border-[#20518C] rounded-xl px-4 py-2 text-3xs text-[#7DD3FC] text-center flex items-center justify-center gap-2 overflow-hidden font-sans font-extrabold uppercase shadow-lg select-text pointer-events-auto shrink-0 leading-relaxed"
            >
              <Lightbulb className="h-3.5 w-3.5 shrink-0 text-amber-400 animate-bounce" />
              <span>{hintDescription}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Spacer zone representing the middle Glass Bottles, completely transparent click-through! */}
      <div className="flex-1 min-h-0 pointer-events-none" />

      {/* Absolutely NOTHING at the bottom! No bar, no clutter, keeping it perfectly empty & clean below the bottles as requested. */}
      <div className="w-full h-2 shrink-0 pointer-events-none" />

      {/* Interactive popovers overlay dialog containers */}
      <AnimatePresence>
        {/* AI Companion Sidebar Modal Drawer */}
        {showAiCompanion && (
          <div key="ai-companion-dialog-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAiCompanion(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm pointer-events-auto"
            />

            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 15 }}
              className="relative w-full max-w-sm bg-[#111625] border border-violet-500/30 rounded-3xl p-6 shadow-2xl pointer-events-auto text-slate-100"
              id="ai-companion-drawer-dialog"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-violet-400 animate-bounce" />
                  <h3 className="font-sans text-xs font-black uppercase tracking-widest text-[#A78BFA]">
                    AI Tactical Companion v1.0
                  </h3>
                </div>
                <button
                  onClick={() => setShowAiCompanion(false)}
                  className="p-1.5 bg-neutral-900 border border-neutral-800 rounded-xl hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Tactical details are always fully unlocked, zero ads required! */}
              <div className="space-y-4">
                <div className="bg-violet-950/20 p-3 rounded-2xl border border-violet-500/10">
                  <p className="text-4xs font-black text-violet-400 uppercase tracking-widest mb-1.5">Offline Privacy Shield Active</p>
                  <p className="text-[11px] text-slate-300 font-sans">
                    Calculated in secure, locally-isolated sandbox threads directly on your device. Zero cloud analytics or telemetry logs transmitted, preserving Galaxy Studio core privacy standards.
                  </p>
                </div>

                  {/* Main solvability meter */}
                  <div className="bg-neutral-950/50 p-4 rounded-2xl border border-white/5 space-y-3 font-sans">
                    <div className="flex items-center justify-between">
                      <span className="text-3xs font-bold text-slate-400 uppercase tracking-wider font-sans">Evaluation State:</span>
                      <span className={`text-3.5cs font-bold px-2.5 py-1.5 rounded-xl border uppercase tracking-wider text-[11px] ${analysis.statusClass}`}>
                        {analysis.status}
                      </span>
                    </div>

                    <div className="space-y-1 pt-1 font-sans">
                      <div className="flex justify-between text-3xs font-bold text-slate-400 uppercase font-sans">
                        <span>Sorting Progress:</span>
                        <span className="text-emerald-400 font-black">{analysis.progress}%</span>
                      </div>
                      <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden border border-white/5">
                        <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${analysis.progress}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Diagnostic Details */}
                  <div className="grid grid-cols-2 gap-2.5 font-sans">
                    <div className="bg-[#151b2d] p-3 rounded-xl border border-white/5">
                      <span className="text-4xs font-black text-violet-400 uppercase tracking-wider block mb-0.5 font-sans">Tubes Sorted</span>
                      <span className="text-lg font-mono font-black text-white font-sans">{analysis.completedCount}</span>
                    </div>
                    <div className="bg-[#151b2d] p-3 rounded-xl border border-white/5">
                      <span className="text-4xs font-black text-violet-400 uppercase tracking-wider block mb-0.5 font-sans">Contact Junctions</span>
                      <span className="text-lg font-mono font-black text-white font-sans">{analysis.mismatchCount}</span>
                    </div>
                  </div>

                  {/* Core tactical suggestion */}
                  <div className="bg-[#1e142a]/60 p-4 rounded-2xl border border-violet-500/20 relative overflow-hidden font-sans">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-violet-500/5 rounded-full blur-xl pointer-events-none" />
                    <span className="text-3xs font-black text-violet-300 uppercase tracking-widest block mb-1 font-sans">
                      Companion Strategic Recommendation
                    </span>
                    <p className="text-slate-200 text-xs italic leading-relaxed font-sans">
                      "{analysis.tip}"
                    </p>
                  </div>

                  {/* Gated AI Autopilot Path Sequence */}
                  <div className="bg-[#0f111a] border border-violet-500/20 rounded-2xl p-4 space-y-3 font-sans">
                    <p className="text-3xs font-black text-[#A78BFA] uppercase tracking-widest flex items-center gap-1 font-sans">
                      <span>🔮 AI Gated Companion Autopilot Pathway</span>
                    </p>
                    
                    {analysis.path && analysis.path.length > 0 ? (
                      <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
                        {analysis.path.slice(0, 10).map((move, index) => (
                          <div 
                            key={index} 
                            className="flex items-center justify-between bg-[#151722] border border-white/5 py-1.5 px-3 rounded-lg text-[11px] font-sans font-medium"
                          >
                            <span className="text-slate-400 font-sans">Step {index + 1}:</span>
                            <div className="flex items-center gap-1.5 font-sans">
                              <span className="bg-[#7a55ed]/20 text-[#a588f7] border border-[#7a55ed]/30 px-1.5 py-0.5 rounded font-black font-mono">
                                Tube {move.from + 1}
                              </span>
                              <span className="text-slate-500 font-bold font-sans">➔</span>
                              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-black font-mono">
                                Tube {move.to + 1}
                              </span>
                            </div>
                          </div>
                        ))}
                        {analysis.path.length > 10 && (
                          <p className="text-[10px] text-slate-500 text-center italic mt-1.5 font-sans">
                            ... and {analysis.path.length - 10} more tactical maneuvers
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic font-sans py-2 text-center bg-black/20 rounded-lg">
                        No path found. Ensure current tubes are unblocked!
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/5 font-sans">
                    <button
                      onClick={() => setShowAiCompanion(false)}
                      className="w-full bg-violet-600 hover:bg-violet-700 active:scale-95 text-white rounded-xl py-2.5 font-sans text-2xs font-bold uppercase tracking-widest transition-all cursor-pointer border-none shadow-md shadow-violet-600/20 font-sans"
                    >
                      Confirm Insight
                    </button>
                  </div>
                </div>
            </motion.div>
          </div>
        )}

        {/* Level Complete Victory Congrats modal overlay dialog */}
        {isCompleted && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 pointer-events-auto">
            {/* Dark background modal shadow blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              id="victory-backdrop"
            />

            {/* Confetti drop animation simulation effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-10 select-none">
              {[...Array(16)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: -50, x: Math.random() * 400 - 200, rotate: 0 }}
                  animate={{ y: 900, rotate: 360, x: Math.random() * 400 - 200 }}
                  transition={{ repeat: Infinity, duration: 2.5 + Math.random() * 2, ease: "linear" }}
                  className="absolute w-2 h-4 rounded-xs opacity-80"
                  style={{
                    backgroundColor: ["#f43f5e", "#0ea5e9", "#10b981", "#fbbf24", "#a855f7"][i % 5],
                    left: `${5 + Math.random() * 90}%`,
                    top: `-20px`
                  }}
                />
              ))}
            </div>

            {/* Core screenshot layout container matching Image 1 */}
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 220 }}
              className="relative w-full max-w-sm rounded-[24px] sm:rounded-3xl bg-transparent flex flex-col items-center justify-center p-2 sm:p-4 select-none text-center z-20"
              id="victory-body"
            >
              {/* 1. Golden Crown on top with green gemstone from Photo 1 */}
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
                className="relative z-30 filter drop-shadow-[0_6px_15px_rgba(245,158,11,0.5)] shrink-0 scale-90 sm:scale-100"
              >
                <div className="w-24 h-12 sm:w-28 sm:h-16 flex items-center justify-center select-none">
                  <svg viewBox="0 0 100 60" className="w-full h-full fill-amber-400 stroke-amber-600 stroke-2">
                    {/* Crown main gold body */}
                    <path d="M10 50 L90 50 L85 20 L65 35 L50 15 L35 35 L15 20 Z" />
                    
                    {/* Gemstones on peak */}
                    <circle cx="15" cy="20" r="4.5" fill="#f43f5e" />
                    
                    {/* Central Diamond Emerald green jewel - high visibility matching screenshot 1 */}
                    <polygon points="50,11 54,17 50,23 46,17" fill="#10b981" stroke="#34d399" strokeWidth="1" />
                    
                    <circle cx="85" cy="20" r="4.5" fill="#0ea5e9" />
                    {/* Base decorations */}
                    <rect x="18" y="44" width="64" height="4.5" rx="2" fill="#d97706" />
                    <circle cx="34" cy="46" r="1.5" fill="#ffffff" />
                    <circle cx="50" cy="46" r="1.5" fill="#f43f5e" />
                    <circle cx="65" cy="46" r="1.5" fill="#ffffff" />
                  </svg>
                </div>
              </motion.div>

              {/* 2. 3D folded game Ribbon Banner containing randomized positive words ("AWESOME", "NICE") */}
              <div className="relative flex items-center justify-center w-full my-1 z-20 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] shrink-0 scale-90 sm:scale-100">
                {/* Visual Ribbon tails for 3D realism */}
                <div className="absolute -left-1.5 bottom-1.2 w-6 h-8 sm:h-10 bg-rose-800 rounded-l-md transform -skew-y-12 origin-right -z-10 overflow-hidden">
                  <div className="absolute inset-0 bg-black/15" />
                </div>
                <div className="absolute -left-1.5 bottom-0.5 w-3 h-1.5 bg-rose-950 rounded-bl-sm transform -z-10" />

                {/* Central Ribbon Panel */}
                <div className="bg-gradient-to-r from-rose-600 to-rose-500 py-2 sm:py-3.5 px-10 sm:px-14 border-y border-white/25 rounded-md shadow-xl relative select-none">
                  <div className="absolute inset-0.5 border border-dashed border-white/20 select-none" />
                  <span className="font-sans font-black text-xl sm:text-3xl text-white tracking-[0.08em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.55)] font-bold italic">
                    {["AWESOME", "GREAT", "NICE", "EXCELLENT", "BRILLIANT", "PRO MASTER"][level % 6]}
                  </span>
                </div>

                <div className="absolute -right-1.5 bottom-0.5 w-3 h-1.5 bg-rose-950 rounded-br-sm transform -z-10" />
                <div className="absolute -right-1.5 bottom-1.2 w-6 h-8 sm:h-10 bg-rose-800 rounded-r-md transform skew-y-12 origin-left -z-10 overflow-hidden">
                  <div className="absolute inset-0 bg-black/15" />
                </div>
              </div>

              {/* Reward feedback & mini achievements stats block */}
              <div className="mt-4 sm:mt-8 mb-4 sm:mb-8 bg-black/40 px-5 sm:px-6 py-2.5 sm:py-4 rounded-2xl sm:rounded-3xl border border-neutral-800 max-w-xs w-full shadow-inner select-none space-y-1 sm:space-y-2 shrink-0">
                <p className="font-sans text-[11px] sm:text-xs text-yellow-400 font-extrabold uppercase tracking-widest flex items-center justify-center gap-1">
                  <Coins className="h-4 w-4 fill-yellow-400 stroke-yellow-600 animate-spin" />
                  <span>REWARDED: +100 COINS</span>
                </p>
                <p className="font-sans text-[9px] sm:text-2xs text-slate-400 tracking-widest uppercase">
                  Solved in <strong className="text-white font-black">{movesCount}</strong> moves
                </p>
              </div>

              {/* 3. High visual centered Yellow Pill Button labeled "NEXT" */}
              <div className="w-full max-w-xs px-2 mb-3 shrink-0">
                <motion.button
                  onClick={onNextLevel}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  className="w-full py-3 sm:py-4 px-8 sm:px-10 rounded-full bg-[#fbbf24] text-slate-950 font-sans text-base sm:text-xl font-extrabold uppercase tracking-[2px] sm:tracking-[4px] shadow-[0_6px_20px_rgba(245,158,11,0.35)] border-t border-white/20 border-b-2 sm:border-b-4 border-amber-600 cursor-pointer select-none"
                  id="congrats-next-level-btn"
                >
                  NEXT
                </motion.button>
              </div>

              {/* 4. "Easy & Hard" footer indicator matching the exact photo layout */}
              <p className="font-sans text-xs sm:text-sm font-black text-slate-100 uppercase tracking-[2px] sm:tracking-[4px] opacity-90 mb-3 sm:mb-5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] shrink-0">
                Easy & Hard
              </p>

              {/* Replay option fallback */}
              <button
                onClick={onReplayLevel}
                className="font-sans text-[9px] sm:text-3xs font-extrabold text-slate-400 hover:text-white uppercase tracking-widest flex items-center gap-1 opacity-75 hover:opacity-100 transition-opacity cursor-pointer mx-auto shrink-0 pb-2"
                id="congrats-replay-level-btn"
              >
                <RefreshCw className="h-2.5 w-2.5" />
                <span>Replay Same Layout</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
