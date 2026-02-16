import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
    const decoded = Buffer.from(encoded, "base64").toString("utf-8");
    const [username, password] = decoded.split(":");

    const expectedUsername = process.env.ADMIN_USERNAME;
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (username === expectedUsername && password === expectedPassword) {
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
