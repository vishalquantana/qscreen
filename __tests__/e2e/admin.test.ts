import puppeteer, { Browser, Page } from "puppeteer";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

describe("Admin Dashboard", () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page.close();
  });

  it("should require authentication for admin page", async () => {
    const response = await page.goto(`${BASE_URL}/admin`, {
      waitUntil: "networkidle2",
    });

    // Should get 401 without auth
    expect(response?.status()).toBe(401);
  });

  it("should allow access with valid credentials", async () => {
    // Set basic auth header
    const credentials = Buffer.from(
      `${ADMIN_USERNAME}:${ADMIN_PASSWORD}`
    ).toString("base64");

    await page.setExtraHTTPHeaders({
      Authorization: `Basic ${credentials}`,
    });

    const response = await page.goto(`${BASE_URL}/admin`, {
      waitUntil: "networkidle2",
    });

    expect(response?.status()).toBe(200);

    // Should show the admin header
    const header = await page.$eval("h1", (el) => el.textContent);
    expect(header).toBe("QScreen Admin");

    // Should show candidates heading
    const heading = await page.$eval("h2", (el) => el.textContent);
    expect(heading).toBe("Candidates");
  });

  it("should reject invalid credentials", async () => {
    const credentials = Buffer.from("admin:wrongpassword").toString("base64");

    await page.setExtraHTTPHeaders({
      Authorization: `Basic ${credentials}`,
    });

    const response = await page.goto(`${BASE_URL}/admin`, {
      waitUntil: "networkidle2",
    });

    expect(response?.status()).toBe(401);
  });
});
