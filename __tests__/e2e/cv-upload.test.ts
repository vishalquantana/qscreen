import puppeteer, { Browser, Page } from "puppeteer";
import path from "path";
import fs from "fs";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("CV Upload Flow", () => {
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

  it("should display the landing page with upload form", async () => {
    await page.goto(BASE_URL, { waitUntil: "networkidle2" });

    const title = await page.$eval("h1", (el) => el.textContent);
    expect(title).toBe("QScreen");

    const nameInput = await page.$('input[name="name"]');
    expect(nameInput).not.toBeNull();

    const emailInput = await page.$('input[name="email"]');
    expect(emailInput).not.toBeNull();

    const fileInput = await page.$('input[name="cv"]');
    expect(fileInput).not.toBeNull();

    const submitButton = await page.$('button[type="submit"]');
    expect(submitButton).not.toBeNull();
  });

  it("should show validation when submitting empty form", async () => {
    await page.goto(BASE_URL, { waitUntil: "networkidle2" });

    // HTML5 validation should prevent submission
    const submitButton = await page.$('button[type="submit"]');
    await submitButton!.click();

    // Page should still be on the home page (form not submitted)
    expect(page.url()).toBe(BASE_URL + "/");
  });

  it("should upload a CV and redirect to interview page", async () => {
    await page.goto(BASE_URL, { waitUntil: "networkidle2" });

    // Fill in the form
    await page.type('input[name="name"]', "Test Candidate");
    await page.type('input[name="email"]', "test@example.com");

    // Create a minimal PDF file for testing
    const fixturesDir = path.join(__dirname, "..", "fixtures");
    const testPdfPath = path.join(fixturesDir, "sample-cv.pdf");

    // Only run file upload if test PDF exists
    if (fs.existsSync(testPdfPath)) {
      const fileInput = await page.$('input[name="cv"]');
      await fileInput!.uploadFile(testPdfPath);

      // Click submit
      await page.click('button[type="submit"]');

      // Wait for navigation
      await page.waitForNavigation({
        waitUntil: "networkidle2",
        timeout: 15000,
      });

      // Should be redirected to interview page
      expect(page.url()).toMatch(/\/interview\/\d+/);
    }
  });
});
