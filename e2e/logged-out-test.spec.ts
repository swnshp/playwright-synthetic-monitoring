import { test, expect } from '@playwright/test';
import { trackAvailabilityFromTestResult } from '../appinsights';

test('Logged Out Journey', async ({ browser }) => {

  test.slow();

  const context = await browser.newContext();
  const page = await context.newPage();

  //Make sure we don't get bounced off the site
  await context.addCookies([{
    name: 'sold_to',
    value: 'cash',
    domain: process.env.COOKIE_DOMAIN,
    path: '/',
    secure: true,
    sameSite: 'None'
  }]);
  await page.goto('/');
  await page.getByRole('button', { name: 'Accept All' }).click();

  //Go to the site and execute a search: expect results and products  
  await page.getByTestId('input-search-field').click();
  await page.getByTestId('input-search-field').fill('boots');
  await page.getByRole('button', { name: 'Search', exact: true }).click();

  await expect(page.getByTestId('filter-facets').nth(0)).toBeVisible();

  await expect(page.getByTestId('sku-card').nth(23)).toBeVisible();

  //Go to a boot and expect to add to basket a specific size
  await page.goto('/product/' + process.env.BOOT_PRODUCT);
  await page.locator('label').filter({ hasText: '9' }).click();
  await page.getByRole('button', { name: 'Add to basket' }).click();

  //Go to Basket
  await page.getByRole('link', { name: 'Go to basket' }).click();
  await expect(page.getByRole('main')).toContainText('1 items in the basket');

  //Go to Checkout
  await page.getByRole('button', { name: 'Checkout' }).click();
  await page.getByTestId('input-field-text').click();
  await page.getByTestId('input-field-text').fill(process.env.GUEST_EMAIL!);
  await page.getByRole('button', { name: 'Checkout as guest' }).click();
  await page.getByTestId('input-search-field').click();
  await page.getByTestId('input-search-field').fill(process.env.EXAMPLE_POSTCODE!);
  await page.locator('ul.loqateInputList > li:nth-child(1) > button').click();
  await page.getByRole('textbox', { name: 'Name*' }).click();
  await page.getByRole('textbox', { name: 'Name*' }).fill(process.env.EXAMPLE_NAME!);
  await page.getByRole('textbox', { name: 'phone number*' }).click();
  await page.getByRole('textbox', { name: 'phone number*' }).fill(process.env.EXAMPLE_PHONE!);
  await page.getByRole('button', { name: 'Use this address' }).click();
  await page.locator('div.DeliveryOptions').getByRole('radio').first().check();
  await page.getByRole('button', { name: 'Confirm delivery' }).click();
  const payButton = page.frameLocator('iframe[name*="adflex-"]').getByRole('button', { name: 'Pay using this card' });
  await expect(payButton).toBeVisible({ timeout: 10000 });
});

test.afterEach(async ({}, testInfo) => {
  await trackAvailabilityFromTestResult(
    testInfo.title,
    testInfo.status === 'passed' ? 'pass' : 'fail',
    testInfo.duration,
    testInfo.error ? testInfo.error.message : undefined
  )
});