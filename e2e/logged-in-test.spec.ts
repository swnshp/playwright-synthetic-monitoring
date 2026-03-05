import { test, expect } from '../test-fixtures';
import * as BrowseJourney from '../helpers/browse-journey';
import {logger} from '../logger';
import { API_URLS } from '../config/urls';
import { waitForApi } from '../utils/playwright-utils';

test('Logged In Journey', async ({ signedInUser: page }) => {

  test.slow();
  logger.debug('Starting Logged In Journey Test');
  await BrowseJourney.emptyBasket(page);
  logger.debug('Emptied Basket');
  //Go to the site and execute a search: expect results and products  
  await BrowseJourney.searchForItem(page, 'boot');
  await expect(page.getByTestId('filter-facets-title-container').nth(0)).toBeVisible();
  await expect(page.getByTestId('sku-card').nth(23)).toBeVisible();

  //Go to a boot and expect to add to basket a specific size
  await BrowseJourney.addItemToBasket(page, process.env.BOOT_PRODUCT!, '9');

  //Go to Basket  
  await BrowseJourney.goToBasketFromAddToBasketModal(page);
  await expect(page.locator('div.basketInformationText')).toContainText('1 items in the basket');

  //Go to Checkout
  const deliveryOptionsPromise = waitForApi(page, 'GET', API_URLS.getAvailabilityOptions);
  await BrowseJourney.checkout(page);

  //Select Delivery Option
  await deliveryOptionsPromise;
  await BrowseJourney.selectFirstDeliveryOption(page);

  //Expect to be on Payment step  
  const payButton = page.frameLocator('iframe[name*="adflex-"]').getByRole('button', { name: 'Place order and pay' });
  await expect(payButton).toBeVisible({ timeout: 15000 }); 
  
  await BrowseJourney.emptyBasket(page);
});