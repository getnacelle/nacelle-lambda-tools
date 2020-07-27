import { filterFromList } from '../../filters'
import { ExpressionMap } from '../models'

/**
 * Creates a projection expression that tells dynamo which fields to
 * include in the return statement
 *
 * @param expressionMap - The current expressionMap
 *
 * @return A modified expressionMap containing the projection expression
 */
export function buildProjectionExpression(
  expressionMap: ExpressionMap
): ExpressionMap {
  const { conditions, where } = expressionMap

  if (!conditions.fields) {
    return expressionMap
  }

  const existingKeys = [where.primary.key, ...where.and.keys]
  const keysNotInExpression = conditions.fields.filter(
    filterFromList(existingKeys)
  )
  const projection = conditions.fields.map((field) => `#${field}`).join(', ')

  if (keysNotInExpression.length < 1) {
    // No new keys in expression
    return {
      ...expressionMap,
      expression: {
        ...expressionMap.expression,
        ProjectionExpression: projection,
      },
    }
  }

  const attributeNames = keysNotInExpression.reduce(
    (names, key) => ({ ...names, [`#${key}`]: key }),
    {}
  )

  return {
    ...expressionMap,
    expression: {
      ...expressionMap.expression,
      ProjectionExpression: projection,
      ExpressionAttributeNames: {
        ...expressionMap.expression.ExpressionAttributeNames,
        ...attributeNames,
      },
    },
  }
}
