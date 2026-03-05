import { Page } from '@playwright/test';
import { ApiEndpointUrl } from '../types/api';

export async function waitForApi(page: Page, method: 'GET' | 'POST' | 'PUT', apiEndpoint: ApiEndpointUrl, expectOk: boolean = true) {
  return page.waitForResponse(
        response =>
        response.url().endsWith(apiEndpoint) && ( response.status() === 200 || !expectOk )
            && response.request().method() === method
        , { timeout: 20000 }
    );
}