import { test, expect } from '../test-fixtures';
import * as BrowseJourney from '../helpers/browse-journey';
import {logger} from '../logger';
import { API_URLS } from '../config/urls';
import { waitForApi } from '../utils/playwright-utils';

test('Migration Test', async ({ migratedUserPage: page }) => {

  test.slow();

  await expect(page.locator('div.basketInformationText')).toContainText('1 items in the basket');

});