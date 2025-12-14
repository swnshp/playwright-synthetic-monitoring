import { BrowserContext, Page, TestInfo, test as base, expect } from '@playwright/test';
import { trackAvailabilityFromTestResult } from './appinsights';
import {logger} from './logger';
import { PAGE_URLS, API_URLS } from './config/urls';

async function setupCookies(context: BrowserContext) {
    await context.addCookies([{
        name: 'sold_to',
        value: 'cash',
        domain: process.env.COOKIE_DOMAIN,
        path: '/',
        secure: true,
        sameSite: 'None'
    }]);    
}

async function blockGoogleScripts(page: Page) {
    await page.route('**www.googletagmanager.com/**', route => route.abort());
    await page.route('**googlesyndication.com/ccm**', route => route.abort());
    await page.route('**measurement.arco.co.uk**', route => route.abort());
    await page.route('**applicationinsights.azure.com**', route => route.abort());    
}

type Fixtures = {
  signedOutGuest: Page,
  signedInUser: Page,
  trackAvailabilityFromTestResult : void
};

export const test = base.extend<Fixtures>({
    signedOutGuest: [async ({ browser }, use) => {
        const context = await browser.newContext({serviceWorkers: 'block'});
        const page = await context.newPage();
        await setupCookies(context);
        await blockGoogleScripts(page);
        await page.goto(PAGE_URLS.home);
        await page.getByRole('button', { name: 'Accept All', exact: true }).click();
        await use(page);
        page.close();
        context.close();
    }, { timeout: 60000 }],

    signedInUser: [async ({ browser }, use) => {
        logger.debug('Starting Signed In User Fixture');
        const context = await browser.newContext({serviceWorkers: 'block'});
        const page = await context.newPage();
        await setupCookies(context);
        await blockGoogleScripts(page);
        await page.goto('/');
        await page.getByRole('button', { name: 'Accept All', exact: true }).click();
        await page.getByRole('button', { name: 'My account' }).or(page.getByRole('button', { name: 'Sign in'})).click();
        await page.getByTestId('account-popover').getByRole('link', { name: 'Sign in' }).click();
        await page.getByRole('textbox', { name: 'Email' }).fill(process.env.LOGGEDIN_USERNAME!);
        await page.getByRole('textbox', { name: 'Password' }).fill(process.env.LOGGEDIN_PASSWORD!);
        const homePagePromise = page.waitForURL(/\/\?state.*/, { waitUntil: 'domcontentloaded'});
        await page.getByRole('button', { name: 'Sign in' }).click();
        await homePagePromise;
        logger.debug('Homepage Promise Fulfilled');
        await use(page);
        page.close();
        context.close();
    }, { timeout: 60000 }],

    trackAvailabilityFromTestResult: [async ({}, use, testInfo) => {
        await use();
        await trackAvailability(testInfo);
    }, {auto: true}]
});

async function trackAvailability(testInfo: TestInfo) {
  await trackAvailabilityFromTestResult(
    testInfo.title,
    testInfo.status === 'passed' ? 'pass' : 'fail',
    testInfo.duration,
    testInfo.error ? testInfo.error.message : undefined
  )
};

export { expect };