import { test, expect } from '../test-fixtures';
import * as BrowseJourney from '../helpers/browse-journey';
import {logger} from '../logger';

const categoryPages = [
  {url:'/products/personal-protective-equipment',minPages: 20},
  {url:'/products/clothing',minPages:20},
  {url:'/products/footwear',minPages:10},
  {url:'/products/gloves',minPages:15},
  {url:'/products/cleaning-and-hygiene',minPages:20},
  {url:'/products/workplace-safety',minPages:20}
];

test('Categories Returning Results', async ({ signedOutGuest : page }) => {
  test.slow();
  for (const category of categoryPages) {
    await page.goto(category.url);

    const pages = page.locator('.paginationSelect');

    await expect(pages).toBeVisible();

    expect(await pages.locator('option').count()).toBeGreaterThanOrEqual(category.minPages);
  }
});