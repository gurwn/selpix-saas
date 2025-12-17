"use client";

import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import type { AppRouter } from "@myapp/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { makeQueryClient } from "./query-client";
import { useClerk } from "@clerk/nextjs";

export const trpc = createTRPCReact<AppRouter>();
let clientQueryClientSingleton: QueryClient;
function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: use singleton pattern to keep the same query client
  return (clientQueryClientSingleton ??= makeQueryClient());
}

function getBaseUrl() {
  if (typeof window !== "undefined") {
    // browser should use relative path to the API endpoint
    return "/api/trpc";
  }

  if (process.env.VERCEL_URL) {
    // reference for vercel.com
    return `https://${process.env.VERCEL_URL}/api/trpc`;
  }
  // assume localhost
  return `http://localhost:${process.env.PORT ?? 3001}/api/trpc`;
}

function createClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        transformer: superjson,
        url: getBaseUrl(),
      }),
    ],
  });
}

export function TRPCProvider(
  props: Readonly<{
    children: React.ReactNode;
  }>
) {
  const { signOut } = useClerk();

  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() => createClient());

  // 글로벌 에러 핸들링 설정
  queryClient.setDefaultOptions({
    queries: {
      retry: (failureCount, error) => {
        // UNAUTHORIZED 에러는 재시도하지 않음
        if (
          error instanceof TRPCClientError &&
          error.data?.code === "UNAUTHORIZED"
        ) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      onError: (error) => {
        handleGlobalError(error, signOut);
      },
      retry: (failureCount, error) => {
        // UNAUTHORIZED 에러는 재시도하지 않음
        if (
          error instanceof TRPCClientError &&
          error.data?.code === "UNAUTHORIZED"
        ) {
          return false;
        }
        return failureCount < 3;
      },
    },
  });

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}

// 글로벌 에러 핸들러 함수
function handleGlobalError(error: unknown, signOut: () => Promise<void>) {
  // TRPC 클라이언트 에러인지 확인
  if (error instanceof TRPCClientError) {
    const errorCode = error.data?.code;

    if (errorCode === "UNAUTHORIZED") {
      alert("세션이 만료되었습니다. 다시 로그인해주세요.");

      console.log("Unauthorized error detected, signing out...");

      // 클라이언트에서 즉시 로그아웃 처리
      signOut()
        .then(() => {
          // 필요한 경우 추가 정리 작업
          localStorage.clear();
          sessionStorage.clear();

          // 로그인 페이지로 리디렉션
          window.location.href = "/sign-in";
        })
        .catch((signOutError) => {
          console.error("Sign out error:", signOutError);
          // 강제 리디렉션
          window.location.href = "/sign-in";
        });
    }
  }
}

export const api = createClient();
