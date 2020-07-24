export enum DBOperations {
  Scan = 'scan',
  Query = 'query',
  Update = 'update',
}

export enum UpdateType {
  Set = 'SET',
  Remove = 'REMOVE',
}

export interface ProjectionFields {
  ProjectionExpression?: string
  ExpressionAttributeNames?: { [field: string]: string }
}

export interface QueryConditions {
  where: {
    [column: string]: string | WhereObjectValue
  }
  update?: ConditionUpdateValues
  remove?: ConditionUpdateValues
  fields?: string[]
  itemIndex?: number
  type: DBOperations
}

export interface QueryExpression {
  TableName: string
  FilterExpression?: string
  ProjectionExpression?: string
  Key?: { [column: string]: string | number }
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
  returnValues?: string
}
