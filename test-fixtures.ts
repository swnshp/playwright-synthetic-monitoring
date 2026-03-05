import { BrowserContext, Page, TestInfo, test as base, expect } from '@playwright/test';
import { trackAvailabilityFromTestResult } from './appinsights';
import {logger} from './logger';
import { PAGE_URLS, API_URLS } from './config/urls';
import { Cookie } from '@playwright/test';
import { Browser } from '@playwright/test';

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
  appPage: Page,
  migratedUser: Page,
  migratedUserPage: Page,
  trackAvailabilityFromTestResult: void,
  signedOutGuest: Page,
  signedInUser: Page
};

export const test = base.extend<Fixtures>({
    appPage: [async ({ browser }, use) => {
        const page = await createPage(browser);
        await use(page);
        await page.close();
        await page.context().close();
    }, { timeout: 60000 }],

    migratedUserPage: [async ({ browser }, use) => {
        const page = await createPage(browser, PAGE_URLS.basket, [{
            name: 'bv_basket',
            value: process.env.BV_BASKET_COOKIE!,
            domain: process.env.COOKIE_DOMAIN,
            path: '/',
            secure: true,
            sameSite: 'None'
        }]);
        await use(page);
        await page.close();
        await page.context().close();
    }, { timeout: 60000 }],

    signedOutGuest: async ({ appPage }, use) => { 
        await use(appPage);
    },

    migratedUser: async ({ migratedUserPage }, use) => {
        await use(migratedUserPage);
    },

    signedInUser: async ({ appPage }, use) => {
        const page = appPage;
        await page.getByRole('button', { name: 'My account' }).or(page.getByRole('button', { name: 'Sign in'})).click();
        await page.getByTestId('account-popover').getByRole('link', { name: 'Sign in' }).click();
        await page.getByRole('textbox', { name: 'Email' }).fill(process.env.LOGGEDIN_USERNAME!);
        await page.getByRole('textbox', { name: 'Password' }).fill(process.env.LOGGEDIN_PASSWORD!);
        const homePagePromise = page.waitForURL(/\/\?state.*/, { waitUntil: 'domcontentloaded'});
        await page.getByRole('button', { name: 'Sign in' }).click();
        await homePagePromise;
        await use(page);
    },

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

async function createPage(browser: Browser, defaultPage: typeof PAGE_URLS[keyof typeof PAGE_URLS] = PAGE_URLS.home, additionalCookies : any[] = []) : Promise<Page> {
    const context = await browser.newContext({serviceWorkers: 'block'});
    const page = await context.newPage();
    await setupCookies(context);
    if (additionalCookies.length) {
        await context.addCookies(additionalCookies);
    }
    await blockGoogleScripts(page);
    await page.goto(defaultPage);
    await page.getByRole('button', { name: 'Accept All', exact: true }).click();    
    return page;
}

export { expect };