import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import { AppProvider } from "@/components/app-provider";
import { CopilotProvider } from "@/components/copilot/CopilotContext";
import CopilotWidget from "@/components/copilot/CopilotWidget";
import TopHeader from "@/components/TopHeader";
import MainWrapper from "@/components/MainWrapper";
import { UserProvider, type UserProfile } from "@/lib/context/user-context";

// Dashboard shell layout — only renders for authenticated users.
// Any unauthenticated request is caught by middleware first, but this
// is a second server-side guard for defense-in-depth.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile so every dashboard page knows the user's role & tenant
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("id, auth_user_id, email, full_name, role, business_id")
    .eq("auth_user_id", user.id)
    .single();

  // Optionally resolve the business name
  let businessName: string | null = null;
  if (profileRow?.business_id) {
    const { data: biz } = await supabase
      .from("businesses")
      .select("name")
      .eq("id", profileRow.business_id)
      .single();
    businessName = biz?.name ?? null;
  }

  const profile: UserProfile | null = profileRow
    ? {
        id:           profileRow.id,
        authUserId:   profileRow.auth_user_id,
        email:        profileRow.email,
        fullName:     profileRow.full_name ?? "",
        role:         profileRow.role,
        businessId:   profileRow.business_id ?? null,
        businessName,
      }
    : null;

  return (
    <div className="h-screen w-screen overflow-hidden bg-white dark:bg-[#111111] flex">
      <UserProvider profile={profile}>
        <CopilotProvider>
          <AppProvider>
            <Sidebar />

            <div className="flex-1 flex flex-col h-full overflow-y-auto relative z-[1] bg-white/40 dark:bg-transparent">
              <TopHeader />
              <MainWrapper>{children}</MainWrapper>
            </div>

            <CopilotWidget />
          </AppProvider>
        </CopilotProvider>
      </UserProvider>
    </div>
  );
}
