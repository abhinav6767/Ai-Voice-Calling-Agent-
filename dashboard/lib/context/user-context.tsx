"use client";

import React, { createContext, useContext } from "react";

export type UserRole = "super_admin" | "admin" | "manager" | "read_only";

export interface UserProfile {
  id: string;
  authUserId: string;
  email: string;
  fullName: string;
  role: UserRole;
  businessId: string | null;
  businessName: string | null;
}

interface UserContextValue {
  profile: UserProfile | null;
  // Convenience helpers
  can: {
    addLeads: boolean;
    editLeads: boolean;
    deleteLeads: boolean;
    accessConfig: boolean;
    accessWallet: boolean;
    accessIntegrations: boolean;
    accessDialer: boolean;
    accessWorkflows: boolean;
    manageUsers: boolean;
    switchTenant: boolean; // Super Admin only
  };
}

const ROLE_RANK: Record<UserRole, number> = {
  read_only: 1,
  manager: 2,
  admin: 3,
  super_admin: 4,
};

function hasRole(role: UserRole | undefined, minRole: UserRole): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[minRole];
}

function buildPermissions(role: UserRole | undefined): UserContextValue["can"] {
  return {
    addLeads:           hasRole(role, "manager"),
    editLeads:          hasRole(role, "manager"),
    deleteLeads:        hasRole(role, "admin"),
    accessConfig:       hasRole(role, "admin"),
    accessWallet:       hasRole(role, "admin"),
    accessIntegrations: hasRole(role, "admin"),
    accessDialer:       hasRole(role, "manager"),
    accessWorkflows:    hasRole(role, "manager"),
    manageUsers:        hasRole(role, "admin"),
    switchTenant:       role === "super_admin",
  };
}

const UserContext = createContext<UserContextValue>({
  profile: null,
  can: buildPermissions(undefined),
});

export function UserProvider({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: UserProfile | null;
}) {
  const can = buildPermissions(profile?.role);
  return (
    <UserContext.Provider value={{ profile, can }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  return useContext(UserContext);
}
