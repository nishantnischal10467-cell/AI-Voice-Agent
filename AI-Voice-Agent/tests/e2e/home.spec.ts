import { expect, test } from "@playwright/test";

test("home page exposes the voice agent workflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "AI Voice Agent" })).toBeVisible();
  await expect(page.getByText("Knowledge Upload")).toBeVisible();
  await expect(page.getByRole("button", { name: /Record/i })).toBeVisible();
});
