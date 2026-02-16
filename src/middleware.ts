import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  // Pad shorter buffer to match length (constant-time regardless of length mismatch)
  const maxLen = Math.max(bufA.length, bufB.length);
  const paddedA = new Uint8Array(maxLen);
  const paddedB = new Uint8Array(maxLen);
  paddedA.set(bufA);
  paddedB.set(bufB);
  let result = bufA.length ^ bufB.length; // non-zero if lengths differ
  for (let i = 0; i < maxLen; i++) {
    result |= paddedA[i] ^ paddedB[i];
  }
  return result === 0;
}

export function middleware(request: NextRequest) {
  // Only protect /admin routes
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Admin Area"' },
    });
  }

  try {
    const encoded = authHeader.slice(6);
    const decoded = atob(encoded);
    const [username, password] = decoded.split(":");

    const expectedUsername = process.env.ADMIN_USERNAME || "";
    const expectedPassword = process.env.ADMIN_PASSWORD || "";

    if (
      username &&
      password &&
      timingSafeEqual(username, expectedUsername) &&
      timingSafeEqual(password, expectedPassword)
    ) {
      return NextResponse.next();
    }
  } catch {
    // Fall through to 401
  }

  return new NextResponse("Invalid credentials", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin Area"' },
  });
}

export const config = {
  matcher: ["/admin/:path*"],
};
