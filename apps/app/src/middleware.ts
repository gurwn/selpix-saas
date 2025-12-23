import { clerkMiddleware } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default clerkMiddleware(async (auth, req) => {
  // API 경로는 별도 인증 방식 사용 (Clerk 인증 건너뛰기)
  if (
    req.nextUrl.pathname.startsWith("/api") ||
    req.nextUrl.pathname.startsWith("/monitoring")
  ) {
    if (req.nextUrl.pathname.startsWith("/api/trpc")) {
      await auth.protect();
    }

    return NextResponse.next();
  }

  const publicPaths = ["/sign-in", "/sign-up", "/", "/ko", "/en"];
  const isPublic = publicPaths.some(path =>
    req.nextUrl.pathname === path ||
    (path !== "/" && req.nextUrl.pathname.startsWith(path) && req.nextUrl.pathname.split("/").length <= 3)
  );

  if (!isPublic) {
    await auth.protect();
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
