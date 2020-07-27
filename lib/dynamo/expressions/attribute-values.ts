import flow from 'lodash/fp/flow'

import { omit } from '../../filters'
import { filterIndexKeys } from './create'
import { ExpressionMap, AttributeValue } from '../models'

/**
 * Builds the Attribute Values expression. This expression is used by dynamo
 * to specify the values used within the remainder of the query
 *
 * @param expressionMap - The current expressionMap
 *
 * @return A modified expressionMap containing a Attribute Values expression
 */
export const buildExpressionAttributeValues = flow(
  processAttributeValues,
  buildAttributeValues
)

/**
 * Processes the where conditions to create the necessary attribute values. These
 * values are subsequently used to create the attribute values expression
 *
 * @param expressionMap - The current expressionMap
 *
 * @return A modified expressionMap containing the attributeValues
 */
export function processAttributeValues(
  expressionMap: ExpressionMap
): ExpressionMap {
  const { conditions, where } = expressionMap

  switch (conditions.operation) {
    case 'scan':
      return {
        ...expressionMap,
        attributeValues: [...where.and.keyValues],
      }
    case 'update': {
      if (conditions.remove && !conditions.update) {
        return expressionMap
      }

      return {
        ...expressionMap,
        attributeValues: [
          ...expressionMap.update.keyValues.filter(filterIndexKeys),
        ],
      }
    }

    case 'query':
    default:
      return {
        ...expressionMap,
        attributeValues: [
          [where.primary.key, { value: where.primary.value }],
          ...where.and.keyValues,
        ],
      }
  }
}

/**
 * Builds the attribute values expression from the processed attributeValues
 *
 * @param expressionMap - The current expressionMap
 *
 * @return A modified expressionMap containing the AttributeValues expression
 */
export function buildAttributeValues(
  expressionMap: ExpressionMap
): ExpressionMap {
  if (expressionMap.conditions.remove && !expressionMap.attributeValues) {
    return expressionMap
  }

  const { attributeValues } = expressionMap

  const expressionValues = attributeValues.reduce(
    (values, [key, keyValues]: [string, AttributeValue]) => {
      if (keyValues.index && !keyValues.value) {
        throw new Error(`Missing value property for key: ${key}`)
      }

      const value =
        typeof keyValues.value === 'object'
          ? omit(keyValues.value, ['index'])
          : keyValues.value

      const newValue = { ...values, [`:${key}`]: value }

      if (Array.isArray(keyValues.value) && keyValues.append) {
        return { ...values, ...newValue, ':emptyList': [] }
      }

      return newValue
    },
    {}
  )

  return {
    ...expressionMap,
    expression: {
      ...expressionMap.expression,
      ExpressionAttributeValues: expressionValues,
    },
  }
}
