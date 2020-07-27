import { DynamoDB, AWSError } from 'aws-sdk'
import { PromiseResult } from 'aws-sdk/lib/request'
import { UpdateItemInput } from 'aws-sdk/clients/dynamodb'

import { createExpression } from './expressions'
import { logger } from '../logger'
import { QueryConditions, QueryExpression, DBOperations } from './models'

interface DynamoTools {
  query: (
    queryConditions: QueryConditions
  ) => Promise<PromiseResult<DynamoDB.DocumentClient.QueryOutput, AWSError>>

  scan: (
    queryConditions: QueryConditions
  ) => Promise<PromiseResult<DynamoDB.DocumentClient.ScanOutput, AWSError>>

  update: (
    queryConditions: QueryConditions
  ) => Promise<
    PromiseResult<DynamoDB.DocumentClient.UpdateItemOutput, AWSError>
  >

  put: (
    tableName: string,
    insertItem: unknown
  ) => Promise<PromiseResult<DynamoDB.DocumentClient.PutItemOutput, AWSError>>

  createExpression: (conditions: QueryConditions) => QueryExpression
}

function init(dynamoInstance: DynamoDB.DocumentClient): DynamoTools {
  return {
    query: async function query(
      queryConditions: QueryConditions
    ): Promise<PromiseResult<DynamoDB.DocumentClient.QueryOutput, AWSError>> {
      const queryOptions = createExpression(queryConditions)

      logger.debug('Dynamo Query Expression', { queryOptions })

      return dynamoInstance.query(queryOptions).promise()
    },
    scan: async function scan(
      queryConditions: QueryConditions
    ): Promise<PromiseResult<DynamoDB.DocumentClient.ScanOutput, AWSError>> {
      const queryOptions = createExpression(queryConditions)

      logger.debug('Dynamo Scan Expression', { queryOptions })

      return dynamoInstance.scan(queryOptions).promise()
    },
    update: async function update(
      queryConditions: QueryConditions
    ): Promise<
      PromiseResult<DynamoDB.DocumentClient.UpdateItemOutput, AWSError>
    > {
      const queryOptions = createExpression(queryConditions)

      logger.debug('Dynamo Update Expression', { queryOptions })

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
    createExpression,
  }
}

const dynamoTools = { init }

export { dynamoTools, QueryConditions, QueryExpression, DBOperations }
