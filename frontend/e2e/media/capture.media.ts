import { expect, test, type Page } from '@playwright/test';

const DOCS = '../docs';

async function shot(page: Page, name: string, fullPage = false) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DOCS}/${name}.png`, fullPage });
}

test('screenshots', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await page.goto('/app/dashboard');
  await expect(page.getByTestId('kpi-open')).toBeVisible();
  await shot(page, 'screenshot-dashboard');

  await page.goto('/app/submissions');
  await expect(page.getByTestId('submission-row')).toHaveCount(10);
  await shot(page, 'screenshot-inbox');

  await page.goto('/app/submissions/SUB-1001');
  await page.getByTestId('run-assessment').click();
  await expect(page.getByTestId('risk-score')).toBeVisible();
  await shot(page, 'screenshot-submission');
  await page.close();
});

test('demo video', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: 'e2e/.media/video', size: { width: 1280, height: 800 } },
  });
  const page = await context.newPage();
  const pause = (ms = 900) => page.waitForTimeout(ms);

  await page.goto('/');
  await pause(1500);
  await page.getByTestId('open-demo').click();
  await expect(page.getByTestId('kpi-open')).toBeVisible();
  await pause(1600);

  await page.getByTestId('nav-submissions').click();
  await expect(page.getByTestId('submission-row').first()).toBeVisible();
  await pause();
  await page.getByTestId('filter-NEW').click();
  await pause(1200);
  await page.getByTestId('search').pressSequentially('sundial', { delay: 60 });
  await pause(1400);
  await page.getByTestId('submission-row').first().click();
  await expect(page.getByTestId('applicant-name')).toBeVisible();
  await pause(1200);

  await page.getByTestId('run-assessment').click();
  await expect(page.getByTestId('risk-score')).toBeVisible();
  await pause(1800);
  await page.getByTestId('signals').scrollIntoViewIfNeeded();
  await pause(1200);
  const citation = page.getByTestId('citation').and(page.locator(':enabled')).first();
  await citation.click();
  await pause(1800);

  await page.getByTestId('override').scrollIntoViewIfNeeded();
  await page.getByTestId('override').click();
  await pause(700);
  await page.getByTestId('override-reason').pressSequentially('Broker sent updated loss runs; risk improvements verified.', { delay: 25 });
  await pause(600);
  await page.getByTestId('submit-override').click();
  await expect(page.getByTestId('decision-recorded')).toBeVisible();
  await pause(1800);

  await page.getByTestId('nav-audit').click();
  await expect(page.getByTestId('audit-row').first()).toBeVisible();
  await pause(1800);
  await context.close();
});
