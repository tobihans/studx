import { sleep }  from './utils';
import { Page } from '@playwright/test';

export const login = async (page: Page) => {
  await page.goto('https://192.168.0.134:9000/authenticate');
  await page.getByPlaceholder('13368720').click();
  await page.getByPlaceholder('13368720').fill('admin');
  await page.getByPlaceholder('(*3jkjdnK@dj').click();
  await page.getByPlaceholder('(*3jkjdnK@dj').fill('admin');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await sleep(2);
}
