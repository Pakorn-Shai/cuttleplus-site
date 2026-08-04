import { expect, test, type Page } from "@playwright/test";
import { createHmac } from "node:crypto";

let authenticatedOnce = false;

async function login(page: Page) {
  if (authenticatedOnce) {
    const identifier = process.env.OWNER_EMAIL ?? "owner@example.com";
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60;
    const payload = `${identifier}.${expiresAt}`;
    const signature = createHmac("sha256", process.env.ADMIN_SESSION_SECRET ?? "test-only-session-secret-at-least-32-characters").update(payload).digest("hex");
    await page.context().addCookies([{ name: "knowledge_hub_owner_session", value: `${payload}.${signature}`, url: "http://127.0.0.1:3100", httpOnly: true, sameSite: "Lax" }]);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin$/u);
    return;
  }
  await page.goto("/login");
  await page.getByLabel("อีเมลหรือชื่อผู้ใช้").fill(process.env.OWNER_EMAIL ?? "owner@example.com");
  await page.getByLabel("รหัสผ่าน").fill(process.env.ADMIN_PASSWORD ?? "test-password");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/admin$/u);
  authenticatedOnce = true;
}

test.describe.serial("owner critical workflows", () => {
  test("AI Accept action updates Content, Editor, Preview, and Revision History", async ({ page }) => {
    await login(page);
    await page.goto("/admin/ai");
    const reviewCard = page.locator(".ai-review-card").filter({ hasText: "E2E AI Original" });
    await reviewCard.getByRole("button", { name: "Accept และสร้าง Revision" }).click();
    await expect(page.getByText("ยอมรับ suggestion และสร้าง AI revision แล้ว")).toBeVisible();

    await page.goto("/admin/content");
    await page.getByRole("row").filter({ hasText: "E2E AI Accepted" }).getByRole("link").first().click();
    await expect(page.getByLabel("ชื่อเนื้อหา")).toHaveValue("E2E AI Accepted");
    await expect(page.locator(".blocknote-shell")).toContainText("E2E AI accepted text");
    const editorUrl = page.url();
    await page.getByRole("link", { name: "Preview" }).click();
    await expect(page.getByText("E2E AI accepted text")).toBeVisible();
    await page.goto(editorUrl);
    await page.getByRole("link", { name: "ประวัติ" }).click();
    await expect(page.locator(".revision-card").first()).toContainText("E2E AI original text");
  });

  test("Login → Create → Autosave → Publish → Public reader", async ({ page }) => {
    await login(page);
    await page.goto("/admin/content/new");
    await page.getByLabel("ชื่อเนื้อหา").fill("E2E Critical Journey");
    await page.locator(".meta-field").filter({ hasText: "Slug" }).getByRole("textbox").fill("e2e-critical-journey");
    await page.locator(".meta-field").filter({ hasText: "Excerpt" }).getByRole("textbox").fill("Created by the isolated browser test");
    await page.getByRole("button", { name: "สร้างบทความ", exact: true }).click();
    await expect(page.getByText("บันทึกแล้วใน Database")).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/content\/.+\/edit$/u);

    await page.getByLabel("ชื่อเนื้อหา").fill("E2E Critical Journey Autosaved");
    await expect(page.getByText("กำลังบันทึก...")).toBeVisible();
    await expect(page.getByText("บันทึกแล้วใน Database")).toBeVisible();
    await page.goto("/admin/content");
    const row = page.getByRole("row").filter({ hasText: "E2E Critical Journey Autosaved" });
    await row.getByRole("button", { name: "เผยแพร่" }).click();
    await expect(page.getByRole("status")).toContainText("เผยแพร่บทความแล้ว");

    await page.goto("/knowledge/e2e-critical-journey");
    await expect(page.getByRole("heading", { name: "E2E Critical Journey Autosaved" })).toBeVisible();
    await expect(page.getByText("Created by the isolated browser test")).toBeVisible();
  });

  test("Revision restore returns the editor to the saved snapshot", async ({ page }) => {
    await login(page);
    await page.goto("/admin/content/new");
    await page.getByLabel("ชื่อเนื้อหา").fill("Revision Before");
    await page.locator(".meta-field").filter({ hasText: "Slug" }).getByRole("textbox").fill("e2e-revision-restore");
    await page.getByRole("button", { name: "สร้างบทความ", exact: true }).click();
    await expect(page.getByText("บันทึกแล้วใน Database")).toBeVisible();
    await page.getByLabel("ชื่อเนื้อหา").fill("Revision After");
    await expect(page.getByText("กำลังบันทึก...")).toBeVisible();
    await expect(page.getByText("บันทึกแล้วใน Database")).toBeVisible();
    await page.getByRole("link", { name: "ประวัติ" }).click();
    await page.getByRole("button", { name: "Restore" }).first().click();
    await expect(page.getByText("ย้อนกลับไปยัง revision ที่เลือกแล้ว")).toBeVisible();
    await page.getByRole("link", { name: "กลับไป Editor" }).click();
    await expect(page.getByLabel("ชื่อเนื้อหา")).toHaveValue("Revision Before");
  });

  test("Media upload uses isolated local storage", async ({ page }) => {
    await login(page);
    await page.goto("/admin/media");
    await page.getByLabel("เลือกรูป").setInputFiles({
      name: "e2e-pixel.png",
      mimeType: "image/png",
      buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"),
    });
    await page.getByLabel("Alt text").fill("E2E test pixel");
    await page.getByRole("button", { name: "อัปโหลดรูป" }).click();
    const card = page.locator(".media-card").filter({ hasText: "e2e-pixel.png" });
    await expect(card).toContainText("E2E test pixel");
    await card.getByRole("button", { name: "ลบ" }).click();
    await expect(card).toHaveCount(0);
  });

  test("DuckDB learning example runs, reviews, saves, reloads, and previews", async ({ page }) => {
    test.setTimeout(60_000);
    await login(page);
    await page.goto("/admin/content/new");
    await page.getByLabel("ชื่อเนื้อหา").fill("E2E DuckDB Learning Example");
    await page.locator(".meta-field").filter({ hasText: "Slug" }).getByRole("textbox").fill("e2e-duckdb-learning-example");
    await page.getByRole("button", { name: "+ เพิ่ม SQL Example" }).click();
    await page.getByRole("button", { name: "Run ใน Browser" }).click();
    const review = page.locator(".learning-review");
    await expect(review).toContainText("Review output");
    await expect(review).toContainText("revenue");
    await review.getByRole("button", { name: "บันทึกผลลัพธ์นี้ในบทความ" }).click();
    await expect(page.getByText(/มี Saved output/u)).toBeVisible();
    await page.getByRole("button", { name: "สร้างบทความ", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/content\/.+\/edit$/u);
    await page.reload();
    await expect(page.getByText(/มี Saved output/u)).toBeVisible();
    await page.getByRole("link", { name: "Preview" }).click();
    await expect(page.locator(".learning-output").getByText("Saved output")).toBeVisible();
    await expect(page.locator(".learning-output-table")).toContainText("revenue");
  });

  test("SQLite learning example runs in an isolated worker and persists reviewed output", async ({ page }) => {
    test.setTimeout(60_000);
    await login(page);
    await page.goto("/admin/content/new");
    await page.getByLabel("ชื่อเนื้อหา").fill("E2E SQLite Learning Example");
    await page.locator(".meta-field").filter({ hasText: "Slug" }).getByRole("textbox").fill("e2e-sqlite-learning-example");
    await page.getByRole("button", { name: "+ เพิ่ม SQL Example" }).click();
    const card = page.locator(".learning-author-card").filter({ hasText: "SQL Example 1" });
    await card.getByLabel("Dialect").selectOption("sqlite");
    await card.getByRole("button", { name: "Run ใน Browser" }).click();
    await expect(card.locator(".learning-review")).toContainText("revenue");
    await card.getByRole("button", { name: "บันทึกผลลัพธ์นี้ในบทความ" }).click();
    await page.getByRole("button", { name: "สร้างบทความ", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/content\/.+\/edit$/u);
    await page.reload();
    await expect(page.locator(".native-learning-block")).toContainText("sqlite");
    await page.getByRole("link", { name: "Preview" }).click();
    await expect(page.getByText("Runtime: sql.js-1.14.1")).toBeVisible();
    await expect(page.locator(".learning-output-table")).toContainText("revenue");
  });

  test("Formula and automation native blocks preserve metadata and structured output", async ({ page }) => {
    await login(page);
    await page.goto("/admin/content/new");
    await page.getByLabel("ชื่อเนื้อหา").fill("E2E Native Learning Blocks");
    await page.locator(".meta-field").filter({ hasText: "Slug" }).getByRole("textbox").fill("e2e-native-learning-blocks");

    await page.getByRole("button", { name: "+ Formula" }).click();
    const formula = page.locator(".learning-author-card").filter({ hasText: "Formula Example 1" });
    await formula.getByLabel("Title").fill("ยอดขายรวม");
    await formula.getByLabel("Locale").fill("th-TH");
    await formula.getByLabel("Expression").fill("=SUM(B2:B10)");
    await formula.getByLabel("Prerequisites").fill("ตารางยอดขาย");
    await formula.getByRole("button", { name: "Save structured output" }).click();
    const formulaInput = page.locator(".learning-input-card").filter({ hasText: "ยอดขายรวม" });
    await formulaInput.getByRole("button", { name: "Save structured input" }).click();

    await page.getByRole("button", { name: "+ Automation" }).click();
    const automation = page.locator(".learning-author-card").filter({ hasText: "Automation Script 2" });
    await automation.getByLabel("Title").fill("สร้างรายงานประจำวัน");
    await automation.getByLabel("Entry point").fill("RunReport");
    await automation.getByLabel("Permissions").fill("Spreadsheet read access");
    await automation.getByLabel("Triggers").fill("Daily at 08:00");
    await automation.getByLabel("Output type").selectOption("text");
    await automation.getByLabel("Structured output value").fill("Report created");
    await automation.getByRole("button", { name: "Save structured output" }).click();

    await page.getByRole("button", { name: "สร้างบทความ", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/content\/.+\/edit$/u);
    await page.reload();
    await expect(page.locator(".native-learning-block")).toHaveCount(2);
    await expect(formula.getByLabel("Title")).toHaveValue("ยอดขายรวม");
    await expect(automation.getByLabel("Entry point")).toHaveValue("RunReport");
    await page.getByRole("link", { name: "Preview" }).click();
    await expect(page).toHaveURL(/\/preview$/u);
    await expect(page.getByText("ยอดขายรวม", { exact: true })).toBeVisible();
    await expect(page.getByText("Locale: th-TH")).toBeVisible();
    await expect(page.locator(".learning-output").getByText("Input", { exact: true })).toBeVisible();
    await expect(page.getByText("Permission: Spreadsheet read access")).toBeVisible();
    await expect(page.getByText("Report created")).toBeVisible();
  });
});
