"use client";

import React, { useState, useEffect, useRef } from "react";
import { LogOut, Settings, User, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/lib/context/user-context";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/components/app-provider";

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  super_admin: { label: "Super Admin", color: "text-red-400 border-red-400/30 bg-red-500/10" },
  admin: { label: "Admin", color: "text-orange-400 border-orange-400/30 bg-orange-500/10" },
  manager: { label: "Manager", color: "text-blue-400 border-blue-400/30 bg-blue-500/10" },
  read_only: { label: "View Only", color: "text-gray-400 border-gray-400/30 bg-gray-500/10" },
};

export default function ProfileMenu({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useUser();
  const { isSidebarCollapsed } = useAppContext();
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (!profile) return null;

  const initials = profile.fullName
    ? profile.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const roleMeta = profile.role ? ROLE_LABELS[profile.role] : null;

  return (
    <div className={className || "relative ml-auto"} ref={menuRef}>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 p-1 ${!isSidebarCollapsed ? "pr-3" : ""} rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/30 border border-gray-200/60 dark:border-white/8 bg-white/50 dark:bg-white/5 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-200`}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-[11px] shrink-0 ring-2 ring-white/50 dark:ring-white/10 shadow-md">
          {initials}
        </div>
        {!isSidebarCollapsed && (
          <>
            <div className="flex flex-col items-start min-w-0 max-w-[100px] hidden sm:flex">
              <span className="text-[13px] font-medium text-gray-700 dark:text-gray-200 truncate w-full leading-tight">
                {profile.fullName}
              </span>
              {roleMeta && (
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border mt-0.5 leading-none truncate ${roleMeta.color}`}>
                  {roleMeta.label}
                </span>
              )}
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 hidden sm:block ml-1 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-0 mt-2 w-64 bg-white/95 dark:bg-[#161b22]/95 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/40 z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-inner">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-[#e6edf3] truncate">
                    {profile.fullName}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate mt-0.5">
                    {profile.email}
                  </p>
                </div>
              </div>
              
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-2 border border-gray-100 dark:border-white/5">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5 tracking-wider">Role</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate capitalize">
                    {profile.role?.replace('_', ' ')}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-2 border border-gray-100 dark:border-white/5">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5 tracking-wider">Workspace</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate">
                    {profile.businessName || "Default"}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-1.5">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors duration-150"
              >
                <Settings className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                Settings
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors duration-150"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
