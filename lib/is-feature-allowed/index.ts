import { DynamoDB } from 'aws-sdk'
import { dynamoTools, DBOperations } from '../dynamo'
import { Space } from '../models/space'

const dynamoDb = dynamoTools.init(
  new DynamoDB.DocumentClient({ region: 'us-east-1', convertEmptyValues: true })
)

export const isFeatureAllowed = async ({
  featureName,
  spaceId,
  space = null,
  envOverride = false
}: {
  featureName: string,
  spaceId: string,
  space?: Space,
  envOverride?: boolean
}): Promise<boolean> => {
  if (envOverride) return true

  const featureFlags = space ? space.featureFlags : await getFeatureFlags(spaceId)
  return featureFlags?.indexOf(featureName) > -1
}

const getFeatureFlags = async (spaceId: string): Promise<string[]> => {
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
  return result?.Items[0]?.featureFlags
}