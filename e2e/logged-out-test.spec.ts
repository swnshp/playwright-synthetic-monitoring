import { test, expect } from '../test-fixtures';
import * as BrowseJourney from '../helpers/browse-journey';

test('Logged Out Journey', async ({ signedOutGuest: page }) => {

  test.slow();

  //Go to the site and execute a search: expect results and products  
  await BrowseJourney.searchForItem(page, 'boot');
  await expect(page.getByTestId('filter-facets').nth(0)).toBeVisible();
  await expect(page.getByTestId('sku-card').nth(23)).toBeVisible();

  //Go to a boot and expect to add to basket a specific size
  await BrowseJourney.addItemToBasket(page, process.env.BOOT_PRODUCT!, '9');

  //Go to Basket  
  await BrowseJourney.goToBasketFromAddToBasketModal(page);
  await expect(page.locator('div.basketInformationText')).toContainText('1 items in the basket');

  //Go to Checkout
  await BrowseJourney.guestCheckoutFromBasket(page, process.env.GUEST_EMAIL!);

  //Fill in Address and Contact details
  await BrowseJourney.fillInAddressAndContactDuringCheckout(
    page,
    process.env.EXAMPLE_POSTCODE!,
    process.env.EXAMPLE_NAME!,
    process.env.EXAMPLE_PHONE!
  );

  //Select Delivery Option
  await BrowseJourney.selectFirstDeliveryOption(page);

  //Expect to be on Payment step  
  const payButton = page.frameLocator('iframe[name*="adflex-"]').getByRole('button', { name: 'Pay using this card' });
  await expect(payButton).toBeVisible({ timeout: 15000 });
});