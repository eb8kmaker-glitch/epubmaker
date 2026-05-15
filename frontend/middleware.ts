import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

// Static files that must be served as-is without locale redirect
const BYPASS_PATHS = ["/ads.txt", "/robots.txt", "/sitemap.xml"];

export default function middleware(request: NextRequest) {
  if (BYPASS_PATHS.includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
