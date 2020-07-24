import * as DynamoModels from './models'

import { omit, filterFromList } from '../filters'

// TODO: In the future, create a validation function to validate the queryConditions
// object. This should reduce some of the conditional branching required here

/**
 * Creates a Dynamo query expression object. For more details on how to use
 * this function, please reference the README and the unit tests.
 *
 * @param tableName - The table to query
 * @param conditions - An object outlining the conditional cases for the
 * query. There are some caveats to using this, so please make sure to read
 * the docs
 *
 * @return An object with dynamo expressions for each type of query
 */
export function createQueryExpression(
  tableName: string,
  conditions: DynamoModels.QueryConditions
): DynamoModels.QueryExpression {
  if (!conditions || !conditions.where) {
    throw new Error('Please include a where clause when querying the db')
  }

  if (conditions.type === 'query' && !conditions.where.id) {
    // Queries require inclusion of the primary key (id)
    throw new Error('Querying the db requires inclusion of the primary key')
  }

  // Creates expression properties that are built upon
  // depending on the type of query
  const rootExpression: DynamoModels.QueryExpression = buildRootExpression(
    tableName,
    conditions
  )

  if (conditions.type === 'update') {
    return buildUpdateOptions(rootExpression, conditions)
  }

  return rootExpression
}

/**
 * Creates finalized expression output for update and remove query types
 *
 * @param baseOptions - The root expression to build upon
 * @param conditions - An object outlining the conditional cases for the
 * query. There are some caveats to using this, so please make sure to read
 * the docs
 *
 * @return An object with dynamo expressions for update and remove queries
 */
function buildUpdateOptions(
  baseOptions: DynamoModels.QueryExpression,
  conditions: DynamoModels.QueryConditions
): DynamoModels.QueryExpression {
  const filterReservedKeys = filterFromList(['returnValues', 'type'])
  const updateKeys: string[] = conditions.update
    ? Object.entries(conditions.update)
        .filter(filterReservedKeys)
        .filter(filterIndexKeys)
        .map(([key]) => key)
    : []
  const removeKeys: string[] = conditions.remove
    ? Object.entries(conditions.remove)
        .filter(filterReservedKeys)
        .filter(filterIndexKeys)
        .map(([key]) => key)
    : []

  if (conditions.update && conditions.remove) {
    const updateAttributeNames = buildAttributeNames(updateKeys)
    const removeAttributeNames = buildAttributeNames(removeKeys)

    const updateAttributeValues = buildAttributeValues(conditions.update)

    const updateUpdateExpression = buildUpdateExpression(
      conditions.update,
      DynamoModels.UpdateType.Set
    )
    const removeUpdateExpression = buildUpdateExpression(
      conditions.remove,
      DynamoModels.UpdateType.Remove
    )

    const returnValues =
      conditions.remove.returnValues || conditions.update.returnValues
        ? {
            ReturnValues:
              conditions.remove.returnValues || conditions.update.returnValues,
          }
        : {}

    return {
      ...baseOptions,
      ExpressionAttributeNames: {
        ...updateAttributeNames,
        ...removeAttributeNames,
      },
      ExpressionAttributeValues: updateAttributeValues,
      UpdateExpression: `${updateUpdateExpression} ${removeUpdateExpression}`,
      ...returnValues,
    }
  }

  const updateType = conditions.remove ? 'remove' : 'update'
  const enumType = conditions.remove
    ? DynamoModels.UpdateType.Remove
    : DynamoModels.UpdateType.Set

  const returnValues = conditions[updateType].returnValues
    ? { ReturnValues: conditions[updateType].returnValues }
    : {}

  const keysToProcess = conditions.remove ? removeKeys : updateKeys

  const attributeValues =
    updateType === 'update'
      ? { ExpressionAttributeValues: buildAttributeValues(conditions.update) }
      : {}

  return {
    ...baseOptions,
    ExpressionAttributeNames: {
      ...baseOptions.ExpressionAttributeNames,
      ...buildAttributeNames(keysToProcess),
    },
    ...attributeValues,
    UpdateExpression: buildUpdateExpression(conditions[updateType], enumType),
    ...returnValues,
  }
}

/**
 * Builds the Dynamo UpdateExpression. This is a string that specifies which
 * the values to be SET or REMOVE(d) from a column in a Dynamo document. This
 * expression is only included in update and remove queries
 *
 * @param attributeValues - An object containing the column names and updated
 * values. For remove queries, these values can be null. Note that if a column
 * is used as a primary key for an index in Dynamo, it cannot be null or an
 * empty string. If the value is an object and contains an index property, then
 * this function will use that index to update a value from a list in-place
 * @param updateType - The type of update being performed - "update" or "remove"
 *
 * @return A string containing update and remove values
 */
function buildUpdateExpression(
  attributeValues: Record<string, unknown>,
  updateType: DynamoModels.UpdateType
): string {
  const expressions = Object.entries(attributeValues)
    .filter(filterFromList(['returnValues', 'id', 'type']))
    .filter(filterIndexKeys)
    .map(([key, value]: [string, DynamoModels.WhereObjectValue]) => {
      if (Array.isArray(value)) {
        return `#${key} = list_append(if_not_exists(#${key}, :emptyList), :${key})`
      }

      if (updateType === 'REMOVE') {
        // Removal fragments don't require a value
        return value && value.index >= 0 ? `#${key}[${value.index}]` : `#${key}`
      }

      return value && value.index >= 0
        ? `#${key}[${value.index}] = :${key}`
        : `#${key} = :${key}`
    })

  return `${updateType} ${expressions.join(', ')}`
}

/**
 * Creates the root expression that all queries build upon
 *
 * @param tableName - The table to query
 * @param conditions - An object outlining the conditional cases for the
 * query. There are some caveats to using this, so please make sure to read
 * the docs
 *
 * @return An object containing as many expression values as possible as
 * a starting point
 */
function buildRootExpression(
  tableName: string,
  conditions: DynamoModels.QueryConditions
): DynamoModels.QueryExpression {
  const operators = ['and', 'or']
  const reservedKeys = ['type', 'update', 'remove', 'fields']
  const rootProperties = Object.keys(conditions.where).filter(
    filterFromList([...operators, ...reservedKeys])
  )

  const initialOptions: DynamoModels.QueryExpression = {
    TableName: tableName,
    ...(conditions.fields && buildProjectionFields(conditions.fields)),
  }

  if (rootProperties.length === 0) {
    // if the root object only has operators & type
    // still return a base object to start from
    return initialOptions
  }

  const attributeKeys = Object.keys(conditions.where)

  switch (conditions.type) {
    case 'query': {
      const hasMultipleFilters =
        attributeKeys.filter(filterFromList([...operators, 'id'])).length > 0

      // If the where clause has multiple properties,
      // create a filter from all properties expect the id
      const filterExpression = hasMultipleFilters
        ? {
            FilterExpression: buildFilterExpression(
              attributeKeys.filter(filterFromList(['id']))
            ),
          }
        : {}

      return {
        ...initialOptions,
        KeyConditionExpression: '#id = :id',
        ExpressionAttributeNames: {
          ...initialOptions.ExpressionAttributeNames,
          ...buildAttributeNames(attributeKeys),
        },
        ExpressionAttributeValues: buildAttributeValues(conditions.where),
        ...filterExpression,
      }
    }

    case 'update': {
      return {
        ...initialOptions,
        Key: { id: conditions.where.id.toString() },
      }
    }

    case 'scan':
    default: {
      return {
        ...initialOptions,
        FilterExpression: buildFilterExpression(attributeKeys),
        ExpressionAttributeNames: {
          ...initialOptions.ExpressionAttributeNames,
          ...buildAttributeNames(attributeKeys),
        },
        ExpressionAttributeValues: buildAttributeValues(conditions.where),
      }
    }
  }
}

/**
 * Builds the Dynamo FilterExpression. This is a string that specifies any
 * additional fields that should be used to filter down the results. This is
 * only used for Query and Scan expressions
 *
 * @param attributeKeys - A list of the keys in the where clause of the
 * query conditions
 *
 * @return A string containing columns to filter the results on
 */
function buildFilterExpression(attributeKeys: string[]): string {
  const operators = ['and', 'or']

  return attributeKeys
    .filter(filterFromList(operators))
    .map((key) => `#${key} = :${key}`)
    .join(' and ')
}

/**
 * Builds the Dynamo ExpressionAttributeNames. This is an object containing
 * aliases that are used in the expression fields and the field names that
 * those aliases correspond with -- example: '#sapces': 'spaces'. '#spaces'
 * is an alias that can be used in other expression strings and objects, while
 * 'spaces' referes to the actual column name. This is done to prevent
 * collisions between Dynamo reserved words and column names in expressions
 *
 * @param attributeKeys - A list of the keys in the where clause of the
 * query conditions
 *
 * @return An object mapping aliases to column names
 */
function buildAttributeNames(
  attributeKeys: string[]
): DynamoModels.ExpressionAttributeNames {
  const operators = ['and', 'or']

  return attributeKeys
    .filter((key) => !operators.includes(key))
    .reduce((attributeNames, fieldName) => {
      if (fieldName.includes('#')) {
        // Projection field names will already include the #
        return { ...attributeNames, [`${fieldName}`]: `${fieldName.substr(1)}` }
      }

      return {
        ...attributeNames,
        [`#${fieldName}`]: fieldName,
      }
    }, {})
}

/**
 * Builds the Dynamo ExpressionAttributeValues. This is an object containing
 * the aliases defined in the ExpressionAttributeNames field and the data
 * values that are being updated.
 *
 * @param attributeValues - An object containing the column names and updated
 * values. For remove queries, these values can be null. Note that if a column
 * is used as a primary key for an index in Dynamo, it cannot be null or an
 * empty string. If the value is an object and contains an index property, then
 * this function will use that index to update a value from a list in-places
 *
 * @return An object mapping aliases to data
 */
function buildAttributeValues(
  attributeValues: DynamoModels.ConditionUpdateValues
): DynamoModels.ExpressionAttributeValues {
  const operators = ['and', 'or']
  const reservedKeys = ['type', 'update', 'remove', 'fields', 'returnValues']

  return Object.entries(attributeValues)
    .filter(filterFromList([...operators, ...reservedKeys]))
    .filter(filterIndexKeys)
    .reduce((attributeValues, [key, value]: [string, unknown]) => {
      const appendToList = Array.isArray(value) ? { ':emptyList': [] } : {}

      return {
        ...attributeValues,
        [`:${key}`]:
          typeof value === 'object'
            ? omit(<Record<string, unknown>>value, ['index'])
            : value,
        ...appendToList,
      }
    }, {})
}

/**
 * Builds the Dynamo ProjectionExpression. This is a string containing the names
 * of the columns that should be included in the result. This function will
 * also create an initial ExpressionAttributeNames value to ensure that any
 * fields listed in the projections are also aliased appropriately
 *
 * @param fields - A list of field names to include in the query response
 *
 * @return An object containing the fields to include in the query result and
 * any column aliases for those fields
 */
function buildProjectionFields(
  fields: string[]
): DynamoModels.ProjectionFields {
  const formattedFields = fields.map((fieldName) => `#${fieldName}`)
  const ProjectionExpression = formattedFields.join(', ')

  return {
    ProjectionExpression,
    ExpressionAttributeNames: buildAttributeNames(
      formattedFields.filter(filterFromList(['id']))
    ),
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
function filterIndexKeys([key, value]: [string, unknown]): boolean {
  const indexKeys = process.env.DYNAMO_DB_INDEX_KEYS
    ? process.env.DYNAMO_DB_INDEX_KEYS.split(',')
    : []

  if (indexKeys.includes(key)) {
    return Boolean(value)
  }

  return true
}
