import flow from 'lodash/fp/flow'

import {
  QueryConditions,
  ExpressionMap,
  QueryExpression,
  AttributeValue,
} from '../models'
import { buildProjectionExpression } from './projections'
import { buildUpdateKeyExpression, buildKeyConditionExpression } from './keys'
import { buildExpressionAttributeNames } from './attribute-names'
import { processWhereFilter, buildFilterExpression } from './where-filters'
import { buildExpressionAttributeValues } from './attribute-values'
import {
  buildUpdateExpression,
  processUpdateValues,
  processRemoveValues,
} from './updates'

/**
 * Creates a Dynamo query expression object. This function will run the
 * query conditions through a series of functions to produce an expression map.
 * This map contains the information necessary to create the final dynamo
 * expression.
 *
 * For more details on how to use
 * this function, please reference the README and the unit tests.
 *
 * @param conditions - An object outlining the conditional cases for the
 * query
 *
 * @return An object containing several properties required for querying dynamo
 */
export function createExpression(conditions: QueryConditions): QueryExpression {
  if (!conditions) {
    throw new Error('Misisng query conditions')
  }

  const expressionMap = {
    conditions,
    expression: <QueryExpression>{},
  }

  switch (conditions.operation) {
    case 'scan': {
      const buildExpressionObject = flow(
        validateQueryConditions,
        addTableName,
        processWhereFilter,
        buildFilterExpression,
        buildExpressionAttributeNames,
        buildExpressionAttributeValues,
        buildProjectionExpression
      )
      const map: ExpressionMap = buildExpressionObject(expressionMap)
      // console.log(JSON.stringify(map, null, 2))
      return map.expression
    }

    case 'update': {
      const buildExpressionObject = flow(
        validateQueryConditions,
        addTableName,
        processWhereFilter,
        processUpdateValues,
        processRemoveValues,
        buildUpdateKeyExpression,
        buildExpressionAttributeNames,
        buildExpressionAttributeValues,
        buildUpdateExpression,
        addReturnValues
      )

      const map: ExpressionMap = buildExpressionObject(expressionMap)
      // console.log(JSON.stringify(map, null, 2))
      return map.expression
    }

    case 'query':
    default: {
      const buildExpressionObject = flow(
        validateQueryConditions,
        addTableName,
        processWhereFilter,
        buildKeyConditionExpression,
        buildFilterExpression,
        buildExpressionAttributeNames,
        buildExpressionAttributeValues,
        buildProjectionExpression
      )
      const map: ExpressionMap = buildExpressionObject(expressionMap)
      // console.log(JSON.stringify(map, null, 2))
      return map.expression
    }
  }
}

/**
 * Validates that required fields are present to build an expression. In the future
 * this should be expanded to validate based on the operation type
 *
 * @param expressionMap - The current expressionMap
 *
 * @return The current expressionMap
 */
function validateQueryConditions(expressionMap: ExpressionMap): ExpressionMap {
  if (!expressionMap.conditions.tableName) {
    throw new Error('Missing tableName in query conditions')
  }

  if (!expressionMap.conditions.where) {
    throw new Error('Query conditions is missing where clause')
  }

  if (!expressionMap.conditions.operation) {
    throw new Error('Missing operation type in query conditions')
  }

  return expressionMap
}

function addTableName(expressionMap: ExpressionMap): ExpressionMap {
  const { conditions } = expressionMap

  return {
    ...expressionMap,
    expression: {
      ...expressionMap.expression,
      TableName: conditions.tableName,
    },
  }
}

/**
 * Adds a return value for dynamo db. In the future, this will be updated
 * to be an enum
 *
 * @param expressionMap - The current expressionMap
 *
 * @return An updated expression map with return values added to the expression
 * if necessary
 */
function addReturnValues(expressionMap: ExpressionMap): ExpressionMap {
  const { conditions } = expressionMap

  if (!conditions.returnValues) {
    return expressionMap
  }

  return {
    ...expressionMap,
    expression: {
      ...expressionMap.expression,
      ReturnValues: conditions.returnValues,
    },
  }
}

/**
 * Index keys in Dynamo cannot be null or an empty string. When building expressions,
 * we will remove these fields if they are present and do not have a value
 *
 * @param entry - an array containing the key and value from an object
 *
 * @return A boolean used to filter out index fields
 */
export function filterIndexKeys([key, keyValues]: [
  string,
  AttributeValue
]): boolean {
  const indexKeys = process.env.DYNAMO_DB_INDEX_KEYS
    ? process.env.DYNAMO_DB_INDEX_KEYS.split(',')
    : []

  const value = keyValues && keyValues.value

  if (indexKeys.includes(key)) {
    return Boolean(value)
  }

  return true
}
