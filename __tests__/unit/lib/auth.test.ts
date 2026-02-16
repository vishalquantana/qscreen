import { validateBasicAuth } from "@/lib/auth";

describe("validateBasicAuth", () => {
  beforeEach(() => {
    process.env.ADMIN_USERNAME = "admin";
    process.env.ADMIN_PASSWORD = "secret123";
  });

  it("should return true for valid credentials", () => {
    const encoded = Buffer.from("admin:secret123").toString("base64");
    const header = `Basic ${encoded}`;
    expect(validateBasicAuth(header)).toBe(true);
  });

  it("should return false for invalid credentials", () => {
    const encoded = Buffer.from("admin:wrong").toString("base64");
    const header = `Basic ${encoded}`;
    expect(validateBasicAuth(header)).toBe(false);
  });

  it("should return false for missing header", () => {
    expect(validateBasicAuth(null)).toBe(false);
    expect(validateBasicAuth(undefined)).toBe(false);
  });

  it("should return false for non-Basic auth", () => {
    expect(validateBasicAuth("Bearer token123")).toBe(false);
  });

  it("should return false for malformed Basic auth", () => {
    expect(validateBasicAuth("Basic !!!invalid")).toBe(false);
  });
});
