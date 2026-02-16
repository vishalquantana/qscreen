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

    const expectedUsername = process.env.ADMIN_USERNAME;
    const expectedPassword = process.env.ADMIN_PASSWORD;

    return username === expectedUsername && password === expectedPassword;
  } catch {
    return false;
  }
}
