import { DynamoDB, AWSError } from 'aws-sdk'
import { PromiseResult } from 'aws-sdk/lib/request'
import { UpdateItemInput } from 'aws-sdk/clients/dynamodb'

import { createQueryExpression } from './expressions'
import { QueryConditions, QueryExpression, DBOperations } from './models'

interface DynamoTools {
  query: (
    tableName: string,
    queryConditions: QueryConditions
  ) => Promise<PromiseResult<DynamoDB.DocumentClient.QueryOutput, AWSError>>

  scan: (
    tableName: string,
    queryConditions: QueryConditions
  ) => Promise<PromiseResult<DynamoDB.DocumentClient.ScanOutput, AWSError>>

  update: (
    tableName: string,
    queryConditions: QueryConditions
  ) => Promise<
    PromiseResult<DynamoDB.DocumentClient.UpdateItemOutput, AWSError>
  >

  put: (
    tableName: string,
    insertItem: unknown
  ) => Promise<PromiseResult<DynamoDB.DocumentClient.PutItemOutput, AWSError>>

  createQueryExpression: (
    tableName: string,
    conditions: QueryConditions
  ) => QueryExpression
}

function init(dynamoInstance: DynamoDB.DocumentClient): DynamoTools {
  return {
    query: async function query(
      tableName: string,
      queryConditions: QueryConditions
    ): Promise<PromiseResult<DynamoDB.DocumentClient.QueryOutput, AWSError>> {
      const queryOptions = createQueryExpression(tableName, queryConditions)
      return dynamoInstance.query(queryOptions).promise()
    },
    scan: async function scan(
      tableName: string,
      queryConditions: QueryConditions
    ): Promise<PromiseResult<DynamoDB.DocumentClient.ScanOutput, AWSError>> {
      const queryOptions = createQueryExpression(tableName, queryConditions)
      return dynamoInstance.scan(queryOptions).promise()
    },
    update: async function update(
      tableName: string,
      queryConditions: QueryConditions
    ): Promise<
      PromiseResult<DynamoDB.DocumentClient.UpdateItemOutput, AWSError>
    > {
      const queryOptions = createQueryExpression(tableName, queryConditions)
      return dynamoInstance.update(queryOptions as UpdateItemInput).promise()
    },
    put: async function put(
      tableName: string,
      insertItem: unknown
    ): Promise<PromiseResult<DynamoDB.DocumentClient.PutItemOutput, AWSError>> {
      return dynamoInstance
        .put({
          TableName: tableName,
          Item: insertItem,
          ReturnValues: 'NONE',
        })
        .promise()
    },
    createQueryExpression,
  }
}

const dynamoTools = { init }

export { dynamoTools, QueryConditions, QueryExpression, DBOperations }
