import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/register(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  const isLocalhost = req.nextUrl.hostname === "localhost" || req.nextUrl.hostname === "127.0.0.1";

  if (userId) {
    const publicMeta = (sessionClaims as any)?.publicMetadata || (sessionClaims as any)?.public_metadata;
    const unsafeMeta = (sessionClaims as any)?.unsafeMetadata || (sessionClaims as any)?.unsafe_metadata;
    const role = (publicMeta?.role || unsafeMeta?.role) as string | undefined;

    if (role) {
      const cleanRole = role.toLowerCase();
      const facultyUrl = process.env.NEXT_PUBLIC_FACULTY_PORTAL_URL || (isLocalhost ? "http://localhost:3001/" : undefined);
      const adminUrl = process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL || (isLocalhost ? "http://localhost:3002/overview" : undefined);

      if (cleanRole === "faculty" && facultyUrl) {
        return NextResponse.redirect(new URL(facultyUrl));
      }
      if (cleanRole === "admin" && adminUrl) {
        return NextResponse.redirect(new URL(adminUrl));
      }
    }
  }

  if (isPublicRoute(req)) {
    return;
  }

  if (!userId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
