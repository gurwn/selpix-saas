"use client";

import { createContext, ReactNode } from "react";
import { useUser } from "@clerk/nextjs";

export type LoadedUser = NonNullable<ReturnType<typeof useUser>["user"]>;

interface LoadedAuthContextValue {
  user: LoadedUser;
}

export const LoadedAuthContext = createContext<LoadedAuthContextValue | null>(
  null
);

interface LoadedAuthProviderProps {
  children: ReactNode;
  user: LoadedUser;
}

export function LoadedAuthProvider({
  children,
  user,
}: LoadedAuthProviderProps) {
  return (
    <LoadedAuthContext.Provider value={{ user }}>
      {children}
    </LoadedAuthContext.Provider>
  );
}
