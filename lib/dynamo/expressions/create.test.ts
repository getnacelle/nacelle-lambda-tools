import { createExpression } from './create'
import { DBOperations } from '../models'
import { QueryConditions } from '../db'

const userId = 'my-user-id'
const userEmail = 'bruce@notbatman.com'
const userRole = 'admin'
const spaceId = 'my-space-id'

describe('Dynamo Expression Builder', () => {
  it('should throw if the expresison map has no query conditions', () => {
    try {
      const result = createExpression(undefined)
      expect(result).toBeUndefined()
    } catch (err) {
      expect(err.message).toEqual('Misisng query conditions')
    }
  })

  it('should throw if query conditions do not contain a table name', () => {
    const conditions = <QueryConditions>{}

    try {
      const result = createExpression(conditions)
      expect(result).toBeUndefined()
    } catch (err) {
      expect(err.message).toEqual('Missing tableName in query conditions')
    }
  })

  it('should throw if query conditions do not contain a where object', () => {
    const conditions = <QueryConditions>{
      tableName: 'Users',
    }

    try {
      const result = createExpression(conditions)
      expect(result).toBeUndefined()
    } catch (err) {
      expect(err.message).toEqual('Query conditions is missing where clause')
    }
  })

  it('should throw if query conditions do not contain an operation type', () => {
    const conditions = <QueryConditions>{
      tableName: 'Users',
      where: {},
    }

    try {
      const result = createExpression(conditions)
      expect(result).toBeUndefined()
    } catch (err) {
      expect(err.message).toEqual('Missing operation type in query conditions')
    }
  })

  it('should createExpression a projection expression from the fields property with existing and new keys', () => {
    const conditions = {
      tableName: 'Users',
      where: {
        id: { primary: true, value: userId },
      },
      fields: ['id', 'email'],
      operation: DBOperations.Query,
    }

    const result = createExpression(conditions)

    const expectedResult = {
      TableName: 'Users',
      KeyConditionExpression: '#id = :id',
      ProjectionExpression: '#id, #email',
      ExpressionAttributeNames: { '#email': 'email', '#id': 'id' },
      ExpressionAttributeValues: { ':id': userId },
    }

    expect(result).toEqual(expectedResult)
  })

  it('should createExpression a projection expression from the fields property with all existing keys', () => {
    const conditions = {
      tableName: 'Users',
      where: {
        id: { primary: true, value: userId },
      },
      fields: ['id'],
      operation: DBOperations.Query,
    }

    const result = createExpression(conditions)

    const expectedResult = {
      TableName: 'Users',
      KeyConditionExpression: '#id = :id',
      ProjectionExpression: '#id',
      ExpressionAttributeNames: { '#id': 'id' },
      ExpressionAttributeValues: { ':id': userId },
    }

    expect(result).toEqual(expectedResult)
  })

  describe('Query', () => {
    it('should createExpression an expression object for a query with one filter', () => {
      const conditions = {
        tableName: 'Users',
        where: {
          id: { primary: true, value: userId },
        },
        operation: DBOperations.Query,
      }

      const result = createExpression(conditions)
      expect(result).toEqual({
        TableName: 'Users',
        KeyConditionExpression: '#id = :id',
        ExpressionAttributeNames: { '#id': 'id' },
        ExpressionAttributeValues: { ':id': userId },
      })
    })

    it('should createExpression mutliple AND expressions when there is more than one property in the where clause', () => {
      const conditions = {
        tableName: 'Users',
        where: {
          id: { primary: true, value: userId },
          email: { value: userEmail },
          role: { value: userRole },
        },
        operation: DBOperations.Query,
      }

      const result = createExpression(conditions)
      const expectedResult = {
        TableName: 'Users',
        FilterExpression: '#email = :email and #role = :role',
        KeyConditionExpression: '#id = :id',
        ExpressionAttributeNames: {
          '#id': 'id',
          '#email': 'email',
          '#role': 'role',
        },
        ExpressionAttributeValues: {
          ':id': userId,
          ':email': userEmail,
          ':role': userRole,
        },
      }

      expect(result).toEqual(expectedResult)
    })
  })

  describe('Scan', () => {
    it('should createExpression a scan expression', () => {
      const conditions = {
        tableName: 'Users',
        where: {
          id: { value: userId },
        },
        operation: DBOperations.Scan,
      }

      const result = createExpression(conditions)
      const expectedResult = {
        TableName: 'Users',
        FilterExpression: '#id = :id',
        ExpressionAttributeNames: {
          '#id': 'id',
        },
        ExpressionAttributeValues: {
          ':id': userId,
        },
      }

      expect(result).toEqual(expectedResult)
    })

    it('should accept paginated result keys and create the appropriate expression key for paginated results', () => {
      const conditions = {
        tableName: 'Users',
        where: {
          id: { value: userId },
        },
        operation: DBOperations.Scan,
        lastEvaluatedKey: { id: 'abc123' },
      }

      const result = createExpression(conditions)
      const expectedResult = {
        TableName: 'Users',
        FilterExpression: '#id = :id',
        ExpressionAttributeNames: {
          '#id': 'id',
        },
        ExpressionAttributeValues: {
          ':id': userId,
        },
        ExclusiveStartKey: conditions.lastEvaluatedKey,
      }

      expect(result).toEqual(expectedResult)
    })
  })

  describe('Update', () => {
    beforeEach(() => {
      process.env.DYNAMO_DB_INDEX_KEYS = 'indexKeyOne,indexKeyTwo'
    })

    it('should create an update expression when the value is a primitive (string, number, etc)', () => {
      const conditions = {
        tableName: 'Users',
        where: {
          id: { primary: true, value: userId },
        },
        update: {
          email: { value: userEmail },
        },
        returnValues: 'ALL_NEW',
        operation: DBOperations.Update,
      }

      const result = createExpression(conditions)

      const expectedResult = {
        TableName: 'Users',
        Key: { id: userId },
        ExpressionAttributeNames: { '#email': 'email' },
        ExpressionAttributeValues: { ':email': userEmail },
        UpdateExpression: 'SET #email = :email',
        ReturnValues: 'ALL_NEW',
      }

      expect(result).toEqual(expectedResult)
    })

    it('should throw an error if there is no primary key in the where clause', () => {
      const conditions = {
        tableName: 'Users',
        where: {
          id: { value: userId },
        },
        update: {
          user: { name: 'Bruce', email: userEmail },
          returnValues: 'ALL_NEW',
        },
        operation: DBOperations.Update,
      }

      try {
        const result = createExpression(conditions)
        expect(result).toBeUndefined()
      } catch (err) {
        expect(err.message).toEqual('Missing primary key in where clause')
      }
    })

    it('should create an update expression when there is a value that is an object', () => {
      const conditions = {
        tableName: 'Users',
        where: {
          id: { primary: true, value: userId },
        },
        update: {
          user: { value: { name: 'Bruce', email: userEmail } },
        },
        returnValues: 'ALL_NEW',
        operation: DBOperations.Update,
      }

      const result = createExpression(conditions)

      const expectedResult = {
        TableName: 'Users',
        Key: { id: userId },
        ExpressionAttributeNames: { '#user': 'user' },
        ExpressionAttributeValues: {
          ':user': { name: 'Bruce', email: userEmail },
        },
        UpdateExpression: 'SET #user = :user',
        ReturnValues: 'ALL_NEW',
      }

      expect(result).toEqual(expectedResult)
    })

    it('should create an update expression to edit a list item in place', () => {
      const conditions = {
        tableName: 'Users',
        where: {
          id: { primary: true, value: userId },
        },
        update: {
          spaces: { value: { id: spaceId, role: userRole, index: 2 } },
        },
        operation: DBOperations.Update,
      }

      const result = createExpression(conditions)

      const expectedResult = {
        TableName: 'Users',
        Key: { id: userId },
        ExpressionAttributeNames: { '#spaces': 'spaces' },
        ExpressionAttributeValues: {
          ':spaces': { id: spaceId, role: userRole },
        },
        UpdateExpression: 'SET #spaces[2] = :spaces',
      }

      expect(result).toEqual(expectedResult)
    })

    it('should create an update expression to edit the first item in a list if index is 0', () => {
      const conditions = {
        tableName: 'Users',
        where: {
          id: { primary: true, value: userId },
        },
        update: {
          spaces: { value: { id: spaceId, role: userRole, index: 0 } },
        },
        operation: DBOperations.Update,
      }

      const result = createExpression(conditions)

      const expectedResult = {
        TableName: 'Users',
        Key: { id: userId },
        ExpressionAttributeNames: { '#spaces': 'spaces' },
        ExpressionAttributeValues: {
          ':spaces': { id: spaceId, role: userRole },
        },
        UpdateExpression: 'SET #spaces[0] = :spaces',
      }

      expect(result).toEqual(expectedResult)
    })

    it('should create an update expression to append list items', () => {
      const conditions = {
        tableName: 'Users',
        where: {
          id: { primary: true, value: userId },
        },
        update: {
          spaces: { append: true, value: [{ id: spaceId, role: userRole }] },
        },
        operation: DBOperations.Update,
      }

      const result = createExpression(conditions)

      const expectedResult = {
        TableName: 'Users',
        Key: { id: userId },
        ExpressionAttributeNames: { '#spaces': 'spaces' },
        ExpressionAttributeValues: {
          ':emptyList': [],
          ':spaces': [{ id: spaceId, role: userRole }],
        },
        UpdateExpression:
          'SET #spaces = list_append(if_not_exists(#spaces, :emptyList), :spaces)',
      }

      expect(result).toEqual(expectedResult)
    })

    it('should filter out index keys if they do not have a value', () => {
      const conditions = {
        tableName: 'Users',
        where: {
          id: { primary: true, value: userId },
        },
        update: {
          indexKeyOne: '',
          indexKeyTwo: null,
          email: { value: userEmail },
        },
        returnValues: 'ALL_NEW',
        operation: DBOperations.Update,
      }

      const result = createExpression(conditions)

      const expectedResult = {
        TableName: 'Users',
        Key: { id: userId },
        ExpressionAttributeNames: { '#email': 'email' },
        ExpressionAttributeValues: { ':email': userEmail },
        UpdateExpression: 'SET #email = :email',
        ReturnValues: 'ALL_NEW',
      }

      expect(result).toEqual(expectedResult)
    })

    it('should create multiple SET conditions when there are multiple values defined', () => {
      const conditions = {
        tableName: 'Users',
        where: {
          id: { primary: true, value: userId },
        },
        update: {
          email: { value: userEmail },
          domain: { value: 'www.me.com' },
        },
        returnValues: 'ALL_NEW',
        operation: DBOperations.Update,
      }

      const result = createExpression(conditions)

      const expectedResult = {
        TableName: 'Users',
        Key: { id: userId },
        ExpressionAttributeNames: { '#email': 'email', '#domain': 'domain' },
        ExpressionAttributeValues: {
          ':email': userEmail,
          ':domain': 'www.me.com',
        },
        UpdateExpression: 'SET #email = :email, #domain = :domain',
        ReturnValues: 'ALL_NEW',
      }

      expect(result).toEqual(expectedResult)
    })

    it('should create an expression to overwrite an array', () => {
      const conditions = {
        tableName: 'Users',
        where: {
          id: { primary: true, value: userId },
        },
        update: {
          spaces: { value: [{ id: spaceId, role: userRole }] },
        },
        operation: DBOperations.Update,
      }

      const result = createExpression(conditions)

      const expectedResult = {
        TableName: 'Users',
        Key: { id: userId },
        ExpressionAttributeNames: { '#spaces': 'spaces' },
        ExpressionAttributeValues: {
          ':spaces': [{ id: spaceId, role: userRole }],
        },
        UpdateExpression: 'SET #spaces = :spaces',
      }

      expect(result).toEqual(expectedResult)
    })

    it('should create an update expression to remove an item from a list', () => {
      const conditions = {
        tableName: 'Users',
        where: {
          id: { primary: true, value: userId },
        },
        remove: {
          spaces: { index: 3 },
        },
        operation: DBOperations.Update,
      }

      const result = createExpression(conditions)

      const expectedResult = {
        TableName: 'Users',
        Key: { id: userId },
        ExpressionAttributeNames: { '#spaces': 'spaces' },
        UpdateExpression: 'REMOVE #spaces[3]',
      }

      expect(result).toEqual(expectedResult)
    })

    it('should create an update expression to remove a value', () => {
      const conditions = {
        tableName: 'Users',
        where: {
          id: { primary: true, value: userId },
        },
        remove: {
          email: null,
        },
        operation: DBOperations.Update,
      }

      const result = createExpression(conditions)

      const expectedResult = {
        TableName: 'Users',
        Key: { id: userId },
        ExpressionAttributeNames: { '#email': 'email' },
        UpdateExpression: 'REMOVE #email',
      }

      expect(result).toEqual(expectedResult)
    })

    it('should handle removal & updates in the same request', () => {
      const conditions = {
        tableName: 'Users',
        where: {
          id: { primary: true, value: userId },
        },
        update: {
          email: { value: userEmail },
          domain: { value: 'www.me.com' },
        },
        remove: {
          spaces: { index: 3 },
        },
        operation: DBOperations.Update,
      }

      const result = createExpression(conditions)

      const expectedResult = {
        TableName: 'Users',
        Key: { id: userId },
        ExpressionAttributeNames: {
          '#spaces': 'spaces',
          '#email': 'email',
          '#domain': 'domain',
        },
        ExpressionAttributeValues: {
          ':email': userEmail,
          ':domain': 'www.me.com',
        },
        UpdateExpression:
          'SET #email = :email, #domain = :domain REMOVE #spaces[3]',
      }

      expect(result).toEqual(expectedResult)
    })
  })
})
