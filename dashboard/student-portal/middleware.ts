import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/register(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  if (userId) {
    const publicMeta = (sessionClaims as any)?.publicMetadata || (sessionClaims as any)?.public_metadata;
    const unsafeMeta = (sessionClaims as any)?.unsafeMetadata || (sessionClaims as any)?.unsafe_metadata;
    const role = (publicMeta?.role || unsafeMeta?.role) as string | undefined;

    if (role) {
      const cleanRole = role.toLowerCase();
      if (cleanRole === "faculty") {
        return NextResponse.redirect(new URL("http://localhost:3001/"));
      }
      if (cleanRole === "admin") {
        return NextResponse.redirect(new URL("http://localhost:3002/overview"));
      }
    }
  }

  if (isPublicRoute(req)) {
    return;
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
