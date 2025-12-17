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
  const [user] = trpc.userRouter.getMe.useSuspenseQuery(undefined, {
    retry: 0,
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
