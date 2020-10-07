import { User } from './user'

export interface BaseConfig {
  dataSource?: string
  graphqlDataToken?: string
  graphqlEndpoint?: string
}

export interface Space {
  id: string
  domain: string
  name: string
  token: string
  type: string
  buildHook?: string
  pimSyncSourceDomain?: string
  cmsSyncSourceDomain?: string
  checkoutDataConfig: CheckoutDataConfig
  contentDataConfig: ContentDataConfig
  productDataConfig: BaseConfig
  productConnectorConfig?: ConnectorConfig
  contentConnectorConfig?: ConnectorConfig
  users: User[]
  linklists: LinkList[]
  metafields?: MetaField[]
  featureFlags?: string[]
}

export interface CheckoutDataConfig extends BaseConfig {
  restEndpoint?: string
  alternativeDataSource?: string
  alternativeDataToken?: string
  alternativeDataRestEndpoint?: string
  shopifyUrl?: string
}

export interface ContentDataConfig extends BaseConfig {
  restEndpoint?: string
  assetStorage?: string
}

export interface LinkList {
  handle: string
  links: Link[]
}

interface Link {
  title: string
  to: string
  type: string
  links?: Link[]
}

interface MetaField {
  namespace: string
  key: string
  value: string
}

interface ConnectorConfig extends BaseConfig {
  type?: string
  restEndpoint?: string
  webhookKey?: string
}
