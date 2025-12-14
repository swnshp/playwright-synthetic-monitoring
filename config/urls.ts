export const PAGE_URLS = {
  home: '/',
  productBase: '/product/',
} as const;

export const API_URLS = {
  getBasket: '/api/basket/get',
  removeBasket: '/api/basket/remove',
  getAvailabilityOptions: '/api/checkout/delivery-availability'
} as const;