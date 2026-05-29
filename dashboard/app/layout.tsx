import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import Sidebar from "@/components/Sidebar";
import { AppProvider } from "@/components/app-provider";
import { CopilotProvider } from "@/components/copilot/CopilotContext";
import CopilotWidget from "@/components/copilot/CopilotWidget";
import ProfileMenu from "@/components/ProfileMenu";
import HeaderTitle from "@/components/HeaderTitle";
import MouseEffect from "@/components/MouseEffect";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RapidX Dashboard",
  description: "AI Voice Agent and Workflow Builder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans light-premium-bg dark:premium-bg text-gray-900 dark:text-[#e6edf3] h-screen flex overflow-hidden antialiased transition-colors duration-300`}
      >
        <CopilotProvider>
          <AppProvider>
            {/* Ambient background orbs removed for cleaner UI */}
            <MouseEffect />
            <Sidebar />

            <div className="flex-1 flex flex-col h-full overflow-y-auto bg-white/40 dark:bg-transparent transition-colors duration-300 relative z-[1]">
              {/* Premium glassmorphic header */}
              <header className="h-16 glass-header flex items-center px-6 sticky top-0 z-10">
                <HeaderTitle />
                <ProfileMenu />
              </header>

              <main className="p-8 flex-1 page-enter">{children}</main>
            </div>
            <CopilotWidget />
          </AppProvider>
        </CopilotProvider>
      </body>
    </html>
  );
}
