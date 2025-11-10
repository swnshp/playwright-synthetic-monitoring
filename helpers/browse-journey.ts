import { Page, expect } from '@playwright/test';
import {logger} from '../logger';

export async function acceptCookies(page: Page) {
    await page.getByRole('button', { name: 'Accept All', exact: true }).click();
}

export async function searchForItem(page: Page, searchTerm: string) {
    await page.getByTestId('input-search-field').click();
    await page.getByTestId('input-search-field').fill(searchTerm);
    await page.getByRole('button', { name: 'Search', exact: true }).click();
}

export async function addItemToBasket(page: Page, productSlug: string, sizeLabel: string | undefined) {
    await page.goto('/product/' + productSlug);
    if (sizeLabel) {
        await page.locator('label').filter({ hasText: '9' }).click();
    }
    await page.getByRole('button', { name: 'Add to basket' }).click();
}

async function waitForBasketApiGet(page: Page) {
  return page.waitForResponse(
        response =>
        response.url().endsWith('/api/basket/get') && response.status() === 200
            && response.request().method() === 'GET'
        , { timeout: 20000 }
    );
}

export async function goToBasketFromAddToBasketModal(page: Page) {
    //Go to Basket     
    const apiPromise = waitForBasketApiGet(page);
    await page.getByRole('link', { name: 'Go to basket' }).click();
    await apiPromise
}

export async function guestCheckoutFromBasket(page:Page, guestEmail: string) {
    await checkout(page);
    await page.getByTestId('input-field-text').click();
    await page.getByTestId('input-field-text').fill(guestEmail);
    await page.getByRole('button', { name: 'Checkout as guest' }).click();
}

export async function checkout(page:Page) {
    await page.getByRole('button', { name: 'Checkout' }).click();
}

export async function fillInAddressAndContactDuringCheckout(page: Page, postcode: string, name: string, phoneNumber: string) {
    await page.locator('div.loqateInput').waitFor();
    await page.getByTestId('input-search-field').fill(postcode);
    await page.locator('ul.loqateInputList > li:nth-child(1) > button').click();

    await page.getByRole('textbox', { name: 'Name*' }).fill(name);
    await page.getByRole('textbox', { name: 'phone number*' }).fill(phoneNumber);
    await page.getByRole('button', { name: 'Use this address' }).click();
}

export async function selectFirstDeliveryOption(page: Page) {
    await page.locator('div.DeliveryOptions').getByRole('radio').first().check();
    await page.getByRole('button', { name: 'Confirm delivery' }).click();
}

export async function emptyBasket(page: Page) {
    logger.debug('Emptying basket');
    const apiPromise = waitForBasketApiGet(page);
    await page.goto('/basket');    
    logger.debug('Navigated to basket');
    await apiPromise;
    logger.debug('Basket API GET completed');

    const removeLinks = page.getByRole('button', { name: 'Remove' });
    const items = await removeLinks.count();
    for (let i = 0; i < items; i++) {
        const apiPromise = page.waitForResponse(resp => resp.url().includes('/api/basket/remove') && resp.status() === 200);
        await removeLinks.first().click();
        await apiPromise
    }
}