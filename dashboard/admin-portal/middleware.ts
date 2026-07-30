import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/login(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  if (isPublicRoute(req)) return;

  if (!userId) {
    const isLocal =
      req.nextUrl.hostname === "localhost" || req.nextUrl.hostname === "127.0.0.1";

    const authBase = isLocal
      ? "http://localhost:3003"
      : (process.env.NEXT_PUBLIC_AUTH_PORTAL_URL || "https://place-prep-sourabh-mocha.vercel.app");

    if (authBase) {
      const loginUrl = `${authBase.replace(/\/$/, "")}/login?redirect_url=${encodeURIComponent(req.url)}`;
      return NextResponse.redirect(new URL(loginUrl));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
