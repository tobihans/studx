import { test } from '@playwright/test';
import { sleep }  from './utils';
import { login } from './partials';

test('Onboarding Demo', async ({ page }) => {
  await login(page);

  await page.goto('https://192.168.0.134:9000/base');
  await page.getByRole('button', { name: 'Collapse' }).click();
  await sleep(2);
  await page.getByRole('button').filter({ hasText: 'Help' }).click();
  await sleep(2);
  await page.getByRole('button', { name: 'Next' }).click();
  await sleep(2);
  await page.getByRole('button', { name: 'Next' }).click();
  await sleep(2);
  await page.getByRole('button', { name: 'Next' }).click();
  await sleep(2);
  await page.getByRole('button', { name: 'Next' }).click();
  await sleep(2);
  await page.getByRole('button', { name: 'Next' }).click();
  await sleep(2);
  await page.getByRole('button', { name: '✕' }).click();
  await sleep(10);
});
