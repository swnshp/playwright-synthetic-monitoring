import { API_URLS } from '../config/urls';

export type ApiEndpointUrl = typeof API_URLS[keyof typeof API_URLS];