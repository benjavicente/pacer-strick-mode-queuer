import { expect, test } from "@playwright/test";

test("compares constructor callback calls with and without StrictMode", async ({
  page,
}, testInfo) => {
  const errors: Array<string> = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("./");

  const normal = page.getByRole("region", {
    name: "Without StrictMode",
    exact: true,
  });
  const strict = page.getByRole("region", {
    name: "With StrictMode",
    exact: true,
  });
  const strictReceipts =
    testInfo.project.name === "production"
      ? ["Processed job-1"]
      : ["Processed job-1", "Processed job-1"];

  await expect(normal.getByLabel("Callback count")).toHaveText("1");
  await expect(strict.getByLabel("Callback count")).toHaveText(
    String(strictReceipts.length),
  );
  await expect(normal.getByRole("listitem")).toHaveText(["Processed job-1"]);
  await expect(strict.getByRole("listitem")).toHaveText(strictReceipts);

  await page.getByRole("button", { name: "Run fresh mounts again" }).click();
  await expect(normal.getByRole("listitem")).toHaveText(["Processed job-1"]);
  await expect(strict.getByRole("listitem")).toHaveText(strictReceipts);
  expect(errors).toEqual([]);
});
