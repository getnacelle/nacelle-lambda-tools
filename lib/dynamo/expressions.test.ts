import { createQueryExpression } from './expressions'
import { QueryConditions, DBOperations } from './models'

describe('Dynamo Expressions', () => {
  describe('createQueryExpression()', () => {
    const userId = 'my-user-id'
    const userEmail = 'bruce@notbatman.com'
    const userRole = 'admin'
    const spaceId = 'my-space-id'

    it('should create mutliple AND expressions when there is more than one property in the where clause', () => {
      const conditions: QueryConditions = {
        where: {
          id: userId,
          email: userEmail,
          role: userRole,
        },
        type: DBOperations.Query,
      }

      const result = createQueryExpression('Users', conditions)
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

    it('should create projection fields from the fields property', () => {
      const conditions = {
        where: {
          id: userId,
        },
        fields: ['id', 'email'],
        update: {
          email: userEmail,
          returnValues: 'ALL_NEW',
        },
        type: DBOperations.Update,
      }

      const result = createQueryExpression('Users', conditions)

      const expectedResult = {
        TableName: 'Users',
        Key: { id: userId },
        ProjectionExpression: '#id, #email',
        ExpressionAttributeNames: { '#email': 'email', '#id': 'id' },
        ExpressionAttributeValues: { ':email': userEmail },
        UpdateExpression: 'SET #email = :email',
        ReturnValues: 'ALL_NEW',
      }

      expect(result).toEqual(expectedResult)
    })

    it('should throw when there is no id (primary key) included in the where clause', () => {
      const conditions: QueryConditions = {
        where: {
          id: null,
          email: 'bruce@notbatman.com',
        },
        type: DBOperations.Query,
      }

      expect(() => createQueryExpression('Users', conditions)).toThrow(
        'Querying the db requires inclusion of the primary key'
      )
    })

    it('should throw when there are no conditions', () => {
      expect(() => createQueryExpression('Users', null)).toThrow(
        'Please include a where clause when querying the db'
      )
    })

    describe('query', () => {
      it('should create a query expression', () => {
        const conditions: QueryConditions = {
          where: { id: userId },
          type: DBOperations.Query,
        }

        const result = createQueryExpression('Users', conditions)
        expect(result).toEqual({
          TableName: 'Users',
          KeyConditionExpression: '#id = :id',
          ExpressionAttributeNames: { '#id': 'id' },
          ExpressionAttributeValues: { ':id': userId },
        })
      })
    })

    describe('scan', () => {
      it('should create a scan expression', () => {
        const conditions: QueryConditions = {
          where: {
            id: userId,
          },
          type: DBOperations.Scan,
        }

        const result = createQueryExpression('Users', conditions)
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
    })

    describe('update', () => {
      beforeEach(() => {
        // TODO: use generic values
        process.env.DYNAMO_DB_INDEX_KEYS = 'indexKeyOne,indexKeyTwo'
      })

      it('should create an update expression when there is a value that is an object', () => {
        const conditions = {
          where: {
            id: userId,
          },
          update: {
            user: { name: 'Bruce', email: userEmail },
            returnValues: 'ALL_NEW',
          },
          type: DBOperations.Update,
        }

        const result = createQueryExpression('Users', conditions)

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
          where: {
            id: userId,
          },
          update: {
            spaces: { id: spaceId, role: userRole, index: 2 },
          },
          type: DBOperations.Update,
        }

        const result = createQueryExpression('Users', conditions)

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

      it('should create an update expression to append list items', () => {
        const conditions = {
          where: {
            id: userId,
          },
          update: {
            spaces: [{ id: spaceId, role: userRole }],
          },
          type: DBOperations.Update,
        }

        const result = createQueryExpression('Users', conditions)

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
          where: {
            id: userId,
          },
          update: {
            indexKeyOne: '',
            indexKeyTwo: null,
            email: userEmail,
            returnValues: 'ALL_NEW',
          },
          type: DBOperations.Update,
        }

        const result = createQueryExpression('Users', conditions)

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

      it('should create an update expression when the value is a primitive (string, number, etc)', () => {
        const conditions = {
          where: {
            id: userId,
          },
          update: {
            email: userEmail,
            returnValues: 'ALL_NEW',
          },
          type: DBOperations.Update,
        }

        const result = createQueryExpression('Users', conditions)

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
          where: {
            id: userId,
          },
          update: {
            email: userEmail,
            domain: 'www.me.com',
            returnValues: 'ALL_NEW',
          },
          type: DBOperations.Update,
        }

        const result = createQueryExpression('Users', conditions)

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
    })

    describe('remove', () => {
      it('should create an update expression to remove an item from a list', () => {
        const conditions = {
          where: {
            id: userId,
          },
          remove: {
            spaces: { index: 3 },
          },
          type: DBOperations.Update,
        }

        const result = createQueryExpression('Users', conditions)

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
          where: {
            id: userId,
          },
          remove: {
            email: null,
          },
          type: DBOperations.Update,
        }

        const result = createQueryExpression('Users', conditions)

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
          where: {
            id: userId,
          },
          update: {
            email: userEmail,
            domain: 'www.me.com',
          },
          remove: {
            spaces: { index: 3 },
          },
          type: DBOperations.Update,
        }

        const result = createQueryExpression('Users', conditions)

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
})
