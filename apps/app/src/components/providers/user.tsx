"use client";

import { trpc } from "@/utils/trpc/client";
import { createContext, useContext } from "react";
import type { User } from "@myapp/prisma";

const UserContext = createContext<
  | {
    user: User;
  }
  | undefined
>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user] = trpc.user.getMe.useSuspenseQuery(undefined, {
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <UserContext.Provider value={{ user }}>{children}</UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}
