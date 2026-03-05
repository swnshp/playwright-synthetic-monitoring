import { Page, expect } from '@playwright/test';
import {logger} from '../logger';
import { PAGE_URLS, API_URLS } from '../config/urls';
import { ApiEndpointUrl } from '../types/api';
import { waitForApi } from '../utils/playwright-utils';

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
    await page.goto(PAGE_URLS.productBase + productSlug);
    if (sizeLabel) {
        await page.locator('label').filter({ hasText: '9' }).click();
    }
    await page.getByRole('button', { name: 'Add to basket' }).click();
}

export async function goToBasketFromAddToBasketModal(page: Page) {
    //Go to Basket     
    const apiPromise = waitForApi(page, 'GET', API_URLS.getBasket);
    await page.getByRole('link', { name: 'Go to basket' }).click();
    await apiPromise;
}

export async function guestCheckoutFromBasket(page:Page, guestEmail: string) {
    await checkout(page);
    await page.getByRole('textbox', { name: 'Email' }).fill(guestEmail);
    await page.getByRole('button', { name: 'Checkout as guest' }).click();
}

export async function checkout(page:Page) {
    await page.getByRole('button', { name: 'Checkout' }).click();
}

export async function fillInAddressAndContactDuringCheckout(page: Page, postcode: string, name: string, phoneNumber: string) {
    await page.locator('div.loqateInput').waitFor();
    await page.getByTestId('input-search-field').fill(postcode);
    await page.locator('ul.loqateInputList > li:nth-child(1) > button').click();

    await expect(page.getByRole('textbox', { name: 'Address Line 1' })).not.toBeEmpty();
    await expect(page.getByRole('textbox', { name: 'Town/City' })).not.toBeEmpty();
    await expect(page.getByRole('textbox', { name: 'Postcode' })).not.toBeEmpty();

    await page.getByRole('textbox', { name: 'First Name*' }).fill(name.split(' ')[0]);
    await page.getByRole('textbox', { name: 'Last Name*' }).fill(name.split(' ')[1]);
    await page.getByRole('textbox', { name: 'Phone number*' }).fill(phoneNumber);
    await page.getByRole('button', { name: 'Use this address' }).click();
}

export async function selectFirstDeliveryOption(page: Page) {
    try {        
        await page.locator('div.DeliveryOptions').getByRole('radio').first().check();    
    } catch (e) {
        // Until 412 issue is fixed, this will click retry in case the sequencing overlaps
        logger.warn('Error selecting delivery option, attempting retry (Suspect: 412 issue)');
        const apiPromise = waitForApi(page, 'GET', API_URLS.getAvailabilityOptions);
        await page.getByRole('button', { name: 'Retry' }).click();    
        await apiPromise;    
        await page.locator('div.DeliveryOptions').getByRole('radio').first().check();       
    }
    const updateDeliveryPromise = waitForApi(page, 'PUT', API_URLS.updateDeliveryOption, false);
    await page.getByRole('button', { name: 'Confirm delivery' }).click();
    let response = await updateDeliveryPromise;
    // Across the 2PM cut off, the front end is often submitting a date that is no longer valid, resulting in a 500 response
    if (!response.ok()) {
        logger.warn('Error selecting delivery option, attempting retry (Suspect: Wrong Date Issue)');
        await page.getByRole('button', { name: 'Retry' }).click();  
    }
}

export async function emptyBasket(page: Page) {
    const apiPromise = waitForApi(page, 'GET', API_URLS.getBasket);
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
            const apiPromise = waitForApi(page, 'POST', API_URLS.removeBasket);
            await removeLinks.first().click();
            await apiPromise
        }
    }
}