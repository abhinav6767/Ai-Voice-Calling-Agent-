"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PhoneOutgoing,
  Activity,
  Users,
  Settings,
  Database,
  Moon,
  Sun,
  DollarSign,
  Wallet,
  Bot,
  GitBranch,
  Key,
  PhoneIncoming,
  Sparkles,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAppContext } from "./app-provider";
import { motion, AnimatePresence } from "framer-motion";

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { currency, setCurrency } = useAppContext();
  const [mounted, setMounted] = React.useState(false);
  const [logoHover, setLogoHover] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const routes = [
    { name: "Overview", path: "/", icon: LayoutDashboard },
    { name: "Outbound Dialer", path: "/dialer", icon: PhoneOutgoing },
    { name: "Call Logs", path: "/logs", icon: Activity },
    { name: "Leads / CRM", path: "/leads", icon: Users },
    { name: "Workflows", path: "/workflows", icon: GitBranch },
    { name: "Integrations", path: "/integrations", icon: Key },
    { name: "Wallet", path: "/wallet", icon: Wallet },
  ];

  const configRoutes = [
    { name: "Inbound Agent", path: "/config/inbound", icon: PhoneIncoming },
    { name: "Outbound Agent", path: "/config/outbound", icon: Bot },
  ];

  const currentTheme = mounted ? resolvedTheme : "light";

  const navItemVariants = {
    initial: { opacity: 0, x: -12 },
    animate: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.04,
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      },
    }),
  };

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="w-64 h-full glass-sidebar flex flex-col hidden md:flex relative overflow-hidden"
    >
      {/* Ambient glow behind logo */}
      <div className="absolute top-0 left-0 w-40 h-40 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <motion.div 
        className="p-6 flex items-center gap-3 relative z-10 cursor-pointer"
        onHoverStart={() => setLogoHover(true)}
        onHoverEnd={() => setLogoHover(false)}
      >
        <motion.div
          whileHover={{ scale: 1.08, rotate: 2 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0"
        >
          <Sparkles className="w-4 h-4 text-white" />
        </motion.div>
        
        <div 
          className="relative h-7 overflow-visible flex-1 flex items-center" 
          style={{ perspective: "1000px" }}
        >
          <motion.div
            className="relative w-full h-full"
            style={{ transformStyle: "preserve-3d" }}
            animate={{ rotateX: logoHover ? -90 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {/* Front Face: RapidX */}
            <div 
              className="absolute inset-0 flex items-center"
              style={{ transform: "translateZ(14px)" }}
            >
              <span className="text-xl font-bold tracking-tight gradient-text">
                RapidX
              </span>
            </div>
            
            {/* Bottom Face: AI-Calling-Agent */}
            <div 
              className="absolute inset-0 flex items-center"
              style={{ transform: "rotateX(90deg) translateZ(14px)" }}
            >
              <span className="text-sm font-bold tracking-widest text-indigo-400 uppercase whitespace-nowrap">
                AI-Calling-Agent
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Navigation */}
      <div className="flex-1 px-3 space-y-0.5 mt-2 overflow-y-auto scrollbar-hide">
        <div className="px-3 mb-3 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em]">
          Menu
        </div>
        {routes.map((route, i) => {
          const isActive =
            route.path === "/" ? pathname === "/" : pathname.startsWith(route.path);
          const Icon = route.icon;
          return (
            <motion.div
              key={route.path}
              custom={i}
              variants={navItemVariants}
              initial="initial"
              animate="animate"
            >
              <Link
                href={route.path}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-[13px] font-medium ${
                  isActive
                    ? "bg-indigo-500/10 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                {/* Active indicator bar */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-r-full"
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      exit={{ opacity: 0, scaleY: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    />
                  )}
                </AnimatePresence>

                <Icon
                  className={`w-[18px] h-[18px] transition-colors duration-200 ${
                    isActive
                      ? "text-indigo-500 dark:text-indigo-400"
                      : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                  }`}
                />
                <span>{route.name}</span>

                {/* Hover highlight */}
                {!isActive && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/0 to-indigo-500/0 group-hover:from-indigo-500/[0.03] group-hover:to-transparent transition-all duration-300 pointer-events-none" />
                )}
              </Link>
            </motion.div>
          );
        })}

        <div className="px-3 mb-3 mt-6 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em]">
          Configuration
        </div>
        {configRoutes.map((route, i) => {
          const isActive = pathname.startsWith(route.path);
          const Icon = route.icon;
          return (
            <motion.div
              key={route.path}
              custom={i + routes.length}
              variants={navItemVariants}
              initial="initial"
              animate="animate"
            >
              <Link
                href={route.path}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-[13px] font-medium ${
                  isActive
                    ? "bg-indigo-500/10 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="activeNavConfig"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-r-full"
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      exit={{ opacity: 0, scaleY: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    />
                  )}
                </AnimatePresence>
                <Icon
                  className={`w-[18px] h-[18px] transition-colors duration-200 ${
                    isActive
                      ? "text-indigo-500 dark:text-indigo-400"
                      : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                  }`}
                />
                <span>{route.name}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom controls */}
      <div className="p-4 border-t border-gray-200/50 dark:border-white/5 space-y-1">
        {/* Currency selector */}
        <div className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-100/80 dark:hover:bg-white/5 transition-all duration-200">
          <DollarSign className="w-[18px] h-[18px] text-gray-400 dark:text-gray-500" />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as any)}
            className="bg-transparent outline-none flex-1 cursor-pointer text-gray-500 dark:text-gray-400 text-[13px]"
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>

        {/* Theme toggle */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200 transition-all duration-200 w-full text-[13px] font-medium"
        >
          <AnimatePresence mode="wait" initial={false}>
            {currentTheme === "dark" ? (
              <motion.div
                key="sun"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Sun className="w-[18px] h-[18px]" />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Moon className="w-[18px] h-[18px]" />
              </motion.div>
            )}
          </AnimatePresence>
          {currentTheme === "dark" ? "Light Mode" : "Dark Mode"}
        </motion.button>

        {/* Settings */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200 transition-all duration-200 w-full text-[13px] font-medium"
        >
          <Settings className="w-[18px] h-[18px]" />
          Settings
        </motion.button>
      </div>
    </motion.div>
  );
}
