# Nacelle Lambda Tools

A collection of useful functions for building Serverless lambdas.

## What's Included?

- AWS DynamoDB Tools
  - Wraps Dynamo methods and builds query expressions (more info below)
- AWS S3 Tools
  - Utility functions for saving & loading JSON files in S3 buckets
- AWS SES Tools
  - Utility functions for sending emails via SES
- Lambda Logger
- Nacelle Models & Mocks
- Utility Functions for filtering, handling URLs, etc

## Installation

```
npm i @nacelle/lambda-tools -S
```

## Usage

### DynamoTools

```js
import { DynamoDB } from 'aws-sdk'
import { dynamoTools } from '@nacelle/lambda-tools'

export const dynamoDb = dynamoTools.init(
  new DynamoDB.DocumentClient({ convertEmptyValues: true })
)
```

### S3 Tools

```js
import { S3 } from 'aws-sdk'
import { s3Tools } from '@nacelle/lambda-tools'

export const s3 = s3Tools.init(new S3({ apiVersion: '2006-03-01' }))
```

### SES Tools

```js
import { SES } from 'aws-sdk'
import { sesTools } from '@nacelle/lambda-tools'

export const ses = sesTools.init(new SES(), 'Your Team <yourteam@example.com>')
```

### Lambda Logger

Debug logging is enabled, and development mode is enabled in any environment that's not `production` or `test`.

```js
import { logger } from '@nacelle/lambda-tools'

logger.info('Log something')
```

## Querying DynamoDB

Querying DynamoDB requires creation of an object outlining different expressions depending on the type of query and fields being requested. This can be tedious and error prone, so `createQueryExpression()` is provided for convenience.

### Creating Query Conditions

`createQueryExpression` requires 2 arguments -- the name of the table being queried and the query conditions. Query conditions is an object that outlines the type of query you want to make, and the values and columns to filter on. It's (very) loosely based on a similar concept in Sequelize.

```js
const queryCondition = {
  where: {
    id: 'my-id'
  },
  fields?: ['columnOne', 'columnTwo'],
  update?: {
    stringColumn: 'value',
    objectColumn: { x: 5, y: 'seven', index?: 2 },
    arrayColumn: [{ z: 8 }],
    returnValues?: 'ALL_NEW'
  },
  remove?: {
    stringColumn: null,
    objectColumn: { index: 2 },
    returnValues?: 'ALL_NEW'
  },
  type: Update | Query | Scan
}
```

Above is an example of the query condition object with all possible values and variations. Here are definitions for each of the fields:

- _queryCondition.where (required)_: This field is used to determine how to filter the query. Multiple properties and values here are converted to AND statements. Example: `where: { x: 5, y: 7 }` is converted to `where x = 5 AND y = 7`. There is currently not support for `OR` clauses, but it can be added in a future update. Note that for the `Query` type, `id` is required.

- _queryCondition.fields (optional)_: This field is used to filter the fields included in the query result. If this property is included, only fields included will be contained in the query result

- _queryCondition.update (optional)_: This field is used to specify column names and their updated value(s). Note that several types of data value are supported, but each accomplishes a specific task.

If the value is an object and _does_ include an `index` property, it will be used to update a list _in place_. The index should correspond with the item's position in that list. If it does not have an `index` property, it will overwrite the column value in the database with whatever the value is in that object. Null values are acceptable here _as long as they are not part of a primary index key_.

If the value is an array, the value within the list will be appended to the list that is in the database for that column.

`returnValues` is an optional property that allows you to specify what type of response you'd like from Dynamo. Options can be found [here](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_UpdateItem.html#API_UpdateItem_RequestSyntax)

- _queryCondition.remove (optional)_: Similar to `update`, but any value for the column will be removed. If the value is an object with an index property, then it will remove the item at that index position from that column in the db.

`returnValues` is an optional property that allows you to specify what type of response you'd like from Dynamo. Options can be found [here](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_UpdateItem.html#API_UpdateItem_RequestSyntax)

- _queryCondition.type (required)_: The type of query being made -- Update, Query or Scan

There are several examples in `src/db/dynamo/helpers.test.ts` for reference.

### The Dynamo Query Expression Object

Before moving on, it may be beneficial to see the the output of `createQueryExpression` to better understand how a `queryCondition` object relates to the output.

```js
const queryExpression = {
  TableName: 'my-table',
  FilterExpression?: '#email = :email',
  ProjectionExpression?: '#id, #email',
  Key?: { id: 'user-id' },
  KeyConditionExpression?: '#id = :id',
  ExpressionAttributeNames?: { '#email': 'email', '#id': 'id' },
  ExpressionAttributeValues?: { ':email': 'me@example.com', ':id': 'user-id' },
  UpdateExpression?: 'SET #email = :email',
  ReturnValues?: 'ALL_NEW'
}
```

Note that not all of these properties will be present every time and that it is highly dependent on the type of query and values provided in the query conditions.

- _TableName_: The name of the Dyanamo Table being queried
- _FilterExpression_: A string used to determine additional filter fields for dynamo. Think of these as AND filters
- _ProjectionExpression_: The fields to be returned in the query response. Note that these can only be used in Query and Scan operations
- _Key_: The primary key field (this is only used in the Update type)
- _KeyConditionExpression_: The primary key field to filter on (this is only used in the Query type)
- _ExpressionAttributeNames_: Alias values and their associated column names
- _ExpressionAttributeValues_: Column values for the aliased names
- _UpdateExpression_: Any column values that need to be updated
- _ReturnValues_: The type of response

### Examples

#### Query By Id, Email and Role

```js
// input
const queryConditions = {
  where: {
    id: userId,
    email: userEmail,
    role: userRole,
  },
  type: DBOperations.Query,
}

// output
const queryExpression = {
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
```

#### Find By UserId

```js
// input
const queryConditions = {
  where: {
    id: userId,
  },
  type: DBOperations.Scan,
}

// output
const queryExpression = {
  TableName: 'Users',
  FilterExpression: '#id = :id',
  ExpressionAttributeNames: {
    '#id': 'id',
  },
  ExpressionAttributeValues: {
    ':id': userId,
  },
}
```

#### Update User Info

```js
// input
const queryConditions = {
  where: {
    id: userId,
  },
  update: {
    user: { name: 'Bruce', email: userEmail },
    returnValues: 'ALL_NEW',
  },
  type: DBOperations.Update,
}

// output
const queryExpression = {
  TableName: 'Users',
  Key: { id: userId },
  ExpressionAttributeNames: { '#user': 'user' },
  ExpressionAttributeValues: {
    ':user': { name: 'Bruce', email: userEmail },
  },
  UpdateExpression: 'SET #user = :user',
  ReturnValues: 'ALL_NEW',
}
```

#### Update Item In a List

```js
// input
const queryConditions = {
  where: {
    id: userId,
  },
  update: {
    spaces: { id: spaceId, role: userRole, index: 2 },
  },
  type: DBOperations.Update,
}

// output
const queryExpression = {
  TableName: 'Users',
  Key: { id: userId },
  ExpressionAttributeNames: { '#spaces': 'spaces' },
  ExpressionAttributeValues: {
    ':spaces': { id: spaceId, role: userRole },
  },
  UpdateExpression: 'SET #spaces[2] = :spaces',
}
```

#### Append Item to List

```js
// input
const queryConditions = {
  where: {
    id: userId,
  },
  update: {
    spaces: [{ id: spaceId, role: userRole }],
  },
  type: DBOperations.Update,
}

// output
const queryExpression = {
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
```

#### Updating Multiple Values

```js
// input
const queryConditions = {
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

// output
const queryExpression = {
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
```

#### Delete a Value

```js
// input
const queryConditions = {
  where: {
    id: userId,
  },
  remove: {
    email: null,
  },
  type: DBOperations.Update,
}

// output
const queryExpression = {
  TableName: 'Users',
  Key: { id: userId },
  ExpressionAttributeNames: { '#email': 'email' },
  UpdateExpression: 'REMOVE #email',
}
```

#### Delete Item In a List

```js
// input
const queryConditions = {
  where: {
    id: userId,
  },
  remove: {
    spaces: { index: 3 },
  },
  type: DBOperations.Update,
}

// output
const queryExpression = {
  TableName: 'Users',
  Key: { id: userId },
  ExpressionAttributeNames: { '#spaces': 'spaces' },
  UpdateExpression: 'REMOVE #spaces[3]',
}
```

#### Delete and Update in One Query

```js
// input
const queryConditions = {
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

// output
const queryExpression = {
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
  UpdateExpression: 'SET #email = :email, #domain = :domain REMOVE #spaces[3]',
}
```
