import { appRouter, createTRPCContext } from "@myapp/api";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

const handler = (req: Request) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: (opts) => createTRPCContext(req, opts),
  });
};

export { handler as GET, handler as POST };
