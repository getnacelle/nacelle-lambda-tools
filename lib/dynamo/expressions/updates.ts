import flow from 'lodash/fp/flow'

import { filterIndexKeys } from './create'
import { filterFromList } from '../../filters'
import { ExpressionMap, AttributeValue } from '../models'

const RESERVED_KEYS = ['type']

/**
 * Processes the update and remove properties of the query conditions
 * and creates the dynamo update expressions for updating and removing data
 *
 * @param expressionMap - The current expressionMap
 *
 * @return A modified expressionMap containing filter keys in the expression
 */
export const buildUpdateExpression = flow(
  processUpdateExpression,
  processRemovalExpression,
  combineUpdateExpressions
)

/**
 * Processes the remove property of the query conditions and creates the keys and
 * keyValues needed to create an update expression
 *
 * @param expressionMap - The current expressionMap
 *
 * @return A modified expressionMap containing remove keys in the expression
 */
export function processRemoveValues(
  expressionMap: ExpressionMap
): ExpressionMap {
  const { conditions } = expressionMap

  if (!conditions.remove) {
    return expressionMap
  }

  const removeReservedKeys = filterFromList(RESERVED_KEYS)
  const keyValues = Object.entries(conditions.remove)
    .filter(removeReservedKeys)
    .filter(filterIndexKeys)
  const keys = keyValues.map(([key]) => key)

  if (conditions.operation === 'update' && keyValues.length < 1) {
    throw new Error('Missing remove properties and values')
  }

  return {
    ...expressionMap,
    remove: {
      keys,
      keyValues,
    },
  }
}

/**
 * Processes the update property of the query conditions and creates the keys and
 * keyValues needed to create an update expression
 *
 * @param expressionMap - The current expressionMap
 *
 * @return A modified expressionMap containing update keys in the expression
 */
export function processUpdateValues(
  expressionMap: ExpressionMap
): ExpressionMap {
  const { conditions } = expressionMap
  const hasUpdateOrREmove = conditions.update || conditions.remove

  if (conditions.operation === 'update' && !hasUpdateOrREmove) {
    throw new Error('Missing update or remove section for an update operation')
  }

  if (!conditions.update) {
    return expressionMap
  }

  const removeReservedKeys = filterFromList(RESERVED_KEYS)
  const keyValues = Object.entries(conditions.update)
    .filter(removeReservedKeys)
    .filter(filterIndexKeys)
  const keys = keyValues.map(([key]) => key)

  if (conditions.operation === 'update' && keyValues.length < 1) {
    throw new Error('Missing update properties and values')
  }

  return {
    ...expressionMap,
    update: {
      keys,
      keyValues,
    },
  }
}

/**
 * Creates an update expression
 *
 * @param expressionMap - The current expressionMap
 *
 * @return A modified expressionMap containing an update expression
 */
export function processUpdateExpression(
  expressionMap: ExpressionMap
): ExpressionMap {
  if (!expressionMap.update) {
    return expressionMap
  }

  const { update } = expressionMap

  const expressions = update.keyValues.map(
    ([key, keyValues]: [string, AttributeValue]) => {
      if (Array.isArray(keyValues.value) && keyValues.append) {
        return `#${key} = list_append(if_not_exists(#${key}, :emptyList), :${key})`
      }

      if (
        keyValues.value &&
        keyValues.value.index &&
        keyValues.value.index >= 0
      ) {
        return `#${key}[${keyValues.value.index}] = :${key}`
      }

      return `#${key} = :${key}`
    }
  )
  const updateExpression = `SET ${expressions.join(', ')}`

  return {
    ...expressionMap,
    updateExpressions: [updateExpression],
  }
}

/**
 * Creates a remove expression
 *
 * @param expressionMap - The current expressionMap
 *
 * @return A modified expressionMap containing a remove expression
 */
export function processRemovalExpression(
  expressionMap: ExpressionMap
): ExpressionMap {
  if (!expressionMap.remove) {
    return expressionMap
  }

  const { remove } = expressionMap

  const expressions = remove.keyValues.map(
    ([key, keyValues]: [string, AttributeValue]) => {
      if (keyValues && keyValues.index >= 0) {
        return `#${key}[${keyValues.index}]`
      }

      return `#${key}`
    }
  )

  const removeExpression = `REMOVE ${expressions.join(', ')}`

  return {
    ...expressionMap,
    updateExpressions: [
      ...(expressionMap.updateExpressions || []),
      removeExpression,
    ],
  }
}

/**
 * Creates a combined update and remove expression, or a single expression if
 * there is only one type of update being made
 *
 * @param expressionMap - The current expressionMap
 *
 * @return A modified expressionMap containing the unified update expression
 */
export function combineUpdateExpressions(
  expressionMap: ExpressionMap
): ExpressionMap {
  if (
    !expressionMap.updateExpressions ||
    expressionMap.updateExpressions.length < 1
  ) {
    throw new Error('Missing update expressions')
  }

  const { updateExpressions } = expressionMap

  const expression =
    updateExpressions.length > 1
      ? updateExpressions.join(' ')
      : updateExpressions[0]

  return {
    ...expressionMap,
    expression: {
      ...expressionMap.expression,
      UpdateExpression: expression,
    },
  }
}
