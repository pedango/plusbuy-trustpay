import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Demo@1234");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.endsWith("/login"));
}

test("John buys the red shirt and the merchant receives the net amount", async ({ browser }) => {
  const buyer = await browser.newContext();
  const merchant = await browser.newContext();
  const buyerPage = await buyer.newPage();
  const merchantPage = await merchant.newPage();

  await login(buyerPage, "john@plusbuy.demo");
  await buyerPage.goto("/products");
  await buyerPage.getByRole("link", { name: /Red Cotton Shirt/ }).click();
  await buyerPage.getByRole("button", { name: "Add to cart" }).click();
  await buyerPage.goto("/cart");
  await buyerPage.getByRole("button", { name: "Pay with TrustPay" }).click();
  await buyerPage.getByRole("button", { name: /Pay GH₵/ }).click();
  await buyerPage.getByLabel("PIN").fill("1234");
  await buyerPage.getByRole("button", { name: "Approve" }).click();
  await expect(buyerPage.getByText(/held safely by TrustPay/i)).toBeVisible();

  await login(merchantPage, "merchant@plusbuy.demo");
  await merchantPage.goto("/merchant/orders");
  await merchantPage.getByRole("link", { name: "Manage" }).first().click();
  await merchantPage.getByRole("button", { name: "Mark as shipped" }).click();

  await buyerPage.reload();
  await buyerPage.getByRole("button", { name: "Item received" }).click();
  await buyerPage.getByRole("button", { name: "Release funds" }).click();
  await expect(buyerPage.getByText("COMPLETED")).toBeVisible();

  await merchantPage.goto("/merchant");
  await expect(merchantPage.getByText("Available balance")).toBeVisible();
  await expect(merchantPage.getByText(/GH₵ 118\.20|GH₵118\.20/)).toBeVisible();

  await buyer.close();
  await merchant.close();
});

test("PIN 0000 declines the payment", async ({ page }) => {
  await login(page, "john@plusbuy.demo");
  await page.goto("/products");
  await page.getByRole("link", { name: /Blue Cotton Shirt/ }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.goto("/cart");
  await page.getByRole("button", { name: "Pay with TrustPay" }).click();
  await page.getByRole("button", { name: /Pay GH₵/ }).click();
  await page.getByLabel("PIN").fill("0000");
  await page.getByRole("button", { name: "Approve" }).click();
  await expect(page).toHaveURL(/payment=failed/);
});
