# DynamoDB-Toolshack

Official actions to synchronize code from [DynamoDB-Toolbox](https://www.dynamodbtoolbox.com/) and [DynamoDB-Toolshack](https://dynamodb-toolshack.com/).

## Installation

```bash
# npm
npm add dynamodb-toolshack

# yarn
npm add dynamodb-toolshack

# pnpm
pnpm add dynamodb-toolshack
```

> Note that DynamoDB-Toolbox is required as a peer dependency.

## `Synchronizer`

The `Synchronizer` is a DynamoDB-Toolbox Table [Action](https://www.dynamodbtoolbox.com/docs/getting-started/usage#methods-vs-actions) to synchronize a Table and its Entities to DynamoDB-Toolshack:

```ts
import { Synchronizer } from 'dynamodb-toolshack'

await MyTable.build(Synchronizer)
  .entities(MyEntity, AnotherEntity, ...)
  // 👇 AWS Config (required)
  .awsConfig({
    awsAccountId: '398259209128', // AWS AccountId
    awsRegion: 'us-east-1' // AWS Region
  })
  // 👇 Assign an access role (optional)
  .accessRole({
    roleName: 'DynamoDBToolshackAccountAccessRole',
    description: 'Optional role description'
  })
  // 👇 Choose DynamoDB-Toolshack metadata (optional)
  .metadata({
    awsAccountTitle: 'Dev',
    // 👇 https://ui.shadcn.com/colors
    awsAccountColor: 'blue',
    awsAccountDescription: 'Account for development purposes',
    // 👇 https://lucide.dev/icons/
    tableIcon: 'database-zap',
    tableTitle: 'Super Table',
    tableDescription: 'An Awesome Table for development use',
    entities: {
      [MyEntity.name]: {
        // 👇 https://lucide.dev/icons/
        entityIcon: 'cat',
        entityTitle: 'Super Entity',
        entityDescription: 'An Awesome Entity for development use'
      },
      ...
    }
  })
  .sync({
    // 👇 https://app.dynamodb-toolshack.com/api-keys
    apiKey: '<API_KEY>',
    // 👇 Keep only specified entities for the Table (optional, `false` by default)
    deleteUnknownEntities: true,
    // 👇 Override Table instance name (optional)
    tableName: 'my-table-name'
  })
```

> Please read the [Reference](https://dynamodb-toolshack.com/reference) for more details on the DynamoDB-Toolshack API.
