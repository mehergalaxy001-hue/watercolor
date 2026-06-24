import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Award, Lock, Play, RotateCcw, Sparkles, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { gameAudio } from "../utils/audio";

interface LevelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  maxUnlockedLevel: number;
  currentLevel: number;
  onSelectLevel: (lvl: number) => void;
  onResetLevelProgress: () => void;
}

export const LevelSelectorModal: React.FC<LevelSelectorModalProps> = ({
  isOpen,
  onClose,
  maxUnlockedLevel,
  currentLevel,
  onSelectLevel,
  onResetLevelProgress,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 48; // Beautiful 12 rows of 4 columns, highly responsive
  const MAX_GLOBAL_LEVELS = 100000;

  // Initialize current page to show the current active level
  useEffect(() => {
    if (isOpen) {
      const initialPage = Math.floor((currentLevel - 1) / ITEMS_PER_PAGE);
      setCurrentPage(initialPage);
      setErrorFeedback(null);
      setSearchQuery("");
    }
  }, [isOpen, currentLevel]);

  if (!isOpen) return null;

  const totalPages = Math.ceil(MAX_GLOBAL_LEVELS / ITEMS_PER_PAGE);

  // Calculate current range of levels
  const startLevel = currentPage * ITEMS_PER_PAGE + 1;
  const endLevel = Math.min(startLevel + ITEMS_PER_PAGE - 1, MAX_GLOBAL_LEVELS);

  const levelsList: number[] = [];
  for (let i = startLevel; i <= endLevel; i++) {
    levelsList.push(i);
  }

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      gameAudio.playPop();
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      gameAudio.playPop();
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lvlNum = parseInt(searchQuery, 10);
    if (isNaN(lvlNum) || lvlNum < 1 || lvlNum > MAX_GLOBAL_LEVELS) {
      setErrorFeedback("Enter valid level [1-100,000]");
      gameAudio.playError();
      return;
    }

    // Go to page containing that level
    const targetPage = Math.floor((lvlNum - 1) / ITEMS_PER_PAGE);
    setCurrentPage(targetPage);
    setErrorFeedback(null);
    gameAudio.playVictory();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-hidden select-none">
        
        {/* Animated Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[#0b0e17] border border-slate-800/80 rounded-3xl w-full max-w-md h-[85vh] flex flex-col overflow-hidden shadow-2xl"
          id="level-selector-overlay-modal"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#07090f] shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-500/10 rounded-xl animate-pulse">
                <Award className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="font-sans text-sm font-black text-white uppercase tracking-wider">Level Selector</h2>
                <p className="text-[9px] font-mono text-indigo-300 uppercase tracking-widest">100,000 Stages Available</p>
              </div>
            </div>

            {/* Reset Progress Action */}
            <button
              onClick={() => {
                if (window.confirm("Do you want to reset your level progress back to Level 1? All unlocked levels will be locked.")) {
                  onResetLevelProgress();
                  setCurrentPage(0);
                  gameAudio.playVictory();
                }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/25 hover:border-rose-500/40 text-rose-400 hover:text-rose-300 font-sans text-4xs font-black uppercase tracking-widest cursor-pointer transition-all active:scale-95"
              title="Reset progress to Level 1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Progress</span>
            </button>
          </div>

          {/* Quick Level Search and Info Bar */}
          <div className="px-5 py-3.5 bg-[#090b12] border-b border-white/5 shrink-0 space-y-2.5">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Jump to any Level (e.g. 9945)..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (errorFeedback) setErrorFeedback(null);
                  }}
                  className="w-full bg-[#05070a] border border-white/10 rounded-xl py-2 pl-8 pr-3 text-xs text-white font-sans placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-505"
                />
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
              </div>
              <button
                type="submit"
                className="px-3.5 bg-indigo-600 hover:bg-indigo-550 active:scale-95 transition-all text-white rounded-xl text-3xs font-sans font-black uppercase tracking-wider cursor-pointer"
              >
                Go
              </button>
            </form>

            {errorFeedback ? (
              <p className="text-4xs font-mono font-black text-rose-400 uppercase tracking-widest animate-shake">
                ⚠️ {errorFeedback}
              </p>
            ) : (
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-sans leading-relaxed">
                <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>You can view and browse all levels, but future ones are locked!</span>
              </div>
            )}
          </div>

          {/* Pagination Navigation Toggler */}
          <div className="px-5 py-3 bg-[#0d101a] border-b border-white/5 flex items-center justify-between shrink-0">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className={`p-1.5 rounded-lg border transition-all ${
                currentPage === 0
                  ? "bg-neutral-900 border-neutral-950 text-neutral-700 cursor-not-allowed opacity-40"
                  : "bg-slate-900 border-white/10 text-slate-300 hover:text-white cursor-pointer hover:bg-slate-850 active:scale-95"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="font-sans text-[10px] font-black tracking-widest text-[#FFF] uppercase text-center">
              Levels {startLevel.toLocaleString()} - {endLevel.toLocaleString()}
            </span>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages - 1}
              className={`p-1.5 rounded-lg border transition-all ${
                currentPage === totalPages - 1
                  ? "bg-neutral-900 border-neutral-950 text-neutral-700 cursor-not-allowed opacity-40"
                  : "bg-slate-900 border-white/10 text-slate-300 hover:text-white cursor-pointer hover:bg-slate-850 active:scale-95"
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable Levels Grid */}
          <div className="flex-1 overflow-y-auto p-5 bg-[#080a10]" id="level-grid-scroll-panel">
            <div className="grid grid-cols-4 gap-3 pb-6">
              {levelsList.map((lvl) => {
                const isCurrent = lvl === currentLevel;
                const isUnlocked = lvl <= maxUnlockedLevel;
                const isCompleted = lvl < maxUnlockedLevel;

                return (
                  <motion.button
                    key={lvl}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (isUnlocked) {
                        onSelectLevel(lvl);
                        gameAudio.playVictory();
                      } else {
                        gameAudio.playError();
                        setErrorFeedback(`Level ${lvl} is locked! Complete preceding natural levels to unlock. 🔒`);
                      }
                    }}
                    className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl transition-all border select-none cursor-pointer ${
                      isCurrent
                        ? "bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 border-indigo-400 text-white font-black shadow-lg shadow-indigo-500/20"
                        : isCompleted
                        ? "bg-emerald-950/25 border-emerald-500/25 text-emerald-400 font-bold hover:bg-emerald-950/35 hover:border-emerald-500/40"
                        : isUnlocked
                        ? "bg-slate-900 border-slate-750 text-slate-200 font-bold hover:bg-slate-850 hover:border-slate-700"
                        : "bg-[#05060a]/60 border-white/[0.02] text-slate-650 opacity-45"
                    }`}
                    title={isUnlocked ? `Play Level ${lvl}` : `Level ${lvl} is locked 🔒`}
                  >
                    {/* Level Number */}
                    <span className="text-3s font-sans font-black z-10 leading-none translate-y-[-4px]">{lvl.toLocaleString()}</span>

                    {/* Status Badge Overlays */}
                    {!isUnlocked ? (
                      <span className="absolute top-1.5 right-1.5 z-20">
                        <Lock className="w-2.5 h-2.5 text-slate-650" />
                      </span>
                    ) : isCompleted ? (
                      <div className="absolute bottom-1.5 flex gap-0.5 justify-center items-center z-20 animate-[pulse_2s_infinite]">
                        <span className="text-[7px] text-yellow-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">★</span>
                        <span className="text-[9px] text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] -translate-y-[1px]">★</span>
                        <span className="text-[7px] text-yellow-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">★</span>
                      </div>
                    ) : null}

                    {/* Glowing pulse rings for active level */}
                    {isCurrent && (
                      <span className="absolute inset-0 rounded-2xl border border-white animate-pulse opacity-25" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Footer Close control */}
          <div className="p-4 border-t border-white/5 bg-[#07090f] shrink-0">
            <button
              onClick={() => {
                gameAudio.playPop();
                onClose();
              }}
              className="w-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-slate-400 hover:text-white rounded-2xl py-3.5 font-sans text-3xs font-black uppercase tracking-widest transition-all cursor-pointer"
            >
              Close Selector
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
