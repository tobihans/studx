import { test } from '@playwright/test';
import { sleep }  from './utils';
import { login } from './partials';

test('test', async ({ page }) => {
  await login(page);

  await page.goto('https://192.168.0.134:9000/base');
  await sleep(2);
  await page.getByRole('button', { name: 'Collapse' }).click();
  await sleep(2);
  await page.getByRole('button', { name: 'Month view' }).click();
  await sleep(2);
  await page.getByRole('button', { name: 'Day view' }).click();
  await sleep(2);
  await page.getByRole('button', { name: 'Month view' }).click();
  await sleep(2);
  await page.locator('button:nth-child(8)').click();
  await sleep(2);
  await page.locator('button:nth-child(6)').first().click();
  await sleep(2);
  await page.getByRole('button', { name: 'Today' }).click();
  await sleep(2);
});
