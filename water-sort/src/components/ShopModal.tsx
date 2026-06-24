import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Coins, ShoppingBag, Palette, Sparkles, Check, Lock, Play, Crown, Zap, Gift } from "lucide-react";
import { BOTTLE_SKINS, BACKGROUND_THEMES, BottleSkin, BackgroundTheme } from "../data/skins";
import { gameAudio } from "../utils/audio";

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  onDeductCoins: (amount: number) => void;
  onAddCoins: (amount: number) => void;
  unlockedSkinIds: string[];
  onUnlockSkin: (skinId: string) => void;
  equippedSkinId: string;
  onEquipSkin: (skinId: string) => void;
  unlockedBgIds: string[];
  onUnlockBg: (bgId: string) => void;
  equippedBgId: string;
  onEquipBg: (bgId: string) => void;
  showNotification: (msg: string) => void;
  subscription: "none" | "1year" | "5years" | "lifetime";
  onBuySubscription: (type: "1year" | "5years" | "lifetime") => void;
  aiChatCount: number;
  aiImageCount: number;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  coins,
  onDeductCoins,
  onAddCoins,
  unlockedSkinIds,
  onUnlockSkin,
  equippedSkinId,
  onEquipSkin,
  unlockedBgIds,
  onUnlockBg,
  equippedBgId,
  onEquipBg,
  showNotification,
  subscription,
  onBuySubscription,
  aiChatCount,
  aiImageCount,
}) => {
  const [activeTab, setActiveTab] = useState<"skins" | "backgrounds" | "premium">("skins");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingMsg, setProcessingMsg] = useState<string>("");

  // Persistent 100 coin free claim lockout
  const [claimCount, setClaimCount] = useState<number>(() => {
    return parseInt(localStorage.getItem("water_sort_shop_claim_count") || "0", 10);
  });
  const [lockoutUntil, setLockoutUntil] = useState<number>(() => {
    return parseInt(localStorage.getItem("water_sort_shop_lockout_until") || "0", 10);
  });
  const [lockoutCountdown, setLockoutCountdown] = useState<string>("");

  React.useEffect(() => {
    const updateLockout = () => {
      const now = Date.now();
      if (lockoutUntil > 0) {
        const diff = lockoutUntil - now;
        if (diff <= 0) {
          setLockoutUntil(0);
          setClaimCount(0);
          localStorage.setItem("water_sort_shop_lockout_until", "0");
          localStorage.setItem("water_sort_shop_claim_count", "0");
          setLockoutCountdown("");
        } else {
          const days = Math.floor(diff / (24 * 60 * 60 * 1000));
          const hrs = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
          const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
          const secs = Math.floor((diff % (60 * 1000)) / 1000);
          
          let countText = "";
          if (days > 0) {
            countText += `${days}d `;
          }
          countText += `${hrs}h ${mins}m ${secs}s`;
          setLockoutCountdown(countText);
        }
      } else {
        setLockoutCountdown("");
      }
    };

    updateLockout();
    const timer = setInterval(updateLockout, 1000);
    return () => clearInterval(timer);
  }, [lockoutUntil]);

  const handleClaimCoins = () => {
    const now = Date.now();
    if (lockoutUntil > now) {
      showNotification(`Claim box is locked! Reopens in ${lockoutCountdown} ⏳`);
      return;
    }

    const nextCount = claimCount + 1;
    if (nextCount >= 3) {
      // Hit the limit! Lock for exactly 3 days (72 hours)
      const lockoutTime = now + 3 * 24 * 60 * 60 * 1000;
      setClaimCount(3);
      setLockoutUntil(lockoutTime);
      localStorage.setItem("water_sort_shop_claim_count", "3");
      localStorage.setItem("water_sort_shop_lockout_until", lockoutTime.toString());
      
      onAddCoins(100);
      gameAudio.playVictory();
      showNotification("🎉 Claimed +100 Coins! Max 3 daily claims reached. Claim Box locked for 3 Days! 🔒");
    } else {
      setClaimCount(nextCount);
      localStorage.setItem("water_sort_shop_claim_count", nextCount.toString());
      onAddCoins(100);
      gameAudio.playVictory();
      showNotification(`🪙 Claimed +100 Cosmic Coins! (${nextCount}/3 claims used) 🎉`);
    }
  };

  const handleTestResetClaim = () => {
    setClaimCount(0);
    setLockoutUntil(0);
    localStorage.setItem("water_sort_shop_claim_count", "0");
    localStorage.setItem("water_sort_shop_lockout_until", "0");
    setLockoutCountdown("");
    showNotification("🛠️ Test Mode: Claim limits and lockouts cleared!");
    gameAudio.playVictory();
  };
  
  // Custom interactive mock-ad state parameters
  const [adWatching, setAdWatching] = useState<boolean>(false);
  const [adTimeLeft, setAdTimeLeft] = useState<number>(0);
  const [currentAdIndex, setCurrentAdIndex] = useState<number>(0);

  const MOCK_ADS = [
    {
      title: "Water Colour 3D",
      subtitle: "The Ultimate Fluid Expansion Pack",
      description: "Step into the third dimension! Stunning immersive 3D bottles, custom fluid viscosity simulations, and physical gyro tilt pouring! Coming soon to all galaxy devices.",
      accentColor: "from-cyan-400 via-indigo-500 to-rose-450",
      buttonText: "Pre-Register Now",
      emoji: "🌊"
    },
    {
      title: "Galaxy Tubes Pro",
      subtitle: "Custom Laboratory Flask Pack",
      description: "Tired of regular scientific test tubes? Equip retro-futuristic test-tubes, heavy beaker cups, Erlenmeyer flasks, and glowing potion bottles! Unlockable in the premium skins tab.",
      accentColor: "from-amber-400 via-yellow-300 to-orange-500",
      buttonText: "Explore Skins",
      emoji: "🧪"
    },
    {
      title: "Antigravity Paints",
      subtitle: "Interactive Cosmic Fluid Shaders",
      description: "Upgrade your levels with dynamic particle fluids, shimmering starry stardust patterns, and authentic glass sound impacts. Certified completely ad-free and tracking-free!",
      accentColor: "from-emerald-400 via-teal-300 to-cyan-500",
      buttonText: "Shop Backdrops",
      emoji: "✨"
    },
    {
      title: "Deep Space Melodies",
      subtitle: "Premium Synthesizer Expansion",
      description: "Relax your nervous system with customizable sine, square, triangle, and sawtooth ambient audio soundscapes. Sound, logic, and puzzles come together in peace.",
      accentColor: "from-rose-500 via-purple-500 to-indigo-500",
      buttonText: "Listen Now",
      emoji: "🎵"
    }
  ];

  // Ad watcher countdown ticker
  React.useEffect(() => {
    let timer: any;
    if (adWatching && adTimeLeft > 0) {
      timer = setInterval(() => {
        setAdTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setAdWatching(false);
            onAddCoins(100);
            gameAudio.playVictory();
            showNotification("Successfully watched advertisement! +100 Cosmic Coins earned! 🪙🎬");
            return 0;
          }
          gameAudio.playPop();
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [adWatching, adTimeLeft]);

  if (!isOpen) return null;

  // Buy Bottle Skin handler
  const handleBuySkin = (skin: BottleSkin) => {
    if (coins >= skin.cost) {
      onDeductCoins(skin.cost);
      onUnlockSkin(skin.id);
      onEquipSkin(skin.id);
      gameAudio.playVictory();
      showNotification(`Unlocked & Equipped: ${skin.name}! 💎🏷️`);
    } else {
      gameAudio.playPop();
      showNotification(`Need ${skin.cost - coins} more 🪙 to buy this skin!`);
    }
  };

  // Equip Bottle Skin handler
  const handleEquipSkin = (skin: BottleSkin) => {
    onEquipSkin(skin.id);
    gameAudio.playPop();
  };

  // Buy Background Theme handler
  const handleBuyBg = (bg: BackgroundTheme) => {
    if (coins >= bg.cost) {
      onDeductCoins(bg.cost);
      onUnlockBg(bg.id);
      onEquipBg(bg.id);
      gameAudio.playVictory();
      showNotification(`Unlocked & Equipped BG: ${bg.name}! 🎨🌌`);
    } else {
      gameAudio.playPop();
      showNotification(`Need ${bg.cost - coins} more 🪙 to buy this background!`);
    }
  };

  // Equip Background Theme handler
  const handleEquipBg = (bg: BackgroundTheme) => {
    onEquipBg(bg.id);
    gameAudio.playPop();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-hidden select-none">
        
        {/* Animated Main Shop Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[#0b0e17] border border-slate-800/80 rounded-3xl w-full max-w-md h-[82vh] flex flex-col overflow-hidden shadow-2xl"
          id="premium-game-shop-modal"
        >
          {/* Header area with Live Coin Wallet balances */}
          <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#07090f] shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/10 rounded-xl">
                <ShoppingBag className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h2 className="font-sans text-base font-black text-white uppercase tracking-wider">Premium Customizer</h2>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest uppercase">Galaxy Level Skins</p>
              </div>
            </div>

            {/* Wallet Balance widget */}
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-3.5 py-1.5 rounded-full shadow-inner select-none transition-all">
              <Coins className="h-4 w-4 text-amber-400 animate-pulse" />
              <span className="font-mono text-xs font-black text-amber-200">{coins}</span>
              <span className="text-[10px] text-amber-500 font-bold">🪙</span>
            </div>
          </div>

          {/* Dynamic Tabs selectors (BOTTLE SKINS vs BACKGROUNDS vs COINS & VIP) */}
          <div className="px-3 py-2.5 bg-[#090b12] border-b border-white/5 flex gap-1.5 shrink-0 overflow-x-auto scrollbar-none">
            <button
              onClick={() => {
                setActiveTab("skins");
                gameAudio.playPop();
              }}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border-none whitespace-nowrap ${
                activeTab === "skins"
                  ? "bg-gradient-to-r from-cyan-600 to-sky-500 text-white shadow-lg shadow-cyan-600/10"
                  : "bg-black/30 hover:bg-black/50 text-slate-400 hover:text-slate-250"
              }`}
              id="shop-skins-tab-btn"
            >
              <Sparkles className="h-2.5 w-2.5 shrink-0" />
              <span>Skins</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("backgrounds");
                gameAudio.playPop();
              }}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border-none whitespace-nowrap ${
                activeTab === "backgrounds"
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/10"
                  : "bg-black/30 hover:bg-black/50 text-slate-400 hover:text-slate-250"
              }`}
              id="shop-backgrounds-tab-btn"
            >
              <Palette className="h-2.5 w-2.5 shrink-0" />
              <span>Backdrops</span>
            </button>
             <button
              onClick={() => {
                setActiveTab("premium");
                gameAudio.playPop();
              }}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border-none whitespace-nowrap relative ${
                activeTab === "premium"
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-1050 shadow-lg shadow-amber-500/10"
                  : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200"
              }`}
              id="shop-premium-tab-btn"
            >
              <Play className="h-2.5 w-2.5 shrink-0 fill-amber-400 stroke-amber-500" />
              <span>Coins & Ads</span>
            </button>
          </div>

          {/* Scrollable Shop Content Grid */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 relative" id="shop-items-panel">
            
            {/* Real-time interactive payment simulation overlay inside ShopModal */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  key="shop-processing-loader"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-950/95 z-50 flex flex-col items-center justify-center p-6 text-center"
                >
                  <div className="relative mb-4">
                    <div className="w-16 h-16 rounded-full border-t-2 border-b-2 border-amber-400 animate-spin" />
                    <Crown className="absolute inset-0 m-auto h-6 w-6 text-amber-400 animate-pulse" />
                  </div>
                  <h3 className="font-sans text-xs font-black text-white uppercase tracking-widest mb-1.5">
                    Cosmic Pay Secure Gateway
                  </h3>
                  <p className="font-mono text-[10px] text-amber-300 max-w-xs">{processingMsg}</p>
                  <p className="font-sans text-[8px] text-slate-500 uppercase tracking-widest mt-8">
                    Please do not close store...
                  </p>
                </motion.div>
              )}

              {adWatching && (
                <motion.div
                  key="shop-ad-watching-overlay"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-950/98 z-50 flex flex-col justify-between p-6 select-none"
                >
                  {/* Ad Header with Countdown */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[7px] font-black uppercase bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full tracking-widest">
                        SPONSOR AD
                      </span>
                      <span className="font-sans text-[9px] font-bold text-slate-400">
                        Supporting independent developers
                      </span>
                    </div>
                    <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                      <span className="font-sans text-3xs font-black text-slate-200 tracking-wider">
                        EARN IN: {adTimeLeft}s
                      </span>
                    </div>
                  </div>

                  {/* Ad Creative Center Body */}
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-6">
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="w-20 h-20 rounded-3xl bg-neutral-900 border border-white/10 flex items-center justify-center shadow-2xl relative"
                    >
                      <span className="text-4xl filter drop-shadow-[0_4px_8px_rgba(255,255,255,0.1)]">
                        {MOCK_ADS[currentAdIndex].emoji}
                      </span>
                    </motion.div>

                    <div className="space-y-2 max-w-sm">
                      <h4 className="font-sans text-base font-black text-white uppercase tracking-wider">
                        {MOCK_ADS[currentAdIndex].title}
                      </h4>
                      <p className="font-semibold text-2xs text-[#00e1ff] tracking-wide uppercase">
                        {MOCK_ADS[currentAdIndex].subtitle}
                      </p>
                      <p className="font-sans text-[11px] text-slate-400 leading-relaxed font-normal">
                        {MOCK_ADS[currentAdIndex].description}
                      </p>
                    </div>

                    <div className="pt-2 w-full max-w-xs">
                      <button
                        onClick={() => {
                          gameAudio.playVictory();
                          showNotification(`Redirecting to sponsored ${MOCK_ADS[currentAdIndex].title} hub! 🌍🛰️`);
                        }}
                        className={`w-full py-3 bg-gradient-to-r ${MOCK_ADS[currentAdIndex].accentColor} text-slate-950 font-sans text-2xs font-extrabold uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 cursor-pointer border-none shadow-lg`}
                      >
                        {MOCK_ADS[currentAdIndex].buttonText}
                      </button>
                    </div>
                  </div>

                  {/* Ad footer progression load indicator */}
                  <div className="space-y-1.5">
                    <div className="w-full bg-slate-905 border border-white/5 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: `${((5 - adTimeLeft) / 5) * 100}%` }}
                        transition={{ duration: 1, ease: "linear" }}
                        className="h-full bg-gradient-to-r from-sky-400 via-teal-400 to-amber-400"
                      />
                    </div>
                    <p className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest text-center">
                      AD SECURED BY COSMIC ADS. COINS CREDITED INSTANTLY ON TIMEOUT.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {activeTab === "skins" ? (
              <div className="grid grid-cols-2 gap-3 pb-6">
                {BOTTLE_SKINS.map((skin) => {
                  const isUnlocked = unlockedSkinIds.includes(skin.id);
                  const isEquipped = equippedSkinId === skin.id;

                  return (
                    <motion.div
                      key={skin.id}
                      whileHover={{ scale: 1.02 }}
                      className={`relative flex flex-col justify-between p-3.5 rounded-2xl border bg-black/40 text-center transition-all ${
                        isEquipped
                          ? "border-cyan-500 bg-cyan-950/5 shadow-md shadow-cyan-950/10"
                          : isUnlocked
                          ? "border-slate-800/80 hover:border-slate-700 hover:bg-black/50"
                          : "border-slate-900 bg-black/50 opacity-90"
                      }`}
                    >
                      {/* Active tag / Badge overlay */}
                      {isEquipped && (
                        <span className="absolute top-2 right-2 text-[8px] font-black uppercase tracking-widest bg-cyan-500 text-slate-950 px-1.5 py-0.5 rounded-full">
                          Active
                        </span>
                      )}

                      {/* Visual Live Preview of the Skin Bottle Shape */}
                      <div className="h-28 flex items-center justify-center relative mt-2 mb-3 bg-slate-950/60 rounded-xl border border-white/5 shadow-inner">
                        <div
                          className="w-10 h-20 rounded-b-2xl border-2 flex flex-col justify-end items-center relative overflow-hidden transition-all duration-300"
                          style={{
                            borderColor: skin.glassColor,
                            boxShadow: `0 0 12px ${skin.glowColor}`,
                          }}
                        >
                          {/* Beautiful simulated fluid layers of vibrant colours */}
                          <div className="w-full h-4 bg-orange-500/80 border-t border-orange-400" />
                          <div className="w-full h-4 bg-cyan-500/80 border-t border-cyan-400" />
                          <div className="w-full h-4 bg-rose-500/80 border-t border-rose-400" />

                          {/* Float Custom Emoji sticker overlay decal printed on glass */}
                          {skin.sticker && (
                            <span className="absolute top-[25%] text-base select-none z-10 animate-bounce" style={{ animationDuration: '3.5s' }}>
                              {skin.sticker}
                            </span>
                          )}

                          {/* Reflection highlight */}
                          <div className="absolute left-1 top-1 bottom-1 w-0.5 bg-white/10" />
                        </div>
                      </div>

                      {/* Label metadata */}
                      <div className="mb-3.5 space-y-0.5">
                        <h4 className="font-sans text-xs font-black text-slate-100 truncate tracking-wide">{skin.name}</h4>
                        <p className="text-[9px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
                          {skin.cost === 0 ? "Default" : `${skin.cost.toLocaleString()} COINS`}
                        </p>
                      </div>

                      {/* CTA Trigger Button */}
                      {isEquipped ? (
                        <button
                          disabled
                          className="w-full bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 py-2 rounded-xl text-4xs font-black uppercase tracking-widest cursor-default border-none"
                        >
                          Equipped
                        </button>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => handleEquipSkin(skin)}
                          className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-sans py-2 rounded-xl text-4xs font-black uppercase tracking-widest cursor-pointer select-none border-none transition-colors"
                        >
                          Equip
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuySkin(skin)}
                          className="w-full flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-sans py-2 rounded-xl text-4xs font-black uppercase tracking-widest cursor-pointer select-none border-none transition-colors"
                        >
                          <Lock className="h-2.5 w-2.5 text-slate-950" />
                          <span>Unlock</span>
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : activeTab === "backgrounds" ? (
              <div className="space-y-3 pb-6">
                {BACKGROUND_THEMES.map((themeItem) => {
                  const isUnlocked = unlockedBgIds.includes(themeItem.id);
                  const isEquipped = equippedBgId === themeItem.id;

                  return (
                    <motion.div
                      key={themeItem.id}
                      whileHover={{ scale: 1.01 }}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        isEquipped
                          ? "border-indigo-500 bg-indigo-950/5 shadow-md shadow-indigo-950/5"
                          : isUnlocked
                          ? "border-slate-800 bg-black/40 hover:border-slate-700 hover:bg-black/50"
                          : "border-slate-900 bg-black/40 opacity-90"
                      }`}
                    >
                      {/* Left: mini visual preview box representing the background theme */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-14 h-14 rounded-xl shadow-inner border border-white/5 overflow-hidden flex flex-col justify-around p-1.5 ${themeItem.gradientClass}`}
                        >
                          {/* Mini bottles drawings inside the thumbnail preview */}
                          <div className="flex justify-between items-end h-full px-0.5 gap-0.5">
                            <div className="w-2.5 h-10 rounded-b-md border border-white/10 flex flex-col justify-end">
                              <div className="w-full h-3 bg-orange-400" />
                              <div className="w-full h-3 bg-cyan-400" />
                            </div>
                            <div className="w-2.5 h-10 rounded-b-md border border-white/10 flex flex-col justify-end">
                              <div className="w-full h-3 bg-pink-400" />
                              <div className="w-full h-4 bg-emerald-400" />
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-sans text-xs font-black text-slate-100 tracking-wide">{themeItem.name}</h4>
                          <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                            {themeItem.cost === 0 ? "Default Backdrop" : `${themeItem.cost.toLocaleString()} COINS 🪙`}
                          </p>
                        </div>
                      </div>

                      {/* Right Control Trigger Button */}
                      <div>
                        {isEquipped ? (
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase text-indigo-400 tracking-wider">
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                            <span>Equipped</span>
                          </span>
                        ) : isUnlocked ? (
                          <button
                            onClick={() => handleEquipBg(themeItem)}
                            className="bg-neutral-800 hover:bg-neutral-700 text-white font-sans text-4xs font-black uppercase tracking-widest px-4 py-2.5 rounded-xl cursor-pointer select-none border-none transition-colors"
                          >
                            Equip
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBuyBg(themeItem)}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-sans text-4xs font-black uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center gap-1 cursor-pointer select-none border-none transition-colors"
                          >
                            <Lock className="h-3 w-3 text-slate-950" />
                            <span>Unlock</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* PREMIUM PLANS & COIN PACKS VIEW */
              <div className="space-y-4 pb-6">
                
                {/* 📺 PERSISTENT LOCKOUT FREE COIN CLAIM CARD */}
                <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-[#0a0f26] to-indigo-950/40 border border-indigo-500/30 flex flex-col gap-3 relative overflow-hidden shadow-[0_8px_25px_rgba(99,102,241,0.15)] select-none">
                  <div className="absolute top-0 right-0 py-0.5 px-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[7px] font-mono font-black uppercase tracking-widest rounded-bl animate-pulse">
                    COIN GENERATOR
                  </div>
                  
                  <div className="space-y-1 text-left">
                    <h4 className="text-xs font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                      <span>💎 Claim Free Cosmic Coins</span>
                    </h4>
                    <p className="text-[10px] text-slate-300 leading-normal font-medium">
                      Generate <strong className="text-amber-400">100 Cosmic Coins</strong> instantly! 
                      <br />
                      <span className="text-[9.5px] text-emerald-400/90 font-bold block mt-1">
                        ⚠️ Limit: Only 3 claims daily. Once used, it locks and unlocks after 3 Days!
                      </span>
                    </p>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center justify-between bg-black/45 px-3 py-2 rounded-xl border border-white/5 font-sans text-[10px]">
                    <span className="text-slate-400 font-bold uppercase tracking-wider">Claims Used:</span>
                    <span className="font-mono font-black text-white bg-slate-800 px-2 py-0.5 rounded-full">
                      {claimCount}/3
                    </span>
                  </div>

                  {lockoutUntil > Date.now() ? (
                    <div className="bg-[#1f0e14] border border-red-500/20 rounded-2xl p-3 text-center flex flex-col items-center gap-2">
                      <p className="text-[10px] text-red-300 font-sans font-semibold flex items-center gap-1.5 justify-center">
                        <span className="animate-spin text-xs">⏳</span>
                        <span>Locked for 3 Days! Reopens in:</span>
                      </p>
                      <strong className="font-mono text-white text-sm bg-black/40 px-3.5 py-1 rounded-full border border-red-500/30 shadow-inner">
                        {lockoutCountdown || "calculating..."}
                      </strong>
                      <button
                        type="button"
                        onClick={handleTestResetClaim}
                        className="text-[8px] bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 rounded-lg px-2.5 py-1 uppercase tracking-wider font-mono cursor-pointer transition-all active:scale-95 mt-1"
                        title="Reset limits for testing"
                      >
                        🛠| Instant Unlock (Test Bypass)
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleClaimCoins}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 py-2.5 rounded-xl text-3xs font-black uppercase tracking-widest cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all shadow-[0_4px_12px_rgba(16,185,129,0.3)] border-none"
                    >
                      💎 Claim Free Coins (+100 COINS)
                    </button>
                  )}
                </div>

                {/* 👑 VIP No-Ads & AI Packages as requested by user */}
                <div className="space-y-2 pt-1 select-none">
                  <h3 className="font-sans text-2xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Crown className="h-3.5 w-3.5 text-amber-400 animate-bounce" />
                    <span>Galaxy AI VIP Chat Subscriptions</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {/* Plan 1: 1 Year Unlimited Text Chat */}
                    <div className="bg-slate-950/40 hover:bg-slate-950/60 border border-slate-800 rounded-2xl p-3 flex justify-between items-center transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                          <Zap className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-sans text-xs font-black text-white">1 Year Unlimited Text Chat</h4>
                          <p className="text-[9px] font-mono text-slate-400">Play ad-free + unlimited friendly chatbot text queries</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (subscription === "1year" || subscription === "5years" || subscription === "lifetime") {
                            showNotification("You already have this or a higher active AI plan! 🪐");
                            return;
                          }
                          const costStr = "₹49";
                          setIsProcessing(true);
                          setProcessingMsg(`Connecting to secure billing gateway for ${costStr}...`);
                          setTimeout(() => {
                            setIsProcessing(false);
                            onBuySubscription("1year");
                            gameAudio.playVictory();
                            showNotification("Successfully purchased 1 Year Unlimited Text Plan! 🪐🎉");
                          }, 1500);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-3xs font-black uppercase tracking-wider select-none cursor-pointer border-none transition-colors shrink-0 ${
                          subscription === "1year"
                            ? "bg-slate-800 text-indigo-400"
                            : (subscription === "5years" || subscription === "lifetime")
                            ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                            : "bg-indigo-500 hover:bg-indigo-400 text-white"
                        }`}
                      >
                        {subscription === "1year" ? "Active" : (subscription === "5years" || subscription === "lifetime") ? "N/A" : "₹49"}
                      </button>
                    </div>

                    {/* Plan 2: 5 Years Unlimited Chat + Image */}
                    <div className="bg-slate-950/40 hover:bg-slate-950/60 border border-indigo-500/20 rounded-2xl p-3 flex justify-between items-center transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-indigo-300" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-sans text-xs font-black text-white">5 Years Unlimited Chat & Image</h4>
                          <p className="text-[9px] font-mono text-slate-400">5 Years ad-free + unlimited text chat + unlimited image send</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (subscription === "5years" || subscription === "lifetime") {
                            showNotification("You already have this or a higher active AI plan! 🪐");
                            return;
                          }
                          const costStr = "₹99";
                          setIsProcessing(true);
                          setProcessingMsg(`Connecting to secure billing gateway for ${costStr}...`);
                          setTimeout(() => {
                            setIsProcessing(false);
                            onBuySubscription("5years");
                            gameAudio.playVictory();
                            showNotification("Successfully purchased 5 Years Chat & Image Plan! 🚀🎉");
                          }, 1500);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-3xs font-black uppercase tracking-wider select-none cursor-pointer border-none transition-colors shrink-0 ${
                          subscription === "5years"
                            ? "bg-slate-800 text-indigo-300"
                            : subscription === "lifetime"
                            ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                            : "bg-indigo-600 hover:bg-indigo-500 text-white animate-pulse"
                        }`}
                      >
                        {subscription === "5years" ? "Active" : subscription === "lifetime" ? "N/A" : "₹99"}
                      </button>
                    </div>

                    {/* Plan 3: Lifetime All Free AI Chatbot & Image Analysis/Generator */}
                    <div className="bg-slate-950/40 hover:bg-slate-950/60 border border-amber-500/20 rounded-2xl p-3 flex justify-between items-center transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400/20 flex items-center justify-center relative">
                          <Crown className="h-5 w-5 text-yellow-300 animate-spin" style={{ animationDuration: '10s' }} />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-1">
                            <h4 className="font-sans text-xs font-black text-yellow-300">Lifetime All-Access AI</h4>
                            <span className="text-[7px] font-bold px-1 bg-amber-500 text-slate-950 rounded uppercase font-mono tracking-tighter">BEST</span>
                          </div>
                          <p className="text-[9px] font-mono text-slate-400">All features free + unlimited image generator & analysis forever</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (subscription === "lifetime") {
                            showNotification("You already have Lifetime All-Access AI active! 🪐");
                            return;
                          }
                          const costStr = "₹149";
                          setIsProcessing(true);
                          setProcessingMsg(`Connecting to secure billing gateway for ${costStr}...`);
                          setTimeout(() => {
                            setIsProcessing(false);
                            onBuySubscription("lifetime");
                            gameAudio.playVictory();
                            showNotification("Successfully purchased Lifetime All-Access AI Plan! 🪐👑🎉");
                          }, 1500);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-3xs font-black uppercase tracking-wider select-none cursor-pointer border-none transition-all shrink-0 ${
                          subscription === "lifetime"
                            ? "bg-slate-800 text-yellow-450 border border-yellow-500/30"
                            : "bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950"
                        }`}
                      >
                        {subscription === "lifetime" ? "Owned 🪐" : "₹149"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section title: Coin Packages */}
                <div className="space-y-2 pt-1 select-none">
                  <h3 className="font-sans text-2xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5 animate-bounce" />
                    <span>Coin Packages (Buy Coins)</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {/* Pack 1: 1000 Coins */}
                    <div className="bg-slate-950/40 hover:bg-slate-950/60 border border-slate-800 rounded-2xl p-3 flex justify-between items-center transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                          <Coins className="h-5 w-5 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
                        </div>
                        <div>
                          <h4 className="font-sans text-xs font-black text-white">1,000 Cosmic Coins</h4>
                          <p className="text-[9px] font-mono text-slate-400">Perfect starter pack for extra tubes</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const costStr = "₹19 ($0.25)";
                          setIsProcessing(true);
                          setProcessingMsg(`Tuning to secure payment gateway for ${costStr}...`);
                          setTimeout(() => {
                            setIsProcessing(false);
                            onAddCoins(1000);
                            gameAudio.playVictory();
                            showNotification("Successfully purchased 1,000 Cosmic Coins! 🪙🎉");
                          }, 1500);
                        }}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 rounded-xl text-3xs font-black uppercase tracking-wider select-none cursor-pointer border-none transition-colors"
                      >
                        ₹19 / $0.25
                      </button>
                    </div>

                    {/* Pack 2: 100000 Coins */}
                    <div className="bg-slate-950/40 hover:bg-slate-950/60 border border-amber-500/20 rounded-2xl p-3 flex justify-between items-center transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400/20 flex items-center justify-center relative">
                          <Coins className="h-5 w-5 text-yellow-300 animate-bounce" />
                          <span className="absolute -top-1 -right-1 text-[8px]">🔥</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <h4 className="font-sans text-xs font-black text-yellow-300">100,000 Giga Balance</h4>
                            <span className="text-[7px] font-bold px-1 bg-rose-500 text-white rounded uppercase font-mono tracking-tighter">HOT</span>
                          </div>
                          <p className="text-[9px] font-mono text-slate-400">Instant unlock for all backdrops & skins</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const costStr = "₹69 ($0.85)";
                          setIsProcessing(true);
                          setProcessingMsg(`Tuning to secure payment gateway for ${costStr}...`);
                          setTimeout(() => {
                            setIsProcessing(false);
                            onAddCoins(100000);
                            gameAudio.playVictory();
                            showNotification("Successfully purchased 100,000 Cosmic Coins! 🪙🎉");
                          }, 1500);
                        }}
                        className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 border-none text-slate-950 px-3.5 py-2 rounded-xl text-3xs font-black uppercase tracking-wider select-none cursor-pointer transition-colors animate-pulse"
                      >
                        ₹69 / $0.85
                      </button>
                    </div>
                  </div>
                </div>

                {/* Free developer features benefit announcement */}
                <div className="p-3 bg-slate-900/30 border border-slate-800 rounded-xl flex items-center justify-center gap-1.5 text-center select-none font-sans text-[9px] text-slate-400 font-bold leading-normal">
                  <Gift className="h-3 w-3 text-emerald-400" />
                  <span>
                    Premium VIP benefits such as **unlimited free AI chats** and **zero ads** are unlocked instantly with purchase!
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Area with safe close trigger */}
          <div className="p-4 border-t border-white/5 bg-[#07090f] flex gap-3 shrink-0">
            <button
              onClick={() => {
                gameAudio.playPop();
                onClose();
              }}
              className="w-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-slate-400 hover:text-white rounded-2xl py-3.5 font-sans text-3xs font-black uppercase tracking-widest transition-all cursor-pointer"
            >
              Back to Main Board
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
