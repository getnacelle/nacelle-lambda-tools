import { ExpressionMap } from '../models'

/**
 * Creates a key expression for update operations. This expression tells
 * dynamo which fields are the primary keys to use when updating a record
 *
 * @param expressionMap - The current expressionMap
 *
 * @return A modified expressionMap containing the key expression
 */
export function buildUpdateKeyExpression(
  expressionMap: ExpressionMap
): ExpressionMap {
  const { where } = expressionMap

  return {
    ...expressionMap,
    expression: {
      ...expressionMap.expression,
      Key: { [`${where.primary.key}`]: where.primary.value },
    },
  }
}

/**
 * Creates a KeyCondition expression used for scan operations. This expression
 * tells dynamo which fields search for
 *
 * @param expressionMap - The current expressionMap
 *
 * @return A modified expressionMap containing an update expression
 */
export function buildKeyConditionExpression(
  expressionMap: ExpressionMap
): ExpressionMap {
  // Make sure primary key is included and added in all
  if (!expressionMap.conditions.where) {
    throw new Error('Missing primary key field (id) in the where clause')
  }

  const { where } = expressionMap

  return {
    ...expressionMap,
    expression: {
      ...expressionMap.expression,
      KeyConditionExpression: `#${where.primary.key} = :${where.primary.key}`,
    },
  }
}

/**
 * Adds ExclusiveStartKey to the expression if lastEvaluatedKey is provided in
 * the query conditions. This is the key that Dynamo uses for returning paginated
 * results
 *
 * @param expressionMap - The current expressionMap
 *
 * @return A modified expression map contianing the ExclusiveStartKey, or an
 * unmodified expressionMap if lastEvaluatedKey is not present
 */
export function addPaginationKey(expressionMap: ExpressionMap): ExpressionMap {
  if (!expressionMap.conditions.lastEvaluatedKey) {
    return expressionMap
  }

  return {
    ...expressionMap,
    expression: {
      ...expressionMap.expression,
      ExclusiveStartKey: expressionMap.conditions.lastEvaluatedKey,
    },
  }
}
