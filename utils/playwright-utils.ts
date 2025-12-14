import { Page } from '@playwright/test';
import { ApiEndpointUrl } from '../types/api';

export async function waitForApi(page: Page, method: 'GET' | 'POST', apiEndpoint: ApiEndpointUrl) {
  return page.waitForResponse(
        response =>
        response.url().endsWith(apiEndpoint) && response.status() === 200
            && response.request().method() === method
        , { timeout: 20000 }
    );
}