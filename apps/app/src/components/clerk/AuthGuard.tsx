"use client";

import { ReactNode } from "react";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { Loader } from "lucide-react";
import { LoadedAuthProvider } from "./LoadedAuthProvider";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return fallback ?? <Skeleton />;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  if (user) {
    return <LoadedAuthProvider user={user}>{children}</LoadedAuthProvider>;
  }

  return fallback ?? <Skeleton />;
}

function Skeleton() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Loader className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  );
}
