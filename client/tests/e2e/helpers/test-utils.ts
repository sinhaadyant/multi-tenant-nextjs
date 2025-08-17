import { Page, expect } from "@playwright/test";

export class E2ETestUtils {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  generateRandomEmail(): string {
    return `test-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}@example.com`;
  }

  generateRandomString(length: number = 10): string {
    return Math.random()
      .toString(36)
      .substring(2, length + 2);
  }

  generateRandomPassword(): string {
    return `TestPassword${Date.now()}!`;
  }

  generateRandomName(): string {
    return `Test User ${Date.now()}`;
  }

  async fillForm(formData: Record<string, string | boolean>): Promise<void> {
    for (const [field, value] of Object.entries(formData)) {
      if (typeof value === "boolean") {
        if (value) {
          await this.page.getByLabel(field).check();
        } else {
          await this.page.getByLabel(field).uncheck();
        }
      } else {
        await this.page.getByLabel(field).fill(value);
      }
    }
  }

  async expectFormValidationError(
    fieldName: string,
    expectedMessage: string
  ): Promise<void> {
    await expect(this.page.getByText(expectedMessage)).toBeVisible();
  }

  async expectSuccessMessage(expectedMessage: string): Promise<void> {
    await expect(
      this.page.getByText(expectedMessage, { exact: false })
    ).toBeVisible();
  }

  async expectErrorMessage(expectedMessage: string): Promise<void> {
    await expect(
      this.page.getByText(expectedMessage, { exact: false })
    ).toBeVisible();
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }

  async waitForElementToBeVisible(selector: string): Promise<void> {
    await this.page.waitForSelector(selector, { state: "visible" });
  }

  async waitForElementToBeHidden(selector: string): Promise<void> {
    await this.page.waitForSelector(selector, { state: "hidden" });
  }

  async clickButton(buttonText: string): Promise<void> {
    await this.page.getByRole("button", { name: buttonText }).click();
  }

  async clickLink(linkText: string): Promise<void> {
    await this.page.getByRole("link", { name: linkText }).click();
  }

  async selectOption(selectName: string, optionText: string): Promise<void> {
    await this.page.getByLabel(selectName).click();
    await this.page.getByRole("option", { name: optionText }).click();
  }

  async expectTableToHaveData(): Promise<void> {
    // Wait for table to load and have at least one row
    await expect(this.page.locator("table tbody tr")).toHaveCount({ min: 1 });
  }

  async expectTableToBeEmpty(): Promise<void> {
    // Check for empty state message or no rows
    await expect(this.page.locator("table tbody tr")).toHaveCount(0);
  }

  async expectModalToBeVisible(): Promise<void> {
    await expect(this.page.getByRole("dialog")).toBeVisible();
  }

  async expectModalToBeHidden(): Promise<void> {
    await expect(this.page.getByRole("dialog")).not.toBeVisible();
  }

  async closeModal(): Promise<void> {
    await this.page.getByRole("button", { name: /close|cancel/i }).click();
  }

  async confirmDialog(): Promise<void> {
    await this.page
      .getByRole("button", { name: /confirm|yes|delete/i })
      .click();
  }

  async expectBreadcrumb(items: string[]): Promise<void> {
    for (const item of items) {
      await expect(this.page.getByText(item)).toBeVisible();
    }
  }

  async expectPageTitle(title: string): Promise<void> {
    await expect(this.page.getByRole("heading", { name: title })).toBeVisible();
  }

  async expectLoadingSpinner(): Promise<void> {
    await expect(
      this.page.locator("[data-testid='loading-spinner']")
    ).toBeVisible();
  }

  async expectNoLoadingSpinner(): Promise<void> {
    await expect(
      this.page.locator("[data-testid='loading-spinner']")
    ).not.toBeVisible();
  }

  async expectNotification(
    type: "success" | "error" | "warning" | "info",
    message: string
  ): Promise<void> {
    const notification = this.page.locator(
      `[data-testid='notification-${type}']`
    );
    await expect(notification).toBeVisible();
    await expect(notification).toContainText(message);
  }

  async expectPermissionDenied(): Promise<void> {
    await expect(
      this.page.getByText(/permission denied|unauthorized|access denied/i)
    ).toBeVisible();
  }

  async expectNotFound(): Promise<void> {
    await expect(this.page.getByText(/not found|404/i)).toBeVisible();
  }

  async expectServerError(): Promise<void> {
    await expect(this.page.getByText(/server error|500/i)).toBeVisible();
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }

  async expectElementToHaveText(selector: string, text: string): Promise<void> {
    await expect(this.page.locator(selector)).toContainText(text);
  }

  async expectElementToBeVisible(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  async expectElementToBeHidden(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).not.toBeVisible();
  }

  async expectElementToBeDisabled(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeDisabled();
  }

  async expectElementToBeEnabled(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeEnabled();
  }

  async expectElementToBeChecked(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeChecked();
  }

  async expectElementToBeUnchecked(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).not.toBeChecked();
  }

  async expectElementToHaveValue(
    selector: string,
    value: string
  ): Promise<void> {
    await expect(this.page.locator(selector)).toHaveValue(value);
  }

  async expectElementToBeEmpty(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeEmpty();
  }

  async expectElementToHaveAttribute(
    selector: string,
    attribute: string,
    value: string
  ): Promise<void> {
    await expect(this.page.locator(selector)).toHaveAttribute(attribute, value);
  }

  async expectElementToHaveClass(
    selector: string,
    className: string
  ): Promise<void> {
    await expect(this.page.locator(selector)).toHaveClass(
      new RegExp(className)
    );
  }

  async expectElementToNotHaveClass(
    selector: string,
    className: string
  ): Promise<void> {
    await expect(this.page.locator(selector)).not.toHaveClass(
      new RegExp(className)
    );
  }

  async expectElementToBeFocused(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeFocused();
  }

  async expectElementToNotBeFocused(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).not.toBeFocused();
  }

  async expectElementToBeInViewport(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeInViewport();
  }

  async expectElementToNotBeInViewport(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).not.toBeInViewport();
  }

  async expectElementToHaveCount(
    selector: string,
    count: number
  ): Promise<void> {
    await expect(this.page.locator(selector)).toHaveCount(count);
  }

  async expectElementToHaveCountAtLeast(
    selector: string,
    count: number
  ): Promise<void> {
    await expect(this.page.locator(selector)).toHaveCount({ min: count });
  }

  async expectElementToHaveCountAtMost(
    selector: string,
    count: number
  ): Promise<void> {
    await expect(this.page.locator(selector)).toHaveCount({ max: count });
  }
}
