import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rate limiting store (in-memory; use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false; // not rate limited
  }
  entry.count++;
  if (entry.count > limit) return true; // rate limited
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rate limit login endpoint: 10 req / 60s per IP
  if (pathname === "/api/auth/login" && req.method === "POST") {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (rateLimit(`login:${ip}`, 10, 60_000)) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Coba lagi nanti." },
        { status: 429 }
      );
    }
  }

  // Rate limit ritasi endpoint: 60 req / 60s per user token
  if (pathname.startsWith("/api/ritasi") && req.method === "POST") {
    const token = req.cookies.get("session_token")?.value ?? "anon";
    if (rateLimit(`ritasi:${token}`, 60, 60_000)) {
      return NextResponse.json(
        { error: "Rate limit tercapai. Tunggu sebentar." },
        { status: 429 }
      );
    }
  }

  // Protect /pengawas/* and /admin/* routes — cookie presence check only.
  // Full session validation (expiry + role) is handled in each layout/page
  // server component, which runs in the Node.js runtime where Prisma works.
  if (pathname.startsWith("/pengawas") || pathname.startsWith("/admin")) {
    const token = req.cookies.get("session_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/pengawas/:path*",
    "/admin/:path*",
    "/api/auth/login",
    "/api/ritasi/:path*",
  ],
};
