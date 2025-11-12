import { Page, expect } from '@playwright/test';
import {logger} from '../logger';

enum BasketState {
  CONTENTS,
  EMPTY
}

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
    try {
        await page.locator('div.DeliveryOptions').getByRole('radio').first().check();    
    } catch (e) {
        // Until 412 issue is fixed, this will click retry in case the sequencing overlaps
        logger.warn('Error selecting delivery option, attempting retry (Suspect: 412 issue)');
        await page.getByRole('button', { name: 'Retry' }).click();        
        await page.locator('div.DeliveryOptions').getByRole('radio').first().check();       
    }
    await page.getByRole('button', { name: 'Confirm delivery' }).click();
}

export async function emptyBasket(page: Page) {
    const apiPromise = waitForBasketApiGet(page);
    await page.goto('/basket');    
    await apiPromise;

    //Wait for the checkout button, this should mean the whole basket has loaded
    //OR wait for empty basket message
    const basketState = await Promise.race([
        page.getByRole('button', { name: 'Checkout' }).waitFor().then(() => BasketState.CONTENTS),
        page.getByRole('heading', { name: 'Your shopping basket is empty'}).waitFor().then(() => BasketState.EMPTY)
    ]);

    //In an ideal world, we'd have an API to clear the basket, but we don't, so remove items one by one
    if (basketState === BasketState.CONTENTS) {
        const removeLinks = page.getByRole('button', { name: 'Remove' });
        const items = await removeLinks.count();
        logger.debug(`Found ${items} items in basket to remove`);
        for (let i = 0; i < items; i++) {
            const apiPromise = page.waitForResponse(resp => resp.url().includes('/api/basket/remove') && resp.status() === 200);
            await removeLinks.first().click();
            await apiPromise
        }
    }
}