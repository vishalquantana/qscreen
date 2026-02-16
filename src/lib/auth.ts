import crypto from "crypto";

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Compare against self to keep constant time, then return false
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export function validateBasicAuth(
  authHeader: string | null | undefined
): boolean {
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return false;
  }

  try {
    const encoded = authHeader.slice(6);
    const decoded = Buffer.from(encoded, "base64").toString("utf-8");
    const [username, password] = decoded.split(":");

    if (!username || !password) return false;

    const expectedUsername = process.env.ADMIN_USERNAME || "";
    const expectedPassword = process.env.ADMIN_PASSWORD || "";

    return (
      timingSafeEqual(username, expectedUsername) &&
      timingSafeEqual(password, expectedPassword)
    );
  } catch {
    return false;
  }
}
