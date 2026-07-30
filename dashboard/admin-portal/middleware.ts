import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/login(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  if (isPublicRoute(req)) {
    return;
  }

  const isLocalhost = req.nextUrl.hostname === "localhost" || req.nextUrl.hostname === "127.0.0.1";
  const studentUrl = process.env.NEXT_PUBLIC_STUDENT_PORTAL_URL || (isLocalhost ? "http://localhost:3000" : undefined);

  if (!userId) {
    const loginBase = studentUrl ? `${studentUrl.replace(/\/$/, "")}/login` : "/login";
    const loginTarget = `${loginBase}?redirect_url=${encodeURIComponent(req.url)}`;
    return NextResponse.redirect(new URL(loginTarget, req.url));
  }

  const publicMeta = (sessionClaims as any)?.publicMetadata || (sessionClaims as any)?.public_metadata;
  const unsafeMeta = (sessionClaims as any)?.unsafeMetadata || (sessionClaims as any)?.unsafe_metadata;
  const role = (publicMeta?.role || unsafeMeta?.role) as string | undefined;

  if (role) {
    const cleanRole = role.toLowerCase();
    const facultyUrl = process.env.NEXT_PUBLIC_FACULTY_PORTAL_URL || (isLocalhost ? "http://localhost:3001/" : undefined);

    if (cleanRole === "student" && studentUrl) {
      return NextResponse.redirect(new URL(`${studentUrl.replace(/\/$/, "")}/dashboard`));
    }
    if (cleanRole === "faculty" && facultyUrl) {
      return NextResponse.redirect(new URL(facultyUrl));
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
