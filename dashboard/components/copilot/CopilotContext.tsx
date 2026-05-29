"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface CopilotContextType {
  pageName: string;
  metadata: any;
  setCopilotContext: (pageName: string, metadata?: any) => void;
}

const CopilotContext = createContext<CopilotContextType | undefined>(undefined);

export function CopilotProvider({ children }: { children: ReactNode }) {
  const [pageName, setPageName] = useState("Dashboard");
  const [metadata, setMetadata] = useState<any>(null);

  const setCopilotContext = React.useCallback((name: string, data?: any) => {
    setPageName(name);
    if (data !== undefined) setMetadata(data);
  }, []);

  return (
    <CopilotContext.Provider value={{ pageName, metadata, setCopilotContext }}>
      {children}
    </CopilotContext.Provider>
  );
}

export function useCopilotContext() {
  const context = useContext(CopilotContext);
  if (context === undefined) {
    throw new Error("useCopilotContext must be used within a CopilotProvider");
  }
  return context;
}
