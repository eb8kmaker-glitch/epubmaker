import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

// Static files that must be served as-is without locale redirect
const BYPASS_PATHS = ["/ads.txt", "/robots.txt", "/sitemap.xml"];

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Block direct (non-referer) calls to API routes to deter bots/scrapers.
  if (pathname.startsWith("/api/")) {
    const referer = request.headers.get("referer") || "";
    const isLocal =
      referer.includes("localhost") || referer.includes("127.0.0.1");
    const isOwn = referer.includes("epubmaker.org");

    if (!isLocal && !isOwn) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.next();
  }

  if (BYPASS_PATHS.includes(pathname)) {
    return NextResponse.next();
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)", "/api/:path*"],
};
