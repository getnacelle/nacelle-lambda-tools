import { mockUser } from './user'
import { Space } from '../models/space'

export const mockSpace: Space = {
  id: 'foolish-quail-hash',
  domain: 'www.test.com',
  name: 'Mock Space',
  token: 'abc-123',
  type: 'Sandbox',
  buildHook: null,
  pimSyncSourceDomain: null,
  cmsSyncSourceDomain: null,
  checkoutDataConfig: {
    dataSource: 'shopify',
    graphqlEndpoint: 'https://my-shop.myshopify.com/api/graphql.json',
    graphqlDataToken: 'def-123',
  },
  productDataConfig: {
    dataSource: 'shopify',
    graphqlEndpoint: ' ',
    graphqlDataToken: ' ',
  },
  contentDataConfig: {
    dataSource: 'shopify',
    graphqlEndpoint: ' ',
    graphqlDataToken: ' ',
  },
  productConnectorConfig: {
    type: 'shopify',
    graphqlEndpoint: 'https://my-shop.myshopify.com/api/graphql.json',
    graphqlDataToken: 'def-123',
    webhookKey: 'tuv-345',
    restEndpoint: null,
  },
  contentConnectorConfig: {
    type: 'shopify',
    graphqlEndpoint: 'https://my-shop.myshopify.com/api/graphql.json',
    graphqlDataToken: 'def-123',
    webhookKey: null,
    restEndpoint: null,
  },
  users: [{ id: mockUser.id, email: mockUser.email, role: 'Super Admin' }],
  metafields: null,
  linklists: [
    {
      handle: 'main-menu',
      links: [
        { title: 'Home', to: '/', type: 'Page' },
        { title: 'Shop', to: '/shop', type: 'Page' },
      ],
    },
  ],
}
