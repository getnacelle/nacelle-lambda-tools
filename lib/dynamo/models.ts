export enum DBOperations {
  Scan = 'scan',
  Query = 'query',
  Update = 'update',
}

export enum UpdateType {
  Set = 'SET',
  Remove = 'REMOVE',
}

export interface ExpressionMap {
  conditions: QueryConditions
  expression?: QueryExpression
  where?: {
    primary?: {
      key: string
      value: unknown
    }
    and?: {
      keys: string[]
      keyValues: [string, AttributeValue | unknown][]
    }
  }
  attributeKeys?: string[]
  attributeValues?: [string, AttributeValue | unknown][]
  remove?: {
    keys: string[]
    keyValues: [string, AttributeValue | unknown][]
  }
  update?: {
    keys: string[]
    keyValues: [string, AttributeValue | unknown][]
  }
  updateExpressions?: string[]
}

export interface AttributeValue {
  append?: boolean
  value?: {
    index?: number
    [key: string]: unknown
  }
  index?: number
}

export interface PrimaryKeyValue {
  value: unknown
  primary?: boolean
}

export interface ProjectionFields {
  ProjectionExpression?: string
  ExpressionAttributeNames?: { [field: string]: string }
}

export interface QueryConditions {
  tableName: string
  where: {
    [column: string]: { primary?: boolean; value: unknown }
  }
  update?: ConditionUpdateValues
  remove?: ConditionUpdateValues
  fields?: string[]
  itemIndex?: number
  operation: DBOperations
  returnValues?: string
}

export interface QueryExpression {
  TableName: string
  FilterExpression?: string
  ProjectionExpression?: string
  Key?: { [column: string]: unknown }
  KeyConditionExpression?: string
  ExpressionAttributeNames?: ExpressionAttributeNames
  ExpressionAttributeValues?: ExpressionAttributeValues
  UpdateExpression?: string
  ReturnValues?: string
}

export interface WhereObjectValue {
  [key: string]: unknown
  index?: number
}

export interface ExpressionAttributeNames {
  [attribute: string]: string
}

export interface ExpressionAttributeValues {
  [attribute: string]: unknown
}

export interface ConditionUpdateValues {
  [column: string]: unknown
}
