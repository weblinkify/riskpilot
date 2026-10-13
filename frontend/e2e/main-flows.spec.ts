import { expect, test, type Page } from '@playwright/test';

// Written to pass against BOTH API modes. In real mode the database is shared between tests and
// runs, so assertions check behaviour (filters, decisions, audit) rather than mutable counts.

async function openSubmission(page: Page, id: string) {
  await page.goto(`/app/submissions/${id}`);
  await expect(page.getByTestId('applicant-name')).toBeVisible();
}

async function ensureFreshAssessment(page: Page) {
  const run = page.getByTestId('run-assessment');
  const rerun = page.getByTestId('rerun-assessment');
  await expect(run.or(rerun)).toBeVisible();
  if (await run.isVisible()) await run.click();
  else await rerun.click();
  await expect(page.getByTestId('risk-score')).toBeVisible();
  await expect(page.getByTestId('rerun-assessment')).toHaveText('Re-run');
}

test.describe('RiskPilot main flows', () => {
  test('landing page opens the demo dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'co-pilot for underwriters',
    );
    await page.getByTestId('open-demo').click();
    await expect(page).toHaveURL(/\/app\/dashboard/);
    await expect(page.getByTestId('kpi-open')).toBeVisible();
    await expect(page.getByTestId('kpi-bind')).toContainText('%');
    await expect(page.getByText('Submissions by status')).toBeVisible();
  });

  test('inbox lists, paginates, filters and searches submissions', async ({ page }) => {
    await page.goto('/app/submissions');
    await expect(page.getByTestId('submission-row')).toHaveCount(10);
    await expect(page.getByTestId('page-info')).toHaveText('1–10 of 40');

    await page.getByTestId('next-page').click();
    await expect(page.getByTestId('page-info')).toHaveText('11–20 of 40');
    await expect(page).toHaveURL(/page=1/);

    await page.getByTestId('filter-DECLINED').click();
    await expect(page).toHaveURL(/status=DECLINED/);
    const badges = page.getByTestId('submission-row').getByTestId('status-badge');
    await expect(badges.first()).toBeVisible();
    for (const text of await badges.allInnerTexts()) expect(text.trim()).toBe('Declined');
    await page.getByTestId('filter-DECLINED').click();

    await page.getByTestId('filter-line').selectOption('UMBRELLA');
    await expect(page).toHaveURL(/line=UMBRELLA/);
    await expect(page.getByTestId('submission-row').first()).toContainText('Umbrella');
    for (const text of await page.getByTestId('submission-row').allInnerTexts())
      expect(text).toContain('Umbrella');
    await page.getByTestId('filter-line').selectOption('');

    await page.getByTestId('search').fill('harborview');
    await expect(page.getByTestId('submission-row')).toHaveCount(1);
    await expect(page.getByTestId('submission-row')).toContainText('Harborview Kitchen & Bar');

    await page.getByTestId('search').fill('no-such-applicant-xyz');
    await expect(page.getByTestId('empty')).toBeVisible();
  });

  test('opens a submission with applicant, property, losses and documents', async ({ page }) => {
    await page.goto('/app/submissions?q=harborview');
    await page.getByTestId('submission-row').first().click();
    await expect(page).toHaveURL(/\/app\/submissions\/SUB-1001$/);
    await expect(page.getByTestId('applicant-name')).toHaveText('Harborview Kitchen & Bar');
    await expect(page.getByTestId('property-details')).toContainText('$36,120,000');
    await expect(page.getByTestId('loss-history').locator('tbody tr')).toHaveCount(4);
    await expect(page.getByTestId('document')).not.toHaveCount(0);
  });

  test('runs an AI assessment with cited, explainable signals', async ({ page }) => {
    await openSubmission(page, 'SUB-1001');
    await ensureFreshAssessment(page);
    await expect(page.getByTestId('risk-score')).toHaveText('86');
    await expect(page.getByTestId('risk-band')).toHaveText(/High risk/);
    await expect(page.getByTestId('appetite')).toContainText('In appetite');
    await expect(page.getByTestId('recommended-action')).toHaveText('Decline');
    await expect(page.getByTestId('signal').first()).toBeVisible();

    // Every signal carries a citation; clicking one reveals the source document's extracted fields.
    const citation = page
      .getByTestId('citation')
      .filter({ hasText: 'acord140_harborview.pdf' })
      .first();
    await expect(citation).toContainText('construction_class = Frame (ISO 1)');
    await citation.click();
    await expect(page.locator('#doc-SUB-1001-D2')).toContainText('construction_class');
  });

  test('underwriter accepts the recommendation and it is audited', async ({ page }) => {
    await openSubmission(page, 'SUB-1003');
    await ensureFreshAssessment(page);
    const action = (await page.getByTestId('recommended-action').innerText()).trim();
    await page.getByTestId('accept').click();
    await expect(page.getByTestId('decision-recorded')).toContainText(`Accepted: ${action}`);
    await expect(page.getByTestId('history')).toContainText('DECISION_ACCEPTED');
  });

  test('override requires a reason and is audited', async ({ page }) => {
    await openSubmission(page, 'SUB-1005');
    await ensureFreshAssessment(page);
    await page.getByTestId('override').click();
    const submit = page.getByTestId('submit-override');
    await expect(submit).toBeDisabled();
    await page.getByTestId('override-reason').fill('too short');
    await expect(submit).toBeDisabled();
    await page
      .getByTestId('override-reason')
      .fill('Broker confirmed full roof replacement in 2025; inspection ordered.');
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(page.getByTestId('decision-recorded')).toContainText('Overridden');
    await expect(page.getByTestId('decision-recorded')).toContainText('roof replacement');
    await expect(page.getByTestId('history')).toContainText('DECISION_OVERRIDDEN');

    await page.getByTestId('nav-audit').click();
    await expect(page.getByTestId('audit-row').first()).toContainText('DECISION_OVERRIDDEN');
  });

  test('creates, edits and deletes an appetite rule', async ({ page }) => {
    const name = `E2E rule ${Date.now()}`;
    await page.goto('/app/appetite-rules');
    await expect(page.getByTestId('rule-row').first()).toBeVisible();

    await page.getByTestId('new-rule').click();
    await page.getByTestId('rule-name').fill(name);
    await page.getByTestId('rule-line').selectOption('UMBRELLA');
    await page.getByTestId('rule-state').fill('tx');
    await page.getByTestId('rule-max-tiv').fill('3000000');
    await page.getByTestId('save-rule').click();
    const row = page.getByTestId('rule-row').filter({ hasText: name });
    await expect(row).toContainText('$3,000,000');
    await expect(row).toContainText('TX');

    await row.getByTestId('edit-rule').click();
    await page.getByTestId('rule-max-tiv').fill('4500000');
    await page.getByTestId('save-rule').click();
    await expect(row).toContainText('$4,500,000');

    await row.getByTestId('delete-rule').click();
    await row.getByTestId('confirm-delete').click();
    await expect(page.getByTestId('rule-row').filter({ hasText: name })).toHaveCount(0);
  });

  test('appetite rule changes drive the next assessment', async ({ page }) => {
    const coreRule = () =>
      page.getByTestId('rule-row').filter({ hasText: 'Core property – Sun Belt' });
    const setCoreLimit = async (tiv: string, expected: string) => {
      await page.goto('/app/appetite-rules');
      await coreRule().getByTestId('edit-rule').click();
      await page.getByTestId('rule-max-tiv').fill(tiv);
      await page.getByTestId('save-rule').click();
      await expect(coreRule()).toContainText(expected);
    };

    // SUB-1011: Texas property with TIV $44.13M – above the $25M core limit.
    await openSubmission(page, 'SUB-1011');
    await ensureFreshAssessment(page);
    await expect(page.getByTestId('appetite')).toContainText('Out of appetite');

    await setCoreLimit('50000000', '$50,000,000');
    try {
      await openSubmission(page, 'SUB-1011');
      await ensureFreshAssessment(page);
      await expect(page.getByTestId('appetite')).toContainText('In appetite');
    } finally {
      await setCoreLimit('25000000', '$25,000,000');
    }
  });
});
