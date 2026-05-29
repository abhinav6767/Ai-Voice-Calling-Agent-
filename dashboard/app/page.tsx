import { getOverviewStats } from "@/lib/actions";
import { Phone, CheckCircle, Hash, TrendingUp, ChevronRight } from "lucide-react";
import Link from "next/link";
import GlobeWrapper from "@/components/GlobeWrapper";
import DashboardCharts from "@/components/DashboardCharts";
import TiltCard from "@/components/TiltCard";

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export default async function Overview() {
  const stats = await getOverviewStats();

  const statCards = [
    {
      label: "Calls Made",
      value: stats.totalCalls,
      change: "+100.0%",
      iconBg: "bg-amber-50 dark:bg-amber-500/10",
      iconColor: "text-amber-500",
      icon: Phone,
      stagger: "stagger-1",
    },
    {
      label: "Total Spend",
      value: formatCurrency(stats.totalCost),
      change: "+100.0%",
      iconBg: "bg-blue-50 dark:bg-blue-500/10",
      iconColor: "text-blue-500",
      icon: null,
      iconText: "₹",
      stagger: "stagger-2",
    },
    {
      label: "Call Pickup Rate",
      value: `${stats.pickupRate}%`,
      change: "+100.0%",
      iconBg: "border border-emerald-200 dark:border-emerald-800",
      iconColor: "text-emerald-500",
      icon: CheckCircle,
      iconRound: true,
      stagger: "stagger-3",
    },
    {
      label: "SIP Trunk Calls",
      value: stats.sipTrunkCalls,
      change: "+100.0%",
      iconBg: "bg-blue-50 dark:bg-blue-500/10",
      iconColor: "text-blue-500",
      icon: Phone,
      link: "/logs",
      stagger: "stagger-4",
    },
    {
      label: "Voice API Calls",
      value: stats.voiceApiCalls,
      change: null,
      iconBg: "bg-orange-50 dark:bg-orange-500/10",
      iconColor: "text-orange-500",
      icon: Phone,
      link: "/logs",
      stagger: "stagger-5",
    },
    {
      label: "Active Numbers",
      value: stats.activeNumbers,
      change: null,
      iconBg: "bg-violet-50 dark:bg-violet-500/10",
      iconColor: "text-violet-500",
      icon: Hash,
      stagger: "stagger-6",
    },
  ];

  return (
    <div className="space-y-6 min-h-screen pb-10">
      {/* ROW 1: 6 Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <TiltCard
              key={card.label}
              className={`glass-card p-4 flex flex-col justify-between relative group fade-in-up ${card.stagger}`}
              style={{ animation: `fade-in-up 0.5s cubic-bezier(0.4,0,0.2,1) both` }}
            >
              <div className="flex justify-between items-start" style={{ transform: "translateZ(30px)" }}>
                <div>
                  <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {card.label}
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1.5 tracking-tight">
                    {card.value}
                  </h3>
                </div>
                <div
                  className={`p-2 ${card.iconBg} ${card.iconColor} ${
                    card.iconRound ? "rounded-full" : "rounded-xl"
                  } icon-glow transition-transform duration-300`}
                >
                  {Icon ? (
                    <Icon className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-bold leading-none px-0.5">
                      {card.iconText}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-end mt-3" style={{ transform: "translateZ(30px)" }}>
                {card.change ? (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {card.change}
                    <span className="text-gray-400 dark:text-gray-500 ml-1 font-normal">
                      vs previous period
                    </span>
                  </p>
                ) : (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium flex items-center">
                    -- No change
                    <span className="text-gray-400 dark:text-gray-500 ml-1 font-normal">
                      vs previous period
                    </span>
                  </p>
                )}
              </div>

              {card.link && (
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ transform: "translateZ(40px)" }}>
                  <Link
                    href={card.link}
                    className="text-[10px] text-indigo-500 dark:text-indigo-400 hover:underline flex items-center font-medium"
                  >
                    View logs <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </TiltCard>
          );
        })}
      </div>

      {/* ROW 2 & 3: Charts */}
      <div className="glass-card p-0 overflow-hidden" style={{ animation: `fade-in-up 0.5s 0.3s cubic-bezier(0.4,0,0.2,1) both` }}>
        <DashboardCharts stats={stats} />
      </div>

      {/* Section title */}
      <div style={{ animation: `fade-in-up 0.5s 0.4s cubic-bezier(0.4,0,0.2,1) both` }}>
        <h2 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] mt-8 mb-3">
          Account & Infrastructure
        </h2>
      </div>

      {/* ROW 4: Globe */}
      <div className="glass-card p-5" style={{ animation: `fade-in-up 0.5s 0.45s cubic-bezier(0.4,0,0.2,1) both` }}>
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4">
          Global Call Distribution
        </h3>
        <div className="w-full h-[400px] flex items-center justify-center">
          <GlobeWrapper />
        </div>
      </div>
    </div>
  );
}
