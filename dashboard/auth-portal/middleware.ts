import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// All routes in auth-portal are public — it has no protected pages
const isPublicRoute = createRouteMatcher([
  "/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // auth-portal is entirely public — Clerk just needs to be initialized
  // so it can read session state in pages
  if (isPublicRoute(req)) return;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
