import flow from 'lodash/fp/flow'
import flatten from 'lodash/flatten'

import { filterFromList } from '../../filters'
import { ExpressionMap, PrimaryKeyValue } from '../models'

const WHERE_FILTERS = ['and', 'or']

/**
 * Processes the where clause of the query conditions and creates the necessary
 * filter fields for scan, update and query operations
 *
 * @param expressionMap - The current expressionMap
 *
 * @return A modified expressionMap containing filter keys in the expression
 */
export const processWhereFilter = flow(
  processQueryWhereFilter,
  processScanWhereFilter
)

/**
 * Builds the FilterExpression field required for scan operations. Note that this currently
 * ONLY works with AND filter types. OR filters will be added in the future
 *
 * @param expressionMap - The current expressionMap
 *
 * @return A modified expression map containing the scan FilterExpression
 */
export function buildFilterExpression(
  expressionMap: ExpressionMap
): ExpressionMap {
  const { where } = expressionMap

  if (where.and.keys.length === 0) {
    // No additional keys to filter
    return expressionMap
  }

  const createFieldMap = (key) => `#${key} = :${key}`
  const filterExpression = where.and.keys.map(createFieldMap).join(' and ')

  return {
    ...expressionMap,
    expression: {
      ...expressionMap.expression,
      FilterExpression: filterExpression,
    },
  }
}

/**
 * Processes the where clause for a scan operation and creates the keys and keyValues
 * needed to create the filter expression
 *
 * @param expressionMap - The current expressionMap
 *
 * @return A modified expression map containing filter keys and keyValues
 */
export function processScanWhereFilter(
  expressionMap: ExpressionMap
): ExpressionMap {
  const { conditions } = expressionMap

  if (conditions.operation !== 'scan') {
    return expressionMap
  }

  const removeWhereKeys = filterFromList(WHERE_FILTERS)
  const keys = Object.keys(conditions.where).filter(removeWhereKeys)
  const keyValues = Object.entries(conditions.where).filter(removeWhereKeys)

  return {
    ...expressionMap,
    where: {
      and: { keys, keyValues },
    },
  }
}

/**
 * Processes the where clause for a query or update operation and creates the keys
 * and keyValues for the primary key and additional filter fields
 *
 * @param expressionMap - The current expressionMap
 *
 * @return A modified expression map containing filter keys and keyValues
 */
export function processQueryWhereFilter(
  expressionMap: ExpressionMap
): ExpressionMap {
  const { conditions } = expressionMap

  if (conditions.operation !== 'query' && conditions.operation !== 'update') {
    return expressionMap
  }

  const entries = Object.entries(conditions.where).filter(
    ([, values]) => values.primary
  )

  const [pk, pkValues]: (string | PrimaryKeyValue)[] = flatten(entries)

  if (!pk || !pkValues) {
    throw new Error('Missing primary key in where clause')
  }

  const removeWhereKeys = filterFromList([...WHERE_FILTERS, <string>pk])
  const keys = Object.keys(conditions.where).filter(removeWhereKeys)
  const keyValues = Object.entries(conditions.where).filter(removeWhereKeys)

  return {
    ...expressionMap,
    where: {
      primary: {
        key: <string>pk,
        value: (pkValues as PrimaryKeyValue).value,
      },
      and: { keys, keyValues },
    },
  }
}
