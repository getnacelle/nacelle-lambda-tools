import flow from 'lodash/fp/flow'

import { ExpressionMap } from '../models'

/**
 * Builds the Attribute Names expression. This expression is used to create
 * aliases for field names used inside the other query expression fields
 *
 * @param expressionMap - The current expressionMap
 *
 * @return A modified expressionMap containing a Attribute Names expression
 */
export const buildExpressionAttributeNames = flow(
  processAttributeNames,
  buildAttributeNames
)

/**
 * Builds the attribute names expression from the processed attributeKeys
 *
 * @param expressionMap - The current expressionMap
 *
 * @return A modified expressionMap containing the AttributeNames expression
 */
export function buildAttributeNames(
  expressionMap: ExpressionMap
): ExpressionMap {
  const { attributeKeys } = expressionMap

  const attributeNames = attributeKeys.reduce(
    (names, key) => ({ ...names, [`#${key}`]: key }),
    {}
  )

  return {
    ...expressionMap,
    expression: {
      ...expressionMap.expression,
      ExpressionAttributeNames: attributeNames,
    },
  }
}

/**
 * Processes the where conditions to create the necessary attribute name. These
 * names are subsequently used to create the attribute names expression
 *
 * @param expressionMap - The current expressionMap
 *
 * @return A modified expressionMap containing the attributeKeys
 */
export function processAttributeNames(
  expressionMap: ExpressionMap
): ExpressionMap {
  const { conditions, where } = expressionMap

  switch (conditions.operation) {
    case 'scan':
      return {
        ...expressionMap,
        attributeKeys: [...where.and.keys],
      }
    case 'update': {
      const updateKeys = expressionMap.update ? expressionMap.update.keys : []
      const removeKeys = expressionMap.remove ? expressionMap.remove.keys : []

      return {
        ...expressionMap,
        attributeKeys: [...updateKeys, ...removeKeys],
      }
    }

    case 'query':
    default:
      return {
        ...expressionMap,
        attributeKeys: [where.primary.key, ...where.and.keys],
      }
  }
}
