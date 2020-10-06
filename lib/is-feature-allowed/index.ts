import { DynamoDB } from 'aws-sdk'
import { dynamoTools, DBOperations } from '../dynamo'

const dynamoDb = dynamoTools.init(
  new DynamoDB.DocumentClient({ convertEmptyValues: true })
)

export const isFeatureAllowed = async ({
  featureName,
  spaceId,
  envOverride = false
}: {
  featureName: string,
  spaceId: string,
  envOverride: boolean
}): Promise<boolean> => {
  if (envOverride) return true

  const queryConditions = {
    tableName: 'Spaces',
    where: {
      id: { primary: true, value: spaceId }
    },
    fields: ['featureFlags'],
    operation: DBOperations.Query
  }

  const result = await dynamoDb.query(queryConditions)
  if (result?.Items.length < 1) {
    throw new Error(`Could not find space with id ${spaceId} in database`)
  }

  return result?.Items[0]?.featureFlags.indexOf(featureName) > -1
}