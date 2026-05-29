"use client";

import { usePathname } from "next/navigation";

export default function HeaderTitle() {
  const pathname = usePathname();
  
  let title = "Overview";
  
  if (pathname === "/") {
    title = "Overview";
  } else if (pathname.startsWith("/dialer")) {
    title = "Outbound Dialer";
  } else if (pathname.startsWith("/logs")) {
    title = "Call Logs";
  } else if (pathname.startsWith("/leads")) {
    title = "Leads / CRM";
  } else if (pathname.startsWith("/workflows")) {
    title = "Workflows";
  } else if (pathname.startsWith("/integrations")) {
    title = "Integrations";
  } else if (pathname.startsWith("/wallet")) {
    title = "Wallet";
  } else if (pathname.startsWith("/config/inbound")) {
    title = "Inbound Agent Config";
  } else if (pathname.startsWith("/config/outbound")) {
    title = "Outbound Agent Config";
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      <h1 className="text-sm font-semibold tracking-tight text-gray-700 dark:text-gray-300">
        {title}
      </h1>
    </div>
  );
}
